<script lang="ts">
  let {
    editing,
    saving,
    obsidianUrl,
    disabled = false,
    onedit,
    oncancel,
    onsave,
  }: {
    editing: boolean
    saving: boolean
    obsidianUrl: string
    disabled?: boolean
    onedit: () => void
    oncancel: () => void
    onsave: () => void
  } = $props()
</script>

<div class="editor-controls" role="group" aria-label="Markdown editor">
  {#if !editing}
    <button type="button" class="text-btn" aria-label="Edit markdown" disabled={disabled} onclick={onedit}>
      Edit
    </button>
  {:else}
    <button type="button" class="text-btn" aria-label="Cancel editing" disabled={saving} onclick={oncancel}>
      Cancel
    </button>
    <button type="button" class="text-btn primary" aria-label="Save markdown" disabled={saving} onclick={onsave}>
      {saving ? 'Saving…' : 'Save'}
    </button>
  {/if}
  {#if obsidianUrl}
    <a class="text-btn" href={obsidianUrl} aria-label="Open in Obsidian">Obsidian</a>
  {/if}
</div>

<style>
  .editor-controls {
    display: flex;
    gap: 4px;
  }

  .text-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 36px;
    padding: 0 12px;
    border: 1px solid transparent;
    border-radius: 8px;
    background: transparent;
    color: var(--text);
    cursor: pointer;
    font: inherit;
    font-size: 0.9rem;
    text-decoration: none;
  }

  .text-btn:hover:not(:disabled) {
    background: var(--nav-hover);
    color: var(--text-h);
  }

  .text-btn.primary {
    background: var(--nav-active);
    color: var(--text-h);
  }

  .text-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
</style>
