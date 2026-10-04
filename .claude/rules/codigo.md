---
paths:
  - "**/*.cs"
  - "**/*.vb"
  - "**/*.razor"
---

# Reglas de código de Dinaup

Resumen de doc-in: `codigo/donde-va-cada-funcion`, `codigo/no-hacer`, `codigo/reglas-duras`, `codigo/codigo-lineal`, `codigo/client-y-service`, `codigo/dinascript-funciones`, `codigo/yudo` y `codigo/tono-de-voz`. Si algo no cuadra, manda doc-in. No se edita aquí: se cambia en doc-in (`revision/claude/rules`) y se copia a cada repo.

## Antes de cambiar código

- Lee la convención del tema en doc-in y síguela, aunque conozcas otra forma.
- Mide el cambio. Si toca más de 200 líneas, más de un repo o una API pública, o crea un service, es grande: antes de escribir, compara al menos dos enfoques (líneas, ficheros nuevos, qué rompe), enseña la comparación a Angel y espera a que elija.
- Cambio mínimo: solo las líneas que pide la tarea, sin reformatear, renombrar, mover ni arreglar de paso. Lo que veas fuera del encargo se apunta en la entrega. Un PR hace una sola cosa.
- Ante la duda entre la forma sencilla y un service o un refactor, pregunta con las dos: A) sencilla, B) service o refactor, con la recomendada marcada. Mientras no contesten, sigue con la A.
- Al entregar, una línea con las líneas cambiadas y los ficheros nuevos, y por qué hacía falta cada fichero nuevo.
- Lo que rompe o deja a medias tu cambio se arregla en el mismo cambio: tests, pantallas o informes que aún leen lo viejo, otro repo que lo usa, la constante o el comentario que solo servían a lo quitado. No se entrega como aviso ni como «pendiente». En la entrega va solo lo que tiene que hacer o decidir Angel.
- La explicación a Angel se entiende sin abrir el código: primero qué pasa y qué cambia, en palabras corrientes; los nombres internos y los `fichero:línea`, después y aparte.

## Antes de crear una función

- Primero, quién la va a usar ([Dónde va cada función](https://doc-in.dinaup.com/docs/codigo/donde-va-cada-funcion)). Si solo la usa Play, va en Dinaup.Play. El Servidor solo implementa lo que él mismo necesita: ticks, kiosco, registro legal, permisos y escrituras con su lógica. El SDK solo acepta funciones genéricas, las que usaría cualquier integración. En la duda, va en Play.
- Busca si ya existe: en `.claude/sdk-catalogo.md` (el SDK, por el tipo que entra y el que sale) y en este repo (`git grep -n "Function Nombre\|Nombre("`). No puede haber cuatro funciones que hagan lo mismo.
- Si no existe, dilo al entregar: «busqué X y no hay».
- Un formato que crea una parte y lee otra (un token firmado, la firma de una petición) vive entero en el SDK: crear y leer. El Servidor y Play llaman al SDK, sin copia propia.
- Una convención vale igual en todas las entradas: Servidor, SDK y Play; IAQuery, informes, datos2 y Exportar. Se exige una sola forma, no dos, y el SDK la comprueba y lanza error antes de llamar. Un fallo se arregla en todas las entradas, no solo en la que falló.
- Un cálculo de negocio (saldos, horas, importes) se escribe una sola vez, como `CalcularX(entrada)`. Pantallas, pruebas (`/AppTest`), tarjetas y exportaciones lo llaman: ninguna rehace la cuenta.
- Una función nueva de la API del Servidor (`APIFunctionE`) lleva `Public_` si la puede llamar cualquier integración o `Play_` si solo la llama Play. Lo que llega por la petición no cambia.
- Una función corta y sin reglas de negocio no se esconde como `Private Shared` / `private static` en un servicio: va como extensión en `<Servicio>.Extensions.vb`, donde la encuentra quien busque. Si la van a usar varios repos, se propone para el SDK.
- No copies ids de campo (`pr_…`) ni enums de una sección: vienen en el paquete de MyDinaup.
- Un registro de serie (un estado, un método de pago, un tipo) se reconoce por su constante: `id == DemoUp.MyDinaup.Constants.MetodosDePago.DomiciliacionBancaria.Id`. Sin una segunda condición por su tipo o su nombre, y sin cargar el catálogo para buscarlo.
- El NIF y la razón social de un cliente o un proveedor salen de sus datos fiscales predeterminados (`ReferenciaDatosFiscalesPredeterminados`, por ruta), no de la ficha de Entidades. Una venta o una compra ya trae los suyos (`NIFCliente`, `NIFProveedor`).
- Una función de DinaScript (`FuncionDinamicaC` en el Servidor) se describe en inglés: `R.Descripcion` y, en cada `AddParametro`, el nombre que se ve (`Value`, nunca `v1`) y su descripción. Ninguno vacío.
- Algo nuevo en los documentos, el correo o las reglas de DinaScript (una marca, una clave de metadatos, qué prefijo vale dónde) va también a la guía de Yudo en `CopilotoDeCodigo.cs`, en el mismo cambio. Una función nueva no: Yudo la encuentra en el catálogo.

## Código lineal

- Una función larga que se lee de arriba abajo gana a seis pequeñas. La duda se resuelve dejándolo dentro.
- Solo se separa si se usa de verdad desde varios sitios, si es preparación (abrir una conexión) o si el nombre explica una condición de negocio que el cuerpo no.
- Nada de envoltorios de una línea (`Citar(x)`, `Formatear(x)`): la expresión va donde se usa, o en una variable local con nombre.
- Para dar aire a una función larga, comentarios numerados (`// 1. …`), no funciones.
- Solo lo que pide el caso: nada de cálculos ni opciones «por si acaso». Una regla fija del negocio va en el código, no en un interruptor. Un dato que da un tercero no es una regla fija: el sufijo de acreedor que pone el banco en el contrato sigue siendo un campo.
- Primero lo que ya hay: antes de crear un DTO, una función o sus tests, prueba el cambio en la pantalla con lo que ya existe. Rellenar un campo con lo que trae una ficha (`GetRowByIdAsync`, la ruta de la IAQuery) no es un cálculo. Lo mínimo sigue cubriendo todo lo pedido.
- Simplificar es quitar código, no moverlo a otro componente. Antes de decir que algo es más sencillo, se cuentan antes y después líneas, clases, funciones, consultas y bucles, y las cifras van en la entrega. Si solo se ha movido, se dice.
- La firma de un método y cada llamada van enteras en una línea, por largas que salgan.

## Comentarios

- La primera frase dice qué hace, en palabras del negocio y como se lo dirías a quien no ha visto el código: «Crea los turnos de hoy de cada empleado desde su horario».
- Después, solo el porqué que no se ve en el código. Lo que repite el código sobra.
- Sin la historia del cambio (va en el commit), sin mayúsculas para gritar, sin jerga propia y sin personificar.

## C# y VB

- Sin tipos nulables (`DateTime?`, `decimal?`, `Guid?`…) salvo imprescindible: sentinels `DateTime.MinValue`, `0`, `Guid.Empty`, `""`.
- `.STR()` en vez de `.ToString()`; `.INT()`, `.DEC()`, `.BOOL()` para convertir.
- `.IsEmpty()` / `.IsNotEmpty()` para nulos y vacíos. Nunca se niega una: se usa la inversa (`x.IsEmpty()`, no `x.IsNotEmpty() == false` ni `!x.IsNotEmpty()`).
- `x.Eliminado == false` en vez de `!x.Eliminado`.
- Diccionarios con `dic.GetM("clave")` o `dic.GetM("clave", porDefecto)`, nunca `TryGetValue` ni `ContainsKey`.
- Cuerpos de método, propiedad y constructor con llaves y `return`, nunca `=>`. Los lambdas y los `RenderFragment` siguen como están.
- `nameof(Tipo.Campo)` para nombres de propiedad, nunca el texto a mano.
- DTO con sufijo `DTO` (clases, no `record`); enums con sufijo `E`; `Upsert`/`Save`, no `Add` + `Update`.
- En el SDK `Dinaup`, todo lo nuevo en inglés: nombres, parámetros, comentarios, mensajes de excepción y comentarios de los workflows. Lo que ya está en castellano no se traduce de paso.
- El nombre dice la forma y el significado del valor: `cantidadDeUsuariosFacturablesPorLicencia`, no `usuarios` para un diccionario de cantidades.

## Client y Service

- `Client` conecta con una API o una base de datos y no decide nada. `Service` aplica las reglas y llama a los `Client`. Un `Service` no abre conexiones (`new HttpClient()`, `SmtpClient`).
- Se crea con `new` o lo crea el contenedor de DI. Nada de factorías (`XxxFactory`).
- Sin estado en `static` / `Shared`: los servicios y los `Client` se inyectan. Estático solo lo puro: extensiones, constantes y conversiones. Nada de `Instance` junto al registro en DI. No aplica al Servidor, que no tiene contenedor de DI.
- Un servicio por módulo, área o solución RTG, no por sección. Crece en ficheros `Servicio.Tema.ext` (`PymesService.Fiscal.vb`), nunca `.Helpers`, `.Utils` ni `.Varios`.
- Una sola inyección de datos por clase: el agregador `AllService`.
