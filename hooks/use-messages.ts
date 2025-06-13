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

  useEffect(() => {
    // Set up presence handling
    const cleanup = handleUserPresence()
    return cleanup
  }, [])

  useEffect(() => {
    if (!userId) return

    // Load initial messages
    const loadMessages = async () => {
      try {
        setIsLoading(true)
        const fetchedMessages = await getMessages(userId)
        setMessages(fetchedMessages)
        
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
        setError(err instanceof Error ? err : new Error('Failed to load messages'))
        console.error('Error in loadMessages:', err)
      } finally {
        setIsLoading(false)
      }
    }

    // Load user status
    const loadUserStatus = async () => {
      try {
        const status = await getUserStatus(userId)
        setUserStatus(status)
      } catch (err) {
        console.error('Failed to load user status:', err)
      }
    }

    loadMessages()
    loadUserStatus()

    // Subscribe to new messages
    const messageSubscription = subscribeToMessages((newMessage) => {
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
    })

    // Subscribe to user status changes
    const statusSubscription = subscribeToUserStatus(userId, (status) => {
      setUserStatus(status)
    })

    return () => {
      try {
        messageSubscription.unsubscribe()
      } catch (err) {
        console.error('Error unsubscribing from messageSubscription:', err)
      }
      try {
        statusSubscription.unsubscribe()
      } catch (err) {
        console.error('Error unsubscribing from statusSubscription:', err)
      }
    }
  }, [userId])

  const handleSendMessage = async (content: string) => {
    if (!userId || !content.trim()) return
    
    try {
      await sendMessage(userId, content)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to send message'))
      console.error('Error in sendMessage:', err, { userId, content })
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