// Service Worker para Firebase Cloud Messaging
// Este archivo debe estar en la carpeta public/
//
// IMPORTANTE: Actualiza las credenciales de Firebase aquí con los valores de tu proyecto.
// Obtén estos valores en: Firebase Console > Project Settings > General > Your apps > Web app

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Configuración de Firebase (debe coincidir con la del frontend)
// Valores reales de tu proyecto Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCIyX6-bq5s5K8r21u7oK3YdZqx6ruJwS8",
  authDomain: "trimly-6de39.firebaseapp.com",
  projectId: "trimly-6de39",
  storageBucket: "trimly-6de39.firebasestorage.app",
  messagingSenderId: "876841253449",
  appId: "1:876841253449:web:3272655e8c3b03d1cd9d98",
  measurementId: "G-QEMCCBW7R1",
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Activar el Service Worker inmediatamente cuando se instala
self.addEventListener('install', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker installing...');
  // Forzar activación inmediata
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker activating...');
  // Tomar control de todas las páginas inmediatamente
  event.waitUntil(
    clients.claim().then(() => {
      console.log('[firebase-messaging-sw.js] Service Worker activo y controlando todas las páginas');
    })
  );
});

// Escuchar mensajes del cliente para activar el Service Worker
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Obtener instancia de messaging
const messaging = firebase.messaging();

// Manejar mensajes en segundo plano
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || 'Nueva notificación';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: payload.notification?.icon || '/favicon.ico',
    badge: '/favicon.ico',
    tag: payload.data?.appointmentId,
    data: payload.data,
    requireInteraction: true,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Manejar clics en notificaciones
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click received.');
  
  event.notification.close();

  // Abrir la aplicación en la URL especificada
  const urlToOpen = event.notification.data?.url || '/dashboard';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Si hay una ventana abierta, enfocarla
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Si no hay ventana abierta, abrir una nueva
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
