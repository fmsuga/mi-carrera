# Mi carrera · Analista Programador

Dashboard personal sin framework ni dependencias de ejecución. Se sirve como archivos estáticos en GitHub Pages, incluido el prefijo `/mi-carrera/`.

## Desarrollo y pruebas

Con Node.js 24 o posterior:

```sh
npm test
npm run dev
```

Abrir `http://127.0.0.1:4173/mi-carrera/`. El servidor es solo para desarrollo y no publica nada.

Las pruebas del navegador usan Playwright y Microsoft Edge en un contexto aislado, sin acceso al almacenamiento del sitio publicado:

```sh
npm install --no-save playwright
node scripts/run-browser-qa.mjs
```

El servidor debe estar iniciado. El runner también acepta como primer argumento la ruta absoluta de una instalación existente de Playwright. Las capturas usan datos de prueba; no son datos personales ni valores precargados en la aplicación. Resultados en `docs/browser-qa.json`.

## Datos existentes

Se conserva `localStorage.ap2_state`, sus claves por nombre de materia y los estados de requisitos `_otro_pc` y `_otro_eps`. El plan conserva 33 materias, 3014 horas y todas sus correlativas y condiciones de idiomas.

- La migración únicamente agrega IDs a exámenes antiguos; mantiene todas sus propiedades y genera una copia exacta previa bajo `ap2_backup_*_pre_migration_v2`.
- No se escribe ni inicializa sobre un estado ilegible. Ante JSON inválido, esquema incompatible o falta de espacio, se muestra una advertencia y se bloquean los cambios. Exportar permite recuperar el contenido original, incluso si está corrupto.
- Cada operación lee el último estado guardado, valida, persiste y después actualiza todas las vistas. Web Locks serializa las operaciones entre pestañas en navegadores compatibles; `storage` mantiene las vistas sincronizadas. No hay recargas automáticas.
- Revertir una materia conserva sus exámenes. La reversión cambia el estado y retira su nota final del promedio; requiere confirmación. Los registros históricos de materias y requisitos no se borran si dejan de cumplirse sus correlativas; se vuelven a validar al realizar una nueva transición.
- La importación valida antes de pedir confirmación, exige marcar una casilla y guarda la copia previa antes de sustituir el estado. Si el backup falla, la importación se cancela. Las copias se pueden descargar desde Configuración; no se eliminan automáticamente.
- La equivalencia admite nota opcional. Sin nota suma materias y horas, pero no entra en el divisor del promedio.
- No existe acción de reinicio o borrado completo.

Los backups del navegador comparten su cuota y no sustituyen una copia externa. No se han leído ni modificado los datos del navegador del sitio publicado durante este desarrollo.

## Archivos e iconos

`assets/favicon.svg` contiene un birrete original en azul y dorado, simplificado para tamaños pequeños. Se incluyen PNG de 16 y 32 px, Apple Touch Icon de 180 px y accesos directos de 192 y 512 px. `manifest.webmanifest` usa rutas relativas, igual que `index.html`. El manifest prepara accesos directos; no se declara soporte offline ni se instala un service worker.

Para regenerar PNG desde el SVG, con sharp instalado como herramienta de desarrollo:

```sh
npm install --no-save sharp
node scripts/generate-icons.mjs
```

## Estado de entregas

Entrega 1 implementada: dashboard, búsqueda y filtros, equivalencias, notas, edición y eliminación de exámenes, actualizaciones completas, protección de almacenamiento, importación y exportación, favicon y experiencia responsive.

Entrega 2 pendiente de decisión del propietario. No hay backend desplegado, autenticación, conexión compartida, webhook ni recordatorios operativos. Se retiró la antigua integración que almacenaba tokens en el cliente y solo notificaba con la web abierta. Al iniciar esta versión se eliminan exclusivamente las claves obsoletas `ap2_tgt` y `ap2_tgc`; `ap2_state` y los backups se preservan. La evaluación solicitada está en [docs/arquitectura-entrega-2.md](docs/arquitectura-entrega-2.md).

## Publicación futura

Este checkout funciona como sitio estático desde la raíz, con rutas relativas. No necesita build ni servidor de producción. La navegación usa fragmentos (`#inicio`, `#materias`, `#configuracion`) y no depende de reglas de reescritura.

No se ha cambiado la configuración de GitHub Pages ni se ha publicado esta rama. Antes de una publicación futura se debe revisar el diff y mantener el mismo origen de GitHub Pages para conservar el acceso al almacenamiento existente. Cambiar de dominio requiere una migración voluntaria verificada; el navegador no comparte `localStorage` entre dominios.
