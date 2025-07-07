export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type AttachmentType = 'image' | 'video' | 'document'

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
          professional_role: string | null
          bio: string | null
          country: string | null
          is_online: boolean
          last_seen: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          username?: string | null
          email: string
          professional_role?: string | null
          bio?: string | null
          country?: string | null
          is_online?: boolean
          last_seen?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          username?: string | null
          email?: string
          professional_role?: string | null
          bio?: string | null
          country?: string | null
          is_online?: boolean
          last_seen?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      saved_profiles: {
        Row: {
          id: string
          user_id: string
          profile_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          profile_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          profile_id?: string
          created_at?: string
        }
      }
      liked_listings: {
        Row: {
          id: string
          user_id: string
          listing_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          listing_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          listing_id?: string
          created_at?: string
        }
      }
      post_attachments: {
        Row: {
          id: string
          post_id: string
          file_path: string
          file_name: string
          file_size: number
          content_type: string
          type: 'image' | 'video' | 'document'
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          file_path: string
          file_name: string
          file_size: number
          content_type: string
          type: 'image' | 'video' | 'document'
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          file_path?: string
          file_name?: string
          file_size?: number
          content_type?: string
          type?: 'image' | 'video' | 'document'
          created_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          user_id: string
          content: string
          tags: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          content: string
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          content?: string
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          post_id: string
          user_id: string
          content: string
          parent_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          content: string
          parent_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          content?: string
          parent_id?: string | null
          created_at?: string
        }
      }
      post_likes: {
        Row: {
          id: string
          post_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          created_at?: string
        }
      }
      comment_likes: {
        Row: {
          id: string
          comment_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          comment_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          comment_id?: string
          user_id?: string
          created_at?: string
        }
      }
      saved_posts: {
        Row: {
          id: string
          post_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          created_at?: string
        }
      }
      alerts: {
        Row: {
          id: string
          user_id: string
          name: string
          alert_type: 'profile' | 'listing'
          criteria: Json
          frequency: 'instant' | 'daily' | 'weekly'
          is_active: boolean
          last_checked_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          alert_type: 'profile' | 'listing'
          criteria: Json
          frequency?: 'instant' | 'daily' | 'weekly'
          is_active?: boolean
          last_checked_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          alert_type?: 'profile' | 'listing'
          criteria?: Json
          frequency?: 'instant' | 'daily' | 'weekly'
          is_active?: boolean
          last_checked_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      alert_matches: {
        Row: {
          id: string
          alert_id: string
          matched_entity_id: string
          matched_entity_type: 'profile' | 'listing'
          match_score: number
          notified: boolean
          created_at: string
        }
        Insert: {
          id?: string
          alert_id: string
          matched_entity_id: string
          matched_entity_type: 'profile' | 'listing'
          match_score?: number
          notified?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          alert_id?: string
          matched_entity_id?: string
          matched_entity_type?: 'profile' | 'listing'
          match_score?: number
          notified?: boolean
          created_at?: string
        }
      }
      alert_notifications: {
        Row: {
          id: string
          alert_id: string
          user_id: string
          notification_type: 'new_matches' | 'no_matches' | 'alert_created'
          matches_count: number
          email_sent: boolean
          email_sent_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          alert_id: string
          user_id: string
          notification_type: 'new_matches' | 'no_matches' | 'alert_created'
          matches_count?: number
          email_sent?: boolean
          email_sent_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          alert_id?: string
          user_id?: string
          notification_type?: 'new_matches' | 'no_matches' | 'alert_created'
          matches_count?: number
          email_sent?: boolean
          email_sent_at?: string | null
          created_at?: string
        }
      }
      connections: {
        Row: {
          id: string
          sender_id: string
          receiver_id: string
          status: 'pending' | 'accepted' | 'rejected'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          receiver_id: string
          status?: 'pending' | 'accepted' | 'rejected'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          sender_id?: string
          receiver_id?: string
          status?: 'pending' | 'accepted' | 'rejected'
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          sender_id: string
          receiver_id: string
          content: string
          read: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          receiver_id: string
          content: string
          read?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          sender_id?: string
          receiver_id?: string
          content?: string
          read?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      signatures: {
        Row: {
          id: string
          created_by: string
          signer_id: string
          document_name: string
          document_url: string
          status: 'pending' | 'signed' | 'completed'
          signed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          created_by: string
          signer_id: string
          document_name: string
          document_url: string
          status?: 'pending' | 'signed' | 'completed'
          signed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          created_by?: string
          signer_id?: string
          document_name?: string
          document_url?: string
          status?: 'pending' | 'signed' | 'completed'
          signed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'message' | 'connection_request' | 'connection_accepted' | 'invoice_request' | 'escrow_payment' | 'vault_share' | 'signature_request' | 'alert_match'
          title: string
          description: string
          data: Json
          read: boolean
          created_at: string
          updated_at: string
          message_id: string | null
          connection_id: string | null
          invoice_id: string | null
          signature_id: string | null
          alert_id: string | null
        }
        Insert: {
          id?: string
          user_id: string
          type: 'message' | 'connection_request' | 'connection_accepted' | 'invoice_request' | 'escrow_payment' | 'vault_share' | 'signature_request' | 'alert_match'
          title: string
          description: string
          data?: Json
          read?: boolean
          created_at?: string
          updated_at?: string
          message_id?: string | null
          connection_id?: string | null
          invoice_id?: string | null
          signature_id?: string | null
          alert_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'message' | 'connection_request' | 'connection_accepted' | 'invoice_request' | 'escrow_payment' | 'vault_share' | 'signature_request' | 'alert_match'
          title?: string
          description?: string
          data?: Json
          read?: boolean
          created_at?: string
          updated_at?: string
          message_id?: string | null
          connection_id?: string | null
          invoice_id?: string | null
          signature_id?: string | null
          alert_id?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_unread_notification_count: {
        Args: {
          p_user_id: string
        }
        Returns: number
      }
      mark_notifications_read: {
        Args: {
          p_user_id: string
          p_notification_ids?: string[]
          p_type?: string
        }
        Returns: number
      }
      create_notification: {
        Args: {
          p_user_id: string
          p_type: string
          p_title: string
          p_description: string
          p_data?: Json
          p_message_id?: string
          p_connection_id?: string
          p_invoice_id?: string
          p_signature_id?: string
          p_alert_id?: string
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
