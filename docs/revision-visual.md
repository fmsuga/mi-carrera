# Revisión visual · Plan 2025 y dashboard compacto

Iteración local para revisión del propietario. No publicada. La corrección académica y su conservación de datos se explican en [plan-2025.md](plan-2025.md).

## Composición

La hero sigue siendo una única superficie, con seis indicadores: porcentaje sobre 22 asignaturas, aprobadas/total, horas aprobadas/2.044, promedio, en curso y pendientes. Pendientes reúne lo que falta completar fuera de cursada, incluidas las desaprobadas; sus estados individuales siguen diferenciados en Materias. Mide 228 px de alto a 1440 px de viewport y 306 px a 390 px. Se eliminaron las explicaciones de notas, el mensaje de materias restantes y el desplegable de cálculo, sin sustituirlos por otros textos.

El anillo tiene un trazo más sólido y un degradado azul, lavanda y verde agua con glow moderado. El porcentaje gana peso tipográfico; el promedio usa Source Serif y un acento cálido. Materias y horas tienen barras diferenciadas. Se conservan las entradas finitas de 850 ms y las respuestas de los controles, respetando movimiento reducido. No hay bucles ni efectos hover sobre superficies sin acción.

Inicio presenta hero, próximos exámenes, avance de los tres años y finalmente Hitos del plan. La agenda distribuye sus grupos temporales en dos columnas desktop y una en mobile. Los hitos comienzan plegados, se abren con teclado y mantienen su apertura al actualizar datos. Sus umbrales son 9 y 16 asignaturas; las celebraciones conservan el registro previo y nunca se disparan por recategorizar, importar o migrar.

## Capturas principales

Las doce capturas siguientes usan datos sintéticos: 11 asignaturas aprobadas, dos en curso, una equivalencia sin nota, Inglés I acreditado y dos exámenes próximos. El promedio de las asignaturas es 8 y las horas aprobadas son 1.012. No son datos personales ni valores iniciales de la aplicación.

| Vista | Desktop 1920 px | Desktop 1440 px | Desktop 1280 px | Mobile 390 px |
| --- | --- | --- | --- | --- |
| Inicio | [Captura](dashboard-desktop-1920.png) | [Captura](dashboard-desktop.png) | [Captura](dashboard-desktop-1280.png) | [Captura](dashboard-mobile.png) |
| Materias | [Captura](materias-desktop-1920.png) | [Captura](materias-desktop.png) | [Captura](materias-desktop-1280.png) | [Captura](materias-mobile.png) |
| Configuración | [Captura](configuracion-desktop-1920.png) | [Captura](configuracion-desktop.png) | [Captura](configuracion-desktop-1280.png) | [Captura](configuracion-mobile.png) |

## Estados adicionales para revisar

| Estado | Desktop | Mobile |
| --- | --- | --- |
| Hitos desplegados | [Captura](hitos-desktop.png) | [Captura](hitos-mobile.png) |
| Inglés como requisito independiente | [Captura](requisitos-desktop.png) | [Captura](requisitos-mobile.png) |
| Celebración de un cruce real | [40%](hito-40-desktop.png) | [70% con movimiento reducido](hito-70-mobile.png) |

[Registros históricos y conflictos conservados](registros-conservados.png).

Las capturas de Inglés y conservación usan otro estado sintético: nueve asignaturas aprobadas, notas y exámenes de los tres niveles de Inglés, dos registros históricos y uno sin correspondencia. PC y EPS conservan estados históricos aunque el nuevo cómputo no habilite una transición de EPS; no se reemplazan ni se borran. Las celebraciones muestran nueve y dieciséis aprobadas respectivamente.

Las 19 capturas representan esta iteración; se reemplazaron las variantes anteriores conservando sus nombres. El detalle de materias mantiene el panel compartido desktop y las acciones agrupadas en mobile. El contador de resultados sigue apareciendo solo al filtrar, distinguiendo asignaturas e idiomas.

## Verificación

35 pruebas de dominio y almacenamiento y 99 comprobaciones de navegador aprobadas. Inicio, Materias y Configuración se verificaron a 1920, 1440, 1280, 768, 390, 360 y 320 px, sin desbordes. También se comprobó el texto de la hero con el caso máximo de 100% y promedio 10 hasta 320 px. Sin errores JavaScript ni solicitudes externas.

La rama se entrega con commits separados para corrección académica y composición visual. No se hizo push, merge ni despliegue. El README sencillo se conserva; Telegram y Cloudflare siguen en standby.
