<script lang="ts">
  import { onMount } from 'svelte'
  import Layout from './lib/Layout.svelte'
  import Home from './lib/Home.svelte'
  import Jobs from './lib/Jobs.svelte'
  import JobBoards from './lib/JobBoards.svelte'
  import { getPath, isJobBoardsPath, isJobsPath } from './lib/router'

  let path = $state(getPath())

  onMount(() => {
    const onPopState = () => {
      path = getPath()
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  })
</script>

<Layout>
  {#if isJobsPath(path)}
    <Jobs {path} />
  {:else if isJobBoardsPath(path)}
    <JobBoards {path} />
  {:else}
    <Home />
  {/if}
</Layout>
