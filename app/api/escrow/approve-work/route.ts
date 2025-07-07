import { NextRequest, NextResponse } from 'next/server';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { approveWorkCompletion, getEscrowTransactions, calculatePlatformFee, calculateSellerAmount } from '@/lib/escrow';
import { stripe } from '@/lib/stripe';

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClientComponentClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      escrowTransactionId, 
      approve, 
      rejectionReason 
    } = body;

    // Validate required fields
    if (!escrowTransactionId) {
      return NextResponse.json(
        { error: 'Missing escrow transaction ID' },
        { status: 400 }
      );
    }

    // Verify user is the payer for this transaction
    const transactions = await getEscrowTransactions(user.id);
    const transaction = transactions.find(t => t.id === escrowTransactionId);
    
    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    if (transaction.payer_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - only payer can approve work' },
        { status: 403 }
      );
    }

    if (transaction.status !== 'work_completed') {
      return NextResponse.json(
        { error: 'Transaction is not in work_completed status' },
        { status: 400 }
      );
    }

    let updatedTransaction;
    let transfer = null;
    let platformFee = 0;
    let sellerAmount = 0;

    if (approve) {
      // Calculate amounts for tracking purposes
      platformFee = calculatePlatformFee(transaction.amount);
      sellerAmount = calculateSellerAmount(transaction.amount);

      // With on_behalf_of payments, all funds are settled directly in the connected account
      // Platform fee tracking is handled in the application layer for reporting purposes
      // The payee receives the full amount, and platform fees are tracked separately
      console.log('Approving work completion - with on_behalf_of payment structure');
      console.log({
        transactionId: escrowTransactionId,
        amount: transaction.amount,
        platformFee,
        sellerAmount,
        connectAccountId: transaction.stripe_connect_account_id,
        note: 'Platform fee tracking handled in application layer'
      });

      // Approve work completion (this updates status to 'approved' and sets timestamps)
      updatedTransaction = await approveWorkCompletion(escrowTransactionId);

      // Update invoice status
      const { error: invoiceError } = await supabase
        .from('invoices')
        .update({
          status: 'paid',
          completion_approved: true
        })
        .eq('escrow_transaction_id', escrowTransactionId);
    } else {
      // Request revision
      if (!rejectionReason) {
        return NextResponse.json(
          { error: 'Rejection reason is required' },
          { status: 400 }
        );
      }

      updatedTransaction = await supabase
        .from('escrow_transactions')
        .update({
          status: 'revision_requested',
          dispute_reason: rejectionReason,
          updated_at: new Date().toISOString()
        })
        .eq('id', escrowTransactionId)
        .select()
        .single();

      if (updatedTransaction.error) {
        return NextResponse.json(
          { error: 'Failed to update transaction' },
          { status: 500 }
        );
      }
    }

    // Send notification to payee (you can implement this later)
    // await sendNotification(transaction.payee_id, 'work_approved', escrowTransactionId);

    return NextResponse.json({
      success: true,
      transaction: updatedTransaction,
      transfer: transfer || null,
      platformFee,
      sellerAmount,
      fundsAlreadySettled: approve, // Indicate funds were already settled with on_behalf_of payment
      paymentStructure: 'on_behalf_of', // Indicate the payment structure used
      note: approve ? 'Payee receives full amount with on_behalf_of payment structure' : undefined
    });

  } catch (error) {
    console.error('Error approving work:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 