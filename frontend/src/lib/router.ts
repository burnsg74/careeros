export type NavItem = {
  path: string
  title: string
  enabled: boolean
}

export const navItems: NavItem[] = [
  { path: '/', title: 'Home', enabled: true },
  { path: '/jobs', title: 'Jobs', enabled: true },
  { path: '/contacts', title: 'Contacts', enabled: false },
  { path: '/job-boards', title: 'Job Boards', enabled: false }
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

export function jobDetailPath(id: string): string {
  return `/jobs/${encodeURIComponent(id)}`
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
