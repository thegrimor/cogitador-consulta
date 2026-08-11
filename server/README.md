# Cogitador de Consulta — servidor

Backend mínimo para el sistema de usuarios y el guardado de listas de ejército. Sin base de
datos externa: los datos se guardan en `server/data/db.json` (creado automáticamente, no se
versiona).

## Comandos

```bash
npm install       # dentro de server/
npm run dev        # arranca con recarga automática (node --watch)
npm start          # arranca en modo normal
```

Variables de entorno (todas opcionales):

- `PORT` — puerto HTTP (por defecto `8787`).
- `JWT_SECRET` — clave para firmar los tokens de sesión. **Cámbiala en producción.**
- `DB_PATH` — ruta del archivo JSON de datos (por defecto `server/data/db.json`).

## API

Todas las rutas de listas requieren cabecera `Authorization: Bearer <token>`.

- `POST /api/auth/register` `{ username, password }` → `{ token, user }`
- `POST /api/auth/login` `{ username, password }` → `{ token, user }`
- `GET /api/auth/me` → `{ user }`
- `GET /api/rosters` → `{ rosters: RosterList[] }` (solo las del usuario autenticado)
- `PUT /api/rosters/:id` `RosterList` → upsert de una lista completa, asociada al usuario autenticado
- `DELETE /api/rosters/:id` → `204`

En producción, si existe `dist/` (build del frontend, en la raíz del repo) este mismo proceso
la sirve como estáticos y hace fallback a `index.html` para cualquier ruta que no sea `/api/*`.
En desarrollo, Vite sirve el frontend por separado y hace proxy de `/api` a este servidor
(ver `vite.config.ts`).
