# Setup Rápido: Push Notifications

## ✅ Ya completado:
- ✅ Proyecto Firebase creado
- ✅ Dependencias instaladas (`firebase`)

## 📋 Pasos Restantes (5 minutos):

### 1️⃣ Obtener Credenciales de Firebase (2 min)

Ve a [Firebase Console](https://console.firebase.google.com/) y sigue estos pasos:

**A. Obtener configuración de la app web:**
1. Ve a **Project Settings** (⚙️) > **General**
2. Desplázate hasta **Your apps** > Haz clic en el ícono **Web** (`</>`)
3. Si no tienes una app web, regístrala con nombre "Trimly Web App"
4. **Copia** la configuración que aparece (apiKey, authDomain, projectId, etc.)

**B. Obtener VAPID Key:**
1. En **Project Settings** > **Cloud Messaging**
2. Desplázate hasta **Web configuration**
3. En **Web Push certificates**, haz clic en **Generate key pair**
4. **Copia** la Key pair generada

**C. Obtener Server Key:**
1. En **Project Settings** > **Cloud Messaging**
2. En **Cloud Messaging API (Legacy)**, copia el **Server key**

### 2️⃣ Configurar Variables de Entorno (1 min)

Abre tu archivo `.env.local` (o créalo si no existe) y agrega al final:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=tu-api-key-aqui
VITE_FIREBASE_AUTH_DOMAIN=tu-auth-domain-aqui
VITE_FIREBASE_PROJECT_ID=tu-project-id-aqui
VITE_FIREBASE_STORAGE_BUCKET=tu-storage-bucket-aqui
VITE_FIREBASE_MESSAGING_SENDER_ID=tu-messaging-sender-id-aqui
VITE_FIREBASE_APP_ID=tu-app-id-aqui
VITE_FIREBASE_MEASUREMENT_ID=tu-measurement-id-aqui
VITE_FIREBASE_VAPID_KEY=tu-vapid-key-aqui
```

**Reemplaza** `tu-xxx-aqui` con los valores que copiaste en el paso 1.

### 3️⃣ Actualizar Service Worker (1 min)

Abre `public/firebase-messaging-sw.js` y reemplaza los valores en `firebaseConfig`:

```javascript
const firebaseConfig = {
  apiKey: "TU_API_KEY_AQUI",
  authDomain: "TU_AUTH_DOMAIN_AQUI",
  projectId: "TU_PROJECT_ID_AQUI",
  storageBucket: "TU_STORAGE_BUCKET_AQUI",
  messagingSenderId: "TU_MESSAGING_SENDER_ID_AQUI",
  appId: "TU_APP_ID_AQUI",
  measurementId: "TU_MEASUREMENT_ID_AQUI",
};
```

### 4️⃣ Configurar Secreto en Supabase (1 min)

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **Edge Functions** > **Secrets**
4. Haz clic en **Add new secret**
5. **Name**: `FCM_SERVER_KEY`
6. **Value**: Pega el Server Key que copiaste en el paso 1C
7. Haz clic en **Save**

### 5️⃣ Aplicar Migraciones y Desplegar (Ejecutar comandos)

Ejecuta estos comandos en tu terminal:

```bash
# Aplicar migraciones de base de datos
supabase db push

# Desplegar Edge Functions
supabase functions deploy send-push-notification
supabase functions deploy process-push-reminders
```

### 6️⃣ Configurar Cron Job (Opcional - para recordatorios automáticos)

1. Ve a Supabase Dashboard > **SQL Editor**
2. Ejecuta este SQL (reemplaza `TU_PROJECT_REF` con tu Project Reference):

```sql
SELECT cron.schedule(
  'process-push-reminders',
  '*/5 * * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://TU_PROJECT_REF.supabase.co/functions/v1/process-push-reminders',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);
```

**Nota**: Encuentra tu `PROJECT_REF` en Supabase Dashboard > Settings > API > Project URL

---

## ✅ Verificación

1. Reinicia tu servidor de desarrollo: `npm run dev`
2. Inicia sesión en tu app
3. Ve a **Configuración** > **Notificaciones** > **Push Notifications**
4. Haz clic en **Activar** y acepta los permisos
5. Crea una cita de prueba desde la página de booking público
6. Deberías recibir una notificación push 🎉

---

## 🆘 Si algo falla:

- **Error de permisos**: Asegúrate de permitir notificaciones en tu navegador
- **Service Worker no se registra**: Verifica que `firebase-messaging-sw.js` esté en `public/` y tenga las credenciales correctas
- **No se envían notificaciones**: Revisa la consola del navegador y los logs de Supabase Edge Functions
