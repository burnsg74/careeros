<script lang="ts">
  import { onMount, type Snippet } from 'svelte'
  import { getPath, isContactsPath, isJobBoardsPath, isJobsPath, isNavActive, navigate, navItems } from './router'

  const NAV_EXPANDED_KEY = 'careeros.navExpanded'

  let { children, onrefresh, refreshing = false }: { children: Snippet; onrefresh: () => void; refreshing?: boolean } =
    $props()
  let path = $state(getPath())
  let expanded = $state(readFlag(NAV_EXPANDED_KEY, false))

  onMount(() => {
    const onPopState = () => {
      path = getPath()
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  })

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

  function toggleNav() {
    expanded = !expanded
    writeFlag(NAV_EXPANDED_KEY, expanded)
  }

  function onNavClick(event: MouseEvent, itemPath: string, enabled: boolean) {
    event.preventDefault()
    if (!enabled) {
      return
    }
    navigate(itemPath)
  }
</script>

<div class="shell" class:expanded>
  <aside class="nav">
    <button
      type="button"
      class="brand"
      aria-expanded={expanded}
      aria-controls="main-nav"
      aria-label={expanded ? 'Collapse navigation' : 'Expand navigation'}
      onclick={toggleNav}
    >
      <span class="brand-mark">C</span>
      <span class="brand-name">CareerOS</span>
    </button>
    <nav id="main-nav" aria-label="Main">
      {#each navItems as item (item.path)}
        {#if item.enabled}
          <a
            href={item.path}
            class:active={isNavActive(item.path, path)}
            aria-label={item.title}
            title={item.title}
            onclick={(event) => onNavClick(event, item.path, item.enabled)}
          >
            {#if item.path === '/'}
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <path
                  d="M3.5 9.2 10 3.5l6.5 5.7V16a1 1 0 0 1-1 1h-3.4v-4.2H7.9V17H4.5a1 1 0 0 1-1-1V9.2Z"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.6"
                  stroke-linejoin="round"
                />
              </svg>
            {:else if item.path === '/jobs'}
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <rect x="3" y="7" width="14" height="9.5" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.6" />
                <path
                  d="M7 7V5.6A1.6 1.6 0 0 1 8.6 4h2.8A1.6 1.6 0 0 1 13 5.6V7"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.6"
                />
              </svg>
            {:else if item.path === '/contacts'}
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <circle cx="10" cy="6.5" r="2.4" fill="none" stroke="currentColor" stroke-width="1.6" />
                <path
                  d="M5 15.4c.6-2.4 2.5-3.6 5-3.6s4.4 1.2 5 3.6"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.6"
                  stroke-linecap="round"
                />
              </svg>
            {:else}
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <rect x="3.5" y="3.5" width="5.4" height="5.4" rx="1" fill="none" stroke="currentColor" stroke-width="1.6" />
                <rect x="11.1" y="3.5" width="5.4" height="5.4" rx="1" fill="none" stroke="currentColor" stroke-width="1.6" />
                <rect x="3.5" y="11.1" width="5.4" height="5.4" rx="1" fill="none" stroke="currentColor" stroke-width="1.6" />
                <rect x="11.1" y="11.1" width="5.4" height="5.4" rx="1" fill="none" stroke="currentColor" stroke-width="1.6" />
              </svg>
            {/if}
            <span class="label">{item.title}</span>
          </a>
        {:else}
          <span class="disabled" aria-disabled="true" title={item.title}>
            <span class="label">{item.title}</span>
          </span>
        {/if}
      {/each}
      <button
        type="button"
        class="action"
        aria-label="Refresh"
        title="Refresh"
        aria-busy={refreshing}
        disabled={refreshing}
        onclick={onrefresh}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16M8 16H3v5"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <span class="label">Refresh</span>
      </button>
    </nav>
  </aside>
  <main class:flush={isJobsPath(path) || isContactsPath(path) || isJobBoardsPath(path)}>
    {@render children()}
  </main>
</div>

<style>
  .shell {
    display: grid;
    grid-template-columns: 56px 1fr;
    min-height: 100svh;
    transition: grid-template-columns 160ms ease;
  }

  .shell.expanded {
    grid-template-columns: 180px 1fr;
  }

  .nav {
    display: flex;
    flex-direction: column;
    border-right: 1px solid var(--border);
    padding: 12px 8px;
    background: var(--nav-bg);
    min-width: 0;
  }

  .expanded .nav {
    padding: 16px 12px;
  }

  .brand {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    margin: 0 0 16px;
    padding: 6px 4px;
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: var(--text-h);
    cursor: pointer;
    font: inherit;
    font-weight: 600;
  }

  .brand:hover {
    background: var(--nav-hover);
  }

  .brand-mark {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 8px;
    background: var(--nav-active);
    flex-shrink: 0;
  }

  .brand-name,
  .label {
    overflow: hidden;
    white-space: nowrap;
  }

  .brand-name {
    display: none;
  }

  .expanded .brand {
    justify-content: flex-start;
    padding: 6px 8px;
  }

  .expanded .brand-name,
  .expanded .label {
    display: inline;
  }

  nav {
    display: flex;
    flex-direction: column;
    flex: 1;
    gap: 4px;
    min-height: 0;
  }

  a,
  .disabled,
  .action {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    min-height: 36px;
    padding: 6px;
    border-radius: 8px;
    text-decoration: none;
    color: var(--text);
  }

  .expanded a,
  .expanded .disabled,
  .expanded .action {
    justify-content: flex-start;
    padding: 8px 10px;
  }

  a svg,
  .action svg {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
  }

  .label {
    display: none;
  }

  a:hover,
  .action:hover:not(:disabled) {
    background: var(--nav-hover);
    color: var(--text-h);
  }

  .action {
    width: 100%;
    margin-top: auto;
    border: 0;
    background: transparent;
    cursor: pointer;
    font: inherit;
  }

  .action:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  a.active {
    background: var(--nav-active);
    color: var(--text-h);
  }

  .disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  main {
    padding: 32px 40px;
    min-width: 0;
  }

  main.flush {
    padding: 0;
    display: flex;
    flex-direction: column;
  }
</style>
