import cors from 'cors'
import express from 'express'
import { resolveDataDir } from './lib/dataDir.js'
import { getJobBoard, listJobBoards } from './lib/jobBoards.js'
import { getJob, listJobs } from './lib/jobs.js'

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

app.get('/api/jobs/:id', async (req, res) => {
  const result = await getJob(req.params.id)
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
