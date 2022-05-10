const STATIC_CACHE = "static-version-6";
const DYNAMIC_CACHE = "dynamic-version-1";

// Cached een paar standaard dingen + cached ook automatisch al de rest,
// Zo kan je volledig afline tussen alle laptops scrollen

const
    staticFiles = [
        '/PROJECT/public/',
        './pages/contact.html',
        './pages/repairs.html',
        './pages/shoppingCart.html',
        './images',
        './index.html',
        './styles/style.css',
        './myscript.js',
        './app.js',
        'https://fonts.googleapis.com/icon?family=Material+Icons',
        'https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/js/materialize.min.js',
        './manifest.json'
    ];



self.addEventListener("install", event => {
    console.log("Service Worker Installed: ");
    console.log(event);

    event.waitUntil(
        caches.open(STATIC_CACHE).then(cache => {
            console.log("caching files", cache)
            cache.addAll(staticFiles);
        })
    )
});

self.addEventListener("activate", event => {
    console.log("Service Worker Activated:");
    console.log(event);

    event.waitUntil(
        caches.keys().then(keys => {
            console.log("cache Keys", keys);

            return Promise.all(keys
                .filter(key => ((key !== STATIC_CACHE) && (key !== DYNAMIC_CACHE)))
                .map(key => caches.delete(key)))
        })
    );
});

self.addEventListener("fetch", event => {
    console.log("fetching:", event);

    event.respondWith(
        caches.match(event.request).then(cacheResponse => {
            return cacheResponse || fetch(event.request).then(fetchResponse =>{
                return caches.open(DYNAMIC_CACHE).then(cache => {
                    cache.put(event.request.url, fetchResponse.clone());
                    return fetchResponse;
                })
            })
        })
    )
});

self.addEventListener('push', event => {
    console.log(event);
    console.log("Notification was pushed from the push service: ", event.data.text());
    event.waitUntil(
        // Zie ook: https://github.com/Minishlink/web-push-php-example/blob/master/src/serviceWorker.js
        self.registration.showNotification(event.data.text())
    );    
});