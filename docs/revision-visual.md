# Revisión visual · Entrega 1

16 de noviembre de 2026. Diseño aprobado por el propietario; capturas de la verificación previa a la publicación.

## Criterio aplicado

La revisión encontró cuatro problemas en la composición anterior: demasiadas tarjetas con el mismo peso visual; textos de apoyo pequeños; gran distancia horizontal entre nombre y estado de materia; e información redundante en números de año, abreviaturas, iconos y etiquetas.

El dashboard reúne porcentaje de carrera, promedio general, materias aprobadas/total y horas aprobadas/total en una sola hero card. La card ocupa todo el ancho en desktop, con una superficie continua, sin tarjetas internas. En mobile, porcentaje y promedio comparten la primera fila y las dos métricas de avance se ubican debajo. Los estados y el contexto quedan en una franja secundaria dentro de la misma card. La agenda, los hitos y el avance por año permanecen debajo, con menor peso visual. Los años se presentan como capítulos de un registro académico, con títulos en Source Serif 4 y datos de consulta en Inter. Las fuentes están alojadas localmente y conservan sus licencias.

- Se eliminaron completamente los recuadros 01–04, las abreviaturas de materias y las barras laterales de estado.
- Los estados se leen como texto y color, sin contenedores tipo pill. La nota tiene su propia columna y las horas se alinean en desktop.
- Los dos cuatrimestres comparten espacio horizontal en pantallas amplias. Todos los controles existentes siguen siendo directos.
- Los identificadores estables de materias y exámenes se conservan internamente; no se muestran como texto en las filas.
- Configuración se concentra en exportar, importar y consultar las copias previas. La Entrega 2 permanece en standby y no ocupa una tarjeta de servicio inactivo.
- La navegación conserva la posición de lectura de cada vista. Al abrir la aplicación, se despliega el año con cursadas activas o el primer tramo pendiente.
- Se corrigió el ancho del buscador mobile detectado durante la revisión visual.

## Capturas para evaluar

Las doce capturas principales usan el mismo estado de prueba: 14 materias aprobadas, 2 en curso, una equivalencia sin nota y dos exámenes futuros. No representan datos personales ni se incorporan como estado inicial de la aplicación. Las fechas de las copias de seguridad son las generadas durante las pruebas aisladas.

| Vista | Desktop 1920 px | Desktop 1440 px | Desktop 1280 px | Mobile 390 px |
| --- | --- | --- | --- | --- |
| Inicio | [Captura](dashboard-desktop-1920.png) | [Captura](dashboard-desktop.png) | [Captura](dashboard-desktop-1280.png) | [Captura](dashboard-mobile.png) |
| Materias | [Captura](materias-desktop-1920.png) | [Captura](materias-desktop.png) | [Captura](materias-desktop-1280.png) | [Captura](materias-mobile.png) |
| Configuración | [Captura](configuracion-desktop-1920.png) | [Captura](configuracion-desktop.png) | [Captura](configuracion-desktop-1280.png) | [Captura](configuracion-mobile.png) |

La captura de Materias muestra el segundo año y una materia en curso desplegada. En desktop, el detalle ocupa un panel a ancho completo debajo de ambos cuatrimestres; expandirlo no estira una columna ni agrega ese espacio vacío a la otra. En mobile, el mismo detalle vuelve a ubicarse junto a su materia, conservando sus controles e información.

## Jerarquía del dashboard

Se reemplazaron las dos tarjetas superiores por un resumen único. El porcentaje mantiene el anillo SVG y el promedio conserva un tamaño destacado. Las barras de materias y horas permiten leer sus denominadores en la misma superficie; todos los valores siguen proviniendo del estado real. Se mantienen las aclaraciones sobre aprobaciones sin nota y el carácter informativo del porcentaje.

La pasada de acabados conserva esta distribución. Se regeneraron las doce capturas porque la eliminación del porcentaje del header también afecta a Materias y Configuración. La galería representa la versión actual, sin variantes antiguas.

## Acabados y microinteracciones

- El anillo incorpora un degradado azul luminoso discreto y una sombra suave. Anillo y barras entran durante 850 ms y terminan en el valor real; el número muestra el porcentaje correcto desde el primer momento. También acompañan cambios reales del progreso, sin reiniciar al navegar o editar información que no lo altera.
- La hero conserva proporciones, métricas y jerarquía. Dos degradados radiales estáticos y una sombra contenida aportan profundidad sin transparencias, partículas ni animaciones permanentes.
- Botones, enlaces y desplegables responden con cambios breves de contraste y movimiento mínimo. Las superficies que no realizan acciones no reciben efectos hover.
- `prefers-reduced-motion` evita las animaciones de entrada y los desplazamientos. Cambiar esa preferencia cancela las animaciones activas; ocultar la pestaña también las detiene.
- Se eliminó el porcentaje duplicado del header. **Cómo se calcula el progreso** permite consultar el denominador, la distinción entre materias y horas y la aclaración de ausencia de certificación oficial. El desplegable conserva su apertura al actualizar datos.

## Celebraciones de hitos

Una aprobación o equivalencia que pasa de 13 a 14 aprobadas cruza realmente el 40%; de 23 a 24 cruza el 70%. Solo después de guardar correctamente esa operación se registra el hito y se muestra un aviso de 4,8 segundos, sin bloquear controles ni mover el foco. Revertir y volver a aprobar no lo repite. Otra pestaña sincroniza el progreso sin celebrar.

El historial se guarda una vez por navegador en `ap2_ui_milestones_v1`, separado de `ap2_state` y del backup académico. Las cargas, importaciones y migraciones registran silenciosamente los umbrales ya alcanzados; también se considera un requisito histórico en curso o acreditado. Web Locks coordina ese registro con las operaciones académicas entre pestañas. Ante un historial ilegible o un fallo de cuota se omite la celebración sin alterar la operación ni sobrescribir ese historial.

Estos dos ejemplos muestran cruces realizados mediante la interfaz en contextos de prueba aislados. Usan estados distintos de la galería principal para verificar cada umbral:

| Ejemplo | Captura |
| --- | --- |
| Cruce del 40%, desktop | [Captura](hito-40-desktop.png) |
| Cruce del 70%, mobile con movimiento reducido | [Captura](hito-70-mobile.png) |

## Ajustes puntuales de Materias y Configuración

- El contador de resultados permanece oculto si no hay una búsqueda o un filtro activo; ignorar espacios evita activarlo con una búsqueda vacía.
- El historial se titula **Copias de seguridad**. Las copias se crean antes de importar o migrar datos, no mediante un programa periódico.
- En mobile, **Agregar examen** y **Aprobar** forman el grupo principal. La equivalencia y los cambios de estado se presentan separados, sin introducir menús adicionales.
- Los detalles desktop tienen contexto de materia y control de cierre. Se conserva la apertura por teclado, el foco al cambiar de tamaño y la posibilidad de mantener varios detalles abiertos.
- Se actualizaron las capturas afectadas de esta misma galería; no se agregaron variantes de versiones anteriores.

## Comprobación

- 28 pruebas de dominio, almacenamiento e historial de hitos aprobadas; no se modificaron las reglas académicas ni el formato del estado académico en esta ronda.
- 76 comprobaciones de navegador aprobadas, incluidas las funciones locales, foco, actualizaciones inmediatas, navegación, animaciones finitas, hitos y movimiento reducido.
- Sin desbordes horizontales en las tres vistas a 1920, 1440, 1280, 768 y 390 px.
- Sin errores JavaScript ni solicitudes a servicios externos.
- Recursos y tipografías disponibles bajo `/mi-carrera/`.

El propietario aprobó esta iteración sin más cambios estéticos y autorizó su publicación mediante el mecanismo existente de GitHub Pages. La Entrega 2 permanece en standby, sin cambios de hosting ni configuración de backend.
