import { adoptStyles, define, html, renderComponent } from '../util/dom.js'
import { combineLatestObject, fromProperty, useSubscribe } from '../util/rx.js'
import styles from './dice-button.css'

adoptStyles(styles)

define('dice-button', 'button', (el) => {
  const [ subscribe, unsubscribe ] = useSubscribe()

  const faces$ = fromProperty(el, 'faces', { defaultValue: 6, type: Number })
  const label$ = fromProperty(el, 'label', { defaultValue: '', type: String })

  const render$ = combineLatestObject({
    faces: faces$,
    label: label$
  }).pipe(
    renderComponent(el, render)
  )
  subscribe(render$)

  return unsubscribe
})

function render (props) {
  const { faces, label } = props
  const type = `d${faces}`
  const path = './dice.svg#'
  const icon = `${path}${type}`
  const lock = `${path}lock`
  return html`
    <svg class='icon'>
      <use xlink:href=${icon} />
    </svg>
    <svg class='lock lock--shadow'>
      <use xlink:href=${lock} />
    </svg>
    <svg class='lock'>
      <use xlink:href=${lock} />
    </svg>
    <div class='label'>
      ${label}
    </div>
  `
}
