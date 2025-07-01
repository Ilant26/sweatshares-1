import { useState, useEffect } from 'react'
import {
  SignatureRequest,
  getSentSignatureRequests,
  getReceivedSignatureRequests,
  createSignatureRequest,
  signDocument,
  declineSignatureRequest,
  deleteSignatureRequest,
  subscribeToSignatureRequests,
  CreateSignatureRequestData
} from '@/lib/signatures'

interface UseSignaturesProps {
  userId?: string
}

interface UseSignaturesReturn {
  sentRequests: SignatureRequest[]
  receivedRequests: SignatureRequest[]
  isLoading: boolean
  error: Error | null
  createRequest: (data: CreateSignatureRequestData) => Promise<void>
  signRequest: (requestId: string, signatureData: any) => Promise<void>
  declineRequest: (requestId: string) => Promise<void>
  deleteRequest: (requestId: string) => Promise<void>
  refreshRequests: () => Promise<void>
}

export function useSignatures({ userId }: UseSignaturesProps): UseSignaturesReturn {
  const [sentRequests, setSentRequests] = useState<SignatureRequest[]>([])
  const [receivedRequests, setReceivedRequests] = useState<SignatureRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadRequests = async () => {
    if (!userId) return

    try {
      setIsLoading(true)
      setError(null)

      const [sent, received] = await Promise.all([
        getSentSignatureRequests(userId),
        getReceivedSignatureRequests(userId)
      ])

      setSentRequests(sent)
      setReceivedRequests(received)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load signature requests'))
      console.error('Error loading signature requests:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadRequests()
  }, [userId])

  useEffect(() => {
    if (!userId) return

    // Subscribe to real-time updates
    const subscription = subscribeToSignatureRequests(userId, (updatedRequest) => {
      // Update sent requests
      setSentRequests(prev => {
        const index = prev.findIndex(req => req.id === updatedRequest.id)
        if (index >= 0) {
          const updated = [...prev]
          updated[index] = updatedRequest
          return updated
        }
        return prev
      })

      // Update received requests
      setReceivedRequests(prev => {
        const index = prev.findIndex(req => req.id === updatedRequest.id)
        if (index >= 0) {
          const updated = [...prev]
          updated[index] = updatedRequest
          return updated
        }
        return prev
      })
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [userId])

  const handleCreateRequest = async (data: CreateSignatureRequestData) => {
    if (!userId) return

    try {
      setError(null)
      const newRequest = await createSignatureRequest(userId, data)
      setSentRequests(prev => [newRequest, ...prev])
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create signature request'))
      console.error('Error creating signature request:', err)
      throw err
    }
  }

  const handleSignRequest = async (requestId: string, signatureData: any) => {
    if (!userId) return

    try {
      setError(null)
      const updatedRequest = await signDocument(requestId, signatureData, userId)
      
      // Update the request in both lists
      setReceivedRequests(prev => 
        prev.map(req => req.id === requestId ? updatedRequest : req)
      )
      setSentRequests(prev => 
        prev.map(req => req.id === requestId ? updatedRequest : req)
      )
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to sign document'))
      console.error('Error signing document:', err)
      throw err
    }
  }

  const handleDeclineRequest = async (requestId: string) => {
    if (!userId) return

    try {
      setError(null)
      const updatedRequest = await declineSignatureRequest(requestId, userId)
      
      // Update the request in both lists
      setReceivedRequests(prev => 
        prev.map(req => req.id === requestId ? updatedRequest : req)
      )
      setSentRequests(prev => 
        prev.map(req => req.id === requestId ? updatedRequest : req)
      )
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to decline signature request'))
      console.error('Error declining signature request:', err)
      throw err
    }
  }

  const handleDeleteRequest = async (requestId: string) => {
    if (!userId) return

    try {
      setError(null)
      await deleteSignatureRequest(requestId, userId)
      
      // Remove the request from sent requests
      setSentRequests(prev => prev.filter(req => req.id !== requestId))
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete signature request'))
      console.error('Error deleting signature request:', err)
      throw err
    }
  }

  return {
    sentRequests,
    receivedRequests,
    isLoading,
    error,
    createRequest: handleCreateRequest,
    signRequest: handleSignRequest,
    declineRequest: handleDeclineRequest,
    deleteRequest: handleDeleteRequest,
    refreshRequests: loadRequests
  }
} 