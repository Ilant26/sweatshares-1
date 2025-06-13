"use client"

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Search } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { supabase } from '@/lib/supabase'

interface Profile {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
}

interface NewMessageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectUser: (userId: string) => void
}

export function NewMessageDialog({ open, onOpenChange, onSelectUser }: NewMessageDialogProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [connections, setConnections] = useState<Profile[]>([])
  const [currentUser, setCurrentUser] = useState<string | null>(null)

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
    const fetchConnections = async () => {
      if (!currentUser) return

      // Get all accepted connections
      const { data: connectionData } = await supabase
        .from('connections')
        .select('sender_id, receiver_id')
        .eq('status', 'accepted')
        .or(`sender_id.eq.${currentUser},receiver_id.eq.${currentUser}`)

      if (!connectionData) return

      // Get the IDs of connected users
      const connectedUserIds = connectionData.map(conn => 
        conn.sender_id === currentUser ? conn.receiver_id : conn.sender_id
      )

      if (connectedUserIds.length === 0) return

      // Build the query
      let query = supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', connectedUserIds)

      // Add search filter if query exists
      if (searchQuery) {
        query = query.or(`username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`)
      }

      // Execute query
      const { data: profiles } = await query
      setConnections(profiles || [])
    }

    if (open) {
      fetchConnections()
    }
  }, [currentUser, searchQuery, open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>New Message</DialogTitle>
        </DialogHeader>
        <div className="relative w-full mt-4">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search connections..."
            className="pl-8 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <ScrollArea className="h-[300px] mt-4">
          <div className="space-y-4">
            {connections.map((profile) => (
              <div
                key={profile.id}
                className="flex items-center gap-4 p-2 rounded-lg hover:bg-muted cursor-pointer"
                onClick={() => {
                  onSelectUser(profile.id)
                  onOpenChange(false)
                }}
              >
                <Avatar>
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback>
                    {profile.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">{profile.full_name || profile.username}</h3>
                  {profile.full_name && (
                    <p className="text-sm text-muted-foreground">@{profile.username}</p>
                  )}
                </div>
              </div>
            ))}
            {connections.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                No connections found
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
} 