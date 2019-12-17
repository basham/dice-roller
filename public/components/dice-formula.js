import { map } from 'rxjs/operators'
import { decodeFormula } from '../util/dice.js'
import { adoptStyles, define, html, renderComponent } from '../util/dom.js'
import { combineLatestObject, fromProperty, useSubscribe } from '../util/rx.js'
import styles from './dice-formula.css'

adoptStyles(styles)

define('dice-formula', (el) => {
  const [ subscribe, unsubscribe ] = useSubscribe()

  const formula$ = fromProperty(el, 'formula', { defaultValue: '', type: String })
  const decodedFormula$ = formula$.pipe(
    map(decodeFormula),
    map((formula) =>
      formula
        .filter(({ dieCount }) => dieCount > 0)
    )
  )

  const render$ = combineLatestObject({
    formula: decodedFormula$
  }).pipe(
    renderComponent(el, render)
  )
  subscribe(render$)

  return unsubscribe
})

function render (props) {
  const { formula } = props
  return html`
    ${formula.map(renderDiceExpression)}
  `
}

function renderDiceExpression (props) {
  const { dieCount, faceCount, type } = props
  const path = `./dice.svg#${type}`
  return html`
    <div class='expression'>
      <div class='dice' size='small' theme='solid' faces=${faceCount}>
        <svg class='icon'>
          <use xlink:href=${path} />
        </svg>
      </div>
      <div class='count'>
        &times; ${dieCount}
      </div>
    </div>
  `
}
