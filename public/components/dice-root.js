import { BehaviorSubject } from 'rxjs'
import { tap } from 'rxjs/operators'
import { adoptStyles, define, html, renderComponent } from '../util/dom.js'
import { combineLatestObject, useSubscribe } from '../util/rx.js'
import { FAVORITES } from '../constants.js'
import { useStore, getLocalStorageItem, setLocalStorageItem } from '../store.js'
import styles from './dice-root.css'

adoptStyles(styles)

// Enable :active styles in iOS Safari.
// https://css-tricks.com/snippets/css/remove-gray-highlight-when-tapping-links-in-mobile-safari/
document.addEventListener('touchstart', () => {}, true)

define('dice-root', (el) => {
  const [ subscribe, unsubscribe ] = useSubscribe()
  const store = useStore(el)

  const formula$ = new BehaviorSubject('')
  const setFormula = (value) => formula$.next(value)
  store.set('formula$', formula$)
  store.set('setFormula', setFormula)

  const favorites = getLocalStorageItem('favorites', FAVORITES)
  const favorites$ = new BehaviorSubject(favorites)
  const setFavorites = (value) => favorites$.next(value)
  store.set('favorites$', favorites$)
  store.set('setFavorites', setFavorites)

  const updateFavorites$ = favorites$.pipe(
    tap((value) => setLocalStorageItem('favorites', value))
  )
  subscribe(updateFavorites$)

  const render$ = combineLatestObject({
  }).pipe(
    renderComponent(el, render)
  )
  subscribe(render$)

  return unsubscribe
})

function render () {
  return html`
    <dice-header />
    <dice-upgrader />
    <dice-picker />
    <dice-tray />
  `
}
