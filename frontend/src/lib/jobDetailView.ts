import type { JobDetail } from './jobs'

export type JobDetailView = {
  fitLabel: string | null
  haveCsv: string
  familiarCsv: string
  dontHaveCsv: string
  summary: string
  postingMarkdown: string
  companyUrl: string
  postingUrl: string
  postedAt: string
}

const EMPTY = '—'

const FIT_LABELS: Record<string, string> = {
  STRONG_PASS: 'Strong pass',
  PASS: 'Pass',
  HOLD: 'Hold',
  SKIP: 'Skip',
}

const RELATIVE_TIME = new Intl.RelativeTimeFormat('en', { numeric: 'always' })
const POSTED_DATE = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
})
const RELATIVE_UNITS: { unit: Intl.RelativeTimeFormatUnit; seconds: number }[] = [
  { unit: 'year', seconds: 365 * 24 * 60 * 60 },
  { unit: 'month', seconds: 30 * 24 * 60 * 60 },
  { unit: 'day', seconds: 24 * 60 * 60 },
  { unit: 'hour', seconds: 60 * 60 },
  { unit: 'minute', seconds: 60 },
]

export function formatPostedAt(iso: string, now = Date.now()): string {
  const then = Date.parse(iso)
  if (!Number.isFinite(then)) {
    return ''
  }

  const date = POSTED_DATE.format(then)
  const deltaSeconds = Math.round((then - now) / 1000)
  const abs = Math.abs(deltaSeconds)
  if (abs < 45) {
    return `${date} (just now)`
  }

  for (const { unit, seconds } of RELATIVE_UNITS) {
    if (abs >= seconds || unit === 'minute') {
      return `${date} (${RELATIVE_TIME.format(Math.round(deltaSeconds / seconds), unit)})`
    }
  }

  return date
}

export function csvOrDash(value: string): string {
  const items = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
  return items.length > 0 ? items.join(', ') : EMPTY
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

export function buildJobDetailView(detail: JobDetail): JobDetailView {
  return {
    fitLabel: formatFitLabel(detail.fit_recommendation ?? '', detail.fit_score ?? ''),
    haveCsv: csvOrDash(detail.fit_have_skills ?? ''),
    familiarCsv: csvOrDash(detail.fit_familiar_skills ?? ''),
    dontHaveCsv: csvOrDash(detail.fit_dont_have_skills ?? ''),
    summary: toSecondPerson(detail.fit_summary ?? ''),
    postingMarkdown: detail.body,
    companyUrl: detail.company_url ?? '',
    postingUrl: detail.url ?? '',
    postedAt: formatPostedAt(detail.posted_at ?? ''),
  }
}
