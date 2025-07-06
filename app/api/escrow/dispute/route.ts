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

    const { escrowTransactionId, reason, initiatorRole } = await request.json();

    if (!escrowTransactionId || !reason || !initiatorRole) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify the escrow transaction exists and user has access
    const { data: escrowTransaction, error: escrowError } = await supabase
      .from('escrow_transactions')
      .select('*')
      .eq('id', escrowTransactionId)
      .single();

    if (escrowError || !escrowTransaction) {
      return NextResponse.json({ error: 'Escrow transaction not found' }, { status: 404 });
    }

    // Verify user is part of this transaction
    const isPayer = escrowTransaction.payer_id === user.id;
    const isPayee = escrowTransaction.payee_id === user.id;
    
    if (!isPayer && !isPayee) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Verify the role matches
    if ((initiatorRole === 'payer' && !isPayer) || (initiatorRole === 'payee' && !isPayee)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Create the dispute
    const { data: dispute, error: disputeError } = await supabase
      .from('escrow_disputes')
      .insert({
        escrow_transaction_id: escrowTransactionId,
        disputer_id: user.id,
        reason: reason,
        status: 'open'
      })
      .select()
      .single();

    if (disputeError) {
      console.error('Error creating dispute:', disputeError);
      return NextResponse.json({ error: 'Failed to create dispute' }, { status: 500 });
    }

    // Update escrow transaction status to disputed
    const { error: updateError } = await supabase
      .from('escrow_transactions')
      .update({ status: 'disputed' })
      .eq('id', escrowTransactionId);

    if (updateError) {
      console.error('Error updating escrow transaction:', updateError);
      // Don't fail the request if this update fails
    }

    // Send notification to the other party
    const otherPartyId = initiatorRole === 'payer' ? escrowTransaction.payee_id : escrowTransaction.payer_id;
    
    if (otherPartyId) {
      try {
        const disputeMessage = {
          type: 'escrow_dispute',
          escrow_transaction_id: escrowTransactionId,
          dispute_id: dispute.id,
          reason: reason,
          disputer_role: initiatorRole
        };

        await supabase
          .from('messages')
          .insert({
            sender_id: user.id,
            receiver_id: otherPartyId,
            content: JSON.stringify(disputeMessage),
            message_type: 'system'
          });
      } catch (messageError) {
        console.error('Error sending dispute notification:', messageError);
        // Don't fail the request if message sending fails
      }
    }

    return NextResponse.json({ 
      success: true, 
      dispute: dispute,
      message: 'Dispute created successfully' 
    });

  } catch (error) {
    console.error('Error in dispute endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const escrowTransactionId = searchParams.get('escrowTransactionId');

    if (!escrowTransactionId) {
      return NextResponse.json({ error: 'Missing escrow transaction ID' }, { status: 400 });
    }

    // Get disputes for the escrow transaction
    const { data: disputes, error: disputesError } = await supabase
      .from('escrow_disputes')
      .select(`
        *,
        escrow_transactions!inner(
          payer_id,
          payee_id
        )
      `)
      .eq('escrow_transaction_id', escrowTransactionId)
      .order('created_at', { ascending: false });

    if (disputesError) {
      console.error('Error fetching disputes:', disputesError);
      return NextResponse.json({ error: 'Failed to fetch disputes' }, { status: 500 });
    }

    // Filter disputes to only show those the user has access to
    const userDisputes = disputes.filter(dispute => {
      const transaction = dispute.escrow_transactions;
      return transaction.payer_id === user.id || transaction.payee_id === user.id;
    });

    return NextResponse.json({ disputes: userDisputes });

  } catch (error) {
    console.error('Error in dispute GET endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 