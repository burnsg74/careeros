import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { resetStores } from './bootStores'
import Jobs from './Jobs.svelte'
import type { JobSummary } from './jobs'

const jobs: JobSummary[] = [
  {
    id: '1001',
    name: 'Senior Engineer',
    company: 'Acme',
    compensation: '$150k – $180k',
    locations: 'Remote',
    captured_at: '2026-09-12T12:00:00.000Z',
    status: 'new',
    url: 'https://example.com/job',
    applied_at: '',
    deleted_reason: '',
    skills: 'TypeScript, Svelte',
  },
  {
    id: '1002',
    name: 'Staff Engineer',
    company: 'Beta',
    compensation: '$200k',
    locations: 'New York',
    captured_at: '2026-09-11T12:00:00.000Z',
    status: 'new',
    url: 'https://example.com/job-2',
    applied_at: '',
    deleted_reason: '',
    skills: 'Ruby on Rails, Python',
  },
  {
    id: '1003',
    name: 'Engineer',
    company: 'Gamma',
    compensation: '$160k',
    locations: 'Austin',
    captured_at: '2026-08-01T12:00:00.000Z',
    status: 'applied',
    url: 'https://example.com/job-3',
    applied_at: '2026-08-01T12:00:00.000Z',
    deleted_reason: '',
    skills: 'Go',
  },
]

function jobDetail(id: string) {
  const job = jobs.find((item) => item.id === id) ?? jobs[0]
  return {
    ...job,
    properties: {
      name: job.name,
      company: job.company,
      url: job.url,
      status: job.status,
    },
    body: 'Ship the **product**.',
    obsidianUrl: 'obsidian://open?vault=CareerOS&file=4-Jobs%2FAcme',
  }
}

beforeEach(() => {
  resetStores()
  localStorage.clear()
  vi.stubGlobal('open', vi.fn())
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      const method = (init?.method ?? 'GET').toUpperCase()
      if (url === '/api/jobs' && method === 'GET') {
        return { ok: true, status: 200, json: async () => jobs }
      }
      if (url === '/api/jobs/1001/status' && method === 'PATCH') {
        const parsed = JSON.parse(String(init?.body ?? '{}')) as { status: string; deleted_reason?: string }
        jobs[0] = {
          ...jobs[0],
          status: parsed.status as JobSummary['status'],
          deleted_reason: parsed.deleted_reason ?? '',
          applied_at: parsed.status === 'applied' ? '2026-09-12T13:00:00.000Z' : jobs[0].applied_at,
        }
        return {
          ok: true,
          status: 200,
          json: async () => jobDetail('1001'),
        }
      }
      if (url === '/api/jobs/1001' && method === 'PUT') {
        const parsed = JSON.parse(String(init?.body ?? '{}')) as { body: string }
        return {
          ok: true,
          status: 200,
          json: async () => ({
            ...jobDetail('1001'),
            body: parsed.body,
          }),
        }
      }
      if (url === '/api/jobs/1001') {
        return {
          ok: true,
          status: 200,
          json: async () => jobDetail('1001'),
        }
      }
      if (url === '/api/jobs/1002') {
        return {
          ok: true,
          status: 200,
          json: async () => jobDetail('1002'),
        }
      }
      if (url === '/api/jobs/1003') {
        return {
          ok: true,
          status: 200,
          json: async () => jobDetail('1003'),
        }
      }
      return { ok: false, status: 404, json: async () => ({ error: 'Job not found' }) }
    }),
  )
})

afterEach(() => {
  jobs[0] = {
    ...jobs[0],
    status: 'new',
    applied_at: '',
    deleted_reason: '',
  }
  localStorage.clear()
  vi.unstubAllGlobals()
})

test('renders cached jobs without waiting on the network', async () => {
  localStorage.setItem(
    'careeros.jobs',
    JSON.stringify({
      v: 1,
      data: {
        list: jobs,
        details: {},
      },
    }),
  )
  vi.mocked(fetch).mockImplementation(
    () =>
      new Promise(() => {
        /* hang */
      }),
  )

  render(Jobs, { props: { path: '/jobs' } })

  expect(await screen.findByText('Acme')).toBeInTheDocument()
  expect(screen.getByText('Senior Engineer')).toBeInTheDocument()
})

test('renders the job list', async () => {
  render(Jobs, { props: { path: '/jobs' } })

  expect(await screen.findByText('Acme')).toBeInTheDocument()
  expect(screen.getByText('Senior Engineer')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'List view' })).toHaveAttribute('aria-pressed', 'true')
  expect(screen.getByText('2 new remaining')).toBeInTheDocument()
  expect(screen.queryByText('Gamma')).not.toBeInTheDocument()
})

test('filters applied jobs and flags stale applications', async () => {
  render(Jobs, { props: { path: '/jobs' } })

  expect(await screen.findByText('Acme')).toBeInTheDocument()
  await fireEvent.click(screen.getByRole('tab', { name: 'Applied' }))

  expect(screen.getByText('Gamma')).toBeInTheDocument()
  expect(screen.queryByText('Acme')).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'No reply?' })).toBeInTheDocument()
})

test('applies a job from the inbox', async () => {
  render(Jobs, { props: { path: '/jobs' } })

  expect(await screen.findByText('Acme')).toBeInTheDocument()
  const applyButtons = screen.getAllByRole('button', { name: 'Apply' })
  await fireEvent.click(applyButtons[0])

  await waitFor(() => {
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      '/api/jobs/1001/status',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ status: 'applied' }),
      }),
    )
  })
  expect(window.open).toHaveBeenCalledWith('https://example.com/job', '_blank', 'noopener')
  expect(screen.queryByText('Acme')).not.toBeInTheDocument()
  expect(screen.getByText('1 new remaining')).toBeInTheDocument()
})

test('opens a delete reason dialog', async () => {
  render(Jobs, { props: { path: '/jobs' } })

  expect(await screen.findByText('Acme')).toBeInTheDocument()
  await fireEvent.click(screen.getAllByRole('button', { name: 'Delete' })[0])

  expect(screen.getByRole('dialog', { name: 'Delete job' })).toBeInTheDocument()
  expect(screen.getByRole('combobox', { name: 'Reason' })).toBeInTheDocument()
  await fireEvent.click(within(screen.getByRole('dialog', { name: 'Delete job' })).getByRole('button', { name: 'Delete' }))

  await waitFor(() => {
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      '/api/jobs/1001/status',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({
          status: 'deleted',
          deleted_reason: 'duplicate',
          deleted_reason_other: '',
        }),
      }),
    )
  })
})

test('flags a missing must-have skill from the listing', async () => {
  render(Jobs, { props: { path: '/jobs' } })

  expect(await screen.findByText('Acme')).toBeInTheDocument()
  await fireEvent.click(screen.getAllByRole('button', { name: 'Delete' })[0])

  const dialog = screen.getByRole('dialog', { name: 'Delete job' })
  await fireEvent.change(within(dialog).getByRole('combobox', { name: 'Reason' }), {
    target: { value: 'missing_skills' },
  })
  expect(within(dialog).getByRole('button', { name: 'Delete' })).toBeDisabled()

  await fireEvent.input(within(dialog).getByRole('textbox', { name: 'Add a skill from the listing' }), {
    target: { value: 'Ruby on Rails' },
  })
  await fireEvent.click(within(dialog).getByRole('button', { name: 'Add' }))
  await fireEvent.click(within(dialog).getByRole('button', { name: 'Delete' }))

  await waitFor(() => {
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      '/api/jobs/1001/status',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({
          status: 'deleted',
          deleted_reason: 'missing_skills',
          deleted_reason_other: '',
          missing_skills: ['Ruby on Rails'],
        }),
      }),
    )
  })
})

test('renders job detail content and properties', async () => {
  render(Jobs, { props: { path: '/jobs/1001' } })

  expect(await screen.findByRole('heading', { name: 'Senior Engineer', level: 1 })).toBeInTheDocument()
  expect(screen.getByText('Acme')).toBeInTheDocument()
  expect(screen.getByText(/Ship the/)).toBeInTheDocument()
  expect(screen.queryByRole('progressbar', { name: 'Inbox progress' })).not.toBeInTheDocument()
  expect(screen.queryByRole('heading', { name: 'Properties', level: 2 })).not.toBeInTheDocument()

  await fireEvent.click(screen.getByRole('button', { name: 'Show properties' }))

  expect(screen.getByRole('heading', { name: 'Properties', level: 2 })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'https://example.com/job' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Hide properties' })).toHaveAttribute('aria-pressed', 'true')
  expect(screen.getByRole('button', { name: 'Previous job' })).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Next job' })).toBeEnabled()
  expect(screen.getByRole('link', { name: 'Open in Obsidian' })).toHaveAttribute(
    'href',
    'obsidian://open?vault=CareerOS&file=4-Jobs%2FAcme',
  )
  expect(screen.queryByRole('button', { name: 'Preview markdown' })).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Apply' })).toBeInTheDocument()
})

test('edits and saves job markdown', async () => {
  render(Jobs, { props: { path: '/jobs/1001' } })

  expect(await screen.findByRole('heading', { name: 'Senior Engineer', level: 1 })).toBeInTheDocument()
  await fireEvent.click(screen.getByRole('button', { name: 'Edit markdown' }))

  const editor = screen.getByRole('textbox', { name: 'Markdown' })
  expect(editor).toHaveValue('Ship the **product**.')
  await fireEvent.input(editor, { target: { value: 'Updated **role**.' } })
  await fireEvent.click(screen.getByRole('button', { name: 'Save markdown' }))

  await waitFor(() => {
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      '/api/jobs/1001',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ body: 'Updated **role**.' }),
      }),
    )
  })
  expect(await screen.findByText(/Updated/)).toBeInTheDocument()
  expect(screen.queryByRole('textbox', { name: 'Markdown' })).not.toBeInTheDocument()
})

test('switching stage from detail opens the first job in that stage', async () => {
  const push = vi.spyOn(history, 'pushState')
  render(Jobs, { props: { path: '/jobs/1001' } })

  expect(await screen.findByRole('heading', { name: 'Senior Engineer', level: 1 })).toBeInTheDocument()
  await fireEvent.click(screen.getByRole('tab', { name: 'Applied' }))

  expect(push).toHaveBeenCalledWith({}, '', '/jobs/1003')
  push.mockRestore()
})
