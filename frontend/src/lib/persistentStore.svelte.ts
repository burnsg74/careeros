export const STORE_VERSION = 1

export type PersistStatus = 'idle' | 'hydrating' | 'ready' | 'error'

export type PersistentStoreOptions<T> = {
  key: string
  initial: T
  load?: () => Promise<T>
  version?: number
}

type PersistEnvelope<T> = {
  v: number
  data: T
}

export class PersistentStore<T> {
  value = $state.raw<T>(undefined as T)
  status = $state<PersistStatus>('idle')
  error = $state<string | null>(null)

  private readonly key: string
  private readonly version: number
  private readonly initial: T
  private readonly loadRemote?: () => Promise<T>
  private hydratePromise: Promise<void> | null = null
  private writeQueued = false

  constructor(options: PersistentStoreOptions<T>) {
    this.key = options.key
    this.version = options.version ?? STORE_VERSION
    this.initial = structuredClone(options.initial)
    this.loadRemote = options.load
    this.value = structuredClone(options.initial)
  }

  start(): Promise<void> {
    if (!this.hydratePromise) {
      this.status = 'hydrating'
      this.hydratePromise = Promise.resolve().then(() => this.hydrate())
    }
    return this.hydratePromise
  }

  set(next: T) {
    this.value = next
    this.queueWrite()
  }

  update(fn: (current: T) => T) {
    this.set(fn(this.value))
  }

  reset() {
    this.hydratePromise = null
    this.writeQueued = false
    this.value = structuredClone(this.initial)
    this.status = 'idle'
    this.error = null
  }

  private async hydrate() {
    this.status = 'hydrating'
    let hadCache = false

    try {
      const raw = localStorage.getItem(this.key)
      if (raw != null) {
        try {
          const parsed = JSON.parse(raw) as PersistEnvelope<T>
          if (parsed && parsed.v === this.version && parsed.data !== undefined) {
            this.value = parsed.data
            hadCache = true
            this.error = null
          } else {
            this.error = 'Could not read saved data'
          }
        } catch {
          this.error = 'Could not read saved data'
        }
      }
    } catch {
      this.error = 'Could not read saved data'
    }

    if (!this.loadRemote) {
      this.status = hadCache || !this.error ? 'ready' : 'error'
      return
    }

    try {
      const remote = await this.loadRemote()
      this.value = remote
      this.error = null
      this.status = 'ready'
      this.queueWrite()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not load data'
      this.error = message
      this.status = hadCache ? 'ready' : 'error'
    }
  }

  private queueWrite() {
    if (this.writeQueued) {
      return
    }
    this.writeQueued = true
    queueMicrotask(() => {
      this.writeQueued = false
      try {
        const envelope: PersistEnvelope<T> = { v: this.version, data: this.value }
        localStorage.setItem(this.key, JSON.stringify(envelope))
      } catch {
        // ignore quota / private-mode failures
      }
    })
  }
}

export function createPersistentStore<T>(options: PersistentStoreOptions<T>): PersistentStore<T> {
  return new PersistentStore(options)
}
