# DinaZen

Blazor component library built on top of Radzen Blazor Components.

**[Live Demo](https://dinazen.dinaup.com)** | **[NuGet Package](https://www.nuget.org/packages/DinaZen)**

> **Beta** - An open source project by [Dinaup](https://dinaup.com) supporting the community. Contributions welcome!

## Installation

```bash
dotnet add package DinaZen
```

## Quick Start

### 1. Add to `_Imports.razor`

```csharp
@using DinaZen.Components
```

### 2. Register services in `Program.cs`

```csharp
builder.Services.AddHttpContextAccessor();
builder.Services.AddHttpClient();
builder.Services.AddScoped<Dinaup.CultureService.ICultureService,
    Dinaup.CultureService.CultureService>();
```

### 3. Add CSS and JS in `_Host.cshtml`

```html
<!-- In <head> -->
@using DinaZen.Components
@{
    var v = typeof(CardTitle).Assembly.GetName().Version;
}
<link rel="stylesheet" href="@($"/_content/DinaZen/dinazen.css?v={v}")" />
<link rel="stylesheet" href="@($"/_content/DinaZen/highlight.min.css?v={v}")" />

<!-- Before </body> -->
<script src="@($"/_content/DinaZen/highlight.min.js?v={v}")"></script>
<script type="module" src="@($"/_content/DinaZen/dotlottie-player.mjs?v={v}")"></script>
<script src="@($"/_content/DinaZen/dinazen.js?v={v}")"></script>
```

## Components

**25 components** across 7 categories:

| Category | Components |
|----------|------------|
| Display | SpanDate, SpanDateTime, SpanDecimal, SpanMoney, SpanMinutes, SpanGrams, SpanKV, FileName, TimeComparisonDisplay, Animation |
| Badges | BadgetAutoColor, SpecialBadges, PulseDotAnimation |
| Cards | Banner, CardKV, CardTitle, StatsDisplay |
| Layout | StepperU, ScalableBlock, FooterPoweredBy |
| Inputs | SearchInput |
| Gantt | GenericGantt |
| Utilities | Loader, HealthSection, HighlightCode |

## Examples

### Banner

```razor
<Banner Style="Banner.BannerStyle.Love"
        Icon="favorite"
        Title="Special Offer"
        ButtonText="Learn More"
        ButtonUrl="https://example.com">
    <p>Get <strong>30% off</strong> all plans!</p>
</Banner>
```

### HighlightCode

```razor
<HighlightCode Code='var x = "Hello";' Language="csharp" ShowCopy="true" />
```

### BadgetAutoColor

```razor
<BadgetAutoColor Value="Active" />    <!-- Green -->
<BadgetAutoColor Value="Pending" />   <!-- Yellow -->
<BadgetAutoColor Value="Cancelled" /> <!-- Red -->
```

## Contributing

Contributions, ideas, and feedback are welcome! Please open an issue or submit a pull request.

## License

MIT License - Dinaup Software
