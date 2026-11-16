# Verificación del plan corregido

Entorno: Node.js 24 y Microsoft Edge con Playwright, exclusivamente en contextos locales aislados. No se abrió ni modificó el perfil del sitio publicado.

- **35 pruebas aprobadas** de dominio, almacenamiento e historial de hitos.
- **99 comprobaciones de navegador aprobadas**, sin errores JavaScript ni solicitudes externas. [Resultado detallado](browser-qa.json).
- Plan activo: 22 asignaturas, 2.044 horas y tres años de 7, 7 y 8 asignaturas. Inglés se mantiene como tres requisitos independientes; PC y EPS requieren nueve y dieciséis aprobadas. Correlativas y condiciones contrastadas con el PDF y la página oficial. [Fuente y discrepancia de horas](plan-2025.md).
- V1: reconocimiento automático, copia exacta previa y agregado de IDs solo a exámenes editables que no los tenían. Notas, estados, campos adicionales, Inglés y registros históricos preservados. Reapertura idempotente.
- V2: recategorización sin cambiar claves, IDs ni bytes del estado con IDs existentes. Un perfil vacío conserva ausente `ap2_state`; no recibe muestras ni un estado inicial vacío.
- Importación y exportación: incluyen Inglés, históricos y registros sin correspondencia. Se verificó la copia exacta previa, la confirmación explícita y que importar V1 no reincorpora el cuarto año al plan. Los nombres desconocidos se escapan al mostrarlos y los registros opacos no se transforman.
- Fallos de JSON, validación o cuota: original intacto; una copia previa fallida bloquea la sustitución. Ningún error de persistencia publica una operación exitosa.
- Equivalencias, promedio y horas: cálculo solo con asignaturas activas. Sin nota, la equivalencia suma asignatura y horas pero no divisor de promedio. Cambiar notas de Inglés no altera el resumen de asignaturas.
- Exámenes: edición y calificación conservan IDs; reversión conserva sus registros. Inglés participa en la agenda; históricos ajenos al plan quedan fuera. Promedio, bloqueos, porcentajes y próximos exámenes se actualizan sin recargar y se sincronizan entre pestañas.
- Hitos: celebración breve tras un cruce real de nueve o dieciséis aprobadas; solo en la pestaña de origen, una vez por navegador. Recargar, importar, migrar, recategorizar o volver a cruzar un hito registrado no lo celebra.
- Accesibilidad: acordeón nativo de hitos con teclado, foco y apertura conservada; diálogos con Escape y foco contenido; entradas finitas y cancelación con movimiento reducido.
- Responsive: las tres vistas a 1920, 1440, 1280, 768, 390, 360 y 320 px, sin desbordes. Hero de hasta 260 px en desktop y 340 px en mobile; el caso de 100% y promedio 10 conserva sus textos dentro de la card a 320 px.
- Recursos: favicon SVG/PNG, accesos móviles, manifest, tipografías y módulos responden 200 bajo `/mi-carrera/`.

Las [19 capturas](revision-visual.md) contienen exclusivamente datos de prueba. Se revisaron Inicio desktop/mobile, hitos abiertos, requisitos de Inglés y conservación de registros. No se modificó el README ni se configuraron servicios externos.

Trabajo en una rama nueva desde main, con commits separados. Sin push, merge ni publicación; la versión publicada queda intacta hasta revisión del propietario. Telegram y Cloudflare permanecen en standby.
