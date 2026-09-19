import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import Anthropic from '@anthropic-ai/sdk'
import { resolveDataDir } from './dataDir.js'
import { getJob } from './jobs.js'

export const APPLICATION_MODEL = 'claude-haiku-4-5'

const REQUEST_TIMEOUT_MS = 120_000
const MAX_TOKENS = 2048
const USER_TURN_HEADING = /^# USER TURN TEMPLATE[ \t]*$/m
const CATALOG_FILE = '8-Prompts/application-questions.md'
const PROMPT_DIR = '8-Prompts/application'
const META_PROMPT_FILE = '8-Prompts/create-application-question-prompt.md'
const PROFILE_FILES = [
  '5-Notes/1-Job Hunting/1 - About Me.md',
  '5-Notes/1-Job Hunting/2 - Work History.md',
  '5-Notes/1-Job Hunting/4 - Action Plan.md',
]

export type ApplicationQuestion = {
  id: string
  title: string
}

type Ok<T> = { ok: true; value: T }
type Err = { ok: false; error: string; status: number }
export type ApplicationResult<T> = Ok<T> | Err

export type CompleteText = (args: {
  system: string
  user: string
  temperature?: number
}) => Promise<string>

export class MissingApiKeyError extends Error {
  constructor() {
    super('ANTHROPIC_API_KEY is not configured')
    this.name = 'MissingApiKeyError'
  }
}

function dataDirOrError(): ApplicationResult<string> {
  const { dataDir, exists } = resolveDataDir()
  if (!dataDir || !exists) {
    return { ok: false, error: 'Data directory is not configured', status: 500 }
  }
  return { ok: true, value: dataDir }
}

export function slugifyQuestion(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
  return slug
}

export function parseCatalog(markdown: string): ApplicationQuestion[] {
  const questions: ApplicationQuestion[] = []
  const seen = new Set<string>()
  for (const part of markdown.split(/^# /m)) {
    const trimmed = part.trim()
    if (!trimmed) {
      continue
    }
    const newline = trimmed.indexOf('\n')
    const title = (newline === -1 ? trimmed : trimmed.slice(0, newline)).trim()
    if (!title) {
      continue
    }
    const id = slugifyQuestion(title)
    if (!id || seen.has(id)) {
      continue
    }
    seen.add(id)
    questions.push({ id, title })
  }
  return questions
}

export function splitPrompt(markdown: string): { system: string; userTemplate: string } | null {
  const match = markdown.match(USER_TURN_HEADING)
  if (!match || match.index === undefined) {
    return null
  }
  const system = markdown.slice(0, match.index).trim()
  const userTemplate = markdown.slice(match.index + match[0].length).trim()
  if (!system || !userTemplate) {
    return null
  }
  return { system, userTemplate }
}

export function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{([A-Z_]+)\}\}/g, (whole, key: string) => vars[key] ?? whole)
}

export function unwrapGeneratedPrompt(text: string): string {
  const trimmed = text.trim()
  const fenced = trimmed.match(/^```(?:markdown|md)?\r?\n([\s\S]*?)\r?\n```$/)
  return fenced ? fenced[1].trim() : trimmed
}

function responseText(message: Anthropic.Message): string {
  return message.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('')
}

export async function defaultCompleteText({
  system,
  user,
  temperature = 0,
}: {
  system: string
  user: string
  temperature?: number
}): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new MissingApiKeyError()
  }
  const client = new Anthropic({ apiKey, maxRetries: 3, timeout: REQUEST_TIMEOUT_MS })
  const message = await client.messages.create({
    model: APPLICATION_MODEL,
    temperature,
    max_tokens: MAX_TOKENS,
    system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: user }],
  })
  return responseText(message).trim()
}

let completeTextImpl: CompleteText = defaultCompleteText

export function setCompleteText(fn: CompleteText | null) {
  completeTextImpl = fn ?? defaultCompleteText
}

async function runComplete(args: {
  system: string
  user: string
  temperature?: number
}): Promise<ApplicationResult<string>> {
  try {
    const text = await completeTextImpl(args)
    if (!text.trim()) {
      return { ok: false, error: 'Empty model response', status: 502 }
    }
    return { ok: true, value: text }
  } catch (err) {
    if (err instanceof MissingApiKeyError) {
      return { ok: false, error: err.message, status: 503 }
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Model request failed',
      status: 502,
    }
  }
}

async function readOptional(path: string): Promise<string | null> {
  try {
    return await readFile(path, 'utf8')
  } catch {
    return null
  }
}

async function loadGregProfile(dataDir: string): Promise<string> {
  const chunks: string[] = []
  for (const relative of PROFILE_FILES) {
    const text = await readOptional(join(dataDir, relative))
    if (text?.trim()) {
      chunks.push(text.trim())
    }
  }
  return chunks.join('\n\n')
}

async function loadCatalog(dataDir: string): Promise<ApplicationQuestion[]> {
  const raw = await readOptional(join(dataDir, CATALOG_FILE))
  if (!raw) {
    return []
  }
  return parseCatalog(raw)
}

function promptPath(dataDir: string, id: string): string {
  return join(dataDir, PROMPT_DIR, `${id}.md`)
}

export async function listApplicationQuestions(): Promise<ApplicationResult<ApplicationQuestion[]>> {
  const dir = dataDirOrError()
  if (!dir.ok) {
    return dir
  }
  return { ok: true, value: await loadCatalog(dir.value) }
}

export async function createApplicationQuestion(titleRaw: string): Promise<ApplicationResult<ApplicationQuestion>> {
  const title = titleRaw.trim()
  if (!title) {
    return { ok: false, error: 'title is required', status: 400 }
  }
  const dir = dataDirOrError()
  if (!dir.ok) {
    return dir
  }
  const dataDir = dir.value
  const id = slugifyQuestion(title)
  if (!id) {
    return { ok: false, error: 'title is required', status: 400 }
  }

  const existing = (await loadCatalog(dataDir)).find((question) => question.id === id)
  if (existing) {
    return { ok: true, value: existing }
  }

  const metaRaw = await readOptional(join(dataDir, META_PROMPT_FILE))
  if (!metaRaw) {
    return { ok: false, error: 'Create-question prompt is missing', status: 500 }
  }
  const meta = splitPrompt(metaRaw)
  if (!meta) {
    return { ok: false, error: 'Create-question prompt is invalid', status: 500 }
  }

  const generated = await runComplete({
    system: meta.system,
    user: fillTemplate(meta.userTemplate, { QUESTION_TITLE: title }),
    temperature: 0,
  })
  if (!generated.ok) {
    return generated
  }

  const promptMarkdown = unwrapGeneratedPrompt(generated.value)
  if (!splitPrompt(promptMarkdown)) {
    return { ok: false, error: 'Generated prompt was invalid', status: 502 }
  }

  try {
    await mkdir(join(dataDir, PROMPT_DIR), { recursive: true })
    await writeFile(promptPath(dataDir, id), `${promptMarkdown.trim()}\n`, 'utf8')
    const catalogPath = join(dataDir, CATALOG_FILE)
    const catalog = (await readOptional(catalogPath)) ?? ''
    const nextCatalog = catalog.trim() ? `${catalog.trim()}\n\n# ${title}\n` : `# ${title}\n`
    await mkdir(join(dataDir, '8-Prompts'), { recursive: true })
    await writeFile(catalogPath, nextCatalog, 'utf8')
  } catch {
    return { ok: false, error: 'Could not save application question', status: 500 }
  }

  return { ok: true, value: { id, title } }
}

export async function generateApplicationAnswer(
  jobId: string,
  questionId: string,
): Promise<ApplicationResult<{ answer: string }>> {
  const id = questionId.trim()
  if (!id) {
    return { ok: false, error: 'questionId is required', status: 400 }
  }
  const dir = dataDirOrError()
  if (!dir.ok) {
    return dir
  }
  const job = await getJob(jobId)
  if (!job.ok) {
    return job
  }
  const question = (await loadCatalog(dir.value)).find((item) => item.id === id)
  if (!question) {
    return { ok: false, error: 'Application question not found', status: 404 }
  }
  const promptRaw = await readOptional(promptPath(dir.value, question.id))
  if (!promptRaw) {
    return { ok: false, error: 'Application question prompt is missing', status: 404 }
  }
  const prompt = splitPrompt(promptRaw)
  if (!prompt) {
    return { ok: false, error: 'Application question prompt is invalid', status: 500 }
  }

  const user = fillTemplate(prompt.userTemplate, {
    JOB_TITLE: job.value.name,
    COMPANY_NAME: job.value.company,
    POSTING_MARKDOWN: job.value.body,
    GREG_PROFILE: await loadGregProfile(dir.value),
  })

  const completed = await runComplete({
    system: prompt.system,
    user,
    temperature: 0.4,
  })
  if (!completed.ok) {
    return completed
  }
  return { ok: true, value: { answer: completed.value } }
}
