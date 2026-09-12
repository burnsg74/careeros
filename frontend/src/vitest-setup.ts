import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

vi.mock('easymde', () => ({
  default: class EasyMDE {
    constructor(options: { element: HTMLTextAreaElement; initialValue?: string }) {
      this.textarea = options.element
      if (options.initialValue != null) {
        this.textarea.value = options.initialValue
      }
    }

    textarea: HTMLTextAreaElement

    codemirror = {
      on() {},
      setOption() {},
      getWrapperElement() {
        return document.createElement('div')
      },
    }

    value(next?: string) {
      if (next === undefined) {
        return this.textarea.value
      }
      this.textarea.value = next
    }

    toTextArea() {}
  },
}))
