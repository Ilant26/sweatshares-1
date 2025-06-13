'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import type { Database } from '@/lib/database.types'
import { supabase } from '@/lib/supabase'
import { subscribeToMessages } from '@/lib/messages'

interface SessionContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
}

const SessionContext = createContext<SessionContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
})

interface UnreadMessagesContextType {
  unreadCount: number
  refreshUnread: () => void
}

const UnreadMessagesContext = createContext<UnreadMessagesContextType | undefined>(undefined)

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      // Clear local state
      setSession(null)
      setUser(null)
      // Redirect to home page
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <SessionContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </SessionContext.Provider>
  )
}

export const useSession = () => {
  const context = useContext(SessionContext)
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider')
  }
  return context
}

export function useUnreadMessages() {
  const context = useContext(UnreadMessagesContext)
  if (!context) {
    throw new Error('useUnreadMessages must be used within an UnreadMessagesProvider')
  }
  return context
}

export function UnreadMessagesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useSession()
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return
    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', user.id)
      .eq('read', false)
    if (!error && typeof count === 'number') setUnreadCount(count)
  }, [user])

  useEffect(() => {
    fetchUnreadCount()
    if (!user) return
    // Real-time subscription for new/unread messages
    const subscription = subscribeToMessages((newMessage: any) => {
      if (newMessage.receiver_id === user.id && !newMessage.read) {
        setUnreadCount((prev) => prev + 1)
      }
    })
    return () => {
      subscription?.unsubscribe?.()
    }
  }, [user, fetchUnreadCount])

  return (
    <UnreadMessagesContext.Provider value={{ unreadCount, refreshUnread: fetchUnreadCount }}>
      {children}
    </UnreadMessagesContext.Provider>
  )
} 