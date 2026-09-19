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
      expect.objectContaining({
        id: '1001',
        name: 'Senior Engineer',
        company: 'Acme',
        compensation: '$150k – $180k',
        locations: 'Remote',
        remote: 'true',
        posted_at: '2026-09-07T11:24:07.000Z',
        company_url: 'https://wellfound.com/company/acme',
        fit_overall_match: '0.96',
        fit_recommendation: 'STRONG_PASS',
        fit_score: '10',
        fit_summary:
          'Strong fit. TypeScript and Svelte are core strengths for Greg. The role is a good match, which Greg can own end to end; highlight AI tools that Greg should mention as part of his modern workflow.',
        fit_have_skills: 'TypeScript, Svelte',
        fit_familiar_skills: 'GraphQL',
        fit_dont_have_skills: 'Go',
        captured_at: '2026-09-12T12:00:00.000Z',
        status: 'new',
        url: 'https://wellfound.com/jobs/1001-senior-engineer',
        applied_at: '',
        deleted_reason: '',
        skills: 'TypeScript, Svelte',
        body: expect.stringContaining('Ship the product.'),
        obsidianUrl: `obsidian://open?vault=fixtures&file=${encodeURIComponent('4-Jobs/Acme — Senior Engineer (1001)')}`,
      }),
      expect.objectContaining({
        id: '1002',
        name: 'Staff Engineer',
        company: 'Beta',
        compensation: '$200k',
        locations: 'New York',
        remote: 'false',
        posted_at: '',
        company_url: 'https://wellfound.com/company/beta',
        fit_overall_match: '',
        fit_recommendation: '',
        fit_score: '',
        fit_summary: '',
        fit_have_skills: '',
        fit_familiar_skills: '',
        fit_dont_have_skills: '',
        captured_at: '2026-09-11T12:00:00.000Z',
        status: 'new',
        url: 'https://wellfound.com/jobs/1002-staff-engineer',
        applied_at: '',
        deleted_reason: '',
        skills: 'Ruby on Rails, Python',
        body: expect.stringContaining('Staff role at Beta.'),
        obsidianUrl: `obsidian://open?vault=fixtures&file=${encodeURIComponent('4-Jobs/Beta — Staff Engineer (1002)')}`,
      }),
    ])
    expect(response.body[0].properties.source_id).toBe('1001')
    expect(response.body[1].properties.source_id).toBe('1002')
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
    expect(response.body.properties.posted_at).toBe('2026-09-07T11:24:07.000Z')
    expect(response.body.properties.fit_overall_match).toBe('0.96')
    expect(response.body.properties.fit_early_exit).toBe('false')
    expect(response.body.fit_overall_match).toBe('0.96')
    expect(response.body.remote).toBe('true')
    expect(response.body.posted_at).toBe('2026-09-07T11:24:07.000Z')
    expect(response.body.fit_have_skills).toBe('TypeScript, Svelte')
    expect(response.body.fit_familiar_skills).toBe('GraphQL')
    expect(response.body.fit_dont_have_skills).toBe('Go')
    expect(response.body.fit_summary).toContain('core strengths for Greg')
    expect(response.body.body).toContain('Ship the product.')
    expect(response.body.body).not.toContain('## Fit Evaluation')
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
