import { Subject } from 'rxjs'
import { Workbox } from 'https://storage.googleapis.com/workbox-cdn/releases/4.3.1/workbox-window.prod.mjs';

export const workerWaiting$ = new Subject()

if ('serviceWorker' in navigator) {
  const wb = new Workbox('./service-worker.js');

  wb.addEventListener('waiting', (event) => {
    workerWaiting$.next(event)
  })

  wb.register()
}
