import { NavPage } from '@/types'

export const ROUTES: Record<NavPage, string> = {
  dashboard: '/',
  rooms: '/rooms',
  schedule: '/schedule',
  week: '/week',
  hours: '/hours',
  payments: '/payments',
  announcements: '/announcements',
  profile: '/profile',
}

export function pathnameToNavPage(pathname: string): NavPage {
  if (pathname === '/') return 'dashboard'
  const match = (Object.entries(ROUTES) as [NavPage, string][]).find(
    ([, path]) => path !== '/' && pathname.startsWith(path),
  )
  return match?.[0] ?? 'dashboard'
}
