const CACHE_NAME = 'cotizador-v1';
const urlsToCache = [
    '/cotizador/',
    '/cotizador/index.html',
    '/cotizador/styles/main.css',
    '/cotizador/styles/brands/construccion.css',
    '/cotizador/js/app.js',
    '/cotizador/js/config.js',
    '/cotizador/js/cotizacion.js',
    '/cotizador/js/clientes.js',
    '/cotizador/js/historial.js',
    '/cotizador/js/pdf.js',
    '/cotizador/js/sync.js',
    '/cotizador/assets/logos/construccion.png',
    '/cotizador/assets/logos/skillhub.png',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                return fetch(event.request)
                    .then(response => {
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                        return response;
                    });
            })
    );
});

// Actualizar la caché cuando hay una nueva versión
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});