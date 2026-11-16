# Entrega 2: evaluación previa, sin implementación

Revisada el 16 de noviembre de 2026. Este documento es una propuesta para decidir la arquitectura. No crea recursos, no migra datos y no configura servicios.

## Elección recomendada

Elegiría **Cloudflare Workers + D1 + Cron Triggers**, con el frontend actual como **Workers Static Assets** y acceso mediante **Cloudflare Access** restringido al propietario. Mantendría HTML, CSS y JavaScript y compartiría `js/core.js` entre web y bot.

Para un único usuario evita administrar un servidor o una instancia PostgreSQL y permite agrupar archivos, API, bot y avisos en un proveedor. La documentación de D1 describe un modelo serverless de scale-to-zero, sin una política documentada de pausa por baja actividad equivalente a Supabase Free. Supabase sí puede pausar proyectos con poca actividad durante siete días. La recomendación es una evaluación de adecuación, no una garantía de disponibilidad o de precios futuros. [D1](https://developers.cloudflare.com/d1/platform/pricing/), [Supabase](https://supabase.com/docs/guides/platform/free-project-pausing).

## Comparación

| Aspecto | Workers + D1 + Cron | Supabase Free |
| --- | --- | --- |
| Uso personal esporádico | Serverless, sin instancia que mantener activa | Posible pausa por baja actividad |
| Base de datos | SQLite gestionado; suficiente para este plan y sus exámenes | PostgreSQL, más amplio de lo necesario para este caso |
| Identidad | Access; política para una sola identidad | Auth integrado y RLS |
| Cambios desde Telegram | API común y consultas periódicas desde la web | API y Realtime integrado |
| Frontend | Static Assets dentro del mismo Worker | GitHub Pages seguiría siendo un servicio separado |
| Mantenimiento | Un Worker, una D1 y un cron; hay que implementar validaciones de API | Más servicios integrados, pero más componentes y configuración |

D1 no sustituye Auth ni ofrece las políticas RLS de PostgreSQL: la autorización debe quedar obligatoriamente en el Worker. Nunca se expondría una API de base de datos con credenciales administrativas al navegador.

## Cuotas gratuitas relevantes

| Recurso | Plan gratuito documentado |
| --- | --- |
| Worker dinámico | 100.000 solicitudes por día, 10 ms de CPU por invocación HTTP y por cron |
| Cron Triggers | 5 por cuenta; basta uno |
| D1 | 5 millones de filas leídas y 100.000 escritas por día; 5 GB totales y 500 MB por base |
| Recuperación D1 | Time Travel de 7 días |
| Archivos estáticos | Solicitudes gratuitas e ilimitadas al servir directamente assets |

Fuentes: [Workers](https://developers.cloudflare.com/workers/platform/limits/), [D1 precios](https://developers.cloudflare.com/d1/platform/pricing/), [D1 límites](https://developers.cloudflare.com/d1/platform/limits/), [Static Assets](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/).

Para 22 asignaturas, sus requisitos independientes y un usuario estimo un margen amplio. Un cron cada 15 minutos son 96 ejecuciones al día; una consulta cada 30 segundos con la pestaña visible durante ocho horas son unas 960 solicitudes adicionales. Son estimaciones, no mediciones de un backend existente. Las consultas deben usar índices y leer únicamente las filas necesarias.

Los 10 ms son CPU, no tiempo esperando la base o Telegram. Aun así, habría que medir autenticación, validación y migración, limitar tamaños y procesar avisos en lotes pequeños. Si se agotan cuotas gratuitas, la API puede rechazar operaciones; nunca se interpretaría el error como un estado vacío. Los assets solo evitan consumo dinámico si las rutas no fuerzan pasar por el Worker. El plan gratuito no debe tratarse como una garantía contractual de disponibilidad. Un subdominio `workers.dev` permite empezar sin comprar dominio. [Límites de CPU](https://developers.cloudflare.com/workers/platform/limits/), [workers.dev](https://developers.cloudflare.com/workers/configuration/routing/workers-dev/).

## Diseño propuesto

1. **Frontend estático**, igual al de Entrega 1, y `/api/*` del mismo origen. Mantener modo local disponible. No agregar framework ni paquetes de ejecución al frontend.
2. **Autenticación con Access**, admitiendo exclusivamente el email del propietario mediante código por email o un proveedor de identidad existente. Política por hostname/ruta para proteger `/api/*`, incluyendo las URLs alternativas y de preview. Verificar identidad autenticada en el Worker; no confiar en un email o encabezado sin validar. Access tiene una opción gratuita adecuada para un propietario. [Access en Workers](https://developers.cloudflare.com/workers/configuration/cloudflare-access/), [planes](https://www.cloudflare.com/plans/zero-trust-services/).
3. **D1 como fuente compartida**, con estado, revisión, historial y registros de avisos. Aplicar comandos del dominio sobre la última revisión y usar escritura condicional/transacción. Un conflicto devuelve un error recuperable o reintenta el comando sobre la revisión nueva; nunca reemplaza datos recientes con una copia vieja del navegador.
4. **Sincronización sencilla**, consultando la revisión cada 15–30 segundos mientras la pestaña está visible, al recuperar foco y después de cada operación. Sin WebSockets ni otra infraestructura inicial. Limitación: un cambio de Telegram puede tardar ese intervalo en aparecer en una web ya abierta.
5. **Webhook de Telegram**, única ruta pública de operaciones del bot, validando secreto y simultáneamente chat ID, user ID y chat privado. Registrar `update_id` para no repetir comandos. Reutilizar las validaciones académicas de `js/core.js` y los IDs permanentes existentes. Documentar sintaxis exacta de cada comando al implementarlo. [Secreto del webhook](https://core.telegram.org/bots/api#setwebhook).
6. **Cron con registro de entregas**, cada 15 minutos, calculando la fecha en `America/Argentina/Salta`. Los triggers usan UTC; la decisión de avisar se calcula con la zona solicitada. Avisar a los 7 días, al día previo y el mismo día, desde una hora local definida. Clave única por examen, fecha programada y anticipación; revalidar antes de enviar y excluir calificados, cancelados y borrados. Una reprogramación invalida avisos pendientes de la fecha anterior. [Cron](https://developers.cloudflare.com/workers/configuration/cron-triggers/).

Los reintentos requieren una bandeja persistente con intentos, bloqueo temporal y resultado. Una respuesta de Telegram perdida después de un envío puede dejar incertidumbre: su API no permite garantizar entrega exactamente una vez en todos los fallos de red. Marcar esos casos como inciertos y no reenviarlos ciegamente reduce duplicados sin fingir una garantía absoluta.

## Protección de datos y secretos

- **Token del bot y secreto del webhook** en Workers Secrets. Los IDs permitidos también se configuran del lado servidor. Nada sensible en Git, archivos estáticos, manifest, URL pública o `localStorage`. Secretos locales únicamente en archivos ignorados por Git. No incluir tokens o notas en logs. [Workers Secrets](https://developers.cloudflare.com/workers/configuration/secrets/).
- **D1 mediante binding interno**, sin clave administrativa en el cliente. Autorización obligatoria, consultas preparadas, límite de cuerpo, tipos y métodos permitidos, comprobación exacta de Origin y protección CSRF para cambios autenticados por cookie. Respuestas privadas con `Cache-Control: no-store`.
- **Cifrado de plataforma**, en tránsito y en reposo, con claves gestionadas por Cloudflare. No es cifrado de extremo a extremo: Cloudflare procesa los datos y Telegram recibe el contenido de los mensajes. Los backups descargados siguen siendo responsabilidad del propietario. [Seguridad de D1](https://developers.cloudflare.com/d1/reference/data-security/).
- **Backups completos** antes de cada importación o migración, historial limitado de revisiones y exportación JSON/SQL. Time Travel complementa las copias externas; siete días no son archivo histórico permanente.

## Migración voluntaria y cambio de dominio

Cambiar de GitHub Pages a `workers.dev` cambia el origen. El nuevo sitio **no puede leer** el `localStorage` del dominio anterior. Por eso no se cambiaría el hosting primero esperando que los datos aparezcan solos.

La secuencia propuesta, únicamente después de autorización, es:

1. Mantener GitHub Pages funcionando y exportar desde el origen actual una copia completa, además del backup automático previo.
2. Mostrar un resumen de materias, notas, horas, exámenes y requisitos para que el propietario revise qué se migrará.
3. Crear el estado compartido solo si no existe; si D1 ya contiene registros, detenerse para revisar diferencias. No hacer una sustitución silenciosa.
4. Importar con autenticación en una transacción, conservar el original y verificar totales, IDs y contenido mediante una segunda lectura.
5. Habilitar el modo compartido únicamente tras verificar la importación y obtener confirmación del propietario. Conservar `ap2_state` en el origen anterior.
6. Probar desde web y Telegram, cerrar y reabrir, comprobar acceso no autorizado y recordatorios. Recién entonces decidir si se cambia el frontend predeterminado.

En caso de corte de red, mostrar la última copia consultada como tal y bloquear escrituras compartidas o dejarlas explícitamente pendientes. Nunca pasar silenciosamente a escribir en local para luego sobrescribir D1. El modo local continúa como opción independiente y visible.

## Acciones manuales que requeriría la implementación aprobada

- Cuenta Cloudflare Free y Zero Trust; definir el email autorizado. Usar `workers.dev` si no se quiere comprar dominio.
- Crear el bot con BotFather, iniciar un chat privado y obtener/verificar chat ID y user ID. Si se reutiliza el bot antiguo cuyo token estuvo en el navegador, regenerar ese token antes del despliegue.
- Crear D1, desplegar las migraciones preparadas entonces y asociar su binding al Worker.
- Cargar el token y el secreto en Workers Secrets, configurar las políticas Access y el cron; registrar el webhook con su secreto. Estas acciones aún no tienen archivos de despliegue: deliberadamente no se implementó el backend.
- Comprobar el servicio real, enviar un mensaje de prueba solicitado desde la web y ejecutar la migración voluntaria descrita.

La decisión pendiente es aprobar o ajustar esta arquitectura. No hacen falta credenciales ni cambios de hosting para revisar esta propuesta.
