'use client'

import { NavPage, CurrentUser, UserRole } from '@/types'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface SidebarProps {
  activePage: NavPage
  onNavigate: (page: NavPage) => void
  user: CurrentUser
  onSwitchRole: (role: UserRole) => void
}

const navItems: { id: NavPage; label: string; icon: string }[] = [
  { id: 'dashboard',     label: 'Dashboard',     icon: '/home1.png' },
  { id: 'rooms',         label: 'Rooms',         icon: '/room.png' },
  { id: 'schedule',      label: 'Schedule',      icon: '/schedule.png' },
  { id: 'week',          label: 'My Week',       icon: '/lesson.png' },
  { id: 'hours',         label: 'Teacher Hours', icon: '/assignment.png' },
  { id: 'payments',      label: 'Payments',      icon: '/dollar.png' },
  { id: 'announcements', label: 'Announcements', icon: '/announcement.png' },
]

export default function Sidebar({ activePage, onNavigate, user, onSwitchRole }: SidebarProps) {
  const portalLabel = user.role === 'admin' ? 'Staff portal' : 'Teacher portal'
  const supabase = createClient()
  const router = useRouter()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/sign-in')
  }

  return (
    <aside className="w-[52px] sm:w-[200px] min-w-[52px] sm:min-w-[200px] bg-white border-r border-gray-100 flex flex-col h-full transition-all">

      {/* Logo */}
      <div className="px-3 sm:px-4 py-5 border-b border-gray-100 overflow-hidden">
        <div className="text-[15px] font-medium text-gray-900 hidden sm:block">ИнтелектИ</div>
        <div className="text-[11px] text-gray-400 mt-0.5 hidden sm:block">{portalLabel}</div>
        {/* mobile: just a dot/initial */}
        <div className="sm:hidden flex items-center justify-center">
          <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center text-[11px] font-medium text-blue-700">
            И
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 overflow-y-auto">
        {navItems
          .filter(item =>
            (item.id !== 'hours'    || user.role === 'admin') &&
            (item.id !== 'payments' || user.role === 'admin') &&
            (item.id !== 'week'     || user.role !== 'admin')
          )
          .map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              title={item.label}
              className={`w-full flex items-center justify-center sm:justify-start gap-2.5 px-0 sm:px-4 py-[9px] text-[13px] transition-colors text-left ${
                activePage === item.id
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              }`}
            >
              <Image
                src={item.icon}
                alt=""
                width={18}
                height={18}
                className={`shrink-0 transition-opacity ${activePage === item.id ? 'opacity-100' : 'opacity-50'}`}
              />
              <span className="hidden sm:block">{item.label}</span>
            </button>
          ))}

        {/* Other section */}
        <div className="mt-4 px-0 sm:px-4">
          <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-2 hidden sm:block">Other</div>
          <div className="space-y-0.5">
            {(['profile', 'settings'] as NavPage[]).map(page => (
              <button
                key={page}
                type="button"
                onClick={() => onNavigate(page)}
                title={page.charAt(0).toUpperCase() + page.slice(1)}
                className={`w-full flex items-center justify-center sm:justify-start gap-2.5 py-[9px] sm:px-0 text-[13px] transition-colors text-left rounded-lg ${
                  activePage === page ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                }`}
              >
                {page === 'profile'
                  ? <Image src="/profile.png" alt="" width={18} height={18} className="shrink-0 opacity-60" />
                  : <Image src="/setting.png" alt="" width={18} height={18} className="shrink-0 opacity-60" />
                }
                <span className="hidden sm:block">
                  {page.charAt(0).toUpperCase() + page.slice(1)}
                </span>
              </button>
            ))}

            {/* Sign out */}
            <button
              type="button"
              onClick={handleSignOut}
              title="Sign out"
              className="w-full flex items-center justify-center sm:justify-start gap-2.5 py-[9px] sm:px-0 text-[13px] transition-colors text-left rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={18}
                height={18}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0 opacity-60"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span className="hidden sm:block">Sign out</span>
            </button>
          </div>
        </div>
      </nav>

      {/* User + role switcher */}
      <div className="px-2 sm:px-4 py-3 border-t border-gray-100 mt-auto">
        <div className="flex items-center justify-center sm:justify-start gap-2">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-medium shrink-0 ${
            user.role === 'admin' ? 'bg-violet-50 text-violet-700' : 'bg-blue-50 text-blue-700'
          }`}>
            {user.initials}
          </div>
          <div className="min-w-0 flex-1 hidden sm:block">
            <div className="text-[12px] font-medium text-gray-800 truncate">{user.firstName} {user.lastName}</div>
            <div className="text-[11px] text-gray-400 truncate">{user.subtitle}</div>
          </div>
        </div>

        {/* Role switcher */}
        <div className="mt-2.5 hidden sm:flex rounded-lg border border-gray-100 overflow-hidden text-[10px]">
          {(['teacher', 'admin'] as UserRole[]).map(role => (
            <button
              key={role}
              type="button"
              onClick={() => onSwitchRole(role)}
              className={`flex-1 py-1.5 font-medium capitalize transition-colors ${
                user.role === role
                  ? role === 'admin' ? 'bg-violet-50 text-violet-800' : 'bg-blue-50 text-blue-800'
                  : 'text-gray-400 hover:bg-gray-50'
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>
    </aside>
  )
}