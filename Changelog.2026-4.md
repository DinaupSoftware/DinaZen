# Changelog — DinaZen — Abril 2026

Librería de componentes Blazor pública. Versiones `10.14.0.17` → `10.15.0.2`.

## 10.15.0.2 — 2026-04-21
- Dependencias fijadas a versión exacta: `Dinaup 10.15.0.4`, `Dinaup.MyDinaup0 10.15.0.3`.

## 10.15.0.1 — 2026-04-19

### Componentes nuevos
- **KPI / métricas**: `DnzKpiCard`, `DnzKpiInline`, `DnzKpiRow`, `DnzDeltaBadge`, `DnzProgressRhythm`, `DnzTimeComparisonDisplay`.
- **Valores tipados**: `DnzSpanDecimal`, `DnzSpanMoney`, `DnzSpanGigaBytes`, `DnzSpanGrams`, `DnzSpanKV`, `DnzCardKV`.
- **Inputs**: `DnzSearchInput`, `DnzJsonKVEditor`, `DnzTagListEditor`, `DnzDateRangeSelector`, `DnzFileName`, `DnzFileUploaderButton`.
- **Feedback**: `DnzSkeleton`, `DnzStepper`, `DnzStepperStep`, `DnzAvatarInitial`, `DnzFooterPoweredBy`, `DnzDeferredContent`.
- **Stats compuestos**: `DnzStatsDisplay.Item`.

### WindowManager (nuevo)
- `DnzWindowHost`, `DnzWindowManagerService`, `WindowState` — gestor de ventanas flotantes con CSS propio (`dinazen-windows.css`).

### Componentes mejorados
- `DnzDropDown` refactorizado a code-behind dedicado.
- `DnzHtmlEditor` + `DnzHtmlEditorToolbar`: mejoras de UI y estilos.
- `DnzGenericGantt` / `DnzGanttToolBar`: ajustes visuales.
- `DnzDynamicStat`: passthrough de `Variant`; nuevo `DnzDynamicStatTable` y `DnzDynamicStatKpi`.
- `DnzDynamicDocumentView`: soporte de envío por email (`DinaupDocumentEmailRequest`).
- `DnzRowSelector`: clase `compact`, layout responsive, CSS scoped sin deformación.
- `DnzComparisonCardRrhh`: refinamientos CSS.

## 10.14.0.43 — 2026-04-16
- **Fix** `DnzConfirmDialog`: tamaño y scroll correctos cuando se apila sobre otros diálogos.

## 10.14.0.42 — 2026-04-16
- **Fix** `DnzReportView`: la barra de búsqueda se muestra de forma independiente a la visibilidad del título.

## 10.14.0.40 — 2026-04-14
- Mejoras en `DnzFormView`, `DnzFormSelectorRelacionControl`, `DnzFormList`, `DnzContainer`, `DnzFormTab` y `DnzDataGridDropDown`.
- Sin animación de escala en la pestaña de formulario activa.

## 10.14.0.39 — 2026-04-13
- **Fix** `DnzHistoricoDialog`: no se refrescaba tras cargar el histórico.

## 10.14.0.38 — 2026-04-13
- `DnzDynamicDocumentView`: envío por email.

## 10.14.0.37 — 2026-04-12
- `DnzRowSelector` clase `compact`.
- `DnzDynamicStat`: `Variant` passthrough.

## 10.14.0.20 — 2026-04-09
- **Fix** `DnzRowSelector`: CSS scoped, layout responsive, sin deformación en filas compactas.

## CI / Build
- Workflow de NuGet publish (trigger por bump).
- Publicación dual a GitHub Packages y NuGet.org.
- `Dinaup` fijado a versión exacta en el `.csproj`.
