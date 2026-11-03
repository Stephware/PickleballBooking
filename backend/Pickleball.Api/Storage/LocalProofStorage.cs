using System.Text.RegularExpressions;

namespace Pickleball.Api.Storage;

/// <summary>Private durable storage outside wwwroot. No static-file routes.</summary>
public sealed class LocalProofStorage(IConfiguration config) : IProofStorage
{
    public const int MaxBytes = 5 * 1024 * 1024;
    private static readonly Regex SafeName = new(
        @"^[a-f0-9]{32}\.(jpg|png|webp|pdf)$",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private string Root()
    {
        var root = config["ProofStorage:Directory"];
        if (string.IsNullOrWhiteSpace(root) || !Path.IsPathFullyQualified(root))
            throw new InvalidOperationException(
                "ProofStorage:Directory must be a durable absolute path outside the app webroot.");
        var full = Path.GetFullPath(root);
        if (full.Split(Path.DirectorySeparatorChar).Any(p => p.Equals("wwwroot",
            StringComparison.OrdinalIgnoreCase)))
            throw new InvalidOperationException("Payment proofs cannot be stored under wwwroot.");
        Directory.CreateDirectory(full);
        return full;
    }

    public async Task<StoredProof> SaveAsync(IFormFile file, CancellationToken ct)
    {
        if (file.Length is <= 0 or > MaxBytes)
            throw new ArgumentException("Proof must be between 1 byte and 5 MB.");

        await using var incoming = file.OpenReadStream();
        using var buffer = new MemoryStream();
        var data = new byte[81920];
        int count;
        while ((count = await incoming.ReadAsync(data.AsMemory(), ct)) > 0)
        {
            if (buffer.Length + count > MaxBytes)
                throw new ArgumentException("Proof exceeds 5 MB.");
            await buffer.WriteAsync(data.AsMemory(0, count), ct);
        }

        var bytes = buffer.ToArray();
        var type = Detect(bytes) ??
            throw new ArgumentException("Proof must be a PNG, JPEG, WebP or PDF file.");
        var key = Guid.NewGuid().ToString("N") + type.Ext;
        var path = Path.Combine(Root(), key);
        try
        {
            await using (var output = new FileStream(path, FileMode.CreateNew,
                FileAccess.Write, FileShare.None, 81920, useAsync: true))
                await output.WriteAsync(bytes, ct);
        }
        catch
        {
            // A cancelled/failed write must not strand an incomplete private file.
            try { File.Delete(path); } catch { }
            throw;
        }
        return new(key, type.Mime);
    }

    public async Task<ProofContent> ReadAsync(string key, CancellationToken ct)
    {
        if (!SafeName.IsMatch(key))
            throw new FileNotFoundException("Proof not found.");
        var path = Path.Combine(Root(), key);
        if (!File.Exists(path)) throw new FileNotFoundException("Proof not found.");
        var info = new FileInfo(path);
        if (info.Length > MaxBytes)
            throw new InvalidDataException("Proof exceeds storage limit.");
        var bytes = await File.ReadAllBytesAsync(path, ct);
        var detected = Detect(bytes);
        if (detected is null || !key.EndsWith(detected.Value.Ext, StringComparison.Ordinal))
            throw new InvalidDataException("Proof content is invalid.");
        return new(bytes, detected.Value.Mime, detected.Value.Ext != ".pdf");
    }

    public Task DeleteAsync(string key, CancellationToken ct)
    {
        if (!SafeName.IsMatch(key)) return Task.CompletedTask;
        File.Delete(Path.Combine(Root(), key));
        return Task.CompletedTask;
    }

    private static (string Ext, string Mime)? Detect(ReadOnlySpan<byte> b)
    {
        if (b.Length >= 8 && b[..8].SequenceEqual(new byte[] {137,80,78,71,13,10,26,10}))
            return (".png", "image/png");
        if (b.Length >= 3 && b[0] == 0xff && b[1] == 0xd8 && b[2] == 0xff)
            return (".jpg", "image/jpeg");
        if (b.Length >= 12 && b[..4].SequenceEqual("RIFF"u8) &&
            b.Slice(8,4).SequenceEqual("WEBP"u8))
            return (".webp", "image/webp");
        if (b.Length >= 5 && b[..5].SequenceEqual("%PDF-"u8))
            return (".pdf", "application/pdf");
        return null;
    }
}
