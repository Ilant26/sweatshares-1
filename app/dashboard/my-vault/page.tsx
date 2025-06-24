'use client';

import { useState, useEffect, useRef } from 'react';
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
import { EllipsisVertical } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'sonner';
import type { Database } from '@/lib/database.types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

import {
  Lock,
  History,
  ShieldCheck,
  Plus,
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
  shared_with_id?: string;
  shared_at?: string;
  shared_by?: UserProfile;
  shared_with?: UserProfile;
}

export default function MyVaultPage() {
  const supabase = createClientComponentClient<Database>();
  // Types for documents and activities
  type SharedDocument = VaultDocument;
  type Activity = any;
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>('personal-documents');
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
  const [connections, setConnections] = useState<any[]>([]);
  const [selectedConnections, setSelectedConnections] = useState<string[]>([]);
  const [sharing, setSharing] = useState<boolean>(false);

  // Fetch user on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

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
    if (!form.file || !form.name || !user) {
      toast.error('Please fill all required fields');
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
      if (fileRef.current) fileRef.current.value = '';

      // Refresh list
      const { data: newDocs } = await supabase
        .from('vault_documents')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });
      
      setPersonalDocuments(newDocs || []);
    } catch (error) {
      toast.error('An unexpected error occurred during upload');
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

  return (
    <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">My Vault</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" className="gap-2 w-full sm:w-auto">
            <History className="h-4 w-4" /> Access History
          </Button>
          <Button variant="outline" className="gap-2 w-full sm:w-auto">
            <ShieldCheck className="h-4 w-4" /> Security Settings
          </Button>
          <Dialog open={addDocumentDialogOpen} onOpenChange={setAddDocumentDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Add Document
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>Upload Files</DialogTitle>
                <DialogDescription>
                  Drag and drop files here or click to select files
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleUpload}>
                <div className="space-y-4">
                  <div
                    className="relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/50 transition-colors"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        setFileInput(e.dataTransfer.files[0]);
                        setForm({ ...form, name: e.dataTransfer.files[0].name });
                      }
                    }}
                  >
                    <UploadCloud className="w-10 h-10 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      <span className="font-semibold text-primary">Upload a file</span> or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 10MB</p>
                    <input
                      id="file-upload"
                      type="file"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setFileInput(e.target.files[0]);
                          setForm({ ...form, name: e.target.files[0].name });
                        }
                      }}
                    />
                  </div>
                  {fileInput && (
                    <div className="text-sm text-center">Selected file: {fileInput.name}</div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="name">Document Name</Label>
                    <Input id="name" value={form.name} onChange={handleFormChange} placeholder="e.g., Q4 Financial Report" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Document Type</Label>
                    <Select onValueChange={(value) => setForm(f => ({ ...f, type: value }))} value={form.type}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select document type" />
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
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" value={form.description} onChange={handleFormChange} placeholder="Add a short description..." />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags</Label>
                    <Input id="tags" value={form.tags} onChange={handleFormChange} placeholder="e.g., finance, q4, confidential" />
                  </div>
                </div>
                <DialogFooter className="mt-6">
                  <Button type="button" variant="outline" onClick={() => setAddDocumentDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={uploading}>
                    {uploading ? 'Uploading...' : 'Upload'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="p-3 sm:p-4">
        <CardTitle className="text-base sm:text-lg">Secure Vault</CardTitle>
        <CardDescription>Your documents are encrypted and protected</CardDescription>
      </Card>

      <Card>
        <CardContent className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-2 p-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              className="pl-8 w-full"
            />
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 w-full sm:w-auto">
                  <SlidersHorizontal className="h-4 w-4" /> Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>All Types</DropdownMenuItem>
                <DropdownMenuItem>Personal Documents</DropdownMenuItem>
                <DropdownMenuItem>Contracts</DropdownMenuItem>
                <DropdownMenuItem>Legal Documents</DropdownMenuItem>
                <DropdownMenuItem>Others</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 w-full sm:w-auto">
                  <SlidersHorizontal className="h-4 w-4" /> Sort by
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Date (newest)</DropdownMenuItem>
                <DropdownMenuItem>Date (oldest)</DropdownMenuItem>
                <DropdownMenuItem>Size (asc)</DropdownMenuItem>
                <DropdownMenuItem>Size (desc)</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="personal-documents" value={activeTab} onValueChange={setActiveTab} className="space-y-4 w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="personal-documents" className="text-xs sm:text-sm">Personal Documents</TabsTrigger>
          <TabsTrigger value="shared-documents" className="text-xs sm:text-sm">Shared Documents</TabsTrigger>
          <TabsTrigger value="recent-activities" className="text-xs sm:text-sm">Recent Activities</TabsTrigger>
        </TabsList>
        <TabsContent value="personal-documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>My Documents</CardTitle>
              <CardDescription>All your personal documents securely stored.</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Mobile card layout */}
              <div className="space-y-4 sm:hidden">
                {personalDocuments.map((doc) => (
                  <Card key={doc.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          {getFileIcon(doc.filename)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{doc.filename}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">{doc.type || 'N/A'}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
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
                  </Card>
                ))}
              </div>
              
              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>NAME</TableHead>
                      <TableHead>TYPE</TableHead>
                      <TableHead>ADDED</TableHead>
                      <TableHead className="text-right">ACTIONS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {personalDocuments.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium flex items-center gap-2">
                          {getFileIcon(doc.filename)} {doc.filename}
                        </TableCell>
                        <TableCell><Badge variant="outline">{doc.type || 'N/A'}</Badge></TableCell>
                        <TableCell>{doc.created_at ? new Date(doc.created_at).toLocaleString() : 'N/A'}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <EllipsisVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem className="gap-2" onClick={() => handleDownload(doc)}><Download className="h-4 w-4" /> Download</DropdownMenuItem>
                              <DropdownMenuItem className="gap-2" onClick={() => handleShare(doc)}><Share2 className="h-4 w-4" /> Share</DropdownMenuItem>
                              <DropdownMenuItem className="gap-2 text-red-600" onClick={() => handleDelete(doc)}><Trash2 className="h-4 w-4" /> Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="shared-documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Shared Documents</CardTitle>
              <CardDescription>Documents shared with you or that you have shared.</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="shared-with-me" value={sharedTab} onValueChange={setSharedTab} className="w-full space-y-4">
                <TabsList className="grid w-full grid-cols-2 h-auto">
                  <TabsTrigger value="shared-with-me" className="text-xs sm:text-sm py-2">Shared with Me</TabsTrigger>
                  <TabsTrigger value="shared-by-me" className="text-xs sm:text-sm py-2">Shared by Me</TabsTrigger>
                </TabsList>
                <TabsContent value="shared-with-me" className="mt-4">
                  {sharedWithMe.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold">No documents shared with you</h3>
                      <p className="text-sm text-muted-foreground mt-2">
                        When someone shares a document with you, it will appear here.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Mobile card layout */}
                      <div className="space-y-4 sm:hidden">
                        {sharedWithMe.map((doc) => (
                          <Card key={doc.id} className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="flex-shrink-0">
                                  {getFileIcon(doc.filename)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{doc.filename}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-xs">{doc.type || 'N/A'}</Badge>
                                    <div className="flex items-center gap-1">
                                      <Avatar className="h-4 w-4">
                                        <AvatarImage src={doc.shared_by?.avatar_url || undefined} />
                                        <AvatarFallback className="text-xs">{doc.shared_by?.full_name?.charAt(0)}</AvatarFallback>
                                      </Avatar>
                                      <span className="text-xs text-muted-foreground truncate">
                                        {doc.shared_by?.full_name || 'Unknown User'}
                                      </span>
                                    </div>
                                  </div>
                                  <span className="text-xs text-muted-foreground block mt-1">
                                    {doc.shared_at ? new Date(doc.shared_at).toLocaleDateString() : 'N/A'}
                                  </span>
                                </div>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <EllipsisVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem className="gap-2" onClick={() => handleDownload(doc)}>
                                    <Download className="h-4 w-4" /> Download
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </Card>
                        ))}
                      </div>
                      
                      {/* Desktop table */}
                      <div className="hidden sm:block overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>NAME</TableHead>
                              <TableHead>TYPE</TableHead>
                              <TableHead>SHARED BY</TableHead>
                              <TableHead>SHARED DATE</TableHead>
                              <TableHead className="text-right">ACTIONS</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {sharedWithMe.map((doc) => (
                              <TableRow key={doc.id}>
                                <TableCell className="font-medium flex items-center gap-2">
                                  {getFileIcon(doc.filename)} {doc.filename}
                                </TableCell>
                                <TableCell><Badge variant="outline">{doc.type || 'N/A'}</Badge></TableCell>
                                <TableCell className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6">
                                    <AvatarImage src={doc.shared_by?.avatar_url || undefined} />
                                    <AvatarFallback>{doc.shared_by?.full_name?.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  {doc.shared_by?.full_name || 'Unknown User'}
                                </TableCell>
                                <TableCell>{doc.shared_at ? new Date(doc.shared_at).toLocaleString() : 'N/A'}</TableCell>
                                <TableCell className="text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon">
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
                    </>
                  )}
                </TabsContent>
                <TabsContent value="shared-by-me" className="mt-4">
                  {sharedByMe.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Share2 className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold">No documents shared by you</h3>
                      <p className="text-sm text-muted-foreground mt-2">
                        Documents you share with others will appear here.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Mobile card layout */}
                      <div className="space-y-4 sm:hidden">
                        {sharedByMe.map((doc) => (
                          <Card key={doc.id} className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="flex-shrink-0">
                                  {getFileIcon(doc.filename)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{doc.filename}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-xs">{doc.type || 'N/A'}</Badge>
                                    <div className="flex items-center gap-1">
                                      <Avatar className="h-4 w-4">
                                        <AvatarImage src={doc.shared_with?.avatar_url || undefined} />
                                        <AvatarFallback className="text-xs">{doc.shared_with?.full_name?.charAt(0)}</AvatarFallback>
                                      </Avatar>
                                      <span className="text-xs text-muted-foreground truncate">
                                        {doc.shared_with?.full_name || 'Unknown User'}
                                      </span>
                                    </div>
                                  </div>
                                  <span className="text-xs text-muted-foreground block mt-1">
                                    {doc.shared_at ? new Date(doc.shared_at).toLocaleDateString() : 'N/A'}
                                  </span>
                                </div>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <EllipsisVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem className="gap-2" onClick={() => handleDownload(doc)}>
                                    <Download className="h-4 w-4" /> Download
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="gap-2" onClick={() => handleShare(doc)}>
                                    <Share2 className="h-4 w-4" /> Share Again
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </Card>
                        ))}
                      </div>
                      
                      {/* Desktop table */}
                      <div className="hidden sm:block overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>NAME</TableHead>
                              <TableHead>TYPE</TableHead>
                              <TableHead>SHARED WITH</TableHead>
                              <TableHead>SHARED DATE</TableHead>
                              <TableHead className="text-right">ACTIONS</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {sharedByMe.map((doc) => (
                              <TableRow key={doc.id}>
                                <TableCell className="font-medium flex items-center gap-2">
                                  {getFileIcon(doc.filename)} {doc.filename}
                                </TableCell>
                                <TableCell><Badge variant="outline">{doc.type || 'N/A'}</Badge></TableCell>
                                <TableCell className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6">
                                    <AvatarImage src={doc.shared_with?.avatar_url || undefined} />
                                    <AvatarFallback>{doc.shared_with?.full_name?.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  {doc.shared_with?.full_name || 'Unknown User'}
                                </TableCell>
                                <TableCell>{doc.shared_at ? new Date(doc.shared_at).toLocaleString() : 'N/A'}</TableCell>
                                <TableCell className="text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon">
                                        <EllipsisVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem className="gap-2" onClick={() => handleDownload(doc)}>
                                        <Download className="h-4 w-4" /> Download
                                      </DropdownMenuItem>
                                      <DropdownMenuItem className="gap-2" onClick={() => handleShare(doc)}>
                                        <Share2 className="h-4 w-4" /> Share Again
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="recent-activities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
              <CardDescription>A log of all recent actions performed in your vault.</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Mobile card layout */}
              <div className="space-y-4 sm:hidden">
                {recentActivities.map((activity) => (
                  <Card key={activity.id} className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{activity.action}</span>
                        <span className="text-xs text-muted-foreground">{activity.date}</span>
                      </div>
                      <div className="text-sm">
                        <p className="font-medium">{activity.document}</p>
                        <p className="text-muted-foreground">{activity.user}</p>
                        <p className="text-xs text-muted-foreground">IP: {activity.ipAddress}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
              
              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ACTION</TableHead>
                      <TableHead>DOCUMENT</TableHead>
                      <TableHead>USER</TableHead>
                      <TableHead>DATE</TableHead>
                      <TableHead className="text-right">IP ADDRESS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentActivities.map((activity) => (
                      <TableRow key={activity.id}>
                        <TableCell>{activity.action}</TableCell>
                        <TableCell className="font-medium">{activity.document}</TableCell>
                        <TableCell>{activity.user}</TableCell>
                        <TableCell>{activity.date}</TableCell>
                        <TableCell className="text-right">{activity.ipAddress}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Storage Usage</CardTitle>
          <CardDescription>Your current storage usage and available space.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-4 sm:p-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <HardDrive className="h-8 w-8 text-blue-500" />
            <div className="flex-1">
              <div className="flex justify-between text-xs sm:text-sm">
                <span>Used: 1.5 GB</span>
                <span>Total: 10 GB</span>
              </div>
              <Progress value={15} className="w-full" />
            </div>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">You have 8.5 GB remaining.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Security & Access</CardTitle>
          <CardDescription>Manage security settings and access controls for your vault.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-4 sm:p-6">
          <div className="flex items-center justify-between py-2">
            <Label htmlFor="2fa-mode">Two-Factor Authentication</Label>
            <Switch id="2fa-mode" />
          </div>
          <div className="flex items-center justify-between py-2">
            <Label htmlFor="notification-alerts">Email Notifications for Access</Label>
            <Switch id="notification-alerts" defaultChecked />
          </div>
          <div className="flex items-center justify-between py-2">
            <Label htmlFor="auto-lock">Auto-Lock Vault (5 mins inactivity)</Label>
            <Switch id="auto-lock" />
          </div>
        </CardContent>
        <CardFooter className="p-4 sm:p-6">
          <Button className="w-full sm:w-auto"><Settings className="mr-2 h-4 w-4" /> Advanced Security Settings</Button>
        </CardFooter>
      </Card>

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
    </div>
  );
}
 