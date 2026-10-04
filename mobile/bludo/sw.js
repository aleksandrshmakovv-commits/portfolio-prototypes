const CACHE='bludo-static-v2';
const FILES=['./index.html','./styles.css','./data.js','./state.js','./views.js','./app.js','./manifest.webmanifest','./assets/icon.svg','./assets/icon-192.png','./assets/icon-512.png','./assets/chicken.png','./assets/udon.png','./assets/tofu.png','./assets/salad.png','./assets/lemonade.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('bludo-static-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const url=new URL(event.request.url),scope=new URL(self.registration.scope);
 if(url.origin!==scope.origin||!url.pathname.startsWith(scope.pathname))return;
 const suffix=url.pathname.slice(scope.pathname.length);
 if(!FILES.some(file=>file.slice(2)===suffix)&&suffix!=='')return;
 event.respondWith(fetch(event.request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));}return response;}).catch(()=>caches.match(event.request).then(found=>found||(event.request.mode==='navigate'?caches.match('./index.html'):Response.error()))));
});
