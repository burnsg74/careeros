import { EntityStore } from './entityStore.svelte'
import type { JobDetail, JobSummary } from './jobs'
import { fetchJob, fetchJobs, jobToSummary, patchJobStatus } from './jobs'
import type { JobStatusPatch } from './jobStatus'
import { saveNoteBody } from './notes'

class JobsStore extends EntityStore<JobSummary, JobDetail> {
  constructor() {
    super({
      key: 'careeros.jobs',
      fetchList: fetchJobs,
      fetchDetail: fetchJob,
      save: (id, body) => saveNoteBody<JobDetail>(`/api/jobs/${encodeURIComponent(id)}`, body),
      toSummary: jobToSummary,
      loadError: 'Could not load jobs',
      notFoundError: 'Job not found',
      detailError: 'Could not load job',
    })
  }

  async patchStatus(id: string, patch: JobStatusPatch): Promise<JobDetail> {
    const prev = this.snapshot()
    const current = this.getDetail(id)
    const listItem = this.list.find((job) => job.id === id)
    const appliedAt =
      patch.status === 'applied'
        ? listItem?.applied_at || new Date().toISOString()
        : (listItem?.applied_at ?? current?.applied_at ?? '')
    const deletedReason = patch.deleted_reason ?? listItem?.deleted_reason ?? current?.deleted_reason ?? ''

    if (current) {
      this.upsertDetail({
        ...current,
        status: patch.status,
        applied_at: appliedAt,
        deleted_reason: deletedReason,
        properties: { ...current.properties, status: patch.status },
      })
    } else if (listItem) {
      this.persist.set({
        list: this.list.map((job) =>
          job.id === id
            ? {
                ...job,
                status: patch.status,
                applied_at: appliedAt,
                deleted_reason: deletedReason,
              }
            : job,
        ),
        details: this.persist.value.details,
      })
    }

    try {
      const updated = await patchJobStatus(id, patch)
      this.upsertDetail(updated)
      return updated
    } catch (err) {
      this.restore(prev)
      throw err
    }
  }
}

export const jobsStore = new JobsStore()
