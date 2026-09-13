export function parseSkillList(value: string): string[] {
  const seen = new Set<string>()
  const skills: string[] = []
  for (const part of value.split(/[,;]/)) {
    const name = part.trim()
    if (!name) {
      continue
    }
    const key = normalizeSkill(name)
    if (seen.has(key)) {
      continue
    }
    seen.add(key)
    skills.push(name)
  }
  return skills
}

export function normalizeSkill(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function serializeSkillList(skills: string[]): string {
  return parseSkillList(skills.join(', ')).join(', ')
}

export function jobMentionsSkill(skills: string, body: string, skill: string): boolean {
  const needle = normalizeSkill(skill)
  if (!needle) {
    return false
  }
  const haystack = `${skills}\n${body}`
  const pattern = new RegExp(
    `(^|[^a-z0-9+])${escapeRegExp(needle).replace(/ /g, '\\s+')}([^a-z0-9+]|$)`,
    'i',
  )
  return pattern.test(haystack)
}

export function matchingDisqualifyingSkills(
  skills: string,
  body: string,
  disqualifying: string[],
): string[] {
  const matched: string[] = []
  const seen = new Set<string>()
  for (const skill of disqualifying) {
    const key = normalizeSkill(skill)
    if (!key || seen.has(key) || !jobMentionsSkill(skills, body, skill)) {
      continue
    }
    seen.add(key)
    matched.push(skill)
  }
  return matched
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
