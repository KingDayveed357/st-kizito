"use client"

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const AUTH_STORAGE_PREFIXES = ['sb-', 'supabase.auth.', 'st-kizito-admin-']

const clearClientAuthStorage = () => {
  if (typeof window === 'undefined') return

  try {
    const keys = Object.keys(window.localStorage)
    for (const key of keys) {
      if (AUTH_STORAGE_PREFIXES.some((prefix) => key.startsWith(prefix))) {
        window.localStorage.removeItem(key)
      }
    }
  } catch {
    // storage may be blocked; ignore
  }

  try {
    const keys = Object.keys(window.sessionStorage)
    for (const key of keys) {
      if (AUTH_STORAGE_PREFIXES.some((prefix) => key.startsWith(prefix))) {
        window.sessionStorage.removeItem(key)
      }
    }
  } catch {
    // storage may be blocked; ignore
  }
}

async function invalidateServerSession() {
  try {
    await fetch('/admin/logout', { method: 'POST', credentials: 'include' })
  } catch {
    // best effort only
  }
}

export function useLogout() {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = React.useState(false)
  const [logoutError, setLogoutError] = React.useState<string | null>(null)
  const [logoutSuccess, setLogoutSuccess] = React.useState(false)

  const handleLogout = React.useCallback(async () => {
    if (isLoggingOut) return

    setIsLoggingOut(true)
    setLogoutError(null)
    const supabase = createClient()

    try {
      const { error } = await supabase.auth.signOut({ scope: 'global' })
      if (error) {
        await invalidateServerSession()
        clearClientAuthStorage()
        setLogoutError('Session ended locally. Redirecting to sign in.')
      } else {
        await invalidateServerSession()
        clearClientAuthStorage()
        setLogoutSuccess(true)
      }

      window.setTimeout(() => {
        router.replace('/admin/login?loggedOut=1')
        router.refresh()
      }, 500)
    } catch {
      await invalidateServerSession()
      clearClientAuthStorage()
      setLogoutError('Could not reach server. You have been signed out locally.')
      window.setTimeout(() => {
        router.replace('/admin/login?loggedOut=1')
        router.refresh()
      }, 500)
    } finally {
      setIsLoggingOut(false)
    }
  }, [isLoggingOut, router])

  return {
    isLoggingOut,
    logoutError,
    logoutSuccess,
    handleLogout,
  }
}
