# Mi Plataforma - Barberías

Aplicación Vite + React + Supabase para gestionar barberías, agenda y reservas públicas.

## Requisitos
- Node.js 20+
- Cuenta Supabase configurada con las tablas y RLS incluidas en `supabase/migrations`
- Variables de entorno (local `.env.local`, Vercel Dashboard):
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`
  - `VITE_APP_URL` (ej: `https://mi-repo-copia.vercel.app`)

## Scripts principales
- `npm run dev` Inicia Vite en modo desarrollo.
- `npm run build` Genera el build de producción.
- `npm run preview` Sirve el build generado.
- `npm run lint` Ejecuta ESLint.

## Desarrollo local
```bash
npm install
npm run dev
```
La app estará en `http://localhost:5173` (puerto por defecto de Vite).

## Despliegue en Vercel
1) Configura las env vars anteriores en **Vercel -> Settings -> Environment Variables**.
2) Ajusta en Supabase Auth:
   - **Site URL:** `https://mi-repo-copia.vercel.app`
   - **Redirect URLs:** `https://mi-repo-copia.vercel.app/**` y `http://localhost:5173/**`
3) Realiza `npm run build` para validar antes de desplegar.

## Flujo resumido
- Registro/login con Supabase Auth.
- Dashboard protegido con `ProtectedRoute`.
- Página pública de reservas en `/b/:slug`.
- Confirmación/gestión de citas vía tokens en `/confirm/:token` y `/m/:token`.
