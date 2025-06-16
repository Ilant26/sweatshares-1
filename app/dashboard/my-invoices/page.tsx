'use client';

import { useState, useEffect } from 'react';
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
import { downloadInvoicePDF, createInvoice, getInvoices, updateInvoiceStatus, editInvoice, type Invoice, type InvoiceItem } from '@/lib/invoices';
import { useUser } from '@/lib/auth';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/lib/database.types';
import { ExternalClientDialog } from '@/components/external-client-dialog';

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
  Pencil,
  User,
  Building2,
} from 'lucide-react';

export default function MyInvoicesPage() {
  const { user } = useUser();
  const supabase = createClientComponentClient<Database>();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const invoicesPerPage = 5;
  const [newInvoiceDialogOpen, setNewInvoiceDialogOpen] = useState(false);
  const [invoiceDate, setInvoiceDate] = useState<Date | undefined>(undefined);
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [activeTab, setActiveTab] = useState('sent');
  const [filterStatus, setFilterStatus] = useState('All');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [networkContacts, setNetworkContacts] = useState<any[]>([]);
  const [externalClients, setExternalClients] = useState<any[]>([]);
  const [clientType, setClientType] = useState<'network' | 'external'>('network');
  const [newInvoice, setNewInvoice] = useState({
    client: '',
    invoiceNumber: '',
    issueDate: '',
    dueDate: '',
    amount: 0,
    status: 'pending',
    description: '',
    items: [] as InvoiceItem[],
    notes: ''
  });
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

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
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'overdue':
        return 'destructive';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesTab = activeTab === 'sent' ? invoice.sender_id === user?.id : invoice.receiver_id === user?.id;
    const matchesSearch = searchTerm === '' ||
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      networkContacts.find(contact => contact.id === invoice.receiver_id)?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || invoice.status === filterStatus;
    return matchesTab && matchesSearch && matchesStatus;
  });

  // Pagination logic
  const indexOfLastInvoice = currentPage * invoicesPerPage;
  const indexOfFirstInvoice = indexOfLastInvoice - invoicesPerPage;
  const currentInvoices = filteredInvoices.slice(indexOfFirstInvoice, indexOfLastInvoice);
  const totalPages = Math.ceil(filteredInvoices.length / invoicesPerPage);

  // Fetch invoices and contacts
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        // Fetch invoices
        const fetchedInvoices = await getInvoices(user.id);
        setInvoices(fetchedInvoices);

        // Fetch network contacts (connections)
        const { data: connections } = await supabase
          .from('connections')
          .select('*, profiles!connections_receiver_id_fkey(*)')
          .eq('sender_id', user.id)
          .eq('status', 'accepted');

        if (connections) {
          setNetworkContacts(connections.map(conn => ({
            id: conn.profiles.id,
            name: conn.profiles.full_name || conn.profiles.username
          })));
        }

        // Fetch external clients
        const { data: clients } = await supabase
          .from('external_clients')
          .select('*')
          .eq('user_id', user.id);

        if (clients) {
          setExternalClients(clients.map(client => ({
            id: client.id,
            name: client.company_name || client.contact_name
          })));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleCreateInvoice = async () => {
    if (!user || !invoiceDate || !dueDate) return;

    try {
      const invoiceData = {
        invoice_number: newInvoice.invoiceNumber,
        sender_id: user.id,
        receiver_id: clientType === 'network' ? newInvoice.client : undefined,
        external_client_id: clientType === 'external' ? newInvoice.client : undefined,
        issue_date: invoiceDate.toISOString(),
        due_date: dueDate.toISOString(),
        amount: newInvoice.amount,
        status: newInvoice.status as 'pending' | 'paid' | 'cancelled',
        description: newInvoice.description,
        items: newInvoice.items,
        currency: 'EUR'
      };

      const createdInvoice = await createInvoice(invoiceData);
      setInvoices(prev => [createdInvoice, ...prev]);
      setNewInvoiceDialogOpen(false);
      resetNewInvoiceForm();
    } catch (error) {
      console.error('Error creating invoice:', error);
    }
  };

  const resetNewInvoiceForm = () => {
    setNewInvoice({
      client: '',
      invoiceNumber: '',
      issueDate: '',
      dueDate: '',
      amount: 0,
      status: 'pending',
      description: '',
      items: [],
      notes: ''
    });
    setInvoiceDate(undefined);
    setDueDate(undefined);
  };

  const handleAddLineItem = () => {
    setNewInvoice(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, unitPrice: 0, amount: 0 }]
    }));
  };

  const handleLineItemChange = (index: number, field: keyof InvoiceItem, value: string | number) => {
    setNewInvoice(prev => {
      const newItems = [...prev.items];
      const item = newItems[index];
      
      // Update the field
      newItems[index] = {
        ...item,
        [field]: value,
      };

      // Recalculate amount based on quantity and unitPrice
      const quantity = Number(newItems[index].quantity) || 0;
      const unitPrice = Number(newItems[index].unitPrice) || 0;
      newItems[index].amount = Number((quantity * unitPrice).toFixed(2));

      // Calculate total invoice amount
      const totalAmount = newItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

      return {
        ...prev,
        items: newItems,
        amount: Number(totalAmount.toFixed(2))
      };
    });
  };

  const handleDownloadPDF = async (invoice: Invoice) => {
    try {
      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', invoice.sender_id)
        .single();

      let receiverProfile: any = null;

      if (invoice.external_client_id) {
        // Fetch external client
        const { data: externalClient } = await supabase
          .from('external_clients')
          .select('*')
          .eq('id', invoice.external_client_id)
          .single();
        receiverProfile = externalClient;
      } else {
        // Fetch network client profile
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', invoice.receiver_id)
          .single();
        receiverProfile = data;
      }

      if (senderProfile && receiverProfile) {
        downloadInvoicePDF(invoice, senderProfile, receiverProfile);
      }
    } catch (error) {
      console.error('Error downloading invoice:', error);
    }
  };

  const handleStatusChange = async (invoiceId: string, newStatus: 'pending' | 'paid' | 'cancelled') => {
    try {
      const updatedInvoice = await updateInvoiceStatus(invoiceId, newStatus);
      setInvoices(prev => prev.map(inv => inv.id === invoiceId ? updatedInvoice : inv));
    } catch (error) {
      console.error('Error updating invoice status:', error);
    }
  };

  const handleEditInvoice = async () => {
    if (!editingInvoice || !invoiceDate || !dueDate) return;

    try {
      const updatedInvoice = await editInvoice(editingInvoice.id, {
        invoice_number: editingInvoice.invoice_number,
        receiver_id: editingInvoice.receiver_id,
        issue_date: invoiceDate.toISOString(),
        due_date: dueDate.toISOString(),
        amount: editingInvoice.amount,
        status: editingInvoice.status,
        description: editingInvoice.description,
        items: editingInvoice.items,
      });

      setInvoices(prev => prev.map(inv => inv.id === editingInvoice.id ? updatedInvoice : inv));
      setEditDialogOpen(false);
      setEditingInvoice(null);
      resetNewInvoiceForm();
    } catch (error) {
      console.error('Error updating invoice:', error);
    }
  };

  const handleStartEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setInvoiceDate(new Date(invoice.issue_date));
    setDueDate(new Date(invoice.due_date));
    setEditDialogOpen(true);
  };

  const handleClientAdded = async () => {
    if (!user) return;
    
    try {
      const { data: clients } = await supabase
        .from('external_clients')
        .select('*')
        .eq('user_id', user.id);

      if (clients) {
        setExternalClients(clients.map(client => ({
          id: client.id,
          name: client.company_name || client.contact_name
        })));
      }
    } catch (error) {
      console.error('Error refreshing external clients:', error);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

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
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">Create New Invoice</DialogTitle>
                <DialogDescription className="text-base">
                  Fill in the details below to create a new invoice for your client.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                {/* Client Selection Section */}
                <Card className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Client Information</h3>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant={clientType === 'network' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setClientType('network')}
                          className="flex items-center gap-2"
                        >
                          <User className="h-4 w-4" />
                          Network Contact
                        </Button>
                        <Button
                          type="button"
                          variant={clientType === 'external' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setClientType('external')}
                          className="flex items-center gap-2"
                        >
                          <Building2 className="h-4 w-4" />
                          External Client
                        </Button>
                      </div>
                    </div>
                    <div className="grid gap-4">
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="client" className="text-sm font-medium">Select Client</Label>
                        {clientType === 'network' ? (
                          <div className="w-full">
                            <Select
                              value={newInvoice.client}
                              onValueChange={(value) => setNewInvoice(prev => ({ ...prev, client: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select a network contact" />
                              </SelectTrigger>
                              <SelectContent>
                                {networkContacts.map((contact) => (
                                  <SelectItem key={contact.id} value={contact.id}>
                                    {contact.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <Select
                                value={newInvoice.client}
                                onValueChange={(value) => setNewInvoice(prev => ({ ...prev, client: value }))}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select an external client" />
                                </SelectTrigger>
                                <SelectContent>
                                  {externalClients.map((client) => (
                                    <SelectItem key={client.id} value={client.id}>
                                      {client.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <ExternalClientDialog onClientAdded={handleClientAdded} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Invoice Details Section */}
                <Card className="p-4">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Invoice Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="invoiceNumber" className="text-sm font-medium">Invoice Number</Label>
                        <Input
                          id="invoiceNumber"
                          placeholder="e.g., INV-2025-001"
                          value={newInvoice.invoiceNumber}
                          onChange={(e) => setNewInvoice(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                        <Input
                          id="description"
                          placeholder="Brief description of the invoice"
                          value={newInvoice.description}
                          onChange={(e) => setNewInvoice(prev => ({ ...prev, description: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="issueDate" className="text-sm font-medium">Issue Date</Label>
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
                        <Label htmlFor="dueDate" className="text-sm font-medium">Due Date</Label>
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
                  </div>
                </Card>

                {/* Line Items Section */}
                <Card className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Line Items</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAddLineItem}
                        className="gap-2"
                      >
                        <Plus className="h-4 w-4" /> Add Item
                      </Button>
                    </div>
                    <div className="space-y-4">
                      {newInvoice.items.map((item, index) => (
                        <Card key={index} className="p-4 border-2">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor={`item-description-${index}`} className="text-sm font-medium">Description</Label>
                              <Input
                                id={`item-description-${index}`}
                                placeholder="e.g., Web Development"
                                value={item.description}
                                onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`item-quantity-${index}`} className="text-sm font-medium">Quantity</Label>
                              <Input
                                id={`item-quantity-${index}`}
                                type="number"
                                min="1"
                                placeholder="1"
                                value={item.quantity}
                                onChange={(e) => handleLineItemChange(index, 'quantity', Number(e.target.value))}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`item-price-${index}`} className="text-sm font-medium">Unit Price (€)</Label>
                              <Input
                                id={`item-price-${index}`}
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                value={item.unitPrice}
                                onChange={(e) => handleLineItemChange(index, 'unitPrice', Number(e.target.value))}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`item-total-${index}`} className="text-sm font-medium">Total (€)</Label>
                              <Input
                                id={`item-total-${index}`}
                                type="number"
                                value={item.amount}
                                readOnly
                                className="bg-muted"
                              />
                            </div>
                          </div>
                          {index > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="mt-2 text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={() => {
                                const newItems = [...newInvoice.items];
                                newItems.splice(index, 1);
                                setNewInvoice(prev => ({ ...prev, items: newItems }));
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Remove Item
                            </Button>
                          )}
                        </Card>
                      ))}
                      {newInvoice.items.length === 0 && (
                        <div className="text-center py-8 border-2 border-dashed rounded-lg bg-muted/50">
                          <FileQuestion className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                          <p className="text-base text-muted-foreground font-medium">No line items added yet</p>
                          <p className="text-sm text-muted-foreground mt-1">Click "Add Item" to start adding items to your invoice</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Notes Section */}
                <Card className="p-4">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Additional Notes</h3>
                    <div className="space-y-2">
                      <Label htmlFor="notes" className="text-sm font-medium">Notes</Label>
                      <Textarea
                        id="notes"
                        placeholder="Add any additional notes or terms for this invoice"
                        value={newInvoice.notes}
                        onChange={(e) => setNewInvoice(prev => ({ ...prev, notes: e.target.value }))}
                        className="min-h-[100px]"
                      />
                    </div>
                  </div>
                </Card>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setNewInvoiceDialogOpen(false)}>Cancel</Button>
                <Button type="submit" onClick={handleCreateInvoice} className="gap-2">
                  <FileText className="h-4 w-4" />
                  Create Invoice
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="text-muted-foreground text-sm">View, manage and track all your invoices</div>

      <Tabs defaultValue="sent" onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-fit grid-cols-2">
          <TabsTrigger value="sent">My Invoices ({invoices.length})</TabsTrigger>
          <TabsTrigger value="received">Received Invoices ({invoices.length})</TabsTrigger>
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
                      {invoice.invoice_number}
                    </TableCell>
                    <TableCell>
                      {invoice.external_client_id
                        ? externalClients.find(client => client.id === invoice.external_client_id)?.name || 'Unknown'
                        : networkContacts.find(contact => contact.id === invoice.receiver_id)?.name || 'Unknown'}
                    </TableCell>
                    <TableCell>{format(new Date(invoice.issue_date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>{format(new Date(invoice.due_date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell className="font-medium">€{invoice.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(invoice.status)}>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <EllipsisVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleDownloadPDF(invoice)}>
                            <Download className="mr-2 h-4 w-4" />
                            Download PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStartEdit(invoice)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="gap-2 text-red-600"
                            onClick={() => handleStatusChange(invoice.id, 'cancelled')}
                          >
                            <Trash2 className="h-4 w-4" /> Cancel
                          </DropdownMenuItem>
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
                      {invoice.invoice_number}
                    </TableCell>
                    <TableCell>
                      {invoice.external_client_id
                        ? externalClients.find(client => client.id === invoice.external_client_id)?.name || 'Unknown'
                        : networkContacts.find(contact => contact.id === invoice.receiver_id)?.name || 'Unknown'}
                    </TableCell>
                    <TableCell>{format(new Date(invoice.issue_date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>{format(new Date(invoice.due_date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell className="font-medium">€{invoice.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(invoice.status)}>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <EllipsisVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleDownloadPDF(invoice)}>
                            <Download className="mr-2 h-4 w-4" />
                            Download PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStartEdit(invoice)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="gap-2 text-red-600"
                            onClick={() => handleStatusChange(invoice.id, 'cancelled')}
                          >
                            <Trash2 className="h-4 w-4" /> Cancel
                          </DropdownMenuItem>
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

      {/* Edit Invoice Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Invoice</DialogTitle>
            <DialogDescription>
              Update the invoice details below.
            </DialogDescription>
          </DialogHeader>
          {editingInvoice && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editClientName">Client Name</Label>
                  <Select
                    value={editingInvoice.receiver_id}
                    onValueChange={(value) => setEditingInvoice(prev => prev ? { ...prev, receiver_id: value } : null)}
                  >
                    <SelectTrigger id="editClientName">
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    <SelectContent>
                      {networkContacts.map((contact) => (
                        <SelectItem key={contact.id} value={contact.id}>
                          {contact.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editInvoiceNumber">Invoice Number</Label>
                  <Input
                    id="editInvoiceNumber"
                    value={editingInvoice.invoice_number}
                    onChange={(e) => setEditingInvoice(prev => prev ? { ...prev, invoice_number: e.target.value } : null)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editIssueDate">Issue Date</Label>
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
                  <Label htmlFor="editDueDate">Due Date</Label>
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
              <div className="space-y-2">
                <Label htmlFor="editDescription">Description</Label>
                <Textarea
                  id="editDescription"
                  value={editingInvoice.description || ''}
                  onChange={(e) => setEditingInvoice(prev => prev ? { ...prev, description: e.target.value } : null)}
                />
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="editLineItems" className="text-base">Line Items</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingInvoice(prev => prev ? {
                        ...prev,
                        items: [...prev.items, { description: '', quantity: 1, unitPrice: 0, amount: 0 }]
                      } : null);
                    }}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" /> Add Item
                  </Button>
                </div>
                <div className="space-y-4">
                  {editingInvoice?.items.map((item, index) => (
                    <Card key={index} className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`edit-item-description-${index}`}>Description</Label>
                          <Input
                            id={`edit-item-description-${index}`}
                            placeholder="e.g., Web Development"
                            value={item.description}
                            onChange={(e) => {
                              const newItems = [...editingInvoice.items];
                              newItems[index] = {
                                ...newItems[index],
                                description: e.target.value
                              };
                              setEditingInvoice(prev => prev ? { ...prev, items: newItems } : null);
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`edit-item-quantity-${index}`}>Quantity</Label>
                          <Input
                            id={`edit-item-quantity-${index}`}
                            type="number"
                            min="1"
                            placeholder="1"
                            value={item.quantity}
                            onChange={(e) => {
                              const newItems = [...editingInvoice.items];
                              const quantity = Number(e.target.value) || 0;
                              const unitPrice = Number(newItems[index].unitPrice) || 0;
                              
                              newItems[index] = {
                                ...newItems[index],
                                quantity,
                                amount: Number((quantity * unitPrice).toFixed(2))
                              };

                              // Calculate total invoice amount
                              const totalAmount = newItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
                              
                              setEditingInvoice(prev => prev ? {
                                ...prev,
                                items: newItems,
                                amount: Number(totalAmount.toFixed(2))
                              } : null);
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`edit-item-price-${index}`}>Unit Price (€)</Label>
                          <Input
                            id={`edit-item-price-${index}`}
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            value={item.unitPrice}
                            onChange={(e) => {
                              const newItems = [...editingInvoice.items];
                              const quantity = Number(newItems[index].quantity) || 0;
                              const unitPrice = Number(e.target.value) || 0;
                              
                              newItems[index] = {
                                ...newItems[index],
                                unitPrice,
                                amount: Number((quantity * unitPrice).toFixed(2))
                              };

                              // Calculate total invoice amount
                              const totalAmount = newItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
                              
                              setEditingInvoice(prev => prev ? {
                                ...prev,
                                items: newItems,
                                amount: Number(totalAmount.toFixed(2))
                              } : null);
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`edit-item-total-${index}`}>Total (€)</Label>
                          <Input
                            id={`edit-item-total-${index}`}
                            type="number"
                            value={item.amount}
                            readOnly
                            className="bg-muted"
                          />
                        </div>
                      </div>
                      {index > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2 text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => {
                            const newItems = [...editingInvoice.items];
                            newItems.splice(index, 1);
                            setEditingInvoice(prev => prev ? { ...prev, items: newItems } : null);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Remove Item
                        </Button>
                      )}
                    </Card>
                  ))}
                  {editingInvoice?.items.length === 0 && (
                    <div className="text-center py-6 border-2 border-dashed rounded-lg">
                      <FileQuestion className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">No line items added yet</p>
                      <p className="text-xs text-muted-foreground mt-1">Click "Add Item" to start adding items to your invoice</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editStatus">Status</Label>
                <Select
                  value={editingInvoice.status}
                  onValueChange={(value) => setEditingInvoice(prev => prev ? { ...prev, status: value as 'pending' | 'paid' | 'cancelled' } : null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="submit" onClick={handleEditInvoice}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
 