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
  `https://cogitador-consulta.vercel.app`). Solo hace falta si el frontend se sirve desde un
  dominio distinto al de este backend. Sin definir, se acepta cualquier origen (seguro aquí
  porque la auth es por Bearer token, no por cookies — pero conviene fijarlo en cuanto sepas
  la URL real del frontend).
- `PORT` — puerto HTTP (por defecto `8787`; Railway la inyecta sola).

## Despliegue en Railway

1. **Base de datos**: añade un plugin Postgres al proyecto.
2. **Backend**: crea un servicio a partir de este repo (root del monorepo, Railway detecta
   `server/` o configúralo como *root directory* si prefieres desplegar solo esa carpeta).
   En la pestaña *Variables* del servicio:
   - `DATABASE_URL` → referencia la del plugin Postgres (`${{Postgres.DATABASE_URL}}` si
     Railway te ofrece la referencia automática, o pega el valor).
   - `JWT_SECRET` → un valor propio, largo y aleatorio.
   - `CORS_ORIGIN` → la URL pública de donde sirvas el frontend, una vez la tengas.
   - Comando de arranque: `npm start` (usa `server/package.json`; si despliegas el repo
     completo, ajusta el *root directory*/`Start Command` a `server`).
3. **Frontend**: si lo despliegas aparte (Vercel, Netlify, otro servicio Railway), configura
   ahí la variable `VITE_API_BASE_URL` con la URL pública de este backend (ver `.env.example`
   en la raíz del repo) — así el cliente deja de asumir que la API está en el mismo origen.
   Si en cambio quieres un único servicio, deja que este backend sirva también el `dist/`
   construido (ver más abajo) y no hace falta `VITE_API_BASE_URL` ni `CORS_ORIGIN`.

## API

Todas las rutas de listas requieren cabecera `Authorization: Bearer <token>`.

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
