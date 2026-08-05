# DinaZen — Catálogo de componentes para IA

> Este archivo es la referencia completa de la librería para que una IA (o un dev nuevo) conozca todos los componentes sin leer el código. Generado a partir del código real en `src/`.

## Qué es

DinaZen es la librería de componentes Blazor del ecosistema Dinaup. Stack: **Blazor (Server) + Radzen + Bootstrap 5**. No depende de nada interno de Dinaup salvo el SDK público `Dinaup` (DTOs, `DinaupClientC`, extensions). Todos los componentes llevan prefijo `Dnz`.

## Instalación en una app

```razor
@* En el <head> del layout *@
<DnzHead />          @* 5 hojas CSS de DinaZen con versionado automático *@

@* Antes de </body> *@
<DnzScripts />       @* chart.js, highlight, uppy, image editor, windows... con versionado *@
```

## Convenciones de la librería

- `_Imports.razor` inyecta globalmente en TODOS los componentes: `NotificationService`, `DialogService`, `ContextMenuService`, `TooltipService`, `IJSRuntime JS`, `ICultureService RegionService`. No hace falta `@inject` por componente.
- La mayoría de componentes capturan atributos no macheados: `[Parameter(CaptureUnmatchedValues = true)] Dictionary<string, object> AdditionalAttributes` — puedes pasar `data-testid`, `id`, `title`, etc. directamente.
- Dialogs: se abren con método estático `OpenAsync(DialogService, ...)` y usan `<DnzDialogLayout>` con `TitleContent/BodyContent/FooterContent`. Botón confirmar = `ButtonStyle.Success` + `Variant.Text`, cancelar = `ButtonStyle.Danger` + `Variant.Text`.
- Formatos de número/fecha siempre vía `RegionService` (cultura del usuario).
- Convenciones de código: negaciones con `== false`, sin nullable reference types (`Nullable disable`), sentinels (`""`, `Guid.Empty`) en lugar de null.

---

## 1. Instalación

| Componente | Propósito |
|---|---|
| `DnzHead` | Inyecta los `<link>` CSS de DinaZen con `?v={Version}`. Sin parámetros. |
| `DnzScripts` | Inyecta los `<script>` JS (chart, highlight, uppy, windows, image editor...) con versionado. Sin parámetros. |

## 2. Layout, tarjetas y envoltorios

### DnzCardTitle (el más usado: ~174 usos)
Header estándar de card: icono + título + subtítulo + badges + acciones.
- Params: `Title`, `Subtitle`, `Icon`, `BadgeType:DnzSpecialBadges.BadgeType?`, `Compact:bool`, `HelpLink`, `HelpContent:RenderFragment`, `Actions:RenderFragment`, captura atributos (param se llama `Attributes`).
```razor
<DnzCardTitle Title="Clientes" Icon="group">
    <Actions><RadzenButton Icon="add" Size="ButtonSize.Small" Click=@Nuevo /></Actions>
</DnzCardTitle>
```

### DnzDialogLayout (~117 usos)
Layout de dialog: grid 3 filas (header con título/icono/cerrar | contenido scrollable | footer).
- Params: `Title`, `Icon`, `TitleContent`, `BodyContent`, `FooterContent` (RenderFragments), `ContentStyle`, `HeaderStyle`, `Flat:bool`.
- `Cerrar()` interno protege contra doble cierre.

### DnzCardBody
Body que escapa el padding del card padre con margen negativo. Params: `ChildContent`, `Class`, `Style`.

### DnzCardKV
Card pequeño icono + label + valor (estilo dashboard). Params: `Icon`, `IconColor`, `Title` (`Tile` es legacy, se mantiene por compatibilidad), `Value`, `Variant`, `Style`.

### DnzBanner
Banner promocional/informativo con estilos (Primary, Gold, Danger, Love...). Params: `Icon`, `Title`, `ChildContent`, `ButtonText`, `DnzButtonrl` (URL del botón — sí, el nombre tiene un typo histórico, no renombrar sin migrar ~20 usos), `OpenInNewTab:bool=true`, `Style:DnzBannerStyle`, `AdditionalClass`. Ojo: `Style` aquí es el enum del banner, NO css inline.

### DnzEnvBar
Barra que anuncia entorno Staging/Dev (lee `Dinaup.EnvExtensions.GetCurrentEnv()`). Sin params.

### DnzHealthSection
Renderiza `ChildContent` solo si el health check `CheckName` pasa; si no, "Servicio no disponible".

### DnzScalableBlock
Contenedor con zoom +/- persistido en localStorage por `Key`. Params: `Key` (requerido), `ChildContent`.

### DnzDeferredContent (~15 usos)
Retrasa el render de `ChildContent` `DelayMs` ms (default 500) mostrando `LoadingContent` o `DnzSkeleton`. No bloquea el prerender (delay fire-and-forget con guard de dispose).

### DnzTryComponent
Wrapper de `ErrorBoundary`: captura excepciones de `ChildContent` y muestra `ErrorContent` (RenderFragment<Exception>).

### DnzFooterPoweredBy
Footer "Powered by Dinaup". Param: `Style:FooterStyleType` (Compact | Modern).

## 3. Indicadores de carga

| Componente | Propósito | Params clave |
|---|---|---|
| `DnzLoader` (~102 usos) | Spinner centrado (vertical) u horizontal | `Horizontal:bool=false` |
| `DnzIALoader` | Loader específico de operaciones IA con barra animada | `Text="Analizando con IA..."` |
| `DnzSkeleton` (~68 usos) | Placeholder esqueleto | `Lines:int=1`, `Height="1rem"`, `Radius`, `MaxWidth` |
| `DnzPulseDotAnimation` | Dot de estado con pulso | `Color:PulseColor` (req.), `Pulse:bool=true`, `Size:int=14`, `Title` |
| `DnzProgressRhythm` | Barra de progreso vs progreso esperado (on-track/ahead/behind) | `CurrentProgress`, `ExpectedProgress`, `Title`, textos personalizables |

## 4. Texto y formato (Spans)

Todos renderizan `<span>` compacto, formatean con la cultura del usuario (`RegionService`) y aceptan `FontSize` (default "16px").

| Componente | Formatea | Params clave |
|---|---|---|
| `DnzSpanMoney` (~47 usos) | Dinero con label/icono opcional | `Amount:decimal?`, `Label`, `Icon`, `AutoColor`/`AutoColorRed`/`AutoColorGreen`, `IsVisible` |
| `DnzSpanDecimal` | Decimal con símbolo | `Value:decimal?`, `Symbol`, `AutoColor` |
| `DnzSpanInteger` | Entero | `Value:decimal?` |
| `DnzSpanDate` (~20 usos) | Fecha amigable (Hoy/Ayer/...) | `Value:DateOnly?`, `FriendlyMode=true`, `ShowBadge`, `ShowStatus` |
| `DnzSpanDateTime` (~29 usos) | Fecha+hora, modo relativo | `Value:DateTime?`, `Relative:bool`, `ShowBadge`, `ShowStatus`, `Caption` |
| `DnzSpanBytes` | Tamaño archivo (B/KB/MB/GB/TB) | `Value:long?` |
| `DnzSpanGigaBytes` | GB con conversión dinámica | `Value:decimal?`, `AutoColor` |
| `DnzSpanGrams` | Peso gr/Kg (umbral 1000) | `Value:decimal?`, `AutoColor` |
| `DnzSpanMinutes` | Minutos como "2h 30m" | `Value:decimal?` |
| `DnzSpanKV` (~15 usos) | Par clave-valor con icono | `Key`, `Value` o `ChildContent`, `Icon`, `Horizontal`, `LabelWidth`, `TextRight`, `Visible` |
| `DnzTimeSpanDisplay` | TimeSpan descompuesto (d/h/m/s) | `Value:TimeSpan?`, `ShowSeconds`, `EmptyText`, `NumberClass`, `LabelClass` |
| `DnzTimeSpanDisplayBadge` | Variante badges (bg-primary/secondary) | mismos params |
| `DnzTimeSpanDisplayCompact` | Variante compacta | mismos params |
| `DnzTimeComparisonDisplay` | Tiempo real vs planificado con barra | `PlannedTime`, `ActualTime`, `ShowProgressBar`, `Compact` |

### Otros de presentación
- `DnzFileName` (~7 usos): archivo con icono por extensión (pack CDN), tamaño y botón descarga/acción. Params: `DnzFileNameDisplay`, `FileSize:long?`, `DownloadURL`, `OnClick`, `IsCompact`, `Horizontal`.
- `DnzHighlightCode` (~10 usos): bloque de código con syntax highlight, copy y números de línea. Params: `Code`, `Language`, `DnzFileName`, `ShowCopy=true`, `ShowLineNumbers`, `Size`.
- `DnzCodeWindow`: ventana de código estilo macOS (dots, título, badge de lenguaje, copy, tema Dark/Light, `Tilted`). Params: `Code`, `Language`, `Title`, `ShowCopy`, `ShowLineNumbers`, `Theme`, `Size`, `ChildContent` (footer).
- `DnzEmailPreview`: preview de email en iframe sandbox (data-uri base64). Params: `Body`, `Destinatario`, `Asunto`, `Height="400px"`.
- `DnzOfficeDocumentViewer`: visor Office vía Microsoft Office Web + botones abrir/descargar. Params: `DocumentUrl` (req.), `EmptyMessage`.

## 5. Badges y avatares

- `DnzBadgetAutoColor` (~55 usos): badge con color semántico automático según el texto (Success/Danger/Pendiente/En curso/...) o mapeo explícito. Params: `Value:string`, `Color:EnumTextoEstiloE`, `BadgetStyle:Dictionary<string,int>`, `Click:EventCallback`, `Visible`.
- `DnzSpecialBadges` (~7 usos): badges Pro/Beta/New/Premium/IA con gradientes. Param: `Type:BadgeType`.
- `DnzCountryBadge`: bandera SVG (CDN) + código país ISO alpha-2. Params: `CountryCode` (req.), `Size:int=22`, `FlagUrlTemplate`.
- `DnzDeltaBadge`: delta % con color e icono trending_up/down/flat. Params: `Value:decimal?`, `IsPercent=true`, `InvertColors`, `Size`, `Tooltip`.
- `DnzAvatarInitial`: avatar circular con inicial y color derivado de la letra. Params: `Data:string`, `Size="2.5rem"`, `OnClick`.

## 6. KPIs y estadísticas

- `DnzKpiCard` (~37 usos): tarjeta KPI con modos Normal/Compact/Highlight (gradiente), delta %, botón opcional. Params: `Title`, `Icon`, `Value`, `Description`, `IsCompact`, `HighlightColor`, `DeltaPercent:decimal?`, `DeltaLabel`, `DeltaInvertColors`, `OnClick`, `ButtonText`, `Variant`, `TrendContent:RenderFragment`.
- `DnzKpiRow`: grid responsive para KPI cards (`MinCardWidth:int=220`). Envuelve `DnzKpiCard`s.
- `DnzKpiInline`: strip horizontal de mini-KPIs con separador (`Items:List<ItemModel>`, `Separator`).
- `DnzStatItem`: icono + label + valor en fila. Params: `Label`, `Icon`, `IconColor`, `IconSize`, `ValueSize="fs-3"`, `ChildContent`.
- `DnzStatsDisplay` + `DnzStatsDisplay.Item`: card con lista de estadísticas centradas (`Statistics:List<StatisticModel>` req.).
- **`DnzDynamicStat`** (familia, carpeta `DnzDynamicStat/`): visualizador automático de datos estadísticos. Recibe `Data:DnzDynamicStatData` (series + items) y elige render KPI/Chart/Tabla según la forma de los datos, o forzado con `Render:DnzDynamicStatRenderE`. Subcomponentes: `DnzDynamicStatKpi`, `DnzDynamicStatChart` (Chart.js: Column/Bar/Line/Area/Pie/Donut), `DnzDynamicStatTable` (ranking con barras o DataGrid). Params clave: `IsLoading`, `ChartType`, `ChartHeight=300`, `ShowLegend`, `PageSize`, `AllowViewSwitch` (conmutar vista), `FormatValue`/`GetSeriesColor` (Func de personalización).

## 7. Inputs y selección

### DnzSearchInput (~16 usos)
Input de búsqueda con icono y debounce. Params: `Value`, `Placeholder="Buscar..."`, `BounceValueChanged:EventCallback<string>` (se dispara tras el debounce). Implementa `IDisposable`.

### DnzDropDown
DropDownDataGrid simplificado para `IDinaupRow` con búsqueda y acciones inline (quitar/abrir/añadir). Params: `T:IDinaupRow`, `Data:IEnumerable<T>`, `Selected:T` + `SelectedChanged`, `TextProperty`, `ColorProperty`, `IconoProperty`, `Label`, `Icon`, `Disabled`, `OnAdd`, `OnRemove`, `OnOpen`.

### DnzDataGridDropDown (~26 usos)
Versión completa con columnas custom (`Columns:RenderFragment`), `ValueTemplate`, overlay de acciones, `OpenInWindow` (abre el registro en ventana flotante), `IsRequired` (borde obligatorio), `Client:DinaupClientC`. Two-way: `Value:T` + `ValueChanged`.

### DnzEnumDropDown
Dropdown tipado para enums leyendo `[Display(Name=...)]`. Params: `TEnum`, `Value` + `ValueChanged`, `Placeholder`, `Disabled`, `Style="width:200px"`.

### DnzTagListEditor
Editor de lista de strings tipo tags: añadir con Enter, multi-paste, `Validator:Func<string,string>` (devuelve error o ""), `Transform:Func<string,string>`, `ReadOnly`, `EmptyText`. Two-way: `Value:List<string>` + `ValueChanged`.

### DnzJsonKVEditor
Editor visual key/value que serializa a JSON plano. Botones Copy/Paste (acepta JSON con comillas tipográficas), dot notation para agrupar. Two-way: `Value:string="{}"` + `ValueChanged`, `ReadOnly`.

### Selectores de rango de fechas
- `DnzDateRangeSelector`: presets (Hoy, Ayer, Últimos 7/30 días, mes, trimestre, año, Personalizado) emitiendo `OnRangeChanged:(DateOnly From, DateOnly To)`. Two-way en `SelectedPreset:DateRangePreset`.
- `DnzDateTimeRangeSelector`: igual pero con `DateTime` (To = fin de día).
- `DnzDateRangeCard` (~5 usos): card completo = `DnzCardTitle` + selector de rango + área de contenido con `Loading:bool` + resumen del rango. Emite `OnRangeChanged:(DateTime,DateTime)` (To = fin de día).
- `DnzMonthNavSelector`: tira mínima `[<] Enero [>]` para navegar mes a mes (el año solo se escribe si no es el actual; etiqueta pulsable = volver a hoy). Two-way `Value:DateOnly` + `ValueChanged` (emite siempre el día 1); flechas sin límites.

### DnzStepper / DnzStepperStep
Stepper vertical con línea conectora. `DnzStepper` envuelve N `DnzStepperStep` (`Index:int`, `ChildContent`).

### DnzFileUploaderButton (~6 usos)
Subida de archivos con Uppy + URLs prefirmadas. Params: `Client:DinaupClientC`, `PresignEndpoint="/file/upload/sign"`, `OnFilesUploaded:EventCallback<List<DinaupFileDTO>>`, `OnEachFileUploaded`, `AcceptExtensions:string[]`, `MaxSizeBytes` (150MB default), `MaxFiles`, `UseDashboard`, `EditBeforeUpload=true` (abre el editor de imagen antes de subir), props de estilo del botón. `IAsyncDisposable`.

### DnzHtmlEditor / DnzHtmlEditorToolbar
RadzenHtmlEditor + toolbar de herramientas IA inyectadas por DI (`IEnumerable<IDnzTextTool>`). Two-way `Value` + `ValueChanged`, `Context` (contexto para la IA), `UploadUrl`.

### DnzImageEditor / DnzImageEditorDialog
Editor de imagen JS (undo/redo, ajustes, recorte) + herramientas externas (`IDnzImageTool` por DI). El Dialog lo envuelve y devuelve `byte[]` editado. Params editor: `ImageUrl` o `ImageBytes`, `OnSave:EventCallback<byte[]>`, `OnCancel`, `PresignEndpoint`.

## 8. Dialogs (src/Dialogs)

Todos se abren con su estático `OpenAsync(DialogService, ...)`:

- `DnzConfirmDialog`: confirmación con severidad (Danger/Warning/Info/Success). `OpenAsync(dialogService, title, message, okText, cancelText, severity)` → `bool`. **Usar SIEMPRE antes de acciones destructivas.**
- `DnzEmailPreviewDialog`: preview de email + botones Enviar/Cancelar. `OpenAsync(dialogService, body, destinatario, asunto, onConfirmar, confirmarTexto)`.
- `DnzHistoricoDialog`: timeline de cambios de un campo Dinaup (`Client`, `Id`, `SectionId`, `Field`), con skeleton y agrupación por fecha.
- `DnzItemPickerDialog`: selector de fila sobre un `DnzReportView` (`Client`, `ReportId`) → devuelve `DinaupDynamicRowDTO` o null si cancela.
- `DnzRecoveryPasswordWithDinaupDialog`: recuperación de contraseña vía SSO dinaup.com (branded, sin params).

## 9. DinaupFlex — integración con datos Dinaup

Componentes que hablan con el servidor Dinaup vía `DinaupClientC` (SDK público).

### Reports

- **`DnzReportView`** (~5 usos directos, núcleo de listados): RadzenDataGrid dinámico sobre un reporte Dinaup. Columnas tipadas por formato (DEC/INT/DATE/BOOL/STR) con filtros por columna, búsqueda, orden server-side, paginación, sumas en footer, export CSV, context menu. Params: `Client`, `ReportId`, `VariablesValues`, `QuerySearch`, `AdvancedFilter:List<FilterCondition>`, `Limit=50`, `Orden`, `ShowTitle`, `ShowSearch`, `Filtrable`, `ShowAdd`, `ToolBarTemplate`, `OnItemSelect:EventCallback<DinaupDynamicRowDTO>`, `OnDataChanged`. API pública: `UpdateSearch(query)` (debounced 800ms), `UpdateSearchAsync`, `UpdateSearchInmediate`, `UpdateAsync()`.
- **`DnzReportProvider`**: alternativa headless — carga el reporte y cascadea un `ReportContext` (`Report`, `Rows`, `Mapping`, `TotalResults`, `IsLoading`, `ErrorMessage`, `RefreshAsync`, `Client`) a sus hijos. Dentro puedes poner cualquiera de las vistas siguientes:
  - `DnzCardList`: filas como tarjetas (imagen, título, campos, importe). `MaxFields=4`, `OnItemSelect`. Sin handler, abre el registro (ventana o dialog).
  - `DnzChartView`: gráfico Radzen (Column/Bar/Line/Area/Pie) por columnas categoría/valor. `ChartType`, `ValueColumn`, `CategoryColumn`, `MaxItems=20`.
  - `DnzSummaryBar`: barra de métricas agregadas (total, sumas de dinero/números/minutos, contadores bool, rango de fechas).
  - `DnzStatusSummary`: resumen por estado con badges, conteos y barras. `OnStatusClick`.
  - `DnzTopN`: top N por columna numérica con barras proporcionales. `N=10`, `ValueColumn`, `Ascending`.
- **Filtros** (`Reports/Filters/`, uso interno de DnzReportView): `DnzFilter` es el router que elige por tipo de campo → `DnzTextFilter`, `DnzIntegerFilter`, `DnzDecimalFilter`, `DnzDateFilter`, `DnzDateTimeFilter` (con conversión UTC), `DnzBoolFilter`, `DnzBadgeFilter`, `DnzPredefinedFilter`, `DnzTimeFilter`/`DnzRelationFilter` (stubs). Patrón común: `Column:DinaupFieldDTO` + `DataColumn:RadzenDataGridColumn<DinaupDynamicRowDTO>`.

### Forms

- **`DnzFormView`**: formulario dinámico completo de un registro Dinaup (edit/new), con tabs, anotaciones, impresión, sync en vivo, extensiones. Params clave: `Client`, `SectionId`, `DatoId`, `PreFillValues`, `OnClosed:EventCallback<DinaupFormResult>`. Estáticos: `OpenAsync(dialogService, client, sectionId, datoId, ...)` y `OpenAsWindow(windowManager, client, sectionId, datoId, ...)`.
- `DnzFormByTokenView`: formulario simplificado cargado por token (creación rápida pública). `Client`, `Token`.
- `DnzFormInspectorDialog`: inspector de registro (IDs, sección, estado de campos).
- **`DnzRowSelector`** (~28 archivos en play): selector relacional con popup de búsqueda sobre un reporte. Params: `Client`, `ReportId`, `SelectedRow:IDinaupRow` + `SelectedRowChanged`, `Label`, `Placeholder`, `Icon`, `IsRequired` (emite la clase `obli` de la casa), `Disabled`, `AdvancedFilter`, `OnAdd:EventCallback<Guid>` (pinta el + del campo y el botón "Crear nuevo" del popup), `OnOpenRecord`, `OpenInWindow=true`, `DefaultID:Guid`, `DefaultLabel` (pinta la selección inicial SIN viaje al servidor y sin notificar `SelectedRowChanged` — pásalo siempre que el caller ya tenga el texto), `FetchInterceptor` (passthrough del hook de caché de DnzReportView). Operable por teclado (Tab, Enter/↓ abre, Supr limpia). OJO contrato: la precarga por `DefaultID` (sin `DefaultLabel`) SÍ notifica `SelectedRowChanged` — un id igual al ya guardado no es un cambio del usuario.
- Internos del motor de formularios (`Forms/Tab/`): `DnzFormTab`, `DnzContainer`, `DnzControl` (control dinámico por tipo), `DnzButton`, `DnzContainerButton`, `DnzFormList`, `DnzFormPrimaryList` (tabla editable con paginación), `DnzPrimaryListCell`, `DnzFormSelectorRelacionControl`, `DnzDynamicRowPreviewIMG` (avatar/preview con fallback a inicial).

### Annotations
- `DnzAnnotationsDialog`: dialog de anotaciones de un registro (comentarios/archivos/galería). `Client`, `SectionId:Guid`, `RowId:Guid`, `InitialType`.
- `DnzAnotation`: tarjeta de una anotación (autor, fecha, adjuntos). `Anotation:DinaupAnnotationDTO`.
- `DnzRedactarModerno`: caja de redactar comentario con botón enviar (valida vacío, IsBusy). `Client`, `RowId`, `SectionId`, `Type`, `ComentarioEnviado:EventCallback`.

### DynamicDocuments
- `DnzDynamicDocumentView`: dialog que ejecuta un documento dinámico (selector de documento compatible, variables, preview iframe, imprimir/PDF/email). `Client`, `DocId`, `VariableValues`, `CompatibleDocuments`, `AutoPrint`, `OnSendEmail`, `OnSendEmailWithAttachment`.
- `DnzDynamicDocumentResultView`: iframe del HTML resultado + botón imprimir. `HTML`, `AutoImprimir`.

### ResponseQuestions
- `DnzResponseQuestions`: formulario de captura de variables de un reporte/documento (STR/INT/DEC/DATE/TIME/BOOL). `Variables:Dictionary<string,DinaupVariableDTO>` (req.), `VariableValues`, `OnConfirm:EventCallback<Dictionary<string,string>>`.

## 10. RRHH (src/Components/Rrhh)

- `DnzComparisonCardRrhh`: card "Esperado vs Realizado" de un turno con timeline 24h, badges de estado (a tiempo/antes/tarde/ausencia). Params: `ExpectedStart/End:TimeOnly?`, `ActualStart/End:TimeOnly?`, textos personalizables.
- `DnzTimeIntervalEditorRrhh`: editor multi-intervalo horario con ghost row, plantillas, clipboard, categorías, indicador de huecos, totales. Two-way: `Intervals:List<TimeIntervalRrhh>` + `IntervalsChanged`; `AllowSort/Add/Remove`, `ReadOnly`, `AutoSort`, `Templates`, `Categories`.
- `DnzTimelineRrhh`: contenedor de eje 24h con labels y gridlines (`StartHour`, `EndHour`, `Step`, `NowMarker:TimeOnly?`). Host de:
- `DnzTimelineBarRrhh`: barra posicionada en el eje (calcula left%/width%). `Date`, `Start/End:TimeOnly?` (req.), `Style:TimelineBarStyleRrhh`, `OnClick`, `ShowLabel`.
- `DnzWeeklyScheduleGridRrhh`: grid semanal agrupado por día. `Items:IEnumerable<ScheduleItemRrhh>` (req.), `Culture`, `FirstDayOfWeek=Monday`.

## 11. WindowManager (src/Components/WindowManager)

Sistema de ventanas flotantes estilo escritorio dentro de la app:

- `DnzWindowHost`: host maestro — renderiza todas las ventanas (capas normal y sobre-modal) + taskbar. Se coloca una vez en el layout. Sin params (usa `DnzWindowManagerService` por DI).
- `DnzWindow`: ventana individual (titlebar, minimizar/maximizar/cerrar, drag y 8 handles de resize vía JS `dinazen-windows.js`).
- `DnzTaskbar` + `DnzTaskbarItem`: barra de tareas con chips por ventana (click restaura, middle-click cierra).
- Servicio: `DnzWindowManagerService` (abrir/cerrar/foco/z-index). `DnzFormView.OpenAsWindow(...)` es el consumidor típico.

## 12. Gantt (src/Components/Gantt)

- `DnzGenericGantt`: gantt genérico con columna de grupos fija y timeline scrollable. `Groups:List<GanttGroup>` (req.), `SourceItems:List<GanttItem>` (req.), `OnItemClick`.
- `DnzGanttToolBar`: navegación temporal, modos hora/semana/mes/año y zoom. Two-way: `Viewport:GanttViewport` + `ViewportChanged`.

---

## Patrones de uso recomendados

```razor
@* Listado estándar de una sección *@
<RadzenCard>
    <DnzCardTitle Title="Facturas" Icon="receipt_long" />
    <DnzReportView Client=@Client ReportId="GUID-del-reporte" OnItemSelect=@Abrir />
</RadzenCard>

@* Dashboard con provider headless *@
<DnzReportProvider Client=@Client ReportId="GUID">
    <DnzSummaryBar />
    <DnzKpiRow> ... </DnzKpiRow>
    <DnzCardList MaxFields="3" />
</DnzReportProvider>

@* Confirmación destructiva *@
var ok = await DnzConfirmDialog.OpenAsync(DialogService, "Eliminar", "¿Seguro?", severity: DnzConfirmSeverity.Danger);

@* Selector relacional en un formulario *@
<DnzRowSelector Client=@Client ReportId="GUID" @bind-SelectedRow=@cliente Label="Cliente" IsRequired=true />
```

## Notas para la IA que edite esta librería

- Hay hooks que bloquean: `<RadzenStack>` (usar `d-flex` + Bootstrap), code-behind `.razor.cs` (todo en `@code`), e inline styles de spacing en rem con equivalente Bootstrap (`gap-2`, `p-3`, `mb-3`...).
- CSS scoped va en `.razor.css` junto al componente, y solo si Bootstrap/Radzen no llegan.
- No usar `Disabled` para validación de datos: botón habilitado + `NotificationService.Notify(Warning, ...)` explicando el motivo.
- Componentes muy usados (`DnzCardTitle`, `DnzDialogLayout`, `DnzLoader`, `DnzSkeleton`, `DnzBadgetAutoColor`, `DnzSpanMoney`) — no cambiar márgenes externos ni firmas sin revisar consumidores en play.dinaup.com y dinazen.dinaup.com.
- La web de demos/ejemplos vivos de cada componente es `dinazen.dinaup.com` (repo `Dinaup-0/dinazen.dinaup.com`, carpeta `src/Pages/Examples/`).
