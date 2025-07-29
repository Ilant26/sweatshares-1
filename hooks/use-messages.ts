import { useState, useEffect } from 'react'
import { Message, UserStatus, getMessages, sendMessage, markMessageAsRead, getUserStatus, subscribeToMessages, subscribeToUserStatus, handleUserPresence } from '@/lib/messages'

interface UseMessagesProps {
  userId?: string
}

interface UseMessagesReturn {
  messages: Message[]
  sendMessage: (content: string) => Promise<void>
  isLoading: boolean
  error: Error | null
  userStatus: UserStatus | null
}

export function useMessages({ userId }: UseMessagesProps): UseMessagesReturn {
  const [messages, setMessages] = useState<Message[]>([])
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [isMounted, setIsMounted] = useState(true)

  useEffect(() => {
    setIsMounted(true)
    return () => setIsMounted(false)
  }, [])

  useEffect(() => {
    // Set up presence handling
    const cleanup = handleUserPresence()
    return cleanup
  }, [])

  useEffect(() => {
    if (!userId || userId === 'undefined') return

    let subscription: { unsubscribe: () => void } | null = null

    // Load messages
    const loadMessages = async () => {
      try {
        setIsLoading(true)
        const fetchedMessages = await getMessages(userId)
        if (isMounted) {
          setMessages(fetchedMessages)
        }
        
        // Mark all messages as read
        const unreadMessages = fetchedMessages.filter(msg => !msg.read && msg.sender_id === userId)
        await Promise.all(unreadMessages.map(async (msg) => {
          try {
            await markMessageAsRead(msg.id)
          } catch (err) {
            console.error('Error marking message as read:', err, msg)
          }
        }))
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to load messages'))
          console.error('Error in loadMessages:', err)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    // Load user status
    const loadUserStatus = async () => {
      if (!userId || userId === 'undefined') return;
      
      try {
        const status = await getUserStatus(userId)
        if (isMounted) {
          setUserStatus(status)
        }
      } catch (err) {
        console.error('Failed to load user status:', err);
        // Set a default status instead of failing
        if (isMounted) {
          setUserStatus({
            id: userId,
            username: 'Loading...',
            full_name: null,
            avatar_url: null,
            last_seen: new Date().toISOString(),
            is_online: false
          });
        }
      }
    }

    loadMessages()
    loadUserStatus()

    // Subscribe to new messages
    try {
      subscription = subscribeToMessages((newMessage) => {
        if (isMounted) {
          setMessages(prev => {
            // Check if message already exists
            if (prev.some(msg => msg.id === newMessage.id)) {
              return prev
            }
            
            // Add new message and mark as read if it's from the current conversation
            if (newMessage.sender_id === userId) {
              try {
                markMessageAsRead(newMessage.id)
              } catch (err) {
                console.error('Error marking new message as read:', err, newMessage)
              }
            }
            return [...prev, newMessage]
          })
        }
      })
    } catch (err) {
      console.error('Error setting up message subscription:', err)
    }

    // Subscribe to user status changes
    const statusSubscription = subscribeToUserStatus(userId, (status) => {
      if (isMounted) {
        setUserStatus(status)
      }
    })

    return () => {
      if (subscription) {
        try {
          subscription.unsubscribe()
        } catch (err) {
          console.error('Error unsubscribing from messageSubscription:', err)
        }
      }
      try {
        statusSubscription.unsubscribe()
      } catch (err) {
        console.error('Error unsubscribing from statusSubscription:', err)
      }
    }
  }, [userId, isMounted])

  const handleSendMessage = async (content: string) => {
    if (!userId || !content.trim()) return
    
    try {
      await sendMessage(userId, content)
    } catch (err) {
      if (isMounted) {
        setError(err instanceof Error ? err : new Error('Failed to send message'))
        console.error('Error in sendMessage:', err, { userId, content })
      }
    }
  }

  return {
    messages,
    sendMessage: handleSendMessage,
    isLoading,
    error,
    userStatus
  }
} 