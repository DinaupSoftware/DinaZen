---
paths:
  - "**/*.cs"
  - "**/*.vb"
  - "**/*.razor"
---

# Reglas de código de Dinaup

Resumen de doc-in: `codigo/no-hacer`, `codigo/reglas-duras`, `codigo/codigo-lineal` y `codigo/client-y-service`. Si algo no cuadra, manda doc-in. No se edita aquí: se cambia en doc-in (`revision/claude/rules`) y se copia a cada repo.

## Antes de crear una función

- Busca si ya existe: en `.claude/sdk-catalogo.md` (el SDK, por el tipo que entra y el que sale) y en este repo (`git grep -n "Function Nombre\|Nombre("`). No puede haber cuatro funciones que hagan lo mismo.
- Si no existe, dilo al entregar: «busqué X y no hay».
- Una función corta y sin reglas de negocio no se esconde como `Private Shared` / `private static` en un servicio: va como extensión en `<Servicio>.Extensions.vb`, donde la encuentra quien busque. Si la van a usar varios repos, se propone para el SDK.
- No copies ids de campo (`pr_…`) ni enums de una sección: vienen en el paquete de MyDinaup.

## Código lineal

- Una función larga que se lee de arriba abajo gana a seis pequeñas. La duda se resuelve dejándolo dentro.
- Solo se separa si se usa de verdad desde varios sitios, si es preparación (abrir una conexión) o si el nombre explica una condición de negocio que el cuerpo no.
- Nada de envoltorios de una línea (`Citar(x)`, `Formatear(x)`): la expresión va donde se usa, o en una variable local con nombre.
- Para dar aire a una función larga, comentarios numerados (`// 1. …`), no funciones.
- La firma de un método y cada llamada van enteras en una línea, por largas que salgan.

## C# y VB

- Sin tipos nulables (`DateTime?`, `decimal?`, `Guid?`…) salvo imprescindible: sentinels `DateTime.MinValue`, `0`, `Guid.Empty`, `""`.
- `.STR()` en vez de `.ToString()`; `.INT()`, `.DEC()`, `.BOOL()` para convertir.
- `.IsEmpty()` / `.IsNotEmpty()` para nulos y vacíos. Nunca se niega una: se usa la inversa (`x.IsEmpty()`, no `x.IsNotEmpty() == false` ni `!x.IsNotEmpty()`).
- `x.Eliminado == false` en vez de `!x.Eliminado`.
- Diccionarios con `dic.GetM("clave")` o `dic.GetM("clave", porDefecto)`, nunca `TryGetValue` ni `ContainsKey`.
- Cuerpos de método, propiedad y constructor con llaves y `return`, nunca `=>`. Los lambdas y los `RenderFragment` siguen como están.
- `nameof(Tipo.Campo)` para nombres de propiedad, nunca el texto a mano.
- DTO con sufijo `DTO` (clases, no `record`); enums con sufijo `E`; `Upsert`/`Save`, no `Add` + `Update`.
- El nombre dice la forma y el significado del valor: `cantidadDeUsuariosFacturablesPorLicencia`, no `usuarios` para un diccionario de cantidades.

## Client y Service

- `Client` conecta con una API o una base de datos y no decide nada. `Service` aplica las reglas y llama a los `Client`. Un `Service` no abre conexiones (`new HttpClient()`, `SmtpClient`).
- Se crea con `new` o lo crea el contenedor de DI. Nada de factorías (`XxxFactory`).
- Sin estado en `static` / `Shared`: los servicios y los `Client` se inyectan. Estático solo lo puro: extensiones, constantes y conversiones. Nada de `Instance` junto al registro en DI. No aplica al Servidor, que no tiene contenedor de DI.
- Un servicio por módulo, área o solución RTG, no por sección. Crece en ficheros `Servicio.Tema.ext` (`PymesService.Fiscal.vb`), nunca `.Helpers`, `.Utils` ni `.Varios`.
- Una sola inyección de datos por clase: el agregador `AllService`.
