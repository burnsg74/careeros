import { fireEvent, render, screen, waitFor } from '@testing-library/svelte'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import ApplicationQuestions from './ApplicationQuestions.svelte'
import { resetStores } from './bootStores'
import type { JobDetail } from './jobs'

const job: JobDetail = {
  id: '1001',
  name: 'Senior Engineer',
  company: 'Acme',
  compensation: '$150k',
  locations: 'Remote',
  remote: 'true',
  posted_at: '',
  company_url: 'https://wellfound.com/company/acme',
  fit_overall_match: '',
  fit_recommendation: '',
  fit_score: '',
  fit_summary: '',
  fit_have_skills: '',
  fit_familiar_skills: '',
  fit_dont_have_skills: '',
  captured_at: '',
  status: 'applied',
  url: 'https://example.com/job',
  applied_at: '2026-09-19T12:00:00.000Z',
  deleted_reason: '',
  skills: 'TypeScript',
  properties: { name: 'Senior Engineer', company: 'Acme' },
  body: 'Acme builds widgets.\n\n## The role\n\nShip the **product**.',
  obsidianUrl: 'obsidian://open?vault=CareerOS&file=4-Jobs%2FAcme',
}

const whyCompany = {
  id: 'what-interests-you-about-working-for-this-company',
  title: 'What interests you about working for this company?',
}

beforeEach(() => {
  resetStores()
  localStorage.clear()
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      const method = (init?.method ?? 'GET').toUpperCase()
      if (url === '/api/jobs' && method === 'GET') {
        return { ok: true, status: 200, json: async () => [job] }
      }
      if (url === '/api/jobs/1001' && method === 'GET') {
        return { ok: true, status: 200, json: async () => job }
      }
      if (url === '/api/application-questions' && method === 'GET') {
        return { ok: true, status: 200, json: async () => [whyCompany] }
      }
      if (url === '/api/application-questions' && method === 'POST') {
        const parsed = JSON.parse(String(init?.body ?? '{}')) as { title: string }
        return {
          ok: true,
          status: 200,
          json: async () => ({ id: 'why-this-role', title: parsed.title }),
        }
      }
      if (url === '/api/jobs/1001/application-answers' && method === 'POST') {
        const parsed = JSON.parse(String(init?.body ?? '{}')) as { questionId: string }
        return {
          ok: true,
          status: 200,
          json: async () => ({
            answer:
              parsed.questionId === 'why-this-role'
                ? 'This role matches the stack I already ship.'
                : 'I am drawn to Acme because they are shipping a product I can own.',
          }),
        }
      }
      return { ok: false, status: 404, json: async () => ({ error: 'Not found' }) }
    }),
  )
})

afterEach(() => {
  resetStores()
  localStorage.clear()
  window.history.replaceState({}, '', '/')
  vi.unstubAllGlobals()
})

test('shows the posting and generates an answer for a listed question', async () => {
  render(ApplicationQuestions, { props: { jobId: '1001' } })

  expect(await screen.findByRole('heading', { name: 'Senior Engineer', level: 1 })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Acme' })).toHaveAttribute(
    'href',
    'https://wellfound.com/company/acme',
  )
  expect(screen.getByRole('link', { name: 'Open listing' })).toHaveAttribute('href', 'https://example.com/job')
  expect(screen.getByText('Acme builds widgets.')).toBeInTheDocument()
  expect(screen.getByText(/Ship the/)).toBeInTheDocument()
  expect(
    await screen.findByRole('button', { name: 'What interests you about working for this company?' }),
  ).toBeInTheDocument()

  await fireEvent.click(
    screen.getByRole('button', { name: 'What interests you about working for this company?' }),
  )

  await waitFor(() => {
    expect(screen.getByRole('textbox', { name: 'Answer' })).toHaveValue(
      'I am drawn to Acme because they are shipping a product I can own.',
    )
  })
  expect(vi.mocked(fetch)).toHaveBeenCalledWith(
    '/api/jobs/1001/application-answers',
    expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ questionId: whyCompany.id }),
    }),
  )
})

test('adds a new question and generates its answer', async () => {
  render(ApplicationQuestions, { props: { jobId: '1001' } })

  expect(await screen.findByRole('button', { name: 'What interests you about working for this company?' })).toBeInTheDocument()
  await fireEvent.input(screen.getByPlaceholderText('Add a question'), {
    target: { value: 'Why this role?' },
  })
  await fireEvent.click(screen.getByRole('button', { name: 'Add' }))

  await waitFor(() => {
    expect(screen.getByRole('button', { name: 'Why this role?' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Answer' })).toHaveValue(
      'This role matches the stack I already ship.',
    )
  })
  expect(vi.mocked(fetch)).toHaveBeenCalledWith(
    '/api/application-questions',
    expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ title: 'Why this role?' }),
    }),
  )
})
