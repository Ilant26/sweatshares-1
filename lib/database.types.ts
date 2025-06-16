import { InvoiceItem } from './invoices';

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
      profiles: {
        Row: {
          id: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          website: string | null
          bio: string | null
          professional_role: string | null
          country: string | null
          languages: string | null
          phone_number: string | null
          email_notifications: boolean
          two_factor_enabled: boolean
          onboarding_completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          website?: string | null
          bio?: string | null
          professional_role?: string | null
          country?: string | null
          languages?: string | null
          phone_number?: string | null
          email_notifications?: boolean
          two_factor_enabled?: boolean
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          website?: string | null
          bio?: string | null
          professional_role?: string | null
          country?: string | null
          languages?: string | null
          phone_number?: string | null
          email_notifications?: boolean
          two_factor_enabled?: boolean
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
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
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'connection_request' | 'connection_response'
          content: string
          sender_id: string
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'connection_request' | 'connection_response'
          content: string
          sender_id: string
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'connection_request' | 'connection_response'
          content?: string
          sender_id?: string
          read?: boolean
          created_at?: string
        }
      }
      vault_documents: {
        Row: {
          id: string
          owner_id: string
          filename: string
          filepath: string
          description: string | null
          is_encrypted: boolean
          type: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          filename: string
          filepath: string
          description?: string | null
          is_encrypted?: boolean
          type?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          filename?: string
          filepath?: string
          description?: string | null
          is_encrypted?: boolean
          type?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      external_clients: {
        Row: {
          id: string;
          user_id: string;
          company_name: string | null;
          contact_name: string;
          email: string;
          phone: string | null;
          address: string | null;
          tax_id: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          company_name?: string | null;
          contact_name: string;
          email: string;
          phone?: string | null;
          address?: string | null;
          tax_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          company_name?: string | null;
          contact_name?: string;
          email?: string;
          phone?: string | null;
          address?: string | null;
          tax_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      }
      invoices: {
        Row: {
          id: string;
          invoice_number: string;
          sender_id: string;
          receiver_id: string | null;
          external_client_id: string | null;
          issue_date: string;
          due_date: string;
          amount: number;
          currency: string;
          status: 'pending' | 'paid' | 'cancelled';
          description: string | null;
          items: InvoiceItem[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          invoice_number: string;
          sender_id: string;
          receiver_id?: string | null;
          external_client_id?: string | null;
          issue_date: string;
          due_date: string;
          amount: number;
          currency: string;
          status?: 'pending' | 'paid' | 'cancelled';
          description?: string | null;
          items: InvoiceItem[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          invoice_number?: string;
          sender_id?: string;
          receiver_id?: string | null;
          external_client_id?: string | null;
          issue_date?: string;
          due_date?: string;
          amount?: number;
          currency?: string;
          status?: 'pending' | 'paid' | 'cancelled';
          description?: string | null;
          items?: InvoiceItem[];
          created_at?: string;
          updated_at?: string;
        };
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
