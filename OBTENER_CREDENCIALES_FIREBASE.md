# 🔥 Guía Rápida: Obtener Credenciales de Firebase

## Paso 1: Configuración de la App Web (2 minutos)

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Haz clic en el **ícono de engranaje** ⚙️ (Project Settings)
4. Ve a la pestaña **General**
5. Desplázate hasta **Your apps**
6. Si NO tienes una app web:
   - Haz clic en el ícono **Web** (`</>`)
   - Registra la app con nombre: **"Trimly Web App"**
   - Haz clic en **Register app**
7. **Copia** la configuración que aparece (firebaseConfig)

## Paso 2: VAPID Key (1 minuto) ⚠️ IMPORTANTE

1. En la misma página (Project Settings), ve a la pestaña **Cloud Messaging**
2. Desplázate hasta **Web configuration**
3. En **Web Push certificates**:
   - Si NO hay un par de claves, haz clic en **"Generate key pair"**
   - **IMPORTANTE**: Después de generar, verás DOS claves:
     - **Key pair** (esta es la CLAVE PÚBLICA - la que necesitas copiar)
     - **Private key** (NO uses esta, es solo para el servidor)
4. **Copia SOLO la Key pair (clave pública)** - es una cadena larga sin espacios
5. **Verifica que la clave:**
   - No tenga espacios ni saltos de línea
   - Solo contenga letras (A-Z, a-z), números (0-9), guiones (-) y guiones bajos (_)
   - Tenga aproximadamente 87 caracteres de longitud

## Paso 3: Server Key (30 segundos)

1. En la misma página (Project Settings > Cloud Messaging)
2. Desplázate hasta **Cloud Messaging API (Legacy)**
3. **Copia** el **Server key** (es una cadena muy larga que empieza con algo como "AAAA...")

---

## 🚀 Opción A: Usar el Script Automático

Una vez que tengas todas las credenciales:

```bash
node setup-firebase-credentials.js
```

El script te pedirá cada credencial y configurará todo automáticamente.

---

## 🚀 Opción B: Configuración Manual

### 1. Actualizar `.env.local`

Abre `.env.local` y agrega al final:

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

### 2. Actualizar `public/firebase-messaging-sw.js`

Reemplaza los valores en `firebaseConfig`:

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

### 3. Configurar Secreto en Supabase

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **Edge Functions** > **Secrets**
4. Haz clic en **Add new secret**
5. **Name**: `FCM_SERVER_KEY`
6. **Value**: Pega el Server Key que copiaste
7. Haz clic en **Save**

---

## ✅ Verificación

Después de configurar todo:

1. Reinicia tu servidor: `npm run dev`
2. Ve a tu app > Configuración > Notificaciones
3. Haz clic en **Activar** push notifications
4. Acepta los permisos del navegador
5. ¡Listo! 🎉
