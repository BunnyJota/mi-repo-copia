# Migración a Vercel (Vite + React de Lovable)

## Archivos incluidos
- `vercel.json` → Rewrites para SPA + headers.
- `api/send-email.ts` → Function para Resend.
- `src/lib/email.ts` → Helper cliente para llamar la API.
- `src/components/ContactForm.tsx` → Ejemplo de formulario.
- `.gitignore` → Ignora `.env*` y build.
- `package.json.merge.txt` → Indicaciones para fusionar scripts/deps.

## Pasos
1) Copia estos archivos en tu repo, respetando rutas.
2) Fusiona `package.json.merge.txt` en tu `package.json` (scripts y deps).
3) `git add . && git commit -m "Vercel migration"` y push a GitHub.

## Configuración en Vercel
- Importa el proyecto desde GitHub.
- **Environment Variables**:
  - `RESEND_API_KEY` (Server)
  - `RESEND_FROM` (Server, remitente verificado)
  - Todas las `VITE_*` que use tu front (Client), p.ej. `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
- **Build & Output**:
  - Install: `npm i`
  - Build Command: `npm run build`
  - Output: `dist`
  - Node: 18+
- Deploy.
- Prueba rutas con recarga (no 404) y el formulario (debe devolver `ok: true`).

## Notas
- Si llamabas Resend desde el navegador, ahora usa `/api/send-email`.
- Si tienes URLs de LoveApp, cámbialas por tu dominio Vercel.
- Subir assets estáticos a `/public` o tu storage y actualizar rutas.

## Configuración Vercel (resumen)
- Importa el repo en Vercel
- Variables de entorno: RESEND_API_KEY, RESEND_FROM (Server); VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY (Client)
- Build: npm run build | Output: dist | Node 18/20
- SPA: vercel.json incluido
