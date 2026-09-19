import { cp, mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import request from 'supertest'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { app } from '../src/app.js'
import {
  fillTemplate,
  parseCatalog,
  setCompleteText,
  slugifyQuestion,
  splitPrompt,
  unwrapGeneratedPrompt,
} from '../src/lib/applicationQuestions.js'

const originalDataDir = process.env.DATA_DIR
const originalApiKey = process.env.ANTHROPIC_API_KEY
const fixtureDir = fileURLToPath(new URL('./fixtures', import.meta.url))
const tempDirs: string[] = []

afterEach(async () => {
  setCompleteText(null)
  if (originalDataDir === undefined) {
    delete process.env.DATA_DIR
  } else {
    process.env.DATA_DIR = originalDataDir
  }
  if (originalApiKey === undefined) {
    delete process.env.ANTHROPIC_API_KEY
  } else {
    process.env.ANTHROPIC_API_KEY = originalApiKey
  }
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
})

async function copyFixtures(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'careeros-aq-'))
  await cp(fixtureDir, dir, { recursive: true })
  tempDirs.push(dir)
  process.env.DATA_DIR = dir
  return dir
}

describe('application question helpers', () => {
  it('slugifies titles', () => {
    expect(slugifyQuestion('What interests you about working for this company?')).toBe(
      'what-interests-you-about-working-for-this-company',
    )
  })

  it('parses catalog headings', () => {
    expect(
      parseCatalog(`# What interests you about working for this company?

Notes

# Why are you leaving your current role?
`),
    ).toEqual([
      { id: 'what-interests-you-about-working-for-this-company', title: 'What interests you about working for this company?' },
      { id: 'why-are-you-leaving-your-current-role', title: 'Why are you leaving your current role?' },
    ])
  })

  it('fills template placeholders', () => {
    expect(fillTemplate('Hi {{JOB_TITLE}} at {{COMPANY_NAME}}', { JOB_TITLE: 'Eng', COMPANY_NAME: 'Acme' })).toBe(
      'Hi Eng at Acme',
    )
  })

  it('splits prompts on the user-turn heading', () => {
    const split = splitPrompt('# ROLE\n\nSystem\n\n# USER TURN TEMPLATE\n\nUser {{JOB_TITLE}}\n')
    expect(split).toEqual({ system: '# ROLE\n\nSystem', userTemplate: 'User {{JOB_TITLE}}' })
  })

  it('unwraps fenced generated prompts', () => {
    expect(unwrapGeneratedPrompt('```markdown\n# ROLE\n\n# USER TURN TEMPLATE\n\nHi\n```')).toBe(
      '# ROLE\n\n# USER TURN TEMPLATE\n\nHi',
    )
  })
})

describe('GET /api/application-questions', () => {
  it('lists catalog questions', async () => {
    await copyFixtures()

    const response = await request(app).get('/api/application-questions')

    expect(response.status).toBe(200)
    expect(response.body).toEqual([
      {
        id: 'what-interests-you-about-working-for-this-company',
        title: 'What interests you about working for this company?',
      },
    ])
  })
})

describe('POST /api/application-questions', () => {
  it('returns an existing question without calling the model', async () => {
    await copyFixtures()
    const complete = vi.fn(async () => {
      throw new Error('should not be called')
    })
    setCompleteText(complete)

    const response = await request(app).post('/api/application-questions').send({
      title: 'What interests you about working for this company?',
    })

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      id: 'what-interests-you-about-working-for-this-company',
      title: 'What interests you about working for this company?',
    })
    expect(complete).not.toHaveBeenCalled()
  })

  it('writes a new prompt and catalog entry', async () => {
    const dir = await copyFixtures()
    setCompleteText(async ({ user }) => {
      expect(user).toContain('Why are you a good fit?')
      return `# ROLE

Answer as Greg.

# USER TURN TEMPLATE

Question: Why are you a good fit?
Title: {{JOB_TITLE}}
Company: {{COMPANY_NAME}}
Posting: {{POSTING_MARKDOWN}}
Profile: {{GREG_PROFILE}}
`
    })

    const response = await request(app).post('/api/application-questions').send({
      title: 'Why are you a good fit?',
    })

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      id: 'why-are-you-a-good-fit',
      title: 'Why are you a good fit?',
    })

    const prompt = await readFile(join(dir, '8-Prompts/application/why-are-you-a-good-fit.md'), 'utf8')
    expect(prompt).toContain('{{POSTING_MARKDOWN}}')
    const catalog = await readFile(join(dir, '8-Prompts/application-questions.md'), 'utf8')
    expect(catalog).toContain('# Why are you a good fit?')
  })

  it('returns 503 when the API key is missing', async () => {
    await copyFixtures()
    delete process.env.ANTHROPIC_API_KEY
    setCompleteText(null)

    const response = await request(app).post('/api/application-questions').send({
      title: 'Describe a challenge you solved',
    })

    expect(response.status).toBe(503)
    expect(response.body).toEqual({ error: 'ANTHROPIC_API_KEY is not configured' })
  })
})

describe('POST /api/jobs/:id/application-answers', () => {
  it('fills the prompt and returns an answer', async () => {
    await copyFixtures()
    setCompleteText(async ({ user }) => {
      expect(user).toContain('Senior Engineer')
      expect(user).toContain('Acme')
      expect(user).toContain('Ship the product.')
      expect(user).toContain('TypeScript, Svelte, Python')
      expect(user).toContain('Makpar')
      return 'I like that Acme is shipping a product I can own.'
    })

    const response = await request(app).post('/api/jobs/1001/application-answers').send({
      questionId: 'what-interests-you-about-working-for-this-company',
    })

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ answer: 'I like that Acme is shipping a product I can own.' })
  })

  it('returns 400 when questionId is missing', async () => {
    await copyFixtures()

    const response = await request(app).post('/api/jobs/1001/application-answers').send({})

    expect(response.status).toBe(400)
    expect(response.body).toEqual({ error: 'questionId is required' })
  })
})
