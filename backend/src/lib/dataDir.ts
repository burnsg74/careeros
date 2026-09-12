import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

export function resolveDataDir(raw = process.env.DATA_DIR): {
  dataDir: string | null
  exists: boolean
} {
  if (!raw) {
    return { dataDir: null, exists: false }
  }

  const dataDir = resolve(raw)
  return { dataDir, exists: existsSync(dataDir) }
}
