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
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/database.types'

type NotificationType = {
  id: string
  type: 'message' | 'post_like' | 'comment' | 'comment_like' | 'connection' | 'vault_share' | 'invoice_share' | 'alert_match'
  title: string
  description: string
  timestamp: string
  read: boolean
  avatar?: string
  link: string
  alert_id?: string
  matches_count?: number
}

export function NotificationsDropdown() {
  const router = useRouter()
  const supabase = createClientComponentClient<Database>()
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
      fetchNotifications()
    }
  }, [open])

  const fetchNotifications = async () => {
    try {
      setIsLoading(true)
      
      // Fetch alert notifications
      const { data: alertNotifications, error } = await supabase
        .from('alert_notifications')
        .select(`
          *,
          alerts(name, alert_type)
        `)
        .eq('notification_type', 'new_matches')
        .gt('matches_count', 0)
        .order('created_at', { ascending: false })
        .limit(10)

      const alertNotifs: NotificationType[] = []
      
      if (alertNotifications && !error) {
        for (const notification of alertNotifications) {
          const alert = notification.alerts as any
          alertNotifs.push({
            id: notification.id,
            type: 'alert_match',
            title: 'New Alert Match',
            description: `${notification.matches_count} new ${alert.alert_type === 'profile' ? 'profile' : 'listing'} match${notification.matches_count > 1 ? 'es' : ''} for "${alert.name}"`,
            timestamp: formatTimestamp(notification.created_at),
            read: false, // Alert notifications are always unread until viewed
            avatar: undefined,
            link: `/dashboard/my-alerts/${notification.alert_id}/matches`,
            alert_id: notification.alert_id,
            matches_count: notification.matches_count
          })
        }
      }

      // Add mock notifications for other types (replace with real data when available)
      const mockNotifications: NotificationType[] = [
        {
          id: 'mock-1',
          type: 'message',
          title: 'New message',
          description: 'John Doe sent you a message',
          timestamp: '5m ago',
          read: false,
          avatar: 'https://github.com/shadcn.png',
          link: '/dashboard/messages'
        },
        {
          id: 'mock-2',
          type: 'post_like',
          title: 'Post liked',
          description: 'Jane Smith liked your post',
          timestamp: '10m ago',
          read: false,
          avatar: 'https://github.com/shadcn.png',
          link: '/dashboard/news-feed'
        },
        {
          id: 'mock-3',
          type: 'connection',
          title: 'Connection request',
          description: 'Mike Johnson wants to connect',
          timestamp: '1h ago',
          read: false,
          avatar: 'https://github.com/shadcn.png',
          link: '/dashboard/my-network'
        },
      ]

      // Combine and sort notifications
      const allNotifications = [...alertNotifs, ...mockNotifications]
        .sort((a, b) => {
          // Sort by timestamp (newest first)
          if (a.timestamp.includes('m ago') && b.timestamp.includes('h ago')) return -1
          if (a.timestamp.includes('h ago') && b.timestamp.includes('m ago')) return 1
          return 0
        })

      setNotifications(allNotifications)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  const handleNotificationClick = (notification: NotificationType) => {
    // Mark as read
    setNotifications(prev => 
      prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
    )
    
    // Navigate to the relevant page
    router.push(notification.link)
    setOpen(false)
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'alert_match':
        return '🔔'
      case 'message':
        return '💬'
      case 'post_like':
        return '❤️'
      case 'connection':
        return '🤝'
      default:
        return '📢'
    }
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
                    "flex items-start gap-3 p-3 cursor-pointer",
                    !notification.read && "bg-accent/50"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex-shrink-0 mt-1">
                    {notification.avatar ? (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={notification.avatar} />
                        <AvatarFallback>UN</AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm">
                        {getNotificationIcon(notification.type)}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col space-y-1 flex-1 min-w-0">
                    <p className="text-sm font-medium leading-none">{notification.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{notification.description}</p>
                    <p className="text-xs text-muted-foreground">{notification.timestamp}</p>
                  </div>
                  {!notification.read && (
                    <div className="flex-shrink-0 h-2 w-2 rounded-full bg-primary mt-2" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          )}
        </ScrollArea>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href="/dashboard/my-alerts" className="w-full text-center text-sm">
            View all alerts
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 