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
  return html`
    <button class='icon-button'>
      <svg class='icon-button__icon'>
        <use xlink:href='./dice.svg#home' />
      </svg>
    </button>
    <h1 class='heading'>${heading}</h1>
    <button
      aria-pressed='false'
      class='icon-button'>
      <svg class='icon-button__icon'>
        <use xlink:href='./dice.svg#star' />
      </svg>
    </button>
  `
}
