# ✅ Checklist de Verificación Final - PayPal Live

Usa esta lista para verificar que todo esté configurado correctamente antes de probar.

## 🔐 1. Secrets en Supabase

Ve a **Supabase Dashboard** → **Edge Functions** → **Secrets** y verifica:

- [ ] `PAYPAL_CLIENT_ID` configurado con credenciales de **Live** (no Sandbox)
- [ ] `PAYPAL_CLIENT_SECRET` configurado con credenciales de **Live** (no Sandbox)
- [ ] `PAYPAL_MODE` = `live` (no `sandbox`)
- [ ] `APP_URL` = URL de tu aplicación en producción (ej: `https://tu-app.vercel.app`)

**⚠️ Importante**: Las credenciales deben ser de PayPal **Live**, no de Sandbox.

---

## 🎣 2. Webhook en PayPal Live

1. Ve a [PayPal Developer Dashboard](https://developer.paypal.com/)
2. Asegúrate de estar en **Live** (no Sandbox)
3. Ve a tu aplicación de Live → **Webhooks**
4. Verifica:

- [ ] Webhook configurado con la URL: `https://signdzrwijfpxpvqragx.supabase.co/functions/v1/paypal-webhook`
- [ ] El webhook aparece como **"Active"** o **"Activo"**
- [ ] Los eventos están seleccionados:
  - [ ] `BILLING.SUBSCRIPTION.ACTIVATED`
  - [ ] `BILLING.SUBSCRIPTION.CANCELLED`
  - [ ] `BILLING.SUBSCRIPTION.EXPIRED`
  - [ ] `BILLING.SUBSCRIPTION.SUSPENDED`
  - [ ] `PAYMENT.SALE.COMPLETED`
  - [ ] `PAYMENT.SALE.DENIED`
  - [ ] `PAYMENT.SALE.REFUNDED`

---

## ⚡ 3. Edge Functions Desplegadas

Ve a **Supabase Dashboard** → **Edge Functions** y verifica:

- [ ] `create-subscription` está desplegada
- [ ] `paypal-webhook` está desplegada

Si no están desplegadas:
```bash
supabase functions deploy create-subscription
supabase functions deploy paypal-webhook
```

---

## 🌐 4. Variables de Entorno en Vercel/Hosting

Si tu app está desplegada en Vercel u otra plataforma, verifica:

- [ ] `VITE_SUPABASE_URL` configurada
- [ ] `VITE_SUPABASE_PUBLISHABLE_KEY` configurada
- [ ] `VITE_APP_URL` configurada con la URL de producción

---

## 🔄 5. Redirect URLs en Supabase Auth

Ve a **Supabase Dashboard** → **Authentication** → **URL Configuration**:

- [ ] **Site URL** = URL de tu aplicación en producción
- [ ] **Redirect URLs** incluye tu URL de producción con `/**`

Ejemplo:
- Site URL: `https://tu-app.vercel.app`
- Redirect URLs: `https://tu-app.vercel.app/**`

---

## ✅ Verificación Final

Si todas las casillas anteriores están marcadas, **¡sí, debería funcionar!**

### Próximos Pasos:

1. **Prueba la integración**:
   - Inicia sesión en tu aplicación en producción
   - Ve a **Configuración** (Dashboard → Settings)
   - Haz clic en **"Activar"** en la tarjeta de Suscripción
   - Deberías ser redirigido a PayPal
   - Completa el proceso de pago (con una cuenta PayPal real)
   - Deberías ser redirigido de vuelta a tu aplicación
   - La suscripción debería aparecer como "Activa"

2. **Si algo no funciona**:
   - Revisa los logs de las Edge Functions en Supabase Dashboard
   - Verifica que los secrets estén correctos
   - Asegúrate de que el webhook esté "Active" en PayPal

---

## 🚨 Problemas Comunes

### La suscripción no se activa después del pago

**Solución:**
- Verifica los logs de `create-subscription` en Supabase Dashboard
- Verifica que `APP_URL` esté correctamente configurado
- Verifica que la página `/subscription/callback` esté accesible

### Error: "PayPal credentials not configured"

**Solución:**
- Verifica que todos los secrets estén configurados en Supabase
- Verifica que `PAYPAL_MODE=live` (no `sandbox`)
- Verifica que las credenciales sean de Live, no de Sandbox

### Los webhooks no funcionan

**Solución:**
- Verifica que el webhook esté configurado en PayPal **Live** (no Sandbox)
- Verifica que el webhook aparezca como "Active"
- Revisa los logs de `paypal-webhook` en Supabase Dashboard

---

## 🎉 ¡Listo para Producción!

Si completaste todos los pasos del checklist, tu aplicación está lista para recibir suscripciones reales con PayPal.

**Buena suerte con tu aplicación! 🚀**
