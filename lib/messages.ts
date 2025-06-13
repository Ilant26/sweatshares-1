import { supabase } from './supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

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

export interface UserStatus {
  id: string
  username: string
  avatar_url: string | null
  last_seen: string
  is_online: boolean
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
    .select(`
      *,
      sender:profiles!sender_id (
        username,
        full_name,
        avatar_url
      )
    `)
    .single()

  if (error) throw error
  return data as Message
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

export async function getUserStatus(userId: string): Promise<UserStatus | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, last_seen, is_online')
    .eq('id', userId)
    .single()

  if (error) throw error
  return data
}

export async function updateUserStatus(isOnline: boolean) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('profiles')
    .update({
      is_online: isOnline,
      last_seen: new Date().toISOString()
    })
    .eq('id', user.id)

  if (error) throw error
}

export async function getProfileById(userId: string) {
    const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .eq('id', userId)
        .single();
    if (error) throw error;
    return data;
}

let sharedChannel: RealtimeChannel | null = null;
let messageCallbacks: ((message: any) => void)[] = [];

export function subscribeToMessages(callback: (message: any) => void) {
    // Add callback to the list
    messageCallbacks.push(callback);

    // If channel doesn't exist, create it
    if (!sharedChannel) {
        try {
            sharedChannel = supabase
                .channel('messages')
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'messages'
                    },
                    (payload) => {
                        // Notify all callbacks
                        messageCallbacks.forEach(cb => {
                            try {
                                cb(payload.new);
                            } catch (err) {
                                console.error('Error in message callback:', err);
                            }
                        });
                    }
                )
                .subscribe((status) => {
                    if (status === 'SUBSCRIBED') {
                        console.log('Successfully subscribed to messages channel');
                    } else {
                        console.error('Failed to subscribe to messages channel:', status);
                    }
                });
        } catch (err) {
            console.error('Error setting up message subscription:', err);
            throw err;
        }
    }

    // Return unsubscribe function
    return {
        unsubscribe: () => {
            // Remove this callback
            messageCallbacks = messageCallbacks.filter(cb => cb !== callback);
            
            // If no more callbacks, unsubscribe from channel
            if (messageCallbacks.length === 0 && sharedChannel) {
                try {
                    sharedChannel.unsubscribe();
                    sharedChannel = null;
                } catch (err) {
                    console.error('Error unsubscribing from channel:', err);
                }
            }
        }
    };
}

// Subscribe to user status changes
export function subscribeToUserStatus(userId: string, callback: (status: UserStatus) => void) {
  return supabase
    .channel(`user-status-${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${userId}`
      },
      (payload) => {
        callback(payload.new as UserStatus)
      }
    )
    .subscribe()
}

// Handle user presence
export function handleUserPresence() {
  updateUserStatus(true)

  // Update status when user leaves/closes the page
  window.addEventListener('beforeunload', () => {
    updateUserStatus(false)
  })

  // Update status periodically to maintain online presence
  const interval = setInterval(() => {
    updateUserStatus(true)
  }, 60000) // Every minute

  return () => {
    clearInterval(interval)
    updateUserStatus(false)
  }
} 