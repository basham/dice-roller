import { merge } from 'rxjs'
import { map } from 'rxjs/operators'
import { adoptStyles, define, html, renderComponent } from '../util/dom.js'
import { combineLatestObject, fromProperty, useSubscribe } from '../util/rx.js'
import styles from './dice-input.css'

adoptStyles(styles)

define('dice-input', (el) => {
  const [ subscribe, unsubscribe ] = useSubscribe()

  const faces$ = fromProperty(el, 'faces', { defaultValue: 6, type: Number })
  const value$ = fromProperty(el, 'value', { defaultValue: 0, type: Number })

  const type$ = faces$.pipe(
    map((faces) => `d${faces}`)
  )

  const render$ = combineLatestObject({
    faces: faces$,
    type: type$,
    value: value$
  }).pipe(
    renderComponent(el, render)
  )
  subscribe(render$)

  return unsubscribe
})

function render (props) {
  const { faces, type, value } = props
  return html`
    <div class='label'>
      ${type}
    </div>
    <button
      aria-label=${`Add ${type}`}
      class='increment-button'
      data-increment=${type}
      faces=${faces}
      is='dice-button'
      size='small'
      theme=${value ? 'solid' : 'ghost'} />
    <button
      aria-label=${`Remove ${type}, ${value} total`}
      class='decrement-button'
      data-decrement=${type}
      disabled=${!value}>
      &times; ${value}
    </button>
  `
}
