import { fireEvent, render, screen } from '@testing-library/svelte'
import { afterEach, expect, test } from 'vitest'
import App from '../App.svelte'

afterEach(() => {
  localStorage.clear()
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
