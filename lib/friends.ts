import { supabase } from './supabase'

export type FriendStatus = 'pending' | 'accepted' | 'rejected'

export interface Friend {
  id: string
  user_id: string
  friend_id: string
  status: FriendStatus
  created_at: string
  profile: {
    username: string
    full_name: string | null
    avatar_url: string | null
  }
}

export async function sendFriendRequest(friendId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('friendships')
    .insert({
      user_id: user.id,
      friend_id: friendId,
      status: 'pending'
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function acceptFriendRequest(friendshipId: string) {
  const { data, error } = await supabase
    .from('friendships')
    .update({ status: 'accepted' })
    .eq('id', friendshipId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function rejectFriendRequest(friendshipId: string) {
  const { data, error } = await supabase
    .from('friendships')
    .update({ status: 'rejected' })
    .eq('id', friendshipId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getFriends(status: FriendStatus = 'accepted') {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('friendships')
    .select(`
      *,
      profile:profiles!friend_id (
        username,
        full_name,
        avatar_url
      )
    `)
    .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
    .eq('status', status)

  if (error) throw error
  return data as Friend[]
}

export async function getPendingFriendRequests() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('friendships')
    .select(`
      *,
      profile:profiles!user_id (
        username,
        full_name,
        avatar_url
      )
    `)
    .eq('friend_id', user.id)
    .eq('status', 'pending')

  if (error) throw error
  return data as Friend[]
} 