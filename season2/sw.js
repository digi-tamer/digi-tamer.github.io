// 서비스 워커 (poke-brawl 과 같은 방식)
// - 이미지·소리 같은 에셋: 캐시 먼저 보여주고 뒤에서 새로 받아 갱신
// - 페이지·코드·version.json: 항상 네트워크에서 새로 받고(no-cache), 오프라인일 때만 캐시
const CACHE = "digi-tamer";
const ASSET = /\/assets\/.+\.(png|webp|jpg|jpeg|gif|woff2?|ttf|ogg|mp3|wav|m4a)(\?|$)/;

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  if (ASSET.test(req.url)) {
    e.respondWith(
      caches.open(CACHE).then((cache) =>
        cache.match(req).then((hit) => {
          const net = () => fetch(req)
            .then((res) => (res.ok && cache.put(req, res.clone()), res))
            .catch(() => hit || Response.error());
          // 주소에 내용 지문(?h=)이 있는 그림은 내용이 바뀌면 주소가 바뀐다 → 캐시에 있으면 다시 받지 않는다
          //  (전에는 매번 뒤에서 다시 받아 한 번 열 때 GitHub 요청 2,400번 → 같은 IP 요청 제한 「Rate limit exceeded」)
          if (hit) { if (!/[?&]h=/.test(req.url)) e.waitUntil(net().catch(() => {})); return hit; }
          return net();
        }),
      ),
    );
    return;
  }
  let fresh = req;
  try {
    fresh = req.mode === "navigate" ? new Request(req.url, { cache: "no-cache", credentials: "same-origin" }) : new Request(req, { cache: "no-cache" });
  } catch {}
  e.respondWith(
    fetch(fresh)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || Response.error())),
  );
});
