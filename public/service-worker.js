importScripts('https://storage.googleapis.com/workbox-cdn/releases/4.3.1/workbox-sw.js')

if (workbox) {
  workbox.precaching.precacheAndRoute([
    '/index.html'
  ])
  workbox.routing.registerRoute(
    /\.(?:js|css|svg)$/,
    new workbox.strategies.StaleWhileRevalidate(),
  )
}
