export type JobSummary = {
  id: string
  name: string
  company: string
  compensation: string
  locations: string
  captured_at: string
}

export type JobDetail = JobSummary & {
  properties: Record<string, string>
  body: string
  obsidianUrl: string
}
