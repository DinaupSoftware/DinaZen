# DinaZen

A Blazor component library designed to facilitate UI/UX development for applications integrating with Dinaup and Radzen Blazor components.

## Overview

DinaZen provides a collection of reusable Razor components for building modern web applications with .NET 10.0, featuring:

- 25+ production-ready components
- Integration with Radzen Blazor Components
- Built-in localization support
- Syntax highlighting with highlight.js
- Zoom functionality with localStorage persistence
- Lottie animation support

## Installation

```bash
dotnet add package DinaZen
```

## Quick Start

### 1. Add using directive to `_Imports.razor`

```csharp
@using DinaZen.Components
```

### 2. Register required services in `Program.cs`

```csharp
// Required for HTTP context access and browser language detection
builder.Services.AddHttpContextAccessor();

// Required for Animation component (loads animations from external URLs)
builder.Services.AddHttpClient();

// Required for culture-specific formatting (dates, numbers, currencies)
builder.Services.AddScoped<Dinaup.CultureService.ICultureService,
    Dinaup.CultureService.CultureService>();
```

### 3. Add CSS and JavaScript references

In your `_Host.cshtml` or `App.razor`:

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

---

## JavaScript API Documentation

DinaZen exposes a JavaScript API under the `window.DinaZen` namespace to prevent conflicts with other libraries.

### Namespace Structure

All functions are organized under `window.DinaZen`:

```javascript
window.DinaZen = {
    // IFrame Management
    setIframeBlob(iframeId, htmlContent)
    printIframe(id)
    printIframeOnce(iframe)

    // Dialog Management
    setDialogWidth(element, width)
    setDialogHeight(element, height)

    // Focus Management
    focusNextElement()

    // Lottie Animation
    loadLottie(containerId, srcOrData, options)

    // Highlight.js Integration
    highlightCode()
    highlightElement(element)

    // ScalableBlock Zoom
    scalableBlock: {
        setScale(element, scale)
    }
}
```

### Backward Compatibility

For backward compatibility, all functions are also available directly on `window`:

```javascript
// New (recommended)
window.DinaZen.setDialogWidth(element, width);

// Old (deprecated, but still works)
window.setDialogWidth(element, width);
```

---

## API Reference

### IFrame Management

#### `DinaZen.setIframeBlob(iframeId, htmlContent)`

Loads HTML content into an iframe using Blob URLs for better security and performance.

**Parameters:**
- `iframeId` (string): The ID of the iframe element
- `htmlContent` (string): HTML content to load

**Example:**
```javascript
DinaZen.setIframeBlob('myIframe', '<h1>Hello World</h1>');
```

**Why Blob URLs?**
- **Security**: Isolates content as binary object, preventing XSS injection
- **Performance**: Significantly faster than Base64-encoded strings
- **Memory**: Reduces memory usage and enables efficient streaming

---

#### `DinaZen.printIframe(id)`

Prints the content of an iframe.

**Parameters:**
- `id` (string): The ID of the iframe element

**Example:**
```javascript
DinaZen.printIframe('documentPreview');
```

**HTML Usage:**
```html
<button onclick="DinaZen.printIframe('documentPreview')">Print</button>
<iframe id="documentPreview"></iframe>
```

---

#### `DinaZen.printIframeOnce(iframe)`

Prints an iframe content once, with automatic focus management.

**Parameters:**
- `iframe` (HTMLIFrameElement): The iframe DOM element

**Example:**
```javascript
const iframe = document.getElementById('myIframe');
DinaZen.printIframeOnce(iframe);
```

---

### Dialog Management

#### `DinaZen.setDialogWidth(element, width)`

Sets the width of a Radzen dialog containing the specified element.

**Parameters:**
- `element` (HTMLElement): Any element inside the dialog
- `width` (string): CSS width value (e.g., "800px", "50%")

**Example:**
```csharp
// From Blazor C#
await JS.InvokeVoidAsync("DinaZen.setDialogWidth", rootElement, "1200px");
```

---

#### `DinaZen.setDialogHeight(element, height)`

Sets the height of a Radzen dialog containing the specified element.

**Parameters:**
- `element` (HTMLElement): Any element inside the dialog
- `height` (string): CSS height value (e.g., "600px", "80vh")

**Example:**
```csharp
// From Blazor C#
await JS.InvokeVoidAsync("DinaZen.setDialogHeight", rootElement, "90vh");
```

---

### Focus Management

#### `DinaZen.focusNextElement()`

Moves focus to the next focusable element (input, select, textarea, button, etc.). Automatically selects text content if the next element is an input field.

**Example:**
```javascript
// Move to next field (e.g., on Enter key)
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        DinaZen.focusNextElement();
    }
});
```

**Blazor Usage:**
```csharp
await JS.InvokeVoidAsync("DinaZen.focusNextElement");
```

---

### Lottie Animation

#### `DinaZen.loadLottie(containerId, srcOrData, options)`

Loads and plays a Lottie animation. Supports both JSON data and URL paths.

**Parameters:**
- `containerId` (string): The ID of the container element
- `srcOrData` (string | object): Animation JSON data or URL to .json file
- `options` (object, optional): Animation configuration

**Options:**
```javascript
{
    loop: true,              // Loop animation
    autoplay: true,          // Auto-start animation
    renderer: "svg",         // Renderer: "svg", "canvas", "html"
    preserveAspectRatio: "xMidYMid meet",
    progressiveLoad: true
}
```

**Example (JSON inline):**
```javascript
const animData = { /* Lottie JSON */ };
DinaZen.loadLottie('animContainer', animData, {
    loop: true,
    autoplay: true
});
```

**Example (URL):**
```javascript
DinaZen.loadLottie('animContainer', '/animations/loading.json');
```

**Note:** This is a legacy function. For new projects, use the `<dotlottie-player>` web component with `.lottie` files (see Animation component).

---

### Highlight.js Integration

#### `DinaZen.highlightCode()`

Applies syntax highlighting to all `<pre><code>` elements that haven't been highlighted yet.

**Example:**
```javascript
// After dynamically adding code blocks
DinaZen.highlightCode();
```

---

#### `DinaZen.highlightElement(element)`

Highlights a specific code element.

**Parameters:**
- `element` (HTMLElement): The `<code>` element to highlight

**Example:**
```javascript
const codeBlock = document.querySelector('code.language-javascript');
DinaZen.highlightElement(codeBlock);
```

**Blazor Usage:**
```csharp
@inject IJSRuntime JS

<code @ref="codeElement" class="language-csharp">@Code</code>

@code {
    private ElementReference codeElement;

    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (firstRender)
        {
            await JS.InvokeVoidAsync("DinaZen.highlightElement", codeElement);
        }
    }
}
```

---

### ScalableBlock - Zoom Functionality

#### `DinaZen.scalableBlock.setScale(element, scale)`

Applies zoom scaling to an element.

**Parameters:**
- `element` (HTMLElement): The element to scale
- `scale` (number): Scale factor (0.5 to 2.0)

**Example:**
```javascript
const content = document.getElementById('zoomableContent');
DinaZen.scalableBlock.setScale(content, 1.5); // 150% zoom
```

**LocalStorage Persistence:**

The ScalableBlock component automatically persists zoom levels:

```javascript
// Saved as: "scalableBlockScale-{ComponentKey}"
localStorage.setItem("scalableBlockScale-myContent", "1.5");
```

---

## Component Examples

### HighlightCode

Display code with syntax highlighting and copy button:

```razor
<HighlightCode
    Code='var message = "Hello World";'
    Language="csharp"
    ShowCopy="true"
    ShowLineNumbers="true" />
```

### Banner

Display eye-catching banners with 11 different styles:

```razor
<Banner Style="Banner.BannerStyle.Love"
        Icon="favorite"
        Title="Valentine's Day: 30% off all plans"
        ButtonText="Redeem"
        ButtonUrl="https://example.com/promo">
    <p>Code <strong>LOVE2025</strong> valid until February 14.</p>
</Banner>
```

Available styles: `Primary`, `Gold`, `Love`, `Danger`, `Success`, `Warning`, `Pro`, `Beta`, `New`, `Premium`, `IA`

### ScalableBlock

Content with zoom in/out buttons and localStorage persistence:

```razor
<ScalableBlock Key="myContent">
    <div>
        <h3>Zoomable Content</h3>
        <p>This content can be zoomed in and out.</p>
    </div>
</ScalableBlock>
```

### SpanMoney

Format monetary values with optional icons:

```razor
<SpanMoney Amount="2999.99m" Label="Total" Icon="payments" AutoColor="true" />
```

### BadgetAutoColor

Badges with automatic color based on text content:

```razor
<BadgetAutoColor Value="Active" />      <!-- Green -->
<BadgetAutoColor Value="Pending" />     <!-- Yellow -->
<BadgetAutoColor Value="Cancelled" />   <!-- Red -->
```

Supports 100+ status mappings including: Active, Completed, Paid, Pending, In progress, Cancelled, Expired, etc.

---

## Error Messages

All DinaZen errors are prefixed with `[DinaZen]` for easy identification:

```javascript
console.warn("[DinaZen] El iframe no existe:", id);
console.error("[DinaZen] lottie container #myContainer no encontrado");
```

---

## Browser Compatibility

- Modern browsers with ES6+ support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

## Dependencies

### Runtime Dependencies
- **Radzen.Blazor** (v8.4+) - Component library
- **Dinaup** (v10.11+) - Enterprise framework for localization
- **ASP.NET Core** (v10.0.1) - Web framework

### Client-Side Libraries (Included)
- **highlight.js** - Syntax highlighting
- **dotlottie-player** - Lottie animation player

---

## localStorage Usage

DinaZen uses localStorage for the following features:

| Key Pattern | Component | Purpose |
|------------|-----------|---------|
| `scalableBlockScale-{Key}` | ScalableBlock | Persists zoom level per component |

**Example:**
```javascript
// Reading saved zoom level
const savedZoom = localStorage.getItem("scalableBlockScale-myContent");
// Returns: "1.5"
```

---

## Migration from Global Functions

If you're upgrading from an older version using global functions:

### Old (Deprecated):
```javascript
window.highlightCode();
window.setDialogWidth(element, width);
```

### New (Recommended):
```javascript
window.DinaZen.highlightCode();
window.DinaZen.setDialogWidth(element, width);
```

**Note:** Both work due to backward compatibility, but the namespaced version is recommended to avoid conflicts.

---

## Demo Application

Run the demo to see all components in action:

```bash
cd samples/DinaZen.Demo
dotnet run
```

The demo includes 25+ example pages with interactive documentation.

---

## Contributing

This is a component library for internal use within Dinaup applications. For issues or feature requests, contact the development team.

---

## License

Proprietary - Dinaup Software

---

## Version

Current version: **10.11.0.2**

Target framework: **.NET 10.0**

---

## Support

For questions or support, contact the Dinaup development team.
