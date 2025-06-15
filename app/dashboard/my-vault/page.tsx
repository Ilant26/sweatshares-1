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
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">My Vault</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" className="gap-2">
            <History className="h-4 w-4" /> Access History
          </Button>
          <Button variant="outline" className="gap-2">
            <ShieldCheck className="h-4 w-4" /> Security Settings
          </Button>
          <Dialog open={addDocumentDialogOpen} onOpenChange={setAddDocumentDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add Document
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] md:max-w-[700px]">
              <DialogHeader>
                <DialogTitle>Add New Document</DialogTitle>
                <DialogDescription>
                  Upload your document and provide necessary details.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleUpload} className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="documentName" className="text-right">
                    Document Name
                  </Label>
                  <Input id="name" value={form.name} onChange={handleFormChange} placeholder="e.g., Annual Report 2024" className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="documentType" className="text-right">
                    Document Type
                  </Label>
                  <Select value={form.type} onValueChange={(v) => setForm(f => ({ ...f, type: v }))}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="personal">Personal Document</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="legal">Legal Document</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Description
                  </Label>
                  <Textarea id="description" value={form.description} onChange={handleFormChange} placeholder="Brief description of the document" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="tags" className="text-right">
                    Tags
                  </Label>
                  <Input id="tags" value={form.tags} onChange={handleFormChange} placeholder="Comma separated tags (e.g., finance, legal)" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="file" className="text-right">
                    File
                  </Label>
                  <Input id="file" type="file" ref={fileRef} onChange={handleFormChange} className="col-span-3" required />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={uploading}>{uploading ? 'Uploading...' : 'Upload Document'}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="p-4">
        <CardTitle className="text-lg">Secure Vault</CardTitle>
        <CardDescription>Your documents are encrypted and protected</CardDescription>
      </Card>

      <Card>
        <CardContent className="flex items-center gap-2 p-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              className="pl-8 max-w-sm"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
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
              <Button variant="outline" className="gap-2">
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
        </CardContent>
      </Card>

      <Tabs defaultValue="personal-documents" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-fit grid-cols-3">
          <TabsTrigger value="personal-documents">Personal Documents</TabsTrigger>
          <TabsTrigger value="shared-documents">Shared Documents</TabsTrigger>
          <TabsTrigger value="recent-activities">Recent Activities</TabsTrigger>
        </TabsList>
        <TabsContent value="personal-documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>My Documents</CardTitle>
              <CardDescription>All your personal documents securely stored.</CardDescription>
            </CardHeader>
            <CardContent>
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
              <Tabs defaultValue="shared-with-me" value={sharedTab} onValueChange={setSharedTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="shared-with-me">Shared with Me</TabsTrigger>
                  <TabsTrigger value="shared-by-me">Shared by Me</TabsTrigger>
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Storage Usage</CardTitle>
          <CardDescription>Your current storage usage and available space.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <HardDrive className="h-8 w-8 text-blue-500" />
            <div className="flex-1">
              <div className="flex justify-between text-sm">
                <span>Used: 1.5 GB</span>
                <span>Total: 10 GB</span>
              </div>
              <Progress value={15} className="w-full" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">You have 8.5 GB remaining.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security & Access</CardTitle>
          <CardDescription>Manage security settings and access controls for your vault.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="2fa-mode">Two-Factor Authentication</Label>
            <Switch id="2fa-mode" />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="notification-alerts">Email Notifications for Access</Label>
            <Switch id="notification-alerts" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="auto-lock">Auto-Lock Vault (5 mins inactivity)</Label>
            <Switch id="auto-lock" />
          </div>
        </CardContent>
        <CardFooter>
          <Button><Settings className="mr-2 h-4 w-4" /> Advanced Security Settings</Button>
        </CardFooter>
      </Card>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{documentToDelete?.filename}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 p-4 bg-destructive/10 rounded-lg">
            <Trash2 className="h-5 w-5 text-destructive" />
            <p className="text-sm text-destructive">
              This will permanently delete the document and remove it from your vault.
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setDocumentToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
            >
              Delete Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Share Document</DialogTitle>
            <DialogDescription>
              Share "{documentToShare?.filename}" with your connections
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-4">
                {connections.map((connection) => (
                  <div key={connection.id} className="flex items-center space-x-4">
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
                      className="flex items-center space-x-3 cursor-pointer"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={connection.avatar_url || undefined} />
                        <AvatarFallback>
                          {connection.full_name?.charAt(0) || connection.username.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium leading-none">
                          {connection.full_name || connection.username}
                        </p>
                        {connection.professional_role && (
                          <p className="text-sm text-muted-foreground">
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
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShareDialogOpen(false);
                setDocumentToShare(null);
                setSelectedConnections([]);
              }}
            >
              Cancel
            </Button>
            <Button
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
 