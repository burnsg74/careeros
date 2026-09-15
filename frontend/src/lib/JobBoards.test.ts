import { fireEvent, render, screen, waitFor } from '@testing-library/svelte'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { resetStores } from './bootStores'
import JobBoards from './JobBoards.svelte'

const boards = [
  {
    id: 'wellfound',
    name: 'Wellfound',
    url: 'https://wellfound.com',
    rank: '1',
  },
  {
    id: 'otta',
    name: 'Otta',
    url: 'https://otta.com/',
    rank: '3',
  },
]

beforeEach(() => {
  resetStores()
  localStorage.clear()
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      const method = (init?.method ?? 'GET').toUpperCase()
      if (url === '/api/job-boards' && method === 'GET') {
        return { ok: true, status: 200, json: async () => boards }
      }
      if (url === '/api/job-boards/wellfound' && method === 'PUT') {
        const parsed = JSON.parse(String(init?.body ?? '{}')) as { body: string }
        return {
          ok: true,
          status: 200,
          json: async () => ({
            ...boards[0],
            properties: {
              name: 'Wellfound',
              url: 'https://wellfound.com',
              rank: '1',
            },
            body: parsed.body,
            obsidianUrl: 'obsidian://open?vault=CareerOS&file=2-Job%20Boards%2FWellfound',
          }),
        }
      }
      if (url === '/api/job-boards/wellfound') {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            ...boards[0],
            properties: {
              name: 'Wellfound',
              url: 'https://wellfound.com',
              rank: '1',
            },
            body: 'Best mix of **startup** hiring.',
            obsidianUrl: 'obsidian://open?vault=CareerOS&file=2-Job%20Boards%2FWellfound',
          }),
        }
      }
      return { ok: false, status: 404, json: async () => ({ error: 'Job board not found' }) }
    }),
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

test('renders the job board list', async () => {
  render(JobBoards, { props: { path: '/job-boards' } })

  expect(await screen.findByRole('columnheader', { name: 'Rank' })).toBeInTheDocument()
  expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument()
  expect(screen.getByRole('columnheader', { name: 'URL' })).toBeInTheDocument()
  expect(screen.getByText('Wellfound')).toBeInTheDocument()
  const url = screen.getByRole('link', { name: 'https://wellfound.com' })
  expect(url).toHaveAttribute('href', 'https://wellfound.com')
  expect(url).toHaveAttribute('target', '_blank')
  expect(screen.getByRole('button', { name: 'List view' })).toHaveAttribute('aria-pressed', 'true')
})

test('renders job board detail content and properties', async () => {
  render(JobBoards, { props: { path: '/job-boards/wellfound' } })

  expect(await screen.findByRole('heading', { name: 'Wellfound', level: 1 })).toBeInTheDocument()
  expect(screen.getByText(/Best mix of/)).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Properties', level: 2 })).toBeInTheDocument()
  expect(screen.getAllByRole('link', { name: 'https://wellfound.com' }).length).toBeGreaterThan(0)
  expect(screen.getByRole('button', { name: 'Previous job board' })).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Next job board' })).toBeEnabled()
  expect(screen.getByRole('link', { name: 'Open in Obsidian' })).toHaveAttribute(
    'href',
    'obsidian://open?vault=CareerOS&file=2-Job%20Boards%2FWellfound',
  )
})

test('edits and saves job board markdown', async () => {
  render(JobBoards, { props: { path: '/job-boards/wellfound' } })

  expect(await screen.findByRole('heading', { name: 'Wellfound', level: 1 })).toBeInTheDocument()
  await fireEvent.click(screen.getByRole('button', { name: 'Edit markdown' }))
  await fireEvent.input(screen.getByRole('textbox', { name: 'Markdown' }), {
    target: { value: 'Updated board **notes**.' },
  })
  await fireEvent.click(screen.getByRole('button', { name: 'Save markdown' }))

  await waitFor(() => {
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      '/api/job-boards/wellfound',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ body: 'Updated board **notes**.' }),
      }),
    )
  })
  expect(await screen.findByText(/Updated board/)).toBeInTheDocument()
})
