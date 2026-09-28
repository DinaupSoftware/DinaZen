---
paths:
  - "test/**"
  - "**/*Test*.cs"
  - "**/*.spec.ts"
---

# Tests

Resumen de doc-in: `tests/contra-una-licencia`, `qa/escribir-un-test` y `codigo/donde-va-cada-funcion`. Si algo no cuadra, manda doc-in. No se edita aquí: se cambia en doc-in (`revision/claude/rules`) y se copia a cada repo.

- Se prueba contra una licencia de prueba antes que contra un doble. Una pantalla de play, contra la licencia `playe2e*` de su dominio.
- Sin credenciales, el test falla, o se salta con `Skip.If(…, motivo)` si la ausencia es un estado válido. Nunca `return;`: sería un verde que no comprueba nada.
- Nada de librerías de mocks para algo que da una licencia de prueba.
- El código de producción no se deforma para un test: nada de «solo para tests», ni de pasar una función por parámetro solo para cambiarla.
- Un test no rehace la cuenta que comprueba: llama a la función que la hace (`RRHHService.CalcularSaldoJornada`) y compara con valores fijos.
- Los elementos se localizan por `data-testid`, nunca por texto, rol o clase CSS. Si falta, se añade al fuente de play.
- Se afirma el efecto (el dato cambió), no un estado transitorio (un toast, un esqueleto de carga).
