import { describe, expect, it } from 'vitest'
import {
  buildJobDetailView,
  csvOrDash,
  formatFitLabel,
  formatPostedAt,
  toSecondPerson,
} from './jobDetailView'
import type { JobDetail } from './jobs'

function detail(overrides: Partial<JobDetail> = {}): JobDetail {
  return {
    id: '4365677',
    name: 'Senior Full Stack Engineer',
    company: 'nOps',
    compensation: '$150k – $200k',
    locations: 'Boston, Chicago, New York City, United States',
    remote: 'true',
    posted_at: '2026-09-13T12:00:00.000Z',
    company_url: 'https://wellfound.com/company/nops',
    fit_overall_match: '0.96',
    fit_recommendation: 'STRONG_PASS',
    fit_score: '10',
    fit_summary:
      'Strong fit. nOps is a growth-stage FinOps platform seeking a senior full-stack engineer with deep AWS and Python expertise—all core strengths for Greg. The role emphasizes end-to-end ownership, mentoring, and infrastructure architecture, aligning perfectly with his 25+ years of experience and preference for small-team, high-agency environments.',
    fit_have_skills: 'Python, JavaScript, Mentoring',
    fit_familiar_skills: 'Vercel deployment',
    fit_dont_have_skills: 'Go',
    captured_at: '2026-09-17T13:26:09.717Z',
    status: 'new',
    url: 'https://wellfound.com/jobs/4365677-senior-full-stack-engineer',
    applied_at: '',
    deleted_reason: '',
    skills: 'Python, Javascript, AWS',
    properties: {
      url: 'https://wellfound.com/jobs/4365677-senior-full-stack-engineer',
      company_url: 'https://wellfound.com/company/nops',
      posted_at: '2026-09-13T12:00:00.000Z',
      fit_score: '10',
      fit_recommendation: 'STRONG_PASS',
    },
    body: 'Automated Cloud Optimization Platform\n\n## Locations\n\n- Remote: United States',
    obsidianUrl: 'obsidian://open?vault=CareerOS&file=4-Jobs%2FnOps',
    ...overrides,
  }
}

describe('formatFitLabel', () => {
  it('formats STRONG_PASS as Strong pass with a score', () => {
    expect(formatFitLabel('STRONG_PASS', '10')).toBe('Strong pass 10/10')
  })

  it('returns null when both fields are empty', () => {
    expect(formatFitLabel('', '')).toBeNull()
  })
})

describe('csvOrDash', () => {
  it('joins names or uses an em dash', () => {
    expect(csvOrDash('Python, AWS')).toBe('Python, AWS')
    expect(csvOrDash('')).toBe('—')
  })
})

describe('formatPostedAt', () => {
  const now = Date.parse('2026-09-18T12:00:00.000Z')

  it('formats a calendar date with a relative age', () => {
    expect(formatPostedAt('2026-09-13T12:00:00.000Z', now)).toBe('Sep 13, 2026 (5 days ago)')
  })

  it('returns empty when posted_at is missing', () => {
    expect(formatPostedAt('', now)).toBe('')
  })
})

describe('toSecondPerson', () => {
  it('rewrites Greg-facing copy as you', () => {
    expect(
      toSecondPerson(
        'all core strengths for Greg. which Greg can ramp quickly; tools that Greg should highlight as part of his modern workflow.',
      ),
    ).toBe(
      'all core strengths. which you can ramp quickly; tools that you should highlight as part of your modern workflow.',
    )
  })
})

describe('buildJobDetailView', () => {
  it('builds a compact scan from typed job fields', () => {
    const view = buildJobDetailView(detail())
    expect(view.fitLabel).toBe('Strong pass 10/10')
    expect(view.haveCsv).toBe('Python, JavaScript, Mentoring')
    expect(view.familiarCsv).toBe('Vercel deployment')
    expect(view.dontHaveCsv).toBe('Go')
    expect(view.postedAt).toBe(formatPostedAt('2026-09-13T12:00:00.000Z'))
    expect(view.companyUrl).toBe('https://wellfound.com/company/nops')
    expect(view.postingUrl).toContain('wellfound.com/jobs/4365677')
    expect(view.summary).toContain('your 25+ years')
    expect(view.summary).not.toContain('Greg')
    expect(view.postingMarkdown).toContain('Automated Cloud Optimization Platform')
    expect(view.postingMarkdown).not.toContain('Fit Evaluation')
  })

  it('uses empty skill groups and posting body when fit fields are blank', () => {
    const view = buildJobDetailView(
      detail({
        fit_recommendation: '',
        fit_score: '',
        fit_summary: '',
        fit_have_skills: '',
        fit_familiar_skills: '',
        fit_dont_have_skills: '',
        body: 'Ship the product.',
      }),
    )
    expect(view.fitLabel).toBeNull()
    expect(view.haveCsv).toBe('—')
    expect(view.familiarCsv).toBe('—')
    expect(view.dontHaveCsv).toBe('—')
    expect(view.postingMarkdown).toBe('Ship the product.')
    expect(view.summary).toBe('')
  })
})
