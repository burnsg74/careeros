import { parse } from 'yaml'

export function parseNote(raw: string): {
  properties: Record<string, string>
  body: string
} {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) {
    return { properties: {}, body: raw }
  }

  const parsed: unknown = parse(match[1] ?? '')
  const properties: Record<string, string> = {}

  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      properties[key] = stringifyProperty(value)
    }
  }

  return { properties, body: (match[2] ?? '').replace(/^\r?\n/, '').replace(/\n+$/, '') }
}

export function replaceNoteBody(raw: string, body: string): string {
  const normalized = body.replace(/\r\n/g, '\n').replace(/\n+$/, '')
  const match = raw.replace(/\r\n/g, '\n').match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!match) {
    return normalized ? `${normalized}\n` : ''
  }

  const frontmatter = match[1] ?? ''
  if (!normalized) {
    return `---\n${frontmatter}\n---\n`
  }
  return `---\n${frontmatter}\n---\n\n${normalized}\n`
}

export function upsertFrontmatter(raw: string, updates: Record<string, string>): string {
  const normalized = raw.replace(/\r\n/g, '\n')
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  const body = match ? (match[2] ?? '').replace(/^\n/, '').replace(/\n+$/, '') : normalized.replace(/\n+$/, '')
  let frontmatter = match ? (match[1] ?? '') : ''

  for (const [key, value] of Object.entries(updates)) {
    const line = `${key}: ${yamlScalar(value)}`
    const pattern = new RegExp(`^${escapeRegExp(key)}:.*$`, 'm')
    if (pattern.test(frontmatter)) {
      frontmatter = frontmatter.replace(pattern, line)
    } else {
      frontmatter = `${frontmatter.replace(/\n+$/, '')}${frontmatter ? '\n' : ''}${line}`
    }
  }

  if (!body) {
    return `---\n${frontmatter}\n---\n`
  }
  return `---\n${frontmatter}\n---\n\n${body}\n`
}

function yamlScalar(value: string): string {
  if (value === '') {
    return ''
  }
  if (/[\n\r]|: |^[&*!|>'"%@`[{]/.test(value) || value !== value.trim()) {
    return JSON.stringify(value)
  }
  return value
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function stringifyProperty(value: unknown): string {
  if (value == null) {
    return ''
  }
  if (typeof value === 'string') {
    return value
  }
  if (typeof value === 'boolean' || typeof value === 'number') {
    return String(value)
  }
  return JSON.stringify(value)
}
