/* Family Boutique service worker: network-first for our own static files, cached copy only when offline.
   Firebase and every other cross-origin request is never touched (all data comes live from Firebase). */
const C='fb-v2',A=['index.html','style.css','manifest.json'];
self.addEventListener('install',e=>{
  /* Cache each file separately so one missing file (e.g. an icon) can never break installation */
  e.waitUntil(caches.open(C).then(c=>Promise.all(A.map(u=>c.add(u).catch(()=>{})))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return;
  e.respondWith(
    fetch(r).then(res=>{
      if(res&&res.ok){const cp=res.clone();caches.open(C).then(c=>c.put(r,cp)).catch(()=>{})}
      return res;
    }).catch(()=>caches.match(r).then(m=>m||caches.match('index.html')))
  );
});
