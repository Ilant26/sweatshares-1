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
import { format, formatDistanceToNow } from 'date-fns';
import { downloadInvoicePDF, createInvoice, getInvoices, updateInvoiceStatus, editInvoice, type Invoice, type InvoiceItem } from '@/lib/invoices';
import { useUser } from '@/lib/auth';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/lib/database.types';
import { ExternalClientDialog } from '@/components/external-client-dialog';
import { useSearchParams, useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { sendMessage } from '@/lib/messages';
import { createPaymentIntent } from '@/lib/stripe';
import Link from 'next/link';

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
  CreditCard,
  Shield,
} from 'lucide-react';

// Add dynamic helpers before the return statement in MyInvoicesPage
function getFinancialSummary(invoices: Invoice[], userId: string | undefined) {
  const sent = invoices.filter(inv => inv.sender_id === userId);
  const totalSent = sent.reduce((sum, inv) => sum + (Number(inv.total ?? inv.amount) || 0), 0);
  const paid = sent.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + (Number(inv.total ?? inv.amount) || 0), 0);
  const pending = sent.filter(inv => inv.status === 'pending').reduce((sum, inv) => sum + (Number(inv.total ?? inv.amount) || 0), 0);
  const cancelled = sent.filter(inv => inv.status === 'cancelled').reduce((sum, inv) => sum + (Number(inv.total ?? inv.amount) || 0), 0);
  
  // Calculate collection rate
  const collectionRate = totalSent > 0 ? Math.round((paid / totalSent) * 100) : 0;
  
  // Average time to pay (in days)
  const paidInvoices = sent.filter(inv => inv.status === 'paid' && inv.updated_at && inv.issue_date);
  const avgTime = paidInvoices.length > 0
    ? Math.round(paidInvoices.reduce((sum, inv) => sum + ((new Date(inv.updated_at).getTime() - new Date(inv.issue_date).getTime()) / (1000 * 60 * 60 * 24)), 0) / paidInvoices.length)
    : null;
  
  // Calculate month-over-month growth (simplified)
  const currentMonth = new Date().getMonth();
  const lastMonth = new Date().getMonth() - 1;
  const currentMonthInvoices = sent.filter(inv => new Date(inv.created_at).getMonth() === currentMonth);
  const lastMonthInvoices = sent.filter(inv => new Date(inv.created_at).getMonth() === lastMonth);
  const currentMonthTotal = currentMonthInvoices.reduce((sum, inv) => sum + (Number(inv.total ?? inv.amount) || 0), 0);
  const lastMonthTotal = lastMonthInvoices.reduce((sum, inv) => sum + (Number(inv.total ?? inv.amount) || 0), 0);
  const growthRate = lastMonthTotal > 0 ? Math.round(((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100) : 0;
  
  // Performance indicator for average time
  const performanceIndicator = avgTime !== null ? (avgTime <= 30 ? 85 : avgTime <= 60 ? 65 : 45) : 0;
  
  return {
    totalSent: totalSent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    paid: paid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    pending: pending.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    cancelled: cancelled.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    averageTime: avgTime !== null ? `${avgTime} days` : 'N/A',
    collectionRate: `${collectionRate}%`,
    growthRate: growthRate,
    performanceIndicator: performanceIndicator,
    totalInvoices: sent.length,
    paidInvoices: sent.filter(inv => inv.status === 'paid').length,
    pendingInvoices: sent.filter(inv => inv.status === 'pending').length,
  };
}

function getRecentActivities(
  invoices: Invoice[],
  userId: string | undefined,
  getClientName: (inv: Invoice) => string,
  userFullName: string,
  senderProfileCache: Record<string, { full_name: string; avatar_url: string | null; username: string }>,
  recipientProfileCache: Record<string, { full_name: string; avatar_url: string | null; username: string }>,
  externalClients: any[],
  networkContacts: any[]
) {
  // Sort by updated_at or created_at descending
  const sorted = [...invoices].sort((a, b) => {
    const aDate = new Date(a.updated_at || a.created_at).getTime();
    const bDate = new Date(b.updated_at || b.created_at).getTime();
    return bDate - aDate;
  });
  
  return sorted.slice(0, 6).map(inv => {
    // Helper function to get proper full name
    const getProperFullName = (invoice: Invoice, isReceiver: boolean) => {
      if (isReceiver) {
        // For sent invoices, get receiver name
        if (invoice.external_client_id) {
          const externalClient = externalClients.find((client: any) => client.id === invoice.external_client_id);
          if (externalClient) {
            return externalClient.name;
          }
        } else if (invoice.receiver_id) {
          // Check recipient profile cache first
          if (recipientProfileCache[invoice.receiver_id]) {
            const profile = recipientProfileCache[invoice.receiver_id];
            return profile.full_name || profile.username || 'Unknown User';
          }
          // Fallback to network contacts
          const networkContact = networkContacts.find((contact: any) => contact.id === invoice.receiver_id);
          if (networkContact) {
            return networkContact.name;
          }
        }
      } else {
        // For received invoices, get sender name
        if (invoice.sender_id) {
          // Check sender profile cache first
          if (senderProfileCache[invoice.sender_id]) {
            const profile = senderProfileCache[invoice.sender_id];
            return profile.full_name || profile.username || 'Unknown User';
          }
          // Fallback to network contacts
          const networkContact = networkContacts.find((contact: any) => contact.id === invoice.sender_id);
          if (networkContact) {
            return networkContact.name;
          }
        }
      }
      // Final fallback to original function
      const fallbackName = getClientName(invoice);
      console.log('Recent Activity Debug:', {
        invoiceId: invoice.id,
        isReceiver,
        receiverId: invoice.receiver_id,
        senderId: invoice.sender_id,
        externalClientId: invoice.external_client_id,
        recipientCache: recipientProfileCache[invoice.receiver_id || ''],
        senderCache: senderProfileCache[invoice.sender_id || ''],
        networkContactsCount: networkContacts.length,
        externalClientsCount: externalClients.length,
        fallbackName
      });
      return fallbackName;
    };

    if (inv.status === 'paid' && inv.updated_at) {
      return {
        id: inv.id + '-paid',
        action: 'paid',
        user: inv.receiver_id === userId ? userFullName : getProperFullName(inv, true),
        document: `invoice ${inv.invoice_number}`,
        amount: (inv.total ?? inv.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        currency: '€',
        time: inv.updated_at,
      };
    }
    if (inv.status === 'cancelled') {
      return {
        id: inv.id + '-cancelled',
        action: 'cancelled',
        document: `Invoice ${inv.invoice_number}`,
        client: getProperFullName(inv, inv.sender_id === userId),
        time: inv.updated_at || inv.created_at,
      };
    }
    if (inv.status === 'pending' && inv.created_at) {
      return {
        id: inv.id + '-created',
        action: 'created',
        user: userFullName, // Always use current user's full name
        document: `new invoice ${inv.invoice_number}`,
        client: getProperFullName(inv, true),
        amount: (inv.total ?? inv.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        currency: '€',
        time: inv.created_at,
      };
    }
    // Add more activity types as needed
    return null;
  }).filter((a): a is NonNullable<typeof a> => Boolean(a));
}

export default function MyInvoicesPage() {
  const { user } = useUser();
  const supabase = createClientComponentClient<Database>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const invoicesPerPage = 5;
  const [newInvoiceDialogOpen, setNewInvoiceDialogOpen] = useState(false);
  const [invoiceDate, setInvoiceDate] = useState<Date | undefined>(undefined);
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [issueDatePopoverOpen, setIssueDatePopoverOpen] = useState(false);
  const [dueDatePopoverOpen, setDueDatePopoverOpen] = useState(false);
  const [editIssueDatePopoverOpen, setEditIssueDatePopoverOpen] = useState(false);
  const [editDueDatePopoverOpen, setEditDueDatePopoverOpen] = useState(false);
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
    notes: '',
    vat_enabled: false,
    vat_rate: 20,
    vat_amount: 0,
    subtotal: 0,
    total: 0,
    paymentMethod: 'standard' as 'standard' | 'payment_link' | 'escrow'
  });
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isLoadingUserProfile, setIsLoadingUserProfile] = useState(false);
  const [messageUserProfile, setMessageUserProfile] = useState<{ id: string; name: string } | null>(null);
  const { toast } = useToast();
  const [senderProfileCache, setSenderProfileCache] = useState<Record<string, { full_name: string; avatar_url: string | null; username: string }>>({});
  const [recipientProfileCache, setRecipientProfileCache] = useState<Record<string, { full_name: string; avatar_url: string | null; username: string }>>({});

  const financialSummary = getFinancialSummary(invoices, user?.id);
  const userFullName = user?.full_name || user?.username || user?.email || 'You';
  const getClientName = (invoice: Invoice) => {
    if (activeTab === 'sent') {
      // For sent invoices, show receiver name
      if (invoice.external_client_id) {
        return externalClients.find(client => client.id === invoice.external_client_id)?.name || 'Unknown';
      } else {
        return networkContacts.find(contact => contact.id === invoice.receiver_id)?.name || 'Unknown';
      }
    } else {
      // For received invoices, show sender name
      return networkContacts.find(contact => contact.id === invoice.sender_id)?.name || 'Unknown';
    }
  };
  const recentActivities = getRecentActivities(invoices, user?.id, getClientName, userFullName, senderProfileCache, recipientProfileCache, externalClients, networkContacts);

  const filteredInvoices = invoices.filter(invoice => {
    const matchesTab = activeTab === 'sent' ? invoice.sender_id === user?.id : invoice.receiver_id === user?.id;
    
    // For search, we need to look at different fields based on the tab
    let matchesSearch = searchTerm === '';
    if (searchTerm !== '') {
      const searchLower = searchTerm.toLowerCase();
      matchesSearch = invoice.invoice_number.toLowerCase().includes(searchLower);
      
      if (activeTab === 'sent') {
        // For sent invoices, search in receiver names
        matchesSearch = matchesSearch || 
          networkContacts.find(contact => contact.id === invoice.receiver_id)?.name.toLowerCase().includes(searchLower) ||
          externalClients.find(client => client.id === invoice.external_client_id)?.name.toLowerCase().includes(searchLower);
      } else {
        // For received invoices, search in sender names
        matchesSearch = matchesSearch || 
          networkContacts.find(contact => contact.id === invoice.sender_id)?.name.toLowerCase().includes(searchLower);
      }
    }
    
    const matchesStatus = filterStatus === 'All' || invoice.status === filterStatus;
    return matchesTab && matchesSearch && matchesStatus;
  });

  // Calculate counts for each tab
  const sentInvoicesCount = invoices.filter(invoice => invoice.sender_id === user?.id).length;
  const receivedInvoicesCount = invoices.filter(invoice => invoice.receiver_id === user?.id).length;

  // Pagination logic
  const indexOfLastInvoice = currentPage * invoicesPerPage;
  const indexOfFirstInvoice = indexOfLastInvoice - invoicesPerPage;
  const currentInvoices = filteredInvoices.slice(indexOfFirstInvoice, indexOfLastInvoice);
  const totalPages = Math.ceil(filteredInvoices.length / invoicesPerPage);

  // Date validation functions
  const isDateValid = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  };

  const isDueDateValid = (dueDate: Date, issueDate: Date) => {
    return dueDate >= issueDate;
  };

  const handleIssueDateSelect = (date: Date | undefined) => {
    if (date && isDateValid(date)) {
      setInvoiceDate(date);
      setIssueDatePopoverOpen(false);
      
      // If due date is before the new issue date, reset it
      if (dueDate && dueDate < date) {
        setDueDate(undefined);
      }
    }
  };

  const handleDueDateSelect = (date: Date | undefined) => {
    if (date && invoiceDate && isDueDateValid(date, invoiceDate)) {
      setDueDate(date);
      setDueDatePopoverOpen(false);
    } else if (date && !invoiceDate && isDateValid(date)) {
      setDueDate(date);
      setDueDatePopoverOpen(false);
    }
  };

  const handleEditIssueDateSelect = (date: Date | undefined) => {
    if (date && isDateValid(date)) {
      setInvoiceDate(date);
      setEditIssueDatePopoverOpen(false);
      
      // If due date is before the new issue date, reset it
      if (dueDate && dueDate < date) {
        setDueDate(undefined);
      }
    }
  };

  const handleEditDueDateSelect = (date: Date | undefined) => {
    if (date && invoiceDate && isDueDateValid(date, invoiceDate)) {
      setDueDate(date);
      setEditDueDatePopoverOpen(false);
    } else if (date && !invoiceDate && isDateValid(date)) {
      setDueDate(date);
      setEditDueDatePopoverOpen(false);
    }
  };

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

  // Handle URL parameters for creating invoice from messages
  useEffect(() => {
    const createParam = searchParams.get('create');
    const userIdParam = searchParams.get('userId');
    
    if (createParam === 'true' && userIdParam) {
      setIsLoadingUserProfile(true);
      setClientType('network'); // Default to network contact
      
      // Fetch the user's profile and add to network contacts if not already there
      const fetchUserProfile = async () => {
        try {
          const { data: userProfile, error } = await supabase
            .from('profiles')
            .select('id, full_name, username')
            .eq('id', userIdParam)
            .single();
          
          if (userProfile && !error) {
            const userName = userProfile.full_name || userProfile.username;
            
            // Store the user profile for display
            setMessageUserProfile({
              id: userProfile.id,
              name: userName
            });
            
            // Check if user is already in network contacts
            const existingContact = networkContacts.find(contact => contact.id === userIdParam);
            
            if (!existingContact) {
              // Add the user to network contacts and wait for state update
              setNetworkContacts(prev => {
                const updatedContacts = [...prev, {
                  id: userProfile.id,
                  name: userName
                }];
                
                // Set the client after contacts are updated
                setTimeout(() => {
                  setNewInvoice(prev => ({ ...prev, client: userIdParam }));
                  setNewInvoiceDialogOpen(true);
                  setIsLoadingUserProfile(false);
                  
                  // Show success message
                  toast({
                    title: "User loaded",
                    description: `Invoice will be created for ${userName}`,
                  });
                }, 50);
                
                return updatedContacts;
              });
            } else {
              // User already exists in contacts, set client immediately
              setNewInvoice(prev => ({ ...prev, client: userIdParam }));
              setNewInvoiceDialogOpen(true);
              setIsLoadingUserProfile(false);
              
              // Show success message
              toast({
                title: "User loaded",
                description: `Invoice will be created for ${userName}`,
              });
            }
          } else {
            console.error('Error fetching user profile:', error);
            setIsLoadingUserProfile(false);
            toast({
              title: "Error",
              description: "Failed to load user information. Please try again.",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setIsLoadingUserProfile(false);
          toast({
            title: "Error",
            description: "Failed to load user information. Please try again.",
            variant: "destructive",
          });
        }
      };
      
      fetchUserProfile();
      
      // Clear the URL parameters after processing
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('create');
      newUrl.searchParams.delete('userId');
      router.replace(newUrl.pathname + newUrl.search, { scroll: false });
    }
  }, [searchParams, router, supabase, networkContacts, toast]);

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
        currency: 'EUR',
        vat_enabled: newInvoice.vat_enabled,
        vat_rate: newInvoice.vat_rate,
        vat_amount: newInvoice.vat_amount,
        subtotal: newInvoice.subtotal,
        total: newInvoice.total,
        payment_method: newInvoice.paymentMethod
      };

      const createdInvoice = await createInvoice(invoiceData);
      setInvoices(prev => [createdInvoice, ...prev]);
      setNewInvoiceDialogOpen(false);
      resetNewInvoiceForm();

      // Send a system message to the receiver if it's a network contact
      if (invoiceData.receiver_id) {
        const invoiceMsg = {
          type: 'invoice',
          invoice_number: createdInvoice.invoice_number,
          amount: createdInvoice.total,
          currency: createdInvoice.currency,
          due_date: createdInvoice.due_date,
          status: createdInvoice.status,
          description: createdInvoice.description,
          invoice_id: createdInvoice.id
        };
        await sendMessage(invoiceData.receiver_id, JSON.stringify(invoiceMsg));
      }

      // Show success message based on payment method
      const successMessages = {
        standard: 'Invoice created successfully!',
        payment_link: 'Invoice with payment link created successfully!',
        escrow: 'Escrow invoice created successfully!'
      };

      toast({
        title: 'Success',
        description: successMessages[newInvoice.paymentMethod],
      });
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast({
        title: 'Error',
        description: 'Failed to create invoice. Please try again.',
        variant: 'destructive',
      });
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
      notes: '',
      vat_enabled: false,
      vat_rate: 20,
      vat_amount: 0,
      subtotal: 0,
      total: 0,
      paymentMethod: 'standard'
    });
    setInvoiceDate(undefined);
    setDueDate(undefined);
    setIssueDatePopoverOpen(false);
    setDueDatePopoverOpen(false);
    setClientType('network');
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

      // Calculate subtotal
      const subtotal = newItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
      
      // Calculate VAT and total
      const vatAmount = prev.vat_enabled ? Number((subtotal * (prev.vat_rate / 100)).toFixed(2)) : 0;
      const total = subtotal + vatAmount;

      return {
        ...prev,
        items: newItems,
        subtotal: Number(subtotal.toFixed(2)),
        vat_amount: vatAmount,
        total: Number(total.toFixed(2)),
        amount: Number(total.toFixed(2)) // Keep amount for backward compatibility
      };
    });
  };

  const handleDownloadPDF = async (invoice: Invoice) => {
    try {
      // Fetch sender profile
      const { data: senderProfile } = await supabase
        .from('profile_with_email')
        .select('id, company, full_name, phone_number, address, email')
        .eq('id', invoice.sender_id)
        .single();
      const sender = senderProfile;

      let receiver = null;
      if (invoice.external_client_id) {
        // Fetch external client
        const { data: externalClient } = await supabase
          .from('external_clients')
          .select('*')
          .eq('id', invoice.external_client_id)
          .single();
        receiver = externalClient;
      } else {
        // Fetch network client profile
        const { data: receiverProfile } = await supabase
          .from('profile_with_email')
          .select('id, company, full_name, phone_number, address, email')
          .eq('id', invoice.receiver_id)
          .single();
        receiver = receiverProfile;
      }

      if (sender && receiver) {
        downloadInvoicePDF(invoice, sender, receiver);
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
        vat_enabled: editingInvoice.vat_enabled,
        vat_rate: editingInvoice.vat_rate,
        vat_amount: editingInvoice.vat_amount,
        subtotal: editingInvoice.subtotal,
        total: editingInvoice.total
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
    setEditIssueDatePopoverOpen(false);
    setEditDueDatePopoverOpen(false);
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

  const handleVatRateChange = (rate: number) => {
    setNewInvoice(prev => {
      const vatAmount = prev.vat_enabled ? Number((prev.subtotal * (rate / 100)).toFixed(2)) : 0;
      const total = prev.subtotal + vatAmount;
      return {
        ...prev,
        vat_rate: rate,
        vat_amount: vatAmount,
        total: Number(total.toFixed(2)),
        amount: Number(total.toFixed(2))
      };
    });
  };

  const handleVatToggle = (enabled: boolean) => {
    setNewInvoice(prev => {
      const subtotal = prev.items.reduce((sum, item) => sum + (item.amount || 0), 0);
      const vatAmount = enabled ? Number((subtotal * (prev.vat_rate / 100)).toFixed(2)) : 0;
      const total = subtotal + vatAmount;
      
      return {
        ...prev,
        vat_enabled: enabled,
        vat_amount: vatAmount,
        subtotal: Number(subtotal.toFixed(2)),
        total: Number(total.toFixed(2)),
        amount: Number(total.toFixed(2))
      };
    });
  };

  const handlePayInvoice = async (invoice: Invoice) => {
    try {
      // Create payment intent
      const paymentIntent = await createPaymentIntent(
        invoice.total || invoice.amount,
        invoice.currency || 'eur',
        {
          invoice_id: invoice.id,
          invoice_number: invoice.invoice_number,
          sender_id: invoice.sender_id,
          receiver_id: invoice.receiver_id
        }
      );

      // Redirect to Stripe Checkout or handle payment flow
      // For now, we'll just update the invoice status to paid
      await updateInvoiceStatus(invoice.id, 'paid');
      
      // Refresh invoices
      const updatedInvoices = await getInvoices(user?.id || '');
      setInvoices(updatedInvoices);
      
      toast({
        title: "Payment Successful",
        description: `Invoice ${invoice.invoice_number} has been marked as paid.`,
      });
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Failed",
        description: "There was an error processing your payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Helper to fetch and cache sender profile
  async function fetchAndCacheSenderProfile(userId: string) {
    if (!userId || senderProfileCache[userId]) return;
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, username')
      .eq('id', userId)
      .single();
    if (data) {
      setSenderProfileCache(prev => ({ ...prev, [userId]: { full_name: data.full_name, avatar_url: data.avatar_url, username: data.username } }));
    }
  }

  // Helper to fetch and cache recipient profile
  async function fetchAndCacheRecipientProfile(userId: string) {
    if (!userId || recipientProfileCache[userId]) return;
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, username')
      .eq('id', userId)
      .single();
    if (data) {
      setRecipientProfileCache(prev => ({ ...prev, [userId]: { full_name: data.full_name, avatar_url: data.avatar_url, username: data.username } }));
    }
  }

  // Whenever invoices change, ensure all sender profiles for received invoices are cached
  useEffect(() => {
    const senderIds = new Set<string>();
    invoices.forEach(inv => {
      if (inv.receiver_id === user?.id && inv.sender_id) senderIds.add(inv.sender_id);
    });
    senderIds.forEach(id => {
      if (id && !senderProfileCache[id]) fetchAndCacheSenderProfile(id);
    });
    // eslint-disable-next-line
  }, [invoices, user]);

  // Whenever invoices change, ensure all recipient profiles for sent invoices are cached
  useEffect(() => {
    const recipientIds = new Set<string>();
    invoices.forEach(inv => {
      if (inv.sender_id === user?.id && inv.receiver_id) recipientIds.add(inv.receiver_id);
    });
    recipientIds.forEach(id => {
      if (id && !recipientProfileCache[id]) fetchAndCacheRecipientProfile(id);
    });
    // eslint-disable-next-line
  }, [invoices, user]);

  // Helper to get sender profile for received invoices
  function getSenderProfile(invoice: Invoice) {
    if (invoice.sender_id && senderProfileCache[invoice.sender_id]) {
      return senderProfileCache[invoice.sender_id];
    }
    return null;
  }

  // Helper to get recipient profile for sent invoices
  function getRecipientProfile(invoice: Invoice) {
    if (invoice.receiver_id && recipientProfileCache[invoice.receiver_id]) {
      return recipientProfileCache[invoice.receiver_id];
    }
    return null;
  }

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    const invoiceIdParam = searchParams.get('invoiceId');
    if (tabParam === 'received') setActiveTab('received');
    if (invoiceIdParam) {
      // Optionally scroll to or highlight the invoice
      setTimeout(() => {
        const el = document.getElementById(`invoice-row-${invoiceIdParam}`);
        if (el) {
          el.classList.add(
            'ring-2', 'ring-green-500', 'bg-green-50',
            'dark:ring-green-400', 'dark:bg-green-900/40'
          );
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(() => {
            el.classList.remove(
              'ring-2', 'ring-green-500', 'bg-green-50',
              'dark:ring-green-400', 'dark:bg-green-900/40'
            );
          }, 2000);
        }
      }, 500);
    }
    // eslint-disable-next-line
  }, []);

  // Move getStatusBadgeVariant to the top, after other helpers
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

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

  return (
    <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Invoice Management</h2>
        <div className="flex items-center gap-2">
          <Dialog open={newInvoiceDialogOpen} onOpenChange={(open) => {
            setNewInvoiceDialogOpen(open);
            if (!open) {
              setMessageUserProfile(null); // Clear message user profile when dialog closes
            }
          }}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" /> New Invoice
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto w-[95vw]">
              <DialogHeader>
                <DialogTitle className="text-xl sm:text-2xl font-bold">Create New Invoice</DialogTitle>
                <DialogDescription className="text-sm sm:text-base">
                  Fill in the details below to create a new invoice for your client.
                </DialogDescription>
                {isLoadingUserProfile && (
                  <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded-md border border-blue-200 dark:border-blue-800">
                    <User className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-blue-700 dark:text-blue-300">
                      Creating invoice from conversation...
                    </span>
                  </div>
                )}
              </DialogHeader>
              <div className="grid gap-4 sm:gap-6 py-4">
                {/* Client Selection Section */}
                <Card className="p-3 sm:p-4">
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                      <h3 className="text-base sm:text-lg font-semibold">Client Information</h3>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <Button
                          type="button"
                          variant={clientType === 'network' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setClientType('network')}
                          className="flex items-center gap-2 flex-1 sm:flex-none"
                        >
                          <User className="h-4 w-4" />
                          <span className="hidden sm:inline">Sweatshares Contact</span>
                          <span className="sm:hidden">Network</span>
                        </Button>
                        <Button
                          type="button"
                          variant={clientType === 'external' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setClientType('external')}
                          className="flex items-center gap-2 flex-1 sm:flex-none"
                        >
                          <Building2 className="h-4 w-4" />
                          <span className="hidden sm:inline">External Client</span>
                          <span className="sm:hidden">External</span>
                        </Button>
                      </div>
                    </div>
                    <div className="grid gap-3 sm:gap-4">
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="client" className="text-xs sm:text-sm font-medium">Select Client</Label>
                        {clientType === 'network' ? (
                          <div className="w-full">
                            {isLoadingUserProfile ? (
                              <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                <span className="text-sm text-muted-foreground">Loading user information...</span>
                              </div>
                            ) : (
                              <Select
                                value={newInvoice.client}
                                onValueChange={(value) => setNewInvoice(prev => ({ ...prev, client: value }))}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a network contact">
                                    {newInvoice.client && (() => {
                                      // First try to find in network contacts
                                      const selectedContact = networkContacts.find(contact => contact.id === newInvoice.client);
                                      if (selectedContact) {
                                        return selectedContact.name;
                                      }
                                      
                                      // Fallback to message user profile
                                      if (messageUserProfile && messageUserProfile.id === newInvoice.client) {
                                        return messageUserProfile.name;
                                      }
                                      
                                      return 'Loading...';
                                    })()}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  {networkContacts.map((contact) => (
                                    <SelectItem key={contact.id} value={contact.id}>
                                      {contact.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row gap-2">
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
                <Card className="p-3 sm:p-4">
                  <div className="space-y-3 sm:space-y-4">
                    <h3 className="text-base sm:text-lg font-semibold">Invoice Details</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="invoiceNumber" className="text-xs sm:text-sm font-medium">Invoice Number</Label>
                        <Input
                          id="invoiceNumber"
                          placeholder="e.g., INV-2025-001"
                          value={newInvoice.invoiceNumber}
                          onChange={(e) => setNewInvoice(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description" className="text-xs sm:text-sm font-medium">Description</Label>
                        <Input
                          id="description"
                          placeholder="Brief description of the invoice"
                          value={newInvoice.description}
                          onChange={(e) => setNewInvoice(prev => ({ ...prev, description: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="issueDate" className="text-xs sm:text-sm font-medium">Issue Date</Label>
                        <Popover open={issueDatePopoverOpen} onOpenChange={setIssueDatePopoverOpen}>
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
                              onSelect={handleIssueDateSelect}
                              disabled={(date) => {
                                return !isDateValid(date);
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dueDate" className="text-xs sm:text-sm font-medium">Due Date</Label>
                        <Popover open={dueDatePopoverOpen} onOpenChange={setDueDatePopoverOpen}>
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
                              onSelect={handleDueDateSelect}
                              disabled={(date) => {
                                if (!isDateValid(date)) return true;
                                if (invoiceDate && !isDueDateValid(date, invoiceDate)) return true;
                                return false;
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Line Items Section */}
                <Card className="p-3 sm:p-4">
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                      <h3 className="text-base sm:text-lg font-semibold">Line Items</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAddLineItem}
                        className="gap-2 w-full sm:w-auto"
                      >
                        <Plus className="h-4 w-4" /> Add Item
                      </Button>
                    </div>
                    <div className="space-y-3 sm:space-y-4">
                      {newInvoice.items.map((item, index) => (
                        <Card key={index} className="p-3 sm:p-4 border-2">
                          <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 sm:gap-4">
                            <div className="space-y-2">
                              <Label htmlFor={`item-description-${index}`} className="text-xs sm:text-sm font-medium">Description</Label>
                              <Input
                                id={`item-description-${index}`}
                                placeholder="e.g., Web Development"
                                value={item.description}
                                onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`item-quantity-${index}`} className="text-xs sm:text-sm font-medium">Quantity</Label>
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
                              <Label htmlFor={`item-price-${index}`} className="text-xs sm:text-sm font-medium">Unit Price (€)</Label>
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
                              <Label htmlFor={`item-total-${index}`} className="text-xs sm:text-sm font-medium">Total (€)</Label>
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
                        <div className="text-center py-6 border-2 border-dashed rounded-lg">
                          <FileQuestion className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">No line items added yet</p>
                          <p className="text-xs text-muted-foreground mt-1">Click "Add Item" to start adding items to your invoice</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>

                {/* VAT Section */}
                <Card className="p-3 sm:p-4">
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                      <h3 className="text-base sm:text-lg font-semibold">VAT Settings</h3>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="vat-enabled" className="text-xs sm:text-sm font-medium">Enable VAT</Label>
                        <input
                          id="vat-enabled"
                          type="checkbox"
                          checked={newInvoice.vat_enabled}
                          onChange={(e) => {
                            const enabled = e.target.checked;
                            handleVatToggle(enabled);
                          }}
                          className="h-4 w-4"
                        />
                      </div>
                    </div>
                    
                    {newInvoice.vat_enabled && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="vat-rate" className="text-xs sm:text-sm font-medium">VAT Rate (%)</Label>
                          <Select
                            value={newInvoice.vat_rate.toString()}
                            onValueChange={(value) => {
                              const rate = Number(value);
                              handleVatRateChange(rate);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">0%</SelectItem>
                              <SelectItem value="5">5%</SelectItem>
                              <SelectItem value="10">10%</SelectItem>
                              <SelectItem value="20">20%</SelectItem>
                              <SelectItem value="25">25%</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs sm:text-sm font-medium">VAT Amount (€)</Label>
                          <Input
                            value={newInvoice.vat_amount.toFixed(2)}
                            readOnly
                            className="bg-muted"
                          />
                        </div>
                      </div>
                    )}

                    {/* Summary */}
                    <div className="border-t pt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal:</span>
                        <span className="font-medium">€{newInvoice.subtotal.toFixed(2)}</span>
                      </div>
                      {newInvoice.vat_enabled && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">VAT ({newInvoice.vat_rate}%):</span>
                          <span className="font-medium">€{newInvoice.vat_amount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-base font-semibold border-t pt-2">
                        <span>Total:</span>
                        <span>€{newInvoice.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Notes Section */}
                <Card className="p-3 sm:p-4">
                  <div className="space-y-3 sm:space-y-4">
                    <h3 className="text-base sm:text-lg font-semibold">Additional Notes</h3>
                    <div className="space-y-2">
                      <Label htmlFor="notes" className="text-xs sm:text-sm font-medium">Notes</Label>
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

                {/* Payment Options Section */}
                <Card className="p-3 sm:p-4">
                  <div className="space-y-3 sm:space-y-4">
                    <h3 className="text-base sm:text-lg font-semibold">Payment Options</h3>
                    <div className="space-y-3">
                      <div className={`flex items-center space-x-2 p-3 rounded-lg border-2 transition-colors ${
                        newInvoice.paymentMethod === 'standard' 
                          ? 'border-primary bg-primary/5' 
                          : 'border-muted hover:border-muted-foreground/50'
                      }`}>
                        <input
                          type="radio"
                          id="payment-standard"
                          name="paymentMethod"
                          value="standard"
                          checked={newInvoice.paymentMethod === 'standard'}
                          onChange={(e) => setNewInvoice(prev => ({ ...prev, paymentMethod: e.target.value as 'standard' | 'payment_link' | 'escrow' }))}
                          className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                        />
                        <Label htmlFor="payment-standard" className="text-sm font-medium cursor-pointer flex-1">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            Standard Invoice
                          </div>
                          <p className="text-xs text-muted-foreground font-normal mt-1">
                            Send a traditional invoice for manual payment processing
                          </p>
                        </Label>
                      </div>
                      
                      <div className={`flex items-center space-x-2 p-3 rounded-lg border-2 transition-colors ${
                        newInvoice.paymentMethod === 'payment_link' 
                          ? 'border-primary bg-primary/5' 
                          : 'border-muted hover:border-muted-foreground/50'
                      }`}>
                        <input
                          type="radio"
                          id="payment-link"
                          name="paymentMethod"
                          value="payment_link"
                          checked={newInvoice.paymentMethod === 'payment_link'}
                          onChange={(e) => setNewInvoice(prev => ({ ...prev, paymentMethod: e.target.value as 'standard' | 'payment_link' | 'escrow' }))}
                          className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                        />
                        <Label htmlFor="payment-link" className="text-sm font-medium cursor-pointer flex-1">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                            Payment Link
                          </div>
                          <p className="text-xs text-muted-foreground font-normal mt-1">
                            Generate a secure payment link for instant online payment
                          </p>
                        </Label>
                      </div>
                      
                      <div className={`flex items-center space-x-2 p-3 rounded-lg border-2 transition-colors ${
                        newInvoice.paymentMethod === 'escrow' 
                          ? 'border-primary bg-primary/5' 
                          : 'border-muted hover:border-muted-foreground/50'
                      }`}>
                        <input
                          type="radio"
                          id="payment-escrow"
                          name="paymentMethod"
                          value="escrow"
                          checked={newInvoice.paymentMethod === 'escrow'}
                          onChange={(e) => setNewInvoice(prev => ({ ...prev, paymentMethod: e.target.value as 'standard' | 'payment_link' | 'escrow' }))}
                          className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                        />
                        <Label htmlFor="payment-escrow" className="text-sm font-medium cursor-pointer flex-1">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-muted-foreground" />
                            Escrow Payment
                          </div>
                          <p className="text-xs text-muted-foreground font-normal mt-1">
                            Secure payment held in escrow until work is completed and approved
                          </p>
                        </Label>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setNewInvoiceDialogOpen(false)}>Cancel</Button>
                <Button type="submit" onClick={handleCreateInvoice} className="gap-2">
                  {newInvoice.paymentMethod === 'payment_link' ? (
                    <CreditCard className="h-4 w-4" />
                  ) : newInvoice.paymentMethod === 'escrow' ? (
                    <Shield className="h-4 w-4" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                  {newInvoice.paymentMethod === 'payment_link' ? 'Create Payment Link' : 
                   newInvoice.paymentMethod === 'escrow' ? 'Create Escrow Invoice' : 
                   'Create Invoice'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="text-muted-foreground text-xs sm:text-sm">View, manage and track all your invoices</div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sent" className="text-xs sm:text-sm">My Invoices ({sentInvoicesCount})</TabsTrigger>
          <TabsTrigger value="received" className="text-xs sm:text-sm">Received Invoices ({receivedInvoicesCount})</TabsTrigger>
        </TabsList>
        <TabsContent value="sent" className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-2">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search invoices..."
                className="pl-8 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2 w-full sm:w-auto">
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
                  <Button variant="outline" className="gap-2 w-full sm:w-auto">
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
                  <Button variant="outline" className="gap-2 w-full sm:w-auto">
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
          </div>

          <div className="rounded-md border overflow-x-auto">
            {/* Mobile card layout */}
            <div className="space-y-4 sm:hidden">
              {currentInvoices.map((invoice) => (
                <Card key={invoice.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm">{invoice.invoice_number}</span>
                      </div>
                      <Badge variant={getStatusBadgeVariant(invoice.status)} className="text-xs">
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">To:</span>
                        {(() => {
                          if (invoice.external_client_id) {
                            // External client
                            const client = externalClients.find(c => c.id === invoice.external_client_id);
                            return <span>{client?.name || 'External Client'}</span>;
                          }
                          const recipient = getRecipientProfile(invoice);
                          return recipient ? (
                            <Link href={`/dashboard/profile/${invoice.receiver_id}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={recipient.avatar_url || undefined} />
                                <AvatarFallback>{(recipient.full_name || recipient.username || '?')[0]}</AvatarFallback>
                              </Avatar>
                              <span className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium">{recipient.full_name || recipient.username}</span>
                            </Link>
                          ) : (
                            getClientName(invoice)
                          );
                        })()}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Amount:</span>
                        <p className="font-medium">€{invoice.total?.toFixed(2) || invoice.amount.toFixed(2)}</p>
                        {invoice.vat_enabled && (
                          <p className="text-xs text-muted-foreground">incl. VAT ({invoice.vat_rate}%)</p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div>
                        <span>Issue: {format(new Date(invoice.issue_date), 'MMM dd, yyyy')}</span>
                      </div>
                      <div>
                        <span>Due: {format(new Date(invoice.due_date), 'MMM dd, yyyy')}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-2 border-t">
                      {activeTab === 'received' && invoice.status === 'pending' && (
                        <Button 
                          variant="default" 
                          size="sm" 
                          onClick={() => handlePayInvoice(invoice)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CreditCard className="h-4 w-4 mr-1" />
                          Pay
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => handleDownloadPDF(invoice)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleStartEdit(invoice)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            {/* Desktop table */}
            <div className="hidden sm:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">INVOICE NUMBER</TableHead>
                    <TableHead>TO</TableHead>
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
                        {(() => {
                          if (invoice.external_client_id) {
                            // External client
                            const client = externalClients.find(c => c.id === invoice.external_client_id);
                            return <span>{client?.name || 'External Client'}</span>;
                          }
                          const recipient = getRecipientProfile(invoice);
                          return recipient ? (
                            <Link href={`/dashboard/profile/${invoice.receiver_id}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={recipient.avatar_url || undefined} />
                                <AvatarFallback>{(recipient.full_name || recipient.username || '?')[0]}</AvatarFallback>
                              </Avatar>
                              <span className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium">{recipient.full_name || recipient.username}</span>
                            </Link>
                          ) : (
                            getClientName(invoice)
                          );
                        })()}
                      </TableCell>
                      <TableCell>{format(new Date(invoice.issue_date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>{format(new Date(invoice.due_date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell className="font-medium">
                        €{invoice.total?.toFixed(2) || invoice.amount.toFixed(2)}
                        {invoice.vat_enabled && (
                          <div className="text-xs text-muted-foreground">
                            incl. VAT ({invoice.vat_rate}%)
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(invoice.status)}>
                          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {/* Desktop view: Icons + Dropdown */}
                        <div className="hidden md:flex items-center justify-end gap-1">
                          {activeTab === 'received' && invoice.status === 'pending' && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePayInvoice(invoice);
                              }}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <CreditCard className="h-4 w-4 mr-1" />
                              Pay
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartEdit(invoice);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View Details</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadPDF(invoice);
                            }}
                          >
                            <Download className="h-4 w-4" />
                            <span className="sr-only">Download PDF</span>
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                                <span className="sr-only">Open menu</span>
                                <EllipsisVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                              <DropdownMenuItem onClick={() => handleStartEdit(invoice)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                <span>Edit</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-500"
                                onClick={() => handleStatusChange(invoice.id, 'cancelled')}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Cancel</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Mobile view: Dropdown only */}
                        <div className="md:hidden">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                                <span className="sr-only">Open menu</span>
                                <EllipsisVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                              {activeTab === 'received' && invoice.status === 'pending' && (
                                <DropdownMenuItem onClick={() => handlePayInvoice(invoice)}>
                                  <CreditCard className="mr-2 h-4 w-4" />
                                  <span>Pay</span>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => handleStartEdit(invoice)}>
                                <Eye className="mr-2 h-4 w-4" />
                                <span>View</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDownloadPDF(invoice)}>
                                <Download className="mr-2 h-4 w-4" />
                                <span>Download PDF</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStartEdit(invoice)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                <span>Edit</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-500"
                                onClick={() => handleStatusChange(invoice.id, 'cancelled')}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Cancel</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
            <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
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
          <div className="rounded-md border overflow-x-auto">
            {/* Mobile card layout */}
            <div className="space-y-4 sm:hidden">
              {currentInvoices.map((invoice) => (
                <Card key={invoice.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm">{invoice.invoice_number}</span>
                      </div>
                      <Badge variant={getStatusBadgeVariant(invoice.status)} className="text-xs">
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">From:</span>
                        {(() => {
                          const sender = getSenderProfile(invoice);
                          return sender ? (
                            <Link href={`/dashboard/profile/${invoice.sender_id}`} className="flex items-center gap-2 mt-1 hover:opacity-80 transition-opacity">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={sender.avatar_url || undefined} />
                                <AvatarFallback>{(sender.full_name || sender.username || '?')[0]}</AvatarFallback>
                              </Avatar>
                              <span className="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">{sender.full_name || sender.username}</span>
                            </Link>
                          ) : (
                            <p className="font-medium">{getClientName(invoice)}</p>
                          );
                        })()}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Amount:</span>
                        <p className="font-medium">€{invoice.total?.toFixed(2) || invoice.amount.toFixed(2)}</p>
                        {invoice.vat_enabled && (
                          <p className="text-xs text-muted-foreground">incl. VAT ({invoice.vat_rate}%)</p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div>
                        <span>Issue: {format(new Date(invoice.issue_date), 'MMM dd, yyyy')}</span>
                      </div>
                      <div>
                        <span>Due: {format(new Date(invoice.due_date), 'MMM dd, yyyy')}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-2 border-t">
                      {activeTab === 'received' && invoice.status === 'pending' && (
                        <Button 
                          variant="default" 
                          size="sm" 
                          onClick={() => handlePayInvoice(invoice)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CreditCard className="h-4 w-4 mr-1" />
                          Pay
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => handleDownloadPDF(invoice)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleStartEdit(invoice)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            {/* Desktop table */}
            <div className="hidden sm:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">INVOICE NUMBER</TableHead>
                    <TableHead>FROM</TableHead>
                    <TableHead>ISSUE DATE</TableHead>
                    <TableHead>DUE DATE</TableHead>
                    <TableHead>AMOUNT</TableHead>
                    <TableHead>STATUS</TableHead>
                    <TableHead className="text-right">ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentInvoices.map((invoice) => (
                    <TableRow key={invoice.id} id={`invoice-row-${invoice.id}`}>
                      <TableCell className="font-medium flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        {invoice.invoice_number}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const sender = getSenderProfile(invoice);
                          return sender ? (
                            <Link href={`/dashboard/profile/${invoice.sender_id}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={sender.avatar_url || undefined} />
                                <AvatarFallback>{(sender.full_name || sender.username || '?')[0]}</AvatarFallback>
                              </Avatar>
                              <span className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium">{sender.full_name || sender.username}</span>
                            </Link>
                          ) : (
                            getClientName(invoice)
                          );
                        })()}
                      </TableCell>
                      <TableCell>{format(new Date(invoice.issue_date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>{format(new Date(invoice.due_date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell className="font-medium">
                        €{invoice.total?.toFixed(2) || invoice.amount.toFixed(2)}
                        {invoice.vat_enabled && (
                          <div className="text-xs text-muted-foreground">
                            incl. VAT ({invoice.vat_rate}%)
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(invoice.status)}>
                          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {/* Desktop view: Icons + Dropdown */}
                        <div className="hidden md:flex items-center justify-end gap-1">
                          {activeTab === 'received' && invoice.status === 'pending' && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePayInvoice(invoice);
                              }}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <CreditCard className="h-4 w-4 mr-1" />
                              Pay
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartEdit(invoice);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View Details</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadPDF(invoice);
                            }}
                          >
                            <Download className="h-4 w-4" />
                            <span className="sr-only">Download PDF</span>
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                                <span className="sr-only">Open menu</span>
                                <EllipsisVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                              <DropdownMenuItem onClick={() => handleStartEdit(invoice)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                <span>Edit</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-500"
                                onClick={() => handleStatusChange(invoice.id, 'cancelled')}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Cancel</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Mobile view: Dropdown only */}
                        <div className="md:hidden">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                                <span className="sr-only">Open menu</span>
                                <EllipsisVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                              {activeTab === 'received' && invoice.status === 'pending' && (
                                <DropdownMenuItem onClick={() => handlePayInvoice(invoice)}>
                                  <CreditCard className="mr-2 h-4 w-4" />
                                  <span>Pay</span>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => handleStartEdit(invoice)}>
                                <Eye className="mr-2 h-4 w-4" />
                                <span>View</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDownloadPDF(invoice)}>
                                <Download className="mr-2 h-4 w-4" />
                                <span>Download PDF</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStartEdit(invoice)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                <span>Edit</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-500"
                                onClick={() => handleStatusChange(invoice.id, 'cancelled')}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Cancel</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
            <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
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

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Enhanced Financial Summary */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Financial Summary</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span>This month</span>
                </div>
              </div>
          
          <div className="grid gap-4">
            {/* Main Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 hover:shadow-xl transition-all duration-300 group animate-in slide-in-from-bottom-2">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 group-hover:scale-110 transition-transform duration-300">
                      <CircleDollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">Total Sent</p>
              </div>
                </div>
                  <div className="space-y-2">
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">€{financialSummary.totalSent}</p>
                    <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                      <TrendingUp className="h-3 w-3" />
                      <span>{financialSummary.growthRate > 0 ? '+' : ''}{financialSummary.growthRate}% from last month</span>
              </div>
                </div>
                </CardContent>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Card>

              <Card className="relative overflow-hidden border-2 border-green-200 dark:border-green-800 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 hover:shadow-xl transition-all duration-300 group animate-in slide-in-from-bottom-2 delay-100">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 group-hover:scale-110 transition-transform duration-300">
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wide">Paid</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">€{financialSummary.paid}</p>
                    <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                      <CheckCircle className="h-3 w-3" />
                      <span>{financialSummary.collectionRate} collection rate</span>
                    </div>
              </div>
            </CardContent>
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </Card>
        </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="relative overflow-hidden border-0 shadow-md bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 hover:shadow-lg transition-all duration-300 group animate-in slide-in-from-bottom-2 delay-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/30 group-hover:scale-110 transition-transform duration-300">
                      <Hourglass className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <p className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wide">Pending</p>
                  </div>
                  <p className="text-lg font-bold text-amber-700 dark:text-amber-300">€{financialSummary.pending}</p>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-0 shadow-md bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20 hover:shadow-lg transition-all duration-300 group animate-in slide-in-from-bottom-2 delay-300">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/30 group-hover:scale-110 transition-transform duration-300">
                      <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </div>
                    <p className="text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-wide">Cancelled</p>
                  </div>
                  <p className="text-lg font-bold text-red-700 dark:text-red-300">€{financialSummary.cancelled}</p>
                </CardContent>
              </Card>
            </div>

            {/* Performance Metrics */}
            <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 animate-in slide-in-from-bottom-2 delay-400">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                      <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                      <p className="text-sm font-semibold text-purple-700 dark:text-purple-300">Average Time to Pay</p>
                      <p className="text-xs text-purple-600 dark:text-purple-400">Payment efficiency</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{financialSummary.averageTime}</p>
                    <div className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400">
                      <TrendingUp className="h-3 w-3" />
                      <span>{financialSummary.performanceIndicator >= 80 ? 'Excellent' : financialSummary.performanceIndicator >= 60 ? 'Good' : 'Needs improvement'}</span>
                    </div>
                  </div>
                </div>
                <div className="w-full bg-purple-200 dark:bg-purple-800 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full transition-all duration-500" style={{ width: `${financialSummary.performanceIndicator}%` }} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Enhanced Recent Activity */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Recent Activity</h3>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-primary">
              View all
            </Button>
          </div>
          
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div key={activity.id} className="group relative animate-in slide-in-from-left-2" style={{ animationDelay: `${index * 100}ms` }}>
                    {/* Activity Timeline */}
                    <div className="flex items-start gap-4">
                      <div className="relative flex-shrink-0">
                        <div className={cn(
                          "w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 shadow-sm transition-all duration-300 group-hover:scale-125",
                          activity.action === 'paid' && "bg-green-500",
                          activity.action === 'created' && "bg-blue-500", 
                          activity.action === 'cancelled' && "bg-red-500",
                          activity.action === 'reminder sent' && "bg-amber-500"
                        )} />
                        {index < recentActivities.length - 1 && (
                          <div className="absolute top-3 left-1.5 w-px h-12 bg-gradient-to-b from-gray-300 to-transparent dark:from-gray-600" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-relaxed">
                              {activity.action === 'paid' && (
                                <>
                                  <span className="font-semibold text-green-600 dark:text-green-400">{activity.user}</span> paid{' '}
                                  <span className="font-semibold">{activity.document}</span> for{' '}
                                  <span className="font-bold text-green-600 dark:text-green-400">{activity.currency}{activity.amount}</span>
                                </>
                              )}
                              {activity.action === 'created' && (
                                <>
                                  <span className="font-semibold text-blue-600 dark:text-blue-400">{activity.user}</span> created{' '}
                                  <span className="font-semibold">{activity.document}</span> for{' '}
                                  <span className="font-semibold">{activity.client}</span> for{' '}
                                  <span className="font-bold text-blue-600 dark:text-blue-400">{activity.currency}{activity.amount}</span>
                                </>
                              )}
                              {activity.action === 'cancelled' && (
                                <>
                                  <span className="font-semibold">{activity.document}</span> for{' '}
                                  <span className="font-semibold">{activity.client}</span> has been{' '}
                                  <span className="font-semibold text-red-600 dark:text-red-400">cancelled</span>
                                </>
                              )}
                              {activity.action === 'reminder sent' && (
                                <>
                                  Automatic <span className="font-semibold text-amber-600 dark:text-amber-400">reminder sent</span> for{' '}
                                  <span className="font-semibold">{activity.document}</span> to{' '}
                                  <span className="font-semibold">{activity.client}</span>
                                </>
                              )}
                            </p>
                          </div>
                          <div className="flex-shrink-0">
                            <div className={cn(
                              "px-2 py-1 rounded-full text-xs font-medium transition-all duration-300 group-hover:scale-105",
                              activity.action === 'paid' && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
                              activity.action === 'created' && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
                              activity.action === 'cancelled' && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
                              activity.action === 'reminder sent' && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                            )}>
                              {activity.action}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <Clock className="h-3 w-3" />
                          <span>{formatDistanceToNow(new Date(activity.time), { addSuffix: true })}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Hover effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
                  </div>
                ))}
                
                {recentActivities.length === 0 && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <FileText className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">No recent activity</p>
                    <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Your invoice activity will appear here</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Invoice Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto w-[95vw]">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Edit Invoice</DialogTitle>
            <DialogDescription>
              Update the invoice details below.
            </DialogDescription>
          </DialogHeader>
          {editingInvoice && (
            <div className="grid gap-3 sm:gap-4 py-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editIssueDate">Issue Date</Label>
                  <Popover open={editIssueDatePopoverOpen} onOpenChange={setEditIssueDatePopoverOpen}>
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
                        onSelect={handleEditIssueDateSelect}
                        disabled={(date) => {
                          return !isDateValid(date);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editDueDate">Due Date</Label>
                  <Popover open={editDueDatePopoverOpen} onOpenChange={setEditDueDatePopoverOpen}>
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
                        onSelect={handleEditDueDateSelect}
                        disabled={(date) => {
                          if (!isDateValid(date)) return true;
                          if (invoiceDate && !isDueDateValid(date, invoiceDate)) return true;
                          return false;
                        }}
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
              <div className="space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                  <Label htmlFor="editLineItems" className="text-sm sm:text-base">Line Items</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingInvoice(prev => prev ? {
                        ...prev,
                        items: [...prev.items, { description: '', quantity: 1, unitPrice: 0, amount: 0 }]
                      } : null);
                    }}
                    className="gap-2 w-full sm:w-auto"
                  >
                    <Plus className="h-4 w-4" /> Add Item
                  </Button>
                </div>
                <div className="space-y-3 sm:space-y-4">
                  {editingInvoice?.items.map((item, index) => (
                    <Card key={index} className="p-3 sm:p-4">
                      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 sm:gap-4">
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

                              // Calculate subtotal
                              const subtotal = newItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
                              
                              // Calculate VAT and total
                              const vatAmount = editingInvoice.vat_enabled ? Number((subtotal * (editingInvoice.vat_rate / 100)).toFixed(2)) : 0;
                              const total = subtotal + vatAmount;
                              
                              setEditingInvoice(prev => prev ? {
                                ...prev,
                                items: newItems,
                                subtotal: Number(subtotal.toFixed(2)),
                                vat_amount: vatAmount,
                                total: Number(total.toFixed(2)),
                                amount: Number(total.toFixed(2))
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
                          className="mt-2 text-red-500 hover:text-red-600 hover:bg-red-50 w-full sm:w-auto"
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
                    <div className="text-center py-4 sm:py-6 border-2 border-dashed rounded-lg">
                      <FileQuestion className="h-6 w-6 sm:h-8 sm:w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-xs sm:text-sm text-muted-foreground">No line items added yet</p>
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
              
              {/* VAT Section for Edit */}
              <Card className="p-3 sm:p-4">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                    <h3 className="text-base sm:text-lg font-semibold">VAT Settings</h3>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="edit-vat-enabled" className="text-xs sm:text-sm font-medium">Enable VAT</Label>
                      <input
                        id="edit-vat-enabled"
                        type="checkbox"
                        checked={editingInvoice?.vat_enabled || false}
                        onChange={(e) => {
                          const enabled = e.target.checked;
                          if (editingInvoice) {
                            const vatAmount = enabled ? Number((editingInvoice.subtotal * (editingInvoice.vat_rate / 100)).toFixed(2)) : 0;
                            const total = editingInvoice.subtotal + vatAmount;
                            setEditingInvoice({
                              ...editingInvoice,
                              vat_enabled: enabled,
                              vat_amount: vatAmount,
                              total: Number(total.toFixed(2)),
                              amount: Number(total.toFixed(2))
                            });
                          }
                        }}
                        className="h-4 w-4"
                      />
                    </div>
                  </div>
                  
                  {editingInvoice?.vat_enabled && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-vat-rate" className="text-xs sm:text-sm font-medium">VAT Rate (%)</Label>
                        <Select
                          value={editingInvoice?.vat_rate?.toString() || "20"}
                          onValueChange={(value) => {
                            if (editingInvoice) {
                              const rate = Number(value);
                              const vatAmount = Number((editingInvoice.subtotal * (rate / 100)).toFixed(2));
                              const total = editingInvoice.subtotal + vatAmount;
                              setEditingInvoice({
                                ...editingInvoice,
                                vat_rate: rate,
                                vat_amount: vatAmount,
                                total: Number(total.toFixed(2)),
                                amount: Number(total.toFixed(2))
                              });
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">0%</SelectItem>
                            <SelectItem value="5">5%</SelectItem>
                            <SelectItem value="10">10%</SelectItem>
                            <SelectItem value="20">20%</SelectItem>
                            <SelectItem value="25">25%</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs sm:text-sm font-medium">VAT Amount (€)</Label>
                        <Input
                          value={editingInvoice?.vat_amount?.toFixed(2) || "0.00"}
                          readOnly
                          className="bg-muted"
                        />
                      </div>
                    </div>
                  )}

                  {/* Summary for Edit */}
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span className="font-medium">€{editingInvoice?.subtotal?.toFixed(2) || editingInvoice?.amount?.toFixed(2) || "0.00"}</span>
                    </div>
                    {editingInvoice?.vat_enabled && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">VAT ({editingInvoice.vat_rate}%):</span>
                        <span className="font-medium">€{editingInvoice.vat_amount?.toFixed(2) || "0.00"}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-semibold border-t pt-2">
                      <span>Total:</span>
                      <span>€{editingInvoice?.total?.toFixed(2) || editingInvoice?.amount?.toFixed(2) || "0.00"}</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button type="submit" onClick={handleEditInvoice} className="w-full sm:w-auto">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
 