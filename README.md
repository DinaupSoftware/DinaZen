# DinaZen

Biblioteca de componentes Blazor diseñada para facilitar la integración entre **Dinaup** y **Radzen**.

[![NuGet](https://img.shields.io/nuget/v/DinaZen.svg)](https://www.nuget.org/packages/DinaZen/)
[![.NET](https://img.shields.io/badge/.NET-9.0-blue.svg)](https://dotnet.microsoft.com/)

## Instalación

```bash
dotnet add package DinaZen
```

## Componentes

| Componente | Descripción |
|------------|-------------|
| [LoaderU](#loaderu) | Spinner animado para estados de carga |
| [EnumDropDown](#enumdropdown) | Selector dropdown genérico para enums |
| [KV](#kv) | Componente clave-valor para mostrar datos etiquetados |
| [DialogLayout](#dialoglayout) | Layout para diálogos/modales con header, body y footer |

---

### LoaderU

Componente de carga animado con 4 círculos de colores que rotan.

**Ubicación:** `Components/LoaderU.razor`

**Uso:**
```razor
<LoaderU />
```

**Características:**
- Animación CSS pura (sin JavaScript)
- Centrado automático con flexbox
- Colores: Cyan, Coral, Verde, Amarillo

---

### EnumDropDown

Dropdown genérico para seleccionar valores de un enum con soporte para `DisplayAttribute`.

**Ubicación:** `Components/EnumDropDown.razor`

**Parámetros:**

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `Name` | `string` | `""` | Atributo name del dropdown |
| `Style` | `string` | `"width:200px"` | Estilos CSS |
| `Value` | `TEnum` | - | Valor seleccionado |
| `ValueChanged` | `EventCallback<TEnum>` | - | Callback para two-way binding |

**Uso:**
```razor
<EnumDropDown TEnum="MiEnum" @bind-Value="valorSeleccionado" />
```

**Con DisplayAttribute:**
```csharp
public enum EstadoPedido
{
    [Display(Name = "Pendiente de pago")]
    Pendiente,

    [Display(Name = "En proceso")]
    EnProceso,

    [Display(Name = "Enviado")]
    Enviado
}
```

---

### KV

Componente para mostrar pares clave-valor con soporte para iconos y layouts horizontal/vertical.

**Ubicación:** `Components/KV.razor`

**Parámetros:**

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `Visible` | `bool` | `true` | Mostrar/ocultar el componente |
| `Key` | `string` | `""` | Etiqueta (clave) |
| `ChildContent` | `RenderFragment` | - | Contenido (valor) |
| `Horizontal` | `bool` | `false` | Layout horizontal (`true`) o vertical (`false`) |
| `LabelWidth` | `string` | - | Ancho máximo de la etiqueta (ej: "160px") |
| `Class` | `string` | - | Clases CSS adicionales |
| `Style` | `string` | - | Estilos CSS adicionales |
| `Icon` | `string` | - | Icono de Radzen (ej: "info", "check") |
| `IconColor` | `string` | - | Color CSS del icono |

**Uso básico:**
```razor
<KV Key="Nombre">
    Juan Pérez
</KV>
```

**Horizontal con icono:**
```razor
<KV Key="Email" Horizontal="true" Icon="email" IconColor="#0066cc">
    juan@ejemplo.com
</KV>
```

---

### DialogLayout

Layout para diálogos con estructura de header, contenido scrollable y footer.

**Ubicación:** `DialogLayout.razor`

**Parámetros:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `TitleContent` | `RenderFragment` | Contenido del header |
| `BodyContent` | `RenderFragment` | Contenido principal (scrollable) |
| `FooterContent` | `RenderFragment` | Contenido del footer (opcional) |
| `ContentStyle` | `string` | Estilos CSS para el área de contenido |

**Métodos públicos:**

| Método | Descripción |
|--------|-------------|
| `SetWidth(string width)` | Establece el ancho del diálogo |
| `SetHeight(string height)` | Establece la altura del diálogo |

**Uso:**
```razor
<DialogLayout>
    <TitleContent>
        <h4>Título del Diálogo</h4>
    </TitleContent>
    <BodyContent>
        <p>Contenido del diálogo...</p>
    </BodyContent>
    <FooterContent>
        <RadzenButton Text="Guardar" />
    </FooterContent>
</DialogLayout>
```

---

## Utilidades

### Extensions

Clase estática con métodos de extensión para strings y carga de datos de reportes.

**Métodos:**

| Método | Descripción |
|--------|-------------|
| `Normalized(string)` | Normaliza strings (trim, lowercase, limpia caracteres especiales) |
| `LoadReportDataAsync<T>(...)` | Carga datos para componentes de reporte Dinaup |

### ReportRequestOptions

Opciones de configuración para solicitudes de reportes.

```csharp
var options = new ReportRequestOptions
{
    Variables = new Dictionary<string, string>(),
    QuerySearch = "búsqueda",
    AdvancedFilters = new List<FilterCondition>(),
    SortOrder = new Dictionary<string, bool>()
};
```

---

## Demo

Consulta la página de demostración en `Demo/DemoPage.razor` para ver ejemplos interactivos de todos los componentes.

---

## Dependencias

- [Dinaup](https://www.nuget.org/packages/Dinaup/) 9.1.2.*
- [Radzen.Blazor](https://www.nuget.org/packages/Radzen.Blazor/) 7.3.5
- Microsoft.AspNetCore.Components.Web 9.0.9

## Licencia

MIT
