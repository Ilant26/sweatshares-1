"use client"

import * as React from "react"
import { Message, UserStatus, getMessages, getUserStatus } from "@/lib/messages"
import { useSession } from "@/components/providers/session-provider"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageCircle, ChevronDown, Search, Settings, Edit } from "lucide-react"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { formatDistanceToNow } from 'date-fns'
import { enUS } from 'date-fns/locale'

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
  const isOpen = controlledIsOpen ?? isOpenInternal

  const handleToggle = () => {
    const newState = !isOpen
    setIsOpenInternal(newState)
    onStateChange?.(newState)
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

  if (!isOpen) {
    return (
      <div
        className="flex items-center gap-2 bg-background border rounded-t-lg p-2 cursor-pointer shadow-lg hover:bg-accent/50 transition-all duration-300 w-[120px] h-[40px]"
        onClick={handleToggle}
      >
        <div className="relative">
          <MessageCircle className="h-4 w-4" />
          {recentChats.some(chat => chat.isOnline) && (
            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-green-500 ring-2 ring-background" />
          )}
        </div>
        <span className="font-medium text-sm">Chat</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col bg-background border rounded-t-lg w-[330px] shadow-lg transition-all duration-300">
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.user_metadata?.avatar_url} />
            <AvatarFallback>{user?.user_metadata?.full_name?.[0]}</AvatarFallback>
          </Avatar>
          <span className="font-semibold">Messages</span>
          {recentChats.some(chat => chat.isOnline) && (
            <span className="h-2 w-2 rounded-full bg-green-500" />
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleToggle}>
            <ChevronDown className="h-4 w-4 transform rotate-180" />
          </Button>
        </div>
      </div>

      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search messages"
            className="pl-9 bg-accent/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <ScrollArea className="flex-1" style={{ maxHeight: "400px" }}>
        <div className="p-1">
          {filteredChats.map((chat) => (
            <div
              key={chat.userId}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/80 cursor-pointer transition-colors duration-200"
              onClick={() => onStartChat(chat.userId)}
            >
              <div className="relative flex-shrink-0">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={chat.avatar_url || undefined} />
                  <AvatarFallback>{chat.username[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                {chat.isOnline && (
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-2 ring-background" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium truncate">{chat.username}</span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                    {formatDistanceToNow(new Date(chat.timestamp), { addSuffix: true, locale: enUS })}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground truncate mt-0.5">
                  {chat.lastMessage}
                </div>
              </div>
            </div>
          ))}
          {filteredChats.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              No conversations yet
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
} 