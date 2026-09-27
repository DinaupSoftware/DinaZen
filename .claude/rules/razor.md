---
paths:
  - "**/*.razor"
  - "**/*.css"
---

# Pantallas y diálogos de play

Resumen de doc-in: `codigo/reglas-criticas-ui`, `codigo/dialogos-play`, `codigo/una-sola-vez` y `codigo/tono-de-voz`. Si algo no cuadra, manda doc-in. No se edita aquí: se cambia en doc-in (`revision/claude/rules`) y se copia a cada repo.

## Componentes

- Radzen y DinaZen, nunca HTML ni CSS propios para lo básico: `RadzenButton`, `DnzSearchInput`, `RadzenDataGrid`, `DnzLoader`, `DnzSpanMoney`, `DnzFileUploaderButton` (nunca `<InputFile>`).
- Cada bloque va en una `DnzCard` titulada con `DnzCardTitle`. Nada suelto sobre el fondo.
- `DnzCard`, nunca `RadzenCard`. Una card dentro de otra se pinta sola según su profundidad: sin tocar `Variant`, sombra ni fondo.
- Sin `RadzenStack`: `<div class="d-flex …">` de Bootstrap. Espaciado con `gap-N`, `p-N`, `m-N`, no en `style`.
- Sin code-behind `.razor.cs`: todo en `@code { }`.
- Colores con las variables de Radzen, nunca `#RRGGBB`. Lista vacía: `EmptyListAddButtomCardU`.
- Todo lo que un test toca lleva `data-testid`.

## Diálogos: el molde

- El diálogo publica su `OpenAsync` estático y sus `Opciones()`: quien lo abre no pasa medidas.
- Ancho, uno de seis: `min(95%, 1806px)` denso, `min(96%, 1200px)` grande, `min(96%, 1100px)` formulario, `min(95%, 900px)` columna, `min(95%, 700px)` simple, `min(95%, 480px)` confirmación. Alto: `AltoAuto=true` y `Height = null`.
- `CloseDialogOnOverlayClick = true` en consultas; `false` con comentario en formularios.
- Mientras lee: `IsLoading=@cargando` (nace en `true`) y el fallo en `ErrorText`, con `OnRetry` si reintentar sirve. Nunca `@if (x == null) return;`.
- «Aceptar» no aparece hasta que la lectura acaba bien.

## El pie

- `[acciones propias]  Aceptar  Cancelar`. Solo «Cerrar» si la ventana no confirma nada.
- Nunca «Guardar», «Crear» ni «Confirmar» en el botón que confirma; nunca «Cerrar» junto a un «Aceptar».
- Mientras guarda, `IsBusy=@guardando` y nada más: sin `BusyText`, el rótulo no cambia.

## Una sola escritura

- El método que guarda empieza con `if (guardando) return;`, antes de todo `await`, y libera el flag en `finally`. `IsBusy` solo pinta.
- Un evento por acción: nunca `@onkeydown` y `@onkeypress` al mismo método. Cuidado con `RadzenTemplateForm Submit=` y `Key == "Enter"`: no tienen el cerrojo del botón.
- Nada de handlers `void` con `Task.Run(...)` en un `Click=`: `async Task` y `await`.
- La ventana se cierra una vez: un segundo `DialogService.Close()` cierra la de debajo. Un cierre propio lleva su flag.

## Textos

- Tono de Cloudflare sin historias: frases cortas, voz activa, el siguiente paso.
- El título de una notificación dice qué ha pasado: «No se han guardado los cambios», no «Ups», «Genial» ni «Aviso».
- Sin jerga del modelo de datos en pantalla («registro», «criterio»).
