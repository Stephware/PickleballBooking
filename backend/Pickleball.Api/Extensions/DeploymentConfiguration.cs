using System.Net;
using System.Text;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.HttpOverrides;

namespace Pickleball.Api.Extensions;

public static class DeploymentConfiguration
{
    public static void AddDeploymentConfiguration(this WebApplicationBuilder builder)
    {
        var config = builder.Configuration;
        if (builder.Environment.IsProduction()) ValidateProduction(config);

        var keys = config["DataProtection:Directory"];
        if (!string.IsNullOrWhiteSpace(keys))
        {
            RequirePrivatePath(keys, "DataProtection:Directory");
            builder.Services.AddDataProtection()
                .SetApplicationName("PickleballBooking")
                .PersistKeysToFileSystem(new DirectoryInfo(keys));
        }

        var proxies = config.GetSection("ReverseProxy:KnownProxies").Get<string[]>() ?? [];
        if (proxies.Length == 0) return;
        var addresses = proxies.Select(IPAddress.Parse).ToArray();
        builder.Services.Configure<ForwardedHeadersOptions>(options =>
        {
            options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
            options.ForwardLimit = 1;
            options.KnownIPNetworks.Clear();
            options.KnownProxies.Clear();
            foreach (var address in addresses) options.KnownProxies.Add(address);
        });
    }

    public static void ValidateProduction(IConfiguration config)
    {
        if (string.IsNullOrWhiteSpace(config.GetConnectionString("Pickleball")))
            throw new InvalidOperationException("Production requires ConnectionStrings:Pickleball.");
        if (Encoding.UTF8.GetByteCount(config["Booking:SigningKey"] ?? "") < 32)
            throw new InvalidOperationException("Production requires a persistent Booking:SigningKey of at least 32 bytes.");
        RequirePrivatePath(config["ProofStorage:Directory"], "ProofStorage:Directory");
        RequirePrivatePath(config["DataProtection:Directory"], "DataProtection:Directory");
        if (Path.GetFullPath(config["ProofStorage:Directory"]!) ==
            Path.GetFullPath(config["DataProtection:Directory"]!))
            throw new InvalidOperationException("Proof storage and authentication keys require separate directories.");
        var hosts = config["AllowedHosts"]?.Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        if (hosts is null || hosts.Length == 0 || hosts.Any(h => h.Contains('*')))
            throw new InvalidOperationException("Production requires explicit AllowedHosts.");
        var origins = config.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
        if (origins.Any(origin => !Uri.TryCreate(origin, UriKind.Absolute, out var uri) ||
            uri.Scheme != "https" || uri.AbsolutePath != "/" || !string.IsNullOrEmpty(uri.Query)))
            throw new InvalidOperationException("Production CORS origins must be exact HTTPS origins.");
    }

    private static void RequirePrivatePath(string? path, string setting)
    {
        if (string.IsNullOrWhiteSpace(path) || !Path.IsPathFullyQualified(path) ||
            Path.GetFullPath(path) == Path.GetPathRoot(path) ||
            path.Split(Path.DirectorySeparatorChar).Any(p => p.Equals("wwwroot", StringComparison.OrdinalIgnoreCase)))
            throw new InvalidOperationException($"{setting} requires an absolute private persistent directory outside wwwroot.");
    }
}
