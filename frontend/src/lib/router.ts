export type NavItem = {
  path: string
  title: string
  enabled: boolean
}

export const navItems: NavItem[] = [
  { path: '/', title: 'Home', enabled: true },
  { path: '/contacts', title: 'Contacts', enabled: false },
  { path: '/job-boards', title: 'Job Boards', enabled: false },
  { path: '/notes', title: 'Notes', enabled: false },
  { path: '/tasks', title: 'Tasks', enabled: false },
]

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
