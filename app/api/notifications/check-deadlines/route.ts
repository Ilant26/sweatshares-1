import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/lib/database.types'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerComponentClient<Database>({ cookies })
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Call the deadline notification function
    const { data, error } = await supabase.rpc('notify_approaching_deadlines')

    if (error) {
      console.error('Error checking deadlines:', error)
      return NextResponse.json({ error: 'Failed to check deadlines' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Deadline notifications checked successfully'
    })

  } catch (error) {
    console.error('Error in deadline check API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 