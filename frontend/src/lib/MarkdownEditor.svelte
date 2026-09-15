<script lang="ts">
  import EasyMDE from 'easymde'
  import 'easymde/dist/easymde.min.css'
  import { onDestroy, onMount } from 'svelte'

  // #region agent log
  fetch('http://127.0.0.1:7737/ingest/651a458a-b25b-4cf3-805b-b11e3ebce40f',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d01da5'},body:JSON.stringify({sessionId:'d01da5',runId:'pre-fix',hypothesisId:'A',location:'MarkdownEditor.svelte:module',message:'EasyMDE module evaluated',data:{nowMs:performance.now(),path:location.pathname},timestamp:Date.now()})}).catch(()=>{});
  // #endregion

  let {
    draft = $bindable(''),
    onsave,
  }: {
    draft: string
    onsave: () => void
  } = $props()

  let textarea: HTMLTextAreaElement | undefined
  let editor: EasyMDE | null = null
  let wrapper: HTMLElement | null = null

  function onKeydown(event: KeyboardEvent) {
    if ((event.metaKey || event.ctrlKey) && event.key === 's') {
      event.preventDefault()
      onsave()
    }
  }

  onMount(() => {
    if (!textarea) {
      return
    }

    // #region agent log
    fetch('http://127.0.0.1:7737/ingest/651a458a-b25b-4cf3-805b-b11e3ebce40f',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d01da5'},body:JSON.stringify({sessionId:'d01da5',runId:'pre-fix',hypothesisId:'E',location:'MarkdownEditor.svelte:onMount',message:'EasyMDE constructed (Font Awesome download may start)',data:{nowMs:performance.now(),path:location.pathname},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    editor = new EasyMDE({
      element: textarea,
      initialValue: draft,
      autofocus: true,
      autoDownloadFontAwesome: true,
      spellChecker: false,
      status: false,
      minHeight: '24rem',
      forceSync: true,
      hideIcons: ['preview', 'side-by-side', 'fullscreen'],
      shortcuts: {
        togglePreview: null,
        toggleSideBySide: null,
        toggleFullScreen: null,
      },
    })

    editor.codemirror.on('change', () => {
      if (editor) {
        draft = editor.value()
      }
    })

    wrapper = editor.codemirror.getWrapperElement()
    wrapper.setAttribute('role', 'textbox')
    wrapper.setAttribute('aria-label', 'Markdown')
    wrapper.setAttribute('aria-multiline', 'true')
    wrapper.addEventListener('keydown', onKeydown)
  })

  onDestroy(() => {
    wrapper?.removeEventListener('keydown', onKeydown)
    wrapper = null
    editor?.toTextArea()
    editor = null
  })
</script>

<textarea bind:this={textarea} bind:value={draft} class="editor" aria-label="Markdown" spellcheck="true" onkeydown={onKeydown}></textarea>

<style>
  :global(.editor-toolbar) {
    background: var(--nav-bg);
    border-color: var(--border);
    opacity: 1;
  }

  :global(.editor-toolbar button) {
    color: var(--text);
  }

  :global(.editor-toolbar button:hover),
  :global(.editor-toolbar button.active) {
    background: var(--nav-hover);
    border-color: var(--border);
  }

  :global(.EasyMDEContainer .CodeMirror) {
    background: var(--bg);
    color: var(--text-h);
    border-color: var(--border);
    font: 0.95rem/1.55 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  }

  :global(.EasyMDEContainer .CodeMirror-cursor) {
    border-color: var(--text-h);
  }

  :global(.EasyMDEContainer .cm-header),
  :global(.EasyMDEContainer .cm-strong) {
    color: var(--text-h);
  }

  .editor {
    display: block;
    width: 100%;
    min-height: 28rem;
  }
</style>
