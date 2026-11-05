// The meal planner's service worker: keeps the app's few files on the phone so it opens with no
// signal at the store. Built by products/meal_planner/build_app.py, which stamps the version below
// from the app's content, so a new build replaces the old cache. The buyer's plan is never here:
// it lives in the page's localStorage and no request carries it.
var CACHE = 'meal-planner-89ecd2709d79';
var FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf('meal-planner-') === 0 && k !== CACHE; })
      .map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

// Cache first, so a weak signal never stalls the page; refresh the copy in the background.
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  var key = req.mode === 'navigate' ? './index.html' : req;
  e.respondWith(caches.open(CACHE).then(function (c) {
    return c.match(key, { ignoreSearch: true }).then(function (hit) {
      var net = fetch(req).then(function (res) {
        if (res && res.ok) c.put(key, res.clone());
        return res;
      }).catch(function () { return hit; });
      return hit || net;
    });
  }));
});
