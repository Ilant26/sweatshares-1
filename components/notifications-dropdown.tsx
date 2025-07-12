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
import { useRouter } from 'next/navigation'
import { cn } from "@/lib/utils"
import Link from "next/link"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/database.types'
import { useNotifications } from '@/components/providers/notifications-provider'

type NotificationType = {
  id: string
  type: 'message' | 'connection_request' | 'connection_accepted' | 'invoice_request' | 'escrow_payment' | 'vault_share' | 'signature_request' | 'alert_match'
  title: string
  description: string
  data: any
  read: boolean
  created_at: string
  message_id?: string
  connection_id?: string
  invoice_id?: string
  signature_id?: string
  alert_id?: string
}

export function NotificationsDropdown() {
  const router = useRouter()
  const supabase = createClientComponentClient<Database>()
  const { unreadCount, refreshUnreadCount } = useNotifications()
  const [notifications, setNotifications] = React.useState<NotificationType[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [open, setOpen] = React.useState(false)

  // Fetch notifications when dropdown opens
  React.useEffect(() => {
    if (open) {
      fetchNotifications()
    }
  }, [open])

  // The notifications provider handles polling for unread count

  const fetchNotifications = async () => {
    try {
      setIsLoading(true)
              const response = await fetch('/api/notifications?limit=20')
        if (response.ok) {
          const data = await response.json()
          setNotifications(data.notifications || [])
        }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }



  const markAsRead = async (notificationIds: string[]) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notification_ids: notificationIds }),
      })
      
      if (response.ok) {
        // Update local state
    setNotifications(prev => 
          prev.map(n => 
            notificationIds.includes(n.id) ? { ...n, read: true } : n
          )
    )
        await refreshUnreadCount()
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error)
    }
  }

  const handleNotificationClick = async (notification: NotificationType) => {
    // Mark as read if unread
    if (!notification.read) {
      await markAsRead([notification.id])
    }
    
    // Navigate based on notification type
    let targetUrl = '/dashboard'
    
    switch (notification.type) {
      case 'message':
        targetUrl = '/dashboard/messages'
        break
      case 'connection_request':
      case 'connection_accepted':
        targetUrl = '/dashboard/my-network'
        break
      case 'invoice_request':
        if (notification.invoice_id) {
          targetUrl = '/dashboard/my-invoices'
        } else {
          targetUrl = '/dashboard/my-invoices'
        }
        break
      case 'escrow_payment':
        if (notification.invoice_id) {
          // Navigate to escrow work page for all escrow notifications
          targetUrl = `/dashboard/escrow-work/${notification.invoice_id}`
        } else {
          targetUrl = '/dashboard/my-invoices'
        }
        break
      case 'signature_request':
        if (notification.signature_id) {
          targetUrl = `/dashboard/signature/${notification.signature_id}`
        } else {
          targetUrl = '/dashboard/my-vault'
        }
        break
      case 'vault_share':
        targetUrl = '/dashboard/my-vault'
        break
      case 'alert_match':
        if (notification.alert_id) {
          targetUrl = `/dashboard/my-alerts/${notification.alert_id}/matches`
        } else {
          targetUrl = '/dashboard/my-alerts'
        }
        break
      default:
        targetUrl = '/dashboard'
    }
    
    router.push(targetUrl)
    setOpen(false)
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

  const getNotificationIcon = (type: string, data?: any) => {
    switch (type) {
      case 'message':
        return '💬'
      case 'connection_request':
        return '🤝'
      case 'connection_accepted':
        return '✅'
      case 'invoice_request':
        return '📄'
      case 'escrow_payment':
        // Different icons based on escrow status
        if (data?.escrow_status) {
          switch (data.escrow_status) {
            case 'funded':
              return '💰'
            case 'work_completed':
              return '📋'
            case 'approved':
              return '✅'
            case 'revision_requested':
              return '🔄'
            case 'disputed':
              return '⚠️'
            case 'released':
              return '🎉'
            case 'refunded':
              return '↩️'
            default:
              return '💰'
          }
        }
        return '💰'
      case 'vault_share':
        return '📁'
      case 'signature_request':
        return '✍️'
      case 'alert_match':
        return '🔔'
      default:
        return '📢'
    }
  }

  const getAvatarFromData = (notification: NotificationType) => {
    const data = notification.data || {}
    // Try to get avatar from various sources in the data, prioritizing the standardized fields
    return data.sender_avatar_url || data.payer_avatar_url || data.sharer_avatar_url || data.receiver_avatar_url || 
           data.sender_avatar || data.requester_avatar || data.client_avatar || data.freelancer_avatar
  }

  const getSenderName = (notification: NotificationType) => {
    const data = notification.data || {}
    // Get the sender's full name from notification data, with fallbacks
    return data.sender_name || data.payer_name || data.sharer_name || data.receiver_name || 'Someone'
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mark_all_read: true }),
      })
      
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
        await refreshUnreadCount()
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1 text-xs font-medium text-destructive-foreground">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end" sideOffset={5}>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center justify-between">
            <p className="text-sm font-medium leading-none">Notifications</p>
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-auto p-0 text-xs text-primary hover:text-primary/80"
                  onClick={markAllAsRead}
                >
                  Mark all read
                </Button>
              )}
            </div>
            <p className="text-xs leading-none text-muted-foreground">
              {unreadCount > 0 
                ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                : 'All caught up!'
              }
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
                    {getAvatarFromData(notification) ? (
                  <Avatar className="h-8 w-8">
                        <AvatarImage src={getAvatarFromData(notification)} />
                    <AvatarFallback>UN</AvatarFallback>
                  </Avatar>
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm">
                        {getNotificationIcon(notification.type, notification.data)}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                    <p className="text-sm font-medium leading-none">{notification.title}</p>
                      <span className="text-xs font-medium text-primary">{getSenderName(notification)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{notification.description}</p>
                    <p className="text-xs text-muted-foreground">{formatTimestamp(notification.created_at)}</p>
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
            View all notifications
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 