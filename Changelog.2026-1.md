# Changelog — DinaZen — Enero 2026

Librería de componentes Blazor pública. Arranque público del repo.

## Componentes añadidos

### Datos / KPIs

- `KpiCard` + css — tarjeta de KPI.
- `StatItem` + css, `StatsDisplay` + `StatsDisplay.Item` — bloques de estadísticas.
- `CardKV`, `SpanKV` — clave/valor.
- `CardTitle`, `Banner` + css — cabeceras y banners.

### Formato de datos (Span*)

- `SpanBytes`, `SpanDate`, `SpanDateTime`, `SpanDecimal`, `SpanGrams`, `SpanInteger`, `SpanMinutes`, `SpanMoney`.
- `TimeSpanDisplay`, `TimeSpanDisplayBadge`, `TimeSpanDisplayCompact`.
- `TimeComparisonDisplay` + css.

### UI / Carga

- `AvatarInitial` + css — avatar con iniciales.
- `BadgetAutoColor`, `SpecialBadges` + css, `CountryBadge`.
- `Loader`, `Skeleton` + css, `PulseDotAnimation`, `ProgressRhythm` + css.
- `DeferredContent` — carga diferida.
- `ScalableBlock`.

### Formularios / Selección

- `DropDown` (+ code-behind `.razor.cs`).
- `DateRangeCard`, `DateRangeSelector`, `DateTimeRangeSelector`.
- `SearchInput`, `FileName`, `EnumDropDown`.

### Navegación / Estructura

- `StepperU`, `StepperStepU` — wizard.
- `HealthSection`, `FooterPoweredBy`.
- `TryComponent` — sandbox para probar componentes.

### Código / Documentos

- `HighlightCode` + `highlight.min.css`/`.js` — resaltado sintáctico.
- `CodeWindow` + css — ventana tipo editor.
- `OfficeDocumentViewer` — visor de Office.

### Gantt (nuevo)

- `Gantt/GenericGantt` + css.
- `Gantt/GanttToolBarU` + css.
- Modelos: `Gantt/Models/GanttModels`, `Gantt/Models/Utilities`.

### Diálogos

- `Dialogs/DynamicDocumentResultDialog`.
- `Dialogs/RecoveryPasswordWithDinaupDialog`.

## Infraestructura

- Proyecto demo `DinaZen.Demo` con despliegue Docker (`Dockerfile`, `docker-compose.yml`).
- `README.md` público con documentación de la API JavaScript.
- Namespace JS `DinaZen` para evitar colisiones.
- Assets: `wwwroot/dinazen.css`, `wwwroot/dinazen.js`.

## Build / Deps

- Versiones: `10.11.0.1` → `10.11.0.6`.
- Solución `DinaZen.sln` creada.
- `Extensions.cs` eliminado (contenido migrado).
- `LoaderU.razor` eliminado a favor de `Loader.razor`.
- `KV.razor` eliminado a favor de `CardKV` / `SpanKV`.
