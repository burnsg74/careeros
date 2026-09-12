<script lang="ts">
  import { onMount, type Snippet } from 'svelte'
  import { getPath, isJobBoardsPath, isJobsPath, isNavActive, navigate, navItems } from './router'

  let { children }: { children: Snippet } = $props()
  let path = $state(getPath())

  onMount(() => {
    const onPopState = () => {
      path = getPath()
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  })

  function onNavClick(event: MouseEvent, itemPath: string, enabled: boolean) {
    event.preventDefault()
    if (!enabled) {
      return
    }
    navigate(itemPath)
  }
</script>

<div class="shell">
  <aside class="nav">
    <p class="brand">CareerOS</p>
    <nav aria-label="Main">
      {#each navItems as item (item.path)}
        {#if item.enabled}
          <a
            href={item.path}
            class:active={isNavActive(item.path, path)}
            onclick={(event) => onNavClick(event, item.path, item.enabled)}
          >
            {item.title}
          </a>
        {:else}
          <span class="disabled" aria-disabled="true">{item.title}</span>
        {/if}
      {/each}
    </nav>
  </aside>
  <main class:flush={isJobsPath(path) || isJobBoardsPath(path)}>
    {@render children()}
  </main>
</div>

<style>
  .shell {
    display: grid;
    grid-template-columns: 220px 1fr;
    min-height: 100svh;
  }

  .nav {
    border-right: 1px solid var(--border);
    padding: 24px 16px;
    background: var(--nav-bg);
  }

  .brand {
    font-weight: 600;
    color: var(--text-h);
    margin: 0 0 24px;
  }

  nav {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  a,
  .disabled {
    display: block;
    padding: 8px 10px;
    border-radius: 6px;
    text-decoration: none;
    color: var(--text);
  }

  a:hover {
    background: var(--nav-hover);
    color: var(--text-h);
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
