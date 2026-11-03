using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;
using Pickleball.Api.Data;
using Pickleball.Api.Models.Entities;
using Xunit;

namespace Pickleball.Api.Tests.Integration;

public sealed class StaffSessionTests
{
    [Fact]
    public async Task StaffCookie_ExpiresAfterEightHoursDespiteRecentActivity()
    {
        await using var fixture = await SessionFixture.CreateAsync();
        var ct = TestContext.Current.CancellationToken;
        using var client = await fixture.LoginAsync();
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/v1/admin/auth/me", ct)).StatusCode);

        fixture.Clock.Advance(TimeSpan.FromHours(7));
        var active = await client.GetAsync("/api/v1/admin/auth/me", ct);
        Assert.Equal(HttpStatusCode.OK, active.StatusCode);
        Assert.False(active.Headers.TryGetValues("Set-Cookie", out var refreshed) &&
            refreshed.Any(cookie => cookie.StartsWith("pickleball.staff=")));

        fixture.Clock.Advance(TimeSpan.FromHours(1) + TimeSpan.FromSeconds(1));
        Assert.Equal(HttpStatusCode.Unauthorized,
            (await client.GetAsync("/api/v1/admin/auth/me", ct)).StatusCode);
    }

    [Fact]
    public async Task PasswordChange_RequiresCsrfAndInvalidatesOtherBrowserCookies()
    {
        await using var fixture = await SessionFixture.CreateAsync();
        var ct = TestContext.Current.CancellationToken;
        using var firstBrowser = await fixture.LoginAsync();
        using var secondBrowser = await fixture.LoginAsync();
        var change = new { currentPassword = fixture.Password, newPassword = Guid.NewGuid().ToString("N") };
        Assert.Equal(HttpStatusCode.OK,
            (await secondBrowser.GetAsync("/api/v1/admin/auth/me", ct)).StatusCode);

        var missingCsrf = await firstBrowser.PostAsJsonAsync("/api/v1/admin/auth/change-password", change, ct);
        Assert.Equal(HttpStatusCode.BadRequest, missingCsrf.StatusCode);

        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/admin/auth/change-password")
        {
            Content = JsonContent.Create(change)
        };
        request.Headers.Add("X-CSRF-TOKEN", await SessionFixture.CsrfAsync(firstBrowser));
        Assert.Equal(HttpStatusCode.NoContent, (await firstBrowser.SendAsync(request, ct)).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized,
            (await secondBrowser.GetAsync("/api/v1/admin/auth/me", ct)).StatusCode);
    }

    private sealed class SessionFixture : IAsyncDisposable
    {
        public required WebApplicationFactory<Program> App { get; init; }
        public required PickleballDbContext Db { get; init; }
        public required StaffUser Staff { get; init; }
        public required string Password { get; init; }
        public required SessionClock Clock { get; init; }

        public static async Task<SessionFixture> CreateAsync()
        {
            var connection = Environment.GetEnvironmentVariable("PICKLEBALL_TEST_CONNECTION_STRING");
            if (string.IsNullOrWhiteSpace(connection) ||
                Environment.GetEnvironmentVariable("PICKLEBALL_TEST_MUTATIONS_ENABLED") != "1")
                Assert.Skip("Requires an explicitly enabled disposable PostgreSQL test database.");
            Assert.EndsWith("_test", new NpgsqlConnectionStringBuilder(connection).Database);
            var db = new PickleballDbContext(new DbContextOptionsBuilder<PickleballDbContext>()
                .UseNpgsql(connection).Options);
            var password = Guid.NewGuid().ToString("N");
            var staff = new StaffUser { FullName = "Session test", Role = "MANAGER", IsActive = true,
                Email = Guid.NewGuid().ToString("N") + "@example.test" };
            staff.PasswordHash = new PasswordHasher<StaffUser>().HashPassword(staff, password);
            db.StaffUsers.Add(staff);
            await db.SaveChangesAsync(TestContext.Current.CancellationToken);
            var clock = new SessionClock();
            var app = new IsolatedApiFactory().WithWebHostBuilder(web =>
            {
                web.UseEnvironment("Development");
                web.ConfigureAppConfiguration((_, config) => config.AddInMemoryCollection(
                    new Dictionary<string, string?> { ["ConnectionStrings:Pickleball"] = connection }));
                web.ConfigureTestServices(services =>
                {
                    services.AddDbContext<PickleballDbContext>(options => options.UseNpgsql(connection));
                    services.PostConfigure<CookieAuthenticationOptions>(
                        CookieAuthenticationDefaults.AuthenticationScheme, options => options.TimeProvider = clock);
                });
            });
            return new() { App = app, Db = db, Staff = staff, Password = password, Clock = clock };
        }

        public async Task<HttpClient> LoginAsync()
        {
            var ct = TestContext.Current.CancellationToken;
            var client = App.CreateClient(new() { AllowAutoRedirect = false });
            using var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/admin/auth/login")
            {
                Content = JsonContent.Create(new { email = Staff.Email, password = Password })
            };
            request.Headers.Add("X-CSRF-TOKEN", await CsrfAsync(client));
            Assert.Equal(HttpStatusCode.OK, (await client.SendAsync(request, ct)).StatusCode);
            return client;
        }

        public static async Task<string> CsrfAsync(HttpClient client)
        {
            var response = await client.GetFromJsonAsync<CsrfResponse>(
                "/api/v1/admin/auth/csrf", TestContext.Current.CancellationToken);
            Assert.NotNull(response);
            return response.Token;
        }

        public async ValueTask DisposeAsync()
        {
            await App.DisposeAsync();
            await Db.StaffUsers.Where(s => s.Id == Staff.Id).ExecuteDeleteAsync(CancellationToken.None);
            await Db.DisposeAsync();
        }

        private sealed record CsrfResponse(string Token);
    }

    private sealed class SessionClock : TimeProvider
    {
        private DateTimeOffset now = DateTimeOffset.UtcNow;
        public override DateTimeOffset GetUtcNow() => now;
        public void Advance(TimeSpan duration) => now += duration;
    }
}
