import type { JobSummary } from './jobs'

export type JobListFilters = {
  minMatchPct: number | null
  fullyRemote: boolean
  skills: string
  minCompensationK: number | null
}

export const DEFAULT_JOB_FILTERS: JobListFilters = {
  minMatchPct: null,
  fullyRemote: true,
  skills: '',
  minCompensationK: null,
}

export function parseMatchRatio(value: string): number | null {
  const raw = value.trim()
  if (!raw) {
    return null
  }
  const n = Number(raw)
  if (!Number.isFinite(n)) {
    return null
  }
  return n >= 0 && n <= 1 ? n : n / 100
}

export function isFullyRemote(remote: string | undefined): boolean {
  return (remote ?? '').trim().toLowerCase() === 'true'
}

export function parseAnnualCompensation(value: string): number | null {
  const matches = value.matchAll(/\$?\s*([\d,]+(?:\.\d+)?)\s*(k)?/gi)
  let max = 0
  for (const match of matches) {
    const amount = Number((match[1] ?? '').replaceAll(',', ''))
    if (!Number.isFinite(amount) || amount <= 0) {
      continue
    }
    const annual = match[2] ? amount * 1000 : amount
    if (annual > max) {
      max = annual
    }
  }
  return max > 0 ? max : null
}

export function jobMatchesFilters(job: JobSummary, filters: JobListFilters): boolean {
  if (filters.fullyRemote && !isFullyRemote(job.remote)) {
    return false
  }

  if (filters.minMatchPct != null) {
    const ratio = parseMatchRatio(job.fit_overall_match ?? '')
    if (ratio == null || ratio * 100 < filters.minMatchPct) {
      return false
    }
  }

  const needle = filters.skills.trim().toLowerCase()
  if (needle) {
    const haystack = [job.skills, job.fit_have_skills, job.fit_familiar_skills]
      .map((value) => value ?? '')
      .join(', ')
      .toLowerCase()
    if (!haystack.includes(needle)) {
      return false
    }
  }

  if (filters.minCompensationK != null) {
    const annual = parseAnnualCompensation(job.compensation ?? '')
    if (annual == null || annual < filters.minCompensationK * 1000) {
      return false
    }
  }

  return true
}
