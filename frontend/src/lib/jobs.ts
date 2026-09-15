import { fetchJson } from './http'
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

export function jobToSummary(job: JobDetail): JobSummary {
  return {
    id: job.id,
    name: job.name,
    company: job.company,
    compensation: job.compensation,
    locations: job.locations,
    captured_at: job.captured_at,
    status: job.status,
    url: job.url,
    applied_at: job.applied_at,
    deleted_reason: job.deleted_reason,
    skills: job.skills,
  }
}

export async function fetchJobs(): Promise<JobSummary[]> {
  return fetchJson<JobSummary[]>('/api/jobs')
}

export async function fetchJob(id: string): Promise<JobDetail> {
  return fetchJson<JobDetail>(`/api/jobs/${encodeURIComponent(id)}`)
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
