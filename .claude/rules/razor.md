---
paths:
  - "**/*.razor"
  - "**/*.css"
---

# Pantallas y diálogos de play

Resumen de doc-in: `codigo/reglas-criticas-ui`, `codigo/dialogos-play`, `codigo/desplegables`, `codigo/una-sola-vez` y `codigo/tono-de-voz`. Si algo no cuadra, manda doc-in. No se edita aquí: se cambia en doc-in (`revision/claude/rules`) y se copia a cada repo.

## Componentes

- Radzen y DinaZen, nunca HTML ni CSS propios para lo básico: `RadzenButton`, `DnzSearchInput`, `RadzenDataGrid`, `DnzLoader`, `DnzSpanMoney`, `DnzFileUploaderButton` (nunca `<InputFile>`).
- Un buscador es `DnzSearchInput`, que espera a que se deje de teclear: nunca un `RadzenTextBox` con `@oninput`, `@bind-Value:event="oninput"` o un temporizador.
- Un desplegable con todos los valores de un enum es `DnzEnumDropDown`: la etiqueta sale del propio enum (`[Display]`). Sin una clase ni una lista solo para dar texto a las opciones.
- Cada bloque va en una `DnzCard` titulada con `DnzCardTitle`. Nada suelto sobre el fondo.
- Un enlace a la doc es `AyudaDocU`, el «?» gris de la ayuda: nunca un `RadzenLink` o un `<a>` suelto.
- Un campo va en `RadzenFormField Variant="Variant.Flat"`, que `site.css` pinta sin caja (fondo suave, sin borde): nunca `Outlined`, `Filled` ni `Text`, ni borde o fondo propios. Los formularios dinámicos (`DnzControl`) van aparte.
- Un botón que hace algo con el valor de un campo va aparte, a la derecha del `RadzenFormField`: nunca en su `<End>` o `<Start>`.
- Una acción que cambia datos (conciliar, crear un cobro, borrar) va en un `RadzenButton` con su texto, a la vista: pulsar la tarjeta, la fila o una flecha no escribe.
- Un botón al que le faltan datos va habilitado: al pulsarlo, `NotificationService.Notify` dice qué falta y `return`. `Disabled` solo para lo que el rol o los permisos no dejan.
- `DnzCard`, nunca `RadzenCard`. Una card dentro de otra se pinta sola según su profundidad: sin tocar `Variant`, sombra ni fondo.
- Sin `RadzenStack`: `<div class="d-flex …">` de Bootstrap. Espaciado con `gap-N`, `p-N`, `m-N`, no en `style`.
- Sin code-behind `.razor.cs`: todo en `@code { }`.
- Colores con las variables de Radzen, nunca `#RRGGBB`. Lista vacía: `EmptyListAddButtomCardU`.
- Todo lo que un test toca lleva `data-testid`.

## Listados

- Un filtro de un solo valor es un `DnzInlineDropDown` con `Label` (sin elegir, «País ⌄»; elegido, «País: España ✕»), sin `Multiple` ni `Chips`. Las fechas se filtran con `DnzDateRangeSelector`, no con «Desde» y «Hasta».
- Los filtros caben en una fila: el buscador a la izquierda, con ancho fijo (no `flex:1`), y los desplegables juntos a la derecha, en su `<div class="d-flex … ms-auto">`.
- Las cifras de un listado van en `DnzKpiInline` dentro de su card, no en una fila de `DnzKpiCard`.
- Un texto largo en una lista o una fila va en una línea con «…» (`text-truncate`, con el texto entero en `title`): no salta de línea ni ensancha la página. Su columna se estrecha: `minmax(0, 1fr)` en un grid, no `1fr`; `min-width:0` en un `d-flex`.

## Diálogos: el molde

- El diálogo publica su `OpenAsync` estático y sus `Opciones()`: quien lo abre no pasa medidas.
- Ancho, uno de seis: `min(95%, 1806px)` denso, `min(96%, 1200px)` grande, `min(96%, 1100px)` formulario, `min(95%, 900px)` columna, `min(95%, 700px)` simple, `min(95%, 480px)` confirmación.
- Alto: `AltoAuto=true` en la maqueta y `Height = null` en las opciones. Una ventana que abre sin alto y sin `AltoAuto=true` se queda en 150 px, el mínimo de Radzen. Un alto fijo lleva un comentario con el motivo.
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
- Un texto público (la doc, la ayuda de una ventana, una nota de versión) explica solo Dinaup, lo más corto posible: lo que Dinaup da o pide para llevarlo a otra herramienta, no cómo funciona esa herramienta. Sin infraestructura interna ni historia de versiones.
- Lo justo en pantalla: sin claves internas, límites del sistema ni notas que explican la ventana; sin pestañas si todo cabe; crear es un «+» en el `DnzCardTitle`; nada que ya esté en el panel del diseñador o en el menú del botón derecho.
