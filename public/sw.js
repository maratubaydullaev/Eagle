const CACHE='pochemuchka-shell-v6'
const BASE=new URL('./',self.registration.scope).pathname
const SHELL=[BASE,BASE+'manifest.webmanifest',BASE+'icons/icon-192.svg',BASE+'icons/icon-512.svg']

self.addEventListener('install',event=>event.waitUntil(
  caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting())
))
self.addEventListener('activate',event=>event.waitUntil(
  caches.keys().then(keys=>Promise.all(
    keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))
  )).then(()=>self.clients.claim())
))
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return
  const requestUrl=new URL(event.request.url)
  const isNavigation=event.request.mode==='navigate' || requestUrl.pathname===BASE
  event.respondWith(
    (isNavigation
      ? fetch(event.request).then(response=>{
          if(response.ok){
            const copy=response.clone()
            caches.open(CACHE).then(cache=>cache.put(event.request,copy))
          }
          return response
        }).catch(()=>caches.match(event.request).then(cached=>cached||caches.match(BASE)))
      : caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{
          if(response.ok&&requestUrl.origin===self.location.origin){
            const copy=response.clone()
            caches.open(CACHE).then(cache=>cache.put(requestUrl.href,copy))
          }
          return response
        }).catch(()=>caches.match(BASE)))
    )
  )
})