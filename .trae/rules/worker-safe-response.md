# Robustez del Worker
- Todos los endpoints deben usar `try/catch` global.
- El Worker debe retornar SIEMPRE un objeto JSON, incluso en errores.
- Formato de error: `{ "success": false, "error": "mensaje detallado" }`.
- No enviar respuestas en texto plano o HTML.