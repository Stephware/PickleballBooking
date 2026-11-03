using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Pickleball.Api.Storage;
using Xunit;

namespace Pickleball.Api.Tests.Unit;

public sealed class LocalProofStorageTests
{
    [Fact]
    public async Task PngMagic_IsStoredPrivatelyAndCanBePreviewed()
    {
        var root = Path.Combine(Path.GetTempPath(), "pb-proof-test-" + Guid.NewGuid().ToString("N"));
        try
        {
            var storage = Create(root);
            var bytes = new byte[] { 137, 80, 78, 71, 13, 10, 26, 10, 1, 2, 3 };
            using var stream = new MemoryStream(bytes);
            IFormFile upload = new FormFile(stream, 0, bytes.Length, "proof", "malicious-name.pdf")
            {
                Headers = new HeaderDictionary(),
                ContentType = "application/pdf"
            };
            var saved = await storage.SaveAsync(upload, CancellationToken.None);
            Assert.EndsWith(".png", saved.Key);
            Assert.Equal("image/png", saved.ContentType);
            Assert.DoesNotContain("malicious", saved.Key);

            var loaded = await storage.ReadAsync(saved.Key, CancellationToken.None);
            Assert.True(loaded.SafeInline);
            Assert.Equal("image/png", loaded.ContentType);
            Assert.Equal(bytes, loaded.Bytes);

            await storage.DeleteAsync(saved.Key, CancellationToken.None);
            await Assert.ThrowsAsync<FileNotFoundException>(() =>
                storage.ReadAsync(saved.Key, CancellationToken.None));
        }
        finally
        {
            if (Directory.Exists(root)) Directory.Delete(root, recursive: true);
        }
    }

    [Fact]
    public async Task InvalidFileHeader_IsRejected()
    {
        var root = Path.Combine(Path.GetTempPath(), "pb-proof-test-" + Guid.NewGuid().ToString("N"));
        try
        {
            var storage = Create(root);
            using var stream = new MemoryStream("not an image"u8.ToArray());
            IFormFile upload = new FormFile(stream, 0, stream.Length, "proof", "bad.png")
            {
                Headers = new HeaderDictionary(),
                ContentType = "image/png"
            };
            await Assert.ThrowsAsync<ArgumentException>(() =>
                storage.SaveAsync(upload, CancellationToken.None));
            Assert.False(Directory.Exists(root));
        }
        finally
        {
            if (Directory.Exists(root)) Directory.Delete(root, recursive: true);
        }
    }

    [Fact]
    public async Task TraversalKey_IsRejected()
    {
        var storage = Create(Path.Combine(Path.GetTempPath(), "pb-proof-test"));
        await Assert.ThrowsAsync<FileNotFoundException>(() =>
            storage.ReadAsync("../../etc/passwd", CancellationToken.None));
    }

    [Fact]
    public async Task RelativeStoragePath_IsRejected()
    {
        var storage = Create("private-uploads");
        using var stream = new MemoryStream(new byte[] { 137, 80, 78, 71, 13, 10, 26, 10 });
        IFormFile upload = new FormFile(stream, 0, stream.Length, "proof", "a.png")
        {
            Headers = new HeaderDictionary(), ContentType = "image/png"
        };
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            storage.SaveAsync(upload, CancellationToken.None));
    }

    private static LocalProofStorage Create(string path) =>
        new(new ConfigurationBuilder().AddInMemoryCollection(
            new Dictionary<string, string?> { ["ProofStorage:Directory"] = path }).Build());
}
