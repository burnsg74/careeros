import type { JobStatus, JobStatusPatch } from './jobStatus'

export type JobSummary = {
  id: string
  name: string
  company: string
  compensation: string
  locations: string
  captured_at: string
  status: JobStatus
  url: string
  applied_at: string
  deleted_reason: string
  skills: string
}

export type JobDetail = JobSummary & {
  properties: Record<string, string>
  body: string
  obsidianUrl: string
}

export async function patchJobStatus(id: string, patch: JobStatusPatch): Promise<JobDetail> {
  const response = await fetch(`/api/jobs/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  })
  if (!response.ok) {
    throw new Error('Could not update status')
  }
  return (await response.json()) as JobDetail
}
