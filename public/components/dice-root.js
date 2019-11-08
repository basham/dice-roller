import { adoptStyles, define, html, render } from '../util/dom.js'
import styles from './dice-root.css'

adoptStyles(styles)

define('dice-root', (el) => {
  render(el, renderRoot)
})

function renderRoot () {
  return html`
    <dice-picker />
    <dice-tray/>
  `
}
