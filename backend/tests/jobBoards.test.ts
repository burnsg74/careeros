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

describe('GET /api/job-boards', () => {
  it('lists job boards by rank', async () => {
    process.env.DATA_DIR = fixtureDir

    const response = await request(app).get('/api/job-boards')

    expect(response.status).toBe(200)
    expect(response.body).toEqual([
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
    ])
  })
})

describe('GET /api/job-boards/:id', () => {
  it('returns job board properties and body', async () => {
    process.env.DATA_DIR = fixtureDir

    const response = await request(app).get('/api/job-boards/wellfound')

    expect(response.status).toBe(200)
    expect(response.body.id).toBe('wellfound')
    expect(response.body.name).toBe('Wellfound')
    expect(response.body.properties.rank).toBe('1')
    expect(response.body.body).toContain('Best mix of startup hiring.')
  })

  it('returns 404 for an unknown job board', async () => {
    process.env.DATA_DIR = fixtureDir

    const response = await request(app).get('/api/job-boards/missing')

    expect(response.status).toBe(404)
    expect(response.body).toEqual({ error: 'Job board not found' })
  })
})
