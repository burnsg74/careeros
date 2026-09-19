<script lang="ts">
  import { untrack } from 'svelte'
  import { marked } from 'marked'
  import DeleteJobModal from './DeleteJobModal.svelte'
  import EditorControls from './EditorControls.svelte'
  import MarkdownEditor from './MarkdownEditor.svelte'
  import { formatOverallMatch, type JobDetail, type JobSummary } from './jobs'
  import { DEFAULT_JOB_FILTERS, jobMatchesFilters } from './jobFilters'
  import { jobsStore } from './jobsStore.svelte'
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
  import { jobDetailPath, navigate, parseJobId } from './router'
  import { buildJobDetailView } from './jobDetailView'

  const PROPERTIES_OPEN_KEY = 'careeros.propertiesOpen'

  let { path }: { path: string } = $props()

  jobsStore.start()

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
  let propertiesOpen = $state(readFlag(PROPERTIES_OPEN_KEY, false))
  let minMatchPct = $state<number | undefined>(undefined)
  let fullyRemote = $state(DEFAULT_JOB_FILTERS.fullyRemote)
  let skillQuery = $state('')
  let minCompensationK = $state<number | undefined>(undefined)

  const jobId = $derived(parseJobId(path))
  const jobs = $derived(jobsStore.list)
  const listError = $derived(jobsStore.error)
  const listLoading = $derived(jobsStore.listLoading)
  const detail = $derived(jobId ? (jobsStore.getDetail(jobId) ?? null) : null)
  const detailError = $derived(jobId ? jobsStore.detailError(jobId) : null)
  const detailLoading = $derived(jobId ? jobsStore.isDetailLoading(jobId) : false)
  const isDetail = $derived(jobId !== null)
  const listFilters = $derived({
    minMatchPct: minMatchPct ?? null,
    fullyRemote,
    skills: skillQuery,
    minCompensationK: minCompensationK ?? null,
  })
  const stageJobs = $derived(jobs.filter((job) => jobMatchesStage(job.status, stage)))
  const filteredJobs = $derived(stageJobs.filter((job) => jobMatchesFilters(job, listFilters)))
  const stageCounts = $derived.by(() => {
    const counts = Object.fromEntries(STAGE_TABS.map((tab) => [tab.id, 0])) as Record<
      JobStageFilter,
      number
    >
    for (const job of jobs) {
      for (const tab of STAGE_TABS) {
        if (jobMatchesStage(job.status, tab.id)) {
          counts[tab.id] += 1
        }
      }
    }
    return counts
  })
  const currentIndex = $derived(jobId ? filteredJobs.findIndex((job) => job.id === jobId) : -1)
  const previousJob = $derived(currentIndex > 0 ? filteredJobs[currentIndex - 1] : null)
  const nextJob = $derived(
    currentIndex >= 0 && currentIndex < filteredJobs.length - 1 ? filteredJobs[currentIndex + 1] : null,
  )
  const detailTargetId = $derived(lastJobId ?? filteredJobs[0]?.id ?? jobs[0]?.id ?? null)
  const newCount = $derived(jobs.filter((job) => job.status === 'new').length)
  const deleteListedSkills = $derived(
    jobs.find((job) => job.id === deleteJobId)?.skills ?? detail?.skills ?? '',
  )
  const view = $derived(detail ? buildJobDetailView(detail) : null)

  function readFlag(key: string, fallback: boolean): boolean {
    try {
      const value = localStorage.getItem(key)
      if (value === null) {
        return fallback
      }
      return value === '1'
    } catch {
      return fallback
    }
  }

  function writeFlag(key: string, value: boolean) {
    try {
      localStorage.setItem(key, value ? '1' : '0')
    } catch {
      // ignore quota / private-mode failures
    }
  }

  function persistPropertiesOpen(event: Event) {
    const el = event.currentTarget as HTMLDetailsElement
    propertiesOpen = el.open
    writeFlag(PROPERTIES_OPEN_KEY, el.open)
  }

  $effect(() => {
    const id = jobId
    void jobsStore.epoch
    if (!id) {
      editing = false
      saveError = null
      statusError = null
      return
    }
    editing = false
    saveError = null
    statusError = null
    lastJobId = id
    untrack(() => {
      void jobsStore.ensureDetail(id)
    })
  })

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

  function isMatchProperty(key: string): boolean {
    return key === 'fit_overall_match' || key === 'fit_required_match'
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
      await jobsStore.saveBody(jobId, draft)
      editing = false
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
      return
    }
    if (stage === 'inbox') {
      const firstSaved = jobs.find((job) => job.status === 'saved')
      if (firstSaved) {
        selectStage('saved')
        return
      }
    }
    navigate('/jobs')
  }

  async function saveJob(job: JobSummary | JobDetail, fromDetail: boolean) {
    const orderedIds = stageIds()
    statusSaving = true
    statusError = null
    try {
      await jobsStore.patchStatus(job.id, { status: 'saved' })
      advanceAfter(job.id, fromDetail, orderedIds)
    } catch {
      statusError = 'Could not update status'
    } finally {
      statusSaving = false
    }
  }

  async function applyJob(job: JobSummary | JobDetail, fromDetail: boolean) {
    const orderedIds = stageIds()
    statusSaving = true
    statusError = null
    try {
      const updated = await jobsStore.patchStatus(job.id, { status: 'applied' })
      openListing(updated)
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
      await jobsStore.patchStatus(id, {
        status: 'deleted',
        deleted_reason: reason,
        deleted_reason_other: other,
        missing_skills: missingSkills.length > 0 ? missingSkills : undefined,
      })
      deleteOpen = false
      deleteJobId = null
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
      const updated = await jobsStore.patchStatus(id, { status })
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

  function goToPrevious() {
    if (previousJob) {
      openJob(previousJob.id)
    }
  }

  function goToNext() {
    if (nextJob) {
      openJob(nextJob.id)
    }
  }

  function saveCurrent() {
    if (detail?.status === 'new' && !statusSaving) {
      void saveJob(detail, true)
    }
  }

  function applyCurrent() {
    if (detail?.status === 'saved' && !statusSaving) {
      void applyJob(detail, true)
    }
  }

  function deleteCurrent() {
    if ((detail?.status === 'new' || detail?.status === 'saved') && !statusSaving) {
      startDelete(detail.id, true)
    }
  }

  function isTypingTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) {
      return false
    }
    const tag = target.tagName
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable
  }

  function onWindowKeydown(event: KeyboardEvent) {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) {
      return
    }
    if (!isDetail || editing || deleteOpen || isTypingTarget(event.target)) {
      return
    }

    const key = event.key.toLowerCase()
    if (key === 'n' || key === 'arrowright') {
      if (nextJob) {
        event.preventDefault()
        goToNext()
      }
      return
    }
    if (key === 'p' || key === 'arrowleft') {
      if (previousJob) {
        event.preventDefault()
        goToPrevious()
      }
      return
    }
    if (key === 's') {
      if (detail?.status === 'new' && !statusSaving) {
        event.preventDefault()
        saveCurrent()
      }
      return
    }
    if (key === 'a') {
      if (detail?.status === 'saved' && !statusSaving) {
        event.preventDefault()
        applyCurrent()
      }
      return
    }
    if (key === 'd') {
      if ((detail?.status === 'new' || detail?.status === 'saved') && !statusSaving) {
        event.preventDefault()
        deleteCurrent()
      }
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

<svelte:window onkeydown={onWindowKeydown} />

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
            {tab.label} ({stageCounts[tab.id]})
          </button>
        {/each}
      </div>
    </div>
    <div class="toolbar-end">
      {#if isDetail && detail && !detailLoading && !detailError}
        <div class="job-actions">
          {#if detail.status === 'new'}
            <button
              type="button"
              class="text-btn primary"
              disabled={statusSaving}
              title="Save (S)"
              aria-keyshortcuts="s"
              onclick={saveCurrent}
            >
              Save <kbd aria-hidden="true">S</kbd>
            </button>
            <button
              type="button"
              class="text-btn"
              disabled={statusSaving}
              title="Delete (D)"
              aria-keyshortcuts="d"
              onclick={deleteCurrent}
            >
              Delete <kbd aria-hidden="true">D</kbd>
            </button>
          {:else if detail.status === 'saved'}
            <button
              type="button"
              class="text-btn primary"
              disabled={statusSaving}
              title="Apply (A)"
              aria-keyshortcuts="a"
              onclick={applyCurrent}
            >
              Apply <kbd aria-hidden="true">A</kbd>
            </button>
            <button
              type="button"
              class="text-btn"
              disabled={statusSaving}
              title="Delete (D)"
              aria-keyshortcuts="d"
              onclick={deleteCurrent}
            >
              Delete <kbd aria-hidden="true">D</kbd>
            </button>
          {:else}
            <label class="status-select">
              <span class="sr-only">Status</span>
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
          title="Previous job (P)"
          aria-keyshortcuts="p ArrowLeft"
          disabled={!previousJob}
          onclick={goToPrevious}
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
          title="Next job (N)"
          aria-keyshortcuts="n ArrowRight"
          disabled={!nextJob}
          onclick={goToNext}
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

  {#if statusError && !deleteOpen}
    <p class="banner error">{statusError}</p>
  {/if}

  {#if !isDetail}
    <section class="list-pane">
      <div class="list-filters">
        <label class="filter-field">
          Min match %
          <input
            type="number"
            min="0"
            max="100"
            step="1"
            inputmode="numeric"
            bind:value={minMatchPct}
          />
        </label>
        <label class="filter-check">
          <input type="checkbox" bind:checked={fullyRemote} />
          Fully remote
        </label>
        <label class="filter-field grow">
          Skills
          <input type="search" bind:value={skillQuery} placeholder="Contains…" />
        </label>
        <label class="filter-field">
          Min pay ($k)
          <input
            type="number"
            min="0"
            step="10"
            inputmode="numeric"
            bind:value={minCompensationK}
          />
        </label>
      </div>
      {#if listLoading}
        <p class="status">Loading jobs…</p>
      {:else if listError}
        <p class="status error">{listError}</p>
      {:else if stage === 'inbox' && newCount === 0}
        <p class="status">Inbox zero. Every captured job is saved or deleted.</p>
      {:else if stageJobs.length === 0}
        <p class="status">No jobs in this stage.</p>
      {:else if filteredJobs.length === 0}
        <p class="status">No jobs match these filters.</p>
      {:else}
        <table class="job-list">
          <thead>
            <tr>
              <th scope="col">Company</th>
              <th scope="col">Role</th>
              <th scope="col">Compensation</th>
              <th scope="col">Match</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each filteredJobs as job (job.id)}
              <tr class="job-row">
                <td>
                  <button type="button" class="job-main company" onclick={() => openJob(job.id)}>
                    {job.company}
                  </button>
                </td>
                <td>
                  <button type="button" class="job-main role" onclick={() => openJob(job.id)}>
                    {job.name}
                  </button>
                </td>
                <td>
                  <button type="button" class="job-main meta" onclick={() => openJob(job.id)}>
                    {job.compensation}
                  </button>
                </td>
                <td>
                  <button type="button" class="job-main meta" onclick={() => openJob(job.id)}>
                    {formatOverallMatch(job.fit_overall_match)}
                  </button>
                </td>
                <td class="row-actions">
                  {#if stage === 'all'}
                    <span class="stage-chip">{STATUS_LABELS[job.status]}</span>
                  {/if}
                  {#if job.status === 'new'}
                    <button type="button" class="text-btn" disabled={statusSaving} onclick={() => void saveJob(job, false)}>
                      Save
                    </button>
                    <button type="button" class="text-btn" disabled={statusSaving} onclick={() => startDelete(job.id, false)}>
                      Delete
                    </button>
                  {:else if job.status === 'saved'}
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
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}
    </section>
  {:else if detail}
    <div class="detail">
      <article class="content">
        <header class="article-head">
          <div class="headline">
            <div class="title-row">
              {#if view?.fitLabel}
                <span class="fit-badge" data-fit={detail.fit_recommendation}>{view.fitLabel}</span>
              {/if}
              <h1>{detail.name}</h1>
              {#if view?.postingUrl}
                <a
                  class="external-link"
                  href={view.postingUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Open job posting in a new tab"
                  title="Open job posting"
                >
                  <svg viewBox="0 0 20 20" aria-hidden="true">
                    <path
                      d="M8 4H5.5A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16h9a1.5 1.5 0 0 0 1.5-1.5V12"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.7"
                      stroke-linecap="round"
                    />
                    <path
                      d="M11 4h5v5M16 4l-7 7"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.7"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </a>
              {/if}
              <details class="frontmatter" bind:open={propertiesOpen} ontoggle={persistPropertiesOpen}>
                <summary>Details</summary>
                <dl>
                  {#each Object.entries(detail.properties) as [key, value] (key)}
                    <div class="prop">
                      <dt>{propertyLabel(key)}</dt>
                      <dd>
                        {#if isUrl(value)}
                          <a href={value} target="_blank" rel="noreferrer">{value}</a>
                        {:else if isMatchProperty(key)}
                          {formatOverallMatch(value)}
                        {:else}
                          {value || '—'}
                        {/if}
                      </dd>
                    </div>
                  {/each}
                </dl>
              </details>
            </div>
            {#if view?.companyUrl}
              <a class="company-link" href={view.companyUrl} target="_blank" rel="noreferrer">{detail.company}</a>
            {:else if detail.company}
              <span class="company-name">{detail.company}</span>
            {/if}
            {#if detail.compensation}
              <span class="comp">{detail.compensation}</span>
            {/if}
            {#if view?.postedAt}
              <span class="posted">Date Posted: {view.postedAt}</span>
            {/if}
          </div>
          {#if view}
            <p class="skills-line"><span class="skills-label">Have:</span> {view.haveCsv}</p>
            <p class="skills-line"><span class="skills-label">Familiar:</span> {view.familiarCsv}</p>
            <p class="skills-line"><span class="skills-label">Don't have:</span> {view.dontHaveCsv}</p>
          {/if}
        </header>
        {#if saveError}
          <p class="save-error">{saveError}</p>
        {/if}
        {#if editing}
          <MarkdownEditor bind:draft onsave={() => void saveEdit()} />
        {:else}
          {#if view?.summary}
            <p class="fit-summary">{view.summary}</p>
          {/if}
          {#if view?.postingMarkdown}
            <div class="prose">
              {@html marked.parse(view.postingMarkdown, { async: false })}
            </div>
          {/if}
        {/if}
      </article>
    </div>
  {:else if detailLoading}
    <p class="status">Loading job…</p>
  {:else if detailError}
    <p class="status error">{detailError}</p>
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
    padding: 8px 16px;
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

  .toolbar-end,
  .job-actions {
    gap: 8px;
  }

  .job-actions {
    display: flex;
    align-items: center;
  }

  kbd {
    font: inherit;
    font-size: 0.7rem;
    margin-left: 6px;
    padding: 1px 5px;
    border: 1px solid color-mix(in srgb, currentColor 28%, transparent);
    border-radius: 4px;
    opacity: 0.75;
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

  .banner {
    margin: 0;
    padding: 12px 20px;
  }

  .list-pane,
  .status {
    padding: 24px 32px;
  }

  .list-filters {
    display: flex;
    flex-wrap: wrap;
    align-items: end;
    gap: 16px;
    margin: 0 0 20px;
  }

  .filter-field {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 0.75rem;
    font-weight: 650;
    color: var(--text);
  }

  .filter-field.grow {
    flex: 1;
    min-width: 12rem;
  }

  .filter-field input {
    height: 36px;
    padding: 0 10px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--bg);
    color: var(--text-h);
    font: inherit;
    font-weight: 400;
    font-size: 0.85rem;
  }

  .filter-field input[type='number'] {
    width: 7rem;
  }

  .filter-check {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    height: 36px;
    font-size: 0.85rem;
    color: var(--text-h);
  }

  .status.error,
  .banner.error,
  .save-error {
    color: #b91c1c;
  }

  .job-list {
    width: 100%;
    border-collapse: collapse;
    margin: 0;
  }

  .job-list th {
    text-align: left;
    font-size: 0.75rem;
    font-weight: 650;
    color: var(--text);
    padding: 8px 8px 8px 4px;
    border-bottom: 1px solid var(--border);
    white-space: nowrap;
  }

  .job-list th:last-child,
  .job-list td:last-child {
    text-align: right;
    padding-right: 4px;
  }

  .job-list td {
    padding: 6px 8px 6px 4px;
    border-bottom: 1px solid var(--border);
    vertical-align: middle;
  }

  .job-list td:nth-child(3),
  .job-list td:nth-child(4),
  .job-list td:last-child {
    white-space: nowrap;
  }

  .job-row:hover {
    background: var(--nav-hover);
  }

  .job-main {
    display: block;
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
    justify-content: flex-end;
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
    grid-template-columns: minmax(0, 1fr);
    flex: 1;
    min-height: 0;
  }

  .content {
    padding: 12px 20px 32px;
    width: 100%;
  }

  .article-head {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin: 0 0 12px;
  }

  .headline {
    display: flex;
    align-items: baseline;
    gap: 8px 14px;
    flex-wrap: wrap;
  }

  .title-row {
    display: flex;
    align-items: center;
    gap: 6px;
    flex: 1 1 100%;
    min-width: 0;
  }

  .article-head h1 {
    margin: 0;
    font-size: 1.15rem;
    line-height: 1.25;
  }

  .fit-badge {
    font-size: 0.75rem;
    font-weight: 650;
    letter-spacing: 0.02em;
    padding: 2px 8px;
    border-radius: 999px;
    background: var(--nav-active);
    color: var(--text-h);
    white-space: nowrap;
  }

  .fit-badge[data-fit='HOLD'] {
    background: #fef3c7;
  }

  .fit-badge[data-fit='SKIP'] {
    background: #fee2e2;
  }

  .external-link {
    display: inline-flex;
    color: var(--link);
    line-height: 0;
  }

  .external-link svg {
    width: 14px;
    height: 14px;
  }

  .company-link,
  .company-name {
    color: var(--link);
    text-decoration: none;
    font-weight: 500;
  }

  .company-name {
    color: var(--text);
  }

  .company-link:hover {
    text-decoration: underline;
  }

  .comp {
    color: var(--text-h);
    font-weight: 500;
  }

  .posted {
    color: var(--text);
    font-size: 0.88rem;
  }

  .skills-line {
    margin: 0;
    font-size: 0.88rem;
    line-height: 1.35;
    color: var(--text-body);
  }

  .skills-label {
    color: var(--text);
    font-weight: 600;
  }

  .fit-summary {
    margin: 0 0 1em;
    font-size: 0.95rem;
    line-height: 1.45;
    color: var(--text-body);
  }

  .save-error {
    margin: 0 0 16px;
  }

  .prose {
    color: var(--text-body);
    font-size: 0.95rem;
    line-height: 1.45;
  }

  .prose :global(h2),
  .prose :global(h3),
  .prose :global(h4) {
    color: var(--text-h);
    line-height: 1.3;
    margin: 1.1em 0 0.35em;
  }

  .prose :global(h2) {
    font-size: 1.1rem;
  }

  .prose :global(h3) {
    font-size: 1rem;
  }

  .prose :global(p),
  .prose :global(ul),
  .prose :global(ol) {
    margin: 0 0 0.7em;
  }

  .prose :global(ul),
  .prose :global(ol) {
    padding-left: 1.35em;
  }

  .prose :global(li) {
    margin: 0 0 0.35em;
  }

  .prose :global(li) > :global(ul),
  .prose :global(li) > :global(ol) {
    margin: 0.35em 0 0;
  }

  .prose :global(a) {
    color: var(--link);
  }

  .prose :global(blockquote) {
    margin: 0 0 1em;
    padding: 0.15em 0 0.15em 1em;
    border-left: 3px solid var(--border);
    color: var(--text);
  }

  .prose :global(hr) {
    border: 0;
    border-top: 1px solid var(--border);
    margin: 1.1em 0;
  }

  .prose :global(pre) {
    margin: 0 0 1em;
    padding: 12px 14px;
    overflow-x: auto;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--nav-bg);
    font-size: 0.9rem;
    line-height: 1.5;
  }

  .prose :global(code) {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 0.9em;
  }

  .prose :global(:not(pre) > code) {
    padding: 0.12em 0.35em;
    border-radius: 4px;
    background: var(--nav-bg);
  }

  .frontmatter {
    position: relative;
    margin: 0 0 0 auto;
    border: none;
    background: transparent;
  }

  .frontmatter summary {
    cursor: pointer;
    font-size: 0.8rem;
    font-weight: 600;
    padding: 0;
    color: var(--text-h);
    white-space: nowrap;
  }

  .frontmatter dl {
    position: absolute;
    top: calc(100% + 6px);
    right: 0;
    z-index: 2;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
    gap: 10px 16px;
    margin: 0;
    padding: 12px;
    width: min(40rem, calc(100vw - 40px));
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--nav-bg);
    box-shadow: 0 8px 24px color-mix(in srgb, var(--text) 12%, transparent);
  }

  .prop {
    margin: 0;
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

  .frontmatter a {
    color: inherit;
  }
</style>
