import { parseSkillList } from './skills.js'

export const JOB_STATUSES = ['new', 'saved', 'applied', 'deleted', 'interview', 'rejected', 'no_response'] as const

export type JobStatus = (typeof JOB_STATUSES)[number]

export const DELETE_REASONS = [
  'not_interested',
  'duplicate',
  'wrong_location',
  'compensation',
  'role_mismatch',
  'seniority',
  'company',
  'already_applied',
  'missing_skills',
  'other',
] as const

export type DeleteReason = (typeof DELETE_REASONS)[number]

export type JobStatusPatch = {
  status: JobStatus
  deleted_reason?: string
  deleted_reason_other?: string
  missing_skills?: string[]
}

export function isJobStatus(value: string): value is JobStatus {
  return (JOB_STATUSES as readonly string[]).includes(value)
}

export function normalizeJobStatus(value: string | undefined): JobStatus {
  return value && isJobStatus(value) ? value : 'new'
}

export function isDeleteReason(value: string): value is DeleteReason {
  return (DELETE_REASONS as readonly string[]).includes(value)
}

export function parseJobStatusPatch(value: unknown): { ok: true; patch: JobStatusPatch } | { ok: false; error: string } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ok: false, error: 'status is required' }
  }

  const body = value as {
    status?: unknown
    deleted_reason?: unknown
    deleted_reason_other?: unknown
    missing_skills?: unknown
  }

  if (typeof body.status !== 'string' || !isJobStatus(body.status)) {
    return { ok: false, error: 'status is invalid' }
  }

  const deleted_reason = typeof body.deleted_reason === 'string' ? body.deleted_reason : undefined
  const deleted_reason_other =
    typeof body.deleted_reason_other === 'string' ? body.deleted_reason_other.trim() : undefined
  const missing_skills = parseMissingSkillPatch(body.missing_skills)

  if (missing_skills === undefined && body.missing_skills !== undefined) {
    return { ok: false, error: 'missing_skills is invalid' }
  }

  if (body.status === 'deleted') {
    if (!deleted_reason || !isDeleteReason(deleted_reason)) {
      return { ok: false, error: 'deleted_reason is required' }
    }
    if (deleted_reason === 'other' && !deleted_reason_other) {
      return { ok: false, error: 'deleted_reason_other is required' }
    }
    if (deleted_reason === 'missing_skills' && (!missing_skills || missing_skills.length === 0)) {
      return { ok: false, error: 'missing_skills is required' }
    }
  }

  return {
    ok: true,
    patch: {
      status: body.status,
      deleted_reason,
      deleted_reason_other,
      missing_skills,
    },
  }
}

function parseMissingSkillPatch(value: unknown): string[] | undefined {
  if (value === undefined) {
    return undefined
  }
  if (!Array.isArray(value)) {
    return undefined
  }
  const skills: string[] = []
  for (const item of value) {
    if (typeof item === 'string' && item.trim()) {
      skills.push(item.trim())
      continue
    }
    return undefined
  }
  return parseSkillList(skills.join(', '))
}
