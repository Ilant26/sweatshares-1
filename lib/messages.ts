import { supabase } from './supabase'

export interface Message {
  id: string
  created_at: string
  sender_id: string
  receiver_id: string
  content: string
  read: boolean
  sender: {
    username: string
    full_name: string | null
    avatar_url: string | null
  }
}

export async function sendMessage(receiverId: string, content: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('messages')
    .insert({
      sender_id: user.id,
      receiver_id: receiverId,
      content,
      read: false
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getMessages(userId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:profiles!sender_id (
        username,
        full_name,
        avatar_url
      )
    `)
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data as Message[]
}

export async function markMessageAsRead(messageId: string) {
  const { data, error } = await supabase
    .from('messages')
    .update({ read: true })
    .eq('id', messageId)
    .select()
    .single()

  if (error) throw error
  return data
}

// Subscribe to new messages
export function subscribeToMessages(callback: (message: Message) => void) {
  return supabase
    .channel('messages')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      },
      (payload) => {
        callback(payload.new as Message)
      }
    )
    .subscribe()
} 