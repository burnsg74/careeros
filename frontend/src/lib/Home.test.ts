import { fireEvent, render, screen, waitFor } from '@testing-library/svelte'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { resetStores } from './bootStores'
import Home from './Home.svelte'
import type { JobSummary } from './jobs'

const jobs: JobSummary[] = [
  {
    id: '1001',
    name: 'Senior Engineer',
    company: 'Acme',
    compensation: '$150k',
    locations: 'Remote',
    fit_overall_match: '0.96',
    captured_at: '2026-09-12T12:00:00.000Z',
    status: 'new',
    url: 'https://example.com/job',
    applied_at: '',
    deleted_reason: '',
    skills: 'TypeScript',
  },
  {
    id: '1003',
    name: 'Staff Engineer',
    company: 'Gamma',
    compensation: '$200k',
    locations: 'Austin',
    fit_overall_match: '',
    captured_at: '2026-08-01T12:00:00.000Z',
    status: 'applied',
    url: 'https://example.com/job-3',
    applied_at: '2026-08-01T12:00:00.000Z',
    deleted_reason: '',
    skills: 'Go',
  },
]

function stubApis(jobList: JobSummary[] = jobs) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url === '/api/jobs') {
        return { ok: true, status: 200, json: async () => jobList }
      }
      if (url === '/api/contacts') {
        return { ok: true, status: 200, json: async () => [{ id: 'c1', name: 'Pat', url: '' }] }
      }
      if (url === '/api/job-boards') {
        return { ok: true, status: 200, json: async () => [{ id: 'b1', name: 'Wellfound', url: '', rank: '1' }] }
      }
      return { ok: false, status: 404, json: async () => ({}) }
    }),
  )
}

beforeEach(() => {
  resetStores()
  localStorage.clear()
  history.replaceState({}, '', '/')
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-09-18T12:00:00.000Z'))
  stubApis()
})

afterEach(() => {
  resetStores()
  localStorage.clear()
  history.replaceState({}, '', '/')
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

test('renders date, summary, and vault widgets', async () => {
  render(Home)

  expect(screen.getByRole('heading', { name: 'Home', level: 1 })).toBeInTheDocument()
  expect(screen.getByText(/Friday.*September.*18.*2026/)).toBeInTheDocument()

  await waitFor(() => {
    expect(screen.getByText(/1 inbox/)).toBeInTheDocument()
  })

  expect(screen.getByRole('link', { name: '1 follow-up' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Inbox', level: 2 })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Contacts', level: 2 })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Job Boards', level: 2 })).toBeInTheDocument()

  const inboxJob = screen.getByRole('link', { name: /Senior Engineer/ })
  expect(inboxJob).toHaveAttribute('href', '/jobs/1001')
  expect(inboxJob).toHaveTextContent('Acme')
  expect(screen.queryByRole('link', { name: /Staff Engineer/ })).not.toBeInTheDocument()

  expect(screen.getByRole('link', { name: /Pat/ })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /Wellfound/ })).toBeInTheDocument()
})

test('view all jobs navigates without a full page load', async () => {
  render(Home)
  await waitFor(() => expect(screen.getByRole('link', { name: /Senior Engineer/ })).toBeInTheDocument())

  fireEvent.click(screen.getAllByRole('link', { name: 'View all' })[0])
  expect(window.location.pathname).toBe('/jobs')
})

test('shows an empty inbox when no new jobs remain', async () => {
  vi.unstubAllGlobals()
  stubApis(jobs.filter((job) => job.status !== 'new'))
  render(Home)

  await waitFor(() => {
    expect(screen.getByText('Inbox zero. Every captured job is applied or deleted.')).toBeInTheDocument()
  })
  expect(screen.getByText(/0 inbox/)).toBeInTheDocument()
  expect(screen.queryByRole('link', { name: /Senior Engineer/ })).not.toBeInTheDocument()
})
