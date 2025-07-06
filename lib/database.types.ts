export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      escrow_transactions: {
        Row: {
          id: string
          invoice_id: string
          stripe_payment_intent_id: string | null
          stripe_transfer_id: string | null
          amount: number
          currency: string
          transaction_type: 'work' | 'business_sale' | 'partnership' | 'service' | 'consulting' | 'investment' | 'other'
          status: 'pending' | 'pending_payment' | 'funded' | 'work_completed' | 'approved' | 'revision_requested' | 'disputed' | 'released' | 'refunded' | 'payment_failed'
          payment_status: 'pending' | 'completed' | 'failed'
          transfer_status: 'pending' | 'completed' | 'failed'
          transfer_failure_reason: string | null
          payer_id: string
          payee_id: string
          completion_deadline_days: number
          review_period_days: number
          completion_deadline_date: string | null
          auto_release_date: string | null
          completion_submitted_at: string | null
          completion_approved_at: string | null
          funds_released_at: string | null
          funded_at: string | null
          transferred_at: string | null
          dispute_reason: string | null
          transaction_description: string | null
          completion_proof: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          invoice_id: string
          stripe_payment_intent_id?: string | null
          stripe_transfer_id?: string | null
          amount: number
          currency?: string
          transaction_type: 'work' | 'business_sale' | 'partnership' | 'service' | 'consulting' | 'investment' | 'other'
          status?: 'pending' | 'pending_payment' | 'funded' | 'work_completed' | 'approved' | 'revision_requested' | 'disputed' | 'released' | 'refunded' | 'payment_failed'
          payment_status?: 'pending' | 'completed' | 'failed'
          transfer_status?: 'pending' | 'completed' | 'failed'
          transfer_failure_reason?: string | null
          payer_id: string
          payee_id: string
          completion_deadline_days?: number
          review_period_days?: number
          completion_deadline_date?: string | null
          auto_release_date?: string | null
          completion_submitted_at?: string | null
          completion_approved_at?: string | null
          funds_released_at?: string | null
          funded_at?: string | null
          transferred_at?: string | null
          dispute_reason?: string | null
          transaction_description?: string | null
          completion_proof?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          invoice_id?: string
          stripe_payment_intent_id?: string | null
          stripe_transfer_id?: string | null
          amount?: number
          currency?: string
          transaction_type?: 'work' | 'business_sale' | 'partnership' | 'service' | 'consulting' | 'investment' | 'other'
          status?: 'pending' | 'pending_payment' | 'funded' | 'work_completed' | 'approved' | 'revision_requested' | 'disputed' | 'released' | 'refunded' | 'payment_failed'
          payment_status?: 'pending' | 'completed' | 'failed'
          transfer_status?: 'pending' | 'completed' | 'failed'
          transfer_failure_reason?: string | null
          payer_id?: string
          payee_id?: string
          completion_deadline_days?: number
          review_period_days?: number
          completion_deadline_date?: string | null
          auto_release_date?: string | null
          completion_submitted_at?: string | null
          completion_approved_at?: string | null
          funds_released_at?: string | null
          funded_at?: string | null
          transferred_at?: string | null
          dispute_reason?: string | null
          transaction_description?: string | null
          completion_proof?: Json
          created_at?: string
          updated_at?: string
        }
      }
      escrow_disputes: {
        Row: {
          id: string
          escrow_transaction_id: string
          disputer_id: string
          reason: string
          evidence: string | null
          status: 'open' | 'under_review' | 'resolved_for_payer' | 'resolved_for_payee'
          resolution_notes: string | null
          created_at: string
          resolved_at: string | null
        }
        Insert: {
          id?: string
          escrow_transaction_id: string
          disputer_id: string
          reason: string
          evidence?: string | null
          status?: 'open' | 'under_review' | 'resolved_for_payer' | 'resolved_for_payee'
          resolution_notes?: string | null
          created_at?: string
          resolved_at?: string | null
        }
        Update: {
          id?: string
          escrow_transaction_id?: string
          disputer_id?: string
          reason?: string
          evidence?: string | null
          status?: 'open' | 'under_review' | 'resolved_for_payer' | 'resolved_for_payee'
          resolution_notes?: string | null
          created_at?: string
          resolved_at?: string | null
        }
      }
      stripe_connect_accounts: {
        Row: {
          id: string
          user_id: string
          stripe_account_id: string
          account_status: 'pending' | 'active' | 'restricted' | 'disabled'
          onboarding_completed: boolean
          payouts_enabled: boolean
          charges_enabled: boolean
          user_type: 'Founder' | 'Investor' | 'Expert' | 'Freelancer' | 'Consultant'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stripe_account_id: string
          account_status?: 'pending' | 'active' | 'restricted' | 'disabled'
          onboarding_completed?: boolean
          payouts_enabled?: boolean
          charges_enabled?: boolean
          user_type: 'Founder' | 'Investor' | 'Expert' | 'Freelancer' | 'Consultant'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          stripe_account_id?: string
          account_status?: 'pending' | 'active' | 'restricted' | 'disabled'
          onboarding_completed?: boolean
          payouts_enabled?: boolean
          charges_enabled?: boolean
          user_type?: 'Founder' | 'Investor' | 'Expert' | 'Freelancer' | 'Consultant'
          created_at?: string
          updated_at?: string
        }
      }
      invoices: {
        Row: {
          id: string
          invoice_number: string
          sender_id: string
          receiver_id: string | null
          external_client_id: string | null
          issue_date: string
          due_date: string
          amount: number
          status: string
          description: string | null
          items: Json
          currency: string
          vat_enabled: boolean
          vat_rate: number
          vat_amount: number
          subtotal: number
          total: number
          payment_method: string
          escrow_transaction_id: string | null
          completion_submitted: boolean
          completion_approved: boolean
          completion_deadline_days: number
          review_period_days: number
          auto_release_date: string | null
          transaction_type: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          invoice_number: string
          sender_id: string
          receiver_id?: string | null
          external_client_id?: string | null
          issue_date: string
          due_date: string
          amount: number
          status?: string
          description?: string | null
          items?: Json
          currency?: string
          vat_enabled?: boolean
          vat_rate?: number
          vat_amount?: number
          subtotal?: number
          total?: number
          payment_method?: string
          escrow_transaction_id?: string | null
          completion_submitted?: boolean
          completion_approved?: boolean
          completion_deadline_days?: number
          review_period_days?: number
          auto_release_date?: string | null
          transaction_type?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          invoice_number?: string
          sender_id?: string
          receiver_id?: string | null
          external_client_id?: string | null
          issue_date?: string
          due_date?: string
          amount?: number
          status?: string
          description?: string | null
          items?: Json
          currency?: string
          vat_enabled?: boolean
          vat_rate?: number
          vat_amount?: number
          subtotal?: number
          total?: number
          payment_method?: string
          escrow_transaction_id?: string | null
          completion_submitted?: boolean
          completion_approved?: boolean
          completion_deadline_days?: number
          review_period_days?: number
          auto_release_date?: string | null
          transaction_type?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          username: string | null
          email: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          username?: string | null
          email: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          username?: string | null
          email?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
