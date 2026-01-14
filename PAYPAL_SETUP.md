# Configuración de PayPal para Suscripciones

Esta guía te ayudará a configurar PayPal para manejar suscripciones en tu plataforma.

## Requisitos Previos

- Cuenta de PayPal Business (o Developer Account)
- Proyecto de Supabase configurado
- Acceso a Supabase Dashboard

## Paso 1: Obtener Credenciales de PayPal

### Para Ambiente de Pruebas (Sandbox)

1. Ve a [PayPal Developer Dashboard](https://developer.paypal.com/)
2. Inicia sesión con tu cuenta de PayPal
3. Ve a **My Apps & Credentials**
4. Crea una nueva aplicación:
   - Click en **"Create App"**
   - Nombre: `Trimly Sandbox` (o el que prefieras)
   - Sandbox: Selecciona una cuenta de prueba o crea una nueva
   - Features: Selecciona **Subscriptions**
5. Copia el **Client ID** y **Client Secret**

### Para Producción

1. Ve a [PayPal Developer Dashboard](https://developer.paypal.com/)
2. Asegúrate de tener una cuenta Business verificada
3. Ve a **My Apps & Credentials**
4. Crea una nueva aplicación para producción
5. Copia el **Client ID** y **Client Secret**

## Paso 2: Configurar Variables de Entorno en Supabase

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Navega a **Edge Functions** → **Secrets**
3. Agrega las siguientes variables:

   ```
   PAYPAL_CLIENT_ID=tu_client_id_aqui
   PAYPAL_CLIENT_SECRET=tu_client_secret_aqui
   PAYPAL_MODE=sandbox
   APP_URL=https://tu-app.vercel.app
   ```

   **Nota:** 
   - Para producción, cambia `PAYPAL_MODE` a `live`
   - `APP_URL` debe ser la URL de tu aplicación desplegada (ej: https://trimly.it.com)

## Paso 3: Configurar Webhooks de PayPal

Los webhooks permiten que PayPal notifique a tu aplicación cuando ocurren eventos importantes (pagos, cancelaciones, etc.).

### Para Sandbox

1. Ve a [PayPal Developer Dashboard](https://developer.paypal.com/)
2. Selecciona tu aplicación de Sandbox
3. Ve a la sección **Webhooks**
4. Click en **Add Webhook**
5. URL del Webhook: 
   ```
   https://tu-project-ref.supabase.co/functions/v1/paypal-webhook
   ```
   Reemplaza `tu-project-ref` con el ID de tu proyecto Supabase
6. Selecciona los siguientes eventos:
   - `BILLING.SUBSCRIPTION.ACTIVATED`
   - `BILLING.SUBSCRIPTION.CANCELLED`
   - `BILLING.SUBSCRIPTION.EXPIRED`
   - `BILLING.SUBSCRIPTION.SUSPENDED`
   - `PAYMENT.SALE.COMPLETED`
   - `PAYMENT.SALE.DENIED`
   - `PAYMENT.SALE.REFUNDED`
7. Guarda el Webhook ID (lo necesitarás para verificación avanzada)

### Para Producción

1. Ve a tu cuenta Business de PayPal
2. Navega a **Account Settings** → **Website preferences** → **Update**
3. En la sección **Website preferences**, busca **Instant Payment Notifications (IPN)**
4. O usa el Dashboard de Developer para configurar webhooks similares a Sandbox

## Paso 4: Desplegar Edge Functions

Asegúrate de desplegar las Edge Functions a Supabase:

```bash
# Si estás usando Supabase CLI
supabase functions deploy create-subscription
supabase functions deploy paypal-webhook
```

O desde el Dashboard de Supabase:
1. Ve a **Edge Functions**
2. Sube los archivos de las funciones manualmente

## Paso 5: Probar la Integración

### Prueba Manual

1. Inicia sesión en tu aplicación
2. Ve a **Configuración** (Dashboard → Settings)
3. Click en **Activar** en la tarjeta de Suscripción
4. Deberías ser redirigido a PayPal para aprobar la suscripción
5. Completa el pago en PayPal (usa una cuenta de prueba en Sandbox)
6. Deberías ser redirigido de vuelta a tu aplicación
7. La suscripción debería aparecer como "Activa"

### Cuentas de Prueba de PayPal

Para Sandbox, puedes usar las cuentas de prueba que PayPal genera automáticamente, o crear las tuyas:
- PayPal te proporciona cuentas de prueba (comprador y vendedor)
- Puedes usar tarjetas de prueba de PayPal

## Solución de Problemas

### Error: "PayPal credentials not configured"

- Verifica que hayas agregado las variables de entorno en Supabase Edge Functions Secrets
- Asegúrate de que los nombres sean exactamente: `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_MODE`, `APP_URL`

### Error: "Unauthorized" al crear suscripción

- Verifica que el usuario esté autenticado
- Verifica que el usuario sea owner de la barbería

### Los webhooks no se están recibiendo

- Verifica que la URL del webhook sea correcta
- Verifica que la Edge Function `paypal-webhook` esté desplegada
- Verifica que `verify_jwt = false` esté configurado en `supabase/config.toml` para `paypal-webhook`
- Revisa los logs de la Edge Function en Supabase Dashboard

### La suscripción no se activa después del pago

- Verifica los logs de la Edge Function `create-subscription`
- Verifica que el callback URL esté configurado correctamente en PayPal
- Verifica que la página `/subscription/callback` esté accesible

## Estructura de Datos

Las suscripciones se almacenan en la tabla `subscriptions` con los siguientes campos relevantes:

- `barbershop_id`: ID de la barbería
- `status`: Estado de la suscripción (`trial`, `active`, `past_due`, `canceled`, `inactive`)
- `paypal_plan_id`: ID del plan en PayPal
- `paypal_subscription_id`: ID de la suscripción en PayPal
- `current_period_end`: Fecha de fin del período actual
- `last_payment_status`: Último estado del pago

## Notas Importantes

- **Seguridad**: Nunca expongas tus credenciales de PayPal en el código del cliente
- **Pruebas**: Siempre prueba en Sandbox antes de usar en producción
- **Webhooks**: Los webhooks son críticos para mantener la sincronización entre PayPal y tu base de datos
- **Idempotencia**: La función de webhook maneja eventos duplicados verificando si el evento ya fue procesado

## Recursos Adicionales

- [PayPal Subscriptions API Documentation](https://developer.paypal.com/docs/api/subscriptions/v1/)
- [PayPal Webhooks Documentation](https://developer.paypal.com/docs/api-basics/notifications/webhooks/)
- [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions)
