import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { submitWorkCompletion, getEscrowTransactions } from '@/lib/escrow';
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
      escrowTransactionId,
      description,
      notes,
      links,
      files
    } = body;

    // Validate required fields
    if (!escrowTransactionId || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Prepare completion proof object
    const completionProof = {
      description,
      notes,
      links: links?.filter((link: string) => link.trim()) || [],
      files: files || []
    };

    // Verify user is the payee for this transaction
    const { data: transaction, error: transactionError } = await supabase
      .from('escrow_transactions')
      .select('*')
      .eq('id', escrowTransactionId)
      .single();

    if (transactionError || !transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    if (transaction.payee_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - only payee can submit completion' },
        { status: 403 }
      );
    }

    if (transaction.status !== 'paid_in_escrow' && transaction.status !== 'funded' && transaction.status !== 'revision_requested') {
      return NextResponse.json(
        { error: 'Transaction is not in paid_in_escrow, funded, or revision_requested status' },
        { status: 400 }
      );
    }

    // Submit work completion
    const { data: updatedTransaction, error: submitError } = await supabase
      .from('escrow_transactions')
      .update({
        status: 'work_completed',
        completion_proof: completionProof,
        completion_submitted_at: new Date().toISOString(),
        dispute_reason: null, // Clear any previous revision request
        updated_at: new Date().toISOString()
      })
      .eq('id', escrowTransactionId)
      .select()
      .single();

    if (submitError) {
      console.error('Error submitting work completion:', submitError);
      return NextResponse.json(
        { error: 'Failed to submit work completion' },
        { status: 500 }
      );
    }

    // Update invoice status
    const { error: invoiceError } = await supabase
      .from('invoices')
      .update({
        completion_submitted: true,
        auto_release_date: updatedTransaction.auto_release_date
      })
      .eq('escrow_transaction_id', escrowTransactionId);

    if (invoiceError) {
      console.error('Error updating invoice:', invoiceError);
      return NextResponse.json(
        { error: 'Failed to update invoice' },
        { status: 500 }
      );
    }

    // Send notification to payer (you can implement this later)
    // await sendNotification(transaction.payer_id, 'work_completed', transactionId);

    return NextResponse.json({
      success: true,
      transaction: updatedTransaction
    });

  } catch (error) {
    console.error('Error submitting work completion:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 