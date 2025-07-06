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

    console.log('Debug request for escrow transaction:', escrowTransactionId);

    // Get the escrow transaction
    const { data: escrowTransaction, error: escrowError } = await supabase
      .from('escrow_transactions')
      .select('*')
      .eq('id', escrowTransactionId)
      .single();

    if (escrowError || !escrowTransaction) {
      return NextResponse.json({ 
        error: 'Escrow transaction not found',
        debug: { escrowError, escrowTransactionId }
      }, { status: 404 });
    }

    console.log('Found escrow transaction:', {
      id: escrowTransaction.id,
      payeeId: escrowTransaction.payee_id,
      payerId: escrowTransaction.payer_id,
      stripeConnectAccountId: escrowTransaction.stripe_connect_account_id,
      status: escrowTransaction.status
    });

    // Get payee's profile
    const { data: payeeProfile, error: payeeError } = await supabase
      .from('profiles')
      .select('id, full_name, username, email')
      .eq('id', escrowTransaction.payee_id)
      .single();

    // Get payee's Stripe Connect accounts
    const { data: payeeStripeAccounts, error: stripeError } = await supabase
      .from('stripe_connect_accounts')
      .select('*')
      .eq('user_id', escrowTransaction.payee_id);

    // Get payer's Stripe Connect accounts
    const { data: payerStripeAccounts, error: payerStripeError } = await supabase
      .from('stripe_connect_accounts')
      .select('*')
      .eq('user_id', escrowTransaction.payer_id);

    // Get the invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', escrowTransaction.invoice_id)
      .single();

    const debugInfo = {
      escrowTransaction: {
        id: escrowTransaction.id,
        payeeId: escrowTransaction.payee_id,
        payerId: escrowTransaction.payer_id,
        stripeConnectAccountId: escrowTransaction.stripe_connect_account_id,
        status: escrowTransaction.status,
        amount: escrowTransaction.amount,
        currency: escrowTransaction.currency
      },
      payeeProfile: payeeProfile ? {
        id: payeeProfile.id,
        fullName: payeeProfile.full_name,
        username: payeeProfile.username,
        email: payeeProfile.email
      } : null,
      payeeStripeAccounts: payeeStripeAccounts || [],
      payerStripeAccounts: payerStripeAccounts || [],
      invoice: invoice ? {
        id: invoice.id,
        invoiceNumber: invoice.invoice_number,
        senderId: invoice.sender_id,
        receiverId: invoice.receiver_id,
        paymentMethod: invoice.payment_method
      } : null,
      currentUser: {
        id: user.id,
        isPayer: escrowTransaction.payer_id === user.id,
        isPayee: escrowTransaction.payee_id === user.id
      },
      errors: {
        payeeError,
        stripeError,
        payerStripeError,
        invoiceError
      }
    };

    console.log('Debug info:', JSON.stringify(debugInfo, null, 2));

    return NextResponse.json({
      success: true,
      debugInfo
    });

  } catch (error) {
    console.error('Error in debug endpoint:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      debug: { error: error instanceof Error ? error.message : 'Unknown error' }
    }, { status: 500 });
  }
} 