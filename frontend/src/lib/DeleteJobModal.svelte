<script lang="ts">
  import { DELETE_REASON_LABELS, DELETE_REASONS, parseSkillList, type DeleteReason } from './jobStatus'

  type SkillRow = {
    name: string
    selected: boolean
  }

  let {
    open,
    saving,
    error,
    listedSkills = '',
    oncancel,
    onconfirm,
  }: {
    open: boolean
    saving: boolean
    error: string | null
    listedSkills?: string
    oncancel: () => void
    onconfirm: (reason: DeleteReason, other: string, missingSkills: string[]) => void
  } = $props()

  let reason = $state<DeleteReason>('not_interested')
  let other = $state('')
  let extraSkill = $state('')
  let rows = $state<SkillRow[]>([])
  let submitted = false

  $effect(() => {
    if (open) {
      reason = 'not_interested'
      other = ''
      extraSkill = ''
      submitted = false
      rows = parseSkillList(listedSkills).map((name) => ({
        name,
        selected: false,
      }))
    }
  })

  const selectedSkills = $derived(rows.filter((row) => row.selected).map((row) => row.name))
  const canConfirm = $derived(
    !saving &&
      (reason !== 'other' || other.trim() !== '') &&
      (reason !== 'missing_skills' || selectedSkills.length > 0),
  )

  $effect(() => {
    if (open && !saving) {
      submitted = false
    }
  })

  function addSkill() {
    const name = extraSkill.trim()
    if (!name) {
      return
    }
    if (rows.some((row) => row.name.toLowerCase() === name.toLowerCase())) {
      rows = rows.map((row) =>
        row.name.toLowerCase() === name.toLowerCase() ? { ...row, selected: true } : row,
      )
    } else {
      rows = [...rows, { name, selected: true }]
    }
    extraSkill = ''
  }

  function confirmCurrent() {
    if (!canConfirm || submitted) {
      return
    }
    submitted = true
    onconfirm(reason, other.trim(), reason === 'missing_skills' ? selectedSkills : [])
  }

  function submit(event: SubmitEvent) {
    event.preventDefault()
    confirmCurrent()
  }

  function focusSubmit(node: HTMLButtonElement) {
    node.focus()
  }

  function onWindowKeydown(event: KeyboardEvent) {
    if (!open || event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) {
      return
    }
    if (event.key !== 'Enter' || event.isComposing) {
      return
    }
    const target = event.target
    if (target instanceof HTMLInputElement && target.type === 'text' && extraSkill.trim()) {
      event.preventDefault()
      addSkill()
      return
    }
    if (!canConfirm) {
      return
    }
    event.preventDefault()
    confirmCurrent()
  }
</script>

<svelte:window onkeydown={onWindowKeydown} />

{#if open}
  <div class="backdrop">
    <button type="button" class="scrim" aria-label="Cancel delete" onclick={oncancel}></button>
    <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="delete-job-title" tabindex="-1">
      <h2 id="delete-job-title">Delete job</h2>
      <p class="hint">Choose why you are passing on this listing. The note stays in the vault.</p>
      <form onsubmit={submit}>
        <label>
          Reason
          <select bind:value={reason} disabled={saving}>
            {#each DELETE_REASONS as option (option)}
              <option value={option}>{DELETE_REASON_LABELS[option]}</option>
            {/each}
          </select>
        </label>
        {#if reason === 'other'}
          <label>
            Other reason
            <input type="text" bind:value={other} disabled={saving} />
          </label>
        {/if}
        {#if reason === 'missing_skills'}
          <fieldset>
            <legend>Skills you do not have</legend>
            <p class="hint">
              These are saved on this job and added to your skill gaps list. Other inbox jobs are left alone.
            </p>
            {#if rows.length === 0}
              <p class="hint">No skills listed on this note. Add one below, for example Ruby on Rails.</p>
            {/if}
            <div class="skill-list">
              {#each rows as row, index (row.name)}
                <label class="check">
                  <input type="checkbox" bind:checked={rows[index].selected} disabled={saving} />
                  {row.name}
                </label>
              {/each}
            </div>
            <div class="add-skill">
              <label>
                Add a skill from the listing
                <input
                  type="text"
                  bind:value={extraSkill}
                  disabled={saving}
                  placeholder="Ruby on Rails"
                />
              </label>
              <button type="button" disabled={saving || extraSkill.trim() === ''} onclick={addSkill}>Add</button>
            </div>
          </fieldset>
        {/if}
        {#if error}
          <p class="error">{error}</p>
        {/if}
        <div class="actions">
          <button type="button" disabled={saving} onclick={oncancel}>Cancel</button>
          <button type="submit" class="primary" disabled={!canConfirm} {@attach focusSubmit}>
            {saving ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 20;
    padding: 24px;
  }

  .scrim {
    position: absolute;
    inset: 0;
    border: 0;
    padding: 0;
    background: rgb(15 23 42 / 0.45);
    cursor: pointer;
  }

  .dialog {
    position: relative;
    width: min(34rem, 100%);
    max-height: min(90svh, 44rem);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: var(--bg);
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 20px 20px 16px;
  }

  form {
    display: flex;
    flex-direction: column;
    min-height: 0;
    flex: 1;
  }

  fieldset {
    border: 1px solid var(--border);
    border-radius: 8px;
    margin: 0 0 12px;
    padding: 12px;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .skill-list {
    min-height: 0;
    overflow: auto;
    max-height: 12rem;
    margin-bottom: 8px;
  }

  h2 {
    margin: 0 0 8px;
    font-size: 1.1rem;
    color: var(--text-h);
  }

  .hint {
    margin: 0 0 16px;
    font-size: 0.9rem;
  }

  legend {
    padding: 0 4px;
    color: var(--text-h);
    font-size: 0.85rem;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 12px;
    font-size: 0.85rem;
  }

  .check {
    flex-direction: row;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }

  .add-skill {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 8px;
    align-items: end;
    margin-top: 8px;
  }

  .add-skill label {
    margin-bottom: 0;
  }

  select,
  input[type='text'] {
    font: inherit;
    padding: 8px 10px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--bg);
    color: var(--text-h);
  }

  .error {
    color: #b91c1c;
    margin: 0 0 12px;
    font-size: 0.9rem;
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 8px;
  }

  button {
    font: inherit;
    height: 36px;
    padding: 0 12px;
    border: 1px solid transparent;
    border-radius: 8px;
    background: transparent;
    color: var(--text);
    cursor: pointer;
  }

  button:hover:not(:disabled) {
    background: var(--nav-hover);
    color: var(--text-h);
  }

  button.primary {
    background: var(--nav-active);
    color: var(--text-h);
  }

  button:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
</style>
