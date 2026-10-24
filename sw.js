/* Family Boutique service worker.
   Own static files: network first, but if the network takes longer than 2.5s the cached copy is shown instantly
   (so the app opens fast on slow connections). Firebase and all cross-origin requests are never touched. */
const C='fb-v3',A=['index.html','style.css','manifest.json'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(C).then(c=>Promise.all(A.map(u=>c.add(u).catch(()=>{})))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return;
  const net=fetch(r).then(res=>{
    if(res&&res.ok){const cp=res.clone();caches.open(C).then(c=>c.put(r,cp)).catch(()=>{})}
    return res;
  });
  const cached=()=>caches.match(r).then(m=>m||(r.mode==='navigate'?caches.match('index.html'):undefined));
  const slow=new Promise(res=>setTimeout(()=>res(cached()),2500));
  e.respondWith(Promise.race([net.catch(()=>cached().then(m=>m||Promise.reject())),slow.then(m=>m||net)]).catch(()=>cached().then(m=>m||Response.error())));
});
