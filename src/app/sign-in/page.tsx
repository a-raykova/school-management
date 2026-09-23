'use client'

import { useState } from 'react'
import { PT_Serif, PT_Sans } from 'next/font/google'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const ptSerif = PT_Serif({ subsets: ['latin', 'cyrillic'], weight: ['400', '700'], variable: '--font-serif' })
const ptSans  = PT_Sans({ subsets: ['latin', 'cyrillic'], weight: ['400', '700'], variable: '--font-sans' })

export default function SignInPage() {
  const supabase = createClient()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSignIn = async () => {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSignIn()
  }

  return (
    <div className={`${ptSerif.variable} ${ptSans.variable} min-h-screen grid grid-cols-1 lg:grid-cols-[1.1fr_1fr]`} style={{ fontFamily: 'var(--font-sans)' }}>
      <style>{`
        @keyframes riseIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .rise-in { animation: riseIn 0.6s ease-out both; }
        .rise-in-delay { animation: riseIn 0.6s ease-out 0.12s both; }
        @media (prefers-reduced-motion: reduce) {
          .rise-in, .rise-in-delay { animation: none; }
        }
      `}</style>

      {/* Brand panel */}
      <div
        className="relative hidden lg:flex flex-col justify-center px-16 py-12 overflow-hidden"
        style={{ backgroundColor: '#1B2A4A' }}
      >
        <div
          className="absolute inset-0 opacity-100"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(185,139,62,0.08) 1px, transparent 1px), ' +
              'linear-gradient(to bottom, rgba(185,139,62,0.08) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at 15% 10%, rgba(255,255,255,0.05), transparent 55%)' }}
        />

        <div className="relative rise-in max-w-sm">
          <div
            className="text-[34px] leading-none mb-3 text-white"
            style={{ fontFamily: 'var(--font-serif)', fontWeight: 700 }}
          >
            ИнтелектИ
          </div>
          <div className="w-10 h-[3px] mb-5" style={{ backgroundColor: '#B98B3E' }} />
          <p className="text-[14.5px] leading-relaxed" style={{ color: '#B7C0D1' }}>
            Every class, every room, every hour — in one place.
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-6 py-16" style={{ backgroundColor: '#F7F5F0' }}>
        <div className="w-full max-w-sm rise-in-delay">
          {/* Mobile-only compact brand mark */}
          <div className="lg:hidden mb-8">
            <div className="text-[22px]" style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, color: '#1B2A4A' }}>
              ИнтелектИ
            </div>
            <div className="w-8 h-[3px] mt-2" style={{ backgroundColor: '#B98B3E' }} />
          </div>

          <h1
            className="text-[26px] mb-1.5"
            style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, color: '#1B2A4A' }}
          >
            Sign in
          </h1>
          <p className="text-[13.5px] mb-7" style={{ color: '#5B6472' }}>
            Enter your email and password to access your dashboard.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-[12px] font-medium mb-1.5" style={{ color: '#5B6472' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="you@school.bg"
                className="w-full px-3.5 py-2.5 rounded-lg text-[14px] transition-colors focus:outline-none"
                style={{
                  border: '1px solid #D8D3C7',
                  color: '#1B2A4A',
                  backgroundColor: '#FFFFFF',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = '#B98B3E'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(185,139,62,0.18)' }}
                onBlur={e => { e.currentTarget.style.borderColor = '#D8D3C7'; e.currentTarget.style.boxShadow = 'none' }}
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium mb-1.5" style={{ color: '#5B6472' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-lg text-[14px] transition-colors focus:outline-none"
                style={{
                  border: '1px solid #D8D3C7',
                  color: '#1B2A4A',
                  backgroundColor: '#FFFFFF',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = '#B98B3E'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(185,139,62,0.18)' }}
                onBlur={e => { e.currentTarget.style.borderColor = '#D8D3C7'; e.currentTarget.style.boxShadow = 'none' }}
              />
            </div>

            {error && (
              <div
                className="flex items-start gap-2 px-3.5 py-2.5 rounded-lg text-[12.5px] leading-snug"
                style={{ backgroundColor: '#FBEEEE', border: '1px solid #E9C3C3', color: '#8B3A3A' }}
              >
                <span className="shrink-0">⚠</span>
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleSignIn}
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-[14px] font-medium transition-colors disabled:opacity-50 focus:outline-none"
              style={{ backgroundColor: '#FFB606', color: '#1B2A4A' }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = '#A67931' }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#FFB606' }}
              onFocus={e => { e.currentTarget.style.boxShadow = '0 0 0 3px rgba(185,139,62,0.35)' }}
              onBlur={e => { e.currentTarget.style.boxShadow = 'none' }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}