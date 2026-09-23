// Iron Log offline support.
// Network-first: with signal you always get the latest version from GitHub Pages.
// Without signal (gym basement), the last copy that loaded is served instead.
const CACHE = "iron-log-v1";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // leave fonts and other sites alone

  // Revalidate the page itself on every launch so updates show up promptly
  const netReq = req.mode === "navigate"
    ? new Request(req.url, { cache: "no-cache", credentials: "same-origin" })
    : req;

  event.respondWith(
    fetch(netReq)
      .then(res => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      })
      .catch(() =>
        caches.match(req, { ignoreSearch: true })
          .then(hit => hit || caches.match("./", { ignoreSearch: true }))
      )
  );
});
