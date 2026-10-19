/* Daiz-e v4.5.1 · CRECI PJ 438 sem quebra no rodapé, assinatura preservada */
const CACHE='daiz-e-v4-5-1-creci-pj-sem-quebra-20261018';
const SCOPE=self.registration.scope;
const INDEX=new URL('index.html',SCOPE).href;
const CORE=['./','index.html','manifest.webmanifest','icon-192.png?v=d2-20261014','icon-512.png?v=d2-20261014','icon-maskable-512.png?v=d2-20261014'];
// Bibliotecas exigidas para abrir o Daiz-e e gerar PDF/DOCX, sem incluir OCR.
const ESSENCIAIS=[
 'https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js',
 'https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js',
 'https://cdn.jsdelivr.net/npm/htm@3.1.1/dist/htm.umd.js',
 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'
];
const ESSENCIAIS_SET=new Set(ESSENCIAIS);
const APP_ORIGIN=new URL(SCOPE).origin;
function pertenceAoDaize(n){return n.startsWith('daiz-e-')||n.startsWith('daize-')||n.startsWith('daiz-ocr-')}
async function guardar(cache,req,res){
 if(res&&(res.ok||res.type==='opaque')){try{await cache.put(req,res.clone())}catch(e){/* sem espaço ou resposta não armazenável */}}
 return res;
}
self.addEventListener('install',evento=>{
 evento.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  await cache.addAll(CORE);
  // Reaproveita bibliotecas do SW anterior para não prejudicar o uso offline.
  await Promise.all(ESSENCIAIS.map(async url=>{
   try{
    const antigo=await caches.match(url);
    if(antigo){await cache.put(url,antigo);return}
    const resposta=await fetch(new Request(url,{mode:'no-cors',cache:'reload'}));
    await guardar(cache,url,resposta);
   }catch(e){/* repete o armazenamento na próxima navegação online */}
  }));
  await self.skipWaiting();
 })());
});
self.addEventListener('activate',evento=>{
 evento.waitUntil((async()=>{
  const ks=await caches.keys();
  await Promise.all(ks.filter(k=>k!==CACHE&&pertenceAoDaize(k)).map(k=>caches.delete(k)));
  await self.clients.claim();
 })());
});
self.addEventListener('fetch',evento=>{
 const req=evento.request;if(req.method!=='GET')return;
 const url=new URL(req.url);
 const essencial=ESSENCIAIS_SET.has(url.href);
 const mesmoSite=url.origin===APP_ORIGIN&&url.href.startsWith(SCOPE);
 // OCR online: não entra no cache controlado pelo Daiz-e.
 if(!mesmoSite&&!essencial)return;
 // A página busca versão nova quando há conexão, mas abre a versão em cache sem internet.
 if(req.mode==='navigate'){
  evento.respondWith((async()=>{
   try{
    const res=await fetch(req);
    if(res.ok){const copia=res.clone();evento.waitUntil(caches.open(CACHE).then(c=>c.put(INDEX,copia)).catch(()=>{}))}
    return res;
   }catch(e){return (await caches.match(INDEX))||(await caches.match(new URL('./',SCOPE).href))||Response.error()}
  })());
  return;
 }
 // JavaScript essencial e ícones: favorece o cache para funcionar offline.
 evento.respondWith((async()=>{
  const cached=await caches.match(req);
  if(cached)return cached;
  try{
   const res=await fetch(req);
   if(res.ok||res.type==='opaque'){const copia=res.clone();evento.waitUntil(caches.open(CACHE).then(c=>c.put(req,copia)).catch(()=>{}))}
   return res;
  }catch(e){return Response.error()}
 })());
});
