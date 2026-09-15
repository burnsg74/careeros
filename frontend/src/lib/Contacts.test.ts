import { fireEvent, render, screen, waitFor } from '@testing-library/svelte'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { resetStores } from './bootStores'
import Contacts from './Contacts.svelte'

const contacts = [
  {
    id: 'aaron-thomson',
    name: 'Aaron Thomson',
    url: 'https://www.linkedin.com/in/aaron-thomson-33bb2521/',
  },
  {
    id: 'michael-mussulis',
    name: 'Michael Mussulis',
    url: 'https://www.linkedin.com/in/michaelmussulis/',
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
      if (url === '/api/contacts' && method === 'GET') {
        return { ok: true, status: 200, json: async () => contacts }
      }
      if (url === '/api/contacts/aaron-thomson' && method === 'PUT') {
        const parsed = JSON.parse(String(init?.body ?? '{}')) as { body: string }
        return {
          ok: true,
          status: 200,
          json: async () => ({
            ...contacts[0],
            properties: {
              name: 'Aaron Thomson',
              note_type: 'Contact',
            },
            body: parsed.body,
            obsidianUrl: 'obsidian://open?vault=CareerOS&file=1-Contacts%2FAaron%20Thomson',
          }),
        }
      }
      if (url === '/api/contacts/aaron-thomson') {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            ...contacts[0],
            properties: {
              name: 'Aaron Thomson',
              note_type: 'Contact',
            },
            body: 'Best mix of **startup** hiring notes.',
            obsidianUrl: 'obsidian://open?vault=CareerOS&file=1-Contacts%2FAaron%20Thomson',
          }),
        }
      }
      return { ok: false, status: 404, json: async () => ({ error: 'Contact not found' }) }
    }),
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

test('renders the contact list', async () => {
  render(Contacts, { props: { path: '/contacts' } })

  expect(await screen.findByRole('columnheader', { name: 'Name' })).toBeInTheDocument()
  expect(screen.getByRole('columnheader', { name: 'URL' })).toBeInTheDocument()
  expect(screen.getByText('Aaron Thomson')).toBeInTheDocument()
  const url = screen.getByRole('link', { name: 'https://www.linkedin.com/in/aaron-thomson-33bb2521/' })
  expect(url).toHaveAttribute('href', 'https://www.linkedin.com/in/aaron-thomson-33bb2521/')
  expect(url).toHaveAttribute('target', '_blank')
  expect(screen.getByRole('button', { name: 'List view' })).toHaveAttribute('aria-pressed', 'true')
})

test('renders contact detail content and properties', async () => {
  render(Contacts, { props: { path: '/contacts/aaron-thomson' } })

  expect(await screen.findByRole('heading', { name: 'Aaron Thomson', level: 1 })).toBeInTheDocument()
  expect(screen.getByText(/Best mix of/)).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Properties', level: 2 })).toBeInTheDocument()
  expect(
    screen.getAllByRole('link', { name: 'https://www.linkedin.com/in/aaron-thomson-33bb2521/' }).length,
  ).toBeGreaterThan(0)
  expect(screen.getByRole('button', { name: 'Previous contact' })).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Next contact' })).toBeEnabled()
  expect(screen.getByRole('link', { name: 'Open in Obsidian' })).toHaveAttribute(
    'href',
    'obsidian://open?vault=CareerOS&file=1-Contacts%2FAaron%20Thomson',
  )
})

test('edits and saves contact markdown', async () => {
  render(Contacts, { props: { path: '/contacts/aaron-thomson' } })

  expect(await screen.findByRole('heading', { name: 'Aaron Thomson', level: 1 })).toBeInTheDocument()
  await fireEvent.click(screen.getByRole('button', { name: 'Edit markdown' }))
  await fireEvent.input(screen.getByRole('textbox', { name: 'Markdown' }), {
    target: { value: 'Worked together at **Acme**.' },
  })
  await fireEvent.click(screen.getByRole('button', { name: 'Save markdown' }))

  await waitFor(() => {
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      '/api/contacts/aaron-thomson',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ body: 'Worked together at **Acme**.' }),
      }),
    )
  })
  expect(await screen.findByText(/Worked together at/)).toBeInTheDocument()
})
