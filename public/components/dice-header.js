import { BehaviorSubject, combineLatest, merge } from 'rxjs'
import { distinctUntilChanged, filter, map, mapTo, shareReplay, tap, withLatestFrom, startWith } from 'rxjs/operators'
import { adoptStyles, define, html, renderComponent } from '../util/dom.js'
import { combineLatestObject, debug, fromEventSelector, next, useSubscribe } from '../util/rx.js'
import { APP_NAME } from '../constants.js'
import { useStore } from '../store.js'
import styles from './dice-header.css'

adoptStyles(styles)

const states = {
  IDLE: 'idle',
  NOT_FAVORITE: 'not-favorite',
  FAVORITE: 'favorite',
  RENAME: 'rename'
}

const renderMap = {
  [states.IDLE]: renderIdleState,
  [states.NOT_FAVORITE]: renderNotFavoriteState,
  [states.FAVORITE]: renderFavoriteState,
  [states.RENAME]: renderRenameState
}

define('dice-header', (el) => {
  const [ subscribe, unsubscribe ] = useSubscribe()
  const store = useStore(el)

  const state$ = new BehaviorSubject(states.IDLE)

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

  const idle$ = formula$.pipe(
    filter((formula) => !formula),
    next(state$, () => states.IDLE)
  )
  subscribe(idle$)

  const withFormula$ = formula$.pipe(
    filter((formula) => formula)
  )
  const favoriteLabel$ = combineLatest(
    favorites$,
    withFormula$
  ).pipe(
    map(([ favorites, formula ]) =>
      favorites
        .find((favorite) => favorite.formula === formula)
    ),
    next(state$, (favorite) => favorite ? states.FAVORITE : states.NOT_FAVORITE),
    map((favorite) => favorite ? favorite.label : ''),
    startWith('')
  )
  subscribe(favoriteLabel$)

  const renameClick$ = fromEventSelector(el, 'button[data-rename]', 'click')
  const renameTouch$ = fromEventSelector(el, 'button[data-rename]', 'touchend')
  const initRename$ = merge(
    renameClick$,
    //renameTouch$
  ).pipe(
    next(state$, () => states.RENAME),
    tap(() => window.requestAnimationFrame(() => {
      el.querySelector('input[data-rename]').focus()
    }))
  )
  subscribe(initRename$)

  const renameInputKeydown$ = fromEventSelector(el, 'input[data-rename]', 'keydown').pipe(
    map(({ key }) => key),
    shareReplay(1)
  )
  const renameInputEscape$ = renameInputKeydown$.pipe(
    filter((key) => key === 'Escape')
  )
  const renameInputEnter$ = renameInputKeydown$.pipe(
    filter((key) => key === 'Enter')
  )
  const renameInputBlur$ = fromEventSelector(el, 'input[data-rename]', 'blur')
  const submitRename$ = merge(
    renameInputEnter$,
    renameInputBlur$
  ).pipe(
    withLatestFrom(state$),
    filter(([ , state ]) => state === states.RENAME),
    map(() => el.querySelector('input[data-rename]').value.trim()),
    withLatestFrom(favorites$, formula$),
    map(([ label, favorites, formula ]) =>
      favorites
        .map((favorite) =>
          favorite.formula === formula
            ? { label: label ? label : formula, formula }
            : favorite
        )
    ),
    withLatestFrom(setFavorites$),
    tap(([ value, set ]) => set(value))
  )
  const finishRename$ = merge(
    renameInputEscape$,
    submitRename$
  ).pipe(
    next(state$, () => states.FAVORITE),
    tap(() => window.requestAnimationFrame(() => el.querySelector('button[data-rename]').focus()))
  )
  subscribe(finishRename$)

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
    formula: formula$,
    label: favoriteLabel$,
    state: state$
  }).pipe(
    renderComponent(el, render)
  )
  subscribe(render$)

  return unsubscribe
})

function render (props) {
  const { state } = props
  return renderMap[state](props)
}

function renderIdleState () {
  return html`
    ${renderHomeButton({ hidden: true })}
    ${renderHeading({ label: APP_NAME })}
    ${renderFavoriteButton({ hidden: true })}
  `
}

function renderNotFavoriteState (props) {
  const { formula } = props
  return html`
    ${renderHomeButton()}
    ${renderHeading({ label: formula })}
    ${renderFavoriteButton()}
  `
}

function renderFavoriteState (props) {
  const { label } = props
  return html`
    ${renderHomeButton()}
    <h1 class='heading'>
      <button
        class='rename-button'
        data-rename>
        ${label}
      </button>
    </h1>
    ${renderFavoriteButton({ pressed: true })}
  `
}

function renderRenameState (props) {
  const { label } = props
  return html`
    <form
      action='#'
      class='rename-form'>
      <input
        aria-label='Name'
        autofocus
        class='rename-input'
        data-rename
        type='text'
        value=${label} />
    </form>
  `
}

function renderHomeButton (props = {}) {
  const { hidden = false } = props
  return html`
    <button
      aria-label='Home'
      class='icon-button'
      data-home
      hidden=${hidden}>
      <svg class='icon-button__icon'>
        <use xlink:href='./dice.svg#home' />
      </svg>
    </button>
  `
}

function renderHeading (props) {
  const { label } = props
  return html`
    <h1 class='heading'>${label}</h1>
  `
}

function renderFavoriteButton (props = {}) {
  const { hidden = false, pressed = false } = props
  return html`
    <button
      aria-label='Favorite'
      aria-pressed=${pressed}
      class='icon-button'
      data-favorite
      hidden=${hidden}>
      <svg class='icon-button__icon'>
        <use xlink:href='./dice.svg#star' />
      </svg>
    </button>
  `
}
