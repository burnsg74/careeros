import { expect, test } from 'vitest'
import { jobApplyPath, parseJobApplyId, parseJobId } from './router'

test('parseJobId ignores the apply route', () => {
  expect(parseJobId('/jobs/1001')).toBe('1001')
  expect(parseJobId('/jobs/1001/apply')).toBeNull()
})

test('parseJobApplyId reads the apply route', () => {
  expect(parseJobApplyId('/jobs/1001/apply')).toBe('1001')
  expect(parseJobApplyId('/jobs/1001')).toBeNull()
  expect(jobApplyPath('1001')).toBe('/jobs/1001/apply')
})
