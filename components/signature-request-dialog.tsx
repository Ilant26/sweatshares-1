'use client'

import { useState, useEffect } from 'react'
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
import { Send, Users, Calendar, MessageSquare, FileText } from 'lucide-react'
import type { Database } from '@/lib/database.types'
import { CreateSignatureRequestData } from '@/lib/signatures'

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

  const handleCreateRequest = async () => {
    if (selectedConnections.length === 0) {
      toast.error('Please select at least one recipient')
      return
    }

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

      const { data, error } = await supabase
        .from('signature_requests')
        .insert({
          document_id: requestData.document_id,
          sender_id: user.id,
          receiver_id: requestData.receiver_id,
          message: requestData.message,
          expires_at: requestData.expires_at,
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating signature request:', error)
        toast.error('Failed to create signature request')
        return
      }

      // Create signature positions
      if (requestData.positions.length > 0) {
        const positionsWithRequestId = requestData.positions.map(position => ({
          ...position,
          signature_request_id: data.id,
        }))

        const { error: positionsError } = await supabase
          .from('signature_positions')
          .insert(positionsWithRequestId)

        if (positionsError) {
          console.error('Error creating signature positions:', positionsError)
          toast.error('Failed to create signature positions')
          return
        }
      }

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
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Request Signature</DialogTitle>
          <DialogDescription>
            Send a signature request for "{document.filename}" to people in your network.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            {/* Document Info */}
            <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
              <FileText className="w-8 h-8 text-muted-foreground" />
              <div>
                <p className="font-medium">{document.filename}</p>
                {document.description && (
                  <p className="text-sm text-muted-foreground">{document.description}</p>
                )}
              </div>
            </div>

            {/* Recipients */}
            <div className="space-y-3">
              <Label>Recipients</Label>
              <ScrollArea className="h-48 border rounded-md p-3">
                {connections.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <Users className="w-8 h-8 mx-auto mb-2" />
                    <p>No connections found</p>
                    <p className="text-sm">Connect with people to send signature requests</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {connections.map((connection) => {
                      const otherUser = getOtherUser(connection)
                      if (!otherUser) return null

                      return (
                        <div
                          key={connection.id}
                          className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted cursor-pointer"
                          onClick={() => handleConnectionToggle(otherUser.id)}
                        >
                          <Checkbox
                            checked={selectedConnections.includes(otherUser.id)}
                            onChange={() => handleConnectionToggle(otherUser.id)}
                          />
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={otherUser.avatar_url || undefined} />
                            <AvatarFallback>
                              {otherUser.full_name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium">{otherUser.full_name || 'Unknown User'}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Message */}
            <div className="space-y-3">
              <Label htmlFor="message">Message (Optional)</Label>
              <Textarea
                id="message"
                placeholder="Add a personal message to your signature request..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
              />
            </div>

            {/* Expiration */}
            <div className="space-y-3">
              <Label htmlFor="expires">Expires in</Label>
              <Select value={expiresIn} onValueChange={setExpiresIn}>
                <SelectTrigger>
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

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateRequest}
            disabled={loading || selectedConnections.length === 0}
          >
            {loading ? 'Sending...' : 'Send Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 