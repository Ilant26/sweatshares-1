import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { invoiceId, status } = await request.json();

    if (!invoiceId || !status) {
      return NextResponse.json(
        { error: 'Missing invoiceId or status' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    console.log('Updating invoice status:', { invoiceId, status });

    // Update invoice status
    const { data: updatedInvoice, error: updateError } = await supabase
      .from('invoices')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', invoiceId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating invoice status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update invoice status', details: updateError },
        { status: 500 }
      );
    }

    console.log('Invoice status updated successfully:', updatedInvoice);

    return NextResponse.json({
      success: true,
      invoice: updatedInvoice
    });

  } catch (error) {
    console.error('Error updating invoice status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get('invoiceId');

    if (!invoiceId) {
      return NextResponse.json(
        { error: 'Missing invoiceId parameter' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    // Get invoice with escrow transaction info
    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select(`
        *,
        escrow_transactions (
          id,
          status,
          stripe_payment_intent_id,
          created_at,
          updated_at
        )
      `)
      .eq('id', invoiceId)
      .single();

    if (fetchError) {
      console.error('Error fetching invoice:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch invoice', details: fetchError },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      invoice
    });

  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 