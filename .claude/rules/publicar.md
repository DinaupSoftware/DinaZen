---
paths:
  - "**/*.csproj"
  - "**/*.vbproj"
  - "**/RELEASE.md"
---

# Sacar versión

Resumen de doc-in: `infra/releases-versioning/app-release-tracking-logs` y `codigo/no-hacer`. Si algo no cuadra, manda doc-in. No se edita aquí: se cambia en doc-in (`revision/claude/rules`) y se copia a cada repo.

- Un hilo de tarea no saca versión ni se ofrece a hacerlo («Si quieres, lo saco yo»): su entrega dice qué queda por publicar y en qué orden, y lo saca Deploy. Se publica solo cuando Angel lo pide en ese momento («publica demoup tu», «saca play y servidor»).
- Un PR que depende de una librería aún sin publicar se fusiona cuando Angel lo pide: no se deja en borrador esperando la versión, y el hilo no vuelve luego a subir el pin. La versión y el pin los saca Deploy.
- Antes de sacar una app, mira cada lib propia de la que depende. La que tenga commits de código desde su último commit de versión se publica primero, y la app se pinea a esa versión. Que la app no traiga cambios y sus pins estén en la última versión publicada no basta.
- Antes de subir el pin de una lib propia, compara sus `PackageReference` de terceros con los que fija la app. Si la versión nueva sube uno de major (Radzen.Blazor 11 → 12), ese pin se queda: pregunta a Angel antes de publicar y saca el resto.
- Las libs propias llegan a las apps por GitHub Packages: al publicar en cadena no se consulta ni se espera a nuget.org, aunque la lib se publique también allí, ni para lanzar una lib ni para relanzarla. Tampoco con DinaZen, cuyo CI no lee DemoUp.MyDinaup de GitHub Packages, ni aunque una memoria diga lo contrario.
- El commit de versión, los pins (`Update package references: …`) y las notas de la release van directos a `main`, como manda la receta. Cualquier otro cambio de código va por PR.
