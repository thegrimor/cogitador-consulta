# Cogitador de Consulta

Aplicación web (React + TypeScript + Vite) para consultar datos de Warhammer 40.000 (10ª edición), construir listas de ejército y calcular daño esperado en combate. Toda la interfaz está en español.

## Funcionalidades

- **Archivo (catálogo)** — facciones, datasheets, detachments, stratagems y mejoras (enhancements), con la maquetación al estilo de la app oficial de GW.
- **Reglamento** — glosario de reglas y referencia de fases de juego.
- **Misiones** — misiones primarias y secundarias, más un emparejador que cruza los mazos de misión primaria de dos jugadores.
- **Ejército (army builder)** — creación y edición de listas, gestión de wargear/opciones, detachments y mejoras, exportación en texto estilo Wahapedia, e importación/exportación por código QR.
- **Mathhammer** — calculadora probabilística de daño (impactos → heridas → salvaciones → daño → Feel No Pain) entre una unidad atacante y una defensora, con panel de modificadores para auras, stratagems y habilidades.
- 24 temas visuales por facción, persistidos en `localStorage`.

## Comandos

```bash
npm run dev      # servidor de desarrollo (Vite HMR)
npm run build    # tsc -b && vite build
npm run lint     # ESLint
npm run preview  # previsualizar el build de producción
```

Un script de datos puntual (`node scripts/<archivo>.mjs`, no vinculado a package.json):
- `scrape-mission-actions.mjs`.

Sin suite de tests todavía.

## Datos

La app consume JSON estático mantenido a mano (`public/data/factions/<slug>.json` + catálogo + `missions.json`) — no hay CSV ni paso de generación. Ver `CLAUDE.md` para el detalle de arquitectura.

## Stack

React 19, React Router 7, Redux Toolkit (roster), Tailwind CSS 4, `qrcode.react` / `qr-scanner` / `lz-string` (QR de listas), Vite 8, TypeScript.
