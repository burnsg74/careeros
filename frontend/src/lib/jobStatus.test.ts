import { expect, test } from 'vitest'
import { jobMatchesStage, STATUS_LABELS, STAGE_TABS } from './jobStatus'

test('inbox is new jobs and saved is its own stage', () => {
  expect(jobMatchesStage('new', 'inbox')).toBe(true)
  expect(jobMatchesStage('saved', 'inbox')).toBe(false)
  expect(jobMatchesStage('saved', 'saved')).toBe(true)
  expect(jobMatchesStage('new', 'saved')).toBe(false)
  expect(jobMatchesStage('saved', 'all')).toBe(true)
})

test('saved appears in stage tabs and status labels', () => {
  expect(STAGE_TABS.map((tab) => tab.id)).toContain('saved')
  expect(STATUS_LABELS.saved).toBe('Saved')
})
