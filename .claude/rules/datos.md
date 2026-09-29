---
paths:
  - "**/*.cs"
  - "**/*.vb"
  - "**/*.razor"
---

# Leer y escribir datos

Resumen de doc-in: `codigo/escribir-datos`, `codigo/leer-db0` y `codigo/dinaupclient`. Si algo no cuadra, manda doc-in. No se edita aquí: se cambia en doc-in (`revision/claude/rules`) y se copia a cada repo.

- Un dato de negocio (un historial, un vínculo hecho a mano, una lista que crece) va a una sección de Dinaup. El KV de Dinaup0 (`AllServices.KV`) solo guarda configuración pequeña y preferencias.
- Alta con `Guid.Empty`, nunca `Guid.NewGuid()`. El id que devuelve el servidor se guarda antes que nada.
- Guarda la respuesta de `RunWriteOperationAsync`. Si `resp.UserError` trae texto, ese texto va a pantalla. `EnsureSuccess()` no lo sustituye.
- Tercer parámetro en `true` salvo en borrados y lotes grandes. Un borrado (`eliminado = "1"`) va con `false`, o con `RunWriteOperationDeleteAsync` / `RowDeleteAsync`.
- Más de 5 registros: `UpDialogs.RunWriteOperationDialogs`. Un lote con campos distintos entre filas revienta (E-4249): o los mismos en todas, o `RunWriteOperationDialogs`, que agrupa por campos.
- No mandes los campos que pone el servidor (`fecha`, `fecham`, `modificado`, `usuarioid`, `ubicacion`…): se borran del envío sin avisar.
- Filtro por referencia vacía: `Guid.Empty.STR()`, nunca `"0"`.
- Para traer volumen, un informe con `LoadAllRowsAsync`. `SectionsD.XxxD.GetRowsAsync` recorta a 500 filas sin avisar.
- Un módulo lee su sección y los registros a los que apunta su fila. Nunca el informe de otra sección para cruzar lo que su fila ya trae.
- De DB0 se lee con `QueryListAsync` / `ReadObjectListAsync` y DTO que hereden de `BaseModelConverter`. Nada de trocear a mano el array de `ReadCopy`.
- Un timeout no es un fallo: la escritura pudo entrar. Antes de reintentar, dedupe por clave de negocio.
