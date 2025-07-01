'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { 
  Check, 
  X, 
  Download, 
  Eye, 
  FileText, 
  Calendar,
  User,
  MessageSquare,
  Clock
} from 'lucide-react'
import { SignatureRequest, getDocumentUrl, signDocument, declineSignatureRequest } from '@/lib/signatures'

interface SignatureViewerProps {
  request: SignatureRequest
  currentUserId: string
  onStatusChange: () => void
}

export function SignatureViewer({ request, currentUserId, onStatusChange }: SignatureViewerProps) {
  const [documentUrl, setDocumentUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [signing, setSigning] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [signatureData, setSignatureData] = useState<string | null>(null)

  const isReceiver = request.receiver_id === currentUserId
  const isSender = request.sender_id === currentUserId

  useEffect(() => {
    const loadDocument = async () => {
      try {
        const url = await getDocumentUrl(request.document?.filepath || '')
        setDocumentUrl(url)
      } catch (error) {
        console.error('Error loading document:', error)
        toast.error('Failed to load document')
      }
    }

    if (request.document?.filepath) {
      loadDocument()
    }
  }, [request.document?.filepath])

  const handleSign = async () => {
    if (!signatureData) {
      toast.error('Please provide your signature')
      return
    }

    setSigning(true)
    try {
      await signDocument(request.id, { signature: signatureData }, currentUserId)
      toast.success('Document signed successfully')
      onStatusChange()
    } catch (error) {
      console.error('Error signing document:', error)
      toast.error('Failed to sign document')
    } finally {
      setSigning(false)
    }
  }

  const handleDecline = async () => {
    setLoading(true)
    try {
      await declineSignatureRequest(request.id, currentUserId)
      toast.success('Signature request declined')
      onStatusChange()
    } catch (error) {
      console.error('Error declining request:', error)
      toast.error('Failed to decline request')
    } finally {
      setLoading(false)
    }
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineWidth = 2
    ctx.strokeStyle = '#000'
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
    const canvas = canvasRef.current
    if (!canvas) return

    setSignatureData(canvas.toDataURL())
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setSignatureData(null)
  }

  const getStatusBadge = () => {
    switch (request.status) {
      case 'pending':
        return <Badge variant="secondary">Pending Signature</Badge>
      case 'signed':
        return <Badge variant="default" className="bg-green-500">Signed</Badge>
      case 'declined':
        return <Badge variant="destructive">Declined</Badge>
      case 'expired':
        return <Badge variant="outline">Expired</Badge>
      default:
        return <Badge variant="secondary">{request.status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <CardTitle className="text-lg">{request.document?.filename}</CardTitle>
              </div>
              {getStatusBadge()}
            </div>
            {documentUrl && (
              <Button variant="outline" size="sm" onClick={() => window.open(documentUrl, '_blank')}>
                <Eye className="w-4 h-4 mr-2" />
                View Document
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">From:</span>
                <div className="flex items-center space-x-2">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={request.sender?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {request.sender?.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{request.sender?.full_name || 'Unknown User'}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Requested:</span>
                <span>{formatDate(request.created_at)}</span>
              </div>

              {request.expires_at && (
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Expires:</span>
                  <span>{formatDate(request.expires_at)}</span>
                </div>
              )}

              {request.signed_at && (
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-muted-foreground">Signed:</span>
                  <span className="text-green-600">{formatDate(request.signed_at)}</span>
                </div>
              )}
            </div>

            {request.message && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Message:</span>
                </div>
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                  {request.message}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Signature Area */}
      {isReceiver && request.status === 'pending' && (
        <Card>
          <CardHeader>
            <CardTitle>Sign Document</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-4">
                Draw your signature below:
              </p>
              <canvas
                ref={canvasRef}
                width={400}
                height={150}
                className="border rounded cursor-crosshair bg-white"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
              />
              <div className="flex space-x-2 mt-2">
                <Button variant="outline" size="sm" onClick={clearSignature}>
                  Clear
                </Button>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button
                onClick={handleSign}
                disabled={!signatureData || signing}
                className="flex-1"
              >
                {signing ? 'Signing...' : 'Sign Document'}
              </Button>
              <Button
                variant="outline"
                onClick={handleDecline}
                disabled={loading}
              >
                {loading ? 'Declining...' : 'Decline'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Signed Document Preview */}
      {request.status === 'signed' && request.signature_data && (
        <Card>
          <CardHeader>
            <CardTitle>Signed Document</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-4 bg-muted/50">
              <div className="flex items-center space-x-2 mb-4">
                <Check className="w-5 h-5 text-green-500" />
                <span className="font-medium text-green-600">Document has been signed</span>
              </div>
              {documentUrl && (
                <Button variant="outline" onClick={() => window.open(documentUrl, '_blank')}>
                  <Download className="w-4 h-4 mr-2" />
                  Download Signed Document
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 