import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/lib/database.types'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // First verify the alert belongs to the user
    const { data: alert, error: alertError } = await supabase
      .from('alerts')
      .select('id, alert_type')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (alertError) {
      if (alertError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Alert not found' }, { status: 404 })
      }
      console.error('Error fetching alert:', alertError)
      return NextResponse.json({ error: 'Failed to fetch alert' }, { status: 500 })
    }

    // Get matches for this alert
    const { data: matches, error: matchesError } = await supabase
      .from('alert_matches')
      .select('*')
      .eq('alert_id', id)
      .order('created_at', { ascending: false })

    if (matchesError) {
      console.error('Error fetching matches:', matchesError)
      return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 })
    }

    // Fetch detailed information for each match
    const detailedMatches = []
    
    for (const match of matches) {
      if (match.matched_entity_type === 'profile') {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select(`
            id,
            full_name,
            avatar_url,
            username,
            professional_role,
            bio,
            country,
            skills,
            profile_type,
            created_at
          `)
          .eq('id', match.matched_entity_id)
          .single()

        if (!profileError && profile) {
          detailedMatches.push({
            ...match,
            entity_data: profile
          })
        }
      } else if (match.matched_entity_type === 'listing') {
        const { data: listing, error: listingError } = await supabase
          .from('listings')
          .select(`
            id,
            title,
            description,
            listing_type,
            profile_type,
            skills,
            location_country,
            location_city,
            sector,
            funding_stage,
            compensation_type,
            created_at,
            profiles!listings_user_id_fkey(
              id,
              full_name,
              avatar_url,
              username
            )
          `)
          .eq('id', match.matched_entity_id)
          .single()

        if (!listingError && listing) {
          detailedMatches.push({
            ...match,
            entity_data: listing
          })
        }
      }
    }

    // Mark matches as notified (user has viewed them)
    if (matches.length > 0) {
      await supabase
        .from('alert_matches')
        .update({ notified: true })
        .eq('alert_id', id)
        .eq('notified', false)
    }

    return NextResponse.json({ 
      alert_type: alert.alert_type,
      matches: detailedMatches 
    })
  } catch (error) {
    console.error('Error in alert matches GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 