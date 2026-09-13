import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { resolveDataDir } from './dataDir.js'
import { parseNote, upsertFrontmatter } from './parseNote.js'
import { normalizeSkill, parseSkillList } from './skills.js'

const FOLDER = '3-Profile'
const FILENAME = 'Skill gaps.md'

export async function listDisqualifyingSkills(): Promise<string[]> {
  const raw = await readSkillGapsFile()
  if (!raw) {
    return []
  }
  return parseSkillList(parseNote(raw).properties.disqualifying ?? '')
}

export async function addDisqualifyingSkills(names: string[]): Promise<string[]> {
  const existing = await listDisqualifyingSkills()
  const seen = new Set(existing.map(normalizeSkill))
  const next = [...existing]
  for (const name of names) {
    const trimmed = name.trim()
    const key = normalizeSkill(trimmed)
    if (!key || seen.has(key)) {
      continue
    }
    seen.add(key)
    next.push(trimmed)
  }

  const dir = skillGapsDir()
  if (!dir) {
    return next
  }
  await mkdir(dir, { recursive: true })
  const path = join(dir, FILENAME)
  const raw =
    (await readSkillGapsFile()) ??
    `---
note_type: Skill gaps
disqualifying:
---

Skills you do not have. Inbox jobs that mention these are auto-deleted.
`
  await writeFile(path, upsertFrontmatter(raw, { disqualifying: next.join(', ') }), 'utf8')
  return next
}

async function readSkillGapsFile(): Promise<string | null> {
  const dir = skillGapsDir()
  if (!dir) {
    return null
  }
  try {
    return await readFile(join(dir, FILENAME), 'utf8')
  } catch {
    return null
  }
}

function skillGapsDir(): string | null {
  const { dataDir, exists } = resolveDataDir()
  if (!dataDir || !exists) {
    return null
  }
  return join(dataDir, FOLDER)
}
