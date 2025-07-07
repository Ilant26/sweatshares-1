'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/database.types'

interface NotificationsContextType {
  unreadCount: number
  refreshUnreadCount: () => Promise<void>
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined)

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = createClientComponentClient<Database>()

  const refreshUnreadCount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setUnreadCount(0)
        return
      }

      const { data: count } = await supabase
        .rpc('get_unread_notification_count', { user_uuid: user.id })
      
      setUnreadCount(count || 0)
    } catch (error) {
      console.error('Error fetching unread count:', error)
      setUnreadCount(0)
    }
  }

  // Initial load and periodic refresh
  useEffect(() => {
    refreshUnreadCount()
    
    // Refresh every 30 seconds
    const interval = setInterval(refreshUnreadCount, 30000)
    
    return () => clearInterval(interval)
  }, [])

  // Listen for auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        refreshUnreadCount()
      } else if (event === 'SIGNED_OUT') {
        setUnreadCount(0)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <NotificationsContext.Provider value={{ unreadCount, refreshUnreadCount }}>
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationsContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider')
  }
  return context
} 