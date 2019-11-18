const { generateSW } = require('workbox-build')

generateSW({
  swDest: './public/service-worker.js',
  globDirectory: './public',
  globPatterns: [ '**/*.{js,css,html,svg}' ]
}).then(({ count, size }) => {
  console.log(`Generated service worker, which will precache ${count} files, totaling ${size} bytes.`);
})
