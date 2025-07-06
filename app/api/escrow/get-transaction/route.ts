import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/lib/database.types';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { escrowTransactionId } = await request.json();

    if (!escrowTransactionId) {
      return NextResponse.json({ error: 'Missing escrow transaction ID' }, { status: 400 });
    }

    // Get the escrow transaction
    const { data: escrowTransaction, error: escrowError } = await supabase
      .from('escrow_transactions')
      .select('*')
      .eq('id', escrowTransactionId)
      .single();

    if (escrowError || !escrowTransaction) {
      return NextResponse.json({ error: 'Escrow transaction not found' }, { status: 404 });
    }

    // Verify user is the payer
    if (escrowTransaction.payer_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      escrowTransaction: {
        id: escrowTransaction.id,
        payerId: escrowTransaction.payer_id,
        payeeId: escrowTransaction.payee_id,
        amount: escrowTransaction.amount,
        currency: escrowTransaction.currency,
        status: escrowTransaction.status,
        invoiceId: escrowTransaction.invoice_id
      }
    });

  } catch (error) {
    console.error('Error getting escrow transaction:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 