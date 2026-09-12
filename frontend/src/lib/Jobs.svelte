<script lang="ts">
  import { onMount } from 'svelte'
  import { marked } from 'marked'
  import type { JobDetail, JobSummary } from './jobs'
  import { jobDetailPath, navigate, parseJobId } from './router'

  let { path }: { path: string } = $props()

  let jobs = $state<JobSummary[]>([])
  let detail = $state<JobDetail | null>(null)
  let listError = $state<string | null>(null)
  let detailError = $state<string | null>(null)
  let listLoading = $state(true)
  let detailLoading = $state(false)
  let lastJobId = $state<string | null>(null)

  const jobId = $derived(parseJobId(path))
  const isDetail = $derived(jobId !== null)
  const currentIndex = $derived(jobId ? jobs.findIndex((job) => job.id === jobId) : -1)
  const previousJob = $derived(currentIndex > 0 ? jobs[currentIndex - 1] : null)
  const nextJob = $derived(
    currentIndex >= 0 && currentIndex < jobs.length - 1 ? jobs[currentIndex + 1] : null,
  )
  const detailTargetId = $derived(lastJobId ?? jobs[0]?.id ?? null)

  onMount(() => {
    void loadList()
  })

  $effect(() => {
    const id = jobId
    if (!id) {
      detail = null
      detailError = null
      detailLoading = false
      return
    }
    lastJobId = id
    void loadDetail(id)
  })

  async function loadList() {
    listLoading = true
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

  function propertyLabel(key: string): string {
    return key
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')
  }

  function isUrl(value: string): boolean {
    return value.startsWith('http://') || value.startsWith('https://')
  }
</script>

<div class="page">
  <header class="toolbar">
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
  </header>

  {#if !isDetail}
    <section class="list-pane">
      {#if listLoading}
        <p class="status">Loading jobs…</p>
      {:else if listError}
        <p class="status error">{listError}</p>
      {:else if jobs.length === 0}
        <p class="status">No jobs yet.</p>
      {:else}
        <ul class="job-list">
          {#each jobs as job (job.id)}
            <li>
              <button type="button" class="job-row" onclick={() => openJob(job.id)}>
                <span class="company">{job.company}</span>
                <span class="role">{job.name}</span>
                <span class="meta">{job.compensation}</span>
                <span class="meta">{job.locations}</span>
              </button>
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
        {@html marked.parse(detail.body, { async: false })}
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
  }

  .views,
  .nav-jobs {
    display: flex;
    gap: 4px;
  }

  .icon-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    padding: 0;
    border: 1px solid transparent;
    border-radius: 8px;
    background: transparent;
    color: var(--text);
    cursor: pointer;
  }

  .icon-btn svg {
    width: 18px;
    height: 18px;
  }

  .icon-btn:hover:not(:disabled) {
    background: var(--nav-hover);
    color: var(--text-h);
  }

  .icon-btn.active {
    background: var(--nav-active);
    color: var(--text-h);
  }

  .icon-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  .list-pane,
  .status {
    padding: 24px 32px;
  }

  .status.error {
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
    grid-template-columns: minmax(8rem, 0.8fr) minmax(10rem, 1.4fr) minmax(8rem, 1fr) minmax(6rem, 0.8fr);
    gap: 16px;
    width: 100%;
    padding: 14px 4px;
    border: 0;
    border-bottom: 1px solid var(--border);
    background: transparent;
    color: inherit;
    text-align: left;
    cursor: pointer;
    font: inherit;
  }

  .job-row:hover {
    background: var(--nav-hover);
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
    margin: 0 0 24px;
    color: var(--text);
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
