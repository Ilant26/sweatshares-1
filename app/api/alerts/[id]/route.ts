import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/lib/database.types'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: alert, error } = await supabase
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
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Alert not found' }, { status: 404 })
      }
      console.error('Error fetching alert:', error)
      return NextResponse.json({ error: 'Failed to fetch alert' }, { status: 500 })
    }

    return NextResponse.json({ alert })
  } catch (error) {
    console.error('Error in alert GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, criteria, frequency, is_active } = body

    // Build update object with only provided fields
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (criteria !== undefined) updateData.criteria = criteria
    if (frequency !== undefined) {
      if (!['instant', 'daily', 'weekly'].includes(frequency)) {
        return NextResponse.json({ 
          error: 'Invalid frequency. Must be "instant", "daily", or "weekly"' 
        }, { status: 400 })
      }
      updateData.frequency = frequency
    }
    if (is_active !== undefined) updateData.is_active = is_active

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const { data: alert, error } = await supabase
      .from('alerts')
      .update(updateData)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Alert not found' }, { status: 404 })
      }
      console.error('Error updating alert:', error)
      return NextResponse.json({ error: 'Failed to update alert' }, { status: 500 })
    }

    return NextResponse.json({ alert })
  } catch (error) {
    console.error('Error in alert PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabase
      .from('alerts')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting alert:', error)
      return NextResponse.json({ error: 'Failed to delete alert' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Alert deleted successfully' })
  } catch (error) {
    console.error('Error in alert DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 