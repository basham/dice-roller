import { merge } from 'rxjs'
import { map, mapTo, pairwise, tap, withLatestFrom } from 'rxjs/operators'
import { decodeFormula, encodeFormula } from '../util/dice.js'
import { adoptStyles, define, html, renderComponent } from '../util/dom.js'
import { combineLatestObject, fromEventSelector, fromMethod, fromProperty, next, useSubscribe } from '../util/rx.js'
import styles from './dice-picker.css'

adoptStyles(styles)

define('dice-picker', (el) => {
  const [ subscribe, unsubscribe ] = useSubscribe()

  const formula$ = fromProperty(el, 'formula', { defaultValue: '', reflect: false, type: String })
  const picker$ = formula$.pipe(
    map(decodeFormula)
  )

  const pickerChanged$ = picker$.pipe(
    pairwise(),
    map(([ oldPicker, newPicker ]) =>
      newPicker.map((newValue, index) => {
        const oldValue = oldPicker[index]
        const diff = newValue.dieCount - oldValue.dieCount
        return { ...newValue, diff }
      })
    ),
    tap((detail) => {
      const event = new CustomEvent('dice-picker-changed', {
        bubbles: true,
        detail
      })
      el.dispatchEvent(event)
    })
  )
  subscribe(pickerChanged$)

  const increment$ = fromEventSelector(el, 'button[data-increment]', 'click').pipe(
    map(({ target }) => target.dataset.increment),
    map((type) => [ type, (count) => (count + 1) ])
  )
  const decrement$ = fromEventSelector(el, 'button[data-decrement]', 'click').pipe(
    map(({ target }) => target.dataset.decrement),
    map((type) => [ type, (count) => (count <= 0 ? 0 : count - 1) ])
  )
  const changeDieCount$ = merge(
    increment$,
    decrement$
  ).pipe(
    withLatestFrom(picker$),
    map(([ [ type, updateDieCount ], picker ]) =>
      picker
        .map((item) => {
          if (item.type === type) {
            const dieCount = updateDieCount(item.dieCount)
            return { ...item, dieCount }
          }
          return item
        })
    ),
    map(encodeFormula),
    next(formula$)
  )
  subscribe(changeDieCount$)

  const reset$ = fromMethod(el, 'reset').pipe(
    mapTo(''),
    next(formula$),
    tap(() => {
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
  const { dieCount, faceCount } = props
  return html`
    <dice-input
      faces=${faceCount}
      value=${dieCount} />
  `
}
