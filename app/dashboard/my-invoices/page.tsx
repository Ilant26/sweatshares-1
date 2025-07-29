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
import { safeFormatDate } from '@/lib/utils';
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
import { EscrowStatusBadge } from '@/components/escrow-status-badge';
import { EscrowWorkInterface } from '@/components/escrow-work-interface';
import { InvoiceEscrowPaymentDialog } from '@/components/invoice-escrow-payment-dialog';

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
  AlertCircle,
  Loader2,
  RefreshCw,
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
  // Remove duplicates by ID first, keeping the latest version
  const uniqueInvoices = invoices.reduce((acc, current) => {
    const existing = acc.find(item => item.id === current.id);
    if (!existing) {
      acc.push(current);
    } else {
      // Keep the one with the most recent updated_at/created_at
      const currentDate = new Date(current.updated_at || current.created_at).getTime();
      const existingDate = new Date(existing.updated_at || existing.created_at).getTime();
      if (currentDate > existingDate) {
        const index = acc.indexOf(existing);
        acc[index] = current;
      }
    }
    return acc;
  }, [] as Invoice[]);

  // Sort by updated_at or created_at descending
  const sorted = [...uniqueInvoices].sort((a, b) => {
    const aDate = new Date(a.updated_at || a.created_at).getTime();
    const bDate = new Date(b.updated_at || b.created_at).getTime();
    return bDate - aDate;
  });
  
  return sorted.slice(0, 6).map((inv, index) => {
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
        id: `${inv.id}-paid-${index}`,
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
        id: `${inv.id}-cancelled-${index}`,
        action: 'cancelled',
        document: `Invoice ${inv.invoice_number}`,
        client: getProperFullName(inv, inv.sender_id === userId),
        time: inv.updated_at || inv.created_at,
      };
    }
    if (inv.status === 'pending' && inv.created_at) {
      return {
        id: `${inv.id}-created-${index}`,
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
  const [filterPeriod, setFilterPeriod] = useState('All Time');
  const [sortBy, setSortBy] = useState('Date (newest)');
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
    items: [{ description: '', quantity: 1, unitPrice: 0, amount: 0 }] as InvoiceItem[], // Start with one empty line item
    notes: '',
    vat_enabled: false,
    vat_rate: 20,
    vat_amount: 0,
    subtotal: 0,
    total: 0,
    paymentMethod: 'standard' as 'standard' | 'escrow',
    // Escrow-specific fields
    transactionType: 'work' as 'work' | 'business_sale' | 'partnership' | 'service' | 'consulting' | 'investment' | 'other',
    completionDeadlineDays: 30,
    reviewPeriodDays: 7,
    escrowTerms: ''
  });
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [isLoadingUserProfile, setIsLoadingUserProfile] = useState(false);
  const [messageUserProfile, setMessageUserProfile] = useState<{ id: string; name: string } | null>(null);
  const { toast } = useToast();
  const [senderProfileCache, setSenderProfileCache] = useState<Record<string, { full_name: string; avatar_url: string | null; username: string }>>({});
  const [recipientProfileCache, setRecipientProfileCache] = useState<Record<string, { full_name: string; avatar_url: string | null; username: string }>>({});
  const [escrowTransactions, setEscrowTransactions] = useState<Record<string, any>>({});
  const [escrowPaymentDialogOpen, setEscrowPaymentDialogOpen] = useState(false);
  const [selectedEscrowInvoice, setSelectedEscrowInvoice] = useState<Invoice | null>(null);
  const [stripeConnectStatus, setStripeConnectStatus] = useState<'checking' | 'connected' | 'not_connected' | 'error'>('checking');

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
    
    // Period filtering
    let matchesPeriod = true;
    if (filterPeriod !== 'All Time') {
      const invoiceDate = new Date(invoice.created_at);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24));
      
      switch (filterPeriod) {
        case 'Last 30 Days':
          matchesPeriod = daysDiff <= 30;
          break;
        case 'Last 3 Months':
          matchesPeriod = daysDiff <= 90;
          break;
        case 'Last 6 Months':
          matchesPeriod = daysDiff <= 180;
          break;
        case 'Last Year':
          matchesPeriod = daysDiff <= 365;
          break;
        default:
          matchesPeriod = true;
      }
    }
    
    return matchesTab && matchesSearch && matchesStatus && matchesPeriod;
  });

  // Sort the filtered invoices
  const sortedInvoices = [...filteredInvoices].sort((a, b) => {
    switch (sortBy) {
      case 'Date (newest)':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'Date (oldest)':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'Amount (asc)':
        return (a.total || a.amount) - (b.total || b.amount);
      case 'Amount (desc)':
        return (b.total || b.amount) - (a.total || a.amount);
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  // Calculate counts for each tab
  const sentInvoicesCount = invoices.filter(invoice => invoice.sender_id === user?.id).length;
  const receivedInvoicesCount = invoices.filter(invoice => invoice.receiver_id === user?.id).length;

  // Pagination logic
  const indexOfLastInvoice = currentPage * invoicesPerPage;
  const indexOfFirstInvoice = indexOfLastInvoice - invoicesPerPage;
  const currentInvoices = sortedInvoices.slice(indexOfFirstInvoice, indexOfLastInvoice);
  const totalPages = Math.ceil(sortedInvoices.length / invoicesPerPage);

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

        // Fetch network contacts (connections) - both sent and received
        const { data: connections, error: connectionsError } = await supabase
          .from('connections')
          .select(`
            *,
            sender:sender_id(id, username, full_name, avatar_url),
            receiver:receiver_id(id, username, full_name, avatar_url)
          `)
          .eq('status', 'accepted')
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

        if (connectionsError) {
          console.error('Error fetching connections:', connectionsError);
        }

        if (connections) {
          const networkContactsList = connections.map(conn => {
            // Determine which user is the other person (not the current user)
            const otherUser = conn.sender_id === user.id ? conn.receiver : conn.sender;
            return {
              id: otherUser.id,
              name: otherUser.full_name || otherUser.username
            };
          });
          setNetworkContacts(networkContactsList);
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

        // Check Stripe Connect status
        await checkStripeConnectStatus();
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  
  useEffect(() => {
    if (!user || stripeConnectStatus === 'connected') return;

    const interval = setInterval(() => {
      checkStripeConnectStatus();
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [user, stripeConnectStatus]);

  // Refresh invoice data when window gains focus (useful when returning from escrow payment)
  useEffect(() => {
    const handleFocus = async () => {
      if (!user) return;
      
      console.log('Window focused, refreshing invoice data...');
      try {
        // Refresh invoices data
        const refreshedInvoices = await getInvoices(user.id);
        setInvoices(refreshedInvoices);
      } catch (error) {
        console.error('Error refreshing invoice data on focus:', error);
      }
    };

    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
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
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create an invoice.",
        variant: "destructive",
      });
      return;
    }

    // Validate required fields
    if (!invoiceDate) {
      toast({
        title: "Missing Required Field",
        description: "Please select an issue date.",
        variant: "destructive",
      });
      return;
    }

    if (!dueDate) {
      toast({
        title: "Missing Required Field",
        description: "Please select a due date.",
        variant: "destructive",
      });
      return;
    }

    if (!newInvoice.client) {
      toast({
        title: "Missing Required Field",
        description: "Please select a client.",
        variant: "destructive",
      });
      return;
    }

    if (newInvoice.items.length === 0) {
      toast({
        title: "Missing Required Field",
        description: "Please add at least one line item.",
        variant: "destructive",
      });
      return;
    }

    // Validate line items
    for (let i = 0; i < newInvoice.items.length; i++) {
      const item = newInvoice.items[i];
      if (!item.description.trim()) {
        toast({
          title: "Missing Required Field",
          description: `Please enter a description for line item ${i + 1}.`,
          variant: "destructive",
        });
        return;
      }
      if (!item.quantity || item.quantity <= 0) {
        toast({
          title: "Missing Required Field",
          description: `Please enter a valid quantity for line item ${i + 1}.`,
          variant: "destructive",
        });
        return;
      }
      if (!item.unitPrice || item.unitPrice <= 0) {
        toast({
          title: "Missing Required Field",
          description: `Please enter a valid unit price for line item ${i + 1}.`,
          variant: "destructive",
        });
        return;
      }
    }

    // Check if Stripe Connect is required for escrow invoices
    if (newInvoice.paymentMethod === 'escrow') {
      if (stripeConnectStatus !== 'connected') {
        toast({
          title: "Stripe Connect Required",
          description: "You must connect your Stripe account to create escrow invoices. Please complete the Stripe Connect setup first.",
          variant: "destructive",
        });
        return;
      }
      
      // Double-check with Stripe API to ensure account is truly active
      try {
        const { data: connectAccount } = await supabase
          .from('stripe_connect_accounts')
          .select('*')
          .eq('user_id', user.id)
          .single();
          
        if (connectAccount) {
          const response = await fetch('/api/stripe/connect/verify-status', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              stripeAccountId: connectAccount.stripe_account_id
            }),
          });

          if (response.ok) {
            const { accountStatus } = await response.json();
            if (!accountStatus.charges_enabled || !accountStatus.details_submitted) {
              toast({
                title: "Stripe Connect Setup Incomplete",
                description: "Your Stripe Connect account needs to complete verification. Please finish the setup process first.",
                variant: "destructive",
              });
              return;
            }
          } else {
            toast({
              title: "Stripe Connect Verification Failed",
              description: "Unable to verify your Stripe Connect status. Please try again or contact support.",
              variant: "destructive",
            });
            return;
          }
        }
      } catch (error) {
        console.error('Error verifying Stripe Connect status:', error);
        toast({
          title: "Stripe Connect Verification Error",
          description: "Unable to verify your Stripe Connect status. Please try again.",
          variant: "destructive",
        });
        return;
      }
    }

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

      // If this is an escrow invoice, create the escrow transaction
      if (newInvoice.paymentMethod === 'escrow') {
        try {
          const escrowResponse = await fetch('/api/escrow/create-transaction', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              invoiceId: createdInvoice.id,
              amount: createdInvoice.total,
              transactionType: newInvoice.transactionType,
              payerId: clientType === 'network' ? newInvoice.client : undefined,
              description: newInvoice.escrowTerms,
              customTimeline: {
                completion_deadline_days: newInvoice.completionDeadlineDays,
                review_period_days: newInvoice.reviewPeriodDays
              }
            }),
          });

          if (!escrowResponse.ok) {
            throw new Error('Failed to create escrow transaction');
          }

          const escrowData = await escrowResponse.json();
          console.log('Escrow transaction created:', escrowData);
        } catch (escrowError) {
          console.error('Error creating escrow transaction:', escrowError);
          // Continue with invoice creation even if escrow fails
        }
      }

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
          invoice_id: createdInvoice.id,
          payment_method: newInvoice.paymentMethod
        };
        await sendMessage(invoiceData.receiver_id, JSON.stringify(invoiceMsg));
      }

      // Show success message based on payment method
      const successMessages = {
        standard: 'Invoice created successfully!',
        escrow: 'Escrow invoice created successfully! The client will receive a secure payment link.'
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
      items: [{ description: '', quantity: 1, unitPrice: 0, amount: 0 }], // Start with one empty line item
      notes: '',
      vat_enabled: false,
      vat_rate: 20,
      vat_amount: 0,
      subtotal: 0,
      total: 0,
      paymentMethod: 'standard',
      // Reset escrow fields
      transactionType: 'work',
      completionDeadlineDays: 30,
      reviewPeriodDays: 7,
      escrowTerms: ''
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

  const handleViewInvoice = (invoice: Invoice) => {
    setViewingInvoice(invoice);
    setViewDialogOpen(true);
    
    // Fetch escrow transaction data if it's an escrow invoice
    if (invoice.payment_method === 'escrow') {
      fetchEscrowTransaction(invoice.id);
    }
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
    // Check if this is an escrow invoice
    if (invoice.payment_method === 'escrow') {
      // For escrow invoices, navigate to the dedicated payment page
      router.push(`/dashboard/escrow-payment/${invoice.id}`);
      return;
    }

    // For non-escrow invoices, use the existing payment flow
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

  const handleViewEscrow = (invoice: Invoice) => {
    router.push(`/dashboard/escrow-work/${invoice.id}`);
  };

  const handleEscrowPaymentSuccess = async () => {
    if (selectedEscrowInvoice) {
      // Refresh invoices and escrow transactions
      const updatedInvoices = await getInvoices(user?.id || '');
      setInvoices(updatedInvoices);
      
      // Fetch the updated escrow transaction
      await fetchEscrowTransaction(selectedEscrowInvoice.id);
      
      toast({
        title: "Escrow Payment Successful",
        description: `Payment for invoice ${selectedEscrowInvoice.invoice_number} has been processed and funds are held in escrow.`,
      });
    }
    
    setEscrowPaymentDialogOpen(false);
    setSelectedEscrowInvoice(null);
  };

  const checkStripeConnectStatus = async () => {
    if (!user) return;
    
    setStripeConnectStatus('checking');
    
    try {
      const { data: connectAccount, error } = await supabase
        .from('stripe_connect_accounts')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error checking Stripe Connect status:', error);
        setStripeConnectStatus('error');
        return;
      }

      if (connectAccount) {
        // Verify the account status with Stripe's API to ensure we have the latest status
        try {
          const response = await fetch('/api/stripe/connect/verify-status', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              stripeAccountId: connectAccount.stripe_account_id
            }),
          });

          if (response.ok) {
            const { accountStatus } = await response.json();
            
            // Update local status based on Stripe's response
            if (accountStatus.charges_enabled && accountStatus.details_submitted) {
              const wasConnected = stripeConnectStatus === 'connected';
              setStripeConnectStatus('connected');
              
              // Update the database with the latest status
              await supabase
                .from('stripe_connect_accounts')
                .update({
                  account_status: 'active',
                  onboarding_completed: true,
                  charges_enabled: true,
                  payouts_enabled: accountStatus.payouts_enabled || false,
                  updated_at: new Date().toISOString()
                })
                .eq('user_id', user.id);
              
              // Show success message if this is a new connection
              if (!wasConnected) {
                toast({
                  title: "Stripe Connect Setup Complete!",
                  description: "Your account is now ready to receive escrow payments.",
                });
              }
            } else {
              setStripeConnectStatus('not_connected');
              
              // Update the database with the current status
              await supabase
                .from('stripe_connect_accounts')
                .update({
                  account_status: accountStatus.charges_enabled ? 'pending' : 'pending',
                  onboarding_completed: accountStatus.details_submitted || false,
                  charges_enabled: accountStatus.charges_enabled || false,
                  payouts_enabled: accountStatus.payouts_enabled || false,
                  updated_at: new Date().toISOString()
                })
                .eq('user_id', user.id);
            }
          } else {
            // Fallback to local database status if API call fails
            if (connectAccount.charges_enabled && connectAccount.onboarding_completed) {
              setStripeConnectStatus('connected');
            } else {
              setStripeConnectStatus('not_connected');
            }
          }
        } catch (apiError) {
          console.error('Error verifying with Stripe API:', apiError);
          // Fallback to local database status
          if (connectAccount.charges_enabled && connectAccount.onboarding_completed) {
            setStripeConnectStatus('connected');
          } else {
            setStripeConnectStatus('not_connected');
          }
        }
      } else {
        setStripeConnectStatus('not_connected');
      }
    } catch (error) {
      console.error('Error checking Stripe Connect status:', error);
      setStripeConnectStatus('error');
    }
  };

  const handleStripeConnect = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to connect your Stripe account.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/stripe/connect/create-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create Stripe Connect account');
      }

      // If account is already active, no need to redirect
      if (data.status === 'active') {
        setStripeConnectStatus('connected');
        toast({
          title: "Stripe Connect Ready",
          description: "Your Stripe account is already connected and ready to use!",
        });
        return;
      }

      // Redirect to Stripe Connect onboarding
      window.location.href = data.accountLink;

    } catch (error) {
      console.error('Error creating Stripe Connect account:', error);
      toast({
        title: "Error",
        description: "Failed to create Stripe Connect account. Please try again.",
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

  // Helper to fetch escrow transaction data
  async function fetchEscrowTransaction(invoiceId: string) {
    if (escrowTransactions[invoiceId]) {
      return escrowTransactions[invoiceId];
    }

    const { data: escrowTransaction, error } = await supabase
      .from('escrow_transactions')
      .select('*')
      .eq('invoice_id', invoiceId)
      .single();

    if (escrowTransaction && !error) {
      setEscrowTransactions(prev => ({ ...prev, [invoiceId]: escrowTransaction }));
      return escrowTransaction;
    }

    return null;
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
    const paymentParam = searchParams.get('payment');
    
    if (tabParam === 'received') setActiveTab('received');
    
    // Check if user returned from Stripe Connect onboarding
    if (paymentParam === 'success') {
      // Show success message and refresh Stripe Connect status
      toast({
        title: "Welcome Back!",
        description: "Checking your Stripe Connect status...",
      });
      
      // Refresh Stripe Connect status after a short delay
      setTimeout(async () => {
        await checkStripeConnectStatus();
        
        // Show success message if now connected
        if (stripeConnectStatus === 'connected') {
          toast({
            title: "Stripe Connect Setup Complete!",
            description: "Your account is now ready to receive escrow payments.",
          });
        }
      }, 1000);
    }
    
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
  }, [searchParams]);

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

  // Reset current page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, filterPeriod, sortBy, searchTerm, activeTab]);

  // Handle filter changes with page reset
  const handleFilterStatusChange = (status: string) => {
    setFilterStatus(status);
    setCurrentPage(1);
  };

  const handleFilterPeriodChange = (period: string) => {
    setFilterPeriod(period);
    setCurrentPage(1);
  };

  const handleSortByChange = (sort: string) => {
    setSortBy(sort);
    setCurrentPage(1);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }



  return (
    <div className="flex-1 space-y-6 p-4 sm:p-8 pt-6">
      {/* Header Section */}
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <ReceiptText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Invoice Management</h1>
              <p className="text-sm text-muted-foreground">Create, manage, and track your invoices</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Dialog open={newInvoiceDialogOpen} onOpenChange={(open) => {
              setNewInvoiceDialogOpen(open);
              if (!open) {
                setMessageUserProfile(null); // Clear message user profile when dialog closes
              }
            }}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">New Invoice</span>
                  <span className="sm:hidden">New</span>
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
                  {/* Required Fields Note */}
                  <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md border">
                    <span className="text-red-500 font-medium">*</span> Required fields
                  </div>
                  
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
                          <Label htmlFor="client" className="text-xs sm:text-sm font-medium">
                            Select Client <span className="text-red-500">*</span>
                          </Label>
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
                          <Label htmlFor="issueDate" className="text-xs sm:text-sm font-medium">
                            Issue Date <span className="text-red-500">*</span>
                          </Label>
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
                          <Label htmlFor="dueDate" className="text-xs sm:text-sm font-medium">
                            Due Date <span className="text-red-500">*</span>
                          </Label>
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
                                <Label htmlFor={`item-description-${index}`} className="text-xs sm:text-sm font-medium">
                                  Description <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                  id={`item-description-${index}`}
                                  placeholder="e.g., Web Development"
                                  value={item.description}
                                  onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`item-quantity-${index}`} className="text-xs sm:text-sm font-medium">
                                  Quantity <span className="text-red-500">*</span>
                                </Label>
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
                                <Label htmlFor={`item-price-${index}`} className="text-xs sm:text-sm font-medium">
                                  Unit Price (€) <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                  id={`item-price-${index}`}
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder="0.00"
                                  value={item.unitPrice}
                                  onChange={(e) => handleLineItemChange(index, 'unitPrice', Number(e.target.value))}
                                  className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                            {newInvoice.items.length > 1 && (
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
                            onChange={(e) => setNewInvoice(prev => ({ ...prev, paymentMethod: e.target.value as 'standard' | 'escrow' }))}
                            className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                          />
                          <Label htmlFor="payment-escrow" className="text-sm font-medium cursor-pointer flex-1">
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4 text-muted-foreground" />
                              Secure Payment
                            </div>
                            <p className="text-xs text-muted-foreground font-normal mt-1">
                              Secure payment held in escrow until work is completed and approved
                            </p>
                          </Label>
                        </div>
                        
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
                            onChange={(e) => setNewInvoice(prev => ({ ...prev, paymentMethod: e.target.value as 'standard' | 'escrow' }))}
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
                      </div>
                    </div>
                  </Card>

                  {/* Escrow Configuration Section - Only show when escrow is selected */}
                  {newInvoice.paymentMethod === 'escrow' && (
                    <Card className="p-3 sm:p-4 border-primary/20 bg-primary/5">
                      <div className="space-y-3 sm:space-y-4">
                        <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                          <Shield className="h-5 w-5 text-primary" />
                          Escrow Configuration
                        </h3>
                        
                        {/* Transaction Type Selection */}
                        <div className="space-y-2">
                          <Label htmlFor="transactionType" className="text-xs sm:text-sm font-medium">
                            Transaction Type
                          </Label>
                          <Select
                            value={newInvoice.transactionType || 'work'}
                            onValueChange={(value) => setNewInvoice(prev => ({ 
                              ...prev, 
                              transactionType: value as 'work' | 'business_sale' | 'partnership' | 'service' | 'consulting' | 'investment' | 'other'
                            }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select transaction type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="work">Work & Services</SelectItem>
                              <SelectItem value="business_sale">Business Sale</SelectItem>
                              <SelectItem value="partnership">Partnership</SelectItem>
                              <SelectItem value="service">Service</SelectItem>
                              <SelectItem value="consulting">Consulting</SelectItem>
                              <SelectItem value="investment">Investment</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Timeline Configuration */}
                        <div className="space-y-2">
                          <Label className="text-xs sm:text-sm font-medium">Timeline Configuration</Label>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label htmlFor="completionDeadline" className="text-xs">Completion Deadline (days)</Label>
                              <Input
                                id="completionDeadline"
                                type="number"
                                min="7"
                                max="180"
                                value={newInvoice.completionDeadlineDays || 30}
                                onChange={(e) => setNewInvoice(prev => ({ 
                                  ...prev, 
                                  completionDeadlineDays: parseInt(e.target.value) || 30
                                }))}
                                className="text-sm"
                              />
                            </div>
                            <div>
                              <Label htmlFor="reviewPeriod" className="text-xs">Review Period (days)</Label>
                              <Input
                                id="reviewPeriod"
                                type="number"
                                min="3"
                                max="30"
                                value={newInvoice.reviewPeriodDays || 7}
                                onChange={(e) => setNewInvoice(prev => ({ 
                                  ...prev, 
                                  reviewPeriodDays: parseInt(e.target.value) || 7
                                }))}
                                className="text-sm"
                              />
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Total escrow duration: {(newInvoice.completionDeadlineDays || 30) + (newInvoice.reviewPeriodDays || 7)} days
                          </p>
                        </div>

                        {/* Escrow Terms */}
                        <div className="space-y-2">
                          <Label htmlFor="escrowTerms" className="text-xs sm:text-sm font-medium">
                            Escrow Terms & Conditions
                          </Label>
                          <Textarea
                            id="escrowTerms"
                            placeholder="Describe the work to be completed and any specific requirements..."
                            value={newInvoice.escrowTerms || ''}
                            onChange={(e) => setNewInvoice(prev => ({ ...prev, escrowTerms: e.target.value }))}
                            className="min-h-[80px] text-sm"
                          />
                        </div>

                        {/* Platform Fee Information */}
                        <div className="p-3 bg-muted rounded-lg">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">Platform Fee:</span>
                            <span className="text-primary font-semibold">5% </span>
                          </div>
                          <div className="flex items-center justify-between text-sm mt-1">
                            <span>You will receive:</span>
                            <span className="font-semibold">
                              €{((newInvoice.amount || 0) * 0.95).toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Stripe Connect Setup */}
                        {stripeConnectStatus === 'checking' && (
                          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
                              <span className="text-sm text-blue-700 font-medium">Verifying Stripe Connect status...</span>
                            </div>
                            <p className="text-xs text-blue-600 mt-2">
                              This may take a few moments while we check with Stripe.
                            </p>
                          </div>
                        )}



                        {stripeConnectStatus === 'checking' && (
                          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-blue-900 mb-2">Checking Stripe Connect Status</h4>
                                <p className="text-sm text-blue-700 mb-3">
                                  Please wait while we check your Stripe Connect account status...
                                </p>
                                <div className="flex gap-2">
                                  <Button 
                                    onClick={handleStripeConnect}
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                    size="sm"
                                    disabled={true}
                                  >
                                    <CreditCard className="h-4 w-4 mr-2" />
                                    Connect Stripe Account
                                  </Button>
                                  <Button 
                                    onClick={checkStripeConnectStatus}
                                    variant="outline"
                                    size="sm"
                                    disabled={true}
                                    className="border-blue-300 text-blue-700 hover:bg-blue-100"
                                  >
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    Checking...
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {stripeConnectStatus === 'not_connected' && (
                          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                <CreditCard className="h-5 w-5 text-blue-600" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-blue-900 mb-2">Stripe Connect Required</h4>
                                <p className="text-sm text-blue-700 mb-3">
                                  To receive escrow payments, you need to connect your Stripe account. This allows us to securely transfer funds to your account when work is completed.
                                </p>
                                <div className="flex gap-2">
                                  <Button 
                                    onClick={handleStripeConnect}
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                    size="sm"
                                    disabled={false}
                                  >
                                    <CreditCard className="h-4 w-4 mr-2" />
                                    Connect Stripe Account
                                  </Button>
                                  <Button 
                                    onClick={checkStripeConnectStatus}
                                    variant="outline"
                                    size="sm"
                                    disabled={false}
                                    className="border-blue-300 text-blue-700 hover:bg-blue-100"
                                  >
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Refresh Status
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}



                        {stripeConnectStatus === 'error' && (
                          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-red-100 rounded-lg">
                                <AlertCircle className="h-5 w-5 text-red-600" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-red-900 mb-2">Connection Error</h4>
                                <p className="text-sm text-red-700 mb-3">
                                  There was an error checking your Stripe Connect status. Please try again or contact support.
                                </p>
                                <Button 
                                  onClick={checkStripeConnectStatus}
                                  variant="outline"
                                  size="sm"
                                  className="border-red-300 text-red-700 hover:bg-red-100"
                                >
                                  <AlertCircle className="h-4 w-4 mr-2" />
                                  Retry
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  )}
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button variant="outline" onClick={() => setNewInvoiceDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" onClick={handleCreateInvoice} className="gap-2">
                    {newInvoice.paymentMethod === 'escrow' ? (
                      <Shield className="h-4 w-4" />
                    ) : (
                      <FileText className="h-4 w-4" />
                    )}
                    {newInvoice.paymentMethod === 'escrow' ? 'Create Secure Payment' : 'Create Invoice'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
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
                    Period: {filterPeriod} <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleFilterPeriodChange('All Time')}>All Time</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleFilterPeriodChange('Last 30 Days')}>Last 30 Days</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleFilterPeriodChange('Last 3 Months')}>Last 3 Months</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleFilterPeriodChange('Last 6 Months')}>Last 6 Months</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleFilterPeriodChange('Last Year')}>Last Year</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2 w-full sm:w-auto">
                    Status: {filterStatus} <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleFilterStatusChange('All')}>All</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleFilterStatusChange('Paid')}>Paid</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleFilterStatusChange('Pending')}>Pending</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleFilterStatusChange('Cancelled')}>Cancelled</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleFilterStatusChange('Overdue')}>Overdue</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2 w-full sm:w-auto">
                    Sort by: {sortBy} <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleSortByChange('Date (newest)')}>Date (newest)</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSortByChange('Date (oldest)')}>Date (oldest)</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSortByChange('Amount (asc)')}>Amount (asc)</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSortByChange('Amount (desc)')}>Amount (desc)</DropdownMenuItem>
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
                      <div className="flex items-center gap-1">
                      <Badge variant={getStatusBadgeVariant(invoice.status)} className="text-xs">
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </Badge>
                        {invoice.payment_method === 'escrow' && (
                          <EscrowStatusBadge invoiceId={invoice.id} />
                        )}
                      </div>
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
                            <Link
                              href={`/dashboard/profile/${invoice.receiver_id}`}
                              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                              legacyBehavior>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={recipient.avatar_url || undefined} />
                                  <AvatarFallback>{(recipient.full_name || recipient.username || '?')[0]}</AvatarFallback>
                                </Avatar>
                                <span className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium">{recipient.full_name || recipient.username}</span>
                              </div>
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
                        <div className="flex gap-1">
                        <Button 
                          variant="default" 
                          size="sm" 
                          onClick={() => handlePayInvoice(invoice)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CreditCard className="h-4 w-4 mr-1" />
                          Pay
                          </Button>

                        </div>
                      )}
                      {invoice.payment_method === 'escrow' && invoice.status === 'paid' && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleViewEscrow(invoice)}
                          className="border-blue-300 text-blue-700 hover:bg-blue-50"
                        >
                          <Shield className="h-4 w-4 mr-1" />
                          View Escrow
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => handleDownloadPDF(invoice)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => activeTab === 'received' ? handleViewInvoice(invoice) : handleStartEdit(invoice)}>
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
                            <Link
                              href={`/dashboard/profile/${invoice.receiver_id}`}
                              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                              legacyBehavior>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={recipient.avatar_url || undefined} />
                                  <AvatarFallback>{(recipient.full_name || recipient.username || '?')[0]}</AvatarFallback>
                                </Avatar>
                                <span className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium">{recipient.full_name || recipient.username}</span>
                              </div>
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
                        <div className="flex items-center gap-2">
                        <Badge variant={getStatusBadgeVariant(invoice.status)}>
                          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        </Badge>
                          {invoice.payment_method === 'escrow' && (
                            <EscrowStatusBadge invoiceId={invoice.id} />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {/* Desktop view: Icons + Dropdown */}
                        <div className="hidden md:flex items-center justify-end gap-1">
                          {activeTab === 'received' && invoice.status === 'pending' && (
                            <div className="flex gap-1">
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

                            </div>
                          )}
                          {invoice.payment_method === 'escrow' && invoice.status === 'paid' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewEscrow(invoice);
                              }}
                              className="border-blue-300 text-blue-700 hover:bg-blue-50"
                            >
                              <Shield className="h-4 w-4 mr-1" />
                              View Escrow
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              activeTab === 'received' ? handleViewInvoice(invoice) : handleStartEdit(invoice);
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
                              {invoice.payment_method === 'escrow' && invoice.status === 'paid' && (
                                <DropdownMenuItem onClick={() => handleViewEscrow(invoice)}>
                                  <Shield className="mr-2 h-4 w-4" />
                                  <span>View Escrow</span>
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
              Showing {indexOfFirstInvoice + 1}-{Math.min(indexOfLastInvoice, sortedInvoices.length)} of {sortedInvoices.length} invoices.
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
                  Period: {filterPeriod} <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleFilterPeriodChange('All Time')}>All Time</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleFilterPeriodChange('Last 30 Days')}>Last 30 Days</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleFilterPeriodChange('Last 3 Months')}>Last 3 Months</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleFilterPeriodChange('Last 6 Months')}>Last 6 Months</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleFilterPeriodChange('Last Year')}>Last Year</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  Status: {filterStatus} <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleFilterStatusChange('All')}>All</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleFilterStatusChange('Paid')}>Paid</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleFilterStatusChange('Pending')}>Pending</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleFilterStatusChange('Cancelled')}>Cancelled</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleFilterStatusChange('Overdue')}>Overdue</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  Sort by: {sortBy} <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleSortByChange('Date (newest)')}>Date (newest)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSortByChange('Date (oldest)')}>Date (oldest)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSortByChange('Amount (asc)')}>Amount (asc)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSortByChange('Amount (desc)')}>Amount (desc)</DropdownMenuItem>
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
                            <Link
                              href={`/dashboard/profile/${invoice.sender_id}`}
                              className="flex items-center gap-2 mt-1 hover:opacity-80 transition-opacity"
                              legacyBehavior>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={sender.avatar_url || undefined} />
                                  <AvatarFallback>{(sender.full_name || sender.username || '?')[0]}</AvatarFallback>
                                </Avatar>
                                <span className="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">{sender.full_name || sender.username}</span>
                              </div>
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
                      {invoice.payment_method === 'escrow' && invoice.status === 'paid' && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleViewEscrow(invoice)}
                          className="border-blue-300 text-blue-700 hover:bg-blue-50"
                        >
                          <Shield className="h-4 w-4 mr-1" />
                          View Escrow
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => handleDownloadPDF(invoice)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => activeTab === 'received' ? handleViewInvoice(invoice) : handleStartEdit(invoice)}>
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
                            <Link
                              href={`/dashboard/profile/${invoice.sender_id}`}
                              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                              legacyBehavior>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={sender.avatar_url || undefined} />
                                  <AvatarFallback>{(sender.full_name || sender.username || '?')[0]}</AvatarFallback>
                                </Avatar>
                                <span className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium">{sender.full_name || sender.username}</span>
                              </div>
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
                          {invoice.payment_method === 'escrow' && invoice.status === 'paid' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewEscrow(invoice);
                              }}
                              className="border-blue-300 text-blue-700 hover:bg-blue-50"
                            >
                              <Shield className="h-4 w-4 mr-1" />
                              View Escrow
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              activeTab === 'received' ? handleViewInvoice(invoice) : handleStartEdit(invoice);
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
                              {invoice.payment_method === 'escrow' && invoice.status === 'paid' && (
                                <DropdownMenuItem onClick={() => handleViewEscrow(invoice)}>
                                  <Shield className="mr-2 h-4 w-4" />
                                  <span>View Escrow</span>
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
              Showing {indexOfFirstInvoice + 1}-{Math.min(indexOfLastInvoice, sortedInvoices.length)} of {sortedInvoices.length} invoices.
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
            <div className="grid grid-cols-3 gap-4">
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

              <Card className={`relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-300 group animate-in slide-in-from-bottom-2 delay-400 ${
                stripeConnectStatus === 'connected' 
                  ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20' 
                  : 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20'
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-1.5 rounded-lg group-hover:scale-110 transition-transform duration-300 ${
                      stripeConnectStatus === 'connected' 
                        ? 'bg-green-100 dark:bg-green-900/30' 
                        : 'bg-blue-100 dark:bg-blue-900/30'
                    }`}>
                      {stripeConnectStatus === 'connected' ? (
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <CreditCard className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                    <p className={`text-xs font-medium uppercase tracking-wide ${
                      stripeConnectStatus === 'connected' 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-blue-600 dark:text-blue-400'
                    }`}>
                      Stripe Connect
                    </p>
                  </div>
                  <p className={`text-lg font-bold ${
                    stripeConnectStatus === 'connected' 
                      ? 'text-green-700 dark:text-green-300' 
                      : 'text-blue-700 dark:text-blue-300'
                  }`}>
                    {stripeConnectStatus === 'connected' ? 'Active' : 'Required'}
                  </p>
                  <p className={`text-xs ${
                    stripeConnectStatus === 'connected' 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-blue-600 dark:text-blue-400'
                  }`}>
                    {stripeConnectStatus === 'connected' 
                      ? 'Ready for escrow' 
                      : 'Connect for escrow'
                    }
                  </p>
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
      {/* View Invoice Dialog (Read-only) */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto w-[95vw]">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Invoice Details</DialogTitle>
            <DialogDescription>View invoice details below.</DialogDescription>
          </DialogHeader>
          {viewingInvoice && (
            <div className="grid gap-3 sm:gap-4 py-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label>Client Name</Label>
                  <div className="border rounded px-3 py-2 bg-muted">{getSenderProfile(viewingInvoice)?.full_name || getClientName(viewingInvoice)}</div>
                </div>
                <div className="space-y-2">
                  <Label>Invoice Number</Label>
                  <div className="border rounded px-3 py-2 bg-muted">{viewingInvoice.invoice_number}</div>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label>Issue Date</Label>
                  <div className="border rounded px-3 py-2 bg-muted">{format(new Date(viewingInvoice.issue_date), 'PPP')}</div>
                </div>
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <div className="border rounded px-3 py-2 bg-muted">{format(new Date(viewingInvoice.due_date), 'PPP')}</div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <div className="border rounded px-3 py-2 bg-muted whitespace-pre-line">{viewingInvoice.description || '-'}</div>
              </div>
              <div className="space-y-3 sm:space-y-4">
                <Label className="text-sm sm:text-base">Line Items</Label>
                <div className="space-y-3 sm:space-y-4">
                  {viewingInvoice.items.map((item, index) => (
                    <Card key={index} className="p-3 sm:p-4">
                      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 sm:gap-4">
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <div className="border rounded px-3 py-2 bg-muted">{item.description}</div>
                        </div>
                        <div className="space-y-2">
                          <Label>Quantity</Label>
                          <div className="border rounded px-3 py-2 bg-muted">{item.quantity}</div>
                        </div>
                        <div className="space-y-2">
                          <Label>Unit Price (€)</Label>
                          <div className="border rounded px-3 py-2 bg-muted">{item.unitPrice}</div>
                        </div>
                        <div className="space-y-2">
                          <Label>Amount (€)</Label>
                          <div className="border rounded px-3 py-2 bg-muted">{item.amount}</div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label>Subtotal</Label>
                  <div className="border rounded px-3 py-2 bg-muted">€{viewingInvoice.subtotal?.toFixed(2) || '-'}</div>
                </div>
                <div className="space-y-2">
                  <Label>Total</Label>
                  <div className="border rounded px-3 py-2 bg-muted">€{viewingInvoice.total?.toFixed(2) || viewingInvoice.amount?.toFixed(2) || '-'}</div>
                </div>
              </div>
              {viewingInvoice.vat_enabled && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label>VAT Rate</Label>
                    <div className="border rounded px-3 py-2 bg-muted">{viewingInvoice.vat_rate}%</div>
                  </div>
                  <div className="space-y-2">
                    <Label>VAT Amount</Label>
                    <div className="border rounded px-3 py-2 bg-muted">€{viewingInvoice.vat_amount?.toFixed(2) || '-'}</div>
                  </div>
                </div>
              )}

              {/* Escrow Work Interface */}
              {viewingInvoice.payment_method === 'escrow' && (
                <div className="border-t pt-6">
                  <EscrowWorkInterface
                    invoiceId={viewingInvoice.id}
                    escrowTransaction={escrowTransactions[viewingInvoice.id] || null}
                    userRole={viewingInvoice.sender_id === user?.id ? 'payee' : 'payer'}
                    onUpdate={async () => {
                      // Refresh invoice data and escrow transactions
                      if (user) {
                        const fetchedInvoices = await getInvoices(user.id);
                        setInvoices(fetchedInvoices);
                      }
                      await fetchEscrowTransaction(viewingInvoice.id);
                    }}
                    onPaymentRequest={() => {
                      // Open the payment dialog for this invoice
                      setSelectedEscrowInvoice(viewingInvoice);
                      setEscrowPaymentDialogOpen(true);
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
              <InvoiceEscrowPaymentDialog
          open={escrowPaymentDialogOpen}
          onOpenChange={setEscrowPaymentDialogOpen}
          invoice={selectedEscrowInvoice}
          onSuccess={handleEscrowPaymentSuccess}
        />
    </div>
  );
}
 