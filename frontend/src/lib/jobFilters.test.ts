import { describe, expect, it } from 'vitest'
import {
  DEFAULT_JOB_FILTERS,
  isFullyRemote,
  jobMatchesFilters,
  parseAnnualCompensation,
  parseMatchRatio,
} from './jobFilters'
import type { JobSummary } from './jobs'

function job(overrides: Partial<JobSummary> = {}): JobSummary {
  return {
    id: '1',
    name: 'Engineer',
    company: 'Acme',
    compensation: '$150k – $180k',
    locations: 'Remote',
    remote: 'true',
    posted_at: '',
    company_url: '',
    fit_overall_match: '0.96',
    fit_recommendation: 'STRONG_PASS',
    fit_score: '10',
    fit_summary: '',
    fit_have_skills: 'TypeScript, Svelte',
    fit_familiar_skills: 'GraphQL',
    fit_dont_have_skills: 'Go',
    captured_at: '',
    status: 'new',
    url: '',
    applied_at: '',
    deleted_reason: '',
    skills: 'TypeScript, Svelte',
    ...overrides,
  }
}

describe('parseMatchRatio', () => {
  it('reads 0–1 ratios and legacy percents', () => {
    expect(parseMatchRatio('0.96')).toBe(0.96)
    expect(parseMatchRatio('96')).toBe(0.96)
    expect(parseMatchRatio('')).toBeNull()
  })
})

describe('parseAnnualCompensation', () => {
  it('uses the high end of a k-range', () => {
    expect(parseAnnualCompensation('$150k – $180k')).toBe(180_000)
    expect(parseAnnualCompensation('$200k')).toBe(200_000)
    expect(parseAnnualCompensation('not listed')).toBeNull()
  })
})

describe('jobMatchesFilters', () => {
  it('keeps only fully remote jobs when that filter is on', () => {
    expect(isFullyRemote('true')).toBe(true)
    expect(jobMatchesFilters(job({ remote: 'false' }), DEFAULT_JOB_FILTERS)).toBe(false)
    expect(jobMatchesFilters(job({ remote: 'true' }), DEFAULT_JOB_FILTERS)).toBe(true)
    expect(
      jobMatchesFilters(job({ remote: 'false' }), { ...DEFAULT_JOB_FILTERS, fullyRemote: false }),
    ).toBe(true)
  })

  it('hides jobs below the min match or with no score', () => {
    const filters = { ...DEFAULT_JOB_FILTERS, minMatchPct: 90 }
    expect(jobMatchesFilters(job(), filters)).toBe(true)
    expect(jobMatchesFilters(job({ fit_overall_match: '0.80' }), filters)).toBe(false)
    expect(jobMatchesFilters(job({ fit_overall_match: '' }), filters)).toBe(false)
  })

  it('matches skills against board and have/familiar lists', () => {
    const filters = { ...DEFAULT_JOB_FILTERS, skills: 'graphql' }
    expect(jobMatchesFilters(job(), filters)).toBe(true)
    expect(jobMatchesFilters(job({ skills: 'Go', fit_have_skills: '', fit_familiar_skills: '' }), filters)).toBe(
      false,
    )
  })

  it('drops jobs below min compensation or with unparsable pay', () => {
    const filters = { ...DEFAULT_JOB_FILTERS, minCompensationK: 190 }
    expect(jobMatchesFilters(job(), filters)).toBe(false)
    expect(jobMatchesFilters(job({ compensation: '$200k' }), filters)).toBe(true)
    expect(jobMatchesFilters(job({ compensation: 'Competitive' }), filters)).toBe(false)
  })
})
