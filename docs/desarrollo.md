# Mantenimiento

La aplicación se publica en GitHub Pages desde `main`, raíz, sin build ni dependencias de ejecución. Conservá el mismo dominio y `ap2_state`; las reglas académicas y la protección de registros se describen en [plan-2025.md](plan-2025.md). La [arquitectura futura de Telegram](arquitectura-entrega-2.md) continúa en standby.

## Desarrollo y comprobación

Con Node.js 24 o posterior:

```sh
npm test
npm run dev
```

El servidor abre `http://127.0.0.1:4173/mi-carrera/`. Con ese servidor activo, Playwright y Microsoft Edge disponibles:

```sh
node scripts/run-browser-qa.mjs
```

El runner admite como primer argumento la ruta absoluta al módulo de una instalación existente de Playwright. `--dashboard-only` limita las capturas principales a Inicio, manteniendo todas las verificaciones funcionales. Las pruebas usan datos sintéticos en contextos aislados; nunca deben apuntarse al perfil personal del sitio publicado.

Capturas e informe se regeneran en `artifacts/qa/`, ignorado por Git y excluido de Pages. Son resultados descartables, no backups personales; conservarlos entre ejecuciones es opcional. `docs/` contiene documentación mantenida, no informes de cada iteración.

## Recursos

`scripts/generate-icons.mjs` regenera los PNG desde el favicon SVG; requiere Sharp como herramienta de desarrollo y admite la ruta a un módulo existente. Las tipografías locales y sus licencias se conservan en `assets/fonts/`.

Para publicar, verificar pruebas, integrar por PR conservando commits, esperar el despliegue de Pages y comprobar los recursos y la navegación en un contexto vacío aislado. No importar, reiniciar ni manipular el almacenamiento personal durante esa comprobación.
