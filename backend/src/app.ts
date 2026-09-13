import cors from 'cors'
import express from 'express'
import { resolveDataDir } from './lib/dataDir.js'
import { getContact, listContacts, updateContactBody } from './lib/contacts.js'
import { getJobBoard, listJobBoards, updateJobBoardBody } from './lib/jobBoards.js'
import { parseJobStatusPatch } from './lib/jobStatus.js'
import { getJob, listJobs, screenInboxJobs, updateJobBody, updateJobStatus } from './lib/jobs.js'

function readBody(value: unknown): string | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }
  const body = (value as { body?: unknown }).body
  return typeof body === 'string' ? body : null
}

export const app = express()

app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => {
  const { dataDir, exists } = resolveDataDir()
  res.json({
    ok: Boolean(dataDir && exists),
    dataDir,
  })
})

app.get('/api/jobs', async (_req, res) => {
  const result = await listJobs()
  if (!result.ok) {
    res.status(result.status).json({ error: result.error })
    return
  }
  res.json(result.value)
})

app.post('/api/jobs/screen', async (_req, res) => {
  const result = await screenInboxJobs()
  if (!result.ok) {
    res.status(result.status).json({ error: result.error })
    return
  }
  res.json(result.value)
})

app.get('/api/jobs/:id', async (req, res) => {
  const result = await getJob(req.params.id)
  if (!result.ok) {
    res.status(result.status).json({ error: result.error })
    return
  }
  res.json(result.value)
})

app.put('/api/jobs/:id', async (req, res) => {
  const body = readBody(req.body)
  if (body === null) {
    res.status(400).json({ error: 'body is required' })
    return
  }
  const result = await updateJobBody(req.params.id, body)
  if (!result.ok) {
    res.status(result.status).json({ error: result.error })
    return
  }
  res.json(result.value)
})

app.patch('/api/jobs/:id/status', async (req, res) => {
  const parsed = parseJobStatusPatch(req.body)
  if (!parsed.ok) {
    res.status(400).json({ error: parsed.error })
    return
  }
  const result = await updateJobStatus(req.params.id, parsed.patch)
  if (!result.ok) {
    res.status(result.status).json({ error: result.error })
    return
  }
  res.json(result.value)
})

app.get('/api/contacts', async (_req, res) => {
  const result = await listContacts()
  if (!result.ok) {
    res.status(result.status).json({ error: result.error })
    return
  }
  res.json(result.value)
})

app.get('/api/contacts/:id', async (req, res) => {
  const result = await getContact(req.params.id)
  if (!result.ok) {
    res.status(result.status).json({ error: result.error })
    return
  }
  res.json(result.value)
})

app.put('/api/contacts/:id', async (req, res) => {
  const body = readBody(req.body)
  if (body === null) {
    res.status(400).json({ error: 'body is required' })
    return
  }
  const result = await updateContactBody(req.params.id, body)
  if (!result.ok) {
    res.status(result.status).json({ error: result.error })
    return
  }
  res.json(result.value)
})

app.get('/api/job-boards', async (_req, res) => {
  const result = await listJobBoards()
  if (!result.ok) {
    res.status(result.status).json({ error: result.error })
    return
  }
  res.json(result.value)
})

app.get('/api/job-boards/:id', async (req, res) => {
  const result = await getJobBoard(req.params.id)
  if (!result.ok) {
    res.status(result.status).json({ error: result.error })
    return
  }
  res.json(result.value)
})

app.put('/api/job-boards/:id', async (req, res) => {
  const body = readBody(req.body)
  if (body === null) {
    res.status(400).json({ error: 'body is required' })
    return
  }
  const result = await updateJobBoardBody(req.params.id, body)
  if (!result.ok) {
    res.status(result.status).json({ error: result.error })
    return
  }
  res.json(result.value)
})
