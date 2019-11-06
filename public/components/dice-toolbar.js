import { adoptStyles, define, html, renderComponent } from '../util/dom.js'
import { combineLatestObject, fromProperty, useSubscribe } from '../util/rx.js'
import styles from './dice-toolbar.css'

adoptStyles(styles)

define('dice-toolbar', (el) => {
  const [ subscribe, unsubscribe ] = useSubscribe()

  const count$ = fromProperty(el, 'count', { defaultValue: 0, type: Number })
  const total$ = fromProperty(el, 'total', { defaultValue: 0, type: Number })

  const render$ = combineLatestObject({
    count: count$,
    total: total$
  }).pipe(
    renderComponent(el, render)
  )
  subscribe(render$)

  return unsubscribe
})

function render (props) {
  const { count, total } = props
  return html`
    <div class=${count ? 'container' : 'container container--hidden'}>
      <div class='total'>
        <span class='total__count'>
          ${total}
        </span>
        <span class='total__label'>
          Total
        </span>
      </div>
      <div class='buttons'>
        <button
          class='button'
          data-roll>
          Roll
        </button>
        <button
          class='button'
          data-reset>
          Remove all
        </button>
      </div>
    </div>
  `
}
