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
  Users, // For shared documents
  HardDrive,
  Settings
} from 'lucide-react';

export default function MyVaultPage() {
  const supabase = createClientComponentClient<any>();
  // Types for documents and activities
  type VaultDocument = {
    id: string;
    owner_id: string;
    filename: string;
    filepath: string;
    description?: string;
    is_encrypted?: boolean;
    created_at?: string;
    type?: string;
  };
  type SharedDocument = VaultDocument;
  type Activity = any;
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>('personal-documents');
  const [addDocumentDialogOpen, setAddDocumentDialogOpen] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [personalDocuments, setPersonalDocuments] = useState<VaultDocument[]>([]);
  const [sharedDocuments, setSharedDocuments] = useState<SharedDocument[]>([]);
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
      const { data, error } = await supabase
        .from('vault_shares')
        .select('*, vault_documents(*)')
        .eq('shared_with_id', user.id)
        .order('shared_at', { ascending: false });
      if (error) toast.error('Failed to fetch shared documents');
      else setSharedDocuments((data || []).map((row: any) => row.vault_documents));
    };
    fetchShared();
  }, [user]);

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
    console.log('user:', user, 'file:', form.file);
    const fileExt = form.file.name.split('.').pop();
    const filePath = `${user.id}/${Date.now()}_${form.file.name}`;
    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('vault')
      .upload(filePath, form.file, { upsert: false });
    if (uploadError) {
      toast.error('Upload failed');
      setUploading(false);
      return;
    }
    // Insert metadata
    const { error: insertError } = await supabase
      .from('vault_documents')
      .insert({
        owner_id: user.id,
        filename: form.name,
        filepath: filePath,
        description: form.description,
        is_encrypted: true,
        type: form.type,
      });
    if (insertError) {
      toast.error('Failed to save document metadata');
      setUploading(false);
      return;
    }
    toast.success('Document uploaded!');
    setAddDocumentDialogOpen(false);
    setForm({ name: '', type: '', description: '', tags: '', file: null });
    if (fileRef.current) fileRef.current.value = '';
    // Refresh list
    const { data } = await supabase
      .from('vault_documents')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });
    setPersonalDocuments(data || []);
    setUploading(false);
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
    if (!window.confirm('Delete this document?')) return;
    // Remove from storage
    await supabase.storage.from('vault').remove([doc.filepath]);
    // Remove from DB
    await supabase.from('vault_documents').delete().eq('id', doc.id);
    setPersonalDocuments((docs) => docs.filter((d) => d.id !== doc.id));
    toast.success('Document deleted');
  };

  // Share document
  const handleShare = async (doc: VaultDocument) => {
    const email = prompt('Enter email of user to share with:');
    if (!email) return;
    // Find user by email
    const { data: profiles, error } = await supabase.from('profiles').select('id').eq('username', email);
    if (error || !profiles || profiles.length === 0) {
      toast.error('User not found');
      return;
    }
    const shared_with_id = profiles[0].id;
    // Insert into vault_shares
    const { error: shareError } = await supabase.from('vault_shares').insert({
      document_id: doc.id,
      shared_with_id,
    });
    if (shareError) {
      toast.error('Failed to share document');
      return;
    }
    toast.success('Document shared!');
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
                        <FileText className="h-5 w-5 text-blue-500" /> {doc.filename}
                      </TableCell>
                      <TableCell><Badge variant="outline">{doc.type || 'N/A'}</Badge></TableCell>
                      <TableCell>{new Date(doc.created_at).toLocaleString()}</TableCell>
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>NAME</TableHead>
                    <TableHead>SHARED BY</TableHead>
                    <TableHead>SHARED DATE</TableHead>
                    <TableHead className="text-right">ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sharedDocuments.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium flex items-center gap-2">
                        <FileText className="h-5 w-5 text-orange-500" /> {doc.filename}
                      </TableCell>
                      <TableCell className="flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" /> {doc.owner_id}</TableCell>
                      <TableCell>{doc.created_at ? new Date(doc.created_at).toLocaleString() : ''}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <EllipsisVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="gap-2" onClick={() => handleDownload(doc)}><Download className="h-4 w-4" /> Download</DropdownMenuItem>
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
    </div>
  );
}
 