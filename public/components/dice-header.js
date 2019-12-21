import { combineLatest } from 'rxjs'
import { distinctUntilChanged, map, mapTo, shareReplay, tap, withLatestFrom } from 'rxjs/operators'
import { adoptStyles, define, html, renderComponent } from '../util/dom.js'
import { combineLatestObject, debug, fromEventSelector, useSubscribe } from '../util/rx.js'
import { APP_NAME } from '../constants.js'
import { useStore } from '../store.js'
import styles from './dice-header.css'

adoptStyles(styles)

define('dice-header', (el) => {
  const [ subscribe, unsubscribe ] = useSubscribe()
  const store = useStore(el)

  const favorites$ = store.get('favorites$')
  const setFavorites$ = store.get('setFavorites')

  const formula$ = store.get('formula$')
  const setFormula$ = store.get('setFormula')
  const hasFormula$ = formula$.pipe(
    map((formula) => formula !== ''),
    distinctUntilChanged()
  )

  const favorite$ = combineLatest(
    favorites$,
    formula$
  ).pipe(
    map(([ favorites, formula ]) =>
      favorites
        .find((favorite) => favorite.formula === formula)
    ),
    shareReplay(1)
  )

  const isFavorite$ = favorite$.pipe(
    map((favorite) => !!favorite)
  )

  const heading$ = combineLatest(
    formula$,
    favorite$
  ).pipe(
    map(([ formula, favorite ]) => {
      if (!formula) {
        return APP_NAME
      }
      if (favorite) {
        return favorite.label
      }
      return formula
    })
  )

  const home$ = fromEventSelector(el, 'button[data-home]', 'click').pipe(
    mapTo(''),
    withLatestFrom(setFormula$),
    tap(([ value, set ]) => set(value))
  )
  subscribe(home$)

  const toggleFavorite$ = fromEventSelector(el, 'button[data-favorite]', 'click').pipe(
    withLatestFrom(isFavorite$, favorites$, formula$),
    map(([ , isFavorite, favorites, formula ]) => {
      if (isFavorite) {
        return favorites
          .filter((item) => item.formula !== formula)
      }
      const newFavorite = { label: formula, formula }
      return [ ...favorites, newFavorite ]
    }),
    withLatestFrom(setFavorites$),
    tap(([ value, set ]) => set(value))
  )
  subscribe(toggleFavorite$)

  const render$ = combineLatestObject({
    hasFormula: hasFormula$,
    heading: heading$,
    isFavorite: isFavorite$,
  }).pipe(
    renderComponent(el, render)
  )
  subscribe(render$)

  return unsubscribe
})

function render (props) {
  const { hasFormula, heading, isFavorite } = props
  return html`
    <button
      aria-label='Home'
      class='icon-button'
      data-home
      hidden=${!hasFormula}>
      <svg class='icon-button__icon'>
        <use xlink:href='./dice.svg#home' />
      </svg>
    </button>
    <h1 class='heading'>${heading}</h1>
    <button
      aria-label='Favorite'
      aria-pressed=${isFavorite}
      class='icon-button'
      data-favorite
      hidden=${!hasFormula}>
      <svg class='icon-button__icon'>
        <use xlink:href='./dice.svg#star' />
      </svg>
    </button>
  `
}
