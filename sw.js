// Service Worker para la aplicación PWA
const CACHE_NAME = 'cotizador-cache-v1';

// Archivos que queremos guardar en caché para funcionamiento offline
const CACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/styles/main.css',
  '/styles/brands/construccion.css',
  '/js/app.js',
  '/js/cotizacion.js',
  '/js/config.js',
  '/js/pdf.js',
  '/assets/logos/construccion.png',
  '/assets/logos/skillhub.png'
];

// Instalación del Service Worker
self.addEventListener('install', event => {
  console.log('Service Worker: Instalando...');
  
  // Esperar hasta que la caché esté lista
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Archivos en caché');
        return cache.addAll(CACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activación del Service Worker
self.addEventListener('activate', event => {
  console.log('Service Worker: Activado');
  
  // Eliminar cachés antiguas
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Limpiando caché antigua');
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Interceptar las peticiones
self.addEventListener('fetch', event => {
  console.log('Service Worker: Interceptando fetch', event.request.url);
  
  // Estrategia Cache First
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si encontramos en caché, devolvemos la respuesta
        if (response) {
          return response;
        }
        
        // Si no, hacemos la petición real
        return fetch(event.request)
          .then(response => {
            // Si la respuesta es válida, la almacenamos en caché
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
              
            return response;
          })
          .catch(err => {
            console.error('Error en fetch:', err);
            // Aquí podríamos devolver una página de fallback
          });
      })
  );
});