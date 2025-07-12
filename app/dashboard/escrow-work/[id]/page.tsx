'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/lib/database.types';
import { useToast } from '@/components/ui/use-toast';
import { 
  ArrowLeft, 
  Loader2, 
  AlertCircle, 
  Shield, 
  Clock, 
  CheckCircle, 
  Upload, 
  FileText, 
  Eye, 
  Download,
  Calendar,
  Euro,
  User,
  Building2,
  AlertTriangle,
  Send,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Link as LinkIcon,
  Paperclip,
  Plus,
  Trash2,
  Mail,
  MapPin,
  Phone,
  Image as FileImage,
  FileText as FileWord,
  Table as FileSpreadsheet,
  Presentation as FilePresentation,
  Code as FileCode,
  Archive as FileArchive,
  Video as FileVideo,
  Music as FileAudio,
  File,
  FolderOpen,
  CheckSquare,
  XSquare,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { format, formatDistanceToNow, addDays } from 'date-fns';
import { EscrowNotificationStatus } from '@/components/escrow-notification-status';

interface EscrowTransaction {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid_in_escrow' | 'funded' | 'work_completed' | 'approved' | 'revision_requested' | 'disputed' | 'released' | 'refunded';
  payer_id: string;
  payee_id: string;
  invoice_id: string;
  completion_deadline_days: number;
  review_period_days: number;
  completion_deadline_date?: string;
  auto_release_date?: string;
  completion_submitted_at?: string;
  completion_approved_at?: string;
  funds_released_at?: string;
  transaction_type: 'work' | 'business_sale' | 'partnership' | 'service' | 'consulting' | 'investment' | 'other';
  transaction_description?: string;
  completion_proof?: {
    files?: Array<{ name: string; url: string; type: string }>;
    links?: string[];
    notes?: string;
    description?: string;
  };
  dispute_reason?: string;
  created_at: string;
  updated_at: string;
}

interface EscrowDocument {
  id: string;
  escrow_transaction_id: string;
  uploaded_by_id: string;
  filename: string;
  filepath: string;
  description?: string;
  type?: string;
  file_type?: string;
  file_size?: number;
  created_at: string;
  updated_at: string;
  uploaded_by?: {
    full_name?: string;
    username?: string;
    avatar_url?: string;
  };
}

interface Invoice {
  id: string;
  invoice_number: string;
  sender_id: string;
  receiver_id?: string;
  external_client_id?: string;
  total: number;
  amount: number;
  currency: string;
  escrow_transaction_id?: string;
  payment_method?: 'standard' | 'payment_link' | 'escrow';
  description?: string;
  issue_date: string;
  due_date: string;
  status: 'pending' | 'paid' | 'cancelled';
}

interface Profile {
  id: string;
  full_name?: string;
  username?: string;
  avatar_url?: string;
  company?: string;
}

export default function EscrowWorkPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClientComponentClient<Database>();

  const [escrowTransaction, setEscrowTransaction] = useState<EscrowTransaction | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [payerProfile, setPayerProfile] = useState<Profile | null>(null);
  const [payeeProfile, setPayeeProfile] = useState<Profile | null>(null);
  const [userRole, setUserRole] = useState<'payer' | 'payee' | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [escrowDocuments, setEscrowDocuments] = useState<EscrowDocument[]>([]);
  
  // Document upload state
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [documentData, setDocumentData] = useState({
    description: '',
    type: '',
    file: null as File | null
  });
  const documentFileRef = useRef<HTMLInputElement>(null);

  // Work completion submission state
  const [showWorkCompletionDialog, setShowWorkCompletionDialog] = useState(false);
  const [submittingWork, setSubmittingWork] = useState(false);
  const [workCompletionData, setWorkCompletionData] = useState({
    description: '',
    notes: '',
    links: [''],
    files: [] as File[]
  });
  const workCompletionFileRef = useRef<HTMLInputElement>(null);

  // Work approval state
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [approvingWork, setApprovingWork] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const invoiceId = params.id as string;

  useEffect(() => {
    if (invoiceId) {
      fetchEscrowData();
    }
  }, [invoiceId]);

  const fetchEscrowData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      // Fetch invoice with related data
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select(`
          *,
          sender:profiles!invoices_sender_id_fkey(id, full_name, username, avatar_url, company),
          receiver:profiles!invoices_receiver_id_fkey(id, full_name, username, avatar_url, company)
        `)
        .eq('id', invoiceId)
        .single();

      if (invoiceError || !invoiceData) {
        throw new Error('Invoice not found');
      }

      setInvoice(invoiceData);

      // Check if invoice has escrow transaction
      if (!invoiceData.escrow_transaction_id) {
        throw new Error('This invoice does not have an escrow transaction');
      }

      // Fetch escrow transaction
      const { data: escrowData, error: escrowError } = await supabase
        .from('escrow_transactions')
        .select('*')
        .eq('id', invoiceData.escrow_transaction_id)
        .single();

      if (escrowError || !escrowData) {
        throw new Error('Escrow transaction not found');
      }

      setEscrowTransaction(escrowData);

      // Fetch escrow documents
      const { data: documentsData, error: documentsError } = await supabase
        .from('escrow_documents')
        .select(`
          *,
          uploaded_by:profiles!escrow_documents_uploaded_by_id_fkey(id, full_name, username, avatar_url)
        `)
        .eq('escrow_transaction_id', escrowData.id)
        .order('created_at', { ascending: false });

      if (documentsError) {
        console.error('Error fetching documents:', documentsError);
      } else {
        setEscrowDocuments(documentsData || []);
      }

      // Determine user role and set profiles
      if (escrowData.payer_id === user.id) {
        setUserRole('payer');
        setPayerProfile(invoiceData.sender);
        setPayeeProfile(invoiceData.receiver);
      } else if (escrowData.payee_id === user.id) {
        setUserRole('payee');
        setPayerProfile(invoiceData.receiver);
        setPayeeProfile(invoiceData.sender);
      } else {
        throw new Error('You are not authorized to view this escrow transaction');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load escrow data';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push('/dashboard/my-invoices');
  };

  const handleUploadDocument = async () => {
    if (!documentData.file) {
      toast({
        title: 'No File Selected',
        description: 'Please select a file to upload.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (documentData.file.size > maxSize) {
      toast({
        title: 'File Too Large',
        description: 'File size must be less than 10MB.',
        variant: 'destructive',
      });
      return;
    }

    setUploadingDocument(true);

    try {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      // Sanitize filename by replacing spaces and special characters
      const sanitizedFileName = documentData.file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${escrowTransaction!.id}/${Date.now()}_${sanitizedFileName}`;
      
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('escrow-documents')
        .upload(filePath, documentData.file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Prepare document data
      const documentRecord = {
        escrow_transaction_id: escrowTransaction!.id,
        uploaded_by_id: user.id,
        filename: documentData.file.name,
        filepath: filePath,
        description: documentData.description || null,
        type: documentData.type || null,
        file_type: documentData.file.type,
        file_size: documentData.file.size
      };

      // Insert metadata
      const { error: insertError } = await supabase
        .from('escrow_documents')
        .insert(documentRecord)
        .select()
        .single();

      if (insertError) {
        // If metadata insert fails, try to delete the uploaded file
        await supabase.storage.from('escrow-documents').remove([filePath]);
        throw new Error(`Failed to save document metadata: ${insertError.message}`);
      }

      toast({
        title: 'Document Uploaded Successfully',
        description: 'Your document has been uploaded and is now available to both parties.',
      });

      setShowUploadDialog(false);
      setDocumentData({ description: '', type: '', file: null });
      fetchEscrowData();
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to upload document.',
        variant: 'destructive',
      });
    } finally {
      setUploadingDocument(false);
    }
  };

  const handleDownloadDocument = async (escrowDoc: EscrowDocument) => {
    try {
      const { data, error } = await supabase.storage
        .from('escrow-documents')
        .download(escrowDoc.filepath);

      if (error) {
        throw new Error(`Download failed: ${error.message}`);
      }

      // Create a download link
      const url = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = escrowDoc.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Download Started',
        description: 'Your document download has begun.',
      });
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: 'Error',
        description: 'Failed to download document. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteDocument = async (document: EscrowDocument) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('escrow-documents')
        .remove([document.filepath]);

      if (storageError) {
        throw new Error(`Storage deletion failed: ${storageError.message}`);
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('escrow_documents')
        .delete()
        .eq('id', document.id);

      if (dbError) {
        throw new Error(`Database deletion failed: ${dbError.message}`);
      }

      toast({
        title: 'Document Deleted',
        description: 'The document has been successfully deleted.',
      });

      fetchEscrowData();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete document. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Work completion submission handler
  const handleSubmitWorkCompletion = async () => {
    if (!escrowTransaction) return;

    setSubmittingWork(true);
    try {
      // Upload files if any
      const uploadedFiles: string[] = [];
      for (const file of workCompletionData.files) {
        const fileName = `work-completion/${escrowTransaction.id}/${Date.now()}-${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('escrow-documents')
          .upload(fileName, file);

        if (uploadError) {
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('escrow-documents')
          .getPublicUrl(fileName);

        uploadedFiles.push(publicUrl);
      }

      // Filter out empty links
      const validLinks = workCompletionData.links.filter(link => link.trim() !== '');

      const completionProof = {
        files: uploadedFiles.map(url => ({ name: '', url, type: 'file' })),
        links: validLinks,
        notes: workCompletionData.notes,
        description: workCompletionData.description
      };

      const response = await fetch('/api/escrow/submit-work-completion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          escrowTransactionId: escrowTransaction.id,
          description: workCompletionData.description,
          notes: workCompletionData.notes,
          links: validLinks,
          files: uploadedFiles
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit work completion');
      }

      const result = await response.json();

      // Update local state
      setEscrowTransaction(prev => prev ? {
        ...prev,
        status: 'work_completed',
        completion_proof: {
          ...completionProof,
          files: uploadedFiles.map(url => ({ name: '', url, type: 'file' }))
        },
        completion_submitted_at: new Date().toISOString(),
        dispute_reason: undefined // Clear any previous revision request
      } : null);

      setShowWorkCompletionDialog(false);
      setWorkCompletionData({
        description: '',
        notes: '',
        links: [''],
        files: []
      });

      toast({
        title: "Work submitted successfully",
        description: "Your work has been submitted for client review.",
      });
    } catch (error) {
      console.error('Error submitting work completion:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit work completion. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmittingWork(false);
    }
  };

  // Work approval handler
  const handleApproveWork = async (approve: boolean) => {
    if (!escrowTransaction) return;

    setApprovingWork(true);
    try {
      const response = await fetch('/api/escrow/approve-work', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          escrowTransactionId: escrowTransaction.id,
          approve,
          rejectionReason: approve ? undefined : rejectionReason
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process work approval');
      }

      const result = await response.json();

      // Update local state
      setEscrowTransaction(prev => prev ? {
        ...prev,
        status: approve ? 'approved' : 'revision_requested',
        completion_approved_at: approve ? new Date().toISOString() : undefined,
        dispute_reason: approve ? undefined : rejectionReason
      } : null);

      setShowApprovalDialog(false);
      setRejectionReason('');

      toast({
        title: approve ? "Work approved" : "Revision requested",
        description: approve 
          ? "Payment has been released to the service provider." 
          : "The service provider has been notified to make revisions.",
      });
    } catch (error) {
      console.error('Error processing work approval:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process work approval. Please try again.",
        variant: "destructive",
      });
    } finally {
      setApprovingWork(false);
    }
  };

  const getFileIcon = (filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return <FileText className="h-6 w-6 text-red-500 dark:text-red-400" />;
      case 'doc':
      case 'docx':
        return <FileWord className="h-6 w-6 text-blue-500 dark:text-blue-400" />;
      case 'xls':
      case 'xlsx':
        return <FileSpreadsheet className="h-6 w-6 text-green-500 dark:text-green-400" />;
      case 'ppt':
      case 'pptx':
        return <FilePresentation className="h-6 w-6 text-orange-500 dark:text-orange-400" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <FileImage className="h-6 w-6 text-purple-500 dark:text-purple-400" />;
      case 'zip':
      case 'rar':
        return <FileArchive className="h-6 w-6 text-gray-500 dark:text-gray-400" />;
      case 'mp4':
      case 'avi':
      case 'mov':
        return <FileVideo className="h-6 w-6 text-red-400 dark:text-red-300" />;
      case 'mp3':
      case 'wav':
        return <FileAudio className="h-6 w-6 text-green-400 dark:text-green-300" />;
      case 'txt':
        return <File className="h-6 w-6 text-gray-400 dark:text-gray-300" />;
      default:
        return <File className="h-6 w-6 text-gray-400 dark:text-gray-300" />;
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          label: 'Pending Payment',
          color: 'bg-yellow-100 dark:bg-yellow-950/50 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800',
          icon: Clock
        };
      case 'paid_in_escrow':
        return {
          label: 'Payment in Escrow',
          color: 'bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800',
          icon: Shield
        };
      case 'funded':
        return {
          label: 'Funded',
          color: 'bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800',
          icon: Shield
        };
      case 'work_completed':
        return {
          label: 'Work Submitted',
          color: 'bg-purple-100 dark:bg-purple-950/50 text-purple-800 dark:text-purple-200 border-purple-200 dark:border-purple-800',
          icon: Eye
        };
      case 'approved':
        return {
          label: 'Approved',
          color: 'bg-green-100 dark:bg-green-950/50 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800',
          icon: CheckCircle
        };
      case 'revision_requested':
        return {
          label: 'Revision Requested',
          color: 'bg-orange-100 dark:bg-orange-950/50 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-800',
          icon: AlertTriangle
        };
      case 'disputed':
        return {
          label: 'Disputed',
          color: 'bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800',
          icon: AlertTriangle
        };
      case 'released':
        return {
          label: 'Payment Released',
          color: 'bg-green-100 dark:bg-green-950/50 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800',
          icon: CheckCircle
        };
      case 'refunded':
        return {
          label: 'Payment Refunded',
          color: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700',
          icon: AlertCircle
        };
      default:
        return {
          label: 'Unknown',
          color: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700',
          icon: AlertCircle
        };
    }
  };

  const calculateProgress = () => {
    if (!escrowTransaction) return 0;
    
    switch (escrowTransaction.status) {
      case 'pending': return 10;
      case 'paid_in_escrow': return 30;
      case 'funded': return 30;
      case 'work_completed': return 70;
      case 'approved': return 100;
      case 'released': return 100;
      case 'revision_requested': return 50;
      case 'disputed': return 0;
      case 'refunded': return 0;
      default: return 0;
    }
  };

  const getTimeRemaining = () => {
    if (!escrowTransaction) return null;
    
    if (escrowTransaction.auto_release_date) {
      const autoReleaseDate = new Date(escrowTransaction.auto_release_date);
      const now = new Date();
      const diff = autoReleaseDate.getTime() - now.getTime();
      
      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        return `${days}d ${hours}h remaining`;
      }
    }
    
    return null;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading escrow transaction...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Button variant="ghost" onClick={handleBack} className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Invoices
          </Button>
          
          <Card className="border-red-200 dark:border-red-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertCircle className="h-5 w-5" />
                Error Loading Escrow
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-red-50 dark:bg-red-950/50 p-4 rounded-lg border border-red-200 dark:border-red-800">
                <p className="text-red-600 dark:text-red-400">{error}</p>
              </div>
              <div className="mt-4 flex gap-2">
                <Button onClick={handleBack} variant="outline">
                  Back to Invoices
                </Button>
                <Button onClick={fetchEscrowData}>
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!escrowTransaction || !invoice || !userRole) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-muted-foreground">Escrow transaction not found.</p>
          <Button onClick={handleBack} className="mt-4">
            Back to Invoices
          </Button>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(escrowTransaction.status);
  const progress = calculateProgress();
  const timeRemaining = getTimeRemaining();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
          <h1 className="text-3xl font-bold">Escrow Work Interface</h1>
          <p className="text-muted-foreground mt-2">
            Invoice #{invoice.invoice_number} • {userRole === 'payer' ? 'You are the payer' : 'You are the payee'}
          </p>
        </div>
            <Badge className={`${statusInfo.color} flex items-center gap-2`}>
              <statusInfo.icon className="h-4 w-4" />
              {statusInfo.label}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Role-Specific Header */}
            {userRole === 'payee' && (
              <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                    <User className="h-5 w-5" />
                    You are the Service Provider
                  </CardTitle>
                  <CardDescription className="text-blue-600 dark:text-blue-400">
                    Complete your work and submit deliverables to receive payment.
                  </CardDescription>
                </CardHeader>
              </Card>
            )}

            {userRole === 'payer' && (
              <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
                    <Building2 className="h-5 w-5" />
                    You are the Client
                  </CardTitle>
                  <CardDescription className="text-green-600 dark:text-green-400">
                    Review submitted work and approve or request changes.
                  </CardDescription>
                </CardHeader>
              </Card>
            )}

            {/* Progress Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Transaction Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="dark:text-gray-100">Progress</span>
                    <span className="dark:text-gray-100">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
                
                {timeRemaining && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{timeRemaining}</span>
                  </div>
                )}

                {/* Debug Information */}
                <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    <strong>Debug Info:</strong><br />
                    Status: {escrowTransaction.status}<br />
                    User Role: {userRole}<br />
                    Payer ID: {escrowTransaction.payer_id}<br />
                    Payee ID: {escrowTransaction.payee_id}<br />
                    Has Completion Proof: {escrowTransaction.completion_proof ? 'Yes' : 'No'}<br />
                    Completion Submitted: {escrowTransaction.completion_submitted_at ? 'Yes' : 'No'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Transaction Details */}
            <Card>
              <CardHeader>
                <CardTitle>Transaction Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Amount</Label>
                    <p className="text-2xl font-bold flex items-center gap-1 dark:text-gray-100">
                      <Euro className="h-5 w-5" />
                      {escrowTransaction.amount.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Transaction Type</Label>
                    <p className="font-medium capitalize dark:text-gray-100">{escrowTransaction.transaction_type.replace('_', ' ')}</p>
                  </div>
                </div>
                
                {escrowTransaction.transaction_description && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                    <p className="text-sm dark:text-gray-300">{escrowTransaction.transaction_description}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Completion Deadline</Label>
                    <p className="text-sm dark:text-gray-300">
                      {escrowTransaction.completion_deadline_date 
                        ? format(new Date(escrowTransaction.completion_deadline_date), 'PPP')
                        : `${escrowTransaction.completion_deadline_days} days from payment`
                      }
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Review Period</Label>
                    <p className="text-sm dark:text-gray-300">{escrowTransaction.review_period_days} days</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Work Completion Section - For Payee */}
            {userRole === 'payee' && escrowTransaction.status === 'paid_in_escrow' && (
              <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                    <CheckSquare className="h-5 w-5" />
                    Submit Work Completion
                  </CardTitle>
                  <CardDescription className="text-blue-600 dark:text-blue-400">
                    Upload your completed work and deliverables for client review.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => setShowWorkCompletionDialog(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Submit Work for Review
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Work Review Section - For Payer */}
            {userRole === 'payer' && (escrowTransaction.status === 'work_completed' || escrowTransaction.status === 'funded') && (
              <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
                    <Eye className="h-5 w-5" />
                    Review Submitted Work
                  </CardTitle>
                  <CardDescription className="text-green-600 dark:text-green-400">
                    Review the submitted work and approve or request changes.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Display completion proof if available */}
                  {escrowTransaction.completion_proof && (
                    <div className="space-y-3">
                      {escrowTransaction.completion_proof.description && (
                        <div>
                          <Label className="text-sm font-medium text-green-800 dark:text-green-200">Description</Label>
                          <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                            {escrowTransaction.completion_proof.description}
                          </p>
                        </div>
                      )}
                      
                      {escrowTransaction.completion_proof.notes && (
                        <div>
                          <Label className="text-sm font-medium text-green-800 dark:text-green-200">Notes</Label>
                          <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                            {escrowTransaction.completion_proof.notes}
                          </p>
                        </div>
                      )}

                      {escrowTransaction.completion_proof.files && escrowTransaction.completion_proof.files.length > 0 && (
                        <div>
                          <Label className="text-sm font-medium text-green-800 dark:text-green-200">Submitted Files</Label>
                          <div className="mt-2 space-y-2">
                            {escrowTransaction.completion_proof.files.map((file, index) => (
                              <div key={index} className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded border">
                                <FileText className="h-4 w-4 text-gray-500" />
                                <span className="text-sm text-green-700 dark:text-green-300">{file.name || `File ${index + 1}`}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(file.url, '_blank')}
                                  className="ml-auto"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {escrowTransaction.completion_proof.links && escrowTransaction.completion_proof.links.length > 0 && (
                        <div>
                          <Label className="text-sm font-medium text-green-800 dark:text-green-200">Submitted Links</Label>
                          <div className="mt-2 space-y-2">
                            {escrowTransaction.completion_proof.links.map((link, index) => (
                              <div key={index} className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded border">
                                <LinkIcon className="h-4 w-4 text-gray-500" />
                                <span className="text-sm text-green-700 dark:text-green-300 truncate">{link}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(link, '_blank')}
                                  className="ml-auto"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <Button 
                      onClick={() => handleApproveWork(true)}
                      disabled={approvingWork}
                      className="bg-green-600 hover:bg-green-700 flex-1"
                    >
                      {approvingWork ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <ThumbsUp className="h-4 w-4 mr-2" />
                          Approve & Release Payment
                        </>
                      )}
                    </Button>
                    <Button 
                      onClick={() => setShowApprovalDialog(true)}
                      disabled={approvingWork}
                      variant="outline"
                      className="flex-1"
                    >
                      <ThumbsDown className="h-4 w-4 mr-2" />
                      Request Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payer Status Information */}
            {userRole === 'payer' && (
              <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
                    <Building2 className="h-5 w-5" />
                    Your Action Required
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {escrowTransaction.status === 'paid_in_escrow' && (
                    <div className="text-sm text-orange-700 dark:text-orange-300">
                      <p>• Waiting for service provider to complete and submit work</p>
                      <p>• You will be notified when work is ready for review</p>
                      <p>• Current status: <strong>Payment in Escrow</strong></p>
                    </div>
                  )}
                  
                  {escrowTransaction.status === 'funded' && escrowTransaction.completion_proof && (
                    <div className="text-sm text-orange-700 dark:text-orange-300">
                      <p>• Work has been submitted and is ready for your review</p>
                      <p>• Please review the submitted work above</p>
                      <p>• Current status: <strong>Funded - Work Ready for Review</strong></p>
                    </div>
                  )}
                  
                  {escrowTransaction.status === 'funded' && !escrowTransaction.completion_proof && (
                    <div className="text-sm text-orange-700 dark:text-orange-300">
                      <p>• Payment is funded and waiting for work completion</p>
                      <p>• Service provider will submit work when ready</p>
                      <p>• Current status: <strong>Funded - Awaiting Work</strong></p>
                    </div>
                  )}
                  
                  {escrowTransaction.status === 'work_completed' && (
                    <div className="text-sm text-orange-700 dark:text-orange-300">
                      <p>• Work has been submitted and is ready for your review</p>
                      <p>• Please review the submitted work above</p>
                      <p>• Current status: <strong>Work Submitted for Review</strong></p>
                    </div>
                  )}
                  
                  {escrowTransaction.status === 'approved' && (
                    <div className="text-sm text-green-700 dark:text-green-300">
                      <p>• Work has been approved and payment has been released</p>
                      <p>• Transaction completed successfully</p>
                      <p>• Current status: <strong>Approved</strong></p>
                    </div>
                  )}
                  
                  {escrowTransaction.status === 'revision_requested' && (
                    <div className="text-sm text-orange-700 dark:text-orange-300">
                      <p>• Changes have been requested from the service provider</p>
                      <p>• Waiting for revised work to be submitted</p>
                      <p>• Current status: <strong>Revision Requested</strong></p>
                    </div>
                  )}
                  
                  {escrowTransaction.status === 'pending' && (
                    <div className="text-sm text-orange-700 dark:text-orange-300">
                      <p>• Waiting for payment to be processed</p>
                      <p>• Once payment is confirmed, work can begin</p>
                      <p>• Current status: <strong>Pending Payment</strong></p>
                    </div>
                  )}
                  
                  {escrowTransaction.status === 'released' && (
                    <div className="text-sm text-green-700 dark:text-green-300">
                      <p>• Payment has been released to the service provider</p>
                      <p>• Transaction completed successfully</p>
                      <p>• Current status: <strong>Payment Released</strong></p>
                    </div>
                  )}
                  
                  {escrowTransaction.status === 'refunded' && (
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      <p>• Payment has been refunded</p>
                      <p>• Transaction has been cancelled</p>
                      <p>• Current status: <strong>Payment Refunded</strong></p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Work Completion Status - For Payee */}
            {userRole === 'payee' && escrowTransaction.status === 'work_completed' && (
              <Card className="border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                    <Clock className="h-5 w-5" />
                    Work Submitted for Review
                  </CardTitle>
                  <CardDescription className="text-purple-600 dark:text-purple-400">
                    Your work has been submitted and is awaiting client approval.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-purple-700 dark:text-purple-300">
                    <p>• Client will review your submitted work</p>
                    <p>• Payment will be released upon approval</p>
                    <p>• You may be asked to make revisions if needed</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Work Approved - For Payee */}
            {userRole === 'payee' && (escrowTransaction.status === 'approved' || escrowTransaction.status === 'released') && (
              <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
                    <CheckCircle className="h-5 w-5" />
                    Work Approved & Payment Released
                  </CardTitle>
                  <CardDescription className="text-green-600 dark:text-green-400">
                    Congratulations! Your work has been approved and payment has been released.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                        <Euro className="h-4 w-4" />
                        <span className="font-medium">Payment Amount: €{escrowTransaction.amount.toFixed(2)}</span>
                      </div>
                      <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                        Payment has been transferred to your connected account
                      </p>
                    </div>
                    
                    <div className="text-sm text-green-700 dark:text-green-300">
                      <p>• Your work has been successfully approved by the client</p>
                      <p>• Payment has been released to your Stripe Connect account</p>
                      <p>• Transaction completed successfully</p>
                      {escrowTransaction.completion_approved_at && (
                        <p>• Approved on: {format(new Date(escrowTransaction.completion_approved_at), 'PPP')}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Work Completed - For Payer */}
            {userRole === 'payer' && (escrowTransaction.status === 'approved' || escrowTransaction.status === 'released') && (
              <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
                    <CheckCircle className="h-5 w-5" />
                    Transaction Completed
                  </CardTitle>
                  <CardDescription className="text-green-600 dark:text-green-400">
                    Work has been approved and payment has been released to the service provider.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                        <Euro className="h-4 w-4" />
                        <span className="font-medium">Payment Released: €{escrowTransaction.amount.toFixed(2)}</span>
                      </div>
                      <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                        Payment has been transferred to the service provider's account
                      </p>
                    </div>
                    
                    <div className="text-sm text-green-700 dark:text-green-300">
                      <p>• Work has been successfully approved</p>
                      <p>• Payment has been released to the service provider</p>
                      <p>• Transaction completed successfully</p>
                      {escrowTransaction.completion_approved_at && (
                        <p>• Approved on: {format(new Date(escrowTransaction.completion_approved_at), 'PPP')}</p>
                      )}
                      {escrowTransaction.funds_released_at && (
                        <p>• Payment released on: {format(new Date(escrowTransaction.funds_released_at), 'PPP')}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Revision Requested - For Payee */}
            {userRole === 'payee' && escrowTransaction.status === 'revision_requested' && (
              <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
                    <AlertTriangle className="h-5 w-5" />
                    Revision Requested
                  </CardTitle>
                  <CardDescription className="text-orange-600 dark:text-orange-400">
                    The client has requested changes to your submitted work.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Show revision feedback */}
                  {escrowTransaction.dispute_reason && (
                    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-orange-200 dark:border-orange-800">
                      <Label className="text-sm font-medium text-orange-800 dark:text-orange-200">Client Feedback:</Label>
                      <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                        {escrowTransaction.dispute_reason}
                      </p>
                    </div>
                  )}

                  {/* Show previous submission */}
                  {escrowTransaction.completion_proof && (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-orange-800 dark:text-orange-200">Previous Submission:</Label>
                      
                      {escrowTransaction.completion_proof.description && (
                        <div className="p-2 bg-white dark:bg-gray-800 rounded border">
                          <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">Description:</p>
                          <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                            {escrowTransaction.completion_proof.description}
                          </p>
                        </div>
                      )}
                      
                      {escrowTransaction.completion_proof.notes && (
                        <div className="p-2 bg-white dark:bg-gray-800 rounded border">
                          <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">Notes:</p>
                          <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                            {escrowTransaction.completion_proof.notes}
                          </p>
                        </div>
                      )}

                      {escrowTransaction.completion_proof.files && escrowTransaction.completion_proof.files.length > 0 && (
                        <div className="p-2 bg-white dark:bg-gray-800 rounded border">
                          <p className="text-xs text-orange-600 dark:text-orange-400 font-medium mb-2">Previous Files:</p>
                          <div className="space-y-1">
                            {escrowTransaction.completion_proof.files.map((file, index) => (
                              <div key={index} className="flex items-center gap-2 text-sm">
                                <FileText className="h-3 w-3 text-orange-500" />
                                <span className="text-orange-700 dark:text-orange-300">{file.name || `File ${index + 1}`}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(file.url, '_blank')}
                                  className="ml-auto h-6 px-2 text-xs"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {escrowTransaction.completion_proof.links && escrowTransaction.completion_proof.links.length > 0 && (
                        <div className="p-2 bg-white dark:bg-gray-800 rounded border">
                          <p className="text-xs text-orange-600 dark:text-orange-400 font-medium mb-2">Previous Links:</p>
                          <div className="space-y-1">
                            {escrowTransaction.completion_proof.links.map((link, index) => (
                              <div key={index} className="flex items-center gap-2 text-sm">
                                <LinkIcon className="h-3 w-3 text-orange-500" />
                                <span className="text-orange-700 dark:text-orange-300 truncate">{link}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(link, '_blank')}
                                  className="ml-auto h-6 px-2 text-xs"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button 
                      onClick={() => setShowWorkCompletionDialog(true)}
                      className="bg-orange-600 hover:bg-orange-700 flex-1"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Submit Revised Work
                    </Button>
                  </div>

                  <div className="text-sm text-orange-700 dark:text-orange-300">
                    <p>• Review the client's feedback above</p>
                    <p>• Make the requested changes to your work</p>
                    <p>• Submit the revised work for review</p>
                    <p>• Payment will be released upon approval</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Project Documents Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5" />
                  Project Documents
                </CardTitle>
                <CardDescription>
                  {userRole === 'payee' 
                    ? 'Upload project documents, contracts, and supporting files'
                    : 'Review documents uploaded by the service provider'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Documents List */}
                {escrowDocuments.length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="font-medium">Uploaded Documents</h4>
                    <div className="grid gap-3">
                      {escrowDocuments.map((document) => (
                        <div 
                          key={document.id} 
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border dark:border-gray-700"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white dark:bg-gray-700 rounded border dark:border-gray-600">
                              {getFileIcon(document.filename)}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-sm dark:text-gray-100">{document.filename}</p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>{document.type || 'Document'}</span>
                                <span>Uploaded by {document.uploaded_by?.full_name || document.uploaded_by?.username || 'Unknown'}</span>
                                <span>{format(new Date(document.created_at), 'MMM dd, yyyy')}</span>
                                {document.file_size && (
                                  <span>{(document.file_size / 1024 / 1024).toFixed(2)} MB</span>
                                )}
                              </div>
                              {document.description && (
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{document.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadDocument(document)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            {(userRole === 'payee' && document.uploaded_by_id === payeeProfile?.id) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteDocument(document)}
                                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FolderOpen className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      {userRole === 'payee' ? 'No Documents Uploaded Yet' : 'No Documents Available'}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      {userRole === 'payee' 
                        ? 'Upload project documents, contracts, and supporting files to share with the client.'
                        : 'The service provider will upload relevant documents here.'
                      }
                    </p>
                    {userRole === 'payee' && (
                      <Button 
                        onClick={() => setShowUploadDialog(true)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload First Document
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Transaction Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Transaction Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Created */}
                  <div className="flex items-start gap-3">
                    <div className="w-3 h-3 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium text-sm dark:text-gray-100">Escrow Transaction Created</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(escrowTransaction.created_at), 'PPP')}
                      </p>
                    </div>
                  </div>

                  {/* Payment */}
                  {escrowTransaction.status !== 'pending' && (
                    <div className="flex items-start gap-3">
                      <div className="w-3 h-3 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium text-sm dark:text-gray-100">Payment Received & Held in Escrow</p>
                        <p className="text-xs text-muted-foreground">
                          Funds securely held until work completion
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Work Completion */}
                  {escrowTransaction.completion_submitted_at && (
                    <div className="flex items-start gap-3">
                      <div className="w-3 h-3 rounded-full bg-purple-500 mt-2 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium text-sm dark:text-gray-100">Work Submitted for Review</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(escrowTransaction.completion_submitted_at), 'PPP')}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Approval */}
                  {escrowTransaction.completion_approved_at && (
                    <div className="flex items-start gap-3">
                      <div className="w-3 h-3 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium text-sm dark:text-gray-100">Work Approved</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(escrowTransaction.completion_approved_at), 'PPP')}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Funds Released */}
                  {escrowTransaction.funds_released_at && (
                    <div className="flex items-start gap-3">
                      <div className="w-3 h-3 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium text-sm dark:text-gray-100">Payment Released to Service Provider</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(escrowTransaction.funds_released_at), 'PPP')}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Revision Requested */}
                  {escrowTransaction.status === 'revision_requested' && (
                    <div className="flex items-start gap-3">
                      <div className="w-3 h-3 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium text-sm dark:text-gray-100">Revision Requested</p>
                        <p className="text-xs text-muted-foreground">
                          Client requested changes to the submitted work
                        </p>
                        {escrowTransaction.dispute_reason && (
                          <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                            Reason: {escrowTransaction.dispute_reason}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Disputed */}
                  {escrowTransaction.status === 'disputed' && (
                    <div className="flex items-start gap-3">
                      <div className="w-3 h-3 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium text-sm dark:text-gray-100">Transaction Disputed</p>
                        <p className="text-xs text-muted-foreground">
                          Dispute has been raised regarding the transaction
                        </p>
                        {escrowTransaction.dispute_reason && (
                          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                            Reason: {escrowTransaction.dispute_reason}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Refunded */}
                  {escrowTransaction.status === 'refunded' && (
                    <div className="flex items-start gap-3">
                      <div className="w-3 h-3 rounded-full bg-gray-500 mt-2 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium text-sm dark:text-gray-100">Payment Refunded</p>
                        <p className="text-xs text-muted-foreground">
                          Funds have been returned to the payer
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Auto Release (if applicable) */}
                  {escrowTransaction.auto_release_date && escrowTransaction.status === 'paid_in_escrow' && (
                    <div className="flex items-start gap-3">
                      <div className="w-3 h-3 rounded-full bg-yellow-500 mt-2 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium text-sm dark:text-gray-100">Auto-Release Scheduled</p>
                        <p className="text-xs text-muted-foreground">
                          Payment will be automatically released on {format(new Date(escrowTransaction.auto_release_date), 'PPP')}
                        </p>
                        {timeRemaining && (
                          <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                            {timeRemaining} remaining
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Transaction Notifications */}
            <EscrowNotificationStatus invoiceId={invoiceId} />

            {/* User Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Participants</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={payerProfile?.avatar_url || undefined} />
                    <AvatarFallback>
                      {payerProfile?.full_name?.[0] || payerProfile?.username?.[0] || 'P'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium text-sm dark:text-gray-100">
                      {payerProfile?.full_name || payerProfile?.username || 'Payer'}
                    </p>
                    <p className="text-xs text-muted-foreground">Payer</p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={payeeProfile?.avatar_url || undefined} />
                    <AvatarFallback>
                      {payeeProfile?.full_name?.[0] || payeeProfile?.username?.[0] || 'P'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium text-sm dark:text-gray-100">
                      {payeeProfile?.full_name || payeeProfile?.username || 'Payee'}
                    </p>
                    <p className="text-xs text-muted-foreground">Payee</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Role-Specific Information */}
            {userRole === 'payee' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Your Role: Service Provider</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/50 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">What you need to do:</h4>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                      <li>• Complete the agreed work</li>
                      <li>• Upload project documents</li>
                      <li>• Submit deliverables and proof</li>
                      <li>• Wait for client approval</li>
                      <li>• Receive payment upon approval</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}

            {userRole === 'payer' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Your Role: Client</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 bg-green-50 dark:bg-green-950/50 rounded-lg border border-green-200 dark:border-green-800">
                    <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">What you need to do:</h4>
                    <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
                      <li>• Wait for work completion</li>
                      <li>• Review uploaded documents</li>
                      <li>• Review submitted deliverables</li>
                      <li>• Approve or request changes</li>
                      <li>• Payment released upon approval</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Document Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Document
            </DialogTitle>
            <DialogDescription>
              Upload a document to share with the client. Supported formats: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, JPG, PNG, GIF (max 10MB)
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Document Type Selection */}
            <div className="space-y-2">
              <Label htmlFor="document-type">Document Type</Label>
              <Select 
                value={documentData.type} 
                onValueChange={(value) => setDocumentData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Project Contract">Project Contract</SelectItem>
                  <SelectItem value="Design Mockups">Design Mockups</SelectItem>
                  <SelectItem value="NDA">NDA</SelectItem>
                  <SelectItem value="Project Brief">Project Brief</SelectItem>
                  <SelectItem value="Technical Specifications">Technical Specifications</SelectItem>
                  <SelectItem value="Progress Report">Progress Report</SelectItem>
                  <SelectItem value="Final Deliverables">Final Deliverables</SelectItem>
                  <SelectItem value="Invoice">Invoice</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label>File</Label>
              <div 
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors cursor-pointer"
                onClick={() => documentFileRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.add('border-blue-500', 'bg-blue-50', 'dark:bg-blue-950/50');
                }}
                onDragLeave={(e) => {
                  e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50', 'dark:bg-blue-950/50');
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50', 'dark:bg-blue-950/50');
                  const files = Array.from(e.dataTransfer.files);
                  if (files.length > 0) {
                    const file = files[0];
                    setDocumentData(prev => ({ ...prev, file }));
                  }
                }}
              >
                {documentData.file ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center">
                      {getFileIcon(documentData.file.name)}
                    </div>
                    <p className="font-medium dark:text-gray-100">{documentData.file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(documentData.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDocumentData(prev => ({ ...prev, file: null, filename: '' }));
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove File
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 mx-auto text-gray-400 dark:text-gray-500" />
                    <p className="font-medium dark:text-gray-100">Click to upload or drag and drop</p>
                    <p className="text-sm text-muted-foreground">
                      PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, JPG, PNG, GIF up to 10MB
                    </p>
                  </div>
                )}
                <input
                  ref={documentFileRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setDocumentData(prev => ({ ...prev, file }));
                    }
                  }}
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="document-description">Description (Optional)</Label>
              <Textarea
                id="document-description"
                placeholder="Brief description of the document..."
                value={documentData.description}
                onChange={(e) => setDocumentData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUploadDocument}
              disabled={!documentData.file || uploadingDocument}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {uploadingDocument ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Work Completion Submission Dialog */}
      <Dialog open={showWorkCompletionDialog} onOpenChange={setShowWorkCompletionDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5" />
              Submit Work Completion
            </DialogTitle>
            <DialogDescription>
              Upload your completed work, deliverables, and any supporting materials for client review.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Work Description */}
            <div className="space-y-2">
              <Label htmlFor="work-description">Work Description *</Label>
              <Textarea
                id="work-description"
                placeholder="Describe the work you've completed..."
                value={workCompletionData.description}
                onChange={(e) => setWorkCompletionData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                required
              />
            </div>

            {/* Work Notes */}
            <div className="space-y-2">
              <Label htmlFor="work-notes">Additional Notes (Optional)</Label>
              <Textarea
                id="work-notes"
                placeholder="Any additional notes or instructions for the client..."
                value={workCompletionData.notes}
                onChange={(e) => setWorkCompletionData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>

            {/* File Uploads */}
            <div className="space-y-2">
              <Label>Deliverable Files (Optional)</Label>
              <div 
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors cursor-pointer"
                onClick={() => workCompletionFileRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.add('border-blue-500', 'bg-blue-50', 'dark:bg-blue-950/50');
                }}
                onDragLeave={(e) => {
                  e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50', 'dark:bg-blue-950/50');
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50', 'dark:bg-blue-950/50');
                  const files = Array.from(e.dataTransfer.files);
                  setWorkCompletionData(prev => ({ ...prev, files: [...prev.files, ...files] }));
                }}
              >
                <Upload className="h-8 w-8 mx-auto text-gray-400 dark:text-gray-500 mb-2" />
                <p className="font-medium dark:text-gray-100">Click to upload or drag and drop files</p>
                <p className="text-sm text-muted-foreground">
                  Upload your completed work files (max 10MB each)
                </p>
                <input
                  ref={workCompletionFileRef}
                  type="file"
                  className="hidden"
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif,.zip,.rar"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setWorkCompletionData(prev => ({ ...prev, files: [...prev.files, ...files] }));
                  }}
                />
              </div>
              
              {/* Display uploaded files */}
              {workCompletionData.files.length > 0 && (
                <div className="space-y-2">
                  <Label>Selected Files:</Label>
                  <div className="space-y-2">
                    {workCompletionData.files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded border">
                        <div className="flex items-center gap-2">
                          {getFileIcon(file.name)}
                          <span className="text-sm dark:text-gray-100">{file.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setWorkCompletionData(prev => ({
                            ...prev,
                            files: prev.files.filter((_, i) => i !== index)
                          }))}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* External Links */}
            <div className="space-y-2">
              <Label>External Links (Optional)</Label>
              <div className="space-y-2">
                {workCompletionData.links.map((link, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="https://example.com"
                      value={link}
                      onChange={(e) => {
                        const newLinks = [...workCompletionData.links];
                        newLinks[index] = e.target.value;
                        setWorkCompletionData(prev => ({ ...prev, links: newLinks }));
                      }}
                    />
                    {workCompletionData.links.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setWorkCompletionData(prev => ({
                          ...prev,
                          links: prev.links.filter((_, i) => i !== index)
                        }))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setWorkCompletionData(prev => ({
                    ...prev,
                    links: [...prev.links, '']
                  }))}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Another Link
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWorkCompletionDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitWorkCompletion}
              disabled={!workCompletionData.description.trim() || submittingWork}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {submittingWork ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Work for Review
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Work Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ThumbsDown className="h-5 w-5" />
              Request Changes
            </DialogTitle>
            <DialogDescription>
              Provide feedback on what changes are needed before you can approve the work.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Reason for Changes *</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Explain what changes are needed..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => handleApproveWork(false)}
              disabled={!rejectionReason.trim() || approvingWork}
              variant="destructive"
            >
              {approvingWork ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <XSquare className="h-4 w-4 mr-2" />
                  Request Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 