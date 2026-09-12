import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { resolveDataDir } from './dataDir.js'
import { parseNote } from './parseNote.js'

export type ContactSummary = {
  id: string
  name: string
  url: string
}

export type ContactDetail = ContactSummary & {
  properties: Record<string, string>
  body: string
}

type ContactsOk<T> = { ok: true; value: T }
type ContactsErr = { ok: false; error: string; status: number }
type ContactsResult<T> = ContactsOk<T> | ContactsErr

function contactsDir(): ContactsResult<string> {
  const { dataDir, exists } = resolveDataDir()
  if (!dataDir || !exists) {
    return { ok: false, error: 'Data directory is not configured', status: 500 }
  }
  return { ok: true, value: join(dataDir, '1-Contacts') }
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

function firstUrl(text: string): string {
  const match = text.match(/https?:\/\/[^\s)]+/i)
  return match?.[0] ?? ''
}

function toSummary(
  filename: string,
  properties: Record<string, string>,
  body: string,
): ContactSummary {
  const name = properties.name ?? ''
  return {
    id: slugFromName(name) || idFromFilename(filename),
    name,
    url: properties.url || firstUrl(body),
  }
}

function compareContacts(a: ContactSummary, b: ContactSummary): number {
  return a.name.localeCompare(b.name)
}

async function readContactFile(
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

export async function listContacts(): Promise<ContactsResult<ContactSummary[]>> {
  const dir = contactsDir()
  if (!dir.ok) {
    return dir
  }

  let filenames: string[]
  try {
    filenames = (await readdir(dir.value)).filter((name) => name.endsWith('.md'))
  } catch {
    return { ok: true, value: [] }
  }

  const contacts: ContactSummary[] = []
  for (const filename of filenames) {
    const note = await readContactFile(dir.value, filename)
    if (!note) {
      continue
    }
    contacts.push(toSummary(filename, note.properties, note.body))
  }

  contacts.sort(compareContacts)
  return { ok: true, value: contacts }
}

export async function getContact(id: string): Promise<ContactsResult<ContactDetail>> {
  const dir = contactsDir()
  if (!dir.ok) {
    return dir
  }

  let filenames: string[]
  try {
    filenames = (await readdir(dir.value)).filter((name) => name.endsWith('.md'))
  } catch {
    return { ok: false, error: 'Contact not found', status: 404 }
  }

  for (const filename of filenames) {
    const note = await readContactFile(dir.value, filename)
    if (!note) {
      continue
    }
    const summary = toSummary(filename, note.properties, note.body)
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

  return { ok: false, error: 'Contact not found', status: 404 }
}
