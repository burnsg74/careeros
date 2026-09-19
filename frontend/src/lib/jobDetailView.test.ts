import { describe, expect, it } from 'vitest'
import {
  buildJobDetailView,
  compactLocation,
  csvOrDash,
  extractFitSummary,
  formatFitLabel,
  formatPostedAt,
  parseSkillsTable,
  splitFitAndPosting,
  toSecondPerson,
} from './jobDetailView'
import type { JobDetail } from './jobs'

const nOpsBody = `[Wellfound](https://wellfound.com/jobs/4365677-senior-full-stack-engineer)

## Fit Evaluation

**Strong pass 10/10**

Strong fit. nOps is a growth-stage FinOps platform seeking a senior full-stack engineer with deep AWS and Python expertise—all core strengths for Greg. The role emphasizes end-to-end ownership, mentoring, and infrastructure architecture, aligning perfectly with his 25+ years of experience and preference for small-team, high-agency environments. The only minor gap is Databricks (Tier 2, nice-to-have), which Greg can ramp quickly; the company explicitly values AI coding tools (Cursor, Claude) that Greg should highlight as part of his modern workflow. Compensation ($150k–$200k) and full-time US-remote status meet all hard criteria.

### Hard Screen

- Remote only - pass: "Remote: United States"

### Skills

| Skill | Requirement | Tier | Status | Note |
| --- | --- | --- | --- | --- |
| Python | required | 1 | HAVE |  |
| JavaScript | required | 1 | HAVE |  |
| Vercel deployment | nice | 3 | TOUCHED |  |
| Go | nice | 4 | DONT_HAVE |  |
| Mentoring | required | 1 | HAVE | soft |

### Company

- Size: 50-200 - Not disclosed

### Location

- Remote status: remote_us

### Compensation

- Role type: full_time
- Range: 150,000 - 200,000 USD/year
- Evidence: "$150k – $200k"

Automated Cloud Optimization Platform

[nOps](https://wellfound.com/company/nops)

## Locations

- Boston, Chicago, New York City, United States
- Remote: United States
`

function detail(overrides: Partial<JobDetail> = {}): JobDetail {
  return {
    id: '4365677',
    name: 'Senior Full Stack Engineer',
    company: 'nOps',
    compensation: '$150k – $200k',
    locations: 'Boston, Chicago, New York City, United States',
    fit_overall_match: '0.96',
    captured_at: '2026-09-17T13:26:09.717Z',
    status: 'new',
    url: 'https://wellfound.com/jobs/4365677-senior-full-stack-engineer',
    applied_at: '',
    deleted_reason: '',
    skills: 'Python, Javascript, AWS',
    properties: {
      url: 'https://wellfound.com/jobs/4365677-senior-full-stack-engineer',
      company_url: 'https://wellfound.com/company/nops',
      remote_locations: 'United States',
      posted_at: '2026-09-13T12:00:00.000Z',
      fit_score: '10',
      fit_recommendation: 'STRONG_PASS',
      fit_missing_skills: '',
    },
    body: nOpsBody,
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
    expect(csvOrDash(['Python', 'AWS'])).toBe('Python, AWS')
    expect(csvOrDash([])).toBe('—')
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

describe('compactLocation', () => {
  it('prefers the shorter remote locations string', () => {
    expect(compactLocation('Boston, Chicago, New York City, United States', 'United States')).toBe(
      'United States',
    )
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

describe('parseSkillsTable', () => {
  it('groups HAVE, TOUCHED, and DONT_HAVE from the fit table', () => {
    expect(parseSkillsTable(nOpsBody)).toEqual({
      have: ['Python', 'JavaScript', 'Mentoring'],
      familiar: ['Vercel deployment'],
      dontHave: ['Go'],
    })
  })

  it('returns null when there is no skills table', () => {
    expect(parseSkillsTable('Just a posting.')).toBeNull()
  })
})

describe('splitFitAndPosting', () => {
  it('drops the source link and Fit Evaluation through Compensation', () => {
    const { fitBlock, posting } = splitFitAndPosting(nOpsBody)
    expect(fitBlock).toContain('## Fit Evaluation')
    expect(fitBlock).toContain('### Compensation')
    expect(fitBlock).not.toContain('Automated Cloud Optimization Platform')
    expect(posting).toContain('Automated Cloud Optimization Platform')
    expect(posting).toContain('## Locations')
    expect(posting).not.toContain('[Wellfound]')
    expect(posting).not.toContain('## Fit Evaluation')
    expect(posting).not.toContain('required match 100%')
  })
})

describe('extractFitSummary', () => {
  it('skips the verdict and score breakdown', () => {
    const { fitBlock } = splitFitAndPosting(nOpsBody)
    const summary = extractFitSummary(fitBlock)
    expect(summary).toContain('Strong fit.')
    expect(summary).not.toContain('Greg')
    expect(summary).toContain('you can ramp quickly')
    expect(summary).not.toContain('required match')
    expect(summary).not.toContain('base 9')
  })
})

describe('buildJobDetailView', () => {
  it('builds a compact scan from a scored job note', () => {
    const view = buildJobDetailView(detail())
    expect(view.fitLabel).toBe('Strong pass 10/10')
    expect(view.haveCsv).toBe('Python, JavaScript, Mentoring')
    expect(view.familiarCsv).toBe('Vercel deployment')
    expect(view.dontHaveCsv).toBe('Go')
    expect(view.location).toBe('United States')
    expect(view.postedAt).toBe(formatPostedAt('2026-09-13T12:00:00.000Z'))
    expect(view.companyUrl).toBe('https://wellfound.com/company/nops')
    expect(view.postingUrl).toContain('wellfound.com/jobs/4365677')
    expect(view.summary).toContain('your 25+ years')
    expect(view.summary).not.toContain('Greg')
    expect(view.postingMarkdown).toContain('Automated Cloud Optimization Platform')
    expect(view.postingMarkdown).not.toContain('STRONG_PASS')
  })

  it('reads a skip evaluation written in the current YAML report format', () => {
    const view = buildJobDetailView(
      detail({
        fit_overall_match: '0.46',
        properties: {
          url: 'https://wellfound.com/jobs/2776321',
          company_url: 'https://wellfound.com/company/archesys',
          remote_locations: 'United States',
          fit_score: '0',
          fit_recommendation: 'SKIP',
          fit_missing_skills: '.NET, ASP.NET, Azure, Entity Framework',
        },
        body: `## Fit Evaluation

**Skip 0/10**

This role fails the hard screen on roleType due to the US citizenship requirement.

The model exited early on a clear hard-criterion failure, so the skills list covers the primary stack only.

### Skills

| Skill | Requirement | Tier | Status | Note |
| --- | --- | --- | --- | --- |
| .NET | required | 4 | DONT_HAVE |  |
| React | required | 1 | HAVE |  |
| Next.js | required | 3 | TOUCHED |  |

### Compensation

- Range: 85,000 - 105,000 USD/year

ArcheSys builds cloud solutions.
`,
      }),
    )
    expect(view.fitLabel).toBe('Skip 0/10')
    expect(view.haveCsv).toBe('React')
    expect(view.familiarCsv).toBe('Next.js')
    expect(view.dontHaveCsv).toBe('.NET')
    expect(view.summary).toContain('fails the hard screen')
    expect(view.summary).not.toContain('The model exited early')
    expect(view.postingMarkdown).toContain('ArcheSys builds cloud solutions.')
    expect(view.postingMarkdown).not.toContain('## Fit Evaluation')
  })

  it('falls back to listed skills when there is no fit table', () => {
    const view = buildJobDetailView(
      detail({
        body: 'Ship the product.',
        properties: {
          url: 'https://example.com/job',
          company_url: 'https://example.com/company',
          fit_missing_skills: 'Go, Kubernetes',
        },
        skills: 'TypeScript, Svelte',
      }),
    )
    expect(view.haveCsv).toBe('TypeScript, Svelte')
    expect(view.familiarCsv).toBe('—')
    expect(view.dontHaveCsv).toBe('Go, Kubernetes')
    expect(view.postingMarkdown).toBe('Ship the product.')
    expect(view.summary).toBe('')
  })
})
