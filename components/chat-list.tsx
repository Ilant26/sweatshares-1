"use client"

import * as React from "react"
import { Message, UserStatus, getMessages, getUserStatus } from "@/lib/messages"
import { useSession } from "@/components/providers/session-provider"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageCircle, ChevronDown, Search, Settings, Edit, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { formatDistanceToNow } from 'date-fns'
import { enUS } from 'date-fns/locale'
import { AnimatePresence, motion } from "framer-motion"

interface ChatListProps {
  onStartChat: (userId: string) => void
  onStateChange?: (isOpen: boolean) => void
  isOpen?: boolean
}

interface ChatUser {
  username: string
  avatar_url: string | null
}

interface MessageWithProfiles {
  id: string
  content: string
  created_at: string
  sender_id: string
  receiver_id: string
  sender: ChatUser
  receiver: ChatUser
}

export function ChatList({ onStartChat, onStateChange, isOpen: controlledIsOpen }: ChatListProps) {
  const [isOpenInternal, setIsOpenInternal] = React.useState(true)
  const [isAnimating, setIsAnimating] = React.useState(false)
  const isOpen = controlledIsOpen ?? isOpenInternal

  const handleToggle = () => {
    if (isAnimating) return // Prevent rapid clicking during animation
    
    setIsAnimating(true)
    const newState = !isOpen
    setIsOpenInternal(newState)
    onStateChange?.(newState)
    
    // Reset animation flag after transition
    setTimeout(() => setIsAnimating(false), 300)
  }

  const [searchQuery, setSearchQuery] = React.useState("")
  const [recentChats, setRecentChats] = React.useState<{
    userId: string
    username: string
    avatar_url: string | null
    lastMessage: string
    timestamp: string
    isOnline: boolean
  }[]>([])

  const { user } = useSession()

  React.useEffect(() => {
    const loadRecentChats = async () => {
      if (!user) return

      try {
        const { data } = await supabase
          .from('messages')
          .select(`
            id,
            content,
            created_at,
            sender_id,
            receiver_id,
            sender:profiles!sender_id (username, avatar_url),
            receiver:profiles!receiver_id (username, avatar_url)
          `)
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .order('created_at', { ascending: false })

        const messages = data as unknown as MessageWithProfiles[]
        if (!messages) return

        const conversations = new Map()
        
        messages.forEach(message => {
          const otherUserId = message.sender_id === user.id ? message.receiver_id : message.sender_id
          const otherUser = message.sender_id === user.id ? message.receiver : message.sender

          if (!conversations.has(otherUserId)) {
            conversations.set(otherUserId, {
              userId: otherUserId,
              username: otherUser.username,
              avatar_url: otherUser.avatar_url,
              lastMessage: message.content,
              timestamp: message.created_at,
              isOnline: false
            })
          }
        })

        const userIds = Array.from(conversations.keys())
        const { data: statuses } = await supabase
          .from('profiles')
          .select('id, is_online')
          .in('id', userIds)

        if (statuses) {
          statuses.forEach(status => {
            const conversation = conversations.get(status.id)
            if (conversation) {
              conversation.isOnline = status.is_online
            }
          })
        }

        setRecentChats(Array.from(conversations.values()))
      } catch (error) {
        console.error("Error loading recent chats:", error)
      }
    }

    loadRecentChats()
  }, [user])

  const filteredChats = recentChats.filter(chat =>
    chat.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const onlineCount = recentChats.filter(chat => chat.isOnline).length

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        {!isOpen ? (
          <motion.div
            key="closed"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex items-center gap-2 bg-background border rounded-t-lg p-2 cursor-pointer shadow-lg hover:bg-accent/50 transition-all duration-200 w-[120px] h-[40px] group"
            onClick={handleToggle}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="relative">
              <MessageCircle className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
              {onlineCount > 0 && (
                <motion.span 
                  className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-green-500 ring-2 ring-background"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 500 }}
                />
              )}
            </div>
            <span className="font-medium text-sm">Chat</span>
            {onlineCount > 0 && (
              <motion.span 
                className="ml-auto text-xs bg-green-500 text-white px-1.5 py-0.5 rounded-full"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                {onlineCount}
              </motion.span>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="open"
            initial={{ opacity: 0, height: 0, scale: 0.95 }}
            animate={{ opacity: 1, height: "auto", scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex flex-col bg-background border rounded-t-lg w-[330px] shadow-xl backdrop-blur-sm"
          >
            <motion.div 
              className="flex items-center justify-between p-3 border-b"
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback>{user?.user_metadata?.full_name?.[0]}</AvatarFallback>
                </Avatar>
                <span className="font-semibold">Messages</span>
                {onlineCount > 0 && (
                  <motion.span 
                    className="h-2 w-2 rounded-full bg-green-500"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                  />
                )}
              </div>
              <div className="flex items-center gap-1">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 hover:bg-accent/80 transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 hover:bg-accent/80 transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 hover:bg-accent/80 transition-colors"
                    onClick={handleToggle}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </motion.div>
              </div>
            </motion.div>

            <motion.div 
              className="p-3 border-b"
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search messages"
                  className="pl-9 bg-accent/50 border-0 focus:ring-2 focus:ring-primary/20 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <ScrollArea className="flex-1" style={{ maxHeight: "400px" }}>
                <div className="p-1">
                  <AnimatePresence>
                    {filteredChats.map((chat, index) => (
                      <motion.div
                        key={chat.userId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ delay: index * 0.05, duration: 0.2 }}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/80 cursor-pointer transition-all duration-200 group"
                        onClick={() => onStartChat(chat.userId)}
                        whileHover={{ x: 4, backgroundColor: "hsl(var(--accent))" }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="relative flex-shrink-0">
                          <Avatar className="h-12 w-12 transition-transform duration-200 group-hover:scale-105">
                            <AvatarImage src={chat.avatar_url || undefined} />
                            <AvatarFallback>{chat.username[0].toUpperCase()}</AvatarFallback>
                          </Avatar>
                          {chat.isOnline && (
                            <motion.span 
                              className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-2 ring-background"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.3 + index * 0.05, type: "spring" }}
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-medium truncate">{chat.username}</span>
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap ml-2">
                              {formatDistanceToNow(new Date(chat.timestamp), { addSuffix: true, locale: enUS })}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground truncate mt-0.5">
                            {chat.lastMessage}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {filteredChats.length === 0 && (
                    <motion.div 
                      className="text-center text-muted-foreground py-8"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      {searchQuery ? "No conversations found" : "No conversations yet"}
                    </motion.div>
                  )}
                </div>
              </ScrollArea>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 