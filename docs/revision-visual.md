# Revisión visual · Entrega 1

16 de noviembre de 2026. Iteración lista para revisión del propietario; no publicada.

## Criterio aplicado

La revisión encontró cuatro problemas en la composición anterior: demasiadas tarjetas con el mismo peso visual; textos de apoyo pequeños; gran distancia horizontal entre nombre y estado de materia; e información redundante en números de año, abreviaturas, iconos y etiquetas.

Esta ronda concentra el progreso en una superficie principal, reúne promedio y estados en un resumen compacto y da prioridad a la agenda y a los requisitos del plan. Los años se presentan como capítulos de un registro académico, con títulos en Source Serif 4 y datos de consulta en Inter. Las fuentes están alojadas localmente y conservan sus licencias.

- Se eliminaron completamente los recuadros 01–04, las abreviaturas de materias y las barras laterales de estado.
- Los estados se leen como texto y color, sin contenedores tipo pill. La nota tiene su propia columna y las horas se alinean en desktop.
- Los dos cuatrimestres comparten espacio horizontal en pantallas amplias. Todos los controles existentes siguen siendo directos.
- Los identificadores estables de materias y exámenes se conservan internamente; no se muestran como texto en las filas.
- Configuración se concentra en exportar, importar y consultar las copias previas. La Entrega 2 permanece en standby y no ocupa una tarjeta de servicio inactivo.
- La navegación conserva la posición de lectura de cada vista. Al abrir la aplicación, se despliega el año con cursadas activas o el primer tramo pendiente.
- Se corrigió el ancho del buscador mobile detectado durante la revisión visual.

## Capturas para evaluar

Todas usan el mismo estado de prueba: 14 materias aprobadas, 2 en curso, una equivalencia sin nota y dos exámenes futuros. No representan datos personales ni se incorporan como estado inicial de la aplicación. Las fechas de las copias automáticas son las generadas durante las pruebas aisladas.

| Vista | Desktop 1920 px | Desktop 1440 px | Desktop 1280 px | Mobile 390 px |
| --- | --- | --- | --- | --- |
| Inicio | [Captura](dashboard-desktop-1920.png) | [Captura](dashboard-desktop.png) | [Captura](dashboard-desktop-1280.png) | [Captura](dashboard-mobile.png) |
| Materias | [Captura](materias-desktop-1920.png) | [Captura](materias-desktop.png) | [Captura](materias-desktop-1280.png) | [Captura](materias-mobile.png) |
| Configuración | [Captura](configuracion-desktop-1920.png) | [Captura](configuracion-desktop.png) | [Captura](configuracion-desktop-1280.png) | [Captura](configuracion-mobile.png) |

La captura de Materias muestra el segundo año y una materia en curso desplegada. En desktop, el detalle ocupa un panel a ancho completo debajo de ambos cuatrimestres; expandirlo no estira una columna ni agrega ese espacio vacío a la otra. En mobile, el mismo detalle vuelve a ubicarse junto a su materia, conservando sus controles e información.

## Última pasada puntual

- El contador de resultados permanece oculto si no hay una búsqueda o un filtro activo; ignorar espacios evita activarlo con una búsqueda vacía.
- El historial se titula **Copias de seguridad**. Las copias se crean antes de importar o migrar datos, no mediante un programa periódico.
- En mobile, **Agregar examen** y **Aprobar** forman el grupo principal. La equivalencia y los cambios de estado se presentan separados, sin introducir menús adicionales.
- Los detalles desktop tienen contexto de materia y control de cierre. Se conserva la apertura por teclado, el foco al cambiar de tamaño y la posibilidad de mantener varios detalles abiertos.
- Se actualizaron las capturas afectadas de esta misma galería; no se agregaron variantes de versiones anteriores.

## Comprobación

- 17 pruebas de dominio y almacenamiento aprobadas; no se modificaron las reglas académicas ni el formato de persistencia en esta ronda.
- 50 comprobaciones de navegador aprobadas, incluidas las funciones locales, foco, actualizaciones inmediatas y navegación.
- Sin desbordes horizontales en las tres vistas a 1920, 1440, 1280, 768 y 390 px.
- Sin errores JavaScript ni solicitudes a servicios externos.
- Recursos y tipografías disponibles bajo `/mi-carrera/`.

El objetivo de esta entrega es revisar el resultado visual y decidir si hace falta otra ronda. No se ha hecho push, despliegue, migración de hosting ni configuración de backend.
