import { BehaviorSubject, Subject, from, fromEvent, merge } from 'rxjs'
import { distinctUntilChanged, filter, map, mergeMap, shareReplay, startWith, tap, withLatestFrom } from 'rxjs/operators'
import { range } from '../util/array.js'
import { adoptStyles, define, html, keychain, renderComponent, uuid } from '../util/dom.js'
import { animationFrame, combineLatestObject, debug, fromEventSelector, next, useSubscribe } from '../util/rx.js'
import { useStore } from '../store.js'
import styles from './dice-tray.css'

adoptStyles(styles)

define('dice-tray', (el) => {
  const [ subscribe, unsubscribe ] = useSubscribe()

  const store = useStore(el)
  const getKey = keychain()

  const componentDidUpdate$ = new Subject()

  const diceSet$ = new BehaviorSubject([])
  const total$ = new BehaviorSubject(0)

  const favorites$ = store.get('favorites$')
  const setFormula$ = store.get('setFormula')

  const dicePickerChanged$ = fromEvent(document, 'dice-picker-changed')

  const count$ = diceSet$.pipe(
    map((diceSet) => diceSet.length),
    distinctUntilChanged(),
    shareReplay(1)
  )

  const diceChanged$ = dicePickerChanged$.pipe(
    mergeMap(({ detail }) => from(detail)),
    shareReplay(1)
  )
  const addDice$ = diceChanged$.pipe(
    filter(({ diff }) => diff > 0),
    map(({ diff, faceCount }) =>
      range(diff)
        .map(() => {
          const id = uuid()
          const key = getKey(id)
          return { id, faceCount, key }
        })
    ),
    withLatestFrom(diceSet$),
    map(([ newDice, diceSet ]) => [ ...diceSet, ...newDice ])
  )
  const removeDice$ = diceChanged$.pipe(
    filter(({ diff }) => diff < 0),
    withLatestFrom(diceSet$),
    map(([{ diff, faceCount }, diceSet ]) => {
      let n = Math.abs(diff)
      return diceSet
        .reverse()
        .filter((die) => {
          if (die.faceCount === faceCount && n > 0) {
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

  const preset$ = fromEventSelector(el, 'button[data-formula]', 'click').pipe(
    map(({ target }) => target.dataset.formula),
    withLatestFrom(setFormula$),
    tap(([ value, set ]) => set(value))
  )
  subscribe(preset$)

  const roll$ = fromEventSelector(el, 'button[data-roll]', 'click').pipe(
    tap(() => {
      el.querySelectorAll('dice-die')
        .forEach((die) => die.roll())
    })
  )
  subscribe(roll$)

  const render$ = combineLatestObject({
    count: count$,
    diceSet: diceSet$,
    total: total$,
    favorites: favorites$
  }).pipe(
    animationFrame(),
    renderComponent(el, render),
    next(componentDidUpdate$)
  )
  subscribe(render$)

  return unsubscribe
})

function render (props) {
  const { count } = props
  return count < 1
    ? renderFavorites(props)
    : renderTray(props)
}

function renderFavorites (props) {
  const { favorites } = props
  return html`
    <div class='section section--divider'>
      <h2 class='section__heading'>Favorites</h2>
      <ul class='favorite__list'>
       ${favorites.map(renderFavorite)}
      </ul>
    </div>
  `
}

function renderFavorite (props) {
  const { label, formula } = props
  return html`
    <li class='favorite__item'>
      <button
        class='button button--primary button--wide favorite__button'
        data-formula=${formula}>
        ${label}
        <dice-formula formula=${formula} />
      </button>
    </li>
`
}

function renderTray (props) {
  const { diceSet } = props
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
  const { faceCount, key } = props
  return html.for(key)`
    <dice-die faces=${faceCount} />
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
