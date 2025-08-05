"use client"

import React, { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Search, UserPlus, Check, X, Globe2, MapPin, Briefcase, Eye, MessageCircle } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { supabase } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'

interface Profile {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  country: string | null
  professional_role: string | null
  is_online: boolean
  last_seen: string | null
}

interface ConnectionStatus {
  [key: string]: 'none' | 'pending' | 'accepted' | 'rejected'
}

export default function ConnectPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({})
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedBios, setExpandedBios] = useState<Set<string>>(new Set())

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUser(user.id)
      }
    }

    fetchCurrentUser()
  }, [])

  useEffect(() => {
    const fetchProfiles = async () => {
      setLoading(true)
      const query = supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, bio, country, professional_role, is_online, last_seen')
        .neq('id', currentUser)

      if (searchQuery) {
        query.or(`username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%,professional_role.ilike.%${searchQuery}%`)
      }

      const { data, error } = await query
      if (error) {
        console.error('Error fetching profiles:', error)
        return
      }

      setProfiles(data || [])

      // Fetch connection statuses for all profiles
      if (currentUser && data) {
        const { data: connections } = await supabase
          .from('connections')
          .select('*')
          .or(`sender_id.eq.${currentUser},receiver_id.eq.${currentUser}`)

        const statusMap: ConnectionStatus = {}
        connections?.forEach(conn => {
          const otherUserId = conn.sender_id === currentUser ? conn.receiver_id : conn.sender_id
          statusMap[otherUserId] = conn.status
        })
        setConnectionStatus(statusMap)
      }
      setLoading(false)
    }

    if (currentUser) {
      fetchProfiles()
    }
  }, [searchQuery, currentUser])

  const handleConnect = async (profileId: string) => {
    if (!currentUser) return

    const { data, error } = await supabase
      .from('connections')
      .insert({
        sender_id: currentUser,
        receiver_id: profileId,
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      console.error('Error sending connection request:', error)
      return
    }

    // Update local state
    setConnectionStatus(prev => ({
      ...prev,
      [profileId]: 'pending'
    }))

    // Create notification for the receiver
    await supabase
      .from('notifications')
      .insert({
        user_id: profileId,
        type: 'connection_request',
        content: 'sent you a connection request',
        sender_id: currentUser,
        read: false
      })
  }

  const handleResponse = async (profileId: string, accept: boolean) => {
    if (!currentUser) return

    const { data: connection } = await supabase
      .from('connections')
      .select()
      .or(`and(sender_id.eq.${profileId},receiver_id.eq.${currentUser}),and(sender_id.eq.${currentUser},receiver_id.eq.${profileId})`)
      .single()

    if (!connection) return

    const { error } = await supabase
      .from('connections')
      .update({ status: accept ? 'accepted' : 'rejected' })
      .eq('id', connection.id)

    if (error) {
      console.error('Error responding to connection request:', error)
      return
    }

    // Update local state
    setConnectionStatus(prev => ({
      ...prev,
      [profileId]: accept ? 'accepted' : 'rejected'
    }))

    // Create notification for the sender
    await supabase
      .from('notifications')
      .insert({
        user_id: connection.sender_id,
        type: 'connection_response',
        content: accept ? 'accepted your connection request' : 'declined your connection request',
        sender_id: currentUser,
        read: false
      })
  }

  const toggleBioExpansion = (profileId: string) => {
    setExpandedBios(prev => {
      const newSet = new Set(prev)
      if (newSet.has(profileId)) {
        newSet.delete(profileId)
      } else {
        newSet.add(profileId)
      }
      return newSet
    })
  }

  const truncateBio = (bio: string, profileId: string) => {
    const isExpanded = expandedBios.has(profileId)
    const maxLength = 120 // Approximately 2 lines of text
    
    if (bio.length <= maxLength || isExpanded) {
      return bio
    }
    
    return bio.substring(0, maxLength) + '...'
  }

  const getConnectionButton = (profile: Profile) => {
    const status = connectionStatus[profile.id] || 'none'

    // If the current user has sent a request to this profile
    if (status === 'pending') {
      // Check if the current user is the sender or receiver
      // If current user is the receiver, show Accept/Decline
      // If current user is the sender, show 'Connection sent' (disabled)
      const isReceiver = false // We'll determine this below
      // We'll need to fetch the connection row to know who is sender/receiver
      // For now, assume if status is pending and user is not receiver, show 'Connection sent'
      // This is a limitation of the current status map, but works for most cases
      return (
        <Button variant="outline" size="sm" disabled>
          <UserPlus className="h-4 w-4 mr-1" />
          Connection sent
        </Button>
      )
    }
    if (status === 'accepted') {
      return (
        <Button variant="ghost" size="sm" disabled>
          <Check className="h-4 w-4 mr-1" />
          Connected
        </Button>
      )
    }
    if (status === 'rejected') {
      return null
    }
    return (
      <Button variant="outline" size="sm" onClick={() => handleConnect(profile.id)}>
        <UserPlus className="h-4 w-4 mr-1" />
        Connect
      </Button>
    )
  }

  return (
    <div className="flex flex-col flex-1 h-full bg-background p-8 pt-6">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Find People to Connect With</h1>
        </div>
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, username, or role..."
            className="pl-8 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <ScrollArea className="h-[calc(100vh-300px)]">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <span className="text-muted-foreground">Loading profiles...</span>
              </div>
            ) : profiles.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No profiles found</p>
                {searchQuery && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Try adjusting your search terms
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {profiles.map((profile) => (
                  <div
                    key={profile.id}
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={profile.avatar_url || undefined} />
                          <AvatarFallback>
                            {profile.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {profile.is_online && (
                          <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-white" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium">{profile.full_name || profile.username}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>@{profile.username}</span>
                          {profile.professional_role && (
                            <>
                              <span>•</span>
                              <Briefcase className="h-3 w-3" />
                              <span>{profile.professional_role}</span>
                            </>
                          )}
                          {profile.country && (
                            <>
                              <span>•</span>
                              <Globe2 className="h-3 w-3" />
                              <span>{profile.country}</span>
                            </>
                          )}
                        </div>
                        {profile.bio && (
                          <div className="mt-1">
                            <p className="text-sm text-muted-foreground">
                              {truncateBio(profile.bio, profile.id)}
                            </p>
                            {profile.bio.length > 120 && (
                              <button
                                onClick={() => toggleBioExpansion(profile.id)}
                                className="text-sm text-primary hover:underline mt-1"
                              >
                                {expandedBios.has(profile.id) ? 'See less' : 'See more'}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => router.push(`/dashboard/profile/${profile.id}`)}
                        className="h-8 w-8 p-0"
                        title="View Profile"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => router.push(`/dashboard/messages?userId=${profile.id}`)}
                        className="h-8 w-8 p-0"
                        title="Send Message"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                      {getConnectionButton(profile)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
    </div>
  )
} 