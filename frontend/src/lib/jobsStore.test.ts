import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { refreshStores, resetStores } from './bootStores'
import { jobsStore } from './jobsStore.svelte'
import type { JobDetail, JobSummary } from './jobs'

const jobs: JobSummary[] = [
  {
    id: '1001',
    name: 'Senior Engineer',
    company: 'Acme',
    compensation: '$150k',
    locations: 'Remote',
    remote: '',
    posted_at: '',
    company_url: '',
    fit_overall_match: '',
    fit_recommendation: '',
    fit_score: '',
    fit_summary: '',
    fit_have_skills: '',
    fit_familiar_skills: '',
    fit_dont_have_skills: '',
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

test('patchStatus keeps the latest optimistic status if an earlier request fails', async () => {
  const patches: Array<{
    resolve: (value: { ok: boolean; status: number; json: () => Promise<unknown> }) => void
    reject: (reason?: unknown) => void
  }> = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      const method = (init?.method ?? 'GET').toUpperCase()
      if (url === '/api/jobs' && method === 'GET') {
        return { ok: true, status: 200, json: async () => jobs }
      }
      if (url === '/api/jobs/1001/status' && method === 'PATCH') {
        return await new Promise((resolve, reject) => {
          patches.push({ resolve, reject })
        })
      }
      return { ok: false, status: 404, json: async () => ({}) }
    }),
  )

  await jobsStore.start()
  const first = jobsStore.patchStatus('1001', { status: 'saved' })
  const second = jobsStore.patchStatus('1001', { status: 'applied' })
  expect(jobsStore.list[0]?.status).toBe('applied')

  patches[0]?.reject(new Error('Could not update status'))
  await expect(first).rejects.toThrow('Could not update status')
  expect(jobsStore.list[0]?.status).toBe('applied')

  patches[1]?.resolve({
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
  await second
  expect(jobsStore.list[0]?.status).toBe('applied')
})

test('start caches job details from the list so ensureDetail does not refetch', async () => {
  const detail: JobDetail = {
    ...jobs[0],
    properties: { status: 'new' },
    body: 'Boot body',
    obsidianUrl: 'obsidian://open',
  }
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url === '/api/jobs') {
        return { ok: true, status: 200, json: async () => [detail] }
      }
      return { ok: false, status: 404, json: async () => ({}) }
    }),
  )

  await jobsStore.start()
  expect(jobsStore.getDetail('1001')?.body).toBe('Boot body')
  expect(jobsStore.list[0]).toEqual(jobs[0])

  await jobsStore.ensureDetail('1001')
  expect(vi.mocked(fetch).mock.calls.map((call) => String(call[0]))).toEqual(['/api/jobs'])
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
