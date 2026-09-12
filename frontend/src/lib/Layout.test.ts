import { render, screen } from '@testing-library/svelte'
import { expect, test } from 'vitest'
import App from '../App.svelte'

test('renders left nav and Home heading', () => {
  render(App)

  expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Jobs' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Job Boards' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Home', level: 1 })).toBeInTheDocument()
  expect(screen.getByText('Contacts')).toBeInTheDocument()
})
