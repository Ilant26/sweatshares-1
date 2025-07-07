import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/lib/database.types'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // 'active', 'inactive', or null for all

    let query = supabase
      .from('alerts')
      .select(`
        *,
        alert_matches(
          id,
          matched_entity_id,
          matched_entity_type,
          notified,
          created_at
        ),
        alert_notifications(
          id,
          notification_type,
          matches_count,
          created_at
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (status === 'active') {
      query = query.eq('is_active', true)
    } else if (status === 'inactive') {
      query = query.eq('is_active', false)
    }

    const { data: alerts, error } = await query

    if (error) {
      console.error('Error fetching alerts:', error)
      return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 })
    }

    return NextResponse.json({ alerts })
  } catch (error) {
    console.error('Error in alerts GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, alert_type, criteria, frequency = 'instant' } = body

    // Validate required fields
    if (!name || !alert_type || !criteria) {
      return NextResponse.json({ 
        error: 'Missing required fields: name, alert_type, criteria' 
      }, { status: 400 })
    }

    // Validate alert_type
    if (!['profile', 'listing'].includes(alert_type)) {
      return NextResponse.json({ 
        error: 'Invalid alert_type. Must be "profile" or "listing"' 
      }, { status: 400 })
    }

    // Validate frequency
    if (!['instant', 'daily', 'weekly'].includes(frequency)) {
      return NextResponse.json({ 
        error: 'Invalid frequency. Must be "instant", "daily", or "weekly"' 
      }, { status: 400 })
    }

    // Create the alert
    const { data: alert, error } = await supabase
      .from('alerts')
      .insert({
        user_id: user.id,
        name,
        alert_type,
        criteria,
        frequency,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating alert:', error)
      return NextResponse.json({ error: 'Failed to create alert' }, { status: 500 })
    }

    // Create notification for alert creation
    await supabase
      .from('alert_notifications')
      .insert({
        alert_id: alert.id,
        user_id: user.id,
        notification_type: 'alert_created',
        matches_count: 0
      })

    // Trigger initial matching for existing data
    if (alert_type === 'profile') {
      // Match against existing profiles
      const { error: matchError } = await supabase.rpc('match_profile_against_alerts', {
        profile_id: null // This will be handled differently - we need to match the alert against all profiles
      })
      if (matchError) {
        console.error('Error running initial profile matching:', matchError)
      }
    } else if (alert_type === 'listing') {
      // Match against existing listings
      const { error: matchError } = await supabase.rpc('match_listing_against_alerts', {
        listing_id: null // This will be handled differently - we need to match the alert against all listings
      })
      if (matchError) {
        console.error('Error running initial listing matching:', matchError)
      }
    }

    return NextResponse.json({ alert }, { status: 201 })
  } catch (error) {
    console.error('Error in alerts POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 