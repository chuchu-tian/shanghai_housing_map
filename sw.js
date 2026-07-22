// sw.js —— 极简 Service Worker：缓存应用外壳，支持“添加到主屏幕”与离线打开。
// 数据（收藏/房产）走网络（Supabase），不在此缓存，保证实时。
const CACHE = "shmap-shell-v2";
const SHELL = [
  "./", "./index.html", "./css/style.css",
  "./js/app.js", "./js/config.js", "./js/data.js", "./js/map.js",
  "./js/panel.js", "./js/filter.js", "./js/favorites.js",
  "./js/publish.js", "./js/editor.js", "./js/cloud.js",
  "./manifest.webmanifest", "./icon.svg",
];
self.addEventListener("install", e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener("activate", e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch", e=>{
  const url = new URL(e.request.url);
  // Supabase / 第三方数据请求：始终走网络（不缓存，保实时）
  if(url.origin !== location.origin){ return; }
  // 同源静态资源：缓存优先，回退网络
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res=>{
      // 数据文件不长期缓存（geojson/json 允许网络新鲜）
      return res;
    }).catch(()=>caches.match("./index.html")))
  );
});
