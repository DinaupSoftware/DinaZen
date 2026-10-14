---
paths:
  - "**/*.csproj"
  - "**/*.vbproj"
  - "**/RELEASE.md"
---

# Sacar versión

Resumen de doc-in: `infra/releases-versioning/app-release-tracking-logs` y `codigo/no-hacer`. Si algo no cuadra, manda doc-in. No se edita aquí: se cambia en doc-in (`revision/claude/rules`) y se copia a cada repo.

- Antes de sacar una app, mira cada lib propia de la que depende. La que tenga commits de código desde su último commit de versión se publica primero, y la app se pinea a esa versión. Que la app no traiga cambios y sus pins estén en la última versión publicada no basta.
- Antes de subir el pin de una lib propia, compara sus `PackageReference` de terceros con los que fija la app. Si la versión nueva sube uno de major (Radzen.Blazor 11 → 12), ese pin se queda: pregunta a Angel antes de publicar y saca el resto.
- El commit de versión, los pins (`Update package references: …`) y las notas de la release van directos a `main`, como manda la receta. Cualquier otro cambio de código va por PR.
