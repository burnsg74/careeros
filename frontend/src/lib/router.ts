export type NavItem = {
  path: string
  title: string
  enabled: boolean
}

export const navItems: NavItem[] = [
  { path: '/', title: 'Home', enabled: true },
  { path: '/jobs', title: 'Jobs', enabled: true },
  { path: '/contacts', title: 'Contacts', enabled: true },
  { path: '/job-boards', title: 'Job Boards', enabled: true }
]

export function isNavActive(itemPath: string, path: string): boolean {
  if (itemPath === '/') {
    return path === '/'
  }
  return path === itemPath || path.startsWith(`${itemPath}/`)
}

export function isJobsPath(path: string): boolean {
  return path === '/jobs' || path.startsWith('/jobs/')
}

export function parseJobId(path: string): string | null {
  const match = path.match(/^\/jobs\/([^/]+)$/)
  return match?.[1] ? decodeURIComponent(match[1]) : null
}

export function parseJobApplyId(path: string): string | null {
  const match = path.match(/^\/jobs\/([^/]+)\/apply$/)
  return match?.[1] ? decodeURIComponent(match[1]) : null
}

export function jobDetailPath(id: string): string {
  return `/jobs/${encodeURIComponent(id)}`
}

export function jobApplyPath(id: string): string {
  return `/jobs/${encodeURIComponent(id)}/apply`
}

export function isContactsPath(path: string): boolean {
  return path === '/contacts' || path.startsWith('/contacts/')
}

export function parseContactId(path: string): string | null {
  const match = path.match(/^\/contacts\/([^/]+)$/)
  return match?.[1] ? decodeURIComponent(match[1]) : null
}

export function contactDetailPath(id: string): string {
  return `/contacts/${encodeURIComponent(id)}`
}

export function isJobBoardsPath(path: string): boolean {
  return path === '/job-boards' || path.startsWith('/job-boards/')
}

export function parseJobBoardId(path: string): string | null {
  const match = path.match(/^\/job-boards\/([^/]+)$/)
  return match?.[1] ? decodeURIComponent(match[1]) : null
}

export function jobBoardDetailPath(id: string): string {
  return `/job-boards/${encodeURIComponent(id)}`
}

export function getPath(location: Pick<Location, 'pathname'> = window.location): string {
  const path = location.pathname
  if (path.length > 1 && path.endsWith('/')) {
    return path.slice(0, -1)
  }
  return path || '/'
}

export function navigate(path: string): void {
  if (getPath() === path) {
    return
  }
  history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}
