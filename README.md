# Dice Roller

Dice rolling web app

Based on the [*Reactive Components with RxJS workshop*](https://github.com/basham/swit-workshop-rxjs).

## Install

```
npm install
```

## Start

Start the local development server. It should automatically open the browser to [`http://localhost:8000/`](http://localhost:8000/).

```
npm run start
```

## Development environment

This repo uses a ["buildless" environment](https://dev.to/open-wc/on-the-bleeding-edge-3cb8). There is no Webpack or other bundling system. [`@pika/web`](https://github.com/pikapkg/web) prepares browser dependencies as JS modules and generates an import map. [`es-module-shims`](https://github.com/guybedford/es-module-shims) provides support for [import maps](https://github.com/WICG/import-maps), JS modules, and CSS modules (via [`construct-style-sheets-polyfill`](https://github.com/calebdwilliams/construct-style-sheets)).
