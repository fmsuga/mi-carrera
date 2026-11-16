# Verificación de la Entrega 1

Fecha: 16 de noviembre de 2026. Entorno: Node.js 24 y Microsoft Edge con Playwright, en un contexto aislado.

- `npm test`: **17 pruebas aprobadas**, sin fallos.
- `node scripts/run-browser-qa.mjs`: **29 comprobaciones aprobadas**, sin errores JavaScript. Resultado detallado: [browser-qa.json](browser-qa.json).
- Responsive: Inicio, Materias y Configuración a **1920, 1440, 1280, 768 y 390 px**, sin desbordes horizontales.
- Revisión visual: dashboard, materias y configuración en desktop y mobile, más favicon rasterizado a 16 px.
- Migración: copia exacta anterior y agregado determinista de IDs; notas, propiedades y requisitos se conservan. Se probó idempotencia y bloqueo seguro ante fallos.
- Persistencia: cambios disponibles al reabrir la página y sincronización entre dos pestañas reales; ninguna prueba accedió al origen publicado del usuario.
- Actualizaciones inmediatas: promedio, porcentajes, próximos exámenes, correlativas y requisitos de 40%/70%, incluidos desbloqueo y reversión.
- Importación: rechazo de esquemas inválidos; confirmación explícita obligatoria; copia previa descargable; fallo de cuota no sustituye registros.
- Accesibilidad: campos identificados, navegación por teclado, foco dentro del diálogo, Escape para cerrar y restauración del foco.
- Recursos: respuestas HTTP 200 para SVG, PNG, iconos móviles, manifest, CSS y módulos bajo `/mi-carrera/`. Navegación por fragmentos compatible con hosting estático.
- `git diff --check`: sin errores de formato.

Las capturas contienen **datos de prueba**, generados exclusivamente por el runner; la aplicación no incorpora datos ficticios ni estados precargados.

No se publicó en GitHub Pages: la comprobación de rutas reproduce el prefijo localmente. La verificación de una nueva publicación real queda para cuando el propietario autorice publicar.

No se implementaron ni probaron backend, autenticación remota, webhook, comandos de Telegram o avisos programados. La Entrega 2 está limitada a la evaluación solicitada.
