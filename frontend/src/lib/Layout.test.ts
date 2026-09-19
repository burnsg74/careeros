import { fireEvent, render, screen, waitFor } from '@testing-library/svelte'
import { afterEach, expect, test, vi } from 'vitest'
import App from '../App.svelte'
import { resetStores } from './bootStores'

afterEach(() => {
  resetStores()
  localStorage.clear()
  vi.unstubAllGlobals()
})

test('renders left nav and Home heading', () => {
  render(App)

  expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Expand navigation' })).toHaveAttribute('aria-expanded', 'false')
  expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Jobs' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Contacts' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Job Boards' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Home', level: 1 })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Refresh' })).toBeInTheDocument()
})

test('expands and collapses the left nav', () => {
  render(App)

  const toggle = screen.getByRole('button', { name: 'Expand navigation' })
  fireEvent.click(toggle)

  expect(screen.getByRole('button', { name: 'Collapse navigation' })).toHaveAttribute('aria-expanded', 'true')
  expect(screen.getByText('CareerOS')).toBeInTheDocument()
  expect(localStorage.getItem('careeros.navExpanded')).toBe('1')

  fireEvent.click(screen.getByRole('button', { name: 'Collapse navigation' }))
  expect(screen.getByRole('button', { name: 'Expand navigation' })).toHaveAttribute('aria-expanded', 'false')
  expect(localStorage.getItem('careeros.navExpanded')).toBe('0')
})

test('refresh clears cached stores then reloads from the api', async () => {
  localStorage.setItem(
    'careeros.jobs',
    JSON.stringify({
      v: 1,
      data: {
        list: [
          {
            id: '1001',
            name: 'Cached Engineer',
            company: 'Old Co',
            compensation: '',
            locations: '',
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
            captured_at: '',
            status: 'new',
            url: '',
            applied_at: '',
            deleted_reason: '',
            skills: '',
          },
        ],
        details: {},
      },
    }),
  )

  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url === '/api/jobs') {
        return {
          ok: true,
          status: 200,
          json: async () => [
            {
              id: '1001',
              name: 'Vault Engineer',
              company: 'New Co',
              compensation: '',
              locations: '',
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
              captured_at: '',
              status: 'new',
              url: '',
              applied_at: '',
              deleted_reason: '',
              skills: '',
            },
          ],
        }
      }
      if (url === '/api/contacts' || url === '/api/job-boards') {
        return { ok: true, status: 200, json: async () => [] }
      }
      return { ok: false, status: 404, json: async () => ({}) }
    }),
  )

  render(App)
  await fireEvent.click(screen.getByRole('button', { name: 'Refresh' }))

  await waitFor(() => {
    const raw = localStorage.getItem('careeros.jobs')
    expect(raw).toBeTruthy()
    const parsed = JSON.parse(raw ?? '{}') as { data?: { list?: Array<{ name: string }> } }
    expect(parsed.data?.list?.[0]?.name).toBe('Vault Engineer')
  })
})
