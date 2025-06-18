"use client"

import * as React from "react"
import { Message, UserStatus, getMessages, sendMessage, subscribeToMessages, getUserStatus, subscribeToUserStatus, MessageAttachment } from "@/lib/messages"
import { useSession } from "@/components/providers/session-provider"
import { usePathname } from "next/navigation"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Maximize2, Minimize2, X, Send, MoreHorizontal, Image as ImageIcon, Paperclip, Smile, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import { ChatList } from "./chat-list"
import { formatDistanceToNow } from 'date-fns'
import { enUS } from 'date-fns/locale'
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { MessageBubble } from "./message-bubble"

interface ChatWindowProps {
  userId: string
  onClose: () => void
  isMinimized: boolean
  onMinimize: () => void
}

export function ChatWindow({ userId, onClose, isMinimized, onMinimize }: ChatWindowProps) {
  const [messages, setMessages] = React.useState<Message[]>([])
  const [newMessage, setNewMessage] = React.useState("")
  const [userStatus, setUserStatus] = React.useState<UserStatus | null>(null)
  const { user } = useSession()
  const scrollRef = React.useRef<HTMLDivElement | null>(null)
  const [isTyping, setIsTyping] = React.useState(false)
  const typingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  const messagesEndRef = React.useRef<HTMLDivElement | null>(null)

  // Add scroll to bottom function
  const scrollToBottom = React.useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Add effect to scroll when messages change
  React.useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  React.useEffect(() => {
    const loadMessages = async () => {
      try {
        const msgs = await getMessages(userId)
        setMessages(msgs.filter(m => 
          (m.sender_id === userId && m.receiver_id === user?.id) ||
          (m.sender_id === user?.id && m.receiver_id === userId)
        ))
      } catch (error) {
        console.error("Error loading messages:", error)
      }
    }

    const loadUserStatus = async () => {
      try {
        const status = await getUserStatus(userId)
        setUserStatus(status)
      } catch (error) {
        console.error("Error loading user status:", error)
      }
    }

    loadMessages()
    loadUserStatus()

    const { unsubscribe } = subscribeToMessages((newMsg) => {
      if ((newMsg.sender_id === userId && newMsg.receiver_id === user?.id) ||
          (newMsg.sender_id === user?.id && newMsg.receiver_id === userId)) {
        setMessages(prev => [...prev, newMsg])
      }
    })

    const statusSubscription = subscribeToUserStatus(userId, (status) => {
      setUserStatus(status)
    })

    return () => {
      unsubscribe()
      statusSubscription.unsubscribe()
    }
  }, [userId, user?.id])

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleFileDownload = async (filepath: string, filename: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('message-attachments')
        .download(filepath);
      
      if (error) throw error;
      
      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast.error('Failed to download file');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    try {
      await sendMessage(userId, newMessage)
      setNewMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
    }
  }

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value)
    setIsTyping(true)

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
    }, 1000)
  }

  const formatMessageTime = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: enUS })
  }

  // Shared header component to maintain consistency
  const ChatHeader = ({ isMinimized }: { isMinimized: boolean }) => (
    <div className={cn("flex items-center justify-between", isMinimized ? "p-2" : "p-3")}>
      <div className="flex items-center gap-2">
        <Avatar className={cn(isMinimized ? "h-6 w-6" : "h-8 w-8")}>
          <AvatarImage src={userStatus?.avatar_url || undefined} />
          <AvatarFallback className={cn(isMinimized ? "text-xs" : "text-sm")}>{userStatus?.username?.[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <div className={cn("font-medium", isMinimized ? "text-sm" : "text-base")}>{userStatus?.username}</div>
          {!isMinimized && (
            <div className="text-xs text-muted-foreground">
              {userStatus?.is_online ? "Active now" : userStatus?.last_seen ? 
                `Last seen ${formatDistanceToNow(new Date(userStatus.last_seen), { addSuffix: true })}` : 
                "Offline"}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1">
        {!isMinimized && (
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        )}
        <Button variant="ghost" size="icon" className={cn(isMinimized ? "h-6 w-6" : "h-8 w-8")} onClick={onMinimize}>
          {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-4 w-4" />}
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className={cn(isMinimized ? "h-6 w-6" : "h-8 w-8")} 
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
        >
          <X className={cn(isMinimized ? "h-3 w-3" : "h-4 w-4")} />
        </Button>
      </div>
    </div>
  )

  if (isMinimized) {
    return (
      <div 
        className="bg-background border rounded-t-lg w-[320px] h-[40px] cursor-pointer shadow-lg hover:bg-accent/50 transition-all duration-300"
        onClick={onMinimize}
      >
        <div className="flex items-center justify-between p-2 h-full">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={userStatus?.avatar_url || undefined} />
              <AvatarFallback className="text-xs">{userStatus?.username?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium text-sm">{userStatus?.username}</div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onMinimize}>
              <Maximize2 className="h-3 w-3" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6" 
              onClick={(e) => {
                e.stopPropagation()
                onClose()
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col bg-background border rounded-t-lg w-[320px] shadow-lg transition-all duration-300 h-[450px]">
      <div className="sticky top-0 z-10 bg-background border-b">
        <ChatHeader isMinimized={false} />
      </div>

      {/* Messages area - scrollable */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea 
          className="h-full" 
          ref={scrollRef}
        >
          <div className="flex flex-col gap-4 p-4">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                currentUserId={user?.id || ''}
                onAttachmentLoad={scrollToBottom}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Message input form - fixed at bottom */}
      <div className="border-t bg-background">
        <form onSubmit={handleSendMessage} className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ImageIcon className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Smile className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={handleTyping}
              placeholder="Write a message..."
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={!newMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function ChatInterface() {
  const pathname = usePathname()
  const [activeChats, setActiveChats] = React.useState<string[]>([])
  const [minimizedChats, setMinimizedChats] = React.useState<string[]>([])
  const [isChatListOpen, setIsChatListOpen] = React.useState(false)

  // Don't show on messages page
  if (pathname.includes('/dashboard/messages')) {
    return null
  }

  const handleStartChat = (userId: string) => {
    if (!activeChats.includes(userId)) {
      setActiveChats(prev => [...prev, userId])
    }
    setIsChatListOpen(true)
  }

  const handleCloseChat = (userId: string) => {
    setActiveChats(prev => prev.filter(id => id !== userId))
    setMinimizedChats(prev => prev.filter(id => id !== userId))
  }

  const handleMinimizeChat = (userId: string) => {
    if (minimizedChats.includes(userId)) {
      setMinimizedChats(prev => prev.filter(id => id !== userId))
    } else {
      setMinimizedChats(prev => [...prev, userId])
    }
  }

  const handleChatListStateChange = (isOpen: boolean) => {
    setIsChatListOpen(isOpen)
  }

  // Constants for layout calculations
  const chatListWidth = 330 // Full width of chat list
  const chatListCollapsedWidth = 120 // Width when collapsed
  const chatListCollapsedHeight = 40 // Height when collapsed
  const rightPadding = 16 // Right padding from viewport edge

  return (
    <div className="fixed bottom-0 right-0 z-50 flex items-end">
      {/* Chat windows container with dynamic margin based on chat list state */}
      <div 
        className={cn(
          "flex gap-4 transition-all duration-300 ease-in-out items-end",
          isChatListOpen ? "mr-[346px]" : "mr-[136px]" // 120px + 16px
        )}
        style={{
          maxWidth: `calc(100vw - ${isChatListOpen ? (chatListWidth + rightPadding * 2) : (chatListCollapsedWidth + rightPadding * 2)}px)`,
          overflowX: 'auto',
          paddingLeft: '16px',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {activeChats.map((userId, index) => (
          <div 
            key={userId}
            className={cn(
              "transition-all duration-300 ease-in-out",
              minimizedChats.includes(userId) ? `h-[${chatListCollapsedHeight}px]` : "h-[450px]"
            )}
            style={{
              zIndex: activeChats.length - index,
              minWidth: '320px', // Ensure consistent width for chat windows
            }}
          >
            <ChatWindow
              userId={userId}
              onClose={() => handleCloseChat(userId)}
              isMinimized={minimizedChats.includes(userId)}
              onMinimize={() => handleMinimizeChat(userId)}
            />
          </div>
        ))}
      </div>
      {/* Chat list with state management */}
      <div 
        className="fixed bottom-0 right-4 transition-all duration-300 ease-in-out"
        style={{
          width: isChatListOpen ? `${chatListWidth}px` : `${chatListCollapsedWidth}px`,
        }}
      >
        <ChatList 
          onStartChat={handleStartChat}
          onStateChange={handleChatListStateChange}
          isOpen={isChatListOpen}
        />
      </div>
    </div>
  )
} 