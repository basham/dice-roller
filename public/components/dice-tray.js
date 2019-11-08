import { BehaviorSubject, Subject, fromEvent, merge } from 'rxjs'
import { distinctUntilChanged, filter, map, shareReplay, tap, withLatestFrom } from 'rxjs/operators'
import { range } from '../util/array.js'
import { adoptStyles, define, html, keychain, renderComponent, uuid } from '../util/dom.js'
import { animationFrame, combineLatestObject, debug, fromEventSelector, next, useSubscribe } from '../util/rx.js'
import styles from './dice-tray.css'

adoptStyles(styles)

define('dice-tray', (el) => {
  const [ subscribe, unsubscribe ] = useSubscribe()

  const getKey = keychain()

  const componentDidUpdate$ = new Subject()

  const diceSet$ = new BehaviorSubject([])
  const total$ = new BehaviorSubject(0)

  const count$ = diceSet$.pipe(
    map((diceSet) => diceSet.length),
    distinctUntilChanged(),
    shareReplay(1)
  )

  const diceChanged$ = fromEvent(document, 'dice-input-changed').pipe(
    map(({ detail }) => detail),
    shareReplay(1)
  )
  const addDice$ = diceChanged$.pipe(
    filter(({ diff }) => diff > 0),
    map(({ diff, faces }) =>
      range(diff)
        .map(() => {
          const id = uuid()
          const key = getKey(id)
          return { id, faces, key }
        })
    ),
    withLatestFrom(diceSet$),
    map(([ newDice, diceSet ]) => [ ...diceSet, ...newDice ])
  )
  const removeDice$ = diceChanged$.pipe(
    filter(({ diff }) => diff < 0),
    withLatestFrom(diceSet$),
    map(([{ diff, faces }, diceSet ]) => {
      let n = Math.abs(diff)
      return diceSet
        .reverse()
        .filter((die) => {
          if (die.faces === faces && n > 0) {
            n = n - 1
            return false
          }
          return true
        })
        .reverse()
    })
  )
  const updateDiceSet$ = merge(
    addDice$,
    removeDice$
  ).pipe(
    next(diceSet$)
  )
  subscribe(updateDiceSet$)

  const results$ = merge(
    fromEventSelector(el, 'dice-die', 'value-changed'),
    componentDidUpdate$
  ).pipe(
    map(() => {
      const dice = [ ...el.querySelectorAll('dice-die') ]
        .map(({ faces, value }) => ({ faces, value }))
        .filter(({ value }) => value)
      const count = dice.length
      const total = dice
        .reduce((sum, { value }) => (sum + value), 0)
      const results = dice
        .reduce((all, { faces, value }) => {
          const type = `d${faces}`
          return {
            ...all,
            [type]: [ ...(all[type] || []), value ].sort()
          }
        }, {})
      return { count, results, total }
    }),
    next(total$, ({ total }) => total),
    tap((value) => {
      const { count, results, total } = value
      el.count = count
      el.results = results
      el.total = total
      const event = new CustomEvent('tray-changed', {
        bubbles: true,
        detail: value
      })
      el.dispatchEvent(event)
    })
  )
  subscribe(results$)

  const roll$ = fromEventSelector(el, 'button[data-roll]', 'click').pipe(
    tap(() => {
      el.querySelectorAll('dice-die')
        .forEach((die) => die.roll())
    })
  )
  subscribe(roll$)

  const reset$ = fromEventSelector(el, 'button[data-reset]', 'click').pipe(
    tap(() => document.querySelector('dice-picker').reset())
  )
  subscribe(reset$)

  const render$ = combineLatestObject({
    count: count$,
    diceSet: diceSet$,
    total: total$
  }).pipe(
    animationFrame(),
    renderComponent(el, render),
    next(componentDidUpdate$)
  )
  subscribe(render$)

  return unsubscribe
})

function render (props) {
  const { count, diceSet } = props
  if (count < 1) {
    return html``
  }
  return html`
    <div class='section section--card'>
      <button
        class='button button--primary button--wide'
        data-roll>
        Roll
      </button>
      ${renderTotal(props)}
    </div>
    <div class='section dice-set'>
      ${diceSet.map(renderDie)}
    </div>
    ${renderLockedDice(props)}
    ${renderFooter(props)}
  `
}

function renderTotal (props) {
  const { count, total } = props
  if (count < 2) {
    return null
  }
  return html`
    <div class='total'>
      <span class='total__count'>
        ${total}
      </span>
      <span class='total__label'>
        Total
      </span>
    </div>
  `
}

function renderDie (props) {
  const { faces, key } = props
  return html.for(key)`
    <dice-die faces=${faces} />
  `
}

function renderLockedDice (props) {
  const { count } = props
  if (count < 2) {
    return null
  }
  return html`
    <div class='section section--divider locked'>
      <p>Tap dice to lock their value</p>
    </div>
  `
}

function renderFooter (props) {
  const { count } = props
  if (count < 2) {
    return null
  }
  return html`
    <div class='section section--divider'>
      <button
        class='button'
        data-reset>
        Reset
      </button>
    </div>
  `
}
