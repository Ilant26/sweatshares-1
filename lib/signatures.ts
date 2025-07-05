import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from './database.types'
import { sendMessage } from './messages'

const supabaseClient = createClientComponentClient<Database>()

// Helper function to send signature-related messages
async function sendSignatureMessage(
  receiverId: string,
  type: 'signature_request' | 'document_signed',
  signatureRequest: SignatureRequest,
  senderName?: string
) {
  try {
    let messageContent = ''
    let actionUrl = ''

    if (type === 'signature_request') {
      messageContent = JSON.stringify({
        type: 'signature_request',
        signatureRequestId: signatureRequest.id,
        documentName: signatureRequest.document?.filename || 'Document',
        senderName: senderName || 'Someone',
        message: signatureRequest.message || ''
      })
      actionUrl = `/dashboard/signature/${signatureRequest.id}`
    } else if (type === 'document_signed') {
      messageContent = JSON.stringify({
        type: 'document_signed',
        signatureRequestId: signatureRequest.id,
        documentName: signatureRequest.document?.filename || 'Document',
        signerName: senderName || 'Someone'
      })
      actionUrl = `/dashboard/signature/${signatureRequest.id}`
    }

    await sendMessage(receiverId, messageContent)
  } catch (error) {
    console.error('Error sending signature message:', error)
    // Don't throw error to avoid breaking the main signature flow
  }
}

export interface SignatureRequest {
  id: string
  document_id: string
  sender_id: string
  receiver_id: string
  status: 'pending' | 'signed' | 'declined' | 'expired'
  message: string | null
  expires_at: string | null
  signed_at: string | null
  signature_data: any
  created_at: string
  updated_at: string
  document?: {
    id: string
    filename: string
    filepath: string
    description: string | null
  }
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
  positions?: SignaturePosition[]
}

export interface SignaturePosition {
  id: string
  signature_request_id: string
  page_number: number
  x_position: number
  y_position: number
  width: number
  height: number
  field_type: 'signature' | 'date' | 'text' | 'checkbox'
  field_label: string | null
  required: boolean
  scale: number
  original_pdf_width?: number
  original_pdf_height?: number
  created_at: string
}

// Type for creating signature positions (without database-generated fields)
export interface CreateSignaturePositionData {
  page_number: number
  x_position: number
  y_position: number
  width: number
  height: number
  field_type: 'signature' | 'date' | 'text' | 'checkbox'
  field_label: string | null
  required: boolean
  scale: number
  original_pdf_width?: number
  original_pdf_height?: number
}

export interface CreateSignatureRequestData {
  document_id: string
  receiver_id: string
  message?: string
  expires_at?: string
  positions: CreateSignaturePositionData[]
}

// Get signature requests sent by the current user
export async function getSentSignatureRequests(userId: string): Promise<SignatureRequest[]> {
  const { data, error } = await supabaseClient
    .from('signature_requests')
    .select(`
      *,
      document:vault_documents(id, filename, filepath, description),
      receiver:profiles!signature_requests_receiver_id_fkey(id, full_name, avatar_url),
      positions:signature_positions(*)
    `)
    .eq('sender_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching sent signature requests:', error)
    throw new Error('Failed to fetch sent signature requests')
  }

  return data || []
}

// Get signature requests received by the current user
export async function getReceivedSignatureRequests(userId: string): Promise<SignatureRequest[]> {
  const { data, error } = await supabaseClient
    .from('signature_requests')
    .select(`
      *,
      document:vault_documents(id, filename, filepath, description),
      sender:profiles!signature_requests_sender_id_fkey(id, full_name, avatar_url),
      positions:signature_positions(*)
    `)
    .eq('receiver_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching received signature requests:', error)
    throw new Error('Failed to fetch received signature requests')
  }

  return data || []
}

// Create a new signature request
export async function createSignatureRequest(
  userId: string,
  requestData: CreateSignatureRequestData
): Promise<SignatureRequest> {
  // First, create the signature request
  const { data: signatureRequest, error: requestError } = await supabaseClient
    .from('signature_requests')
    .insert({
      document_id: requestData.document_id,
      sender_id: userId,
      receiver_id: requestData.receiver_id,
      message: requestData.message,
      expires_at: requestData.expires_at,
    })
    .select()
    .single()

  if (requestError) {
    console.error('Error creating signature request:', requestError)
    throw new Error('Failed to create signature request')
  }

  // Then, create the signature positions
  if (requestData.positions.length > 0) {
    const positionsWithRequestId = requestData.positions.map(position => ({
      ...position,
      signature_request_id: signatureRequest.id,
    }))

    const { error: positionsError } = await supabaseClient
      .from('signature_positions')
      .insert(positionsWithRequestId)

    if (positionsError) {
      console.error('Error creating signature positions:', positionsError)
      throw new Error('Failed to create signature positions')
    }
  }

  // Fetch the complete signature request with related data
  const { data: completeRequest, error: fetchError } = await supabaseClient
    .from('signature_requests')
    .select(`
      *,
      document:vault_documents(id, filename, filepath, description),
      sender:profiles!signature_requests_sender_id_fkey(id, full_name, avatar_url),
      receiver:profiles!signature_requests_receiver_id_fkey(id, full_name, avatar_url),
      positions:signature_positions(*)
    `)
    .eq('id', signatureRequest.id)
    .single()

  if (fetchError) {
    console.error('Error fetching complete signature request:', fetchError)
    throw new Error('Failed to fetch complete signature request')
  }

  // Send message to receiver about the signature request
  const senderProfile = await supabaseClient
    .from('profiles')
    .select('full_name, username')
    .eq('id', userId)
    .single()

  const senderName = senderProfile?.data?.full_name || senderProfile?.data?.username || 'Someone'
  
  await sendSignatureMessage(
    requestData.receiver_id,
    'signature_request',
    completeRequest,
    senderName
  )

  return completeRequest
}

// Get a single signature request by ID
export async function getSignatureRequest(requestId: string): Promise<SignatureRequest> {
  const { data, error } = await supabaseClient
    .from('signature_requests')
    .select(`
      *,
      document:vault_documents(id, filename, filepath, description),
      sender:profiles!signature_requests_sender_id_fkey(id, full_name, avatar_url),
      receiver:profiles!signature_requests_receiver_id_fkey(id, full_name, avatar_url),
      positions:signature_positions(*)
    `)
    .eq('id', requestId)
    .single()

  if (error) {
    console.error('Error fetching signature request:', error)
    throw new Error('Failed to fetch signature request')
  }

  return data
}

// Decline a signature request
export async function declineSignatureRequest(
  requestId: string,
  userId: string
): Promise<SignatureRequest> {
  const { data, error } = await supabaseClient
    .from('signature_requests')
    .update({
      status: 'declined',
    })
    .eq('id', requestId)
    .eq('receiver_id', userId)
    .select(`
      *,
      document:vault_documents(id, filename, filepath, description),
      sender:profiles!signature_requests_sender_id_fkey(id, full_name, avatar_url),
      receiver:profiles!signature_requests_receiver_id_fkey(id, full_name, avatar_url),
      positions:signature_positions(*)
    `)
    .single()

  if (error) {
    console.error('Error declining signature request:', error)
    throw new Error('Failed to decline signature request')
  }

  return data
}

// Sign a document
export async function signDocument(
  requestId: string,
  signatureData: any,
  userId: string
): Promise<SignatureRequest> {
  const { data, error } = await supabaseClient
    .from('signature_requests')
    .update({
      status: 'signed',
      signature_data: signatureData,
      signed_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .eq('receiver_id', userId)
    .select(`
      *,
      document:vault_documents(id, filename, filepath, description),
      sender:profiles!signature_requests_sender_id_fkey(id, full_name, avatar_url),
      receiver:profiles!signature_requests_receiver_id_fkey(id, full_name, avatar_url),
      positions:signature_positions(*)
    `)
    .single()

  if (error) {
    console.error('Error signing document:', error)
    throw new Error('Failed to sign document')
  }

  // Send message to sender about the signed document
  const signerProfile = await supabaseClient
    .from('profiles')
    .select('full_name, username')
    .eq('id', userId)
    .single()

  const signerName = signerProfile?.data?.full_name || signerProfile?.data?.username || 'Someone'
  
  await sendSignatureMessage(
    data.sender_id,
    'document_signed',
    data,
    signerName
  )

  return data
}

// Delete a signature request (only sender can delete)
export async function deleteSignatureRequest(
  requestId: string,
  userId: string
): Promise<void> {
  const { error } = await supabaseClient
    .from('signature_requests')
    .delete()
    .eq('id', requestId)
    .eq('sender_id', userId)

  if (error) {
    console.error('Error deleting signature request:', error)
    throw new Error('Failed to delete signature request')
  }
}

// Get document URL for signing
export async function getDocumentUrl(filepath: string): Promise<string> {
  // Try to get public URL first (if bucket is public)
  const { data: publicUrlData } = supabaseClient.storage
    .from('vault')
    .getPublicUrl(filepath)

  if (publicUrlData?.publicUrl) {
    return publicUrlData.publicUrl
  }

  // Fallback to signed URL if public URL is not available
  const { data, error } = await supabaseClient.storage
    .from('vault')
    .createSignedUrl(filepath, 3600) // 1 hour expiry

  if (error) {
    console.error('Error getting document URL:', error)
    throw new Error('Failed to get document URL')
  }

  return data.signedUrl
}

// Get signed document URL
export async function getSignedDocumentUrl(signedFilepath: string): Promise<string> {
  // Try to get public URL first (if bucket is public)
  const { data: publicUrlData } = supabaseClient.storage
    .from('vault')
    .getPublicUrl(signedFilepath)

  if (publicUrlData?.publicUrl) {
    return publicUrlData.publicUrl
  }

  // Fallback to signed URL if public URL is not available
  const { data, error } = await supabaseClient.storage
    .from('vault')
    .createSignedUrl(signedFilepath, 3600) // 1 hour expiry

  if (error) {
    console.error('Error getting signed document URL:', error)
    throw new Error('Failed to get signed document URL')
  }

  return data.signedUrl
}

// Subscribe to signature request changes
export function subscribeToSignatureRequests(
  userId: string,
  callback: (request: SignatureRequest) => void
) {
  const subscription = supabaseClient
    .channel('signature_requests_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'signature_requests',
        filter: `sender_id=eq.${userId} OR receiver_id=eq.${userId}`,
      },
      (payload) => {
        callback(payload.new as SignatureRequest)
      }
    )
    .subscribe()

  return {
    unsubscribe: () => {
      subscription.unsubscribe()
    },
  }
} 