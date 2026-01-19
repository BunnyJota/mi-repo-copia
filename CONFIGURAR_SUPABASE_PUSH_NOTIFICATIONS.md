# Configurar Secrets en Supabase para Push Notifications

## ✅ Lo que ya está hecho:
- ✅ Migraciones de base de datos aplicadas
- ✅ Edge Functions desplegadas
- ✅ VAPID Key configurada en `.env`

## 🔧 Lo que necesitas configurar en Supabase:

### Paso 1: Obtener Service Account de Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto: **trimly-6de39**
3. Ve a **Project Settings** (⚙️) > **Service accounts**
4. Haz clic en **Generate new private key**
5. Se descargará un archivo JSON con las credenciales
6. **Abre el archivo JSON** y copia estos valores:
   - `project_id` → Este es tu `FIREBASE_PROJECT_ID`
   - `client_email` → Este es tu `FIREBASE_CLIENT_EMAIL`
   - `private_key` → Este es tu `FIREBASE_PRIVATE_KEY` (copia TODO el contenido, incluyendo `-----BEGIN PRIVATE KEY-----` y `-----END PRIVATE KEY-----`)

### Paso 2: Configurar Secrets en Supabase

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **Edge Functions** > **Secrets**
4. Haz clic en **Add new secret** y agrega estos 3 secrets:

#### Secret 1: FIREBASE_PROJECT_ID
- **Name**: `FIREBASE_PROJECT_ID`
- **Value**: `trimly-6de39` (o el project_id de tu archivo JSON)

#### Secret 2: FIREBASE_CLIENT_EMAIL
- **Name**: `FIREBASE_CLIENT_EMAIL`
- **Value**: El `client_email` del archivo JSON (algo como `firebase-adminsdk-xxxxx@trimly-6de39.iam.gserviceaccount.com`)

#### Secret 3: FIREBASE_PRIVATE_KEY
- **Name**: `FIREBASE_PRIVATE_KEY`
- **Value**: El `private_key` completo del archivo JSON (incluyendo las líneas `-----BEGIN PRIVATE KEY-----` y `-----END PRIVATE KEY-----`)

**⚠️ IMPORTANTE para FIREBASE_PRIVATE_KEY:**
- Copia TODO el contenido del campo `private_key` del JSON
- Debe incluir los saltos de línea (`\n`) o puedes pegarlo tal cual
- El formato debe ser:
  ```
  -----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n
  ```
- O simplemente pega el texto completo con los saltos de línea reales

### Paso 3: Verificar que funcionó

1. Ve a **Edge Functions** > **Logs**
2. Busca la función `send-push-notification`
3. Intenta activar las notificaciones push en tu app
4. Si ves errores sobre credenciales faltantes, verifica que los 3 secrets estén configurados correctamente

---

## 📝 Resumen de Secrets Necesarios:

| Secret Name | Valor | Dónde obtenerlo |
|-------------|-------|-----------------|
| `FIREBASE_PROJECT_ID` | `trimly-6de39` | Firebase Console > Project Settings > Service accounts > JSON |
| `FIREBASE_CLIENT_EMAIL` | `firebase-adminsdk-...@...iam.gserviceaccount.com` | Mismo JSON |
| `FIREBASE_PRIVATE_KEY` | `-----BEGIN PRIVATE KEY-----...-----END PRIVATE KEY-----` | Mismo JSON |

---

## ✅ Una vez configurado:

Las notificaciones push deberían funcionar automáticamente cuando:
- Un usuario activa las notificaciones en la app
- Se crea una nueva cita
- Se activan los recordatorios (si configuraste el cron job)
