import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { createEscrowTransaction } from '@/lib/escrow';
import { Database } from '@/lib/database.types';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      invoiceId,
      amount,
      transactionType,
      payerId,
      description,
      customTimeline
    } = body;

    // Validate required fields
    if (!invoiceId || !amount || !transactionType || !payerId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create escrow transaction
    let escrowTransaction;
    try {
      escrowTransaction = await createEscrowTransaction(
        supabase,
        invoiceId,
        amount,
        transactionType,
        payerId,
        user.id,
        description,
        customTimeline
      );
      console.log('Escrow transaction created:', escrowTransaction);
    } catch (escrowError) {
      console.error('Error creating escrow transaction:', escrowError);
      return NextResponse.json(
        { error: 'Failed to create escrow transaction', details: escrowError },
        { status: 500 }
      );
    }

    // Update invoice with escrow transaction ID
    try {
      const { error: invoiceError } = await supabase
        .from('invoices')
        .update({
          escrow_transaction_id: escrowTransaction.id,
          transaction_type: transactionType,
          completion_deadline_days: escrowTransaction.completion_deadline_days,
          review_period_days: escrowTransaction.review_period_days
        })
        .eq('id', invoiceId);

      if (invoiceError) {
        console.error('Error updating invoice:', invoiceError);
        return NextResponse.json(
          { error: 'Failed to update invoice', details: invoiceError },
          { status: 500 }
        );
      }
    } catch (invoiceUpdateError) {
      console.error('Error updating invoice:', invoiceUpdateError);
      return NextResponse.json(
        { error: 'Failed to update invoice', details: invoiceUpdateError },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      escrowTransaction
    });

  } catch (error) {
    console.error('Error creating escrow transaction:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 