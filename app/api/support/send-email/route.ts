import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { sendSupportEmail } from '@/lib/email';

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
      name,
      email,
      subject,
      category,
      message,
      userId
    } = body;

    // Validate required fields
    if (!name || !email || !subject || !category || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Store the support request in the database
    const { data: supportRequest, error: dbError } = await supabase
      .from('support_requests')
      .insert({
        user_id: userId,
        name,
        email,
        subject,
        category,
        message,
        status: 'pending'
      })
      .select()
      .single();

    if (dbError) {
      console.error('Error storing support request:', dbError);
      return NextResponse.json(
        { error: 'Failed to store support request' },
        { status: 500 }
      );
    }

    // Send email notification to support team
    const emailSent = await sendSupportEmail({
      name,
      email,
      subject,
      category,
      message,
      userId,
      requestId: supportRequest.id
    });

    if (!emailSent) {
      console.warn('Failed to send support email, but request was stored in database');
    }

    return NextResponse.json({
      success: true,
      message: 'Support request submitted successfully',
      requestId: supportRequest.id
    });

  } catch (error) {
    console.error('Error in support email API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 