<script lang="ts">
  import { contactsStore } from './contactsStore.svelte'
  import { jobBoardsStore } from './jobBoardsStore.svelte'
  import { jobsStore } from './jobsStore.svelte'
  import { formatOverallMatch } from './jobs'
  import { isStaleApplied, jobMatchesStage } from './jobStatus'
  import { contactDetailPath, jobBoardDetailPath, jobDetailPath, navigate } from './router'

  jobsStore.start()
  contactsStore.start()
  jobBoardsStore.start()

  const today = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date())

  const jobs = $derived(jobsStore.list)
  const jobsLoading = $derived(jobsStore.listLoading)
  const jobsError = $derived(jobsStore.error)

  const contacts = $derived(contactsStore.list)
  const contactsLoading = $derived(contactsStore.listLoading)
  const contactsError = $derived(contactsStore.error)

  const boards = $derived(jobBoardsStore.list)
  const boardsLoading = $derived(jobBoardsStore.listLoading)
  const boardsError = $derived(jobBoardsStore.error)

  const inboxJobs = $derived(jobs.filter((job) => jobMatchesStage(job.status, 'inbox')))
  const inboxPreview = $derived(inboxJobs.slice(0, 8))
  const inboxCount = $derived(inboxJobs.length)
  const followUpCount = $derived(jobs.filter((job) => isStaleApplied(job.status, job.applied_at)).length)
  const followUpLabel = $derived(followUpCount === 1 ? 'follow-up' : 'follow-ups')

  const contactsPreview = $derived(contacts.slice(0, 8))
  const boardsPreview = $derived(boards.slice(0, 8))

  function go(event: MouseEvent, href: string) {
    event.preventDefault()
    navigate(href)
  }

  function onRowKeydown(event: KeyboardEvent, href: string) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      navigate(href)
    }
  }
</script>

<section class="home">
  <header class="page-header">
    <h1>Home</h1>
    <p class="date">{today}</p>
  </header>

  <p class="summary">
    {inboxCount} inbox ·
    <a href="/jobs" onclick={(event) => go(event, '/jobs')}>{followUpCount} {followUpLabel}</a>
  </p>

  <div class="grid">
    {@render widget(
      'Inbox',
      inboxCount,
      '/jobs',
      jobsLoading,
      jobsError,
      'Loading jobs…',
      'Inbox zero. Every captured job is applied or deleted.',
      inboxRows,
    )}
    {@render widget(
      'Contacts',
      contacts.length,
      '/contacts',
      contactsLoading,
      contactsError,
      'Loading contacts…',
      'No contacts yet.',
      contactRows,
    )}
    {@render widget(
      'Job Boards',
      boards.length,
      '/job-boards',
      boardsLoading,
      boardsError,
      'Loading job boards…',
      'No job boards yet.',
      boardRows,
    )}
  </div>
</section>

{#snippet widget(
  title,
  count,
  href,
  loading,
  error,
  loadingText,
  emptyText,
  rows,
)}
  <section class="widget">
    <header class="widget-header">
      <h2>{title}</h2>
      <span class="widget-count">{count}</span>
      <a class="view-all" {href} onclick={(event) => go(event, href)}>View all</a>
    </header>
    <div class="widget-body">
      {#if loading}
        <p class="status">{loadingText}</p>
      {:else if error}
        <p class="status error">{error}</p>
      {:else if count === 0}
        <p class="status">{emptyText}</p>
      {:else}
        {@render rows()}
      {/if}
    </div>
  </section>
{/snippet}

{#snippet inboxRows()}
  <ul class="rows">
    {#each inboxPreview as job (job.id)}
      {@const href = jobDetailPath(job.id)}
      <li>
        <a
          class="row"
          {href}
          onclick={(event) => go(event, href)}
          onkeydown={(event) => onRowKeydown(event, href)}
        >
          <span class="primary">{job.company}</span>
          <span class="secondary">{job.name}</span>
          <span class="meta">{formatOverallMatch(job.fit_overall_match)}</span>
        </a>
      </li>
    {/each}
  </ul>
{/snippet}

{#snippet contactRows()}
  <ul class="rows">
    {#each contactsPreview as contact (contact.id)}
      {@const href = contactDetailPath(contact.id)}
      <li>
        <a
          class="row"
          {href}
          onclick={(event) => go(event, href)}
          onkeydown={(event) => onRowKeydown(event, href)}
        >
          <span class="primary">{contact.name}</span>
          <span class="secondary">{contact.url || '—'}</span>
        </a>
      </li>
    {/each}
  </ul>
{/snippet}

{#snippet boardRows()}
  <ul class="rows">
    {#each boardsPreview as board (board.id)}
      {@const href = jobBoardDetailPath(board.id)}
      <li>
        <a
          class="row board"
          {href}
          onclick={(event) => go(event, href)}
          onkeydown={(event) => onRowKeydown(event, href)}
        >
          <span class="meta">{board.rank}</span>
          <span class="primary">{board.name}</span>
        </a>
      </li>
    {/each}
  </ul>
{/snippet}

<style>
  .home {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .page-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 16px;
  }

  h1 {
    margin: 0;
  }

  .date,
  .summary {
    color: var(--text);
    font-size: 0.95rem;
  }

  .summary a {
    color: var(--link);
    text-decoration: none;
  }

  .summary a:hover {
    text-decoration: underline;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
  }

  .widget {
    display: flex;
    flex-direction: column;
    min-width: 0;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 12px;
    overflow: hidden;
  }

  .widget-header {
    display: flex;
    align-items: baseline;
    gap: 8px;
    padding: 14px 16px 10px;
    background: var(--nav-bg);
    border-bottom: 1px solid var(--border);
  }

  h2 {
    margin: 0;
    flex: 1;
    color: var(--text-h);
    font-size: 1.05rem;
    font-weight: 650;
  }

  .widget-count {
    color: var(--text);
    font-size: 0.85rem;
    font-variant-numeric: tabular-nums;
  }

  .view-all {
    color: var(--link);
    font-size: 0.85rem;
    text-decoration: none;
  }

  .view-all:hover {
    text-decoration: underline;
  }

  .widget-body {
    padding: 6px 0;
  }

  .status {
    margin: 0;
    padding: 12px 16px;
    color: var(--text);
    font-size: 0.9rem;
  }

  .status.error {
    color: #b91c1c;
  }

  .rows {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    column-gap: 12px;
    row-gap: 2px;
    padding: 8px 16px;
    color: inherit;
    text-decoration: none;
  }

  .row:hover {
    background: var(--nav-hover);
  }

  .row.board {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .row.board .meta {
    grid-column: 1;
    grid-row: auto;
  }

  .primary {
    color: var(--text-h);
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .secondary {
    grid-column: 1;
    color: var(--text-body);
    font-size: 0.85rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .meta {
    grid-column: 2;
    grid-row: 1 / span 2;
    align-self: center;
    color: var(--text);
    font-size: 0.85rem;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  @media (max-width: 860px) {
    .grid {
      grid-template-columns: 1fr;
    }

    .page-header {
      flex-wrap: wrap;
    }
  }
</style>
