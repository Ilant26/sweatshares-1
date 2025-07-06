import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { invoiceId } = await request.json();

    if (!invoiceId) {
      return NextResponse.json(
        { error: 'Missing invoiceId' },
        { status: 400 }
      );
    }

    console.log('Refreshing invoice status for invoice:', invoiceId);

    const supabase = createRouteHandlerClient({ cookies });
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    // Get the invoice and its escrow transaction
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        escrow_transactions (
          id,
          status,
          stripe_payment_intent_id
        )
      `)
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      console.error('Error fetching invoice:', invoiceError);
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    console.log('Current invoice status:', invoice.status);
    console.log('Escrow transaction status:', invoice.escrow_transactions?.status);

    // Check if this is an escrow invoice
    if (invoice.payment_method === 'escrow' && invoice.escrow_transactions) {
      const escrowStatus = invoice.escrow_transactions.status;
      let newStatus = invoice.status;

      // Update invoice status based on escrow transaction status
      if (escrowStatus === 'funded' && invoice.status !== 'paid') {
        newStatus = 'paid';
      } else if (escrowStatus === 'pending' && invoice.status !== 'pending') {
        newStatus = 'pending';
      } else if (escrowStatus === 'payment_failed' && invoice.status !== 'payment_failed') {
        newStatus = 'payment_failed';
      }

      // Update the invoice if status needs to change
      if (newStatus !== invoice.status) {
        console.log(`Updating invoice status from ${invoice.status} to ${newStatus}`);
        
        const { error: updateError } = await supabase
          .from('invoices')
          .update({
            status: newStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', invoiceId);

        if (updateError) {
          console.error('Error updating invoice status:', updateError);
          return NextResponse.json(
            { error: 'Failed to update invoice status' },
            { status: 500 }
          );
        }

        console.log('Invoice status updated successfully');
        
        return NextResponse.json({
          success: true,
          message: 'Invoice status refreshed',
          previousStatus: invoice.status,
          newStatus: newStatus,
          escrowStatus: escrowStatus
        });
      } else {
        console.log('Invoice status is already up to date');
        
        return NextResponse.json({
          success: true,
          message: 'Invoice status is up to date',
          currentStatus: invoice.status,
          escrowStatus: escrowStatus
        });
      }
    } else {
      console.log('Invoice is not an escrow invoice or has no escrow transaction');
      
      return NextResponse.json({
        success: true,
        message: 'Invoice is not an escrow invoice',
        currentStatus: invoice.status,
        paymentMethod: invoice.payment_method
      });
    }

  } catch (error) {
    console.error('Refresh invoice status error:', error);
    return NextResponse.json(
      { error: 'Failed to refresh invoice status' },
      { status: 500 }
    );
  }
} 