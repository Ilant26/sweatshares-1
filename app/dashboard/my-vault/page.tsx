'use client';

import { useState } from 'react';
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
  const [activeTab, setActiveTab] = useState('personal-documents');
  const [addDocumentDialogOpen, setAddDocumentDialogOpen] = useState(false);

  const recentDocuments = [
    {
      id: 'd1',
      name: 'Contract_Partner_A_Revised.docx',
      type: 'Legal',
      added: 'May 20, 2025 - 1:23 PM',
      icon: <FileBadge className="h-5 w-5 text-green-500" />,
    },
    {
      id: 'd2',
      name: 'Budget_Forecast_2025.xlsx',
      type: 'Finance',
      added: 'May 20, 2025 - 9:56 AM',
      icon: <FileStack className="h-5 w-5 text-blue-500" />,
    },
    {
      id: 'd3',
      name: 'Status_SweatShares_SAS.pdf',
      type: 'Legal',
      added: 'May 20, 2025 - 3:11 PM',
      icon: <FileBadge className="h-5 w-5 text-green-500" />,
    },
    {
      id: 'd4',
      name: 'Hosting_Invoice_March.pdf',
      type: 'Invoice',
      added: 'May 20, 2025 - 8:30 AM',
      icon: <FileHeart className="h-5 w-5 text-purple-500" />,
    },
  ];

  const sharedDocuments = [
    {
      id: 's1',
      name: 'Presentation_Investors.pptx',
      sharedBy: 'Thomas Moreau',
      sharedDate: 'May 27, 2025, 10:15 AM',
      icon: <FileText className="h-5 w-5 text-orange-500" />,
    },
    {
      id: 's2',
      name: 'Analysis_Finance_Q2.xlsx',
      sharedBy: 'Amina Benali',
      sharedDate: 'May 26, 2025, 14:32 PM',
      icon: <FileStack className="h-5 w-5 text-blue-500" />,
    },
  ];

  const recentActivities = [
    {
      id: 'a1',
      action: 'Added',
      document: 'Contract_Partner_A_Revised.docx',
      user: 'Thomas Moreau',
      date: 'May 28, 2025, 14:32',
      ipAddress: '192.168.1.45',
    },
    {
      id: 'a2',
      action: 'Shared',
      document: 'Presentation_Investors.pptx',
      user: 'Thomas Moreau',
      date: 'May 27, 2025, 10:15',
      ipAddress: '192.168.1.45',
    },
    {
      id: 'a3',
      action: 'Consulted',
      document: 'Budget_Forecast_2025.xlsx',
      user: 'Philippe Laurent',
      date: 'May 26, 2025, 16:45',
      ipAddress: '78.235.32.91',
    },
    {
      id: 'a4',
      action: 'Deleted',
      document: 'Old_Contract_B.pdf',
      user: 'Thomas Moreau',
      date: 'May 25, 2025, 09:12',
      ipAddress: '192.168.1.45',
    },
  ];

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
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="documentName" className="text-right">
                    Document Name
                  </Label>
                  <Input id="documentName" placeholder="e.g., Annual Report 2024" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="documentType" className="text-right">
                    Document Type
                  </Label>
                  <Select>
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
                  <Textarea id="description" placeholder="Brief description of the document" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="tags" className="text-right">
                    Tags
                  </Label>
                  <Input id="tags" placeholder="Comma separated tags (e.g., finance, legal)" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="file" className="text-right">
                    File
                  </Label>
                  <Input id="file" type="file" className="col-span-3" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Upload Document</Button>
              </DialogFooter>
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
                  {recentDocuments.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium flex items-center gap-2">
                        {doc.icon} {doc.name}
                      </TableCell>
                      <TableCell><Badge variant="outline">{doc.type}</Badge></TableCell>
                      <TableCell>{doc.added}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <EllipsisVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="gap-2"><Eye className="h-4 w-4" /> View</DropdownMenuItem>
                            <DropdownMenuItem className="gap-2"><Download className="h-4 w-4" /> Download</DropdownMenuItem>
                            <DropdownMenuItem className="gap-2"><Share2 className="h-4 w-4" /> Share</DropdownMenuItem>
                            <DropdownMenuItem className="gap-2"><Copy className="h-4 w-4" /> Duplicate</DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 text-red-600"><Trash2 className="h-4 w-4" /> Delete</DropdownMenuItem>
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
                        {doc.icon} {doc.name}
                      </TableCell>
                      <TableCell className="flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" /> {doc.sharedBy}</TableCell>
                      <TableCell>{doc.sharedDate}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <EllipsisVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="gap-2"><Eye className="h-4 w-4" /> View</DropdownMenuItem>
                            <DropdownMenuItem className="gap-2"><Download className="h-4 w-4" /> Download</DropdownMenuItem>
                            <DropdownMenuItem className="gap-2"><Copy className="h-4 w-4" /> Duplicate</DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 text-red-600"><Trash2 className="h-4 w-4" /> Delete</DropdownMenuItem>
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
 