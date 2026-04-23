# Changelog — DinaZen — Febrero 2026

Versiones `10.11.0.6` → `10.14.0.10`.

Mes de normalización de prefijos y aterrizaje de **DinaupFlex** (formularios e informes dinámicos).

## Normalización: prefijo `Dnz`

Todos los componentes sin prefijo pasan a `Dnz*`. Ejemplos:

- `AvatarInitial` → `DnzAvatarInitial`
- `Banner` → `DnzBanner`
- `BadgetAutoColor` → `DnzBadgetAutoColor`
- `CardKV` → `DnzCardKV`, `CardTitle` → `DnzCardTitle`
- `CodeWindow` → `DnzCodeWindow`
- `CountryBadge` → `DnzCountryBadge`
- `DateRangeCard`, `DateRangeSelector`, `DateTimeRangeSelector` → `Dnz*`
- `DeferredContent` → `DnzDeferredContent`
- `DropDown` → `DnzDropDown`
- `EnumDropDown` → `DnzEnumDropDown`
- `FileName` → `DnzFileName`
- `FooterPoweredBy` → `DnzFooterPoweredBy`
- `HealthSection` → `DnzHealthSection`
- `HighlightCode` → `DnzHighlightCode`
- `KpiCard` → `DnzKpiCard`
- `Loader` → `DnzLoader`
- `OfficeDocumentViewer` → `DnzOfficeDocumentViewer`

Regla nueva: **todo componente público lleva `Dnz*`**.

## Componentes nuevos

- `DnzCardBody`.
- `DnzDataGridDropDown`.
- `DnzEmailPreview` + css — preview de email.
- `DnzEnvBar` + css — barra de entorno (dev/staging/prod).
- `DnzFileName.razor.css` — estilos propios.
- `DnzFileUploaderButton`.
- `DnzJsonKVEditor` + css — editor clave/valor JSON.
- `DnzKpiCard.razor.css` — estilos separados.

## DinaupFlex (nuevo)

Primer aterrizaje del subsistema para formularios e informes dinámicos:

### Anotaciones

- `DnzAnnotationsDialog`, `DnzAnotation`, `DnzRedactarModerno`.
- `DinaupAnnotationRequest`.

### Componentes internos

- `DinaupFlex/Components/DnzRowSelector`.

### Documentos dinámicos

- `DnzDynamicDocumentView`, `DnzDynamicDocumentResultView`.
- `DinaupDocumentEmailRequest`.

### Formularios

- `DnzFormView`, `DnzFormByTokenView`, `DnzFormInspectorDialog`.
- `DnzFormConfig`, `DinaupFormResult`, `DnzLiveFormsManager`.
- Selector: `DnzDynamicRowPreviewIMG`, `DnzFormSelectorRelacionControl`.
- Tabs: `DnzFormTab`, `DnzContainer`, `DnzControl`, `DnzButton`.
- Contenedores: `DnzContainerButton`, `DnzFormList`, `DnzFormPrimaryList`, `DnzPrimaryListCell`.

### Informes

- `DnzReportView`.
- Provider: `DnzReportProvider`, `DnzCardList`, `DnzChartView`, `DnzStatusSummary`, `DnzSummaryBar`, `DnzTopN`.
- `ReportColumnMapping`, `ReportContext`.
- **Filtros tipados**: `DnzBadgeFilter`, `DnzBoolFilter`, `DnzDateFilter`, `DnzDateTimeFilter`, `DnzDecimalFilter`, `DnzFilter`, `DnzIntegerFilter`, `DnzPredefinedFilter`, `DnzRelationFilter`, `DnzTextFilter`, `DnzTimeFilter`.

### Respuestas a preguntas

- `DnzResponseQuestions` — respuestas con IA.

## Bugs

- `DnzBadgetAutoColor e0` — texto blanco sobre blanco corregido.

## Build / Deps

- `Meziantou.Analyzer` eliminado de dependencias.
