import type { JobDetail } from './jobs'

export type JobSkillGroups = {
  have: string[]
  familiar: string[]
  dontHave: string[]
}

export type JobDetailView = {
  fitLabel: string | null
  haveCsv: string
  familiarCsv: string
  dontHaveCsv: string
  summary: string
  postingMarkdown: string
  location: string
  companyUrl: string
  postingUrl: string
}

const EMPTY = '—'

const FIT_LABELS: Record<string, string> = {
  STRONG_PASS: 'Strong pass',
  PASS: 'Pass',
  HOLD: 'Hold',
  SKIP: 'Skip',
}

const SOURCE_LINK = /^\s*\[[^\]]+\]\(https?:\/\/[^)]+\)\s*/i
const FIT_HEADING = /^## Fit Evaluation\s*$/m
const COMPENSATION_HEADING = /^### Compensation\s*$/m
const VERDICT_LINE = /^\*\*[^*]+(?:\s+[—-]\s+)?\d+\/10\*\*/
const BREAKDOWN_LINE = /^(base \d+ from |The model exited early)/i

export function csvOrDash(items: string[]): string {
  return items.length > 0 ? items.join(', ') : EMPTY
}

export function parseCsvList(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export function formatFitLabel(recommendation: string, score: string): string | null {
  const rec = recommendation.trim()
  const sc = score.trim()
  if (!rec && !sc) {
    return null
  }
  const label = rec ? (FIT_LABELS[rec] ?? rec.replaceAll('_', ' ')) : ''
  if (label && sc) {
    return `${label} ${sc}/10`
  }
  if (label) {
    return label
  }
  return `${sc}/10`
}

export function compactLocation(locations: string, remoteLocations: string): string {
  const listed = locations.trim()
  const remote = remoteLocations.trim()
  if (!listed) {
    return remote
  }
  if (!remote) {
    return listed
  }
  return remote.length <= listed.length ? remote : listed
}

export function toSecondPerson(text: string): string {
  return text
    .replace(/\bfor Greg\b/gi, '')
    .replace(/\bGreg's\b/g, 'your')
    .replace(/\bGreg should\b/g, 'you should')
    .replace(/\bGreg can\b/g, 'you can')
    .replace(/\bGreg\b/g, 'you')
    .replace(/\bhis 25\+/g, 'your 25+')
    .replace(/\bhis modern\b/g, 'your modern')
    .replace(/\bhis preference\b/g, 'your preference')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([.,;:!?])/g, '$1')
    .replace(/—+/g, '—')
    .trim()
}

export function parseSkillsTable(body: string): JobSkillGroups | null {
  const heading = body.search(/^### Skills\s*$/m)
  if (heading < 0) {
    return null
  }

  const groups: JobSkillGroups = { have: [], familiar: [], dontHave: [] }
  let seenSeparator = false
  let foundRow = false

  for (const line of body.slice(heading).split('\n').slice(1)) {
    if (!line.startsWith('|')) {
      if (foundRow || seenSeparator) {
        break
      }
      continue
    }
    if (line.includes('---')) {
      seenSeparator = true
      continue
    }
    if (!seenSeparator) {
      continue
    }
    const cells = splitTableRow(line)
    const name = cells[0] ?? ''
    const status = cells[3] ?? ''
    if (!name) {
      continue
    }
    foundRow = true
    if (status === 'HAVE') {
      groups.have.push(name)
    } else if (status === 'TOUCHED') {
      groups.familiar.push(name)
    } else if (status === 'DONT_HAVE') {
      groups.dontHave.push(name)
    }
  }

  return foundRow ? groups : null
}

export function extractFitSummary(fitBlock: string): string {
  const lines = fitBlock.split('\n')
  const collected: string[] = []
  let started = false

  for (const raw of lines) {
    const line = raw.trim()
    if (!started) {
      if (!line || line.startsWith('#') || VERDICT_LINE.test(line) || BREAKDOWN_LINE.test(line)) {
        continue
      }
      started = true
    }
    if (!line || line.startsWith('#') || line.startsWith('|') || line.startsWith('- ')) {
      break
    }
    collected.push(line)
  }

  return toSecondPerson(collected.join(' '))
}

export function splitFitAndPosting(body: string): { fitBlock: string; posting: string } {
  const fitStart = body.search(FIT_HEADING)
  if (fitStart < 0) {
    return { fitBlock: '', posting: stripLeadingSourceLink(body).trim() }
  }

  const before = stripLeadingSourceLink(body.slice(0, fitStart))
  const fitAndAfter = body.slice(fitStart)
  const compensation = fitAndAfter.search(COMPENSATION_HEADING)
  let postingStartInFit: number

  if (compensation < 0) {
    const nextH2 = fitAndAfter.slice(1).search(/^## /m)
    postingStartInFit = nextH2 < 0 ? fitAndAfter.length : nextH2 + 1
  } else {
    postingStartInFit = skipCompensationSection(fitAndAfter, compensation)
  }

  const fitBlock = fitAndAfter.slice(0, postingStartInFit).trim()
  const posting = [before.trim(), fitAndAfter.slice(postingStartInFit).trim()].filter(Boolean).join('\n\n')
  return { fitBlock, posting }
}

export function buildJobDetailView(detail: JobDetail): JobDetailView {
  const { fitBlock, posting } = splitFitAndPosting(detail.body)
  const fromTable = parseSkillsTable(fitBlock) ?? parseSkillsTable(detail.body)
  const skills = fromTable ?? {
    have: parseCsvList(detail.skills),
    familiar: [],
    dontHave: parseCsvList(detail.properties.fit_missing_skills ?? ''),
  }

  return {
    fitLabel: formatFitLabel(detail.properties.fit_recommendation ?? '', detail.properties.fit_score ?? ''),
    haveCsv: csvOrDash(skills.have),
    familiarCsv: csvOrDash(skills.familiar),
    dontHaveCsv: csvOrDash(skills.dontHave),
    summary: extractFitSummary(fitBlock),
    postingMarkdown: posting,
    location: compactLocation(detail.locations, detail.properties.remote_locations ?? ''),
    companyUrl: detail.properties.company_url ?? '',
    postingUrl: detail.properties.url || detail.url,
  }
}

function stripLeadingSourceLink(text: string): string {
  return text.replace(SOURCE_LINK, '')
}

function splitTableRow(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '')
  return trimmed.split(/(?<!\\)\|/).map((cell) => cell.replace(/\\\|/g, '|').trim())
}

function skipCompensationSection(fitAndAfter: string, compensationStart: number): number {
  const afterHeading = fitAndAfter.slice(compensationStart)
  const headingLine = afterHeading.indexOf('\n')
  const start = headingLine < 0 ? afterHeading.length : headingLine + 1
  const rest = afterHeading.slice(start)
  const lines = rest.split('\n')
  let i = 0
  while (i < lines.length) {
    const line = lines[i] ?? ''
    const trimmed = line.trim()
    if (trimmed === '' || trimmed.startsWith('- ')) {
      i += 1
      continue
    }
    break
  }
  return compensationStart + start + lines.slice(0, i).join('\n').length + (i > 0 ? 1 : 0)
}
