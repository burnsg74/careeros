import { execFileSync, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import net from 'node:net'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium, type Browser, type Page, type Response } from 'playwright'

const JOBS_URL = 'https://wellfound.com/jobs'
const JOB_HREF_RE = /^\/jobs\/(\d+)-([^/?#]+)/
const STARTUP_RESULT = 'div[data-test="StartupResult"]'
const TEXT_BODY_LIMIT = 500_000
const SCROLL_STABLE_ROUNDS = 3
const SCROLL_IDLE_MS = 1_800
const MAX_SCROLLS = 80
const DETAIL_WAIT_MS = 8_000
const BETWEEN_JOBS_MS = 800
const CDP_PORT = Number(process.env.WELLFOUND_CDP_PORT ?? 9222)
const MAX_JOBS = process.env.WELLFOUND_MAX_JOBS
  ? Number(process.env.WELLFOUND_MAX_JOBS)
  : Number.POSITIVE_INFINITY
const CHROME_APP = process.env.WELLFOUND_CHROME_APP ?? 'Google Chrome'
const SRC_USER_DIR =
  process.env.WELLFOUND_CHROME_SRC_DIR ??
  path.join(process.env.HOME ?? '', 'Library/Application Support/Google/Chrome')
const USER_DATA_DIR =
  process.env.WELLFOUND_CHROME_USER_DATA_DIR ??
  path.join(process.env.HOME ?? '', 'Library/Application Support/Google/Chrome-Remote')
const KEEP_USER_DATA_DIR = process.env.WELLFOUND_KEEP_USER_DATA_DIR === '1'
const JOBS_VAULT_DIR =
  process.env.WELLFOUND_JOBS_DIR ??
  path.join(process.env.HOME ?? '', 'Notebooks/CareerOS/4-Jobs')

const SENSITIVE_HEADER = /^(cookie|set-cookie|authorization|x-csrf-token|csrf-token)$/i
const SKIP_PROFILE_NAMES = new Set([
  'Cache',
  'Code Cache',
  'GPUCache',
  'GrShaderCache',
  'ShaderCache',
  'Crashpad',
  'SingletonLock',
  'SingletonCookie',
  'SingletonSocket',
  'DevToolsActivePort',
  'LOCK',
])

type CaptureRecord = {
  id: number
  url: string
  method: string
  resourceType: string
  status: number
  operationName: string | null
  requestHeaders: Record<string, string>
  responseHeaders: Record<string, string>
  requestBody: unknown
  responseBody: unknown
  truncated: boolean
  capturedAt: string
}

type JobLink = { href: string; jobId: string; slug: string; title: string }
type ListingCard = { company: string; text: string; jobs: JobLink[] }

type Tagged = { displayName?: string | null }
type JobPerk = { title?: string | null; description?: string | null }
type JobListing = {
  id?: string | number
  title?: string | null
  slug?: string | null
  compensation?: string | null
  equity?: string | null
  jobType?: string | null
  remote?: boolean | null
  locationNames?: string[] | null
  acceptedRemoteLocationNames?: string[] | null
  skills?: Tagged[] | null
  yearsExperienceMin?: number | null
  liveStartAt?: number | string | null
  description?: string | null
  startup?: {
    name?: string | null
    slug?: string | null
    highConcept?: string | null
    companySize?: string | null
    perks?: JobPerk[] | null
  } | null
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.join(
  scriptDir,
  '..',
  'captures',
  'wellfound',
  new Date().toISOString().replaceAll(':', '-'),
)
const networkDir = path.join(outDir, 'network')
const jobsDir = path.join(outDir, 'jobs')

const captures: CaptureRecord[] = []
let writeChain: Promise<void> = Promise.resolve()
let nextId = 1

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function sanitizeHeaders(headers: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(headers)) {
    out[key] = SENSITIVE_HEADER.test(key) ? '[redacted]' : value
  }
  return out
}

function parseBody(raw: string | null): { value: unknown; truncated: boolean } {
  if (raw == null) return { value: null, truncated: false }
  let truncated = false
  let text = raw
  if (text.length > TEXT_BODY_LIMIT) {
    text = text.slice(0, TEXT_BODY_LIMIT)
    truncated = true
  }
  try {
    return { value: JSON.parse(text), truncated }
  } catch {
    return { value: text, truncated }
  }
}

function graphqlOperationName(url: string, requestBody: unknown): string | null {
  if (requestBody && typeof requestBody === 'object' && !Array.isArray(requestBody)) {
    const name = (requestBody as { operationName?: unknown }).operationName
    if (typeof name === 'string' && name) return name
  }
  if (Array.isArray(requestBody)) {
    const names = requestBody
      .map((item) =>
        item && typeof item === 'object' && 'operationName' in item
          ? String((item as { operationName?: unknown }).operationName ?? '')
          : '',
      )
      .filter(Boolean)
    if (names.length) return names.join('+')
  }
  try {
    const op = new URL(url).searchParams.get('operationName')
    if (op) return op
  } catch {
    // ignore
  }
  return url.includes('graphql') ? 'graphql' : null
}

function isInteresting(response: Response): boolean {
  const type = response.request().resourceType()
  if (type !== 'xhr' && type !== 'fetch') return false
  const url = response.url()
  if (url.includes('graphql')) return true
  const contentType = response.headers()['content-type'] ?? ''
  return contentType.includes('json') || contentType.includes('graphql')
}

function slugFilename(name: string): string {
  return name.replaceAll(/[^a-zA-Z0-9._-]+/g, '-').slice(0, 80) || 'capture'
}

type ChromeProfileInfo = { directory: string; name: string; user: string }

function readLocalState(userDataDir: string): {
  lastUsed: string
  profiles: ChromeProfileInfo[]
} {
  const localStatePath = path.join(userDataDir, 'Local State')
  const raw = JSON.parse(fs.readFileSync(localStatePath, 'utf8')) as {
    profile?: {
      last_used?: string
      info_cache?: Record<string, { name?: string; user_name?: string }>
    }
  }
  const cache = raw.profile?.info_cache ?? {}
  const profiles = Object.entries(cache).map(([directory, meta]) => ({
    directory,
    name: meta.name ?? directory,
    user: meta.user_name ?? '',
  }))
  return { lastUsed: raw.profile?.last_used ?? 'Default', profiles }
}

function resolveProfile(): ChromeProfileInfo {
  const { lastUsed, profiles } = readLocalState(SRC_USER_DIR)
  const requested = process.env.WELLFOUND_CHROME_PROFILE ?? lastUsed
  const known = profiles.map((p) => `${p.directory} (${p.name}${p.user ? `, ${p.user}` : ''})`).join('; ')
  console.log(`Chrome profiles: ${known || '(none)'}`)
  const match = profiles.find((p) => p.directory === requested)
  if (!match) {
    throw new Error(`Chrome profile not found: ${requested}. Available: ${known || '(none)'}`)
  }
  return match
}

function copyDir(src: string, dest: string): void {
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (SKIP_PROFILE_NAMES.has(entry.name) || entry.name.endsWith('.lock')) continue
    const from = path.join(src, entry.name)
    const to = path.join(dest, entry.name)
    try {
      if (entry.isDirectory()) copyDir(from, to)
      else fs.copyFileSync(from, to)
    } catch (err) {
      console.warn(`Skipping ${from}: ${err instanceof Error ? err.message : err}`)
    }
  }
}

function backupSqlite(srcFile: string, destFile: string): void {
  if (!fs.existsSync(srcFile)) return
  fs.mkdirSync(path.dirname(destFile), { recursive: true })
  const destSql = destFile.replaceAll("'", "''")
  const result = spawnSync('sqlite3', [srcFile], {
    input: `.backup '${destSql}'\n`,
    encoding: 'utf8',
  })
  if (result.status !== 0) {
    console.warn(
      `sqlite backup failed for ${srcFile}: ${(result.stderr || result.stdout || 'unknown error').trim()}`,
    )
    fs.copyFileSync(srcFile, destFile)
  }
}

function cloneProfile(srcProfileDir: string, destProfileDir: string, srcUserDir: string, destUserDir: string): void {
  console.log(`Copying ${path.basename(srcProfileDir)} into debug user data dir...`)
  copyDir(srcProfileDir, destProfileDir)
  for (const relative of ['Cookies', path.join('Network', 'Cookies')]) {
    backupSqlite(path.join(srcProfileDir, relative), path.join(destProfileDir, relative))
  }
  const srcLocalState = path.join(srcUserDir, 'Local State')
  const destLocalState = path.join(destUserDir, 'Local State')
  if (fs.existsSync(srcLocalState)) fs.copyFileSync(srcLocalState, destLocalState)
  const srcFirstRun = path.join(srcUserDir, 'First Run')
  const destFirstRun = path.join(destUserDir, 'First Run')
  if (fs.existsSync(srcFirstRun)) fs.copyFileSync(srcFirstRun, destFirstRun)
  else fs.writeFileSync(destFirstRun, '')
}

async function portInUse(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.connect({ host: '127.0.0.1', port }, () => {
      socket.end()
      resolve(true)
    })
    socket.on('error', () => resolve(false))
  })
}

async function waitForCdp(port: number): Promise<void> {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`)
      if (res.ok) return
    } catch {
      // waiting for port
    }
    await sleep(500)
  }
  throw new Error(`Chrome CDP did not become ready on port ${port}`)
}

function chromePids(): number[] {
  try {
    // macOS pgrep treats argv starting with '-' as flags, so omit the '--' prefix.
    const out = execFileSync('pgrep', ['-f', `user-data-dir=${USER_DATA_DIR}`], {
      encoding: 'utf8',
    })
    return out
      .trim()
      .split('\n')
      .map((line) => Number(line))
      .filter((pid) => Number.isInteger(pid) && pid > 0)
  } catch {
    return []
  }
}

async function openChrome(): Promise<Browser> {
  if (!process.env.HOME) throw new Error('HOME is not set')
  await killChrome()
  if (await portInUse(CDP_PORT)) {
    throw new Error(
      `CDP port ${CDP_PORT} is already in use. Quit leftover Chrome-Remote (or whatever is bound to that port) and retry.`,
    )
  }

  const profile = resolveProfile()
  const srcProfileDir = path.join(SRC_USER_DIR, profile.directory)
  const destProfileDir = path.join(USER_DATA_DIR, profile.directory)
  if (!fs.existsSync(srcProfileDir)) {
    throw new Error(`Chrome profile not found: ${srcProfileDir}`)
  }

  const reuseExisting = KEEP_USER_DATA_DIR && fs.existsSync(destProfileDir)
  if (!reuseExisting) {
    fs.rmSync(USER_DATA_DIR, { recursive: true, force: true })
    fs.mkdirSync(USER_DATA_DIR, { recursive: true })
    cloneProfile(srcProfileDir, destProfileDir, SRC_USER_DIR, USER_DATA_DIR)
  } else {
    console.log(`Reusing existing debug profile at ${destProfileDir}`)
  }

  console.log(
    `Launching ${CHROME_APP} profile "${profile.directory}" (${profile.name}${profile.user ? `, ${profile.user}` : ''})`,
  )
  const opened = spawnSync(
    'open',
    [
      '-na',
      CHROME_APP,
      '--args',
      `--remote-debugging-port=${CDP_PORT}`,
      '--remote-debugging-address=127.0.0.1',
      `--user-data-dir=${USER_DATA_DIR}`,
      `--profile-directory=${profile.directory}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-session-crashed-bubble',
      '--hide-crash-restore-bubble',
      JOBS_URL,
    ],
    { encoding: 'utf8' },
  )
  if (opened.status !== 0) {
    throw new Error(`Failed to open Chrome: ${(opened.stderr || opened.stdout || 'unknown error').trim()}`)
  }

  console.log('Waiting for Chrome to launch...')
  try {
    await waitForCdp(CDP_PORT)
    return await chromium.connectOverCDP(`http://127.0.0.1:${CDP_PORT}`)
  } catch (err) {
    await killChrome()
    throw err
  }
}

async function killChrome(): Promise<void> {
  const pids = chromePids()
  for (const pid of pids) {
    try {
      process.kill(pid, 'SIGTERM')
    } catch {
      // already gone
    }
  }
  const deadline = Date.now() + 5_000
  while (Date.now() < deadline && chromePids().length) {
    await sleep(200)
  }
  for (const pid of chromePids()) {
    try {
      process.kill(pid, 'SIGKILL')
    } catch {
      // already gone
    }
  }
  await sleep(300)
}

function enqueueWrite(filePath: string, data: unknown): void {
  enqueueWriteText(filePath, JSON.stringify(data, null, 2))
}

function enqueueWriteText(filePath: string, text: string): void {
  writeChain = writeChain.then(async () => {
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    fs.writeFileSync(filePath, text)
  })
}

function writeNetworkIndex(): void {
  enqueueWrite(
    path.join(networkDir, 'index.json'),
    captures.map(({ requestBody, responseBody, ...meta }) => meta),
  )
}

async function onResponse(response: Response): Promise<void> {
  if (!isInteresting(response)) return
  const request = response.request()
  let requestRaw: string | null = null
  try {
    requestRaw = request.postData()
  } catch {
    requestRaw = null
  }
  let responseRaw: string | null = null
  try {
    responseRaw = await response.text()
  } catch {
    responseRaw = null
  }
  const reqParsed = parseBody(requestRaw)
  const resParsed = parseBody(responseRaw)
  const operationName = graphqlOperationName(response.url(), reqParsed.value)
  const record: CaptureRecord = {
    id: nextId++,
    url: response.url(),
    method: request.method(),
    resourceType: request.resourceType(),
    status: response.status(),
    operationName,
    requestHeaders: sanitizeHeaders(request.headers()),
    responseHeaders: sanitizeHeaders(response.headers()),
    requestBody: reqParsed.value,
    responseBody: resParsed.value,
    truncated: reqParsed.truncated || resParsed.truncated,
    capturedAt: new Date().toISOString(),
  }
  captures.push(record)
  const fileName = `${String(record.id).padStart(3, '0')}-${slugFilename(operationName ?? 'xhr')}.json`
  enqueueWrite(path.join(networkDir, fileName), record)
  writeNetworkIndex()
}

function parseJobHref(href: string): { href: string; jobId: string; slug: string } | null {
  let pathname = href
  try {
    pathname = new URL(href, JOBS_URL).pathname
  } catch {
    // keep as-is
  }
  const match = JOB_HREF_RE.exec(pathname)
  if (!match) return null
  return { href: pathname, jobId: match[1], slug: match[2] }
}

function graphqlVariables(requestBody: unknown): Record<string, unknown> | null {
  if (!requestBody || typeof requestBody !== 'object' || Array.isArray(requestBody)) return null
  const variables = (requestBody as { variables?: unknown }).variables
  if (!variables || typeof variables !== 'object' || Array.isArray(variables)) return null
  return variables as Record<string, unknown>
}

function requestJobId(requestBody: unknown): string | null {
  const variables = graphqlVariables(requestBody)
  const id = variables?.id ?? variables?.jobListingId
  if (typeof id === 'string' && id) return id
  if (typeof id === 'number' && Number.isFinite(id)) return String(id)
  return null
}

function asJobListing(value: unknown): JobListing | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as JobListing
}

function extractJobListing(records: CaptureRecord[], jobId: string): JobListing | null {
  for (const record of records) {
    if (record.operationName !== 'JobListingModalQuery') continue
    const requested = requestJobId(record.requestBody)
    const body = record.responseBody
    if (!body || typeof body !== 'object' || Array.isArray(body)) continue
    const listing = asJobListing((body as { data?: { jobListing?: unknown } }).data?.jobListing)
    if (!listing) continue
    const listingId = listing.id == null ? null : String(listing.id)
    if (requested === jobId || listingId === jobId) return listing
  }
  return null
}

function existingJobIds(dir: string): Set<string> {
  const ids = new Set<string>()
  if (!fs.existsSync(dir)) return ids
  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith('.md')) continue
    const fromName = /\((\d+)\)\.md$/.exec(name)
    if (fromName) ids.add(fromName[1])
    const text = fs.readFileSync(path.join(dir, name), 'utf8')
    const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)
    if (!fm) continue
    const source = /^source_id:\s*"?(\d+)"?\s*$/m.exec(fm[1])
    if (source) ids.add(source[1])
  }
  return ids
}

function postedAtIso(value: unknown): string {
  if (value == null || value === '') return ''
  if (typeof value === 'number' && Number.isFinite(value)) {
    const ms = value > 1e12 ? value : value * 1000
    return new Date(ms).toISOString()
  }
  if (typeof value === 'string') {
    const asNumber = Number(value)
    if (Number.isFinite(asNumber) && value.trim() !== '') return postedAtIso(asNumber)
    const parsed = Date.parse(value)
    if (Number.isFinite(parsed)) return new Date(parsed).toISOString()
  }
  return ''
}

function yamlScalar(value: unknown): string {
  if (value == null || value === '') return ''
  if (typeof value === 'boolean' || typeof value === 'number') return String(value)
  const text = String(value)
  if (/[\n\r]|: |^[&*!|>'"%@`[{]/.test(text) || text !== text.trim()) return JSON.stringify(text)
  return text
}

function joinNames(values: unknown): string {
  if (!Array.isArray(values)) return ''
  return values
    .map((item) => (typeof item === 'string' ? item : (item as Tagged | null)?.displayName))
    .filter((item): item is string => Boolean(item))
    .join(', ')
}

function safeNotePart(value: string): string {
  return value
    .replaceAll(/[\\/:*?"<>|]/g, '-')
    .replaceAll(/\s+/g, ' ')
    .trim()
}

function jobMarkdownPath(dir: string, listing: JobListing, fallbackId: string, fallbackSlug: string): string {
  const id = listing.id == null ? fallbackId : String(listing.id)
  const company = safeNotePart(listing.startup?.name || 'Unknown company') || 'Unknown company'
  const title = safeNotePart(listing.title || fallbackSlug.replaceAll('-', ' ') || 'Job') || 'Job'
  return path.join(dir, `${company} — ${title} (${id}).md`)
}

function toMarkdown(listing: JobListing, href: string, capturedAt: string): string {
  const id = listing.id == null ? '' : String(listing.id)
  const slug = listing.slug || ''
  const title = listing.title || slug || 'Job'
  const company = listing.startup?.name || 'Unknown company'
  const jobUrl = `https://wellfound.com${href.startsWith('/') ? href : `/jobs/${id}-${slug}`}`
  const companySlug = listing.startup?.slug
  const companyUrl = companySlug ? `https://wellfound.com/company/${companySlug}` : ''
  const skills = joinNames(listing.skills)
  const locations = joinNames(listing.locationNames)
  const remoteLocations = joinNames(listing.acceptedRemoteLocationNames)
  const perks = listing.startup?.perks ?? []
  const lines = [
    '---',
    `note_type: Job`,
    `name: ${yamlScalar(title)}`,
    `company: ${yamlScalar(company)}`,
    'source: Wellfound',
    `source_id: "${id}"`,
    `url: ${yamlScalar(jobUrl)}`,
    `company_url: ${yamlScalar(companyUrl)}`,
    `compensation: ${yamlScalar(listing.compensation)}`,
    `equity: ${yamlScalar(listing.equity)}`,
    `job_type: ${yamlScalar(listing.jobType)}`,
    `remote: ${listing.remote == null ? '' : String(listing.remote)}`,
    `locations: ${yamlScalar(locations)}`,
    `remote_locations: ${yamlScalar(remoteLocations)}`,
    `experience_min: ${listing.yearsExperienceMin == null ? '' : String(listing.yearsExperienceMin)}`,
    `skills: ${yamlScalar(skills)}`,
    `posted_at: ${postedAtIso(listing.liveStartAt)}`,
    `captured_at: ${capturedAt}`,
    'status: new',
    '---',
    '',
    `[Wellfound](${jobUrl})`,
    '',
  ]
  if (listing.startup?.highConcept) {
    lines.push(listing.startup.highConcept, '')
  }
  if (companyUrl) {
    lines.push(`[${company}](${companyUrl})`, '')
  }
  if (locations || remoteLocations) {
    lines.push('## Locations', '')
    if (locations) lines.push(`- ${locations}`)
    if (remoteLocations) lines.push(`- Remote: ${remoteLocations}`)
    lines.push('')
  }
  if (perks.length) {
    lines.push('## Perks', '')
    for (const perk of perks) {
      const perkTitle = perk.title?.trim()
      const perkDesc = perk.description?.trim()
      if (!perkTitle && !perkDesc) continue
      lines.push(perkDesc && perkTitle ? `- **${perkTitle}** — ${perkDesc}` : `- ${perkTitle || perkDesc}`)
    }
    lines.push('')
  }
  if (listing.description?.trim()) {
    lines.push(listing.description.trim(), '')
  }
  return lines.join('\n')
}

async function readListings(page: Page): Promise<{ cards: ListingCard[]; jobUrls: string[] }> {
  return page.evaluate(({ selector, origin }) => {
    const jobHrefRe = /^\/jobs\/(\d+)-([^/?#]+)/
    const cards = [...document.querySelectorAll(selector)].map((card) => {
      const links = [...card.querySelectorAll('a[href]')]
        .map((a) => {
          const href = a.getAttribute('href') ?? ''
          let pathname = href
          try {
            pathname = new URL(href, origin).pathname
          } catch {
            // keep
          }
          const match = jobHrefRe.exec(pathname)
          if (!match) return null
          return {
            href: pathname,
            jobId: match[1],
            slug: match[2],
            title: (a.textContent ?? '').replace(/\s+/g, ' ').trim(),
          }
        })
        .filter((job): job is NonNullable<typeof job> => job !== null)
      const heading =
        card.querySelector('h2, h3, [data-test*="Startup"], a[href^="/company"]')?.textContent ?? ''
      return {
        company: heading.replace(/\s+/g, ' ').trim(),
        text: (card.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 2000),
        jobs: links,
      }
    })
    const jobUrls = [...new Set(cards.flatMap((card) => card.jobs.map((job) => job.href)))]
    return { cards, jobUrls }
  }, { selector: STARTUP_RESULT, origin: JOBS_URL })
}

async function scrollUntilStable(page: Page): Promise<void> {
  await page.waitForSelector(STARTUP_RESULT, { timeout: 30_000 })
  let stable = 0
  let lastKey = ''
  for (let i = 0; i < MAX_SCROLLS; i++) {
    const { cards, jobUrls } = await readListings(page)
    const key = `${cards.length}:${jobUrls.length}`
    console.log(`Scroll ${i + 1}: ${cards.length} startups, ${jobUrls.length} jobs`)
    if (key === lastKey) {
      stable += 1
      if (stable >= SCROLL_STABLE_ROUNDS) {
        console.log('Listing growth stopped')
        return
      }
    } else {
      stable = 0
      lastKey = key
    }
    await page.evaluate((selector) => {
      const cards = document.querySelectorAll(selector)
      const last = cards[cards.length - 1]
      last?.scrollIntoView({ block: 'end' })
      const overflowParent = last?.parentElement
      if (overflowParent && overflowParent.scrollHeight > overflowParent.clientHeight) {
        overflowParent.scrollTop = overflowParent.scrollHeight
      }
      window.scrollBy(0, window.innerHeight)
    }, STARTUP_RESULT)
    await sleep(SCROLL_IDLE_MS)
  }
  console.warn(`Reached max scrolls (${MAX_SCROLLS})`)
}

async function closeJobDetail(page: Page): Promise<void> {
  await page.keyboard.press('Escape')
  await sleep(400)
  if (!/\/jobs\/\d+-/.test(new URL(page.url()).pathname)) return
  await page.goBack({ waitUntil: 'domcontentloaded' }).catch(() => undefined)
  await page.waitForSelector(STARTUP_RESULT, { timeout: 15_000 }).catch(() => undefined)
}

async function captureJobDetails(page: Page, jobUrls: string[]): Promise<{ skipped: number; written: number; failed: number }> {
  const knownIds = existingJobIds(JOBS_VAULT_DIR)
  console.log(`Vault ${JOBS_VAULT_DIR}: ${knownIds.size} existing job notes`)
  const limit = Math.min(jobUrls.length, MAX_JOBS)
  fs.mkdirSync(jobsDir, { recursive: true })
  fs.mkdirSync(JOBS_VAULT_DIR, { recursive: true })
  let skipped = 0
  let written = 0
  let failed = 0
  for (let i = 0; i < limit; i++) {
    const parsed = parseJobHref(jobUrls[i])
    if (!parsed) continue
    if (knownIds.has(parsed.jobId)) {
      skipped += 1
      console.log(`Job ${i + 1}/${limit}: skip ${parsed.href} (already captured)`)
      continue
    }
    const startId = nextId
    const locator = page.locator(`a[href="${parsed.href}"], a[href*="${parsed.href}"]`).first()
    console.log(`Job ${i + 1}/${limit}: ${parsed.href}`)
    try {
      if (await locator.count()) {
        await locator.click({ timeout: 5_000 })
      } else {
        await page.goto(`https://wellfound.com${parsed.href}`, { waitUntil: 'domcontentloaded' })
      }
      const deadline = Date.now() + DETAIL_WAIT_MS
      let listing: JobListing | null = null
      while (Date.now() < deadline) {
        listing = extractJobListing(captures.filter((c) => c.id >= startId), parsed.jobId)
        if (listing) break
        await sleep(200)
      }
      if (!listing) {
        listing = extractJobListing(captures, parsed.jobId)
      }
      const related = captures.filter((c) => c.id >= startId)
      enqueueWrite(path.join(jobsDir, `${parsed.jobId}-${slugFilename(parsed.slug)}.json`), related)
      if (!listing) {
        failed += 1
        console.warn(`No JobListingModalQuery for ${parsed.href}`)
      } else {
        const capturedAt = new Date().toISOString()
        const mdPath = jobMarkdownPath(JOBS_VAULT_DIR, listing, parsed.jobId, parsed.slug)
        enqueueWriteText(mdPath, toMarkdown(listing, parsed.href, capturedAt))
        knownIds.add(parsed.jobId)
        written += 1
        console.log(`Wrote ${path.basename(mdPath)}`)
      }
    } catch (err) {
      failed += 1
      console.warn(`Failed ${parsed.href}: ${err instanceof Error ? err.message : err}`)
      enqueueWrite(path.join(jobsDir, `${parsed.jobId}-${slugFilename(parsed.slug)}.json`), {
        error: err instanceof Error ? err.message : String(err),
        captures: captures.filter((c) => c.id >= startId),
      })
    }
    await closeJobDetail(page)
    await sleep(BETWEEN_JOBS_MS)
  }
  return { skipped, written, failed }
}

async function jobsPage(browser: Browser): Promise<Page> {
  let context = browser.contexts()[0]
  for (let i = 0; i < 20 && !context; i++) {
    await sleep(250)
    context = browser.contexts()[0]
  }
  if (!context) {
    throw new Error('Chrome launched but has no profile context; refusing to open a blank session')
  }
  let page =
    context.pages().find((p) => p.url().includes('wellfound.com')) ?? context.pages()[0]
  if (!page) page = await context.newPage()
  if (!page.url().includes('wellfound.com/jobs')) {
    await page.goto(JOBS_URL, { waitUntil: 'domcontentloaded' })
  }
  return page
}

async function main(): Promise<void> {
  fs.mkdirSync(networkDir, { recursive: true })
  let browser: Browser | undefined
  try {
    browser = await openChrome()
    const page = await jobsPage(browser)
    page.on('response', (response) => {
      void onResponse(response)
    })
    await scrollUntilStable(page)
    const listings = await readListings(page)
    enqueueWrite(path.join(outDir, 'listings.json'), listings)
    const jobStats = await captureJobDetails(page, listings.jobUrls)
    await writeChain
    writeNetworkIndex()
    await writeChain
    console.log(
      `Wrote ${captures.length} network captures, ${listings.jobUrls.length} listing jobs to ${outDir}; vault notes written=${jobStats.written} skipped=${jobStats.skipped} failed=${jobStats.failed}`,
    )
  } finally {
    pageOffSafe(browser)
    try {
      await browser?.close()
    } catch {
      // ignore
    }
    await killChrome()
    if (!KEEP_USER_DATA_DIR) {
      try {
        fs.rmSync(USER_DATA_DIR, { recursive: true, force: true })
        console.log(`Removed temporary user data dir ${USER_DATA_DIR}`)
      } catch (err) {
        console.warn(`Could not remove ${USER_DATA_DIR}: ${err instanceof Error ? err.message : err}`)
      }
    } else {
      console.log(`Keeping debug user data dir ${USER_DATA_DIR}`)
    }
  }
}

function pageOffSafe(browser: Browser | undefined): void {
  if (!browser) return
  for (const context of browser.contexts()) {
    for (const page of context.pages()) {
      page.removeAllListeners('response')
    }
  }
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
