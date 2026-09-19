import { EntityStore } from './entityStore.svelte'
import type { JobDetail, JobSummary } from './jobs'
import { fetchJob, fetchJobs, isJobDetail, jobToSummary, patchJobStatus } from './jobs'
import type { JobStatusPatch } from './jobStatus'
import { saveNoteBody } from './notes'

type JobBaseline = {
  listItem: JobSummary | undefined
  detail: JobDetail | undefined
}

class JobsStore extends EntityStore<JobSummary, JobDetail> {
  private statusGens: Record<string, number> = {}
  private statusInflight: Record<string, number> = {}
  private statusBaselines: Record<string, JobBaseline> = {}

  constructor() {
    super({
      key: 'careeros.jobs',
      fetchList: fetchJobs,
      fetchDetail: fetchJob,
      save: (id, body) => saveNoteBody<JobDetail>(`/api/jobs/${encodeURIComponent(id)}`, body),
      toSummary: jobToSummary,
      isDetail: isJobDetail,
      loadError: 'Could not load jobs',
      notFoundError: 'Job not found',
      detailError: 'Could not load job',
    })
  }

  override reset() {
    super.reset()
    this.statusGens = {}
    this.statusInflight = {}
    this.statusBaselines = {}
  }

  async patchStatus(id: string, patch: JobStatusPatch): Promise<JobDetail> {
    const gen = (this.statusGens[id] ?? 0) + 1
    this.statusGens[id] = gen
    if (!this.statusInflight[id]) {
      this.statusBaselines[id] = this.snapshotJob(id)
      this.statusInflight[id] = 0
    }
    this.statusInflight[id] += 1

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
      this.statusBaselines[id] = {
        listItem: jobToSummary(updated),
        detail: updated,
      }
      if (this.statusGens[id] === gen || this.statusInflight[id] === 1) {
        this.upsertDetail(updated)
      }
      return updated
    } catch (err) {
      if (this.statusGens[id] === gen) {
        this.restoreJob(id, this.statusBaselines[id])
      }
      throw err
    } finally {
      this.statusInflight[id] -= 1
      if (this.statusInflight[id] <= 0) {
        delete this.statusInflight[id]
        delete this.statusBaselines[id]
      }
    }
  }

  private snapshotJob(id: string): JobBaseline {
    const listItem = this.list.find((job) => job.id === id)
    const detail = this.getDetail(id)
    return {
      listItem: listItem ? structuredClone(listItem) : undefined,
      detail: detail ? structuredClone(detail) : undefined,
    }
  }

  private restoreJob(id: string, baseline: JobBaseline | undefined) {
    if (!baseline) {
      return
    }
    const { list, details } = this.persist.value
    const nextList = baseline.listItem
      ? list.some((job) => job.id === id)
        ? list.map((job) => (job.id === id ? baseline.listItem! : job))
        : [...list, baseline.listItem]
      : list.filter((job) => job.id !== id)
    const nextDetails = { ...details }
    if (baseline.detail) {
      nextDetails[id] = baseline.detail
    } else {
      delete nextDetails[id]
    }
    this.persist.set({ list: nextList, details: nextDetails })
  }
}

export const jobsStore = new JobsStore()
