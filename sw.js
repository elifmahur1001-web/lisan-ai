const CACHE='lisan-ai-v4';
const ASSETS=['./','./index.html','./css/style.css','./js/app.js','./manifest.webmanifest','./data/dictionary_001.json'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));
