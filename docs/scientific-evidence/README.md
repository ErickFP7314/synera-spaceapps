# Evidencia científica — botón "What does this mean?" / "¿Qué significa esto?"

Dueño: Biotecnología (Ana y Fidel).

- **Textos que muestra la app (EN/ES):** [`data/reference/indicator-explanations.json`](../../data/reference/indicator-explanations.json). Cubre 10 indicadores × 4 preguntas, con un enlace oficial de NASA HRP por indicador.
- **Reglas y consejos:** [`data/reference/rules.json`](../../data/reference/rules.json).
- **Umbrales y fuentes:** [`contracts/medical-ranges-config.json`](../../contracts/medical-ranges-config.json) (resumen en [`../medical-resources/nasa-clinical-thresholds.md`](../medical-resources/nasa-clinical-thresholds.md)).

## Las 4 preguntas (exigidas por el reto)
1. ¿Qué mide y por qué se mide en el espacio?
2. ¿Qué peligro del vuelo espacial (RIDGE) lo afecta? → enlace a https://www.nasa.gov/hrp/hazards/ y a la página del riesgo HRP correspondiente.
3. ¿Qué es normal para mí y por qué cambió de color? → plantilla con la línea base personal (`q3_template`).
4. ¿Qué hago ahora y cuándo escalo? → consejo + nivel de acción (1–4).

## Cómo editar sin romper la app
- Cambiar **solo los textos** dentro de `"en"` y `"es"`. **No renombrar claves**: `hr_rest_bpm`, `q1`…`q4`, `link`.
- Toda afirmación nueva lleva su fuente en `plan.md` §13, o queda marcada como VERIFICAR y no se muestra.
- Después de editar, correr `cd software && npm test` para confirmar que el JSON sigue siendo válido.
