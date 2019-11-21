import { BehaviorSubject, isObservable, of } from 'rxjs'
import { distinctUntilChanged, filter, map, shareReplay, switchMap } from 'rxjs/operators'

//
// Create a store.
// Then use it to share data with descendant elements.
// If there are multiple matches for any given key,
// the match occuring from the closest ancestor is returned.
//
// Optionally, should `get()` retrieve descendant values?
//
// Inspired by React Context.
// https://reactjs.org/docs/context.html
//
export function createStore () {
  const store = new WeakMap()
  const store$ = new BehaviorSubject(store)
  const DEFAULT_TARGET = {}

  return function useStore (target = DEFAULT_TARGET) {

    function clear () {
      if (store.has(target)) {
        store.get(target).clear()
      }
      store.delete(target)
      store$.next(store)
    }

    function _delete (key) {
      if (store.has(target) && store.get(target).has(key)) {
        store.get(target).delete(key)
        store$.next(store)
      }
    }

    function get (key) {
      return store$.pipe(
        map((store) => getClosestStoreValue({ store, target, key, defaultTarget: DEFAULT_TARGET })),
        distinctUntilChanged(),
        filter((value) => value !== undefined),
        switchMap((value) => isObservable(value) ? value : of(value)),
        shareReplay(1)
      )
    }

    function set (key, value) {
      if (!store.has(target)) {
        store.set(target, new Map())
      }
      store.get(target).set(key, value)
      store$.next(store)
    }

    return { clear, delete: _delete, get, set }
  }
}

// Based on Element.closest()
// https://developer.mozilla.org/en-US/docs/Web/API/Element/closest
function getClosestStoreValue ({ store, target, key, defaultTarget }) {
  let el = target
  do {
    if (el !== target && store.has(el) && store.get(el).has(key)) {
      return store.get(el).get(key)
    }
    el = el.parentElement || el.parentNode
  } while (el !== null && el.nodeType === 1)
  if (store.has(defaultTarget) && store.get(defaultTarget).has(key)) {
    return store.get(defaultTarget).get(key)
  }
  return undefined
}
