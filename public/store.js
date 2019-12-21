import { createStore } from './util/store.js'

export const useStore = createStore()

export function getLocalStorageItem (key, defaultValue) {
  const item = localStorage.getItem(key)
  return (item === null && defaultValue !== undefined)
    ? defaultValue
    : JSON.parse(item)
}

export function setLocalStorageItem (key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}
