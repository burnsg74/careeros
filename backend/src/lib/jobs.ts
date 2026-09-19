import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { resolveDataDir } from './dataDir.js'
import {
  normalizeJobStatus,
  type JobStatus,
  type JobStatusPatch,
} from './jobStatus.js'
import { addDisqualifyingSkills, listDisqualifyingSkills } from './skillGaps.js'
import {
  matchingDisqualifyingSkills,
  serializeSkillList,
} from './skills.js'
import { noteObsidianUrl } from './obsidian.js'
import { parseNote, replaceNoteBody, upsertFrontmatter } from './parseNote.js'

export type JobSummary = {
  id: string
  name: string
  company: string
  compensation: string
  locations: string
  remote: string
  posted_at: string
  company_url: string
  fit_overall_match: string
  fit_recommendation: string
  fit_score: string
  fit_summary: string
  fit_have_skills: string
  fit_familiar_skills: string
  fit_dont_have_skills: string
  captured_at: string
  status: JobStatus
  url: string
  applied_at: string
  deleted_reason: string
  skills: string
}

export type JobDetail = JobSummary & {
  properties: Record<string, string>
  body: string
  obsidianUrl: string
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
    remote: properties.remote ?? '',
    posted_at: properties.posted_at ?? '',
    company_url: properties.company_url ?? '',
    fit_overall_match: properties.fit_overall_match ?? '',
    fit_recommendation: properties.fit_recommendation ?? '',
    fit_score: properties.fit_score ?? '',
    fit_summary: properties.fit_summary ?? '',
    fit_have_skills: properties.fit_have_skills ?? '',
    fit_familiar_skills: properties.fit_familiar_skills ?? '',
    fit_dont_have_skills: properties.fit_dont_have_skills ?? '',
    captured_at: properties.captured_at ?? '',
    status: normalizeJobStatus(properties.status),
    url: properties.url ?? '',
    applied_at: properties.applied_at ?? '',
    deleted_reason: properties.deleted_reason ?? '',
    skills: properties.skills ?? '',
  }
}

function toDetail(filename: string, properties: Record<string, string>, body: string): JobDetail {
  return {
    ...toSummary(filename, properties),
    properties,
    body,
    obsidianUrl: noteObsidianUrl('4-Jobs', filename),
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

export async function listJobs(): Promise<JobsResult<JobDetail[]>> {
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

  const jobs: JobDetail[] = []
  for (const filename of filenames) {
    const note = await readJobFile(dir.value, filename)
    if (!note) {
      continue
    }
    jobs.push(toDetail(filename, note.properties, note.body))
  }

  jobs.sort(compareJobs)
  return { ok: true, value: jobs }
}

async function findJob(id: string): Promise<
  JobsResult<{
    dir: string
    filename: string
    summary: JobSummary
    properties: Record<string, string>
    body: string
  }>
> {
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
          dir: dir.value,
          filename,
          summary,
          properties: note.properties,
          body: note.body,
        },
      }
    }
  }

  return { ok: false, error: 'Job not found', status: 404 }
}

export async function getJob(id: string): Promise<JobsResult<JobDetail>> {
  const found = await findJob(id)
  if (!found.ok) {
    return found
  }

  return {
    ok: true,
    value: toDetail(found.value.filename, found.value.properties, found.value.body),
  }
}

export async function updateJobBody(id: string, body: string): Promise<JobsResult<JobDetail>> {
  const found = await findJob(id)
  if (!found.ok) {
    return found
  }

  const path = join(found.value.dir, found.value.filename)
  try {
    const raw = await readFile(path, 'utf8')
    await writeFile(path, replaceNoteBody(raw, body), 'utf8')
  } catch {
    return { ok: false, error: 'Could not save job', status: 500 }
  }

  return getJob(id)
}

export async function updateJobStatus(id: string, patch: JobStatusPatch): Promise<JobsResult<JobDetail>> {
  const found = await findJob(id)
  if (!found.ok) {
    return found
  }

  const now = new Date().toISOString()
  const updates: Record<string, string> = {
    status: patch.status,
    status_updated_at: now,
  }

  if (patch.status === 'applied' && !found.value.properties.applied_at) {
    updates.applied_at = now
  }

  if (patch.status === 'deleted') {
    updates.deleted_reason = patch.deleted_reason ?? ''
    updates.deleted_reason_other = patch.deleted_reason === 'other' ? (patch.deleted_reason_other ?? '') : ''
    updates.missing_skills =
      patch.deleted_reason === 'missing_skills' ? serializeSkillList(patch.missing_skills ?? []) : ''
    updates.deleted_auto = ''
  } else {
    updates.deleted_reason = ''
    updates.deleted_reason_other = ''
    updates.missing_skills = ''
    updates.deleted_auto = ''
  }

  const path = join(found.value.dir, found.value.filename)
  try {
    const raw = await readFile(path, 'utf8')
    await writeFile(path, upsertFrontmatter(raw, updates), 'utf8')
  } catch {
    return { ok: false, error: 'Could not save job', status: 500 }
  }

  if (patch.status === 'deleted' && patch.deleted_reason === 'missing_skills') {
    const names = patch.missing_skills ?? []
    if (names.length > 0) {
      await addDisqualifyingSkills(names)
    }
  }

  return getJob(id)
}

export async function screenInboxJobs(): Promise<JobsResult<{ screened: number }>> {
  const dir = jobsDir()
  if (!dir.ok) {
    return dir
  }

  const disqualifying = await listDisqualifyingSkills()
  if (disqualifying.length === 0) {
    return { ok: true, value: { screened: 0 } }
  }

  const listed = await listJobs()
  if (!listed.ok) {
    return listed
  }

  let screened = 0
  const now = new Date().toISOString()
  for (const summary of listed.value) {
    if (summary.status !== 'new') {
      continue
    }
    const found = await findJob(summary.id)
    if (!found.ok) {
      continue
    }
    const matched = matchingDisqualifyingSkills(
      found.value.properties.skills ?? '',
      found.value.body,
      disqualifying,
    )
    if (matched.length === 0) {
      continue
    }
    const path = join(found.value.dir, found.value.filename)
    try {
      const raw = await readFile(path, 'utf8')
      await writeFile(
        path,
        upsertFrontmatter(raw, {
          status: 'deleted',
          status_updated_at: now,
          deleted_reason: 'missing_skills',
          deleted_reason_other: '',
          missing_skills: serializeSkillList(matched),
          deleted_auto: 'true',
        }),
        'utf8',
      )
      screened += 1
    } catch {
      continue
    }
  }

  return { ok: true, value: { screened } }
}
