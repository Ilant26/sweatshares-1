import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      category,
      severity,
      description,
      steps_to_reproduce,
      expected_behavior,
      actual_behavior,
      browser,
      operating_system,
      device,
      userId
    } = body;

    // Validate required fields
    if (!title || !description || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Store the bug report in the database
    const { data: bugReport, error: dbError } = await supabase
      .from('bug_reports')
      .insert({
        user_id: userId,
        title,
        category,
        severity: severity || 'medium',
        description,
        steps_to_reproduce: steps_to_reproduce || null,
        expected_behavior: expected_behavior || null,
        actual_behavior: actual_behavior || null,
        browser: browser || null,
        os: operating_system || null,
        device: device || null,
        status: 'open'
      })
      .select()
      .single();

    if (dbError) {
      console.error('Error storing bug report:', dbError);
      return NextResponse.json(
        { error: 'Failed to store bug report' },
        { status: 500 }
      );
    }

    // Log the bug report for now
    // In production, you might want to send notifications to the development team
    console.log('Bug Report Submitted:', {
      id: bugReport.id,
      title,
      category,
      severity,
      user: userId,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Bug report submitted successfully',
      reportId: bugReport.id
    });

  } catch (error) {
    console.error('Error in bug report API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 