'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { EllipsisVertical, Plus, PenLine } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'sonner';
import type { Database } from '@/lib/database.types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useSignatures } from '@/hooks/use-signatures';
import { SignatureRequestDialog } from '@/components/signature-request-dialog';

import {
  Lock,
  History,
  ShieldCheck,
  Search,
  UploadCloud,
  FolderOpen,
  FileText,
  FileBadge,
  FileHeart,
  FileStack,
  SlidersHorizontal,
  Eye,
  Trash2,
  Download,
  Share2,
  Copy,
  Users,
  HardDrive,
  Settings,
  Image as FileImage,
  FileText as FileWord,
  Table as FileSpreadsheet,
  Presentation as FilePresentation,
  Code as FileCode,
  Archive as FileArchive,
  Video as FileVideo,
  Music as FileAudio,
  File
} from 'lucide-react';

interface UserProfile {
  full_name: string;
  avatar_url: string | null;
}

interface VaultDocument {
  id: string;
  filename: string;
  filepath: string;
  type?: string;
  size?: number;
  owner_id: string;
  created_at: string;
  description?: string;
  shared_with_id?: string;
  shared_at?: string;
  shared_by?: UserProfile;
  shared_with?: UserProfile;
}

export default function MyVaultPage() {
  const supabase = createClientComponentClient<Database>();
  const searchParams = useSearchParams();
  // Types for documents and activities
  type SharedDocument = VaultDocument;
  type Activity = any;
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>('personal-documents');
  const [showSignatureInstructions, setShowSignatureInstructions] = useState<boolean>(false);
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  const [addDocumentDialogOpen, setAddDocumentDialogOpen] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [personalDocuments, setPersonalDocuments] = useState<VaultDocument[]>([]);
  const [sharedWithMe, setSharedWithMe] = useState<VaultDocument[]>([]);
  const [sharedByMe, setSharedByMe] = useState<VaultDocument[]>([]);
  const [sharedTab, setSharedTab] = useState<string>('shared-with-me');
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [fileInput, setFileInput] = useState<File | null>(null);
  const [form, setForm] = useState<{
    name: string;
    type: string;
    description: string;
    tags: string;
    file: File | null;
  }>({
    name: '',
    type: '',
    description: '',
    tags: '',
    file: null,
  });
  const fileRef = useRef<HTMLInputElement>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [documentToDelete, setDocumentToDelete] = useState<VaultDocument | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState<boolean>(false);
  const [documentToShare, setDocumentToShare] = useState<VaultDocument | null>(null);
  const [signatureRequestDialogOpen, setSignatureRequestDialogOpen] = useState<boolean>(false);
  const [documentForSignature, setDocumentForSignature] = useState<VaultDocument | null>(null);
  const [connections, setConnections] = useState<any[]>([]);
  const [selectedConnections, setSelectedConnections] = useState<string[]>([]);
  const [sharing, setSharing] = useState<boolean>(false);
  const { userId } = user || {};
  const {
    sentRequests,
    receivedRequests,
    isLoading: signaturesLoading,
    error: signaturesError,
    refreshRequests,
  } = useSignatures({ userId: user?.id });
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);

  // Fetch user on mount
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user);
      if (data.user) {
        // Fetch profile from profiles table
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', data.user.id)
          .single();
        if (profile) setCurrentUserProfile(profile);
      }
    });
  }, []);

  // Handle URL parameters for signature request flow
  useEffect(() => {
    const signature = searchParams.get('signature');
    const userId = searchParams.get('userId');
    
    if (signature === 'true' && userId) {
      setShowSignatureInstructions(true);
      setTargetUserId(userId);
      setActiveTab('personal-documents');
    }
  }, [searchParams]);

  // Fetch personal documents
  useEffect(() => {
    if (!user) return;
    const fetchDocs = async () => {
      const { data, error } = await supabase
        .from('vault_documents')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });
      if (error) toast.error('Failed to fetch documents');
      else setPersonalDocuments(data || []);
    };
    fetchDocs();
  }, [user]);

  // Fetch shared documents
  useEffect(() => {
    if (!user) return;
    const fetchShared = async () => {
      // Fetch documents shared with me (where I am the receiver)
      const { data: receivedShares, error: receivedError } = await supabase
        .from('vault_shares')
        .select(`
          *,
          vault_documents!inner(
            *,
            owner:profiles!vault_documents_owner_id_fkey(
              full_name,
              avatar_url
            )
          )
        `)
        .eq('shared_with_id', user.id)
        .order('shared_at', { ascending: false });

      if (receivedError) {
        console.error('Error fetching received shares:', receivedError);
        toast.error('Failed to fetch received shares');
      } else {
        console.log('Received shares:', receivedShares);
        setSharedWithMe((receivedShares || []).map((share: any) => ({
          ...share.vault_documents,
          shared_by: share.vault_documents.owner
        })));
      }

      // Fetch documents I've shared (where I am the owner)
      const { data: sentShares, error: sentError } = await supabase
        .from('vault_shares')
        .select(`
          *,
          vault_documents!inner(*),
          shared_with:profiles!vault_shares_shared_with_id_fkey(
            full_name,
            avatar_url
          )
        `)
        .eq('vault_documents.owner_id', user.id)
        .order('shared_at', { ascending: false });

      if (sentError) {
        console.error('Error fetching sent shares:', sentError);
        toast.error('Failed to fetch sent shares');
      } else {
        console.log('Sent shares:', sentShares);
        setSharedByMe((sentShares || []).map((share: any) => ({
          ...share.vault_documents,
          shared_with: share.shared_with
        })));
      }
    };
    fetchShared();
  }, [user]);

  // Fetch connections when share dialog opens
  useEffect(() => {
    if (shareDialogOpen && user) {
      const fetchConnections = async () => {
        const { data, error } = await supabase
          .from('connections')
          .select(`
            *,
            sender:sender_id(id, username, full_name, avatar_url, professional_role),
            receiver:receiver_id(id, username, full_name, avatar_url, professional_role)
          `)
          .eq('status', 'accepted')
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

        if (error) {
          toast.error('Failed to fetch connections');
          return;
        }

        // Get the other user from each connection
        const otherUsers = data.map(connection => 
          connection.sender_id === user.id ? connection.receiver : connection.sender
        ).filter(Boolean);

        setConnections(otherUsers);
      };

      fetchConnections();
    }
  }, [shareDialogOpen, user]);

  // Handle form input
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value, files } = e.target as HTMLInputElement;
    if (id === 'file') {
      setForm((f) => ({ ...f, file: files ? files[0] : null }));
    } else {
      setForm((f) => ({ ...f, [id]: value }));
    }
  };

  // Upload document
  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate required fields
    console.log('Form state:', form); // Debug log
    if (!form.file) {
      toast.error('Please select a file to upload');
      return;
    }
    if (!form.name.trim()) {
      toast.error('Please enter a document name');
      return;
    }
    if (!user) {
      toast.error('User not authenticated');
      return;
    }
    
    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (form.file.size > maxSize) {
      toast.error('File size must be less than 10MB');
      return;
    }
    
    setUploading(true);
    
    try {
      // Sanitize filename by replacing spaces and special characters
      const sanitizedFileName = form.file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${user.id}/${Date.now()}_${sanitizedFileName}`;
      
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('vault')
        .upload(filePath, form.file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        toast.error(`Upload failed: ${uploadError.message}`);
        setUploading(false);
        return;
      }

      // Prepare document data
      const documentData = {
        owner_id: user.id,
        filename: form.name,
        filepath: filePath,
        description: form.description || null,
        is_encrypted: true,
        type: form.type || null
      };

      // Insert metadata
      const { error: insertError } = await supabase
        .from('vault_documents')
        .insert(documentData)
        .select()
        .single();

      if (insertError) {
        // If metadata insert fails, try to delete the uploaded file
        await supabase.storage.from('vault').remove([filePath]);
        toast.error(`Failed to save document metadata: ${insertError.message}`);
        setUploading(false);
        return;
      }

      toast.success('Document uploaded!');
      setAddDocumentDialogOpen(false);
      setForm({ name: '', type: '', description: '', tags: '', file: null });
      setFileInput(null);
      if (fileRef.current) fileRef.current.value = '';

      // Refresh list
      const { data: newDocs } = await supabase
        .from('vault_documents')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });
      
      setPersonalDocuments(newDocs || []);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('An unexpected error occurred during upload');
      setFileInput(null);
      setForm({ name: '', type: '', description: '', tags: '', file: null });
    } finally {
      setUploading(false);
    }
  };

  // Download document
  const handleDownload = async (doc: VaultDocument) => {
    const { data, error } = await supabase.storage.from('vault').download(doc.filepath);
    if (error) {
      toast.error('Download failed');
      return;
    }
    const url = window.URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  // Delete document
  const handleDelete = async (doc: VaultDocument) => {
    setDocumentToDelete(doc);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!documentToDelete) return;
    
    try {
      // Remove from storage
      await supabase.storage.from('vault').remove([documentToDelete.filepath]);
      // Remove from DB
      await supabase.from('vault_documents').delete().eq('id', documentToDelete.id);
      setPersonalDocuments((docs) => docs.filter((d) => d.id !== documentToDelete.id));
      toast.success('Document deleted');
    } catch (error) {
      toast.error('Failed to delete document');
    } finally {
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    }
  };

  // Share document
  const handleShare = async (doc: VaultDocument) => {
    setDocumentToShare(doc);
    setShareDialogOpen(true);
    setSelectedConnections([]);
  };

  const handleRequestSignature = (doc: VaultDocument) => {
    setDocumentForSignature(doc);
    setSignatureRequestDialogOpen(true);
  };

  const confirmShare = async () => {
    if (!documentToShare || !user || selectedConnections.length === 0) return;
    
    setSharing(true);
    try {
      // Share with each selected connection
      const sharePromises = selectedConnections.map(async (shared_with_id) => {
        const { error } = await supabase.from('vault_shares').insert({
          document_id: documentToShare.id,
          shared_with_id,
          shared_at: new Date().toISOString()
        });
        
        if (error) {
          console.error('Share error:', error);
          throw error;
        }
      });

      await Promise.all(sharePromises);
      toast.success('Document shared successfully!');
      setShareDialogOpen(false);
      setDocumentToShare(null);
      setSelectedConnections([]);
    } catch (error: any) {
      console.error('Share error details:', error);
      toast.error(`Failed to share document: ${error.message || 'Unknown error'}`);
    } finally {
      setSharing(false);
    }
  };

  const getFileIcon = (filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    // Image files
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(extension || '')) {
      return <FileImage className="h-5 w-5 text-blue-500" />;
    }
    
    // Word documents
    if (['doc', 'docx', 'odt', 'rtf'].includes(extension || '')) {
      return <FileWord className="h-5 w-5 text-blue-600" />;
    }
    
    // Excel/Spreadsheet files
    if (['xls', 'xlsx', 'csv', 'ods'].includes(extension || '')) {
      return <FileSpreadsheet className="h-5 w-5 text-green-600" />;
    }
    
    // PowerPoint files
    if (['ppt', 'pptx', 'odp'].includes(extension || '')) {
      return <FilePresentation className="h-5 w-5 text-orange-600" />;
    }
    
    // PDF files
    if (extension === 'pdf') {
      return <FileText className="h-5 w-5 text-red-500" />;
    }
    
    // Code files
    if (['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'py', 'java', 'cpp', 'c', 'php'].includes(extension || '')) {
      return <FileCode className="h-5 w-5 text-purple-500" />;
    }
    
    // Archive files
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension || '')) {
      return <FileArchive className="h-5 w-5 text-yellow-500" />;
    }
    
    // Video files
    if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv'].includes(extension || '')) {
      return <FileVideo className="h-5 w-5 text-pink-500" />;
    }
    
    // Audio files
    if (['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(extension || '')) {
      return <FileAudio className="h-5 w-5 text-indigo-500" />;
    }
    
    // Default file icon
    return <File className="h-5 w-5 text-gray-500" />;
  };

  const getSignatureStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'signed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'declined':
      case 'expired':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="flex-1 space-y-6 p-4 sm:p-8 pt-6">
      {/* Header Section */}
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Secure Vault</h1>
              <p className="text-sm text-muted-foreground">Your encrypted document storage</p>
            </div>
          </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Dialog open={addDocumentDialogOpen} onOpenChange={setAddDocumentDialogOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Add Document</span>
                  <span className="sm:hidden">Add</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                  <DialogTitle>Upload Document</DialogTitle>
                <DialogDescription>
                    Add a new document to your secure vault
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleUpload}>
                <div className="space-y-4">
                  <div
                      className="relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted transition-colors"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        const file = e.dataTransfer.files[0];
                        setFileInput(file);
                        setForm({ ...form, name: file.name, file: file });
                      }
                    }}
                  >
                    <UploadCloud className="w-10 h-10 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground text-center">
                        <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                    </p>
                      <p className="text-xs text-muted-foreground mt-1">PDF, DOC, Images up to 10MB</p>
                    <input
                      id="file-upload"
                      type="file"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          setFileInput(file);
                          setForm({ ...form, name: file.name, file: file });
                        }
                      }}
                    />
                  </div>
                  {fileInput && (
                      <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">{fileInput.name}</span>
                      </div>
                  )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Document Name</Label>
                        <Input 
                          id="name" 
                          value={form.name} 
                          onChange={handleFormChange} 
                          placeholder="Enter document name" 
                        />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Document Type</Label>
                    <Select onValueChange={(value) => setForm(f => ({ ...f, type: value }))} value={form.type}>
                      <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="invoice">Invoice</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="report">Report</SelectItem>
                        <SelectItem value="nda">NDA</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                      </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                      <Textarea 
                        id="description" 
                        value={form.description} 
                        onChange={handleFormChange} 
                        placeholder="Brief description of the document..." 
                        rows={3}
                      />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags</Label>
                      <Input 
                        id="tags" 
                        value={form.tags} 
                        onChange={handleFormChange} 
                        placeholder="finance, q4, confidential (comma separated)" 
                      />
                  </div>
                </div>
                <DialogFooter className="mt-6">
                    <Button type="button" variant="outline" onClick={() => {
                      setAddDocumentDialogOpen(false);
                      setFileInput(null);
                      setForm({ name: '', type: '', description: '', tags: '', file: null });
                    }}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={uploading} className="gap-2">
                      {uploading ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <UploadCloud className="h-4 w-4" />
                          Upload Document
                        </>
                      )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>
      </div>

      {/* Signature Request Instructions */}
      {showSignatureInstructions && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  Send Signature Request
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-200 mb-3">
                  To send a signature request to your contact, follow these steps:
                </p>
                <div className="space-y-2 text-sm text-blue-700 dark:text-blue-200">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>1. Select a document from your Personal Documents below</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>2. Click the "Request Signature" button (📝 icon) on the document</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>3. Your contact will receive a message with a link to sign the document</span>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-3 border-blue-300 text-blue-700 hover:bg-blue-100"
                  onClick={() => setShowSignatureInstructions(false)}
                >
                  Got it
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Overview */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Documents */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-lg blur-lg group-hover:blur-xl transition-all duration-300"></div>
            <Card className="relative border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/30 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{personalDocuments.length}</div>
                    <div className="text-xs text-blue-500/70 dark:text-blue-400/70">documents</div>
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-sm text-blue-900 dark:text-blue-100">Total Documents</h3>
                  <p className="text-xs text-blue-600/80 dark:text-blue-300/80">Your personal vault contents</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Shared Documents */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-lg blur-lg group-hover:blur-xl transition-all duration-300"></div>
            <Card className="relative border-0 shadow-md bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/50 dark:to-green-900/30 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <Share2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-green-600 dark:text-green-400">{sharedByMe.length}</div>
                    <div className="text-xs text-green-500/70 dark:text-green-400/70">shared</div>
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-sm text-green-900 dark:text-green-100">Shared</h3>
                  <p className="text-xs text-green-600/80 dark:text-green-300/80">Documents you've shared</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Shared with Me */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-purple-600/10 rounded-lg blur-lg group-hover:blur-xl transition-all duration-300"></div>
            <Card className="relative border-0 shadow-md bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/50 dark:to-purple-900/30 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-purple-600 dark:text-purple-400">{sharedWithMe.length}</div>
                    <div className="text-xs text-purple-500/70 dark:text-purple-400/70">received</div>
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-sm text-purple-900 dark:text-purple-100">Shared with Me</h3>
                  <p className="text-xs text-purple-600/80 dark:text-purple-300/80">Documents shared with you</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Storage Usage */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-orange-600/10 rounded-lg blur-lg group-hover:blur-xl transition-all duration-300"></div>
            <Card className="relative border-0 shadow-md bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/50 dark:to-orange-900/30 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-orange-500/20 rounded-lg">
                    <HardDrive className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-orange-600 dark:text-orange-400">1.5 GB</div>
                    <div className="text-xs text-orange-500/70 dark:text-orange-400/70">of 10 GB</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-orange-600/80 dark:text-orange-300/80">Used</span>
                      <span className="text-orange-600/80 dark:text-orange-300/80">15%</span>
                    </div>
                    <div className="w-full bg-orange-200/50 dark:bg-orange-800/30 rounded-full h-1.5">
                      <div 
                        className="bg-gradient-to-r from-orange-500 to-orange-600 h-1.5 rounded-full transition-all duration-500 ease-out"
                        style={{ width: '15%' }}
                      ></div>
                    </div>
                  </div>
                  <p className="text-xs text-orange-600/80 dark:text-orange-300/80 font-medium">8.5 GB remaining</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">My Documents</h2>
        </div>
        
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents by name, type, or description..."
              className="pl-10 h-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 h-10">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem>All Documents</DropdownMenuItem>
                <DropdownMenuItem>Invoices</DropdownMenuItem>
                <DropdownMenuItem>Contracts</DropdownMenuItem>
                <DropdownMenuItem>Reports</DropdownMenuItem>
                <DropdownMenuItem>NDAs</DropdownMenuItem>
                <DropdownMenuItem>Others</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 h-10">
                  <SlidersHorizontal className="h-4 w-4" />
                  Sort
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem>Date (newest first)</DropdownMenuItem>
                <DropdownMenuItem>Date (oldest first)</DropdownMenuItem>
                <DropdownMenuItem>Name (A-Z)</DropdownMenuItem>
                <DropdownMenuItem>Name (Z-A)</DropdownMenuItem>
                <DropdownMenuItem>Size (largest first)</DropdownMenuItem>
                <DropdownMenuItem>Size (smallest first)</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Personal Documents Section */}
      <div className="space-y-4">
        {personalDocuments.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="p-4 bg-muted rounded-full mb-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No documents yet</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                Start building your secure document vault by uploading your first document.
              </p>
              <Button onClick={() => setAddDocumentDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Upload First Document
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Add Document Card */}
            <Card 
              className="group hover:shadow-lg transition-all duration-200 border-dashed border-2 border-muted-foreground/25 hover:border-primary/50 cursor-pointer"
              onClick={() => setAddDocumentDialogOpen(true)}
            >
              <CardContent className="p-4 h-full flex flex-col items-center justify-center text-center min-h-[160px]">
                <div className="p-3 bg-muted rounded-full mb-3 group-hover:bg-primary/10 transition-colors">
                  <Plus className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <h3 className="font-medium text-sm mb-1 group-hover:text-primary transition-colors">
                  Add Document
                </h3>
                <p className="text-xs text-muted-foreground">
                  Upload a new document to your vault
                </p>
        </CardContent>
      </Card>

                {personalDocuments.map((doc) => (
              <Card key={doc.id} className="group hover:shadow-lg transition-all duration-200 border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0 p-2 bg-muted rounded-lg group-hover:bg-primary/10 transition-colors">
                          {getFileIcon(doc.filename)}
                        </div>
                        <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate" title={doc.filename}>
                          {doc.filename}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                              {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : 'N/A'}
                        </p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                        >
                            <EllipsisVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="gap-2" onClick={() => handleDownload(doc)}>
                            <Download className="h-4 w-4" /> Download
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2" onClick={() => handleShare(doc)}>
                            <Share2 className="h-4 w-4" /> Share
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 text-red-600" onClick={() => handleDelete(doc)}>
                            <Trash2 className="h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {doc.type || 'Document'}
                      </Badge>
                      {doc.description && (
                        <span className="text-xs text-muted-foreground truncate max-w-[120px]" title={doc.description}>
                          {doc.description}
                        </span>
                      )}
              </div>
              
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs h-8"
                        onClick={() => handleDownload(doc)}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs h-8"
                        onClick={() => handleShare(doc)}
                      >
                        <Share2 className="h-3 w-3 mr-1" />
                        Share
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        title="Request Signature"
                        onClick={() => handleRequestSignature(doc)}
                      >
                        <PenLine className="h-4 w-4" />
                        <span className="sr-only">Request Signature</span>
                      </Button>
                    </div>
              </div>
            </CardContent>
          </Card>
            ))}
                    </div>
        )}
      </div>



      {/* Shared Documents Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Share2 className="h-5 w-5 text-primary" />
              Shared Documents
            </h2>
                                    </div>
                                  </div>
        
        <Tabs defaultValue="shared-with-me" value={sharedTab} onValueChange={setSharedTab} className="space-y-4 w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="shared-with-me" className="text-xs sm:text-sm">Shared with Me</TabsTrigger>
            <TabsTrigger value="shared-by-me" className="text-xs sm:text-sm">Shared by Me</TabsTrigger>
          </TabsList>
          <TabsContent value="shared-with-me" className="mt-6">
            {sharedWithMe.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="p-4 bg-muted rounded-full mb-4">
                    <Users className="h-8 w-8 text-muted-foreground" />
                                </div>
                  <h3 className="text-lg font-semibold mb-2">No documents shared with you</h3>
                  <p className="text-sm text-muted-foreground">
                    When someone shares a document with you, it will appear here.
                  </p>
                </CardContent>
                          </Card>
            ) : (
              <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                      <TableHead>DOCUMENT</TableHead>
                              <TableHead>TYPE</TableHead>
                              <TableHead>SHARED BY</TableHead>
                              <TableHead>SHARED DATE</TableHead>
                              <TableHead className="text-right">ACTIONS</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {sharedWithMe.map((doc) => (
                              <TableRow key={doc.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-muted rounded-lg">
                              {getFileIcon(doc.filename)}
                            </div>
                            <span className="truncate max-w-[200px]" title={doc.filename}>
                              {doc.filename}
                            </span>
                          </div>
                                </TableCell>
                        <TableCell>
                          <Badge variant="outline">{doc.type || 'Document'}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6">
                                    <AvatarImage src={doc.shared_by?.avatar_url || undefined} />
                              <AvatarFallback className="text-xs">{doc.shared_by?.full_name?.charAt(0)}</AvatarFallback>
                                  </Avatar>
                            <span className="truncate max-w-[150px]" title={doc.shared_by?.full_name || 'Unknown User'}>
                                  {doc.shared_by?.full_name || 'Unknown User'}
                            </span>
                          </div>
                                </TableCell>
                        <TableCell>
                          {doc.shared_at ? new Date(doc.shared_at).toLocaleDateString() : 'N/A'}
                        </TableCell>
                                <TableCell className="text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <EllipsisVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem className="gap-2" onClick={() => handleDownload(doc)}>
                                        <Download className="h-4 w-4" /> Download
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                  )}
                </TabsContent>
          <TabsContent value="shared-by-me" className="mt-6">
                  {sharedByMe.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="p-4 bg-muted rounded-full mb-4">
                    <Share2 className="h-8 w-8 text-muted-foreground" />
                    </div>
                  <h3 className="text-lg font-semibold mb-2">No documents shared by you</h3>
                  <p className="text-sm text-muted-foreground">
                    When you share documents with others, they will appear here.
                  </p>
                </CardContent>
                          </Card>
            ) : (
              <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                      <TableHead>DOCUMENT</TableHead>
                              <TableHead>TYPE</TableHead>
                              <TableHead>SHARED WITH</TableHead>
                              <TableHead>SHARED DATE</TableHead>
                              <TableHead className="text-right">ACTIONS</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {sharedByMe.map((doc) => (
                              <TableRow key={doc.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-muted rounded-lg">
                              {getFileIcon(doc.filename)}
                            </div>
                            <span className="truncate max-w-[200px]" title={doc.filename}>
                              {doc.filename}
                            </span>
                          </div>
                                </TableCell>
                        <TableCell>
                          <Badge variant="outline">{doc.type || 'Document'}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6">
                                    <AvatarImage src={doc.shared_with?.avatar_url || undefined} />
                              <AvatarFallback className="text-xs">{doc.shared_with?.full_name?.charAt(0)}</AvatarFallback>
                                  </Avatar>
                            <span className="truncate max-w-[150px]" title={doc.shared_with?.full_name || 'Unknown User'}>
                                  {doc.shared_with?.full_name || 'Unknown User'}
                            </span>
                          </div>
                                </TableCell>
                        <TableCell>
                          {doc.shared_at ? new Date(doc.shared_at).toLocaleDateString() : 'N/A'}
                        </TableCell>
                                <TableCell className="text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <EllipsisVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem className="gap-2" onClick={() => handleDownload(doc)}>
                                        <Download className="h-4 w-4" /> Download
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                  )}
                </TabsContent>
              </Tabs>
              </div>

      {/* Signature Requests Section */}
      <div className="space-y-6 mt-8">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" /> Signature Requests
        </h2>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Sender</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...receivedRequests, ...sentRequests].map((req) => (
                <TableRow key={req.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-lg">
                        {getFileIcon(req.document?.filename || '')}
                      </div>
                      <span className="truncate max-w-[200px]" title={req.document?.filename}>
                        {req.document?.filename}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">Document</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={
                          req.sender_id === user?.id
                            ? currentUserProfile?.avatar_url || undefined
                            : req.sender?.avatar_url || undefined
                        } />
                        <AvatarFallback className="text-xs">
                          {
                            req.sender_id === user?.id
                              ? currentUserProfile?.full_name?.charAt(0)
                              : req.sender?.full_name?.charAt(0)
                          }
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate max-w-[150px]" title={
                        req.sender_id === user?.id
                          ? currentUserProfile?.full_name || 'You'
                          : req.sender?.full_name || 'Unknown User'
                      }>
                        {req.sender_id === user?.id
                          ? currentUserProfile?.full_name || 'You'
                          : req.sender?.full_name || 'Unknown User'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={
                          req.receiver_id === user?.id
                            ? currentUserProfile?.avatar_url || undefined
                            : req.receiver?.avatar_url || undefined
                        } />
                        <AvatarFallback className="text-xs">
                          {
                            req.receiver_id === user?.id
                              ? currentUserProfile?.full_name?.charAt(0)
                              : req.receiver?.full_name?.charAt(0)
                          }
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate max-w-[150px]" title={
                        req.receiver_id === user?.id
                          ? currentUserProfile?.full_name || 'You'
                          : req.receiver?.full_name || 'Unknown User'
                      }>
                        {req.receiver_id === user?.id
                          ? currentUserProfile?.full_name || 'You'
                          : req.receiver?.full_name || 'Unknown User'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getSignatureStatusBadgeVariant(req.status)} className="text-xs">
                      {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {req.created_at ? new Date(req.created_at).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/dashboard/signature/${req.id}`, '_self')}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {signaturesLoading && <div className="text-muted-foreground text-sm mt-4">Loading...</div>}
          {!signaturesLoading && receivedRequests.length + sentRequests.length === 0 && (
            <div className="text-muted-foreground text-sm mt-4">No signature requests found.</div>
          )}
        </div>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px] w-[95vw]">
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{documentToDelete?.filename}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 p-3 sm:p-4 bg-destructive/10 rounded-lg">
            <Trash2 className="h-5 w-5 text-destructive" />
            <p className="text-xs sm:text-sm text-destructive">
              This will permanently delete the document and remove it from your vault.
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 flex-col sm:flex-row">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => {
                setDeleteDialogOpen(false);
                setDocumentToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="w-full sm:w-auto"
              onClick={confirmDelete}
            >
              Delete Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-[425px] w-[95vw]">
          <DialogHeader>
            <DialogTitle>Share Document</DialogTitle>
            <DialogDescription>
              Share "{documentToShare?.filename}" with your connections
            </DialogDescription>
          </DialogHeader>
          <div className="py-3 sm:py-4">
            <ScrollArea className="h-[250px] sm:h-[300px] pr-4">
              <div className="space-y-3 sm:space-y-4">
                {connections.map((connection) => (
                  <div key={connection.id} className="flex items-center space-x-3 sm:space-x-4">
                    <Checkbox
                      id={`connection-${connection.id}`}
                      checked={selectedConnections.includes(connection.id)}
                      onCheckedChange={(checked) => {
                        setSelectedConnections(prev =>
                          checked
                            ? [...prev, connection.id]
                            : prev.filter(id => id !== connection.id)
                        );
                      }}
                    />
                    <label
                      htmlFor={`connection-${connection.id}`}
                      className="flex items-center space-x-2 sm:space-x-3 cursor-pointer flex-1"
                    >
                      <Avatar className="h-6 w-6 sm:h-8 sm:w-8">
                        <AvatarImage src={connection.avatar_url || undefined} />
                        <AvatarFallback>
                          {connection.full_name?.charAt(0) || connection.username.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-none truncate">
                          {connection.full_name || connection.username}
                        </p>
                        {connection.professional_role && (
                          <p className="text-xs sm:text-sm text-muted-foreground truncate">
                            {connection.professional_role}
                          </p>
                        )}
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => {
                setShareDialogOpen(false);
                setDocumentToShare(null);
                setSelectedConnections([]);
              }}
            >
              Cancel
            </Button>
            <Button
              className="w-full sm:w-auto"
              onClick={confirmShare}
              disabled={selectedConnections.length === 0 || sharing}
            >
              {sharing ? 'Sharing...' : 'Share Document'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {signatureRequestDialogOpen && documentForSignature && (
        <SignatureRequestDialog
          open={signatureRequestDialogOpen}
          onOpenChange={setSignatureRequestDialogOpen}
          document={{
            id: documentForSignature.id,
            filename: documentForSignature.filename,
            filepath: documentForSignature.filepath,
            description: documentForSignature.description ?? null,
          }}
          onRequestCreated={() => {
            setSignatureRequestDialogOpen(false);
            setDocumentForSignature(null);
            refreshRequests();
          }}
        />
      )}
    </div>
  );
}
 