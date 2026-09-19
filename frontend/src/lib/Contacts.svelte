<script lang="ts">
  import { untrack } from 'svelte'
  import { marked } from 'marked'
  import EditorControls from './EditorControls.svelte'
  import MarkdownEditor from './MarkdownEditor.svelte'
  import { contactsStore } from './contactsStore.svelte'
  import { contactDetailPath, navigate, parseContactId } from './router'

  let { path }: { path: string } = $props()

  contactsStore.start()

  let lastContactId = $state<string | null>(null)
  let editing = $state(false)
  let saving = $state(false)
  let saveError = $state<string | null>(null)
  let draft = $state('')

  const contactId = $derived(parseContactId(path))
  const contacts = $derived(contactsStore.list)
  const listError = $derived(contactsStore.error)
  const listLoading = $derived(contactsStore.listLoading)
  const detail = $derived(contactId ? (contactsStore.getDetail(contactId) ?? null) : null)
  const detailError = $derived(contactId ? contactsStore.detailError(contactId) : null)
  const detailLoading = $derived(contactId ? contactsStore.isDetailLoading(contactId) : false)
  const isDetail = $derived(contactId !== null)
  const currentIndex = $derived(contactId ? contacts.findIndex((contact) => contact.id === contactId) : -1)
  const previousContact = $derived(currentIndex > 0 ? contacts[currentIndex - 1] : null)
  const nextContact = $derived(
    currentIndex >= 0 && currentIndex < contacts.length - 1 ? contacts[currentIndex + 1] : null,
  )
  const detailTargetId = $derived(lastContactId ?? contacts[0]?.id ?? null)

  $effect(() => {
    const id = contactId
    void contactsStore.epoch
    if (!id) {
      editing = false
      saveError = null
      return
    }
    editing = false
    saveError = null
    lastContactId = id
    untrack(() => {
      void contactsStore.ensureDetail(id)
    })
  })

  function openList() {
    navigate('/contacts')
  }

  function openDetailView() {
    if (!detailTargetId) {
      return
    }
    navigate(contactDetailPath(detailTargetId))
  }

  function openContact(id: string) {
    lastContactId = id
    navigate(contactDetailPath(id))
  }

  function onRowKeydown(event: KeyboardEvent, id: string) {
    if (event.target instanceof HTMLAnchorElement) {
      return
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      openContact(id)
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
    if (!contactId) {
      return
    }
    saving = true
    saveError = null
    try {
      await contactsStore.saveBody(contactId, draft)
      editing = false
    } catch {
      saveError = 'Could not save contact'
    } finally {
      saving = false
    }
  }
</script>

<div class="page">
  <header class="toolbar">
    <div class="views" role="toolbar" aria-label="Contacts views">
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
    <div class="toolbar-end">
      {#if isDetail && detail && !detailLoading && !detailError}
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
      <div class="nav-contacts" role="group" aria-label="Contact navigation">
        <button
          type="button"
          class="icon-btn"
          aria-label="Previous contact"
          disabled={!previousContact}
          onclick={() => previousContact && openContact(previousContact.id)}
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
          aria-label="Next contact"
          disabled={!nextContact}
          onclick={() => nextContact && openContact(nextContact.id)}
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

  {#if !isDetail}
    <section class="list-pane">
      {#if listLoading}
        <p class="status">Loading contacts…</p>
      {:else if listError}
        <p class="status error">{listError}</p>
      {:else if contacts.length === 0}
        <p class="status">No contacts yet.</p>
      {:else}
        <div class="contact-list" role="table" aria-label="Contacts">
          <div class="contact-row header" role="row">
            <span role="columnheader">Name</span>
            <span role="columnheader">URL</span>
          </div>
          {#each contacts as contact (contact.id)}
            <div
              class="contact-row"
              role="row"
              tabindex="0"
              onclick={() => openContact(contact.id)}
              onkeydown={(event) => onRowKeydown(event, contact.id)}
            >
              <span class="name" role="cell">{contact.name}</span>
              <span class="meta" role="cell">
                {#if contact.url}
                  <a
                    href={contact.url}
                    target="_blank"
                    rel="noreferrer"
                    onclick={(event) => event.stopPropagation()}
                  >
                    {contact.url}
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
  {:else if detail}
    <div class="detail">
      <article class="content">
        <h1>{detail.name}</h1>
        {#if detail.url}
          <p class="subtitle">
            <a href={detail.url} target="_blank" rel="noreferrer">{detail.url}</a>
          </p>
        {/if}
        {#if saveError}
          <p class="save-error">{saveError}</p>
        {/if}
        {#if editing}
          <MarkdownEditor bind:draft onsave={() => void saveEdit()} />
        {:else}
          {@html marked.parse(detail.body, { async: false })}
        {/if}
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
  {:else if detailLoading}
    <p class="status">Loading contact…</p>
  {:else if detailError}
    <p class="status error">{detailError}</p>
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
  .nav-contacts,
  .toolbar-end {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .toolbar-end {
    gap: 12px;
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

  .contact-list {
    list-style: none;
    margin: 0;
    padding: 0;
    border-top: 1px solid var(--border);
  }

  .contact-row {
    display: grid;
    grid-template-columns: minmax(10rem, 1fr) minmax(12rem, 1.6fr);
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

  .contact-row.header {
    cursor: default;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--text);
    padding-top: 8px;
    padding-bottom: 8px;
  }

  .contact-row:not(.header):hover {
    background: var(--nav-hover);
  }

  .contact-row:not(.header):focus-visible {
    outline: 2px solid var(--text-h);
    outline-offset: -2px;
  }

  .meta a {
    color: inherit;
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

  .save-error {
    color: #b91c1c;
    margin: 0 0 16px;
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
