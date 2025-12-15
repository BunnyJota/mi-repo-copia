# 🚀 Guía de Migración: Lovable.app → Supabase + Vercel

> **✅ El código ya está configurado.** Solo necesitas seguir estos pasos para conectar tu propia cuenta de Supabase.

---

## 📋 Resumen Rápido

| Paso | Acción | Tiempo estimado |
|------|--------|-----------------|
| 1 | Crear proyecto en Supabase | 2 min |
| 2 | Ejecutar SQL de migraciones | 1 min |
| 3 | Configurar variables de entorno locales | 1 min |
| 4 | Desplegar Edge Functions | 3 min |
| 5 | Desplegar en Vercel | 3 min |

**Total: ~10 minutos**

---

## 🔧 PASO 1: Crear Proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) e inicia sesión (o crea cuenta)
2. Click en **"New Project"**
3. Configura:
   - **Organization**: Tu organización
   - **Name**: `mi-barberia` (o el nombre que prefieras)
   - **Database Password**: ⚠️ **Guarda esta contraseña**
   - **Region**: Elige la más cercana a tus usuarios
4. Click **"Create new project"**
5. Espera ~2 minutos mientras se crea

---

## 🔑 PASO 2: Obtener Credenciales

En el dashboard de tu nuevo proyecto:

1. Ve a **Settings** (ícono de engranaje) → **API**
2. Copia estos valores (los necesitarás después):

| Campo | Descripción |
|-------|-------------|
| **Project URL** | `https://xxxxx.supabase.co` |
| **anon public** | Clave que empieza con `eyJ...` |
| **service_role** | Solo para Edge Functions |

También necesitarás el **Reference ID**:
- Ve a **Settings** → **General**
- Copia el **Reference ID** (algo como `abcdefghij`)

---

## 🗄️ PASO 3: Ejecutar Migraciones SQL

1. En tu proyecto de Supabase, ve a **SQL Editor** (ícono de terminal)
2. Click en **"New query"**
3. Abre el archivo `GUIA_MIGRACION_SUPABASE.sql` de tu proyecto
4. Copia **TODO** el contenido
5. Pégalo en el SQL Editor
6. Click en **"Run"** (o Ctrl+Enter)
7. Espera a que termine (verás "Success")

✅ Esto crea todas las tablas, funciones, triggers y políticas de seguridad.

---

## ⚙️ PASO 4: Configurar Variables de Entorno Locales

Crea un archivo `.env.local` en la raíz de tu proyecto:

```env
VITE_SUPABASE_URL=https://TU-PROJECT-REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx
```

> 📝 Reemplaza los valores con los que copiaste en el Paso 2.

---

## ⚡ PASO 5: Desplegar Edge Functions

### 5.1 Instalar Supabase CLI

```bash
npm install -g supabase
```

### 5.2 Iniciar sesión y vincular proyecto

```bash
# Login (abrirá el navegador)
supabase login

# Vincular proyecto (reemplaza TU_PROJECT_REF)
supabase link --project-ref TU_PROJECT_REF
```

### 5.3 Configurar secretos para las funciones

Ve a **Supabase Dashboard** → **Edge Functions** → **Secrets** y añade:

| Secret Name | Valor |
|-------------|-------|
| `RESEND_API_KEY` | Tu API key de [resend.com](https://resend.com) |
| `APP_URL` | `https://tu-app.vercel.app` (lo actualizas después del deploy) |

### 5.4 Desplegar las funciones

```bash
# Desde la raíz del proyecto
supabase functions deploy send-email --no-verify-jwt
supabase functions deploy confirm-appointment --no-verify-jwt
```

---

## 🚀 PASO 6: Desplegar en Vercel

### 6.1 Subir código a GitHub (si no lo has hecho)

```bash
git add .
git commit -m "Preparado para migración a Supabase propio"
git push
```

### 6.2 Conectar con Vercel

1. Ve a [vercel.com](https://vercel.com) e inicia sesión
2. Click en **"Add New..."** → **"Project"**
3. Importa tu repositorio de GitHub
4. En **"Environment Variables"**, añade:

| Variable | Valor |
|----------|-------|
| `VITE_SUPABASE_URL` | `https://tu-project-ref.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Tu anon key |

5. Click en **"Deploy"**

### 6.3 Actualizar APP_URL en Supabase

Una vez desplegado en Vercel:
1. Copia la URL de tu app (ej: `https://mi-barberia.vercel.app`)
2. Ve a Supabase → Edge Functions → Secrets
3. Actualiza `APP_URL` con la URL de Vercel

---

## 📧 PASO 7: Configurar Emails (Resend)

Para que los emails de confirmación funcionen:

1. Crea cuenta en [resend.com](https://resend.com)
2. Obtén tu API Key en **API Keys**
3. Ya lo configuraste en el Paso 5.3

### Para producción (opcional pero recomendado)

Para enviar emails desde tu propio dominio:
1. En Resend, ve a **Domains** → **Add Domain**
2. Sigue las instrucciones para añadir registros DNS

---

## ✅ Verificación Final

Prueba que todo funciona:

1. [ ] Abre tu app en Vercel
2. [ ] Intenta registrarte como nuevo usuario
3. [ ] Crea una barbería
4. [ ] Añade servicios
5. [ ] Prueba el sistema de reservas público

---

## 🐛 Solución de Problemas

### "supabase: command not found"
```bash
npm install -g supabase
```

### Error de autenticación en Vercel
- Verifica que las variables de entorno estén correctas
- Asegúrate de usar la **anon key**, no la service_role

### Emails no se envían
- Verifica `RESEND_API_KEY` en Edge Functions → Secrets
- Revisa logs en Edge Functions → Logs

### Error "relation does not exist"
- Ejecuta el SQL de migraciones completo

---

## 📁 Archivos Modificados

El código ya está configurado. Estos son los archivos relevantes:

- `src/integrations/supabase/client.ts` - Cliente con validación
- `supabase/config.toml` - Configuración (actualiza project_id)
- `supabase/functions/send-email/index.ts` - Función de emails
- `supabase/functions/confirm-appointment/index.ts` - Confirmación
- `vercel.json` - Configuración de Vercel
- `env.example.txt` - Ejemplo de variables de entorno

---

## 🎉 ¡Listo!

Tu proyecto ahora está conectado a tu propia cuenta de Supabase y desplegado en Vercel.

**Beneficios:**
- Control total de tu base de datos
- Sin limitaciones de Lovable.app
- Escalabilidad según tus necesidades
- Costos predecibles con el plan gratuito de Supabase

