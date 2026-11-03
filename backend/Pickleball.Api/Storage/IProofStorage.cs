using Microsoft.AspNetCore.Http;

namespace Pickleball.Api.Storage;

public sealed record StoredProof(string Key, string ContentType);
public sealed record ProofContent(byte[] Bytes, string ContentType, bool SafeInline);

public interface IProofStorage
{
    Task<StoredProof> SaveAsync(IFormFile file, CancellationToken ct);
    Task<ProofContent> ReadAsync(string key, CancellationToken ct);
    Task DeleteAsync(string key, CancellationToken ct);
}
