import { adoptStyles, define, html, render } from '../util/dom.js'
import styles from './dice-root.css'

adoptStyles(styles)

// Enable :active styles in iOS Safari.
// https://css-tricks.com/snippets/css/remove-gray-highlight-when-tapping-links-in-mobile-safari/
document.addEventListener('touchstart', () => {}, true)

define('dice-root', (el) => {
  render(el, renderRoot)
})

function renderRoot () {
  return html`
    <dice-upgrader />
    <dice-picker />
    <dice-tray />
  `
}
