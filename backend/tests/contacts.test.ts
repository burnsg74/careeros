import { fileURLToPath } from 'node:url'
import request from 'supertest'
import { afterEach, describe, expect, it } from 'vitest'
import { app } from '../src/app.js'

const originalDataDir = process.env.DATA_DIR
const fixtureDir = fileURLToPath(new URL('./fixtures', import.meta.url))

afterEach(() => {
  if (originalDataDir === undefined) {
    delete process.env.DATA_DIR
  } else {
    process.env.DATA_DIR = originalDataDir
  }
})

describe('GET /api/contacts', () => {
  it('lists contacts by name', async () => {
    process.env.DATA_DIR = fixtureDir

    const response = await request(app).get('/api/contacts')

    expect(response.status).toBe(200)
    expect(response.body).toEqual([
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
    ])
  })
})

describe('GET /api/contacts/:id', () => {
  it('returns contact properties and body', async () => {
    process.env.DATA_DIR = fixtureDir

    const response = await request(app).get('/api/contacts/aaron-thomson')

    expect(response.status).toBe(200)
    expect(response.body.id).toBe('aaron-thomson')
    expect(response.body.name).toBe('Aaron Thomson')
    expect(response.body.properties.name).toBe('Aaron Thomson')
    expect(response.body.body).toContain('https://www.linkedin.com/in/aaron-thomson-33bb2521/')
    expect(response.body.obsidianUrl).toBe(
      `obsidian://open?vault=fixtures&file=${encodeURIComponent('1-Contacts/Aaron Thomson')}`,
    )
  })

  it('returns 404 for an unknown contact', async () => {
    process.env.DATA_DIR = fixtureDir

    const response = await request(app).get('/api/contacts/missing')

    expect(response.status).toBe(404)
    expect(response.body).toEqual({ error: 'Contact not found' })
  })
})
