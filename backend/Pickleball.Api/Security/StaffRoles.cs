namespace Pickleball.Api.Security;

public static class StaffRoles
{
    public const string Owner = "OWNER";
    public const string Manager = "MANAGER";
    public const string Staff = "STAFF";
    public const string Management = Owner + "," + Manager;
    public const string AnyStaff = Owner + "," + Manager + "," + Staff;
}
