import { basename } from 'node:path'
import { resolveDataDir } from './dataDir.js'

export function noteObsidianUrl(folder: string, filename: string): string {
  const { dataDir } = resolveDataDir()
  const vault = basename(dataDir ?? 'CareerOS')
  const file = `${folder}/${filename.replace(/\.md$/i, '')}`
  return `obsidian://open?vault=${encodeURIComponent(vault)}&file=${encodeURIComponent(file)}`
}
