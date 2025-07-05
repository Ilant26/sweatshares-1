'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'sonner'
import { 
  Send, 
  Users, 
  Search, 
  FileText, 
  ArrowLeft, 
  Plus, 
  X,
  MousePointer,
  Type,
  Calendar,
  CheckSquare
} from 'lucide-react'
import type { Database } from '@/lib/database.types'
import { CreateSignatureRequestData, createSignatureRequest, getDocumentUrl } from '@/lib/signatures'

interface SignatureField {
  id: string
  type: 'signature' | 'date' | 'text' | 'checkbox'
  x: number
  y: number
  width: number
  height: number
  page: number
  label: string
  required: boolean
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

export default function SignatureRequestPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const documentId = searchParams.get('documentId')
  
  const supabase = createClientComponentClient<Database>()
  const [user, setUser] = useState<any>(null)
  const [document, setDocument] = useState<any>(null)
  const [documentUrl, setDocumentUrl] = useState<string | null>(null)
  const [connections, setConnections] = useState<Connection[]>([])
  const [selectedConnections, setSelectedConnections] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const [expiresIn, setExpiresIn] = useState('7')
  const [loading, setLoading] = useState(false)
  const [documentLoading, setDocumentLoading] = useState(true)
  const [iframeLoaded, setIframeLoaded] = useState(false)
  const [recipientSearch, setRecipientSearch] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [signatureFields, setSignatureFields] = useState<SignatureField[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isAddingField, setIsAddingField] = useState(false)
  const [selectedFieldType, setSelectedFieldType] = useState<'signature' | 'date' | 'text' | 'checkbox'>('signature')
  const [fieldLabel, setFieldLabel] = useState('')
  const [isFieldRequired, setIsFieldRequired] = useState(true)
  
  const pdfContainerRef = useRef<HTMLDivElement>(null)
  const maxMessageLength = 300

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    fetchUser()
  }, [])

  useEffect(() => {
    if (!documentId) {
      router.push('/dashboard/my-vault')
      return
    }

    const fetchDocument = async () => {
      setDocumentLoading(true)
      console.log('Fetching document with ID:', documentId)
      
      const { data: doc, error } = await supabase
        .from('vault_documents')
        .select('*')
        .eq('id', documentId)
        .single()

      if (error || !doc) {
        console.error('Document fetch error:', error)
        toast.error('Document not found')
        router.push('/dashboard/my-vault')
        return
      }

      console.log('Document found:', doc)
      setDocument(doc)
      
      // Get document URL using the helper function
      try {
        console.log('Getting document URL for filepath:', doc.filepath)
        const url = await getDocumentUrl(doc.filepath)
        console.log('Document URL obtained:', url)
        setDocumentUrl(url)
        setIframeLoaded(false) // Reset iframe loaded state for new document
      } catch (error) {
        console.error('Error getting document URL:', error)
        toast.error('Failed to load document preview')
      } finally {
        setDocumentLoading(false)
      }
    }

    fetchDocument()
  }, [documentId])

  useEffect(() => {
    if (!user) return

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
  }, [user])

  const getOtherUser = (connection: Connection) => {
    if (connection.sender_id === user?.id) {
      return connection.receiver
    }
    return connection.sender
  }

  const filteredConnections = connections.filter((connection) => {
    const otherUser = getOtherUser(connection)
    return otherUser?.full_name?.toLowerCase().includes(recipientSearch.toLowerCase())
  })

  const handleAddField = () => {
    if (!fieldLabel.trim()) {
      toast.error('Please enter a field label')
      return
    }

    const newField: SignatureField = {
      id: `field_${Date.now()}`,
      type: selectedFieldType,
      x: 100,
      y: 100,
      width: selectedFieldType === 'signature' ? 200 : 150,
      height: selectedFieldType === 'signature' ? 50 : 30,
      page: currentPage,
      label: fieldLabel,
      required: isFieldRequired
    }

    setSignatureFields(prev => [...prev, newField])
    setFieldLabel('')
    setIsAddingField(false)
  }

  const handleRemoveField = (fieldId: string) => {
    setSignatureFields(prev => prev.filter(field => field.id !== fieldId))
  }

  const handleFieldDrag = (fieldId: string, x: number, y: number) => {
    setSignatureFields(prev => 
      prev.map(field => 
        field.id === fieldId ? { ...field, x, y } : field
      )
    )
  }

  const handleFieldResize = (fieldId: string, width: number, height: number) => {
    setSignatureFields(prev => 
      prev.map(field => 
        field.id === fieldId ? { ...field, width, height } : field
      )
    )
  }

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
    if (signatureFields.length === 0) {
      setError('Please add at least one signature field')
      toast.error('Please add at least one signature field')
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
        positions: signatureFields.map(field => ({
          page_number: field.page,
          x_position: field.x,
          y_position: field.y,
          width: field.width,
          height: field.height,
          field_type: field.type,
          field_label: field.label,
          required: field.required,
        })),
      }

      await createSignatureRequest(user.id, requestData)

      toast.success('Signature request sent successfully')
      router.push('/dashboard/my-vault')
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

  const getFieldIcon = (type: string) => {
    switch (type) {
      case 'signature':
        return <MousePointer className="w-4 h-4" />
      case 'text':
        return <Type className="w-4 h-4" />
      case 'date':
        return <Calendar className="w-4 h-4" />
      case 'checkbox':
        return <CheckSquare className="w-4 h-4" />
      default:
        return <MousePointer className="w-4 h-4" />
    }
  }

  if (!document) {
    return (
      <div className="flex-1 space-y-6 p-4 sm:p-8 pt-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading document...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-4 sm:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/my-vault')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Vault
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Request Signature</h1>
            <p className="text-muted-foreground">Set up signature fields and send request</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PDF Preview and Field Placement */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Document Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Field Type Selection */}
                <div className="flex items-center gap-4">
                  <Label>Add Field Type:</Label>
                  <Select value={selectedFieldType} onValueChange={(value: any) => setSelectedFieldType(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="signature">Signature</SelectItem>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="checkbox">Checkbox</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Input
                    placeholder="Field label"
                    value={fieldLabel}
                    onChange={(e) => setFieldLabel(e.target.value)}
                    className="w-48"
                  />
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="required"
                      checked={isFieldRequired}
                      onCheckedChange={(checked) => setIsFieldRequired(checked as boolean)}
                    />
                    <Label htmlFor="required">Required</Label>
                  </div>
                  
                  <Button onClick={handleAddField} disabled={!fieldLabel.trim()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Field
                  </Button>
                </div>

                {/* PDF Container */}
                <div 
                  ref={pdfContainerRef}
                  className="border rounded-lg p-4 bg-gray-50 min-h-[600px] relative overflow-hidden"
                  style={{ backgroundImage: 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)', backgroundSize: '20px 20px', backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px' }}
                >
                  {documentLoading ? (
                    <div className="flex items-center justify-center h-[600px]">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading document...</p>
                      </div>
                    </div>
                  ) : documentUrl ? (
                    <div className="relative w-full h-[600px]">
                      <div className="absolute top-2 right-2 z-20">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(documentUrl, '_blank')}
                        >
                          Open in New Tab
                        </Button>
                      </div>
                      
                      {!iframeLoaded && (
                        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                            <p className="text-muted-foreground">Loading PDF preview...</p>
                          </div>
                        </div>
                      )}
                      
                      <iframe
                        src={documentUrl}
                        className="w-full h-full border-0"
                        title="Document Preview"
                        onLoad={() => {
                          console.log('PDF iframe loaded successfully')
                          setIframeLoaded(true)
                        }}
                        onError={(e) => {
                          console.error('PDF iframe error:', e)
                          setIframeLoaded(false)
                        }}
                      />
                      
                      {/* Signature Fields Overlay */}
                      {signatureFields.map((field) => (
                        <div
                          key={field.id}
                          className="absolute border-2 border-blue-500 bg-blue-50 bg-opacity-50 cursor-move z-10"
                          style={{
                            left: field.x,
                            top: field.y,
                            width: field.width,
                            height: field.height,
                          }}
                          draggable
                          onDragEnd={(e) => {
                            const rect = pdfContainerRef.current?.getBoundingClientRect()
                            if (rect) {
                              const x = e.clientX - rect.left
                              const y = e.clientY - rect.top
                              handleFieldDrag(field.id, x, y)
                            }
                          }}
                        >
                          <div className="flex items-center justify-between p-1 bg-blue-500 text-white text-xs">
                            <span className="flex items-center gap-1">
                              {getFieldIcon(field.type)}
                              {field.label}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0 text-white hover:bg-blue-600"
                              onClick={() => handleRemoveField(field.id)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-[600px]">
                      <div className="text-center">
                        <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Failed to load document preview</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2"
                          onClick={() => {
                            if (document?.filepath) {
                              setDocumentLoading(true)
                              getDocumentUrl(document.filepath)
                                .then(url => setDocumentUrl(url))
                                .catch(error => {
                                  console.error('Retry failed:', error)
                                  toast.error('Failed to load document preview')
                                })
                                .finally(() => setDocumentLoading(false))
                            }
                          }}
                        >
                          Retry
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Recipients and Settings */}
        <div className="space-y-4">
          {/* Document Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Document</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <FileText className="w-8 h-8 text-muted-foreground" />
                <div>
                  <p className="font-medium truncate max-w-xs">{document.filename}</p>
                  {document.description && (
                    <p className="text-xs text-muted-foreground truncate max-w-xs">{document.description}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recipients */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recipients</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
                <Input
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
                        >
                          <Checkbox
                            checked={selectedConnections.includes(otherUser.id)}
                            onChange={() => handleConnectionToggle(otherUser.id)}
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
            </CardContent>
          </Card>

          {/* Message */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Message</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="message">Message (Optional)</Label>
                  <span className={`text-xs ${message.length > maxMessageLength ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {message.length}/{maxMessageLength}
                  </span>
                </div>
                <Textarea
                  id="message"
                  placeholder="Add a personal message to your signature request..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  maxLength={maxMessageLength + 10}
                />
              </div>

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
            </CardContent>
          </Card>

          {/* Signature Fields Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Signature Fields</CardTitle>
            </CardHeader>
            <CardContent>
              {signatureFields.length === 0 ? (
                <p className="text-muted-foreground text-sm">No fields added yet</p>
              ) : (
                <div className="space-y-2">
                  {signatureFields.map((field) => (
                    <div key={field.id} className="flex items-center justify-between p-2 bg-muted rounded">
                      <div className="flex items-center gap-2">
                        {getFieldIcon(field.type)}
                        <span className="text-sm font-medium">{field.label}</span>
                        {field.required && <Badge variant="secondary" className="text-xs">Required</Badge>}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleRemoveField(field.id)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Send Button */}
          <Button
            onClick={handleCreateRequest}
            disabled={loading || selectedConnections.length === 0 || signatureFields.length === 0}
            className="w-full"
            size="lg"
          >
            {loading && <span className="animate-spin mr-2 w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block align-middle" />}
            {loading ? 'Sending...' : 'Send Signature Request'}
          </Button>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      </div>
    </div>
  )
} 