'use client'
// src/components/auth/AuthModal.tsx
// Sign in / sign up modal. Triggered when an unauthenticated user
// tries to save, or clicks Sign in in the top bar.

import { useState } from 'react'
import { X, Loader2, Scissors } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type Mode = 'signin' | 'signup' | 'forgot'

type Props = {
  onClose: () => void
  onSuccess: () => void
  initialMode?: Mode
}

export function AuthModal({ onClose, onSuccess, initialMode = 'signin' }: Props) {
  const [mode, setMode] = useState<Mode>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName || email.split('@')[0] },
          },
        })
        if (error) throw error
        setSuccess('Check your email to confirm your account, then sign in.')
        setMode('signin')

      } else if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        onSuccess()

      } else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        })
        if (error) throw error
        setSuccess('Password reset email sent — check your inbox.')
      }
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
        >
          <X size={18} />
        </button>

        {/* Logo */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-7 h-7 bg-[#1a1208] rounded flex items-center justify-center">
            <Scissors size={14} className="text-[#f5f0e8]" />
          </div>
          <span className="font-serif text-[16px] font-medium text-zinc-900 dark:text-zinc-100">
            Pasteup
          </span>
        </div>

        {/* Title */}
        <h2 className="text-[18px] font-medium text-zinc-900 dark:text-zinc-100 mb-1">
          {mode === 'signin' && 'Welcome back'}
          {mode === 'signup' && 'Create your account'}
          {mode === 'forgot' && 'Reset your password'}
        </h2>
        <p className="text-[13px] text-zinc-500 mb-6">
          {mode === 'signin' && 'Sign in to save and access your collages.'}
          {mode === 'signup' && 'Start saving your collage work.'}
          {mode === 'forgot' && 'We\'ll send you a reset link.'}
        </p>

        {/* Success message */}
        {success && (
          <div className="mb-4 px-3 py-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-[12px] text-emerald-700 dark:text-emerald-400">
            {success}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-4 px-3 py-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-[12px] text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'signup' && (
            <div>
              <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="w-full px-3 py-2 text-[13px] rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-[#c84b2f] transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-3 py-2 text-[13px] rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-[#c84b2f] transition-colors"
            />
          </div>

          {mode !== 'forgot' && (
            <div>
              <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full px-3 py-2 text-[13px] rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-[#c84b2f] transition-colors"
              />
            </div>
          )}

          {mode === 'signin' && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => { setMode('forgot'); setError(null) }}
                className="text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
              >
                Forgot password?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 text-[13px] font-medium bg-[#1a1208] text-[#f5f0e8] rounded-lg hover:opacity-85 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {mode === 'signin' && 'Sign in'}
            {mode === 'signup' && 'Create account'}
            {mode === 'forgot' && 'Send reset email'}
          </button>
        </form>

        {/* Mode switcher */}
        <div className="mt-5 text-center text-[12px] text-zinc-500">
          {mode === 'signin' && (
            <>
              Don't have an account?{' '}
              <button
                onClick={() => { setMode('signup'); setError(null) }}
                className="text-[#c84b2f] hover:underline font-medium"
              >
                Sign up
              </button>
            </>
          )}
          {mode === 'signup' && (
            <>
              Already have an account?{' '}
              <button
                onClick={() => { setMode('signin'); setError(null) }}
                className="text-[#c84b2f] hover:underline font-medium"
              >
                Sign in
              </button>
            </>
          )}
          {mode === 'forgot' && (
            <button
              onClick={() => { setMode('signin'); setError(null) }}
              className="text-[#c84b2f] hover:underline font-medium"
            >
              Back to sign in
            </button>
          )}
        </div>
      </div>
    </div>
  )
}