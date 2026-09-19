import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const defaultDataDir = resolve(fileURLToPath(new URL('../../../data', import.meta.url)))

export function resolveDataDir(raw = process.env.DATA_DIR ?? defaultDataDir): {
  dataDir: string | null
  exists: boolean
} {
  if (!raw) {
    return { dataDir: null, exists: false }
  }

  const dataDir = resolve(raw)
  return { dataDir, exists: existsSync(dataDir) }
}
