# Verificación de la Entrega 1

Fecha: 16 de noviembre de 2026. Entorno: Node.js 24 y Microsoft Edge con Playwright, en un contexto aislado.

- `npm test`: **28 pruebas aprobadas**, sin fallos.
- `node scripts/run-browser-qa.mjs`: **76 comprobaciones aprobadas**, sin errores JavaScript. Resultado detallado: [browser-qa.json](browser-qa.json).
- Responsive: Inicio, Materias y Configuración a **1920, 1440, 1280, 768 y 390 px**, sin desbordes horizontales.
- Revisión visual: dashboard, materias y configuración en desktop y mobile, más favicon rasterizado a 16 px.
- Migración: copia exacta anterior y agregado determinista de IDs; notas, propiedades y requisitos se conservan. Se probó idempotencia y bloqueo seguro ante fallos.
- Persistencia: cambios disponibles al reabrir la página y sincronización entre dos pestañas reales; ninguna prueba accedió al origen publicado del usuario.
- Actualizaciones inmediatas: promedio, porcentajes, próximos exámenes, correlativas y requisitos de 40%/70%, incluidos desbloqueo y reversión.
- Importación: rechazo de esquemas inválidos; confirmación explícita obligatoria; copia previa descargable; fallo de cuota no sustituye registros.
- Accesibilidad: campos identificados, navegación por teclado, foco dentro del diálogo, Escape para cerrar y restauración del foco.
- Recursos: respuestas HTTP 200 para SVG, PNG, iconos móviles, manifest, CSS y módulos bajo `/mi-carrera/`. Navegación por fragmentos compatible con hosting estático.
- Revisión visual adicional: sin recuadros numerados, abreviaturas, barras laterales o pills redundantes; cuatrimestres alineados en desktop y buscador mobile con ancho útil.
- Hero card: una sola superficie sin tarjetas internas; porcentaje, promedio, materias y horas verificados con datos conocidos y contenidos dentro de la card en los cinco anchos.
- Acabados: degradado del anillo y luz ambiental estática; entradas finitas de anillo y barras que terminan en el valor real y no se reinician por navegación o cambios ajenos al progreso. Ningún efecto modifica los registros académicos.
- Movimiento reducido: sin entradas, transiciones ni animación de la celebración; porcentaje real visible inmediatamente. Se verificó en desktop y mobile.
- Hitos: cruces reales de 40% y 70% mediante aprobación, aviso breve sin bloqueo, historial independiente persistido y celebración únicamente en la pestaña de origen. Recargar, revertir y volver a cruzar, importar o migrar no repite ni dispara celebraciones.
- Historial de hitos: pruebas de equivalencias, umbrales exactos, requisitos históricos, coordinación entre pestañas, cuota y registro ilegible. Un fallo de este registro de presentación no afecta a los datos académicos.
- Header sin porcentaje duplicado; explicación del cálculo y ausencia de certificación oficial accesibles en un desplegable que conserva su apertura después de actualizar el estado.
- Ajustes puntuales: detalle desktop a ancho completo sin alterar las alturas de los cuatrimestres; detalle inline y grupos de acciones separados en mobile; contador condicional; título Copias de seguridad.
- Navegación: recupera la posición de lectura por vista y abre el año con cursadas activas.
- Fuentes locales cargadas correctamente; ninguna solicitud de la aplicación a servicios externos.
- `git diff --check`: sin errores de formato.

Las capturas contienen **datos de prueba**, generados exclusivamente por el runner; la aplicación no incorpora datos ficticios ni estados precargados.

No se publicó en GitHub Pages: la comprobación de rutas reproduce el prefijo localmente. La verificación de una nueva publicación real queda para cuando el propietario autorice publicar.

No se implementaron ni probaron backend, autenticación remota, webhook, comandos de Telegram o avisos programados. La Entrega 2 continúa completamente en standby; su evaluación previa se conserva.

Las capturas se actualizaron para esta iteración visual a 1920, 1440, 1280 y 390 px. La entrega queda preparada para revisión del propietario, sin push ni despliegue.

La estructura aceptada de Inicio se conserva. Se regeneraron las doce capturas principales, incluido el header actualizado en Materias y Configuración. Se agregaron dos ejemplos de celebraciones con datos de prueba específicos; no son estados precargados ni datos del sitio publicado.
