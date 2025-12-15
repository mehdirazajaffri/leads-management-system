'use client'

import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid email or password')
      } else {
        // Redirect based on role will be handled by middleware
        router.push('/admin/dashboard')
        router.refresh()
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen app-surface flex items-center justify-center px-4">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Left marketing panel (Material Dashboard vibe) */}
        <div className="hidden lg:flex rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 text-white p-10 shadow-xl border border-slate-700/50">
          <div className="flex flex-col justify-between w-full">
            <div>
              <div className="text-xs tracking-widest uppercase text-slate-300">Leads</div>
              <h1 className="mt-3 text-3xl font-semibold leading-tight">
                Leads Management System
              </h1>
              <p className="mt-3 text-slate-300">
                Upload, assign, track status changes, and monitor conversion performance—cleanly and fast.
              </p>
              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                  <div className="text-sm font-semibold">Admin</div>
                  <div className="text-xs text-slate-300 mt-1">CSV import, assignment, analytics</div>
                </div>
                <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                  <div className="text-sm font-semibold">Agent</div>
                  <div className="text-xs text-slate-300 mt-1">Lead pipeline + callbacks</div>
                </div>
              </div>
            </div>
            <div className="text-xs text-slate-400">
              <br />
              Copyright © 2025 Platinum Healthcare. All rights reserved.
            </div>
          </div>
        </div>

        {/* Right login card */}
        <div className="card rounded-2xl">
          <div className="card-header">
            <div className="text-xs uppercase tracking-wide text-slate-500">Welcome back</div>
            <h2 className="mt-1 text-2xl font-semibold text-slate-900">Sign in</h2>
            <p className="mt-1 text-sm text-slate-500">Use your email and password.</p>
          </div>
          <div className="card-body">
            <form className="space-y-4" onSubmit={handleSubmit}>
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

