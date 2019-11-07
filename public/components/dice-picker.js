import { fromEvent } from 'rxjs'
import { distinctUntilChanged, map, scan, tap } from 'rxjs/operators'
import { decodeFormula, encodeFormula } from '../util/dice.js'
import { adoptStyles, define, html, renderComponent } from '../util/dom.js'
import { combineLatestObject, fromMethod, fromProperty, next, useSubscribe } from '../util/rx.js'
import styles from './dice-picker.css'

adoptStyles(styles)

define('dice-picker', (el) => {
  const [ subscribe, unsubscribe ] = useSubscribe()

  const formula$ = fromProperty(el, 'formula', { defaultValue: '', reflect: false, type: String })
  const picker$ = formula$.pipe(
    map(decodeFormula)
  )

  const changeValue$ = fromEvent(el, 'dice-input-changed').pipe(
    scan((all, event) => {
      const { detail } = event
      const { faces, value } = detail
      return { ...all, [faces]: value }
    }, {}),
    map((diceMap) =>
      Object.entries(diceMap)
        .map((entry) => entry.map((v) => parseInt(v)))
        .map(([ faceCount, dieCount ]) => ({ dieCount, faceCount }))
    ),
    map(encodeFormula),
    distinctUntilChanged(),
    next(formula$)
  )
  subscribe(changeValue$)

  const reset$ = fromMethod(el, 'reset').pipe(
    tap(() => {
      el.querySelectorAll('dice-input')
        .forEach((control) => control.reset())
      el.setAttribute('tabindex', -1)
      el.focus()
    })
  )
  subscribe(reset$)

  const render$ = combineLatestObject({
    picker: picker$
  }).pipe(
    renderComponent(el, render)
  )
  subscribe(render$)

  return unsubscribe
})

function render (props) {
  const { picker } = props
  return html`
    ${picker.map(renderControl)}
  `
}

function renderControl (props) {
  const { faceCount } = props
  return html`
    <dice-input faces=${faceCount} />
  `
}