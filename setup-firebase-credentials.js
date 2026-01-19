/**
 * Script para configurar credenciales de Firebase automáticamente
 * 
 * USO:
 * 1. Obtén tus credenciales de Firebase Console
 * 2. Ejecuta: node setup-firebase-credentials.js
 * 3. Ingresa las credenciales cuando se te solicite
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createInterface } from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('\n🔥 Configuración de Firebase para Push Notifications\n');
  console.log('Necesitarás las siguientes credenciales de Firebase Console:\n');
  console.log('1. Ve a Firebase Console > Project Settings > General');
  console.log('2. En "Your apps", haz clic en el ícono Web (</>)');
  console.log('3. Copia los valores de firebaseConfig\n');
  console.log('4. Ve a Project Settings > Cloud Messaging');
  console.log('5. Genera un VAPID key pair y copia la key');
  console.log('6. Copia el Server key de Cloud Messaging API (Legacy)\n');

  const credentials = {
    apiKey: await question('API Key: '),
    authDomain: await question('Auth Domain: '),
    projectId: await question('Project ID: '),
    storageBucket: await question('Storage Bucket: '),
    messagingSenderId: await question('Messaging Sender ID: '),
    appId: await question('App ID: '),
    measurementId: await question('Measurement ID (opcional, presiona Enter si no tienes): ') || '',
    vapidKey: await question('\nVAPID Key (de Cloud Messaging > Web Push certificates): '),
    serverKey: await question('Server Key (de Cloud Messaging API Legacy): ')
  };

  // 1. Actualizar .env.local
  const envPath = join(__dirname, '.env.local');
  let envContent = '';
  
  if (existsSync(envPath)) {
    envContent = readFileSync(envPath, 'utf-8');
  }
  
  // Agregar o actualizar variables de Firebase
  const firebaseEnvVars = `
# Firebase Configuration
VITE_FIREBASE_API_KEY=${credentials.apiKey}
VITE_FIREBASE_AUTH_DOMAIN=${credentials.authDomain}
VITE_FIREBASE_PROJECT_ID=${credentials.projectId}
VITE_FIREBASE_STORAGE_BUCKET=${credentials.storageBucket}
VITE_FIREBASE_MESSAGING_SENDER_ID=${credentials.messagingSenderId}
VITE_FIREBASE_APP_ID=${credentials.appId}
VITE_FIREBASE_MEASUREMENT_ID=${credentials.measurementId}
VITE_FIREBASE_VAPID_KEY=${credentials.vapidKey}
`;

  // Remover variables de Firebase existentes si las hay
  const lines = envContent.split('\n');
  const filteredLines = [];
  let skipFirebaseVars = false;
  
  for (const line of lines) {
    if (line.includes('# Firebase Configuration')) {
      skipFirebaseVars = true;
      continue;
    }
    if (skipFirebaseVars && line.startsWith('VITE_FIREBASE_')) {
      continue;
    }
    if (skipFirebaseVars && line.trim() === '') {
      skipFirebaseVars = false;
      continue;
    }
    filteredLines.push(line);
  }
  
  envContent = filteredLines.join('\n') + firebaseEnvVars;
  writeFileSync(envPath, envContent, 'utf-8');
  console.log('\n✅ Variables de entorno actualizadas en .env.local');

  // 2. Actualizar firebase-messaging-sw.js
  const swPath = join(__dirname, 'public', 'firebase-messaging-sw.js');
  let swContent = readFileSync(swPath, 'utf-8');
  
  swContent = swContent.replace(
    /const firebaseConfig = \{[\s\S]*?\};/,
    `const firebaseConfig = {
  apiKey: "${credentials.apiKey}",
  authDomain: "${credentials.authDomain}",
  projectId: "${credentials.projectId}",
  storageBucket: "${credentials.storageBucket}",
  messagingSenderId: "${credentials.messagingSenderId}",
  appId: "${credentials.appId}",
  measurementId: "${credentials.measurementId}",
};`
  );
  
  writeFileSync(swPath, swContent, 'utf-8');
  console.log('✅ Service Worker actualizado (public/firebase-messaging-sw.js)');

  console.log('\n📋 Próximos pasos:');
  console.log('1. Ve a Supabase Dashboard > Edge Functions > Secrets');
  console.log(`2. Agrega el secreto: FCM_SERVER_KEY = ${credentials.serverKey}`);
  console.log('3. Reinicia tu servidor de desarrollo: npm run dev');
  console.log('\n✨ ¡Configuración completada!\n');

  rl.close();
}

main().catch(console.error);
