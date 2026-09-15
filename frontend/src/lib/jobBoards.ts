import { fetchJson } from './http'

export type JobBoardSummary = {
  id: string
  name: string
  url: string
  rank: string
}

export type JobBoardDetail = JobBoardSummary & {
  properties: Record<string, string>
  body: string
  obsidianUrl: string
}

export function jobBoardToSummary(board: JobBoardDetail): JobBoardSummary {
  return {
    id: board.id,
    name: board.name,
    url: board.url,
    rank: board.rank,
  }
}

export async function fetchJobBoards(): Promise<JobBoardSummary[]> {
  return fetchJson<JobBoardSummary[]>('/api/job-boards')
}

export async function fetchJobBoard(id: string): Promise<JobBoardDetail> {
  return fetchJson<JobBoardDetail>(`/api/job-boards/${encodeURIComponent(id)}`)
}
