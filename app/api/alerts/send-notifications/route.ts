import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/lib/database.types'

// This endpoint would typically be called by a cron job or background service
// For demo purposes, it can also be called manually
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })

    // Get all alert notifications that haven't been emailed yet
    const { data: pendingNotifications, error: notificationsError } = await supabase
      .from('alert_notifications')
      .select(`
        *,
        alerts(
          name,
          alert_type,
          frequency,
          user_id
        )
      `)
      .eq('email_sent', false)
      .eq('notification_type', 'new_matches')
      .gt('matches_count', 0)

    if (notificationsError) {
      console.error('Error fetching pending notifications:', notificationsError)
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
    }

    if (!pendingNotifications || pendingNotifications.length === 0) {
      return NextResponse.json({ message: 'No pending notifications to send' })
    }

    // Group notifications by user and frequency
    const userNotifications = new Map<string, any[]>()
    
    for (const notification of pendingNotifications) {
      const alert = notification.alerts as any
      const userId = alert.user_id
      
      if (!userNotifications.has(userId)) {
        userNotifications.set(userId, [])
      }
      
      userNotifications.get(userId)?.push({
        ...notification,
        alert_name: alert.name,
        alert_type: alert.alert_type,
        frequency: alert.frequency
      })
    }

    const emailResults = []

    // Send emails for each user
    for (const [userId, notifications] of userNotifications) {
      try {
        // Get user profile for email
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('email, full_name, username')
          .eq('id', userId)
          .single()

        if (profileError || !profile?.email) {
          console.error('Error fetching user profile:', profileError)
          continue
        }

        // Group by frequency for batching
        const instantNotifications = notifications.filter(n => n.frequency === 'instant')
        const dailyNotifications = notifications.filter(n => n.frequency === 'daily')
        const weeklyNotifications = notifications.filter(n => n.frequency === 'weekly')

        // Send instant notifications immediately
        for (const notification of instantNotifications) {
          const emailSent = await sendAlertEmail({
            to: profile.email,
            userName: profile.full_name || profile.username || 'User',
            alertName: notification.alert_name,
            alertType: notification.alert_type,
            matchesCount: notification.matches_count,
            alertId: notification.alert_id
          })

          if (emailSent) {
            await supabase
              .from('alert_notifications')
              .update({
                email_sent: true,
                email_sent_at: new Date().toISOString()
              })
              .eq('id', notification.id)

            emailResults.push({
              userId,
              alertId: notification.alert_id,
              status: 'sent'
            })
          }
        }

        // For daily/weekly notifications, you would implement batching logic here
        // For now, we'll treat them the same as instant for demo purposes
        for (const notification of [...dailyNotifications, ...weeklyNotifications]) {
          const emailSent = await sendAlertEmail({
            to: profile.email,
            userName: profile.full_name || profile.username || 'User',
            alertName: notification.alert_name,
            alertType: notification.alert_type,
            matchesCount: notification.matches_count,
            alertId: notification.alert_id
          })

          if (emailSent) {
            await supabase
              .from('alert_notifications')
              .update({
                email_sent: true,
                email_sent_at: new Date().toISOString()
              })
              .eq('id', notification.id)

            emailResults.push({
              userId,
              alertId: notification.alert_id,
              status: 'sent'
            })
          }
        }

      } catch (error) {
        console.error(`Error sending email to user ${userId}:`, error)
        emailResults.push({
          userId,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      message: `Processed ${pendingNotifications.length} notifications`,
      results: emailResults
    })

  } catch (error) {
    console.error('Error in send-notifications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Mock email sending function - replace with your email service (SendGrid, Resend, etc.)
async function sendAlertEmail({
  to,
  userName,
  alertName,
  alertType,
  matchesCount,
  alertId
}: {
  to: string
  userName: string
  alertName: string
  alertType: string
  matchesCount: number
  alertId: string
}): Promise<boolean> {
  try {
    // This is where you would integrate with your email service
    // For example, using Resend, SendGrid, or similar
    
    const emailContent = {
      to,
      subject: `🔔 New ${alertType === 'profile' ? 'Profile' : 'Listing'} Match${matchesCount > 1 ? 'es' : ''} - ${alertName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Hello ${userName}!</h2>
          
          <p>Great news! Your alert "<strong>${alertName}</strong>" has found ${matchesCount} new match${matchesCount > 1 ? 'es' : ''}.</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #333;">Alert Details:</h3>
            <p style="margin: 5px 0;"><strong>Alert Name:</strong> ${alertName}</p>
            <p style="margin: 5px 0;"><strong>Type:</strong> ${alertType === 'profile' ? 'Profile' : 'Listing'} Alert</p>
            <p style="margin: 5px 0;"><strong>New Matches:</strong> ${matchesCount}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/my-alerts/${alertId}/matches" 
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Matches
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            You're receiving this email because you have an active alert on SweatShares. 
            You can manage your alerts <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/my-alerts">here</a>.
          </p>
        </div>
      `
    }

    // Mock successful email sending
    console.log('Email would be sent:', emailContent)
    
    // In a real implementation, you would call your email service here:
    // const result = await emailService.send(emailContent)
    // return result.success
    
    return true // Mock success
    
  } catch (error) {
    console.error('Error sending email:', error)
    return false
  }
}

// GET endpoint to trigger email sending manually (for testing)
export async function GET() {
  return POST(new NextRequest('http://localhost/api/alerts/send-notifications', { method: 'POST' }))
} 