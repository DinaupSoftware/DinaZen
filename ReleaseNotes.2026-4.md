# Novedades DinaZen — Abril 2026

Versión **10.15.0.2**.

### Componentes nuevos
- **KPIs completos**: `DnzKpiCard`, `DnzKpiRow`, `DnzDeltaBadge`, `DnzProgressRhythm` para dashboards.
- **Valores visuales**: `DnzSpanMoney`, `DnzSpanDecimal`, `DnzSpanGigaBytes`, `DnzSpanGrams`, `DnzCardKV`.
- **Inputs**: buscador (`DnzSearchInput`), editor JSON clave-valor, selector de rango de fechas, etiquetas, archivos.
- **Feedback**: `DnzSkeleton`, `DnzStepper`, `DnzAvatarInitial`.
- **Ventanas flotantes** con el nuevo `DnzWindowManager`.

### Mejoras
- Envío por **email** desde `DnzDynamicDocumentView`.
- `DnzRowSelector` con modo compacto y sin deformaciones.
- `DnzDynamicStat` admite `Variant`.
- Editor HTML y Gantt más pulidos.

### Arreglos
- `DnzConfirmDialog`: tamaño y scroll correctos cuando se apila sobre otros diálogos.
- `DnzHistoricoDialog` ahora refresca al cargar el histórico.
- `DnzReportView`: buscador independiente del título.

### Distribución
- Publicación dual en **NuGet.org** y **GitHub Packages**.
