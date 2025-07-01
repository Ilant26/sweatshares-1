'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'sonner'
import { Send, Users, Calendar, MessageSquare, FileText, Search } from 'lucide-react'
import type { Database } from '@/lib/database.types'
import { CreateSignatureRequestData, createSignatureRequest } from '@/lib/signatures'

interface SignatureRequestDialogProps {
  document: {
    id: string
    filename: string
    filepath: string
    description: string | null
  }
  onRequestCreated: () => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

interface Connection {
  id: string
  sender_id: string
  receiver_id: string
  status: string
  sender?: {
    id: string
    full_name: string | null
    avatar_url: string | null
  }
  receiver?: {
    id: string
    full_name: string | null
    avatar_url: string | null
  }
}

export function SignatureRequestDialog({ document, onRequestCreated, open: controlledOpen, onOpenChange }: SignatureRequestDialogProps) {
  const supabase = createClientComponentClient<Database>()
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen
  const setOpen = onOpenChange || setUncontrolledOpen
  const [connections, setConnections] = useState<Connection[]>([])
  const [selectedConnections, setSelectedConnections] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const [expiresIn, setExpiresIn] = useState('7')
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [recipientSearch, setRecipientSearch] = useState('')
  const [error, setError] = useState<string | null>(null)
  const maxMessageLength = 300

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    fetchUser()
  }, [])

  useEffect(() => {
    if (!user || !open) return

    const fetchConnections = async () => {
      const { data: acceptedConnections, error } = await supabase
        .from('connections')
        .select(`
          *,
          sender:sender_id(id, full_name, avatar_url),
          receiver:receiver_id(id, full_name, avatar_url)
        `)
        .eq('status', 'accepted')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)

      if (error) {
        console.error('Error fetching connections:', error)
        toast.error('Failed to fetch connections')
        return
      }

      setConnections(acceptedConnections || [])
    }

    fetchConnections()
  }, [user, open])

  const getOtherUser = (connection: Connection) => {
    if (connection.sender_id === user?.id) {
      return connection.receiver
    }
    return connection.sender
  }

  // Filtered connections for search
  const filteredConnections = useMemo(() => {
    if (!recipientSearch) return connections
    return connections.filter((connection) => {
      const otherUser = getOtherUser(connection)
      return otherUser?.full_name?.toLowerCase().includes(recipientSearch.toLowerCase())
    })
  }, [connections, recipientSearch])

  const handleCreateRequest = async () => {
    if (selectedConnections.length === 0) {
      setError('Please select at least one recipient')
      toast.error('Please select at least one recipient')
      return
    }
    if (message.length > maxMessageLength) {
      setError('Message is too long')
      toast.error('Message is too long')
      return
    }
    setError(null)
    setLoading(true)

    try {
      const expiresDate = new Date()
      expiresDate.setDate(expiresDate.getDate() + parseInt(expiresIn))

      const requestData: CreateSignatureRequestData = {
        document_id: document.id,
        receiver_id: selectedConnections[0], // For now, only support single recipient
        message: message || undefined,
        expires_at: expiresDate.toISOString(),
        positions: [
          {
            page_number: 1,
            x_position: 100,
            y_position: 100,
            width: 200,
            height: 50,
            field_type: 'signature',
            field_label: 'Signature',
            required: true,
          },
        ],
      }

      const signatureRequest = await createSignatureRequest(user.id, requestData)

      toast.success('Signature request sent successfully')
      setOpen(false)
      setSelectedConnections([])
      setMessage('')
      setExpiresIn('7')
      onRequestCreated()
    } catch (error) {
      console.error('Error creating signature request:', error)
      toast.error('Failed to create signature request')
    } finally {
      setLoading(false)
    }
  }

  const handleConnectionToggle = (connectionId: string) => {
    setSelectedConnections(prev => {
      if (prev.includes(connectionId)) {
        return prev.filter(id => id !== connectionId)
      } else {
        // For now, only allow one recipient
        return [connectionId]
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg w-full max-h-[95vh] flex flex-col p-0">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 pt-6 pb-2 border-b">
          <Send className="w-6 h-6 text-primary" />
          <div>
            <DialogTitle className="text-lg">Request Signature</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Send a signature request for <span className="font-semibold">{document.filename}</span> to people in your network.
            </DialogDescription>
          </div>
        </div>

        {/* Main Content Scrollable */}
        <ScrollArea className="flex-1 min-h-0 px-6 py-4">
          <div className="space-y-5 pb-10">
            {/* Document Preview */}
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <FileText className="w-8 h-8 text-muted-foreground" />
              <div>
                <p className="font-medium truncate max-w-xs">{document.filename}</p>
                {document.description && (
                  <p className="text-xs text-muted-foreground truncate max-w-xs">{document.description}</p>
                )}
              </div>
            </div>

            {/* Recipients */}
            <div className="space-y-2">
              <Label>Recipients</Label>
              <div className="relative mb-2">
                <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
                <Input
                  aria-label="Search recipients"
                  className="pl-8"
                  placeholder="Search by name..."
                  value={recipientSearch}
                  onChange={e => setRecipientSearch(e.target.value)}
                />
              </div>
              <ScrollArea className="h-40 border rounded-md p-2 bg-background">
                {filteredConnections.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <Users className="w-8 h-8 mx-auto mb-2" />
                    <p>No connections found</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredConnections.map((connection) => {
                      const otherUser = getOtherUser(connection)
                      if (!otherUser) return null
                      return (
                        <div
                          key={connection.id}
                          className={`flex items-center gap-2 p-2 rounded-md hover:bg-muted cursor-pointer ${selectedConnections.includes(otherUser.id) ? 'bg-primary/10' : ''}`}
                          onClick={() => handleConnectionToggle(otherUser.id)}
                          aria-label={`Select ${otherUser.full_name}`}
                        >
                          <Checkbox
                            checked={selectedConnections.includes(otherUser.id)}
                            onChange={() => handleConnectionToggle(otherUser.id)}
                            aria-label={`Select ${otherUser.full_name}`}
                          />
                          <Avatar className="w-7 h-7">
                            <AvatarImage src={otherUser.avatar_url || undefined} />
                            <AvatarFallback>
                              {otherUser.full_name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-sm truncate">{otherUser.full_name || 'Unknown User'}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </ScrollArea>
              {error && <p className="text-xs text-destructive mt-1">{error}</p>}
            </div>

            {/* Message */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="message">Message (Optional)</Label>
                <span className={`text-xs ${message.length > maxMessageLength ? 'text-destructive' : 'text-muted-foreground'}`}>{message.length}/{maxMessageLength}</span>
              </div>
              <Textarea
                id="message"
                aria-label="Message"
                placeholder="Add a personal message to your signature request..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                maxLength={maxMessageLength + 10}
              />
            </div>

            {/* Expiration */}
            <div className="flex items-center gap-2">
              <Label htmlFor="expires" className="whitespace-nowrap">Expires in</Label>
              <Select value={expiresIn} onValueChange={setExpiresIn}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 day</SelectItem>
                  <SelectItem value="3">3 days</SelectItem>
                  <SelectItem value="7">1 week</SelectItem>
                  <SelectItem value="14">2 weeks</SelectItem>
                  <SelectItem value="30">1 month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </ScrollArea>

        {/* Footer always visible */}
        <DialogFooter className="mt-4 px-6 pb-6 flex gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} className="flex-1" aria-label="Cancel">
            Cancel
          </Button>
          <Button
            onClick={handleCreateRequest}
            disabled={loading || selectedConnections.length === 0}
            className="flex-1"
            aria-label="Send Request"
          >
            {loading && <span className="animate-spin mr-2 w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block align-middle" />}
            {loading ? 'Sending...' : 'Send Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 