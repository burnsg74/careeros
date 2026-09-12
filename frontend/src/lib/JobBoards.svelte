<script lang="ts">
  import { onMount } from 'svelte'
  import { marked } from 'marked'
  import type { JobBoardDetail, JobBoardSummary } from './jobBoards'
  import { jobBoardDetailPath, navigate, parseJobBoardId } from './router'

  let { path }: { path: string } = $props()

  let boards = $state<JobBoardSummary[]>([])
  let detail = $state<JobBoardDetail | null>(null)
  let listError = $state<string | null>(null)
  let detailError = $state<string | null>(null)
  let listLoading = $state(true)
  let detailLoading = $state(false)
  let lastBoardId = $state<string | null>(null)

  const boardId = $derived(parseJobBoardId(path))
  const isDetail = $derived(boardId !== null)
  const currentIndex = $derived(boardId ? boards.findIndex((board) => board.id === boardId) : -1)
  const previousBoard = $derived(currentIndex > 0 ? boards[currentIndex - 1] : null)
  const nextBoard = $derived(
    currentIndex >= 0 && currentIndex < boards.length - 1 ? boards[currentIndex + 1] : null,
  )
  const detailTargetId = $derived(lastBoardId ?? boards[0]?.id ?? null)

  onMount(() => {
    void loadList()
  })

  $effect(() => {
    const id = boardId
    if (!id) {
      detail = null
      detailError = null
      detailLoading = false
      return
    }
    lastBoardId = id
    void loadDetail(id)
  })

  async function loadList() {
    listLoading = true
    listError = null
    try {
      const response = await fetch('/api/job-boards')
      if (!response.ok) {
        throw new Error('Could not load job boards')
      }
      boards = (await response.json()) as JobBoardSummary[]
    } catch {
      listError = 'Could not load job boards'
      boards = []
    } finally {
      listLoading = false
    }
  }

  async function loadDetail(id: string) {
    detailLoading = true
    detailError = null
    try {
      const response = await fetch(`/api/job-boards/${encodeURIComponent(id)}`)
      if (response.status === 404) {
        detail = null
        detailError = 'Job board not found'
        return
      }
      if (!response.ok) {
        throw new Error('Could not load job board')
      }
      detail = (await response.json()) as JobBoardDetail
    } catch {
      detail = null
      detailError = 'Could not load job board'
    } finally {
      detailLoading = false
    }
  }

  function openList() {
    navigate('/job-boards')
  }

  function openDetailView() {
    if (!detailTargetId) {
      return
    }
    navigate(jobBoardDetailPath(detailTargetId))
  }

  function openBoard(id: string) {
    lastBoardId = id
    navigate(jobBoardDetailPath(id))
  }

  function onRowKeydown(event: KeyboardEvent, id: string) {
    if (event.target instanceof HTMLAnchorElement) {
      return
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      openBoard(id)
    }
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
    <div class="views" role="toolbar" aria-label="Job boards views">
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
      <div class="nav-boards" role="group" aria-label="Job board navigation">
        <button
          type="button"
          class="icon-btn"
          aria-label="Previous job board"
          disabled={!previousBoard}
          onclick={() => previousBoard && openBoard(previousBoard.id)}
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
          aria-label="Next job board"
          disabled={!nextBoard}
          onclick={() => nextBoard && openBoard(nextBoard.id)}
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
        <p class="status">Loading job boards…</p>
      {:else if listError}
        <p class="status error">{listError}</p>
      {:else if boards.length === 0}
        <p class="status">No job boards yet.</p>
      {:else}
        <div class="board-list" role="table" aria-label="Job boards">
          <div class="board-row header" role="row">
            <span role="columnheader">Rank</span>
            <span role="columnheader">Name</span>
            <span role="columnheader">URL</span>
          </div>
          {#each boards as board (board.id)}
            <div
              class="board-row"
              role="row"
              tabindex="0"
              onclick={() => openBoard(board.id)}
              onkeydown={(event) => onRowKeydown(event, board.id)}
            >
              <span class="rank" role="cell">{board.rank}</span>
              <span class="name" role="cell">{board.name}</span>
              <span class="meta" role="cell">
                {#if board.url}
                  <a
                    href={board.url}
                    target="_blank"
                    rel="noreferrer"
                    onclick={(event) => event.stopPropagation()}
                  >
                    {board.url}
                  </a>
                {:else}
                  —
                {/if}
              </span>
            </div>
          {/each}
        </div>
      {/if}
    </section>
  {:else if detailLoading}
    <p class="status">Loading job board…</p>
  {:else if detailError}
    <p class="status error">{detailError}</p>
  {:else if detail}
    <div class="detail">
      <article class="content">
        <h1>{detail.name}</h1>
        {#if detail.url}
          <p class="subtitle">
            <a href={detail.url} target="_blank" rel="noreferrer">{detail.url}</a>
          </p>
        {/if}
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
  .nav-boards {
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

  .board-list {
    list-style: none;
    margin: 0;
    padding: 0;
    border-top: 1px solid var(--border);
  }

  .board-row {
    display: grid;
    grid-template-columns: 4rem minmax(10rem, 1fr) minmax(12rem, 1.6fr);
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

  .board-row.header {
    cursor: default;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--text);
    padding-top: 8px;
    padding-bottom: 8px;
  }

  .board-row:not(.header):hover {
    background: var(--nav-hover);
  }

  .board-row:not(.header):focus-visible {
    outline: 2px solid var(--text-h);
    outline-offset: -2px;
  }

  .meta a {
    color: inherit;
  }

  .rank {
    font-weight: 600;
    color: var(--text-h);
  }

  .name {
    color: var(--text-h);
    font-weight: 600;
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
