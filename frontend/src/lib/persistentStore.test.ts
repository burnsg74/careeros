import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { createPersistentStore } from './persistentStore.svelte'

const KEY = 'careeros.test-store'

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  localStorage.clear()
})

async function microtasks(count = 2) {
  for (let i = 0; i < count; i += 1) {
    await Promise.resolve()
  }
}

test('hydrates from localStorage after a tick', async () => {
  localStorage.setItem(KEY, JSON.stringify({ v: 1, data: { name: 'cached' } }))
  const store = createPersistentStore({ key: KEY, initial: { name: 'initial' } })

  expect(store.value).toEqual({ name: 'initial' })
  expect(store.status).toBe('idle')

  await store.start()

  expect(store.value).toEqual({ name: 'cached' })
  expect(store.status).toBe('ready')
})

test('keeps initial value and sets error on corrupt JSON', async () => {
  localStorage.setItem(KEY, '{not-json')
  const store = createPersistentStore({ key: KEY, initial: { name: 'initial' } })

  await store.start()

  expect(store.value).toEqual({ name: 'initial' })
  expect(store.status).toBe('error')
  expect(store.error).toBe('Could not read saved data')
})

test('set updates memory before localStorage is written', async () => {
  const store = createPersistentStore({ key: KEY, initial: { count: 0 } })
  await store.start()

  store.set({ count: 1 })

  expect(store.value).toEqual({ count: 1 })
  expect(localStorage.getItem(KEY)).toBeNull()

  await microtasks()

  expect(JSON.parse(localStorage.getItem(KEY) ?? '{}')).toEqual({ v: 1, data: { count: 1 } })
})

test('coalesces rapid writes into one localStorage snapshot', async () => {
  const store = createPersistentStore({ key: KEY, initial: { count: 0 } })
  await store.start()
  const setItem = vi.spyOn(Storage.prototype, 'setItem')

  store.set({ count: 1 })
  store.set({ count: 2 })
  store.set({ count: 3 })

  await microtasks()

  expect(store.value).toEqual({ count: 3 })
  expect(JSON.parse(localStorage.getItem(KEY) ?? '{}')).toEqual({ v: 1, data: { count: 3 } })
  expect(setItem.mock.calls.filter((call) => call[0] === KEY)).toHaveLength(1)
  setItem.mockRestore()
})

test('reset clears localStorage and ignores a late remote load', async () => {
  localStorage.setItem(KEY, JSON.stringify({ v: 1, data: { name: 'cached' } }))
  let resolveLoad: (value: { name: string }) => void = () => {}
  const load = vi.fn(
    () =>
      new Promise<{ name: string }>((resolve) => {
        resolveLoad = resolve
      }),
  )
  const store = createPersistentStore({ key: KEY, initial: { name: 'initial' }, load })
  const started = store.start()
  await microtasks(4)

  store.reset()

  expect(store.value).toEqual({ name: 'initial' })
  expect(store.status).toBe('idle')
  expect(localStorage.getItem(KEY)).toBeNull()

  resolveLoad({ name: 'stale' })
  await started

  expect(store.value).toEqual({ name: 'initial' })
  expect(store.status).toBe('idle')
  expect(localStorage.getItem(KEY)).toBeNull()
})

test('load refreshes cached data in the background', async () => {
  localStorage.setItem(KEY, JSON.stringify({ v: 1, data: { name: 'cached' } }))
  let resolveLoad: (value: { name: string }) => void = () => {}
  const load = vi.fn(
    () =>
      new Promise<{ name: string }>((resolve) => {
        resolveLoad = resolve
      }),
  )
  const store = createPersistentStore({ key: KEY, initial: { name: 'initial' }, load })

  const started = store.start()
  await microtasks(4)

  expect(store.value).toEqual({ name: 'cached' })
  expect(store.status).toBe('hydrating')
  expect(load).toHaveBeenCalledTimes(1)

  resolveLoad({ name: 'remote' })
  await started

  expect(store.value).toEqual({ name: 'remote' })
  expect(store.status).toBe('ready')
  await microtasks()
  expect(JSON.parse(localStorage.getItem(KEY) ?? '{}')).toEqual({ v: 1, data: { name: 'remote' } })
})
