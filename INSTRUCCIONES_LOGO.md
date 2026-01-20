# Instrucciones para Configurar el Logo

## ✅ Logo ya configurado

Tu logo SVG (`trimly-logo.svg`) ya está en uso. Se ha copiado a `public/trimly-logo.svg` y todas las referencias han sido actualizadas.

**Ubicación**: `public/trimly-logo.svg` (copiado desde `src/assets/trimly-logo.svg`)

## Paso 1: Verificar que el Logo se Vea Correctamente

1. Reinicia el servidor de desarrollo: `npm run dev`
2. Abre `http://localhost:5173/trimly-logo.svg` en el navegador
3. Verifica que el logo se muestre correctamente

## Paso 2: Probar Notificaciones

1. Crea una cita desde el booking público
2. Verifica que la notificación muestre el logo correcto
3. Verifica que solo llegue UNA notificación (no duplicada)

## Paso 3: Probar Acceso Directo (PWA)

1. En Chrome/Edge: Menú → "Instalar aplicación" o "Crear acceso directo"
2. Verifica que el icono del acceso directo sea tu logo naranja con "P" blanca
3. Abre la aplicación desde el acceso directo y verifica que funcione correctamente

## Notas

- El logo está en formato SVG (`trimly-logo.svg`)
- El logo se usa para:
  - Notificaciones push (icon y badge)
  - Icono de la PWA (acceso directo)
  - Favicon del sitio

### ⚠️ Nota sobre compatibilidad

Algunos navegadores móviles (especialmente iOS Safari) pueden requerir PNG para iconos de PWA. Si encuentras problemas con el icono en iOS:

1. Convierte tu SVG a PNG (512x512 o 1024x1024 píxeles)
2. Guarda como `public/trimly-logo.png`
3. Actualiza `public/manifest.json` para incluir ambos formatos:
   ```json
   "icons": [
     {
       "src": "/trimly-logo.svg",
       "sizes": "any",
       "type": "image/svg+xml"
     },
     {
       "src": "/trimly-logo.png",
       "sizes": "512x512",
       "type": "image/png"
     }
   ]
   ```

## Si el Logo No Aparece

1. Verifica que el archivo esté en `public/trimly-logo.svg`
2. Verifica que el archivo no esté corrupto
3. Limpia la caché del navegador (Ctrl+Shift+Delete)
4. En producción, asegúrate de que el archivo se haya subido correctamente a Vercel
