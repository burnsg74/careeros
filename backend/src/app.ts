import cors from 'cors'
import express from 'express'
import { resolveDataDir } from './lib/dataDir.js'

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
