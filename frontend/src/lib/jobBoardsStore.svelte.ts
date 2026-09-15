import { EntityStore } from './entityStore.svelte'
import type { JobBoardDetail, JobBoardSummary } from './jobBoards'
import { fetchJobBoard, fetchJobBoards, jobBoardToSummary } from './jobBoards'
import { saveNoteBody } from './notes'

class JobBoardsStore extends EntityStore<JobBoardSummary, JobBoardDetail> {
  constructor() {
    super({
      key: 'careeros.jobBoards',
      fetchList: fetchJobBoards,
      fetchDetail: fetchJobBoard,
      save: (id, body) => saveNoteBody<JobBoardDetail>(`/api/job-boards/${encodeURIComponent(id)}`, body),
      toSummary: jobBoardToSummary,
      loadError: 'Could not load job boards',
      notFoundError: 'Job board not found',
      detailError: 'Could not load job board',
    })
  }
}

export const jobBoardsStore = new JobBoardsStore()
