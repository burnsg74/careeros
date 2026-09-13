import { describe, expect, it } from 'vitest'
import { parseNote, replaceNoteBody, upsertFrontmatter } from '../src/lib/parseNote.js'

describe('replaceNoteBody', () => {
  it('replaces the body and preserves frontmatter', () => {
    const raw = `---
note_type: Job Boards
rank: "1"
---

Old notes.
`

    const next = replaceNoteBody(raw, 'Updated **notes**.')

    expect(next).toBe(`---
note_type: Job Boards
rank: "1"
---

Updated **notes**.
`)
    expect(parseNote(next).properties.rank).toBe('1')
    expect(parseNote(next).body).toBe('Updated **notes**.')
  })

  it('writes notes that have no frontmatter', () => {
    expect(replaceNoteBody('just text', 'new body')).toBe('new body\n')
  })
})

describe('upsertFrontmatter', () => {
  it('replaces existing keys and appends new ones', () => {
    const raw = `---
note_type: Job
name: Senior Engineer
---

Ship the product.
`

    const next = upsertFrontmatter(raw, {
      status: 'applied',
      name: 'Staff Engineer',
    })

    expect(next).toBe(`---
note_type: Job
name: Staff Engineer
status: applied
---

Ship the product.
`)
    expect(parseNote(next).properties.status).toBe('applied')
    expect(parseNote(next).body).toBe('Ship the product.')
  })

  it('quotes values that need YAML escaping', () => {
    const raw = `---
note_type: Job
---
`

    const next = upsertFrontmatter(raw, {
      deleted_reason_other: 'too: noisy',
    })

    expect(parseNote(next).properties.deleted_reason_other).toBe('too: noisy')
  })
})
