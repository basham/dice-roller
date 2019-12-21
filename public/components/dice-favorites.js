import { map, tap, withLatestFrom } from 'rxjs/operators'
import { adoptStyles, define, html, renderComponent } from '../util/dom.js'
import { combineLatestObject, fromEventSelector, useSubscribe } from '../util/rx.js'
import { useStore } from '../store.js'
import styles from './dice-favorites.css'

adoptStyles(styles)

define('dice-favorites', (el) => {
  const [ subscribe, unsubscribe ] = useSubscribe()

  const store = useStore(el)

  const favorites$ = store.get('favorites$')
  const setFormula$ = store.get('setFormula')

  const loadFavorite$ = fromEventSelector(el, 'button[data-formula]', 'click').pipe(
    map(({ target }) => target.dataset.formula),
    withLatestFrom(setFormula$),
    tap(([ value, set ]) => set(value))
  )
  subscribe(loadFavorite$)

  const render$ = combineLatestObject({
    favorites: favorites$
  }).pipe(
    renderComponent(el, render)
  )
  subscribe(render$)

  return unsubscribe
})

function render (props) {
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
