# Changelog — DinaZen — Marzo 2026

Versiones `10.14.0.11` → `10.14.0.14`.

## Editores nuevos

- `HtmlEditor/DnzHtmlEditor` + `DnzHtmlEditorToolbar` — editor HTML rico con toolbar propia.
- `ImageEditor/DnzImageEditor` + `DnzImageEditorDialog` — editor de imagen integrado.
- Assets: `wwwroot/dinazen-image-editor.js`.

## Window Manager

- `WindowManager/DnzWindow`, `DnzWindowHost`, `DnzWindowManagerService` — actualizaciones del gestor de ventanas flotantes.
- Taskbar: ajustes en `DnzTaskbar.razor.css`, `DnzTaskbarItem.razor.css`.
- Assets: `wwwroot/dinazen-windows.css`, `wwwroot/dinazen-windows.js` actualizados.

## Tools

- Interfaces nuevas: `Services/IDnzImageTool`, `Services/IDnzTextTool` — contratos para herramientas IA de imagen y texto (a implementar por consumidores).

## DinaupFlex

- `DnzFormView` — nuevos parámetros `PreFillValues`, `PreFillList`, `AttachFileId` para rellenar y adjuntar al abrir.
- `DnzRowSelector`, `DnzReportView` — ajustes.
- `DnzDataGridDropDown` — gana su propio `.razor.css`.

## Componentes

- `DnzCardTitle` — rediseñado: fuera el recuadro coloreado del icono, icono directo + label sutil; luego se restaura el tamaño original del título manteniendo el icono sin recuadro.
- `DnzSearchInput`, `DnzSpanDateTime`, `DnzFileUploaderButton` — retoques.

## Instalación

- `Components/Installation/DnzScripts` — actualizado para cargar los nuevos assets.
