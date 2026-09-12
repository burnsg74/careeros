import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { resolveDataDir } from './dataDir.js'
import { noteObsidianUrl } from './obsidian.js'
import { parseNote, replaceNoteBody } from './parseNote.js'

export type JobBoardSummary = {
  id: string
  name: string
  url: string
  rank: string
}

export type JobBoardDetail = JobBoardSummary & {
  properties: Record<string, string>
  body: string
  obsidianUrl: string
}

type JobBoardsOk<T> = { ok: true; value: T }
type JobBoardsErr = { ok: false; error: string; status: number }
type JobBoardsResult<T> = JobBoardsOk<T> | JobBoardsErr

function jobBoardsDir(): JobBoardsResult<string> {
  const { dataDir, exists } = resolveDataDir()
  if (!dataDir || !exists) {
    return { ok: false, error: 'Data directory is not configured', status: 500 }
  }
  return { ok: true, value: join(dataDir, '2-Job Boards') }
}

export function slugFromName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function idFromFilename(filename: string): string {
  return filename.replace(/\.md$/, '')
}

function toSummary(filename: string, properties: Record<string, string>): JobBoardSummary {
  const name = properties.name ?? ''
  return {
    id: slugFromName(name) || idFromFilename(filename),
    name,
    url: properties.url ?? '',
    rank: properties.rank ?? '',
  }
}

function rankValue(rank: string): number {
  const parsed = Number.parseInt(rank, 10)
  return Number.isFinite(parsed) ? parsed : Number.POSITIVE_INFINITY
}

function compareJobBoards(a: JobBoardSummary, b: JobBoardSummary): number {
  const rank = rankValue(a.rank) - rankValue(b.rank)
  if (rank !== 0) {
    return rank
  }
  return a.name.localeCompare(b.name)
}

async function readJobBoardFile(
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

export async function listJobBoards(): Promise<JobBoardsResult<JobBoardSummary[]>> {
  const dir = jobBoardsDir()
  if (!dir.ok) {
    return dir
  }

  let filenames: string[]
  try {
    filenames = (await readdir(dir.value)).filter((name) => name.endsWith('.md'))
  } catch {
    return { ok: true, value: [] }
  }

  const boards: JobBoardSummary[] = []
  for (const filename of filenames) {
    const note = await readJobBoardFile(dir.value, filename)
    if (!note) {
      continue
    }
    boards.push(toSummary(filename, note.properties))
  }

  boards.sort(compareJobBoards)
  return { ok: true, value: boards }
}

async function findJobBoard(id: string): Promise<
  JobBoardsResult<{
    dir: string
    filename: string
    summary: JobBoardSummary
    properties: Record<string, string>
    body: string
  }>
> {
  const dir = jobBoardsDir()
  if (!dir.ok) {
    return dir
  }

  let filenames: string[]
  try {
    filenames = (await readdir(dir.value)).filter((name) => name.endsWith('.md'))
  } catch {
    return { ok: false, error: 'Job board not found', status: 404 }
  }

  for (const filename of filenames) {
    const note = await readJobBoardFile(dir.value, filename)
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

  return { ok: false, error: 'Job board not found', status: 404 }
}

export async function getJobBoard(id: string): Promise<JobBoardsResult<JobBoardDetail>> {
  const found = await findJobBoard(id)
  if (!found.ok) {
    return found
  }

  return {
    ok: true,
    value: {
      ...found.value.summary,
      properties: found.value.properties,
      body: found.value.body,
      obsidianUrl: noteObsidianUrl('2-Job Boards', found.value.filename),
    },
  }
}

export async function updateJobBoardBody(
  id: string,
  body: string,
): Promise<JobBoardsResult<JobBoardDetail>> {
  const found = await findJobBoard(id)
  if (!found.ok) {
    return found
  }

  const path = join(found.value.dir, found.value.filename)
  try {
    const raw = await readFile(path, 'utf8')
    await writeFile(path, replaceNoteBody(raw, body), 'utf8')
  } catch {
    return { ok: false, error: 'Could not save job board', status: 500 }
  }

  return getJobBoard(id)
}
