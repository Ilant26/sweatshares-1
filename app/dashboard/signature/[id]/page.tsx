'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
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
  Calendar,
  User,
  MessageSquare,
  Clock,
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  Signature
} from 'lucide-react'
import { SignatureRequest, getSignatureRequest, declineSignatureRequest, getDocumentUrl, getSignedDocumentUrl } from '@/lib/signatures'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/database.types'

export default function SignaturePage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClientComponentClient<Database>()
  const [request, setRequest] = useState<SignatureRequest | null>(null)
  const [documentUrl, setDocumentUrl] = useState<string | null>(null)
  const [signedDocumentUrl, setSignedDocumentUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [documentLoading, setDocumentLoading] = useState(false)
  const [documentError, setDocumentError] = useState<string | null>(null)
  const [signing, setSigning] = useState(false)
  const [user, setUser] = useState<any>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [signatureData, setSignatureData] = useState<string | null>(null)

  const requestId = params.id as string

  // Initialize canvas with better quality settings
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas properties for better quality
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
  }, [])

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    fetchUser()
  }, [])

  useEffect(() => {
    if (!requestId) return

    const loadSignatureRequest = async () => {
      try {
        setLoading(true)
        setDocumentError(null)
        
        const signatureRequest = await getSignatureRequest(requestId)
        setRequest(signatureRequest)

        // Load document URL separately
        if (signatureRequest.document?.filepath) {
          await loadDocumentUrl(signatureRequest.document.filepath)
        }

        // Load signed document URL if document is signed
        if (signatureRequest.status === 'signed' && signatureRequest.signature_data?.signed_document_path) {
          await loadSignedDocumentUrl(signatureRequest.signature_data.signed_document_path)
        }
      } catch (error) {
        console.error('Error loading signature request:', error)
        toast.error('Failed to load signature request')
        // Only redirect if the signature request itself can't be loaded
        router.push('/dashboard/my-vault')
      } finally {
        setLoading(false)
      }
    }

    loadSignatureRequest()
  }, [requestId])

  const loadDocumentUrl = async (filepath: string) => {
    try {
      setDocumentLoading(true)
      setDocumentError(null)
      
      const url = await getDocumentUrl(filepath)
      setDocumentUrl(url)
    } catch (error) {
      console.error('Error loading document URL:', error)
      setDocumentError('Unable to load document preview. The file may have been moved or deleted.')
      setDocumentUrl(null)
    } finally {
      setDocumentLoading(false)
    }
  }

  const loadSignedDocumentUrl = async (filepath: string) => {
    try {
      const url = await getSignedDocumentUrl(filepath)
      setSignedDocumentUrl(url)
    } catch (error) {
      console.error('Error loading signed document URL:', error)
      // Don't show error for signed document as it's optional
    }
  }

  const retryLoadDocument = async () => {
    if (request?.document?.filepath) {
      await loadDocumentUrl(request.document.filepath)
    }
  }

  const isReceiver = request?.receiver_id === user?.id
  const isSender = request?.sender_id === user?.id

  const handleSign = async () => {
    if (!signatureData) {
      toast.error('Please provide your signature')
      return
    }

    setSigning(true)
    try {
      // Call the API route to sign the document
      const response = await fetch('/api/signatures/sign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId,
          signatureData
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to sign document')
      }

      const result = await response.json()
      setRequest(result.signatureRequest)
      
      // Load the signed document URL
      if (result.signatureRequest.signature_data?.signed_document_path) {
        await loadSignedDocumentUrl(result.signatureRequest.signature_data.signed_document_path)
      }
      
      toast.success('Document signed successfully')
    } catch (error) {
      console.error('Error signing document:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to sign document')
    } finally {
      setSigning(false)
    }
  }

  const handleDecline = async () => {
    setLoading(true)
    try {
      await declineSignatureRequest(requestId, user.id)
      toast.success('Signature request declined')
      router.push('/dashboard/my-vault')
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
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineWidth = 3 // Increased line width for better visibility
    ctx.strokeStyle = '#000'
    ctx.lineCap = 'round' // Rounded line caps for smoother appearance
    ctx.lineJoin = 'round' // Rounded line joins
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

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

    // Clear the entire canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Reset canvas properties
    ctx.lineWidth = 3
    ctx.strokeStyle = '#000'
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    
    setSignatureData(null)
  }

  const getStatusBadge = () => {
    if (!request) return null
    
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

  if (loading) {
    return (
      <div className="flex-1 space-y-6 p-4 sm:p-8 pt-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/my-vault')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Vault
          </Button>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading signature request...</p>
        </div>
      </div>
    )
  }

  if (!request) {
    return (
      <div className="flex-1 space-y-6 p-4 sm:p-8 pt-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/my-vault')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Vault
          </Button>
        </div>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Signature request not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-4 sm:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/my-vault')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Vault
        </Button>
        <div className="flex items-center space-x-2">
          <Signature className="w-5 h-5" />
          <h1 className="text-2xl font-bold">Signature Request</h1>
          {getStatusBadge()}
        </div>
      </div>

      <div className="space-y-6">
        {/* 1. Request Details */}
          <Card>
            <CardHeader>
              <CardTitle>Request Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                {/* Receiver info */}
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">To:</span>
                  <div className="flex items-center space-x-2">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={request.receiver?.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {request.receiver?.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{request.receiver?.full_name || 'Unknown User'}</span>
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
            </CardContent>
          </Card>

        {/* 2. Document in Full Length */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Signature className="w-5 h-5" />
              <span>Document</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                <Signature className="w-8 h-8 text-muted-foreground" />
                <div>
                  <p className="font-medium">{request.document?.filename}</p>
                  {request.document?.description && (
                    <p className="text-sm text-muted-foreground">{request.document.description}</p>
                  )}
                </div>
              </div>
              
              {/* Document Preview with Error Handling */}
              {documentLoading && (
                <div className="border rounded-lg p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4 text-muted-foreground">Loading document preview...</p>
                </div>
              )}
              
              {documentError && (
                <div className="border rounded-lg p-6 text-center">
                  <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
                  <p className="text-red-600 font-medium mb-2">Document Preview Unavailable</p>
                  <p className="text-sm text-muted-foreground mb-4">{documentError}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={retryLoadDocument}
                    disabled={documentLoading}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${documentLoading ? 'animate-spin' : ''}`} />
                    Retry
                  </Button>
                </div>
              )}
              
                              {documentUrl && !documentLoading && !documentError && request.status !== 'signed' && (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-muted px-4 py-2 border-b">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Document Preview</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = documentUrl;
                            link.download = request.document?.filename || 'document.pdf';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download Original
                        </Button>
                      </div>
                    </div>
                    <iframe
                      src={documentUrl}
                      className="w-full h-[600px]"
                      title="Document Preview"
                    />
                  </div>
                )}
              
              {/* Signed Document Preview */}
              {request.status === 'signed' && signedDocumentUrl && (
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-green-50 px-4 py-2 border-b border-green-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">Signed Document</span>
                      </div>
                                              <Button
                          variant="default"
                          size="sm"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = signedDocumentUrl;
                            link.download = request.signature_data?.signed_document_filename || 'signed-document.pdf';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download Signed PDF
                        </Button>
                    </div>
                  </div>
                  <iframe
                    src={signedDocumentUrl}
                    className="w-full h-[600px]"
                    title="Signed Document Preview"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 3. Signature Details */}
        {request.status === 'signed' && request.signature_data && (
          <Card>
            <CardHeader>
              <CardTitle>Signature Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-4 bg-green-50 border-green-200">
                <div className="flex items-center space-x-2 mb-3">
                  <Check className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-800">Document Successfully Signed</span>
                </div>
                {request.signature_data?.signed_document_filename && (
                  <p className="text-sm text-muted-foreground">
                    <strong>Signed File:</strong> {request.signature_data.signed_document_filename}
                  </p>
                )}
                {request.signed_at && (
                  <p className="text-sm text-muted-foreground mt-1">
                    <strong>Signed on:</strong> {formatDate(request.signed_at)}
                  </p>
                )}
                <p className="text-sm text-muted-foreground mt-2">
                  The signed document is now available for download and contains all signatures and metadata.
                </p>
                
                {signedDocumentUrl && (
                  <div className="mt-4">
                    <Button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = signedDocumentUrl;
                        link.download = request.signature_data?.signed_document_filename || 'signed-document.pdf';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                      size="lg"
                    >
                      <Download className="w-5 h-5 mr-2" />
                      Download Signed Document
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Signature Area - Only show for pending requests */}
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
                    className="border rounded cursor-crosshair bg-white w-full"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    style={{ 
                      touchAction: 'none', // Prevents touch scrolling on mobile
                      maxWidth: '100%',
                      height: 'auto'
                    }}
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
      </div>
    </div>
  )
} 