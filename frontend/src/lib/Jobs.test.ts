import { render, screen } from '@testing-library/svelte'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import Jobs from './Jobs.svelte'

const jobs = [
  {
    id: '1001',
    name: 'Senior Engineer',
    company: 'Acme',
    compensation: '$150k – $180k',
    locations: 'Remote',
    captured_at: '2026-09-12T12:00:00.000Z',
  },
  {
    id: '1002',
    name: 'Staff Engineer',
    company: 'Beta',
    compensation: '$200k',
    locations: 'New York',
    captured_at: '2026-09-11T12:00:00.000Z',
  },
]

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo) => {
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
            properties: {
              name: 'Senior Engineer',
              company: 'Acme',
              url: 'https://example.com/job',
            },
            body: 'Ship the **product**.',
          }),
        }
      }
      return { ok: false, status: 404, json: async () => ({ error: 'Job not found' }) }
    }),
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

test('renders the job list', async () => {
  render(Jobs, { props: { path: '/jobs' } })

  expect(await screen.findByText('Acme')).toBeInTheDocument()
  expect(screen.getByText('Senior Engineer')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'List view' })).toHaveAttribute('aria-pressed', 'true')
})

test('renders job detail content and properties', async () => {
  render(Jobs, { props: { path: '/jobs/1001' } })

  expect(await screen.findByRole('heading', { name: 'Senior Engineer', level: 1 })).toBeInTheDocument()
  expect(screen.getByText(/Ship the/)).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Properties', level: 2 })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'https://example.com/job' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Previous job' })).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Next job' })).toBeEnabled()
})
