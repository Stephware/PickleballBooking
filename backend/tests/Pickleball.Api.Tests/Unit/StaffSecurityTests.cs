using Pickleball.Api.Security;
using Xunit;

namespace Pickleball.Api.Tests.Unit;

public sealed class StaffSecurityTests
{
    [Fact]
    public void PasswordReset_ChangesCookieFingerprint()
    {
        var oldValue = StaffSecurityFingerprint.FromHash("salted-hash-version-1");
        var newValue = StaffSecurityFingerprint.FromHash("salted-hash-version-2");
        Assert.NotEqual(oldValue, newValue);
        Assert.Equal(oldValue, StaffSecurityFingerprint.FromHash("salted-hash-version-1"));
    }

    [Fact]
    public void Roles_AreDistinctAndIncludeManager()
    {
        Assert.NotEqual(StaffRoles.Owner, StaffRoles.Manager);
        Assert.NotEqual(StaffRoles.Staff, StaffRoles.Manager);
        Assert.Contains("MANAGER", StaffRoles.Management);
        Assert.Contains("STAFF", StaffRoles.AnyStaff);
    }
}
