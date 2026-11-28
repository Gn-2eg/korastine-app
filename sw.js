/* كورهسطين app shell */
const CACHE = "korastine-app-v46";
const SHELL = ["./", "./index.html", "./app.css", "./app.js", "./live.js",
  "./manifest.webmanifest", "./assets-brand.svg", "./favicon.png",
  "./app-192.png", "./app-256.png", "./app-512.png", "./favicon.svg", "./favicon-48.png", "./apple-touch-icon.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE)
    .then((c) => Promise.all(SHELL.map((u) => c.add(u).catch(() => null))))
    .then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

/* الملفات اللي بتتغير (html/js/css): من الشبكة الأول عشان أي نشر غلط ما يعلقش في المتصفح.
   الصور واللوجوهات: من الكاش الأول عشان السرعة. */
const NET_FIRST = /\.(?:html|js|css|webmanifest)$/i;

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.endsWith("/fixtures.json") || url.pathname.endsWith("/tv.json") || url.pathname.endsWith("/tables.json")) return;

  const netFirst = NET_FIRST.test(url.pathname) || url.pathname.endsWith("/");
  if (netFirst) {
    e.respondWith(
      fetch(req).then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => null);
        }
        return res;
      }).catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || (req.mode === "navigate" ? caches.match("./index.html") : Response.error())))
    );
    return;
  }

  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req).then((res) => {
      if (res && res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => null);
      }
      return res;
    }).catch(() => null))
  );
});
