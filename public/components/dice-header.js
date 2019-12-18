import { adoptStyles, define, html, renderComponent } from '../util/dom.js'
import { combineLatestObject, useSubscribe } from '../util/rx.js'
import styles from './dice-header.css'

adoptStyles(styles)

define('dice-header', (el) => {
  const [ subscribe, unsubscribe ] = useSubscribe()

  const render$ = combineLatestObject({
    heading: 'Dice Roller'
  }).pipe(
    renderComponent(el, render)
  )
  subscribe(render$)

  return unsubscribe
})

function render (props) {
  const { heading } = props
  return html`<h1 class='heading'>${heading}</h1>`
}
