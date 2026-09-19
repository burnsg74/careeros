<script lang="ts">
  import { onMount } from 'svelte'
  import Layout from './lib/Layout.svelte'
  import Home from './lib/Home.svelte'
  import Jobs from './lib/Jobs.svelte'
  import Contacts from './lib/Contacts.svelte'
  import JobBoards from './lib/JobBoards.svelte'
  import ApplicationQuestions from './lib/ApplicationQuestions.svelte'
  import { bootStores, refreshStores } from './lib/bootStores'
  import { getPath, isContactsPath, isJobBoardsPath, isJobsPath, parseJobApplyId } from './lib/router'

  let path = $state(getPath())
  let refreshing = $state(false)
  const applyJobId = $derived(parseJobApplyId(path))

  bootStores()

  async function refresh() {
    if (refreshing) {
      return
    }
    refreshing = true
    try {
      await refreshStores()
    } finally {
      refreshing = false
    }
  }

  onMount(() => {
    // #region agent log
    fetch('http://127.0.0.1:7737/ingest/651a458a-b25b-4cf3-805b-b11e3ebce40f',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d01da5'},body:JSON.stringify({sessionId:'d01da5',runId:'pre-fix',hypothesisId:'B',location:'App.svelte:onMount',message:'App mounted',data:{nowMs:performance.now(),path},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    const onPopState = () => {
      path = getPath()
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  })
</script>

<Layout onrefresh={refresh} {refreshing}>
  {#if applyJobId}
    <ApplicationQuestions jobId={applyJobId} />
  {:else if isJobsPath(path)}
    <Jobs {path} />
  {:else if isContactsPath(path)}
    <Contacts {path} />
  {:else if isJobBoardsPath(path)}
    <JobBoards {path} />
  {:else}
    <Home />
  {/if}
</Layout>
