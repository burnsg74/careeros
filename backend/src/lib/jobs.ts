import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { resolveDataDir } from './dataDir.js'
import { parseNote } from './parseNote.js'

export type JobSummary = {
  id: string
  name: string
  company: string
  compensation: string
  locations: string
  captured_at: string
}

export type JobDetail = JobSummary & {
  properties: Record<string, string>
  body: string
}

type JobsOk<T> = { ok: true; value: T }
type JobsErr = { ok: false; error: string; status: number }
type JobsResult<T> = JobsOk<T> | JobsErr

function jobsDir(): JobsResult<string> {
  const { dataDir, exists } = resolveDataDir()
  if (!dataDir || !exists) {
    return { ok: false, error: 'Data directory is not configured', status: 500 }
  }
  return { ok: true, value: join(dataDir, '4-Jobs') }
}

function idFromFilename(filename: string): string {
  const match = filename.match(/\(([^)]+)\)\.md$/)
  return match?.[1] ?? filename.replace(/\.md$/, '')
}

function toSummary(filename: string, properties: Record<string, string>): JobSummary {
  return {
    id: properties.source_id || idFromFilename(filename),
    name: properties.name ?? '',
    company: properties.company ?? '',
    compensation: properties.compensation ?? '',
    locations: properties.locations ?? '',
    captured_at: properties.captured_at ?? '',
  }
}

function compareJobs(a: JobSummary, b: JobSummary): number {
  if (a.captured_at !== b.captured_at) {
    return b.captured_at.localeCompare(a.captured_at)
  }
  const company = a.company.localeCompare(b.company)
  if (company !== 0) {
    return company
  }
  return a.name.localeCompare(b.name)
}

async function readJobFile(
  dir: string,
  filename: string,
): Promise<{ filename: string; properties: Record<string, string>; body: string } | null> {
  try {
    const raw = await readFile(join(dir, filename), 'utf8')
    const parsed = parseNote(raw)
    return { filename, ...parsed }
  } catch {
    return null
  }
}

export async function listJobs(): Promise<JobsResult<JobSummary[]>> {
  const dir = jobsDir()
  if (!dir.ok) {
    return dir
  }

  let filenames: string[]
  try {
    filenames = (await readdir(dir.value)).filter((name) => name.endsWith('.md'))
  } catch {
    return { ok: true, value: [] }
  }

  const jobs: JobSummary[] = []
  for (const filename of filenames) {
    const note = await readJobFile(dir.value, filename)
    if (!note) {
      continue
    }
    jobs.push(toSummary(filename, note.properties))
  }

  jobs.sort(compareJobs)
  return { ok: true, value: jobs }
}

export async function getJob(id: string): Promise<JobsResult<JobDetail>> {
  const dir = jobsDir()
  if (!dir.ok) {
    return dir
  }

  let filenames: string[]
  try {
    filenames = (await readdir(dir.value)).filter((name) => name.endsWith('.md'))
  } catch {
    return { ok: false, error: 'Job not found', status: 404 }
  }

  for (const filename of filenames) {
    const note = await readJobFile(dir.value, filename)
    if (!note) {
      continue
    }
    const summary = toSummary(filename, note.properties)
    if (summary.id === id) {
      return {
        ok: true,
        value: {
          ...summary,
          properties: note.properties,
          body: note.body,
        },
      }
    }
  }

  return { ok: false, error: 'Job not found', status: 404 }
}
