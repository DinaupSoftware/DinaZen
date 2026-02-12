using Dinaup.CultureService;
using DinaZen.Components.WindowManager;
using DinaZen.Services;

namespace Microsoft.Extensions.DependencyInjection;

public static class DinaZenServiceCollectionExtensions
{
    /// <summary>
    /// Registra todos los servicios requeridos por DinaZen.
    /// No incluye Radzen (AddRadzenComponents) — debe registrarse por separado.
    /// </summary>
    public static IServiceCollection AddDinaZen(this IServiceCollection services)
    {
        services.AddHttpContextAccessor();
        services.AddHttpClient();
        services.AddScoped<ICultureService, CultureService>();
        services.AddScoped<WindowManagerService>();
        services.AddScoped<DinaZenInterceptorService>();
        return services;
    }
}
