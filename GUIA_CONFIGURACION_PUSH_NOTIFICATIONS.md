# Guía de Configuración: Push Notifications con Firebase Cloud Messaging (FCM)

Esta guía te ayudará a configurar las notificaciones push en tu plataforma usando Firebase Cloud Messaging.

## Requisitos Previos

1. Una cuenta de Firebase (https://firebase.google.com/)
2. Un proyecto Firebase creado
3. Acceso al Supabase Dashboard

## Paso 1: Configurar Firebase

### 1.1 Crear Proyecto Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Anota el **Project ID**

### 1.2 Habilitar Cloud Messaging

1. En Firebase Console, ve a **Build** > **Cloud Messaging**
2. Si es la primera vez, haz clic en **Get Started**
3. En la pestaña **Cloud Messaging API (Legacy)**, asegúrate de que esté habilitada

### 1.3 Obtener Credenciales

1. Ve a **Project Settings** (ícono de engranaje) > **General**
2. Desplázate hasta **Your apps** y haz clic en el ícono de **Web** (`</>`)
3. Registra tu app con un nombre (ej: "Trimly Web App")
4. Copia la configuración que aparece:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};
```

### 1.4 Generar VAPID Key

1. En Firebase Console, ve a **Project Settings** > **Cloud Messaging**
2. Desplázate hasta **Web configuration**
3. En **Web Push certificates**, haz clic en **Generate key pair**
4. Copia la **Key pair** generada (esta es tu VAPID key)

### 1.5 Obtener Server Key

1. En Firebase Console, ve a **Project Settings** > **Cloud Messaging**
2. En la sección **Cloud Messaging API (Legacy)**, copia el **Server key**

## Paso 2: Configurar Variables de Entorno

### 2.1 Frontend (.env.local)

Crea o actualiza el archivo `.env.local` en la raíz del proyecto con:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=tu-api-key
VITE_FIREBASE_AUTH_DOMAIN=tu-auth-domain
VITE_FIREBASE_PROJECT_ID=tu-project-id
VITE_FIREBASE_STORAGE_BUCKET=tu-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=tu-messaging-sender-id
VITE_FIREBASE_APP_ID=tu-app-id
VITE_FIREBASE_MEASUREMENT_ID=tu-measurement-id
VITE_FIREBASE_VAPID_KEY=tu-vapid-key
```

### 2.2 Service Worker (public/firebase-messaging-sw.js)

Actualiza el archivo `public/firebase-messaging-sw.js` con tus credenciales de Firebase:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID",
};
```

### 2.3 Supabase Edge Functions

En Supabase Dashboard:

1. Ve a **Edge Functions** > **Secrets**
2. Agrega el siguiente secreto:
   - **Name**: `FCM_SERVER_KEY`
   - **Value**: Tu Server Key de Firebase (obtenido en el Paso 1.5)

## Paso 3: Instalar Dependencias

Ejecuta en la terminal:

```bash
npm install firebase
```

## Paso 4: Aplicar Migraciones de Base de Datos

Ejecuta las migraciones de Supabase:

```bash
supabase db push
```

Esto creará las tablas:
- `push_notification_tokens`
- `notification_preferences`

Y las funciones SQL necesarias.

## Paso 5: Desplegar Edge Functions

Despliega las nuevas Edge Functions:

```bash
supabase functions deploy send-push-notification
supabase functions deploy process-push-reminders
```

## Paso 6: Configurar Cron Job para Recordatorios

Para que los recordatorios se envíen automáticamente, necesitas configurar un cron job en Supabase.

### Opción A: Usando pg_cron (Recomendado)

1. Ve a Supabase Dashboard > **SQL Editor**
2. Ejecuta el siguiente SQL:

```sql
-- Ejecutar cada 5 minutos para procesar recordatorios
SELECT cron.schedule(
  'process-push-reminders',
  '*/5 * * * *', -- Cada 5 minutos
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

**Nota**: Reemplaza `TU_PROJECT_REF` con tu Project Reference de Supabase (lo encuentras en Settings > API).

### Opción B: Usando un servicio externo (Cron-job.org, etc.)

Crea un cron job que llame a:
```
POST https://TU_PROJECT_REF.supabase.co/functions/v1/process-push-reminders
Headers:
  Authorization: Bearer TU_SERVICE_ROLE_KEY
```

## Paso 7: Probar las Notificaciones

1. Inicia tu aplicación en desarrollo: `npm run dev`
2. Inicia sesión en tu cuenta
3. Ve a **Configuración** > **Notificaciones**
4. Haz clic en **Activar** en la sección de Push Notifications
5. Acepta los permisos del navegador
6. Crea una nueva cita desde la página de booking público
7. Deberías recibir una notificación push

## Solución de Problemas

### Las notificaciones no aparecen

1. **Verifica los permisos del navegador**: Asegúrate de que las notificaciones estén permitidas para tu dominio
2. **Verifica la consola del navegador**: Busca errores relacionados con Firebase
3. **Verifica el Service Worker**: Abre DevTools > Application > Service Workers y verifica que `firebase-messaging-sw.js` esté registrado
4. **Verifica las variables de entorno**: Asegúrate de que todas las variables de Firebase estén correctamente configuradas

### Error: "FCM_SERVER_KEY no está configurada"

1. Ve a Supabase Dashboard > Edge Functions > Secrets
2. Verifica que `FCM_SERVER_KEY` esté configurado correctamente
3. Vuelve a desplegar la función: `supabase functions deploy send-push-notification`

### Error: "Service Worker registration failed"

1. Verifica que `firebase-messaging-sw.js` esté en la carpeta `public/`
2. Verifica que el archivo tenga las credenciales correctas de Firebase
3. Asegúrate de que tu aplicación esté servida sobre HTTPS (o localhost para desarrollo)

### Las notificaciones no se envían a empleados

1. Verifica que los empleados hayan activado las notificaciones push en sus dispositivos
2. Verifica que las preferencias de notificaciones estén habilitadas para el tipo de notificación correspondiente
3. Revisa los logs de la Edge Function en Supabase Dashboard

## Notas Importantes

- **HTTPS requerido**: Las notificaciones push solo funcionan en HTTPS (o localhost para desarrollo)
- **Permisos del navegador**: Los usuarios deben permitir las notificaciones manualmente
- **Tokens únicos**: Cada dispositivo tiene un token único que debe registrarse
- **Límites de FCM**: Firebase tiene límites en la cantidad de mensajes que puedes enviar. Revisa la documentación oficial.

## Recursos Adicionales

- [Documentación de Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Documentación de Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Web Push Notifications Guide](https://web.dev/push-notifications-overview/)
