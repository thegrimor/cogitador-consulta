# Cogitador de Consulta — servidor

Backend del sistema de usuarios y del guardado de listas de ejército. Los datos viven en
Postgres (tablas `users` y `rosters`, esta última con la lista completa en una columna
`jsonb`) — sin ORM, usando el driver `pg` directamente. El esquema se crea solo al arrancar
(`CREATE TABLE IF NOT EXISTS`), no hay migraciones aparte que correr.

## Desarrollo local

```bash
npm install
cp .env.example .env   # y rellena DATABASE_URL (Postgres local o el de Railway)
npm run dev             # recarga automática (node --watch), lee .env si existe
```

`DATABASE_URL` es obligatoria — el servidor no arranca sin ella. Puedes apuntar a un Postgres
local o directamente al de Railway (útil para probar contra los mismos datos que producción).

## Variables de entorno

Ver `.env.example`. Resumen:

- `DATABASE_URL` — cadena de conexión Postgres. **Obligatoria.**
- `JWT_SECRET` — clave para firmar los tokens de sesión. Cámbiala en producción.
- `CORS_ORIGIN` — orígenes permitidos, separados por comas (p. ej.
  `https://cogitador-consulta.netlify.app`). Una entrada `*.netlify.app` acepta cualquier
  subdominio — útil para los deploy previews por rama/PR de Netlify, que cada uno tiene su
  propio subdominio. Solo hace falta si el frontend se sirve desde un dominio distinto al de
  este backend. Sin definir, se acepta cualquier origen (seguro aquí porque la auth es por
  Bearer token, no por cookies — pero conviene fijarlo en cuanto sepas la URL real del
  frontend).
- `PORT` — puerto HTTP (por defecto `8787`; Railway la inyecta sola).
- `ANTHROPIC_API_KEY` — habilita el asistente de chat (`POST /api/chat`). Consíguela en
  [console.anthropic.com](https://console.anthropic.com/settings/keys). Opcional: sin ella el
  resto del backend funciona igual y el chat responde `503`.

## Despliegue: backend en Railway, frontend en Netlify

1. **Base de datos** (Railway): añade un plugin Postgres al proyecto.
2. **Backend** (Railway): crea un servicio a partir de este repo, con *root directory* =
   `server` (así Railway solo instala/arranca ese `package.json`, sin tocar el frontend). En
   la pestaña *Variables* del servicio:
   - `DATABASE_URL` → referencia la del plugin Postgres (`${{Postgres.DATABASE_URL}}` si
     Railway te ofrece la referencia automática, o pega el valor).
   - `JWT_SECRET` → un valor propio, largo y aleatorio.
   - `CORS_ORIGIN` → la URL de tu sitio Netlify, p. ej. `https://tu-sitio.netlify.app`
     (añade `,*.netlify.app` si quieres que los deploy previews también puedan llamar a la
     API).
   - `ANTHROPIC_API_KEY` → opcional, solo si quieres el asistente de chat activo.
   - Comando de arranque: `npm start`.
   - Copia la URL pública que Railway te da para este servicio (Settings → Networking →
     Generate Domain si no tiene una todavía) — la necesitas en el paso siguiente.
3. **Frontend** (Netlify): build command `npm run build`, publish directory `dist` (ya
   configurado en `netlify.toml`, en la raíz del repo — *base directory* debe quedar vacío/`.`
   para que Netlify vea el `package.json` de la raíz, no el de `server/`). En Site
   configuration → Environment variables, añade:
   - `VITE_API_BASE_URL` → la URL pública del backend en Railway del paso 2 (sin `/` final,
     sin `/api`).

   `VITE_API_BASE_URL` se incrusta en el bundle en tiempo de build — si la cambias, hace
   falta un redeploy en Netlify, no solo un restart. `public/_redirects` ya trae el fallback
   de SPA (`/* /index.html 200`) que React Router necesita para las rutas internas.

## API

Todas las rutas de listas requieren cabecera `Authorization: Bearer <token>`.

- `GET /api/health` → `{ status: 'ok' }` (200) o 500 si no puede alcanzar Postgres — hace un
  `SELECT 1` real, no solo comprueba que el proceso está vivo. En Railway, configúralo como
  *Healthcheck Path* del servicio (Settings → Deploy) para que un deploy con la BD caída no
  se marque como sano.
- `POST /api/auth/register` `{ username, password }` → `{ token, user }`
- `POST /api/auth/login` `{ username, password }` → `{ token, user }`
- `GET /api/auth/me` → `{ user }`
- `GET /api/rosters` → `{ rosters: RosterList[] }` (solo las del usuario autenticado)
- `PUT /api/rosters/:id` `RosterList` → upsert de una lista completa, asociada al usuario autenticado
- `DELETE /api/rosters/:id` → `204`

Si existe `dist/` (build del frontend, en la raíz del repo) este mismo proceso la sirve como
estáticos y hace fallback a `index.html` para cualquier ruta que no sea `/api/*` — útil para
un despliegue de un solo servicio. En desarrollo, Vite sirve el frontend por separado y hace
proxy de `/api` a este servidor (ver `vite.config.ts`).
