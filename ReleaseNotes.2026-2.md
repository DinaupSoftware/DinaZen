# Novedades DinaZen — Febrero 2026

Versión **10.14.0.10**.

### Nombres unificados

Todos los componentes pasan a llevar prefijo **`Dnz`**. Si usabas `Banner`, ahora es `DnzBanner`. Mismo patrón para avatars, badges, dropdowns, selectores de fecha, etc.

> ⚠️ **Cambio que puede romper código existente.** Hay que renombrar las referencias.

### DinaupFlex — formularios e informes dinámicos

Llega un paquete entero para construir formularios, informes y documentos generados al vuelo:

- **Formularios** — vistas, inspección, selectores, tabs, controles y botones.
- **Informes** — con filtros tipados (texto, fecha, decimal, booleano, relación, etc.) y vistas (listas, gráficos, resúmenes, top N).
- **Documentos dinámicos** — vista, resultado y envío por email.
- **Anotaciones** — diálogos con redactor moderno.

### Componentes nuevos sueltos

- `DnzEnvBar` — barra para distinguir entornos.
- `DnzJsonKVEditor` — editor clave/valor JSON.
- `DnzFileUploaderButton`, `DnzEmailPreview`, `DnzDataGridDropDown`.

### Arreglos

- Badge `e0` — ya no se veía con texto blanco sobre fondo blanco.
