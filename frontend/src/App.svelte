<script lang="ts">
  import { onMount } from 'svelte'
  import Layout from './lib/Layout.svelte'
  import Home from './lib/Home.svelte'
  import Jobs from './lib/Jobs.svelte'
  import { getPath, isJobsPath } from './lib/router'

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
  {:else}
    <Home />
  {/if}
</Layout>
