import { render, screen } from '@testing-library/svelte'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
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
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo) => {
      const url = String(input)
      if (url === '/api/contacts') {
        return { ok: true, status: 200, json: async () => contacts }
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
})
