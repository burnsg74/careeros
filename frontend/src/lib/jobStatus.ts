export const JOB_STATUSES = ['new', 'applied', 'deleted', 'interview', 'rejected', 'no_response'] as const

export type JobStatus = (typeof JOB_STATUSES)[number]

export const DELETE_REASONS = [
  'not_interested',
  'wrong_location',
  'compensation',
  'seniority',
  'company',
  'already_applied',
  'missing_skills',
  'other',
] as const

export type DeleteReason = (typeof DELETE_REASONS)[number]

export type JobStageFilter = 'inbox' | JobStatus | 'all'

export const STAGE_TABS: { id: JobStageFilter; label: string }[] = [
  { id: 'inbox', label: 'Inbox' },
  { id: 'applied', label: 'Applied' },
  { id: 'interview', label: 'Interview' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'no_response', label: 'No response' },
  { id: 'deleted', label: 'Deleted' },
  { id: 'all', label: 'All' },
]

export const STATUS_LABELS: Record<JobStatus, string> = {
  new: 'New',
  applied: 'Applied',
  deleted: 'Deleted',
  interview: 'Interview',
  rejected: 'Rejected',
  no_response: 'No response',
}

export const DELETE_REASON_LABELS: Record<DeleteReason, string> = {
  not_interested: 'Not interested',
  wrong_location: 'Wrong location',
  compensation: 'Compensation',
  seniority: 'Seniority',
  company: 'Company',
  already_applied: 'Already applied',
  missing_skills: 'Missing skills',
  other: 'Other',
}

export const NO_REPLY_MS = 14 * 24 * 60 * 60 * 1000

export type JobStatusPatch = {
  status: JobStatus
  deleted_reason?: DeleteReason
  deleted_reason_other?: string
  missing_skills?: string[]
}

export function jobMatchesStage(status: JobStatus, stage: JobStageFilter): boolean {
  if (stage === 'all') {
    return true
  }
  if (stage === 'inbox') {
    return status === 'new'
  }
  return status === stage
}

export function isStaleApplied(status: JobStatus, appliedAt: string, now = Date.now()): boolean {
  if (status !== 'applied' || !appliedAt) {
    return false
  }
  const applied = Date.parse(appliedAt)
  return Number.isFinite(applied) && now - applied >= NO_REPLY_MS
}

export function parseSkillList(value: string): string[] {
  const seen = new Set<string>()
  const skills: string[] = []
  for (const part of value.split(/[,;]/)) {
    const name = part.trim()
    if (!name) {
      continue
    }
    const key = name.toLowerCase()
    if (seen.has(key)) {
      continue
    }
    seen.add(key)
    skills.push(name)
  }
  return skills
}

export function nextJobId(ids: string[], currentId: string): string | null {
  const index = ids.indexOf(currentId)
  if (index < 0) {
    return ids[0] ?? null
  }
  return ids[index + 1] ?? null
}
