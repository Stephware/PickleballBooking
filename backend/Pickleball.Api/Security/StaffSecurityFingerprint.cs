using System.Security.Cryptography;
using System.Text;

namespace Pickleball.Api.Security;

/// <summary>
/// Fingerprint of stored password hash inside the signed auth cookie. Password
/// resets invalidate older cookies without storing extra session tables.
/// </summary>
public static class StaffSecurityFingerprint
{
    public static string FromHash(string hash) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(hash)));
}
