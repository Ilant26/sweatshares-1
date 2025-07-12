import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/lib/database.types'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerComponentClient<Database>({ cookies })
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const invoiceId = searchParams.get('invoice_id')

    // Build query
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // Add invoice filter if provided
    if (invoiceId) {
      query = query.eq('invoice_id', invoiceId)
    }

    // Add pagination
    query = query.range(offset, offset + limit - 1)

    const { data: notifications, error } = await query

    if (error) {
      console.error('Error fetching notifications:', error)
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
    }

    // Get unread count
    const { data: unreadCountResult } = await supabase
      .rpc('get_unread_notification_count', { user_uuid: user.id })

    return NextResponse.json({
      notifications: notifications || [],
      unread_count: unreadCountResult || 0,
      total: notifications?.length || 0
    })

  } catch (error) {
    console.error('Error in notifications API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerComponentClient<Database>({ cookies })
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { notification_ids, mark_all_read } = body

    if (mark_all_read) {
      // Mark all notifications as read for the current user
      const { error } = await supabase
        .rpc('mark_notifications_read', { 
          notification_ids: [], 
          user_uuid: null 
        })

      if (error) {
        console.error('Error marking all notifications as read:', error)
        return NextResponse.json({ error: 'Failed to mark notifications as read' }, { status: 500 })
      }
    } else if (notification_ids && Array.isArray(notification_ids)) {
      // Mark specific notifications as read
      const { error } = await supabase
        .rpc('mark_notifications_read', { 
          notification_ids, 
          user_uuid: user.id 
        })

      if (error) {
        console.error('Error marking notifications as read:', error)
        return NextResponse.json({ error: 'Failed to mark notifications as read' }, { status: 500 })
      }
    } else {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    // Get updated unread count
    const { data: unreadCount } = await supabase
      .rpc('get_unread_notification_count', { user_uuid: user.id })

    return NextResponse.json({ 
      success: true, 
      unread_count: unreadCount || 0 
    })

  } catch (error) {
    console.error('Error in notifications PUT API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 