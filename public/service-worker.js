importScripts('https://storage.googleapis.com/workbox-cdn/releases/4.3.1/workbox-sw.js')

if (workbox) {
  workbox.routing.registerRoute(
    '/',
    new workbox.strategies.StaleWhileRevalidate(),
  )
  workbox.routing.registerRoute(
    /\.(?:js|css|svg|html)$/,
    new workbox.strategies.StaleWhileRevalidate(),
  )
}
