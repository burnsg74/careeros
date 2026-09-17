import { cp, mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import request from 'supertest'
import { afterEach, describe, expect, it } from 'vitest'
import { app } from '../src/app.js'

const originalDataDir = process.env.DATA_DIR
const fixtureDir = fileURLToPath(new URL('./fixtures', import.meta.url))
const tempDirs: string[] = []

afterEach(async () => {
  if (originalDataDir === undefined) {
    delete process.env.DATA_DIR
  } else {
    process.env.DATA_DIR = originalDataDir
  }
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
})

async function copyFixtures(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'careeros-'))
  await cp(fixtureDir, dir, { recursive: true })
  tempDirs.push(dir)
  process.env.DATA_DIR = dir
  return dir
}

describe('PUT /api/jobs/:id', () => {
  it('updates the job markdown body', async () => {
    const dir = await copyFixtures()

    const response = await request(app).put('/api/jobs/1001').send({ body: 'Shipped the **product**.' })

    expect(response.status).toBe(200)
    expect(response.body.body).toBe('Shipped the **product**.')
    expect(response.body.properties.source_id).toBe('1001')

    const raw = await readFile(join(dir, '4-Jobs', 'Acme — Senior Engineer (1001).md'), 'utf8')
    expect(raw).toContain('source_id: "1001"')
    expect(raw).toContain('Shipped the **product**.')
    expect(raw).not.toContain('Ship the product.')
  })

  it('returns 400 when body is missing', async () => {
    await copyFixtures()

    const response = await request(app).put('/api/jobs/1001').send({})

    expect(response.status).toBe(400)
    expect(response.body).toEqual({ error: 'body is required' })
  })
})

describe('PUT /api/contacts/:id', () => {
  it('updates the contact markdown body', async () => {
    const dir = await copyFixtures()

    const response = await request(app)
      .put('/api/contacts/aaron-thomson')
      .send({ body: 'https://example.com/aaron\n' })

    expect(response.status).toBe(200)
    expect(response.body.body).toContain('https://example.com/aaron')
    expect(response.body.url).toBe('https://example.com/aaron')

    const raw = await readFile(join(dir, '1-Contacts', 'Aaron Thomson.md'), 'utf8')
    expect(raw).toContain('name: Aaron Thomson')
    expect(raw).toContain('https://example.com/aaron')
  })
})

describe('PATCH /api/jobs/:id/status', () => {
  it('marks a job applied and records applied_at', async () => {
    const dir = await copyFixtures()

    const response = await request(app).patch('/api/jobs/1001/status').send({ status: 'applied' })

    expect(response.status).toBe(200)
    expect(response.body.status).toBe('applied')
    expect(response.body.applied_at).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(response.body.properties.status).toBe('applied')
    expect(response.body.properties.applied_at).toBe(response.body.applied_at)

    const raw = await readFile(join(dir, '4-Jobs', 'Acme — Senior Engineer (1001).md'), 'utf8')
    expect(raw).toContain('status: applied')
    expect(raw).toContain('Ship the product.')
  })

  it('requires a delete reason', async () => {
    await copyFixtures()

    const response = await request(app).patch('/api/jobs/1001/status').send({ status: 'deleted' })

    expect(response.status).toBe(400)
    expect(response.body).toEqual({ error: 'deleted_reason is required' })
  })

  it('requires other text when the delete reason is other', async () => {
    await copyFixtures()

    const response = await request(app)
      .patch('/api/jobs/1001/status')
      .send({ status: 'deleted', deleted_reason: 'other' })

    expect(response.status).toBe(400)
    expect(response.body).toEqual({ error: 'deleted_reason_other is required' })
  })

  it('rejects an invalid status', async () => {
    await copyFixtures()

    const response = await request(app).patch('/api/jobs/1001/status').send({ status: 'offer' })

    expect(response.status).toBe(400)
    expect(response.body).toEqual({ error: 'status is invalid' })
  })

  it('saves a deleted reason', async () => {
    const dir = await copyFixtures()

    const response = await request(app)
      .patch('/api/jobs/1001/status')
      .send({ status: 'deleted', deleted_reason: 'not_interested' })

    expect(response.status).toBe(200)
    expect(response.body.status).toBe('deleted')
    expect(response.body.deleted_reason).toBe('not_interested')

    const raw = await readFile(join(dir, '4-Jobs', 'Acme — Senior Engineer (1001).md'), 'utf8')
    expect(raw).toContain('deleted_reason: not_interested')
  })

  it('requires missing skills when that is the delete reason', async () => {
    await copyFixtures()

    const response = await request(app)
      .patch('/api/jobs/1001/status')
      .send({ status: 'deleted', deleted_reason: 'missing_skills' })

    expect(response.status).toBe(400)
    expect(response.body).toEqual({ error: 'missing_skills is required' })
  })

  it('records missing skills on that job only', async () => {
    const dir = await copyFixtures()

    const response = await request(app)
      .patch('/api/jobs/1001/status')
      .send({
        status: 'deleted',
        deleted_reason: 'missing_skills',
        missing_skills: ['Ruby on Rails'],
      })

    expect(response.status).toBe(200)
    expect(response.body.id).toBe('1001')
    expect(response.body.status).toBe('deleted')
    expect(response.body.properties.missing_skills).toContain('Ruby on Rails')

    const gaps = await readFile(join(dir, '3-Profile', 'Skill gaps.md'), 'utf8')
    expect(gaps).toContain('Ruby on Rails')

    const beta = await readFile(join(dir, '4-Jobs', 'Beta — Staff Engineer (1002).md'), 'utf8')
    expect(beta).not.toContain('status: deleted')
    expect(beta).not.toContain('deleted_auto: true')
  })
})

describe('PUT /api/job-boards/:id', () => {
  it('updates the job board markdown body', async () => {
    const dir = await copyFixtures()

    const response = await request(app)
      .put('/api/job-boards/wellfound')
      .send({ body: 'Still the best mix.' })

    expect(response.status).toBe(200)
    expect(response.body.body).toBe('Still the best mix.')

    const raw = await readFile(join(dir, '2-Job Boards', '1 - Wellfound.md'), 'utf8')
    expect(raw).toContain('rank: "1"')
    expect(raw).toContain('Still the best mix.')
    expect(raw).not.toContain('Best mix of startup hiring.')
  })
})
