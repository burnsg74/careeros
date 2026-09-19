import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { resetStores } from './bootStores'
import Jobs from './Jobs.svelte'
import { formatOverallMatch, type JobSummary } from './jobs'

function job(overrides: Partial<JobSummary> & Pick<JobSummary, 'id' | 'name' | 'company'>): JobSummary {
  return {
    compensation: '',
    locations: '',
    remote: 'true',
    posted_at: '',
    company_url: '',
    fit_overall_match: '',
    fit_recommendation: '',
    fit_score: '',
    fit_summary: '',
    fit_have_skills: '',
    fit_familiar_skills: '',
    fit_dont_have_skills: '',
    captured_at: '',
    status: 'new',
    url: '',
    applied_at: '',
    deleted_reason: '',
    skills: '',
    ...overrides,
  }
}

const jobs: JobSummary[] = [
  job({
    id: '1001',
    name: 'Senior Engineer',
    company: 'Acme',
    compensation: '$150k – $180k',
    locations: 'Remote',
    remote: 'true',
    posted_at: '2026-09-13T12:00:00.000Z',
    company_url: 'https://wellfound.com/company/acme',
    fit_overall_match: '0.96',
    fit_recommendation: 'STRONG_PASS',
    fit_score: '10',
    fit_summary:
      'Strong fit. TypeScript and Svelte are core strengths for Greg. The role is a good match, which Greg can own end to end; highlight AI tools that Greg should mention as part of his modern workflow.',
    fit_have_skills: 'TypeScript, Svelte',
    fit_familiar_skills: 'GraphQL',
    fit_dont_have_skills: 'Go',
    captured_at: '2026-09-12T12:00:00.000Z',
    url: 'https://example.com/job',
    skills: 'TypeScript, Svelte',
  }),
  job({
    id: '1002',
    name: 'Staff Engineer',
    company: 'Beta',
    compensation: '$200k',
    locations: 'New York',
    remote: 'false',
    captured_at: '2026-09-11T12:00:00.000Z',
    url: 'https://example.com/job-2',
    skills: 'Ruby on Rails, Python',
  }),
  job({
    id: '1003',
    name: 'Engineer',
    company: 'Gamma',
    compensation: '$160k',
    locations: 'Austin',
    remote: 'true',
    fit_overall_match: '0.80',
    captured_at: '2026-08-01T12:00:00.000Z',
    status: 'applied',
    url: 'https://example.com/job-3',
    applied_at: '2026-08-01T12:00:00.000Z',
    skills: 'Go',
  }),
]

const postingBody = `Acme builds widgets.

## The role

Ship the **product**.
`

function skillsLine(label: string) {
  return screen.getByText((_, el) => {
    if (!(el instanceof HTMLElement) || !el.classList.contains('skills-line')) {
      return false
    }
    return (el.textContent ?? '').includes(label)
  })
}

function jobDetail(id: string) {
  const listed = jobs.find((item) => item.id === id) ?? jobs[0]
  return {
    ...listed,
    properties: {
      name: listed.name,
      company: listed.company,
      url: listed.url,
      company_url: listed.company_url,
      posted_at: listed.posted_at,
      status: listed.status,
      fit_score: listed.fit_score,
      fit_recommendation: listed.fit_recommendation,
      fit_required_match: listed.id === '1001' ? '1.00' : '',
      fit_overall_match: listed.fit_overall_match,
    },
    body: listed.id === '1001' ? postingBody : 'Ship the **product**.',
    obsidianUrl: 'obsidian://open?vault=CareerOS&file=4-Jobs%2FAcme',
  }
}

beforeEach(() => {
  resetStores()
  localStorage.clear()
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-09-18T12:00:00.000Z'))
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
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

test('formats YAML fit ratios and legacy percentage values', () => {
  expect(formatOverallMatch('0.96')).toBe('96%')
  expect(formatOverallMatch('0.46')).toBe('46%')
  expect(formatOverallMatch('1.00')).toBe('100%')
  expect(formatOverallMatch('0')).toBe('0%')
  expect(formatOverallMatch('96.00')).toBe('96%')
  expect(formatOverallMatch('')).toBe('—')
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
  expect(screen.getByRole('columnheader', { name: 'Company' })).toBeInTheDocument()
  expect(screen.getByRole('columnheader', { name: 'Role' })).toBeInTheDocument()
  expect(screen.getByRole('columnheader', { name: 'Compensation' })).toBeInTheDocument()
  expect(screen.getByRole('columnheader', { name: 'Match' })).toBeInTheDocument()
  expect(screen.getByRole('columnheader', { name: 'Actions' })).toBeInTheDocument()
  expect(screen.getByText('96%')).toBeInTheDocument()
  expect(screen.queryByRole('columnheader', { name: 'Location' })).not.toBeInTheDocument()
  expect(screen.getByRole('checkbox', { name: 'Fully remote' })).toBeChecked()
  expect(screen.queryByText('Beta')).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'List view' })).toHaveAttribute('aria-pressed', 'true')
  expect(screen.queryByRole('progressbar', { name: 'Inbox progress' })).not.toBeInTheDocument()
  expect(screen.getByRole('tab', { name: 'Inbox (2)' })).toHaveAttribute('aria-selected', 'true')
  expect(screen.getByRole('tab', { name: 'Applied (1)' })).toBeInTheDocument()
  expect(screen.getByRole('tab', { name: 'All (3)' })).toBeInTheDocument()
  expect(screen.queryByText('Gamma')).not.toBeInTheDocument()
})

test('filters applied jobs and flags stale applications', async () => {
  render(Jobs, { props: { path: '/jobs' } })

  expect(await screen.findByText('Acme')).toBeInTheDocument()
  await fireEvent.click(screen.getByRole('tab', { name: 'Applied (1)' }))

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
          deleted_reason: 'not_interested',
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
  expect(screen.getByRole('link', { name: 'Open job posting in a new tab' })).toHaveAttribute(
    'href',
    'https://example.com/job',
  )
  expect(screen.getByRole('link', { name: 'Acme' })).toHaveAttribute(
    'href',
    'https://wellfound.com/company/acme',
  )
  expect(screen.getByText('$150k – $180k')).toBeInTheDocument()
  expect(screen.getByText('Date Posted: Sep 13, 2026 (5 days ago)')).toBeInTheDocument()
  expect(screen.getByText('Strong pass 10/10')).toBeInTheDocument()
  expect(skillsLine('Have:')).toHaveTextContent('Have: TypeScript, Svelte')
  expect(skillsLine('Familiar:')).toHaveTextContent('Familiar: GraphQL')
  expect(skillsLine("Don't have:")).toHaveTextContent("Don't have: Go")
  expect(screen.getByText(/core strengths/)).toHaveTextContent(/you can own/)
  expect(screen.queryByText(/for Greg/)).not.toBeInTheDocument()
  expect(screen.queryByText(/required match 100%/)).not.toBeInTheDocument()
  expect(screen.getByText(/Ship the/)).toBeInTheDocument()
  expect(screen.queryByRole('progressbar', { name: 'Inbox progress' })).not.toBeInTheDocument()
  expect(screen.getByText('Details')).toBeInTheDocument()

  await fireEvent.click(screen.getByText('Details'))

  expect(screen.getByText('96%')).toBeInTheDocument()
  expect(screen.getByText('100%')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'https://example.com/job' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Previous job' })).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Next job' })).toBeDisabled()
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
  expect(editor).toHaveValue(postingBody)
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
  await fireEvent.click(screen.getByRole('tab', { name: 'Applied (1)' }))

  expect(push).toHaveBeenCalledWith({}, '', '/jobs/1003')
  push.mockRestore()
})

test('filters the inbox by remote, match, skills, and pay', async () => {
  render(Jobs, { props: { path: '/jobs' } })

  expect(await screen.findByText('Acme')).toBeInTheDocument()
  expect(screen.queryByText('Beta')).not.toBeInTheDocument()

  await fireEvent.click(screen.getByRole('checkbox', { name: 'Fully remote' }))
  expect(screen.getByText('Beta')).toBeInTheDocument()

  await fireEvent.input(screen.getByRole('spinbutton', { name: 'Min match %' }), { target: { value: '90' } })
  expect(screen.queryByText('Beta')).not.toBeInTheDocument()
  expect(screen.getByText('Acme')).toBeInTheDocument()

  await fireEvent.input(screen.getByRole('spinbutton', { name: 'Min match %' }), { target: { value: '' } })
  await fireEvent.input(screen.getByRole('searchbox', { name: 'Skills' }), { target: { value: 'Rails' } })
  expect(screen.queryByText('Acme')).not.toBeInTheDocument()
  expect(screen.getByText('Beta')).toBeInTheDocument()

  await fireEvent.input(screen.getByRole('searchbox', { name: 'Skills' }), { target: { value: '' } })
  await fireEvent.input(screen.getByRole('spinbutton', { name: 'Min pay ($k)' }), { target: { value: '190' } })
  expect(screen.queryByText('Acme')).not.toBeInTheDocument()
  expect(screen.getByText('Beta')).toBeInTheDocument()

  await fireEvent.input(screen.getByRole('spinbutton', { name: 'Min pay ($k)' }), { target: { value: '250' } })
  expect(screen.getByText('No jobs match these filters.')).toBeInTheDocument()
})

test('detail shortcuts move between jobs and apply or delete the current one', async () => {
  const push = vi.spyOn(history, 'pushState')
  const view = render(Jobs, { props: { path: '/jobs' } })

  expect(await screen.findByText('Acme')).toBeInTheDocument()
  await fireEvent.click(screen.getByRole('checkbox', { name: 'Fully remote' }))
  await fireEvent.click(screen.getByRole('button', { name: 'Acme' }))
  expect(push).toHaveBeenCalledWith({}, '', '/jobs/1001')

  await view.rerender({ path: '/jobs/1001' })
  expect(await screen.findByRole('heading', { name: 'Senior Engineer', level: 1 })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Apply' })).toHaveAttribute('aria-keyshortcuts', 'a')
  expect(screen.getByRole('button', { name: 'Delete' })).toHaveAttribute('aria-keyshortcuts', 'd')

  await fireEvent.keyDown(window, { key: 'n' })
  expect(push).toHaveBeenCalledWith({}, '', '/jobs/1002')

  await view.rerender({ path: '/jobs/1002' })
  expect(await screen.findByRole('heading', { name: 'Staff Engineer', level: 1 })).toBeInTheDocument()
  await fireEvent.keyDown(window, { key: 'p' })
  expect(push).toHaveBeenCalledWith({}, '', '/jobs/1001')

  await view.rerender({ path: '/jobs/1001' })
  expect(await screen.findByRole('heading', { name: 'Senior Engineer', level: 1 })).toBeInTheDocument()
  await fireEvent.keyDown(window, { key: 'd' })
  expect(screen.getByRole('dialog', { name: 'Delete job' })).toBeInTheDocument()
  expect(screen.getByRole('combobox', { name: 'Reason' })).toHaveValue('not_interested')
  await fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

  await fireEvent.keyDown(window, { key: 'a' })
  await waitFor(() => {
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      '/api/jobs/1001/status',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ status: 'applied' }),
      }),
    )
  })

  push.mockRestore()
})

test('D then Enter deletes with Not interested', async () => {
  render(Jobs, { props: { path: '/jobs/1001' } })

  expect(await screen.findByRole('heading', { name: 'Senior Engineer', level: 1 })).toBeInTheDocument()
  await fireEvent.keyDown(window, { key: 'd' })
  expect(screen.getByRole('combobox', { name: 'Reason' })).toHaveValue('not_interested')
  await fireEvent.keyDown(window, { key: 'Enter' })

  await waitFor(() => {
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      '/api/jobs/1001/status',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({
          status: 'deleted',
          deleted_reason: 'not_interested',
          deleted_reason_other: '',
        }),
      }),
    )
  })
})
