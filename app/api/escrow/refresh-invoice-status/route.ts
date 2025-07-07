import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Add GET method for testing
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Refresh invoice status API is working',
    method: 'GET',
    timestamp: new Date().toISOString()
  });
}

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

    // Get the invoice first
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
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
    console.log('Invoice payment method:', invoice.payment_method);
    console.log('Invoice escrow_transaction_id:', invoice.escrow_transaction_id);

    // Check if this is an escrow invoice
    if (invoice.payment_method === 'escrow' && invoice.escrow_transaction_id) {
      // Get the escrow transaction separately
      const { data: escrowTransaction, error: escrowError } = await supabase
        .from('escrow_transactions')
        .select('id, status, stripe_payment_intent_id')
        .eq('id', invoice.escrow_transaction_id)
        .single();
      
      if (escrowError || !escrowTransaction) {
        console.log('No escrow transaction found for escrow invoice:', escrowError);
        return NextResponse.json({
          success: false,
          message: 'Escrow transaction not found for escrow invoice',
          currentStatus: invoice.status,
          paymentMethod: invoice.payment_method
        });
      }
      
      console.log('Escrow transaction status:', escrowTransaction.status);
      
      const escrowStatus = escrowTransaction.status;
      let newStatus = invoice.status;

      // Define escrow statuses that indicate payment has been completed
      const paidEscrowStatuses = ['funded', 'work_completed', 'approved', 'released'];
      const pendingEscrowStatuses = ['pending', 'pending_payment'];
      const failedEscrowStatuses = ['payment_failed', 'refunded'];

      // Update invoice status based on escrow transaction status
      if (paidEscrowStatuses.includes(escrowStatus) && invoice.status !== 'paid') {
        newStatus = 'paid';
      } else if (pendingEscrowStatuses.includes(escrowStatus) && invoice.status !== 'pending') {
        newStatus = 'pending';
      } else if (failedEscrowStatuses.includes(escrowStatus) && invoice.status !== 'cancelled') {
        newStatus = 'cancelled';
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
          escrowStatus: escrowStatus,
          escrowTransactionId: escrowTransaction.id
        });
      } else {
        console.log('Invoice status is already up to date');
        
        return NextResponse.json({
          success: true,
          message: 'Invoice status is up to date',
          currentStatus: invoice.status,
          escrowStatus: escrowStatus,
          escrowTransactionId: escrowTransaction.id
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