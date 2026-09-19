import { basename } from 'node:path'
import { resolveDataDir } from './dataDir.js'

export function noteObsidianUrl(folder: string, filename: string): string {
  const { dataDir } = resolveDataDir()
  const vault = process.env.OBSIDIAN_VAULT_NAME ?? basename(dataDir ?? 'CareerOS')
  const file = `${folder}/${filename.replace(/\.md$/i, '')}`
  return `obsidian://open?vault=${encodeURIComponent(vault)}&file=${encodeURIComponent(file)}`
}
