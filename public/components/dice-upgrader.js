import { BehaviorSubject } from 'rxjs'
import { map, tap, withLatestFrom } from 'rxjs/operators'
import { adoptStyles, define, html, renderComponent } from '../util/dom.js'
import { combineLatestObject, useSubscribe, fromEventSelector, next } from '../util/rx.js'
import { workerWaiting$ } from '../service-worker-register.js'
import styles from './dice-upgrader.css'

adoptStyles(styles)

const states = {
  IDLE: 'idle',
  PROMPT: 'prompt',
  UPGRADING: 'upgrading'
}

const renderMap = {
  [states.IDLE]: renderIdle,
  [states.PROMPT]: renderPrompt,
  [states.UPGRADING]: renderUpgrading
}

define('dice-upgrader', (el) => {
  const [ subscribe, unsubscribe ] = useSubscribe()

  const state$ = new BehaviorSubject(states.IDLE)

  const worker$ = workerWaiting$.pipe(
    map(({ target }) => target),
    next(state$, () => states.PROMPT)
  )
  subscribe(worker$)

  const upgrade$ = fromEventSelector(el, 'button[data-upgrade]', 'click').pipe(
    withLatestFrom(worker$),
    map(([ , worker ]) => worker),
    tap((worker) => {
      worker.addEventListener('controlling', (event) => {
        window.location.reload()
      })
      worker.messageSW({ type: 'SKIP_WAITING' })
    }),
    next(state$, () => states.UPGRADING)
  )
  subscribe(upgrade$)

  const dismiss$ = fromEventSelector(el, 'button[data-dismiss]', 'click').pipe(
    next(state$, () => states.IDLE)
  )
  subscribe(dismiss$)

  const render$ = combineLatestObject({
    state: state$
  }).pipe(
    renderComponent(el, render)
  )
  subscribe(render$)

  return unsubscribe
})

function render (props) {
  const { state } = props
  return renderMap[state](props)
}

function renderIdle () {
  return html``
}

function renderPrompt () {
  return html`
    <div class='prompt'>
      <div class='prompt__message'>New version available</div>
      <div class='prompt__buttons'>
        <button
          class='button button--small button--primary'
          data-upgrade>
          Upgrade
        </button>
        <button
          aria-label='Dismiss'
          class='icon-button icon-button--small icon-button--light'
          data-dismiss>
          <svg class='icon-button__icon'>
            <use xlink:href='./dice.svg#close' />
          </svg>
        </button>
      </div>
    </div>
  `
}

function renderUpgrading () {
  return html`
    <div class='prompt'>
      <div class='prompt__message'>Upgrading&hellip;</div>
    </div>
  `
}
