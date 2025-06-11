'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

import {
  Search,
  SlidersHorizontal,
  FileText,
  Download,
  Copy,
  Eye,
  Plus,
  CalendarIcon,
  CircleDollarSign,
  FileQuestion,
  Hourglass,
  ReceiptText,
  TrendingUp,
  Clock,
  Euro,
  CheckCircle,
  XCircle,
  ChevronDown,
  EllipsisVertical,
  Trash2,
} from 'lucide-react';

export default function MyInvoicesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const invoicesPerPage = 5;
  const [newInvoiceDialogOpen, setNewInvoiceDialogOpen] = useState(false);
  const [invoiceDate, setInvoiceDate] = useState<Date | undefined>(undefined);
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [activeTab, setActiveTab] = useState('sent');
  const [filterStatus, setFilterStatus] = useState('All');

  const networkContacts = [
    { id: 'c1', name: 'Antoine Dubois' },
    { id: 'c2', name: 'Sophie Martin' },
    { id: 'c3', name: 'Lucas Bernard' },
    { id: 'c4', name: 'Emma Petit' },
    { id: 'c5', name: 'Marketing Solutions' },
    { id: 'c6', name: 'Design Studio' },
  ];

  const sentInvoices = [
    {
      id: 'inv001',
      invoiceNumber: 'FACT-2025-042',
      client: 'Antoine Dubois',
      issueDate: 'May 14, 2025',
      dueDate: 'Jun 14, 2025',
      amount: '3,500.00',
      status: 'Paid',
    },
    {
      id: 'inv002',
      invoiceNumber: 'FACT-2025-041',
      client: 'Sophie Martin',
      issueDate: 'May 09, 2025',
      dueDate: 'Jun 09, 2025',
      amount: '2,750.00',
      status: 'Pending',
    },
    {
      id: 'inv003',
      invoiceNumber: 'FACT-2025-040',
      client: 'Lucas Bernard',
      issueDate: 'May 28, 2025',
      dueDate: 'Jun 28, 2025',
      amount: '1,650.00',
      status: 'Cancelled',
    },
    {
      id: 'inv004',
      invoiceNumber: 'FACT-2025-039',
      client: 'Emma Petit',
      issueDate: 'May 20, 2025',
      dueDate: 'Jun 20, 2025',
      amount: '4,000.00',
      status: 'Paid',
    },
    {
      id: 'inv005',
      invoiceNumber: 'FACT-2025-038',
      client: 'Antoine Dubois',
      issueDate: 'May 15, 2025',
      dueDate: 'Jun 15, 2025',
      amount: '3,500.00',
      status: 'Paid',
    },
  ];

  const receivedInvoices = [
    {
      id: 'recv001',
      invoiceNumber: 'REC-2025-001',
      client: 'Marketing Solutions',
      issueDate: 'May 10, 2025',
      dueDate: 'Jun 10, 2025',
      amount: '1,200.00',
      status: 'Paid',
    },
    {
      id: 'recv002',
      invoiceNumber: 'REC-2025-002',
      client: 'Design Studio',
      issueDate: 'May 05, 2025',
      dueDate: 'Jun 05, 2025',
      amount: '800.00',
      status: 'Pending',
    },
  ];

  const invoiceTemplates = [
    {
      id: 't1',
      icon: <FileText className="h-8 w-8 text-blue-500" />,
      title: 'Standard Invoice',
      description: 'Basic template for regular billing',
      lastUsed: '2 days ago',
    },
    {
      id: 't2',
      icon: <Clock className="h-8 w-8 text-green-500" />,
      title: 'Hourly Rate',
      description: 'Template for time-based services',
      lastUsed: '1 week ago',
    },
    {
      id: 't3',
      icon: <ReceiptText className="h-8 w-8 text-orange-500" />,
      title: 'Project Milestone',
      description: 'Template for project phases',
      lastUsed: '2 weeks ago',
    },
    {
      id: 't4',
      icon: <TrendingUp className="h-8 w-8 text-purple-500" />,
      title: 'Subscription',
      description: 'Template for recurring billing',
      lastUsed: '1 month ago',
    },
  ];

  const financialSummary = {
    totalSent: '15,800.00',
    paid: '7,000.00',
    pending: '2,750.00',
    cancelled: '6,050.00',
    averageTime: '18 days',
  };

  const recentActivities = [
    {
      id: 'ra1',
      action: 'paid',
      user: 'Antoine Dubois',
      document: 'invoice FACT-2025-042',
      amount: '3,500.00',
      currency: '€',
      time: '2 days ago',
    },
    {
      id: 'ra2',
      action: 'created',
      user: 'You',
      document: 'new invoice FACT-2025-041',
      client: 'Sophie Martin',
      amount: '2,750.00',
      currency: '€',
      time: '3 days ago',
    },
    {
      id: 'ra3',
      action: 'cancelled',
      document: 'Invoice FACT-2025-040',
      client: 'Lucas Bernard',
      time: '5 days ago',
    },
    {
      id: 'ra4',
      action: 'reminder sent',
      document: 'invoice FACT-2025-039',
      client: 'Emma Petit',
      time: '1 week ago',
    },
  ];

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Paid':
        return 'success';
      case 'Pending':
        return 'warning';
      case 'Overdue':
        return 'destructive';
      case 'Cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const invoicesToDisplay = activeTab === 'sent' ? sentInvoices : receivedInvoices;

  const filteredInvoices = invoicesToDisplay.filter(invoice => {
    const matchesSearch = searchTerm === '' ||
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.client.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || invoice.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Pagination logic
  const indexOfLastInvoice = currentPage * invoicesPerPage;
  const indexOfFirstInvoice = indexOfLastInvoice - invoicesPerPage;
  const currentInvoices = filteredInvoices.slice(indexOfFirstInvoice, indexOfLastInvoice);
  const totalPages = Math.ceil(filteredInvoices.length / invoicesPerPage);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Invoice Management</h2>
        <div className="flex items-center space-x-2">
          <Dialog open={newInvoiceDialogOpen} onOpenChange={setNewInvoiceDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> New Invoice
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[350px] md:max-w-[600px] max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Invoice</DialogTitle>
                <DialogDescription>
                  Fill in the details to create a new invoice.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="clientName">Client Name</Label>
                    <Select>
                      <SelectTrigger id="clientName">
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                      <SelectContent>
                        {networkContacts.map((contact) => (
                          <SelectItem key={contact.id} value={contact.name}>
                            {contact.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invoiceNumber">Invoice Number</Label>
                    <Input id="invoiceNumber" placeholder="e.g., INV-2025-001" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="issueDate">Issue Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !invoiceDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {invoiceDate ? format(invoiceDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={invoiceDate}
                          onSelect={setInvoiceDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !dueDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dueDate}
                          onSelect={setDueDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input id="amount" placeholder="e.g., 1200.00" type="number" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Paid">Paid</SelectItem>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Overdue">Overdue</SelectItem>
                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" placeholder="Brief description of the invoice" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lineItems">Line Items</Label>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                    <Input placeholder="Description" />
                    <Input type="number" placeholder="Quantity" />
                    <Input type="number" placeholder="Price" />
                    <Input type="number" placeholder="Total" readOnly />
                  </div>
                  <Button variant="outline" size="sm" className="mt-2">Add Line Item</Button>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" placeholder="Any additional notes" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Save Invoice</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="text-muted-foreground text-sm">View, manage and track all your invoices</div>

      <Tabs defaultValue="sent" onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-fit grid-cols-2">
          <TabsTrigger value="sent">Sent Invoices ({sentInvoices.length})</TabsTrigger>
          <TabsTrigger value="received">Received Invoices ({receivedInvoices.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="sent" className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search invoices..."
                className="pl-8 max-w-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  Period <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Last 30 Days</DropdownMenuItem>
                <DropdownMenuItem>Last 3 Months</DropdownMenuItem>
                <DropdownMenuItem>Last 6 Months</DropdownMenuItem>
                <DropdownMenuItem>Last Year</DropdownMenuItem>
                <DropdownMenuItem>All Time</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  Status: {filterStatus} <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setFilterStatus('All')}>All</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus('Paid')}>Paid</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus('Pending')}>Pending</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus('Cancelled')}>Cancelled</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus('Overdue')}>Overdue</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  Sort by <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Date (newest)</DropdownMenuItem>
                <DropdownMenuItem>Date (oldest)</DropdownMenuItem>
                <DropdownMenuItem>Amount (asc)</DropdownMenuItem>
                <DropdownMenuItem>Amount (desc)</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">INVOICE NUMBER</TableHead>
                  <TableHead>CLIENT</TableHead>
                  <TableHead>ISSUE DATE</TableHead>
                  <TableHead>DUE DATE</TableHead>
                  <TableHead>AMOUNT</TableHead>
                  <TableHead>STATUS</TableHead>
                  <TableHead className="text-right">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      {invoice.invoiceNumber}
                    </TableCell>
                    <TableCell>{invoice.client}</TableCell>
                    <TableCell>{invoice.issueDate}</TableCell>
                    <TableCell>{invoice.dueDate}</TableCell>
                    <TableCell className="font-medium">€{invoice.amount}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(invoice.status)}>{invoice.status}</Badge>
                    </TableCell>
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
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {indexOfFirstInvoice + 1}-{Math.min(indexOfLastInvoice, filteredInvoices.length)} of {filteredInvoices.length} invoices.
            </p>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious href="#" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} />
                </PaginationItem>
                {[...Array(totalPages)].map((_, index) => (
                  <PaginationItem key={index}>
                    <PaginationLink href="#" isActive={currentPage === index + 1} onClick={() => setCurrentPage(index + 1)}>
                      {index + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext href="#" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </TabsContent>
        <TabsContent value="received" className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search received invoices..."
                className="pl-8 max-w-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  Period <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Last 30 Days</DropdownMenuItem>
                <DropdownMenuItem>Last 3 Months</DropdownMenuItem>
                <DropdownMenuItem>Last 6 Months</DropdownMenuItem>
                <DropdownMenuItem>Last Year</DropdownMenuItem>
                <DropdownMenuItem>All Time</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  Status: {filterStatus} <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setFilterStatus('All')}>All</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus('Paid')}>Paid</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus('Pending')}>Pending</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus('Cancelled')}>Cancelled</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus('Overdue')}>Overdue</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  Sort by <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Date (newest)</DropdownMenuItem>
                <DropdownMenuItem>Date (oldest)</DropdownMenuItem>
                <DropdownMenuItem>Amount (asc)</DropdownMenuItem>
                <DropdownMenuItem>Amount (desc)</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">INVOICE NUMBER</TableHead>
                  <TableHead>CLIENT</TableHead>
                  <TableHead>ISSUE DATE</TableHead>
                  <TableHead>DUE DATE</TableHead>
                  <TableHead>AMOUNT</TableHead>
                  <TableHead>STATUS</TableHead>
                  <TableHead className="text-right">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      {invoice.invoiceNumber}
                    </TableCell>
                    <TableCell>{invoice.client}</TableCell>
                    <TableCell>{invoice.issueDate}</TableCell>
                    <TableCell>{invoice.dueDate}</TableCell>
                    <TableCell className="font-medium">€{invoice.amount}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(invoice.status)}>{invoice.status}</Badge>
                    </TableCell>
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
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {indexOfFirstInvoice + 1}-{Math.min(indexOfLastInvoice, filteredInvoices.length)} of {filteredInvoices.length} invoices.
            </p>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious href="#" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} />
                </PaginationItem>
                {[...Array(totalPages)].map((_, index) => (
                  <PaginationItem key={index}>
                    <PaginationLink href="#" isActive={currentPage === index + 1} onClick={() => setCurrentPage(index + 1)}>
                      {index + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext href="#" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </TabsContent>
      </Tabs>

      <h3 className="text-xl font-semibold mb-4">Invoice Templates</h3>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {invoiceTemplates.map((template) => (
          <Card key={template.id}>
            <CardHeader className="flex-col items-start gap-2">
              <div className="rounded-full bg-muted p-3">
                {template.icon}
              </div>
              <CardTitle className="text-lg">{template.title}</CardTitle>
              <CardDescription className="text-sm">{template.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between pt-2 text-sm text-muted-foreground">
              <span>Last used: {template.lastUsed}</span>
              <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
            </CardContent>
          </Card>
        ))}
        <Card className="flex items-center justify-center border-2 border-dashed h-full">
          <Button variant="ghost" className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Create Template
          </Button>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <h3 className="text-xl font-semibold mb-4">Financial Summary</h3>
          <Card>
            <CardContent className="grid grid-cols-2 gap-4 pt-6">
              <div className="flex flex-col items-start justify-between p-4 border rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Total Sent</p>
                  <p className="text-2xl text-green-500">€{financialSummary.totalSent}</p>
                </div>
                <CircleDollarSign className="h-8 w-8 text-green-500 mt-2" />
              </div>
              <div className="flex flex-col items-start justify-between p-4 border rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Paid</p>
                  <p className="text-2xl text-green-500">€{financialSummary.paid}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500 mt-2" />
              </div>
              <div className="flex flex-col items-start justify-between p-4 border rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl text-yellow-500">€{financialSummary.pending}</p>
                </div>
                <Hourglass className="h-8 w-8 text-yellow-500 mt-2" />
              </div>
              <div className="flex flex-col items-start justify-between p-4 border rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Cancelled</p>
                  <p className="text-2xl text-red-500">€{financialSummary.cancelled}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-500 mt-2" />
              </div>
              <div className="col-span-2 text-center p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Average Time to Pay</p>
                <p className="text-2xl">{financialSummary.averageTime}</p>
              </div>
            </CardContent>
          </Card>
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>
          <Card>
            <CardContent className="space-y-4 pt-6">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4 p-4 border rounded-lg">
                  <div className="rounded-full bg-muted p-2">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-base text-foreground">
                      {activity.action === 'paid' && (
                        <>
                          <span className="font-semibold">{activity.user}</span> paid <span className="font-semibold">{activity.document}</span> for an amount of <span className="font-semibold">{activity.currency}{activity.amount}</span>
                        </>
                      )}
                      {activity.action === 'created' && (
                        <>
                          <span className="font-semibold">{activity.user}</span> {activity.action} <span className="font-semibold">{activity.document}</span> for <span className="font-semibold">{activity.client}</span> for an amount of <span className="font-semibold">{activity.currency}{activity.amount}</span>
                        </>
                      )}
                      {activity.action === 'cancelled' && (
                        <>
                          <span className="font-semibold">{activity.document}</span> for <span className="font-semibold">{activity.client}</span> has been {activity.action}
                        </>
                      )}
                      {activity.action === 'reminder sent' && (
                        <>
                          Automatic {activity.action} for <span className="font-semibold">{activity.document}</span> to <span className="font-semibold">{activity.client}</span>
                        </>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
 