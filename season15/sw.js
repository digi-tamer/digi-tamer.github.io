// 예전 /season15/ 앱 캐시 정리: 새 서비스 워커가 깔리면 스스로 해제하고 열린 창을 /season2/ 로 보낸다
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil((async () => {
  await self.registration.unregister();
  for (const c of await self.clients.matchAll({ type: "window" })) c.navigate(c.url.replace("/season15/", "/season2/"));
})()));
