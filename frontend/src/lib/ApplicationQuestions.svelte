<script lang="ts">
  import { untrack } from 'svelte'
  import { marked } from 'marked'
  import {
    createApplicationQuestion,
    fetchApplicationQuestions,
    generateApplicationAnswer,
    type ApplicationQuestion,
  } from './applicationQuestions'
  import { HttpError } from './http'
  import { jobsStore } from './jobsStore.svelte'
  import { jobDetailPath, navigate } from './router'

  let { jobId }: { jobId: string } = $props()

  jobsStore.start()

  let questions = $state<ApplicationQuestion[]>([])
  let questionsError = $state<string | null>(null)
  let questionsLoading = $state(true)
  let selectedId = $state<string | null>(null)
  let newTitle = $state('')
  let adding = $state(false)
  let generating = $state(false)
  let answer = $state('')
  let error = $state<string | null>(null)
  let copied = $state(false)
  let generateGen = 0

  const detail = $derived(jobsStore.getDetail(jobId) ?? null)
  const detailError = $derived(jobsStore.detailError(jobId))
  const detailLoading = $derived(jobsStore.isDetailLoading(jobId))
  const postingHtml = $derived(
    detail?.body ? marked.parse(detail.body, { async: false }) : '',
  )
  const postingUrl = $derived(detail?.properties.url || detail?.url || '')
  const companyUrl = $derived(detail?.properties.company_url || detail?.company_url || '')

  $effect(() => {
    const id = jobId
    void jobsStore.epoch
    untrack(() => {
      void jobsStore.ensureDetail(id)
    })
  })

  async function loadQuestions() {
    questionsLoading = true
    questionsError = null
    try {
      questions = await fetchApplicationQuestions()
    } catch {
      questionsError = 'Could not load questions'
    } finally {
      questionsLoading = false
    }
  }

  void loadQuestions()

  function backToJob() {
    navigate(jobDetailPath(jobId))
  }

  async function selectQuestion(question: ApplicationQuestion) {
    selectedId = question.id
    copied = false
    await generateAnswer(question.id)
  }

  async function generateAnswer(questionId: string) {
    const gen = ++generateGen
    generating = true
    error = null
    try {
      const next = await generateApplicationAnswer(jobId, questionId)
      if (gen !== generateGen) {
        return
      }
      answer = next
    } catch (err) {
      if (gen !== generateGen) {
        return
      }
      answer = ''
      error = err instanceof HttpError ? err.message : 'Could not generate answer'
    } finally {
      if (gen === generateGen) {
        generating = false
      }
    }
  }

  async function addQuestion(event: SubmitEvent) {
    event.preventDefault()
    const title = newTitle.trim()
    if (!title) {
      return
    }
    adding = true
    error = null
    try {
      const created = await createApplicationQuestion(title)
      if (!questions.some((question) => question.id === created.id)) {
        questions = [...questions, created]
      }
      newTitle = ''
      await selectQuestion(created)
    } catch (err) {
      error = err instanceof HttpError ? err.message : 'Could not add question'
    } finally {
      adding = false
    }
  }

  async function copyAnswer() {
    if (!answer) {
      return
    }
    try {
      await navigator.clipboard.writeText(answer)
      copied = true
    } catch {
      copied = false
    }
  }
</script>

<section class="page">
  <header class="toolbar">
    <button type="button" class="text-btn" onclick={backToJob}>Back</button>
    <div class="heading">
      {#if companyUrl}
        <a class="eyebrow-link" href={companyUrl} target="_blank" rel="noreferrer">{detail?.company}</a>
      {:else}
        <p class="eyebrow">{detail?.company || 'Job'}</p>
      {/if}
      <div class="title-row">
        <h1>{detail?.name || 'Application questions'}</h1>
        {#if postingUrl}
          <a class="listing-link" href={postingUrl} target="_blank" rel="noreferrer">Open listing</a>
        {/if}
      </div>
    </div>
  </header>

  {#if detailError}
    <p class="banner" role="alert">{detailError}</p>
  {:else if detailLoading && !detail}
    <p class="muted">Loading job…</p>
  {:else}
    <div class="split">
      <article class="posting">
        <h2>Job posting</h2>
        {#if postingHtml}
          <div class="prose">
            {@html postingHtml}
          </div>
        {:else}
          <p class="muted">No posting text.</p>
        {/if}
      </article>

      <aside class="panel">
        <h2>Questions</h2>
        {#if questionsError}
          <p class="banner" role="alert">{questionsError}</p>
        {:else if questionsLoading}
          <p class="muted">Loading questions…</p>
        {:else}
          <ul class="questions">
            {#each questions as question (question.id)}
              <li>
                <button
                  type="button"
                  class={['question', selectedId === question.id && 'active']}
                  onclick={() => void selectQuestion(question)}
                  disabled={generating || adding}
                >
                  {question.title}
                </button>
              </li>
            {/each}
          </ul>
        {/if}

        <form class="add" onsubmit={addQuestion}>
          <label>
            <span class="sr-only">New question</span>
            <input
              type="text"
              bind:value={newTitle}
              placeholder="Add a question"
              disabled={adding}
            />
          </label>
          <button type="submit" class="text-btn primary" disabled={adding || !newTitle.trim()}>
            Add
          </button>
        </form>

        <div class="answer-head">
          <h2>Answer</h2>
          <button type="button" class="text-btn" onclick={() => void copyAnswer()} disabled={!answer}>
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        {#if error}
          <p class="banner" role="alert">{error}</p>
        {/if}
        {#if generating}
          <p class="muted">Generating answer…</p>
        {/if}
        <textarea bind:value={answer} rows="12" spellcheck="true" aria-label="Answer"></textarea>
      </aside>
    </div>
  {/if}
</section>

<style>
  .page {
    display: flex;
    flex-direction: column;
    min-height: 0;
    height: 100%;
  }

  .toolbar {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 20px;
    border-bottom: 1px solid var(--border);
  }

  .heading {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .heading h1 {
    margin: 0;
    font-size: 1.15rem;
    line-height: 1.25;
  }

  .title-row {
    display: flex;
    align-items: baseline;
    gap: 10px;
    flex-wrap: wrap;
  }

  .eyebrow,
  .eyebrow-link {
    margin: 0;
    font-size: 0.8rem;
    color: var(--text);
  }

  .eyebrow-link,
  .listing-link {
    color: var(--link);
    text-decoration: none;
  }

  .eyebrow-link:hover,
  .listing-link:hover {
    text-decoration: underline;
  }

  .listing-link {
    font-size: 0.85rem;
    white-space: nowrap;
  }

  .split {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(280px, 420px);
    gap: 0;
    flex: 1;
    min-height: 0;
  }

  .posting,
  .panel {
    min-height: 0;
    overflow: auto;
    padding: 16px 20px 32px;
  }

  .posting {
    border-right: 1px solid var(--border);
  }

  h2 {
    margin: 0 0 12px;
    font-size: 0.95rem;
    color: var(--text-h);
  }

  .questions {
    list-style: none;
    margin: 0 0 16px;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .question,
  .text-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 36px;
    padding: 8px 12px;
    border: 1px solid transparent;
    border-radius: 8px;
    background: transparent;
    color: var(--text);
    cursor: pointer;
    font: inherit;
    font-size: 0.85rem;
    text-align: left;
  }

  .question {
    width: 100%;
    border-color: var(--border);
    background: var(--bg);
  }

  .question:hover:not(:disabled),
  .text-btn:hover:not(:disabled) {
    background: var(--nav-hover);
    color: var(--text-h);
  }

  .question.active,
  .text-btn.primary {
    background: var(--nav-active);
    color: var(--text-h);
  }

  .text-btn:disabled,
  .question:disabled {
    opacity: 0.55;
    cursor: default;
  }

  .add {
    display: flex;
    gap: 8px;
    margin: 0 0 20px;
  }

  .add label {
    flex: 1;
    min-width: 0;
  }

  .add input,
  textarea {
    width: 100%;
    font: inherit;
    color: var(--text-h);
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--bg);
    padding: 8px 10px;
  }

  textarea {
    resize: vertical;
    min-height: 160px;
    color: var(--text-body);
  }

  .answer-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin: 0 0 8px;
  }

  .answer-head h2 {
    margin: 0;
  }

  .banner {
    margin: 0 20px 12px;
    color: #b91c1c;
  }

  .muted {
    color: var(--text);
    font-size: 0.9rem;
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

  .prose :global(p),
  .prose :global(ul),
  .prose :global(ol) {
    margin: 0 0 0.7em;
  }

  .prose :global(a) {
    color: var(--link);
  }

  @media (max-width: 900px) {
    .split {
      grid-template-columns: 1fr;
    }

    .posting {
      border-right: 0;
      border-bottom: 1px solid var(--border);
    }
  }
</style>
