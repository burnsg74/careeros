import { describe, expect, it } from 'vitest'
import {
  jobMentionsSkill,
  matchingDisqualifyingSkills,
  parseSkillList,
  serializeSkillList,
} from '../src/lib/skills.js'

describe('jobMentionsSkill', () => {
  it('matches a required phrase in the job body', () => {
    expect(
      jobMentionsSkill(
        'TypeScript, React',
        'Significant Ruby on Rails experience.',
        'Ruby on Rails',
      ),
    ).toBe(true)
  })

  it('does not match a short token inside another word', () => {
    expect(jobMentionsSkill('JavaScript', '', 'Java')).toBe(false)
  })
})

describe('matchingDisqualifyingSkills', () => {
  it('returns listed skills that appear on the job', () => {
    expect(
      matchingDisqualifyingSkills('Ruby on Rails, Python', '', ['Ruby on Rails', 'Kotlin']),
    ).toEqual(['Ruby on Rails'])
  })
})

describe('skill list serialization', () => {
  it('round-trips a comma-separated skill list', () => {
    expect(parseSkillList(serializeSkillList(['Ruby on Rails', 'Docker']))).toEqual([
      'Ruby on Rails',
      'Docker',
    ])
  })
})
