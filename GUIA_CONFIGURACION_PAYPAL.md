# Guía de Configuración de PayPal para Suscripciones

Esta guía te mostrará cómo configurar PayPal para que funcione con tu plataforma de suscripciones.

## 📋 Pasos de Configuración

### 1️⃣ Obtener Credenciales de PayPal

#### Para Pruebas (Sandbox)

1. Ve a [PayPal Developer Dashboard](https://developer.paypal.com/)
2. Inicia sesión (puedes usar tu cuenta personal de PayPal)
3. En el menú lateral, ve a **My Apps & Credentials**
4. Haz clic en **"Create App"**
5. Completa el formulario:
   - **App Name**: `Trimly Sandbox` (o el nombre que prefieras)
   - **Merchant**: Selecciona una cuenta de prueba (Sandbox)
   - **Features**: Marca **Subscriptions**
6. Haz clic en **"Create App"**
7. Copia el **Client ID** y **Secret** (haz clic en el ojo para ver el secret)

**⚠️ Importante**: Guarda estas credenciales en un lugar seguro. El Secret solo se muestra una vez.

#### Para Producción

1. Asegúrate de tener una cuenta **PayPal Business** verificada
2. Ve a [PayPal Developer Dashboard](https://developer.paypal.com/)
3. Crea una nueva aplicación para **Live** (producción)
4. Copia el **Client ID** y **Secret**

---

### 2️⃣ Configurar Secrets en Supabase

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. En el menú lateral, ve a **Edge Functions** → **Secrets**
3. Haz clic en **"Add a new secret"**
4. Agrega los siguientes secrets uno por uno:

| Nombre del Secret | Valor | Descripción |
|-------------------|-------|-------------|
| `PAYPAL_CLIENT_ID` | Tu Client ID de PayPal | El ID que copiaste de PayPal |
| `PAYPAL_CLIENT_SECRET` | Tu Secret de PayPal | El Secret que copiaste de PayPal |
| `PAYPAL_MODE` | `sandbox` o `live` | `sandbox` para pruebas, `live` para producción |
| `APP_URL` | `https://tu-app.vercel.app` | La URL de tu aplicación desplegada |

**Ejemplo de valores:**
```
PAYPAL_CLIENT_ID=AeA1QIZXIfr1tJcP1L2Q...
PAYPAL_CLIENT_SECRET=EF6FHKFGGGHD...
PAYPAL_MODE=sandbox
APP_URL=https://mi-barberia.vercel.app
```

**💡 Nota**: 
- Para desarrollo local, usa `PAYPAL_MODE=sandbox`
- Una vez que despliegues en producción, cambia a `PAYPAL_MODE=live`
- Si aún no has desplegado, usa una URL temporal y luego actualízala

---

### 3️⃣ Configurar Webhooks en PayPal

Los webhooks permiten que PayPal notifique a tu aplicación cuando ocurren eventos (pagos, cancelaciones, etc.).

#### Paso 3.1: Obtener la URL de tu Webhook

La URL de tu webhook es:
```
https://TU-PROJECT-REF.supabase.co/functions/v1/paypal-webhook
```

Para encontrar tu `PROJECT-REF`:
1. Ve a Supabase Dashboard → Settings → General
2. Busca el **Reference ID** (es algo como `abcdefghijklmnop`)

**Ejemplo de URL completa:**
```
https://abcdefghijklmnop.supabase.co/functions/v1/paypal-webhook
```

#### Paso 3.2: Configurar Webhook en PayPal (Sandbox)

1. Ve a [PayPal Developer Dashboard](https://developer.paypal.com/)
2. Selecciona tu aplicación de **Sandbox**
3. En la página de la aplicación, busca la sección **"Webhooks"**
4. Haz clic en **"Add Webhook"**
5. Ingresa:
   - **Webhook URL**: La URL que obtuviste en el paso anterior
   - **Event types**: Selecciona los siguientes eventos:
     - ✅ `BILLING.SUBSCRIPTION.ACTIVATED`
     - ✅ `BILLING.SUBSCRIPTION.CANCELLED`
     - ✅ `BILLING.SUBSCRIPTION.EXPIRED`
     - ✅ `BILLING.SUBSCRIPTION.SUSPENDED`
     - ✅ `PAYMENT.SALE.COMPLETED`
     - ✅ `PAYMENT.SALE.DENIED`
     - ✅ `PAYMENT.SALE.REFUNDED`
6. Haz clic en **"Save"**
7. PayPal generará un **Webhook ID** - guárdalo (no es crítico pero es útil)

#### Paso 3.3: Configurar Webhook en Producción

1. Repite los pasos anteriores pero con tu aplicación de **Live**
2. Asegúrate de usar la misma URL del webhook

---

### 4️⃣ Desplegar las Edge Functions

Necesitas desplegar las funciones `create-subscription` y `paypal-webhook` a Supabase.

#### Opción A: Usando Supabase CLI (Recomendado)

1. **Instalar Supabase CLI** (si no lo tienes):
   ```bash
   npm install -g supabase
   ```

2. **Iniciar sesión**:
   ```bash
   supabase login
   ```
   Esto abrirá tu navegador para autenticarte.

3. **Vincular tu proyecto**:
   ```bash
   supabase link --project-ref TU-PROJECT-REF
   ```
   Reemplaza `TU-PROJECT-REF` con el Reference ID de tu proyecto.

4. **Desplegar las funciones**:
   ```bash
   supabase functions deploy create-subscription
   supabase functions deploy paypal-webhook
   ```

#### Opción B: Usando el Dashboard de Supabase

Si prefieres usar la interfaz web:
1. Ve a Supabase Dashboard → Edge Functions
2. Haz clic en **"Create a new function"**
3. Para cada función, crea una nueva función y copia el código del archivo correspondiente:
   - `supabase/functions/create-subscription/index.ts`
   - `supabase/functions/paypal-webhook/index.ts`

---

### 5️⃣ Verificar la Configuración

Una vez configurado todo, verifica que funcione:

1. **Verifica los Secrets en Supabase**:
   - Ve a Edge Functions → Secrets
   - Asegúrate de que los 4 secrets estén configurados

2. **Verifica los Webhooks en PayPal**:
   - Ve a PayPal Developer Dashboard → Tu aplicación → Webhooks
   - Asegúrate de que el webhook esté configurado y aparezca como "Active"

3. **Prueba la integración**:
   - Inicia sesión en tu aplicación
   - Ve a **Configuración** (Dashboard → Settings)
   - Haz clic en **"Activar"** en la tarjeta de Suscripción
   - Deberías ser redirigido a PayPal
   - Completa el pago de prueba
   - Deberías ser redirigido de vuelta a tu aplicación
   - La suscripción debería aparecer como "Activa"

---

## 🧪 Cuentas de Prueba de PayPal (Sandbox)

PayPal te proporciona cuentas de prueba automáticamente:

1. Ve a PayPal Developer Dashboard → **Sandbox** → **Accounts**
2. PayPal crea automáticamente dos cuentas:
   - **Personal Account** (para probar como cliente)
   - **Business Account** (para probar como vendedor)

Puedes usar estas cuentas para probar el flujo completo sin usar dinero real.

---

## ❌ Solución de Problemas

### Error: "PayPal credentials not configured"

**Solución:**
- Verifica que hayas agregado los secrets en Supabase Dashboard
- Asegúrate de que los nombres sean exactos: `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_MODE`, `APP_URL`
- Verifica que no haya espacios extra o caracteres incorrectos

### Error: "Unauthorized" al crear suscripción

**Solución:**
- Verifica que el usuario esté autenticado
- Verifica que el usuario tenga el rol de "owner" de la barbería

### Los webhooks no se están recibiendo

**Solución:**
- Verifica que la URL del webhook sea correcta
- Verifica que la Edge Function `paypal-webhook` esté desplegada
- Verifica que el webhook esté "Active" en PayPal
- Revisa los logs de la Edge Function en Supabase Dashboard (Edge Functions → paypal-webhook → Logs)

### La suscripción no se activa después del pago

**Solución:**
- Verifica los logs de la Edge Function `create-subscription` en Supabase
- Verifica que la página `/subscription/callback` esté accesible
- Verifica que `APP_URL` esté configurado correctamente en los secrets

### Error al cancelar suscripción

**Solución:**
- Verifica que la suscripción tenga un `paypal_subscription_id` en la base de datos
- Verifica los logs de la Edge Function para ver el error específico

---

## 📝 Checklist de Configuración

Marca cada paso cuando lo completes:

- [ ] Obtener credenciales de PayPal (Client ID y Secret)
- [ ] Configurar `PAYPAL_CLIENT_ID` en Supabase Secrets
- [ ] Configurar `PAYPAL_CLIENT_SECRET` en Supabase Secrets
- [ ] Configurar `PAYPAL_MODE` en Supabase Secrets (sandbox para pruebas)
- [ ] Configurar `APP_URL` en Supabase Secrets
- [ ] Configurar webhook en PayPal (Sandbox)
- [ ] Desplegar Edge Function `create-subscription`
- [ ] Desplegar Edge Function `paypal-webhook`
- [ ] Probar crear una suscripción
- [ ] Verificar que la suscripción se active correctamente
- [ ] Probar cancelar una suscripción

---

## 🔒 Seguridad

- ⚠️ **NUNCA** expongas tus credenciales de PayPal en el código del cliente
- ⚠️ **NUNCA** subas tus credenciales a Git
- ✅ Todas las credenciales deben estar en Supabase Secrets
- ✅ Los secrets están seguros y solo son accesibles por las Edge Functions

---

## 📚 Recursos Adicionales

- [PayPal Developer Dashboard](https://developer.paypal.com/)
- [PayPal Subscriptions API Docs](https://developer.paypal.com/docs/api/subscriptions/v1/)
- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Documentación completa de configuración](./PAYPAL_SETUP.md)
