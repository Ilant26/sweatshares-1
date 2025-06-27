import * as React from "react"
import { Bell } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useUnreadMessages, useUnreadInvitations } from '@/components/providers/session-provider'
import { useRouter } from 'next/navigation'
import { cn } from "@/lib/utils"
import Link from "next/link"

type NotificationType = {
  id: string
  type: 'message' | 'post_like' | 'comment' | 'comment_like' | 'connection' | 'vault_share' | 'invoice_share'
  title: string
  description: string
  timestamp: string
  read: boolean
  avatar?: string
  link: string
}

export function NotificationsDropdown() {
  const router = useRouter()
  const { unreadCount: unreadMessages } = useUnreadMessages()
  const { unreadInvitations } = useUnreadInvitations()
  const [notifications, setNotifications] = React.useState<NotificationType[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [open, setOpen] = React.useState(false)

  const totalUnread = React.useMemo(() => {
    return notifications.filter(n => !n.read).length + unreadMessages + unreadInvitations
  }, [notifications, unreadMessages, unreadInvitations])

  // Fetch notifications when dropdown opens
  React.useEffect(() => {
    if (open) {
      // TODO: Implement actual notification fetching
      // This is mock data for now
      setNotifications([
        {
          id: '1',
          type: 'message',
          title: 'New message',
          description: 'John Doe sent you a message',
          timestamp: '5m ago',
          read: false,
          avatar: 'https://github.com/shadcn.png',
          link: '/dashboard/messages'
        },
        {
          id: '2',
          type: 'post_like',
          title: 'Post liked',
          description: 'Jane Smith liked your post',
          timestamp: '10m ago',
          read: false,
          avatar: 'https://github.com/shadcn.png',
          link: '/dashboard/news-feed'
        },
        {
          id: '3',
          type: 'connection',
          title: 'Connection request',
          description: 'Mike Johnson wants to connect',
          timestamp: '1h ago',
          read: false,
          avatar: 'https://github.com/shadcn.png',
          link: '/dashboard/my-network'
        },
      ])
      setIsLoading(false)
    }
  }, [open])

  const handleNotificationClick = (notification: NotificationType) => {
    // Mark as read
    setNotifications(prev => 
      prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
    )
    // Navigate to the relevant page
    router.push(notification.link)
    setOpen(false)
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {totalUnread > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1 text-xs font-medium text-destructive-foreground">
              {totalUnread > 99 ? '99+' : totalUnread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end" sideOffset={5}>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">Notifications</p>
            <p className="text-xs leading-none text-muted-foreground">
              You have {totalUnread} unread notifications
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[300px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <p className="text-sm text-muted-foreground">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex items-center justify-center py-4">
              <p className="text-sm text-muted-foreground">No notifications</p>
            </div>
          ) : (
            <DropdownMenuGroup>
              {notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={cn(
                    "flex items-start gap-3 p-3",
                    !notification.read && "bg-accent/50"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={notification.avatar} />
                    <AvatarFallback>UN</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{notification.title}</p>
                    <p className="text-xs text-muted-foreground">{notification.description}</p>
                    <p className="text-xs text-muted-foreground">{notification.timestamp}</p>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          )}
        </ScrollArea>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href="/notifications" className="w-full text-center text-sm">
            View all notifications
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 