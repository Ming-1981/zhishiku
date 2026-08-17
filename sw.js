const CACHE_NAME = 'kb-v1';
const ASSETS = [
  './',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// 安装：缓存所有资源
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// 激活：清理旧缓存
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// 请求拦截：缓存优先，未命中则网络
self.addEventListener('fetch', e => {
  // POST 请求不缓存
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;

      return fetch(e.request).then(response => {
        // 非成功状态不缓存
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        return response;
      }).catch(() => {
        // 离线且无缓存，返回离线提示（仅对 HTML 请求）
        if (e.request.destination === 'document') {
          return caches.match('./综合知识库.html');
        }
      });
    })
  );
});
