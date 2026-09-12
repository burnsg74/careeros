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

describe('GET /api/health', () => {
  it('reports the configured data directory', async () => {
    process.env.DATA_DIR = fixtureDir

    const response = await request(app).get('/api/health')

    expect(response.status).toBe(200)
    expect(response.body.ok).toBe(true)
    expect(response.body.dataDir).toBe(fixtureDir)
  })
})
