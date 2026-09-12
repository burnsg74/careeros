export type JobBoardSummary = {
  id: string
  name: string
  url: string
  rank: string
}

export type JobBoardDetail = JobBoardSummary & {
  properties: Record<string, string>
  body: string
}
