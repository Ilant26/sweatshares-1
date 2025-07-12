import * as React from "react"
import { Bell, CheckCircle, Clock, AlertCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

type EscrowNotification = {
  id: string
  title: string
  description: string
  data: any
  read: boolean
  created_at: string
}

interface EscrowNotificationStatusProps {
  invoiceId: string
  className?: string
}

export function EscrowNotificationStatus({ invoiceId, className }: EscrowNotificationStatusProps) {
  const [notifications, setNotifications] = React.useState<EscrowNotification[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [unreadCount, setUnreadCount] = React.useState(0)

  React.useEffect(() => {
    fetchEscrowNotifications()
  }, [invoiceId])

  const fetchEscrowNotifications = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/notifications?limit=10&invoice_id=${invoiceId}`)
      if (response.ok) {
        const data = await response.json()
        const escrowNotifications = data.notifications?.filter((n: any) => n.type === 'escrow_payment') || []
        setNotifications(escrowNotifications)
        setUnreadCount(escrowNotifications.filter((n: any) => !n.read).length)
      }
    } catch (error) {
      console.error('Error fetching escrow notifications:', error)
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
        setNotifications(prev => 
          prev.map(n => 
            notificationIds.includes(n.id) ? { ...n, read: true } : n
          )
        )
        setUnreadCount(prev => Math.max(0, prev - notificationIds.length))
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'funded':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'work_completed':
        return <Clock className="h-4 w-4 text-blue-500" />
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'revision_requested':
        return <AlertCircle className="h-4 w-4 text-orange-500" />
      case 'disputed':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Bell className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'funded':
        return 'bg-green-100 text-green-800'
      case 'work_completed':
        return 'bg-blue-100 text-blue-800'
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'revision_requested':
        return 'bg-orange-100 text-orange-800'
      case 'disputed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
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

  if (isLoading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Transaction Updates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <p className="text-sm text-muted-foreground">Loading notifications...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Transaction Updates
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const unreadIds = notifications.filter(n => !n.read).map(n => n.id)
                if (unreadIds.length > 0) {
                  markAsRead(unreadIds)
                }
              }}
            >
              Mark all read
            </Button>
          )}
        </div>
        <CardDescription>
          Recent updates and notifications for this escrow transaction
        </CardDescription>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="flex items-center justify-center py-4">
            <p className="text-sm text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border",
                    !notification.read && "bg-accent/50 border-primary/20"
                  )}
                >
                  <div className="flex-shrink-0 mt-1">
                    {getStatusIcon(notification.data?.escrow_status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium">{notification.title}</p>
                      {notification.data?.escrow_status && (
                        <Badge 
                          variant="secondary" 
                          className={cn("text-xs", getStatusColor(notification.data.escrow_status))}
                        >
                          {notification.data.escrow_status.replace('_', ' ')}
                        </Badge>
                      )}
                      {!notification.read && (
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">
                      {notification.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatTimestamp(notification.created_at)}
                    </p>
                    {notification.data?.amount && (
                      <p className="text-xs font-medium text-primary mt-1">
                        {notification.data.currency} {notification.data.amount}
                      </p>
                    )}
                  </div>
                  {!notification.read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => markAsRead([notification.id])}
                    >
                      Mark read
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
} 