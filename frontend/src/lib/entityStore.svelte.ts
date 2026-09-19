import { HttpError } from './http'
import { createPersistentStore, type PersistStatus, type PersistentStore } from './persistentStore.svelte'

export type EntityCache<S extends { id: string }, D extends S> = {
  list: S[]
  details: Record<string, D>
}

export type EntityStoreOptions<S extends { id: string }, D extends S> = {
  key: string
  fetchList: () => Promise<(S | D)[]>
  fetchDetail: (id: string) => Promise<D>
  save: (id: string, body: string) => Promise<D>
  toSummary: (detail: D) => S
  isDetail?: (item: S | D) => item is D
  loadError: string
  notFoundError: string
  detailError: string
}

export class EntityStore<S extends { id: string }, D extends S> {
  persist: PersistentStore<EntityCache<S, D>>
  detailLoading = $state<Record<string, boolean>>({})
  detailErrors = $state<Record<string, string | null>>({})

  private readonly opts: EntityStoreOptions<S, D>

  constructor(opts: EntityStoreOptions<S, D>) {
    this.opts = opts
    this.persist = createPersistentStore<EntityCache<S, D>>({
      key: opts.key,
      initial: { list: [], details: {} },
      load: async () => {
        try {
          const items = await opts.fetchList()
          const details: Record<string, D> = {}
          const list: S[] = []
          for (const item of items) {
            if (opts.isDetail?.(item)) {
              details[item.id] = item
              list.push(opts.toSummary(item))
            } else {
              list.push(item)
            }
          }
          return {
            list,
            details: Object.keys(details).length > 0 ? details : this.persist.value.details,
          }
        } catch {
          throw new Error(opts.loadError)
        }
      },
    })
  }

  start(): Promise<void> {
    return this.persist.start()
  }

  reset() {
    this.persist.reset()
    this.detailLoading = {}
    this.detailErrors = {}
  }

  get list(): S[] {
    return this.persist.value.list
  }

  get details(): Record<string, D> {
    return this.persist.value.details
  }

  get status(): PersistStatus {
    return this.persist.status
  }

  get epoch(): number {
    return this.persist.epoch
  }

  get error(): string | null {
    if (this.list.length > 0) {
      return null
    }
    return this.persist.error
  }

  get listLoading(): boolean {
    return this.list.length === 0 && (this.persist.status === 'idle' || this.persist.status === 'hydrating')
  }

  getDetail(id: string): D | undefined {
    return this.persist.value.details[id]
  }

  isDetailLoading(id: string): boolean {
    return Boolean(this.detailLoading[id]) && !this.getDetail(id)
  }

  detailError(id: string): string | null {
    if (this.getDetail(id)) {
      return null
    }
    return this.detailErrors[id] ?? null
  }

  snapshot(): EntityCache<S, D> {
    return structuredClone(this.persist.value)
  }

  restore(cache: EntityCache<S, D>) {
    this.persist.set(cache)
  }

  upsertDetail(detail: D) {
    const summary = this.opts.toSummary(detail)
    const { list, details } = this.persist.value
    this.persist.set({
      list: list.some((item) => item.id === detail.id)
        ? list.map((item) => (item.id === detail.id ? summary : item))
        : [...list, summary],
      details: { ...details, [detail.id]: detail },
    })
  }

  async ensureDetail(id: string) {
    if (this.getDetail(id)) {
      return
    }
    this.detailLoading[id] = true
    try {
      const detail = await this.opts.fetchDetail(id)
      this.upsertDetail(detail)
      this.detailErrors[id] = null
    } catch (err) {
      if (!this.getDetail(id)) {
        const status = err instanceof HttpError ? err.status : 0
        this.detailErrors[id] = status === 404 ? this.opts.notFoundError : this.opts.detailError
      }
    } finally {
      this.detailLoading[id] = false
    }
  }

  async saveBody(id: string, body: string): Promise<D> {
    const prev = this.snapshot()
    const current = this.getDetail(id)
    if (current) {
      this.upsertDetail({ ...current, body })
    }
    try {
      const saved = await this.opts.save(id, body)
      this.upsertDetail(saved)
      return saved
    } catch (err) {
      this.restore(prev)
      throw err
    }
  }
}
