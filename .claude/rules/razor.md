---
paths:
  - "**/*.razor"
  - "**/*.css"
---

# Pantallas y diálogos de play

Resumen de doc-in: `codigo/reglas-criticas-ui`, `codigo/dialogos-play`, `codigo/desplegables`, `codigo/una-sola-vez` y `codigo/tono-de-voz`. Si algo no cuadra, manda doc-in. No se edita aquí: se cambia en doc-in (`revision/claude/rules`) y se copia a cada repo.

## Antes de escribir

- Una ventana nueva, una pieza de pantalla nueva, un correo nuevo o un rediseño se enseñan antes en una previa: una página HTML con el CSS de play, que se pueda tocar, con lo que hay ahora y una o dos propuestas, la recomendada marcada. Lo que hay se calca de la pantalla de verdad, de su `.razor` y su CSS (colores, bordes, medidas), no de una imitación, y lo que propone tampoco se sale del estilo de play: un estilo que no sale de ningún color de play no es una propuesta. Una propuesta contada en un texto no es una previa. La de un correo es el correo en HTML, maquetado como llegará, no un texto plano. El código espera a que Angel elija. Rehacer una pantalla que no le gusta («mucho texto») también es un rediseño, aunque el encargo diga «abre un PR»: ni código ni PR antes de que elija.

## Componentes

- Radzen y DinaZen, nunca HTML ni CSS propios para lo básico: `RadzenButton`, `DnzSearchInput`, `RadzenDataGrid`, `DnzLoader`, `DnzSpanMoney`, `DnzFileUploaderButton` (nunca `<InputFile>`).
- Antes de escribir CSS o un componente, mira lo que ya pinta eso (`site.css`, un componente de DinaZen o de play). Si le falta algo, se le añade un parámetro (`CuentaChapaU` con `ConTitulo`): no se redibuja en el `.razor.css` de la pantalla. Una maqueta de hace días se repasa contra los controles de hoy antes de codificarla.
- Un fondo en play va con `var(--play-fondo-sutil)`, `var(--play-fondo-marcado)` o `var(--play-fondo-hundido)`, que cambian con el tema: de fondo, `--rz-base-50` a `-300` dan un parche casi blanco en oscuro. Una raya, `var(--rz-border-color)`.
- Un icono se elige en el buscador de iconos de play (`IconSearchU`, o `UpDialogs.SeleccionarIconoAsync`), con un botón que enseña el elegido: nunca en una casilla donde se escribe su nombre.
- Un buscador es `DnzSearchInput`, que espera a que se deje de teclear: nunca un `RadzenTextBox` con `@oninput`, `@bind-Value:event="oninput"` o un temporizador.
- Un desplegable con todos los valores de un enum es `DnzEnumDropDown`: la etiqueta sale del propio enum (`[Display]`). Sin una clase ni una lista solo para dar texto a las opciones.
- Cada bloque va en una `DnzCard` titulada con `DnzCardTitle`. Nada suelto sobre el fondo.
- Un enlace a la doc es `AyudaDocU`, el «?» gris de la ayuda: nunca un `RadzenLink` o un `<a>` suelto.
- Un campo va en `RadzenFormField Variant="Variant.Flat"`, que `site.css` pinta sin caja (fondo suave, sin borde): nunca `Outlined`, `Filled` ni `Text`, ni borde o fondo propios. Los formularios dinámicos (`DnzControl`) van aparte.
- Un botón que hace algo con el valor de un campo va aparte, a la derecha del `RadzenFormField`: nunca en su `<End>` o `<Start>`.
- Una acción que cambia datos (conciliar, crear un cobro, borrar) no se dispara al pulsar la tarjeta, la fila o una flecha: va en un `RadzenButton` con su texto, a la vista, o la tarjeta abre una ventana que enseña lo que se va a hacer y lo confirma en su pie.
- Un botón al que le faltan datos va habilitado: al pulsarlo, `NotificationService.Notify` dice qué falta y `return`. `Disabled` solo para lo que el rol o los permisos no dejan.
- `DnzCard`, nunca `RadzenCard`. Una card dentro de otra se pinta sola según su profundidad: sin tocar `Variant`, sombra ni fondo.
- Sin `RadzenStack`: `<div class="d-flex …">` de Bootstrap. Espaciado con `gap-N`, `p-N`, `m-N`, no en `style`.
- Sin code-behind `.razor.cs`: todo en `@code { }`.
- Colores con las variables de Radzen, nunca `#RRGGBB`. Lista vacía: `EmptyListAddButtomCardU`.
- Todo lo que un test toca lleva `data-testid`.
- Lo que se lee va en orden de lectura: el principio (la ruta, el contexto) arriba a la izquierda y el final (el dato) abajo a la derecha. En el selector de datos relacionados, la ruta arriba y el nombre del dato debajo.

## Listados

- Un filtro de un solo valor es un `DnzInlineDropDown` con `Label` (sin elegir, «País ⌄»; elegido, «País: España ✕»), sin `Multiple` ni `Chips`. Las fechas se filtran con `DnzDateRangeSelector` y sus presets: ni «Desde» y «Hasta», ni botones de periodo («Este mes», «5 min», «1 h») hechos a mano, tampoco junto al rango. El periodo que falta se añade a los presets en DinaZen (los últimos minutos y horas, con `ShortRanges=true`).
- Los filtros caben en una fila: el buscador a la izquierda, con ancho fijo (no `flex:1`), y los desplegables juntos a la derecha, en su `<div class="d-flex … ms-auto">`.
- Las cifras de un listado van en `DnzKpiInline` dentro de su card, no en una fila de `DnzKpiCard`.
- Un texto largo en una lista o una fila va en una línea con «…» (`text-truncate`, con el texto entero en `title`): no salta de línea ni ensancha la página. Su columna se estrecha: `minmax(0, 1fr)` en un grid, no `1fr`; `min-width:0` en un `d-flex`.
- Lo que hay que leer para decidir se ve sin pasar el ratón. El «…» con `title` es para las filas; en la ventana que confirma o compara una cosa, su texto va entero aunque salte de línea (`text-break`). Las marcas que se comprueban (lo que la IA leyó en un PDF) salen siempre, y un botón las oculta si estorban. Lo que solo explica una cifra que se ve (qué mide, con qué se compara) sí va en su `title`.

## Diálogos: el molde

- Lo que el usuario pide ver desde una fila o un botón (un log, un detalle) se abre en un diálogo, donde está mirando: no en un panel arriba de la página que obliga a subir con el scroll.
- El diálogo publica su `OpenAsync` estático y sus `Opciones()`: quien lo abre no pasa medidas.
- Ancho, uno de seis: `min(95%, 1806px)` denso, `min(96%, 1200px)` grande, `min(96%, 1100px)` formulario, `min(95%, 900px)` columna, `min(95%, 700px)` simple, `min(95%, 480px)` confirmación.
- Alto: `AltoAuto=true` en la maqueta y `Height = null` en las opciones. Una ventana que abre sin alto y sin `AltoAuto=true` se queda en 150 px, el mínimo de Radzen. Un alto fijo lleva un comentario con el motivo.
- Un solo scroll, en la ventana y en la página: si el cuerpo scrolla, nada de dentro scrolla por su cuenta; si una lista o un editor scrollan por dentro, el cuerpo no. En la ventana, `ContentStyle="overflow:hidden"`; en la página, el `RadzenBody` con `position:relative; overflow:hidden` y lo de dentro con `position:absolute; inset:0`, como /App/Chat. Nunca un alto restado a ojo como `calc(100vh - 160px)`. Se mira en pantalla con la lista llena y la ventana baja; si no se ha podido, la entrega lo dice.
- `CloseDialogOnOverlayClick = true` en consultas; `false` con comentario en formularios.
- Mientras lee: `IsLoading=@cargando` (nace en `true`) y el fallo en `ErrorText`, con `OnRetry` si reintentar sirve. Nunca `@if (x == null) return;`.
- «Aceptar» no aparece hasta que la lectura acaba bien.

## El pie

- `[acciones propias]  Aceptar  Cancelar`. Solo «Cerrar» si la ventana no confirma nada.
- Nunca «Guardar», «Crear» ni «Confirmar» en el botón que confirma; nunca «Cerrar» junto a un «Aceptar».
- Mientras guarda, `IsBusy=@guardando` y nada más: sin `BusyText`, el rótulo no cambia.

## Una sola escritura

- El método que guarda empieza con `if (guardando) return;`, antes de todo `await`, y libera el flag en `finally`, aunque hoy nada de dentro lance. `IsBusy` solo pinta.
- Un evento por acción: nunca `@onkeydown` y `@onkeypress` al mismo método. Cuidado con `RadzenTemplateForm Submit=` y `Key == "Enter"`: no tienen el cerrojo del botón.
- Nada de handlers `void` con `Task.Run(...)` en un `Click=`: `async Task` y `await`.
- La ventana se cierra una vez: un segundo `DialogService.Close()` cierra la de debajo. Un cierre propio lleva su flag.

## Textos

- Tono de Cloudflare sin historias: frases cortas, voz activa, el siguiente paso. Se dice el hecho, sin una frase que lo anuncie («Parece una ventaja, pero no lo es»).
- Un título dice qué hay, en palabras corrientes y sin metáforas ni coloquialismos: «Vencimientos», no «Lo que arde».
- El título de una notificación dice qué ha pasado: «No se han guardado los cambios», no «Ups», «Genial» ni «Aviso». Lo que ha pasado de verdad: «No se ha calculado a tiempo», no una causa que no sabes si es cierta («Hay mucho tráfico»).
- Un consejo o un aviso dicen qué hacer («Pide solo lo que ha cambiado desde la última vez», «Si recibes un 429, espera lo que indica Retry-After»): no se justifican con cómo está montado Dinaup («La API la comparten todas las empresas»). Un aviso cuenta una sola cosa; si hay varias, cada una va en su línea, con su acción.
- Una opción de un menú o un botón que cambia algo dice qué le pasa a lo que el usuario tiene en marcha: «Moverla físicamente (reinicia)», «Apuntar a donde está (no reinicia)».
- Un botón o una opción dice qué es con palabras: «Pase 1», no «1».
- Sin jerga del modelo de datos en pantalla («criterio», `DataFlow`). Lo que agrupa campos en el diseñador de Flex es un «contenedor», nunca un «marco».
- Un texto público (la doc, la ayuda de una ventana, una nota de versión) explica solo Dinaup, lo más corto posible: lo que Dinaup da o pide para llevarlo a otra herramienta, no cómo funciona esa herramienta. Sin infraestructura interna ni historia de versiones.
- Un vídeo y su descripción se despiden solo con «Pruébalo en dinaup.com»: sin mandar a otro dominio (go.dinaup.com) ni pedir que se suscriban. El vídeo se enseña primero en la web, con su voz, y el mp4 se saca con el visto bueno de Angel. El guion es para quien no sabe nada: cada concepto antes de usarlo, de uno en uno y con un ejemplo, salvo lo que su público ya sabe (un vídeo para contables no cuenta qué es un asiento). Acaba en lo útil, sin frase de anuncio ni fecha («hoy», «novedad»). El título dice exactamente lo que cubre. Las ventanas que se dibujan son de Windows, y se dice «límite de ritmo» y «límite de tiempo», no «timeout». Play se dibuja calcado de sus `.razor` y su CSS (la cabecera con el logo de Dinaup, su barra y el menú de cada app), y cada app lleva su rótulo de Play: «Recursos Humanos», no «Personal». Calcado no es copiado entero: solo lo que la voz usa; lo demás, en rayas, y al señalar algo se apaga el resto. Un tutorial sigue un solo ejemplo, sin remitir a otro vídeo; su título empieza por «Cómo…» y la primera frase dice qué vas a ver y con qué ejemplo. Cada gesto, su frase y su pausa. En un tutorial se cuenta cada clic que guarda o abre otra ventana. Lo que Play hace solo se dice sin personificar: «queda seleccionado», no «la ventana elige». Lo que la voz dice de una pantalla es verdad en Play, y lo opcional se dice opcional; un desfase de unos minutos no se cuenta (el banco va «en tiempo real» aunque se sincronice cada 5 minutos). Un vídeo enseña su tema por el camino más sencillo: lo que no es el tema (una ayuda opcional que añade pasos, un aviso que no toca) se quita, aunque sea verdad. Dos temas son dos vídeos, y cómo se configura algo es otro. Lo que vale para todos los registros se dice, aunque se enseñe en uno. En un reel de captación, el gancho nombra al empezar la pérdida que evita, si quien mira la reconoce, y dice de qué habla («el PDF de tus facturas», no «el PDF»); su primer fotograma se entiende sin pausarlo. La voz lleva emoción y suena a la misma persona de principio a fin. Un sonido cuenta lo que se ve (tres filas, tres golpes), y de lo que Angel elige queda solo lo elegido: las demás tomas se borran. La portada y la miniatura, sin píldoras ni iconos con fondo.
- Lo justo en pantalla: sin claves internas, límites del sistema ni notas que explican la ventana; sin pestañas si todo cabe; crear es un «+» en el `DnzCardTitle`; un dato sale una vez por pantalla: la cabecera no destaca lo que ya está en las cifras de debajo, y nada repite el panel del diseñador o el menú del botón derecho; ninguna card sin nada que enseñar en ese caso, tampoco con una nota de dónde se configura. Un campo que no se puede cambiar enseña lo que le aplica, con su valor y sin dejar cambiarlo.
- Una cifra lleva su rótulo y nada debajo: una frase que dice qué mide o qué pasa al llegar al tope satura, y más repetida en cada tarjeta. Si hace falta, va en el `title` de la cifra. Lo secundario (lo que está en curso, el pico) va más pequeño.
