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

describe('GET /api/jobs', () => {
  it('lists jobs newest first', async () => {
    process.env.DATA_DIR = fixtureDir

    const response = await request(app).get('/api/jobs')

    expect(response.status).toBe(200)
    expect(response.body).toEqual([
      {
        id: '1001',
        name: 'Senior Engineer',
        company: 'Acme',
        compensation: '$150k – $180k',
        locations: 'Remote',
        captured_at: '2026-09-12T12:00:00.000Z',
      },
      {
        id: '1002',
        name: 'Staff Engineer',
        company: 'Beta',
        compensation: '$200k',
        locations: 'New York',
        captured_at: '2026-09-11T12:00:00.000Z',
      },
    ])
  })
})

describe('GET /api/jobs/:id', () => {
  it('returns job properties and body', async () => {
    process.env.DATA_DIR = fixtureDir

    const response = await request(app).get('/api/jobs/1001')

    expect(response.status).toBe(200)
    expect(response.body.id).toBe('1001')
    expect(response.body.name).toBe('Senior Engineer')
    expect(response.body.properties.source_id).toBe('1001')
    expect(response.body.properties.remote).toBe('true')
    expect(response.body.body).toContain('Ship the product.')
    expect(response.body.obsidianUrl).toBe(
      `obsidian://open?vault=fixtures&file=${encodeURIComponent('4-Jobs/Acme — Senior Engineer (1001)')}`,
    )
  })

  it('returns 404 for an unknown job', async () => {
    process.env.DATA_DIR = fixtureDir

    const response = await request(app).get('/api/jobs/missing')

    expect(response.status).toBe(404)
    expect(response.body).toEqual({ error: 'Job not found' })
  })
})
