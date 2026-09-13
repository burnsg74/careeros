<script lang="ts">
  import { onMount } from 'svelte'
  import { marked } from 'marked'
  import DeleteJobModal from './DeleteJobModal.svelte'
  import EditorControls from './EditorControls.svelte'
  import MarkdownEditor from './MarkdownEditor.svelte'
  import type { JobDetail, JobSummary } from './jobs'
  import { patchJobStatus } from './jobs'
  import {
    isStaleApplied,
    jobMatchesStage,
    nextJobId,
    STAGE_TABS,
    STATUS_LABELS,
    type DeleteReason,
    type JobStageFilter,
    type JobStatus,
  } from './jobStatus'
  import { saveNoteBody } from './notes'
  import { jobDetailPath, navigate, parseJobId } from './router'

  let { path }: { path: string } = $props()

  let jobs = $state<JobSummary[]>([])
  let detail = $state<JobDetail | null>(null)
  let listError = $state<string | null>(null)
  let detailError = $state<string | null>(null)
  let listLoading = $state(true)
  let detailLoading = $state(false)
  let lastJobId = $state<string | null>(null)
  let editing = $state(false)
  let saving = $state(false)
  let saveError = $state<string | null>(null)
  let draft = $state('')
  let stage = $state<JobStageFilter>('inbox')
  let statusSaving = $state(false)
  let statusError = $state<string | null>(null)
  let deleteOpen = $state(false)
  let deleteJobId = $state<string | null>(null)
  let deleteFromDetail = $state(false)

  const jobId = $derived(parseJobId(path))
  const isDetail = $derived(jobId !== null)
  const filteredJobs = $derived(jobs.filter((job) => jobMatchesStage(job.status, stage)))
  const currentIndex = $derived(jobId ? filteredJobs.findIndex((job) => job.id === jobId) : -1)
  const previousJob = $derived(currentIndex > 0 ? filteredJobs[currentIndex - 1] : null)
  const nextJob = $derived(
    currentIndex >= 0 && currentIndex < filteredJobs.length - 1 ? filteredJobs[currentIndex + 1] : null,
  )
  const detailTargetId = $derived(lastJobId ?? filteredJobs[0]?.id ?? jobs[0]?.id ?? null)
  const newCount = $derived(jobs.filter((job) => job.status === 'new').length)
  const screenedCount = $derived(jobs.length - newCount)
  const progressPercent = $derived(jobs.length === 0 ? 0 : Math.round((screenedCount / jobs.length) * 100))
  const remainingLabel = $derived(
    newCount === 1 ? '1 new remaining' : `${newCount} new remaining`,
  )
  const deleteListedSkills = $derived(
    jobs.find((job) => job.id === deleteJobId)?.skills ?? detail?.skills ?? '',
  )

  onMount(() => {
    void loadList()
  })

  $effect(() => {
    const id = jobId
    if (!id) {
      detail = null
      detailError = null
      detailLoading = false
      editing = false
      saveError = null
      statusError = null
      return
    }
    editing = false
    saveError = null
    statusError = null
    lastJobId = id
    void loadDetail(id)
  })

  async function loadList(silent = false) {
    if (!silent) {
      listLoading = true
    }
    listError = null
    try {
      const response = await fetch('/api/jobs')
      if (!response.ok) {
        throw new Error('Could not load jobs')
      }
      jobs = (await response.json()) as JobSummary[]
    } catch {
      listError = 'Could not load jobs'
      jobs = []
    } finally {
      listLoading = false
    }
  }

  async function loadDetail(id: string) {
    detailLoading = true
    detailError = null
    try {
      const response = await fetch(`/api/jobs/${encodeURIComponent(id)}`)
      if (response.status === 404) {
        detail = null
        detailError = 'Job not found'
        return
      }
      if (!response.ok) {
        throw new Error('Could not load job')
      }
      detail = (await response.json()) as JobDetail
    } catch {
      detail = null
      detailError = 'Could not load job'
    } finally {
      detailLoading = false
    }
  }

  function openList() {
    navigate('/jobs')
  }

  function openDetailView() {
    if (!detailTargetId) {
      return
    }
    navigate(jobDetailPath(detailTargetId))
  }

  function openJob(id: string) {
    lastJobId = id
    navigate(jobDetailPath(id))
  }

  function selectStage(next: JobStageFilter) {
    stage = next
    if (!isDetail) {
      return
    }
    const first = jobs.find((job) => jobMatchesStage(job.status, next))
    if (first) {
      openJob(first.id)
      return
    }
    navigate('/jobs')
  }

  function propertyLabel(key: string): string {
    return key
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')
  }

  function isUrl(value: string): boolean {
    return value.startsWith('http://') || value.startsWith('https://')
  }

  function startEdit() {
    if (!detail) {
      return
    }
    draft = detail.body
    editing = true
    saveError = null
  }

  function cancelEdit() {
    editing = false
    saveError = null
    draft = detail?.body ?? ''
  }

  async function saveEdit() {
    if (!jobId) {
      return
    }
    saving = true
    saveError = null
    try {
      detail = await saveNoteBody<JobDetail>(`/api/jobs/${encodeURIComponent(jobId)}`, draft)
      editing = false
      void loadList()
    } catch {
      saveError = 'Could not save job'
    } finally {
      saving = false
    }
  }

  function listingUrl(job: JobSummary | JobDetail): string {
    if ('properties' in job && job.properties.url) {
      return job.properties.url
    }
    return job.url
  }

  function openListing(job: JobSummary | JobDetail) {
    const url = listingUrl(job)
    if (url) {
      window.open(url, '_blank', 'noopener')
    }
  }

  function stageIds(): string[] {
    return jobs.filter((job) => jobMatchesStage(job.status, stage)).map((job) => job.id)
  }

  function advanceAfter(id: string, fromDetail: boolean, orderedIds = stageIds()) {
    if (!fromDetail) {
      return
    }
    const nextId = nextJobId(orderedIds, id)
    if (nextId) {
      openJob(nextId)
    } else {
      navigate('/jobs')
    }
  }

  async function applyJob(job: JobSummary | JobDetail, fromDetail: boolean) {
    const orderedIds = stageIds()
    statusSaving = true
    statusError = null
    try {
      const updated = await patchJobStatus(job.id, { status: 'applied' })
      openListing(updated)
      jobs = jobs.map((item) => (item.id === updated.id ? { ...item, ...updated } : item))
      if (detail?.id === updated.id) {
        detail = updated
      }
      advanceAfter(job.id, fromDetail, orderedIds)
    } catch {
      statusError = 'Could not update status'
    } finally {
      statusSaving = false
    }
  }

  function startDelete(id: string, fromDetail: boolean) {
    deleteJobId = id
    deleteFromDetail = fromDetail
    deleteOpen = true
    statusError = null
  }

  function cancelDelete() {
    if (statusSaving) {
      return
    }
    deleteOpen = false
    deleteJobId = null
  }

  async function confirmDelete(reason: DeleteReason, other: string, missingSkills: string[]) {
    if (!deleteJobId) {
      return
    }
    const id = deleteJobId
    const fromDetail = deleteFromDetail
    const orderedIds = stageIds()
    statusSaving = true
    statusError = null
    try {
      const updated = await patchJobStatus(id, {
        status: 'deleted',
        deleted_reason: reason,
        deleted_reason_other: other,
        missing_skills: missingSkills.length > 0 ? missingSkills : undefined,
      })
      jobs = jobs.map((item) => (item.id === updated.id ? { ...item, ...updated } : item))
      if (detail?.id === updated.id) {
        detail = updated
      }
      deleteOpen = false
      deleteJobId = null
      await loadList(true)
      advanceAfter(id, fromDetail, orderedIds)
    } catch {
      statusError = 'Could not update status'
    } finally {
      statusSaving = false
    }
  }

  async function setStatus(id: string, status: JobStatus) {
    if (status === 'deleted') {
      startDelete(id, isDetail && jobId === id)
      return
    }
    const orderedIds = stageIds()
    statusSaving = true
    statusError = null
    try {
      const updated = await patchJobStatus(id, { status })
      jobs = jobs.map((item) => (item.id === updated.id ? { ...item, ...updated } : item))
      if (detail?.id === updated.id) {
        detail = updated
      }
      if (isDetail && jobId === id && !jobMatchesStage(updated.status, stage) && stage !== 'all') {
        advanceAfter(id, true, orderedIds)
      }
    } catch {
      statusError = 'Could not update status'
    } finally {
      statusSaving = false
    }
  }

  function onStatusSelect(event: Event, id: string) {
    const select = event.currentTarget as HTMLSelectElement
    const next = select.value as JobStatus
    const current = jobs.find((job) => job.id === id)?.status
    if (next === current) {
      return
    }
    void setStatus(id, next)
  }

  function applyCurrent() {
    if (detail) {
      void applyJob(detail, true)
    }
  }

  function deleteCurrent() {
    if (detail) {
      startDelete(detail.id, true)
    }
  }

  function onCurrentStatusSelect(event: Event) {
    if (detail) {
      onStatusSelect(event, detail.id)
    }
  }

  function markCurrentNoReply() {
    if (detail) {
      void setStatus(detail.id, 'no_response')
    }
  }
</script>

<div class="page">
  <header class="toolbar">
    <div class="toolbar-start">
      <div class="views" role="toolbar" aria-label="Jobs views">
        <button
          type="button"
          class="icon-btn"
          class:active={!isDetail}
          aria-label="List view"
          aria-pressed={!isDetail}
          onclick={openList}
        >
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path
              d="M3 5h14M3 10h14M3 15h14"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
            />
          </svg>
        </button>
        <button
          type="button"
          class="icon-btn"
          class:active={isDetail}
          aria-label="Detail view"
          aria-pressed={isDetail}
          disabled={!detailTargetId}
          onclick={openDetailView}
        >
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <rect
              x="4"
              y="3"
              width="12"
              height="14"
              rx="1.5"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
            />
            <path d="M7 7h6M7 10h6M7 13h4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
          </svg>
        </button>
      </div>
      <div class="stages" role="tablist" aria-label="Job stages">
        {#each STAGE_TABS as tab (tab.id)}
          <button
            type="button"
            role="tab"
            class="stage-btn"
            class:active={stage === tab.id}
            aria-selected={stage === tab.id}
            onclick={() => selectStage(tab.id)}
          >
            {tab.label}
          </button>
        {/each}
      </div>
    </div>
    <div class="toolbar-end">
      {#if isDetail && detail && !detailLoading && !detailError}
        <EditorControls
          {editing}
          {saving}
          obsidianUrl={detail.obsidianUrl}
          onedit={startEdit}
          oncancel={cancelEdit}
          onsave={() => void saveEdit()}
        />
      {/if}
    {#if isDetail}
      <div class="nav-jobs" role="group" aria-label="Job navigation">
        <button
          type="button"
          class="icon-btn"
          aria-label="Previous job"
          disabled={!previousJob}
          onclick={() => previousJob && openJob(previousJob.id)}
        >
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path
              d="M12.5 4.5 7 10l5.5 5.5"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
        <button
          type="button"
          class="icon-btn"
          aria-label="Next job"
          disabled={!nextJob}
          onclick={() => nextJob && openJob(nextJob.id)}
        >
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path
              d="M7.5 4.5 13 10l-5.5 5.5"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </div>
    {/if}
    </div>
  </header>

  <div class="progress-row">
    <div
      class="progress"
      role="progressbar"
      aria-label="Inbox progress"
      aria-valuemin="0"
      aria-valuemax="100"
      aria-valuenow={progressPercent}
    >
      <div class="progress-fill" style={`width: ${progressPercent}%`}></div>
    </div>
    <p class="progress-label">{remainingLabel}</p>
  </div>

  {#if statusError && !deleteOpen}
    <p class="banner error">{statusError}</p>
  {/if}

  {#if !isDetail}
    <section class="list-pane">
      {#if listLoading}
        <p class="status">Loading jobs…</p>
      {:else if listError}
        <p class="status error">{listError}</p>
      {:else if stage === 'inbox' && newCount === 0}
        <p class="status">Inbox zero. Every captured job is applied or deleted.</p>
      {:else if filteredJobs.length === 0}
        <p class="status">No jobs in this stage.</p>
      {:else}
        <ul class="job-list">
          {#each filteredJobs as job (job.id)}
            <li>
              <div class="job-row">
                <button type="button" class="job-main" onclick={() => openJob(job.id)}>
                  <span class="company">{job.company}</span>
                  <span class="role">{job.name}</span>
                  <span class="meta">{job.compensation}</span>
                  <span class="meta">{job.locations}</span>
                </button>
                <div class="row-actions">
                  {#if stage === 'all'}
                    <span class="stage-chip">{STATUS_LABELS[job.status]}</span>
                  {/if}
                  {#if job.status === 'new'}
                    <button type="button" class="text-btn" disabled={statusSaving} onclick={() => void applyJob(job, false)}>
                      Apply
                    </button>
                    <button type="button" class="text-btn" disabled={statusSaving} onclick={() => startDelete(job.id, false)}>
                      Delete
                    </button>
                  {:else if job.status === 'applied' && isStaleApplied(job.status, job.applied_at)}
                    <button
                      type="button"
                      class="text-btn"
                      disabled={statusSaving}
                      onclick={() => void setStatus(job.id, 'no_response')}
                    >
                      No reply?
                    </button>
                  {:else}
                    <label class="status-select">
                      <span class="sr-only">Status</span>
                      <select value={job.status} disabled={statusSaving} onchange={(event) => onStatusSelect(event, job.id)}>
                        {#each Object.entries(STATUS_LABELS) as [value, label] (value)}
                          <option {value}>{label}</option>
                        {/each}
                      </select>
                    </label>
                  {/if}
                </div>
              </div>
            </li>
          {/each}
        </ul>
      {/if}
    </section>
  {:else if detailLoading}
    <p class="status">Loading job…</p>
  {:else if detailError}
    <p class="status error">{detailError}</p>
  {:else if detail}
    <div class="detail">
      <article class="content">
        <h1>{detail.name}</h1>
        <p class="subtitle">{detail.company}</p>
        {#if saveError}
          <p class="save-error">{saveError}</p>
        {/if}
        <div class="detail-actions">
          {#if detail.status === 'new'}
            <button type="button" class="text-btn primary" disabled={statusSaving} onclick={applyCurrent}>
              Apply
            </button>
            <button type="button" class="text-btn" disabled={statusSaving} onclick={deleteCurrent}>
              Delete
            </button>
          {:else}
            <label class="status-select">
              Status
              <select
                value={detail.status}
                disabled={statusSaving}
                onchange={onCurrentStatusSelect}
              >
                {#each Object.entries(STATUS_LABELS) as [value, label] (value)}
                  <option {value}>{label}</option>
                {/each}
              </select>
            </label>
            {#if isStaleApplied(detail.status, detail.applied_at)}
              <button
                type="button"
                class="text-btn"
                disabled={statusSaving}
                onclick={markCurrentNoReply}
              >
                No reply?
              </button>
            {/if}
          {/if}
        </div>
        {#if editing}
          <MarkdownEditor bind:draft onsave={() => void saveEdit()} />
        {:else}
          {@html marked.parse(detail.body, { async: false })}
        {/if}
      </article>
      <aside class="properties">
        <h2>Properties</h2>
        <dl>
          {#each Object.entries(detail.properties) as [key, value] (key)}
            <div class="prop">
              <dt>{propertyLabel(key)}</dt>
              <dd>
                {#if isUrl(value)}
                  <a href={value} target="_blank" rel="noreferrer">{value}</a>
                {:else}
                  {value || '—'}
                {/if}
              </dd>
            </div>
          {/each}
        </dl>
      </aside>
    </div>
  {/if}
</div>

<DeleteJobModal
  open={deleteOpen}
  saving={statusSaving && deleteOpen}
  error={deleteOpen ? statusError : null}
  listedSkills={deleteListedSkills}
  oncancel={cancelDelete}
  onconfirm={(reason, other, missingSkills) => void confirmDelete(reason, other, missingSkills)}
/>

<style>
  .page {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 100svh;
  }

  .toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 20px;
    border-bottom: 1px solid var(--border);
    background: var(--bg);
    position: sticky;
    top: 0;
    z-index: 1;
    flex-wrap: wrap;
  }

  .toolbar-start,
  .views,
  .nav-jobs,
  .toolbar-end,
  .stages {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .toolbar-start {
    gap: 16px;
    flex-wrap: wrap;
  }

  .toolbar-end {
    gap: 12px;
  }

  .stages {
    flex-wrap: wrap;
  }

  .icon-btn,
  .text-btn,
  .stage-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 36px;
    padding: 0 12px;
    border: 1px solid transparent;
    border-radius: 8px;
    background: transparent;
    color: var(--text);
    cursor: pointer;
    font: inherit;
    font-size: 0.85rem;
  }

  .icon-btn {
    width: 36px;
    padding: 0;
  }

  .icon-btn svg {
    width: 18px;
    height: 18px;
  }

  .icon-btn:hover:not(:disabled),
  .text-btn:hover:not(:disabled),
  .stage-btn:hover:not(:disabled) {
    background: var(--nav-hover);
    color: var(--text-h);
  }

  .icon-btn.active,
  .stage-btn.active,
  .text-btn.primary {
    background: var(--nav-active);
    color: var(--text-h);
  }

  .icon-btn:disabled,
  .text-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  .progress-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 20px;
    border-bottom: 1px solid var(--border);
  }

  .progress {
    flex: 1;
    height: 8px;
    border-radius: 999px;
    background: var(--nav-hover);
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: var(--nav-active);
  }

  .progress-label {
    margin: 0;
    font-size: 0.85rem;
    white-space: nowrap;
  }

  .banner {
    margin: 0;
    padding: 12px 20px;
  }

  .list-pane,
  .status {
    padding: 24px 32px;
  }

  .status.error,
  .banner.error,
  .save-error {
    color: #b91c1c;
  }

  .job-list {
    list-style: none;
    margin: 0;
    padding: 0;
    border-top: 1px solid var(--border);
  }

  .job-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 12px;
    width: 100%;
    padding: 10px 4px;
    border-bottom: 1px solid var(--border);
    align-items: center;
  }

  .job-row:hover {
    background: var(--nav-hover);
  }

  .job-main {
    display: grid;
    grid-template-columns: minmax(8rem, 0.8fr) minmax(10rem, 1.4fr) minmax(8rem, 1fr) minmax(6rem, 0.8fr);
    gap: 16px;
    width: 100%;
    padding: 4px 0;
    border: 0;
    background: transparent;
    color: inherit;
    text-align: left;
    cursor: pointer;
    font: inherit;
  }

  .company {
    font-weight: 600;
    color: var(--text-h);
  }

  .role {
    color: var(--text-h);
  }

  .meta {
    color: var(--text);
  }

  .row-actions {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .stage-chip {
    font-size: 0.75rem;
    color: var(--text);
    padding: 0 8px;
  }

  .status-select {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 0.85rem;
  }

  .status-select select {
    font: inherit;
    height: 36px;
    padding: 0 8px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--bg);
    color: var(--text-h);
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    border: 0;
  }

  .detail {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 280px;
    flex: 1;
    min-height: 0;
  }

  .content {
    padding: 32px 48px 48px;
    max-width: 52rem;
    margin: 0 auto;
    width: 100%;
  }

  .subtitle {
    margin: 0 0 16px;
    color: var(--text);
  }

  .detail-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 24px;
  }

  .save-error {
    margin: 0 0 16px;
  }

  .content :global(h2),
  .content :global(h3) {
    color: var(--text-h);
    margin: 24px 0 8px;
  }

  .content :global(p),
  .content :global(ul) {
    margin: 0 0 12px;
  }

  .content :global(a) {
    color: inherit;
  }

  .properties {
    border-left: 1px solid var(--border);
    padding: 24px 20px 40px;
    background: var(--nav-bg);
  }

  .properties h2 {
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin: 0 0 16px;
  }

  dl {
    margin: 0;
  }

  .prop {
    margin-bottom: 14px;
  }

  dt {
    font-size: 0.75rem;
    color: var(--text);
    margin-bottom: 2px;
  }

  dd {
    margin: 0;
    color: var(--text-h);
    font-size: 0.9rem;
    overflow-wrap: anywhere;
  }

  .properties a {
    color: inherit;
  }
</style>
