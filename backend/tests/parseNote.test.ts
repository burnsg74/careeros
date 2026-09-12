import { describe, expect, it } from 'vitest'
import { parseNote, replaceNoteBody } from '../src/lib/parseNote.js'

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
