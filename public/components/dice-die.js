import { BehaviorSubject, range, timer } from 'rxjs'
import { concatMap, filter, map, scan, startWith, switchMap, tap, withLatestFrom } from 'rxjs/operators'
import { randomItem, range as numRange } from '../util/array.js'
import { adoptStyles, define, html, renderComponent } from '../util/dom.js'
import { random } from '../util/math.js'
import { combineLatestObject, debug, fromEventSelector, fromMethod, fromProperty, next, useSubscribe } from '../util/rx.js'
import styles from './dice-die.css'

adoptStyles(styles)

define('dice-die', (el) => {
  const [ subscribe, unsubscribe ] = useSubscribe()

  const faces$ = fromProperty(el, 'faces', { defaultValue: 6, type: Number })
  const locked$ = new BehaviorSubject(false)
  const value$ = fromProperty(el, 'value', { defaultValue: 1, type: Number })

  const updateLocked$ = fromEventSelector(el, 'button', 'click').pipe(
    withLatestFrom(locked$),
    map(([ , locked ]) => !locked),
    debug('Locked'),
    next(locked$)
  )
  subscribe(updateLocked$)

  const roll$ = fromMethod(el, 'roll').pipe(
    withLatestFrom(locked$),
    filter(([ , locked ]) => !locked),
    // Immediately roll.
    startWith(null),
    // Trigger a roll.
    switchMap(() =>
      // Roll to a new side, a random number of times.
      range(0, random(8, 12)).pipe(
        // Wait until one timer completes before starting the next timer.
        concatMap((v, i) =>
          // Each timer should last at least one frame (16ms).
          // Slow down over time, with some variation.
          timer(i * 16 * random(50, 150) / 100)
        )
      )
    ),
    withLatestFrom(faces$),
    map(([ , faces ]) => faces),
    // Randomly choose a side, while preventing repeats.
    scan((lastRoll, faces) => {
      const options = numRange(faces, 1)
        .filter((v) => v !== lastRoll)
      return randomItem(options)
    }, -1),
    next(value$)
  )
  subscribe(roll$)

  const render$ = combineLatestObject({
    faces: faces$,
    locked: locked$,
    value: value$
  }).pipe(
    renderComponent(el, render)
  )
  subscribe(render$)

  return unsubscribe
})

function render (props) {
  const { faces, locked, value } = props
  const type = `d${faces}`
  return html`
    <button
      aria-label=${`${value}, ${type}`}
      aria-pressed=${locked}
      faces=${faces}
      is='dice-button'
      label=${value}
      size='medium'
      theme='solid' />
  `
}
