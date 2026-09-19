import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { refreshStores, resetStores } from './bootStores'
import { jobsStore } from './jobsStore.svelte'
import type { JobSummary } from './jobs'

const jobs: JobSummary[] = [
  {
    id: '1001',
    name: 'Senior Engineer',
    company: 'Acme',
    compensation: '$150k',
    locations: 'Remote',
    fit_overall_match: '',
    captured_at: '2026-09-12T12:00:00.000Z',
    status: 'new',
    url: 'https://example.com/job',
    applied_at: '',
    deleted_reason: '',
    skills: 'TypeScript',
  },
]

beforeEach(() => {
  resetStores()
  localStorage.clear()
})

afterEach(() => {
  resetStores()
  localStorage.clear()
  vi.unstubAllGlobals()
})

test('patchStatus updates the store before the API resolves', async () => {
  let resolvePatch: (value: {
    ok: boolean
    status: number
    json: () => Promise<unknown>
  }) => void = () => {}
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      const method = (init?.method ?? 'GET').toUpperCase()
      if (url === '/api/jobs' && method === 'GET') {
        return { ok: true, status: 200, json: async () => jobs }
      }
      if (url === '/api/jobs/1001/status' && method === 'PATCH') {
        return await new Promise((resolve) => {
          resolvePatch = resolve
        })
      }
      return { ok: false, status: 404, json: async () => ({}) }
    }),
  )

  await jobsStore.start()
  expect(jobsStore.list[0]?.status).toBe('new')

  const pending = jobsStore.patchStatus('1001', { status: 'applied' })
  expect(jobsStore.list[0]?.status).toBe('applied')

  resolvePatch({
    ok: true,
    status: 200,
    json: async () => ({
      ...jobs[0],
      status: 'applied',
      applied_at: '2026-09-12T13:00:00.000Z',
      properties: { status: 'applied' },
      body: 'Body',
      obsidianUrl: 'obsidian://open',
    }),
  })
  await pending

  expect(jobsStore.list[0]?.status).toBe('applied')
  expect(jobsStore.list[0]?.applied_at).toBe('2026-09-12T13:00:00.000Z')
})

test('refreshStores clears cached details then reloads lists', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url === '/api/jobs') {
        return { ok: true, status: 200, json: async () => jobs }
      }
      if (url === '/api/jobs/1001') {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            ...jobs[0],
            body: 'Cached body',
            properties: {},
            obsidianUrl: 'obsidian://open',
          }),
        }
      }
      if (url === '/api/contacts' || url === '/api/job-boards') {
        return { ok: true, status: 200, json: async () => [] }
      }
      return { ok: false, status: 404, json: async () => ({}) }
    }),
  )

  await jobsStore.start()
  await jobsStore.ensureDetail('1001')
  expect(jobsStore.getDetail('1001')?.body).toBe('Cached body')

  vi.mocked(fetch).mockImplementation(async (input: RequestInfo | URL) => {
    const url = String(input)
    if (url === '/api/jobs') {
      return { ok: true, status: 200, json: async () => [{ ...jobs[0], name: 'Updated Engineer' }] }
    }
    if (url === '/api/contacts' || url === '/api/job-boards') {
      return { ok: true, status: 200, json: async () => [] }
    }
    return { ok: false, status: 404, json: async () => ({}) }
  })

  await refreshStores()

  expect(jobsStore.getDetail('1001')).toBeUndefined()
  expect(jobsStore.list[0]?.name).toBe('Updated Engineer')
})
