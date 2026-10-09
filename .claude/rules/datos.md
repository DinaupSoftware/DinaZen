---
paths:
  - "**/*.cs"
  - "**/*.vb"
  - "**/*.razor"
---

# Leer y escribir datos

Resumen de doc-in: `codigo/escribir-datos`, `codigo/leer-db0`, `codigo/dinaupclient`, `codigo/una-consulta-por-pantalla` y `codigo/sql-postgres`. Si algo no cuadra, manda doc-in. No se edita aquí: se cambia en doc-in (`revision/claude/rules`) y se copia a cada repo.

- Un dato de negocio (un historial, un vínculo hecho a mano, una lista que crece, un pendiente) va a una sección de Dinaup. Antes de proponer dónde se guarda, busca si ya hay una sección que sirva. El KV de Dinaup0 (`AllServices.KV`) solo guarda configuración pequeña y preferencias. Lo que ya está en el KV no es modelo: las notas de cada usuario (`NotesService`) son de antes de la regla, y las tareas de «Para hoy» de cada usuario, en su panel, van ahí porque lo eligió Angel (08/10/2026) frente a una sección.
- Alta con `Guid.Empty`, nunca `Guid.NewGuid()`. El id que devuelve el servidor se guarda antes que nada.
- Guarda la respuesta de `RunWriteOperationAsync`. Si `resp.UserError` trae texto, ese texto va a pantalla. `EnsureSuccess()` no lo sustituye.
- Tercer parámetro en `true` salvo en borrados y lotes grandes. Un borrado (`eliminado = "1"`) va con `false`, o con `RunWriteOperationDeleteAsync` / `RowDeleteAsync`.
- Más de 5 registros: `UpDialogs.RunWriteOperationDialogs`. Un lote con campos distintos entre filas revienta (E-4249): o los mismos en todas, o `RunWriteOperationDialogs`, que agrupa por campos.
- No mandes los campos que pone el servidor (`fecha`, `fecham`, `modificado`, `usuarioid`, `ubicacion`…): se borran del envío sin avisar.
- Filtro por referencia vacía: `Guid.Empty.STR()`, nunca `"0"`.
- Para traer volumen, un informe con `LoadAllRowsAsync`. `SectionsD.XxxD.GetRowsAsync` recorta a 500 filas sin avisar.
- Una pantalla lee sus datos en una sola IAQuery sobre la sección de lo que enseña, y lo relacionado llega por ruta: `<idSecciónConsultada>.<campoRelación>.<idSecciónDestino>.<campo>`, encadenable. Un campo suelto va solo; con relación, la ruta empieza por la sección consultada (el SDK lanza error si no). Si una tabla sale con una consulta, nunca dos; si basta un DTO, nunca dos. Lo mismo una acción (fichar, un botón del kiosco): las mínimas lecturas y peticiones. Si al informe del diseñador que lee una pantalla le falta un dato, esa lectura pasa a la IAQuery sobre la sección: no se pide una columna nueva en el informe.
- Una IAQuery devuelve una página: `Limite` de 1 a 30000 (100 si no se dice), y `total` cuenta las filas de esa página. Para leerlo todo, `Pagina` 1, 2, 3… con un orden fijo que acaba en `id`, hasta que una página llega con menos filas que el límite.
- La sección de cada tramo es la que apunta la relación, casi siempre la base (`EntidadesBaseD`, con sus constantes `…BaseES`); la derivada da B-326. El texto principal de un registro es `nombre`.
- Un alias por columna: `AddField(campo, "", alias)`. Los filtros van en el `WHERE` y solo se carga lo que la pantalla usa.
- Sin leer por bloques de ids (`Op = "IN"`, `ids.Chunk(…)`) las fichas a las que apuntan las filas, sin clases ni diccionarios que solo llevan datos de una consulta a otra, y sin rellenar en Play lo que ya rellena un script del Servidor. Nunca el informe de otra sección para cruzar lo que su fila ya trae.
- De DB0 se lee con `QueryListAsync` / `ReadObjectListAsync` y DTO que hereden de `BaseModelConverter`. Nada de trocear a mano el array de `ReadCopy`.
- Un timeout no es un fallo: la escritura pudo entrar. Antes de reintentar, dedupe por clave de negocio.
- El SQL a mano (en el Servidor) se lee de arriba abajo, como se diría en voz alta. Antes de afinar el plan de Postgres (`MATERIALIZED`, `LATERAL` con `OFFSET 0`, varias ramas de `UNION`), busca una forma directa de llegar a los mismos datos.
- En el Servidor, una lectura que aguanta unos segundos de retraso (un historial, unas reglas, un listado) va a la réplica con `QueryRO`. `QueryRW` solo si el resultado decide una escritura que saldría mal con un dato viejo, avanza una marca de agua o lee lo que el usuario acaba de guardar, y el motivo va escrito al lado. El `QueryRW` de al lado no es modelo: casi ninguno lo dice.
