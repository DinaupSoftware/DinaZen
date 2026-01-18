using Radzen;
using DinaZenDinaupCom.Components;

var builder = WebApplication.CreateBuilder(args);

// Blazor Server clásico
builder.Services.AddRazorPages();
builder.Services.AddServerSideBlazor();

// Radzen
builder.Services.AddRadzenComponents();

// DinaZen requeriments
builder.Services.AddHttpContextAccessor();
builder.Services.AddHttpClient();
builder.Services.AddScoped<Dinaup.CultureService.ICultureService, Dinaup.CultureService.CultureService>();

var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRouting();

app.MapBlazorHub();
app.MapFallbackToPage("/_Host");

app.Run();
