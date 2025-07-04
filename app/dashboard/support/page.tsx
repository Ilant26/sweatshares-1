'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/lib/database.types';
import { useUser } from '@/hooks/use-user';
import Link from 'next/link';

import {
  HelpCircle,
  MessageCircle,
  FileText,
  Search,
  Mail,
  Phone,
  Clock,
  CheckCircle,
  AlertCircle,
  Info,
  ExternalLink,
  BookOpen,
  Users,
  Settings,
  CreditCard,
  Shield,
  Lock,
  Globe,
  Smartphone,
  Monitor,
} from 'lucide-react';

interface SupportTicket {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  helpful: number;
  not_helpful: number;
}

const faqCategories = [
  {
    id: 'general',
    name: 'General',
    icon: <Info className="h-4 w-4" />,
    description: 'General questions about the platform'
  },
  {
    id: 'account',
    name: 'Account & Billing',
    icon: <Settings className="h-4 w-4" />,
    description: 'Account management and billing issues'
  },
  {
    id: 'security',
    name: 'Security & Privacy',
    icon: <Shield className="h-4 w-4" />,
    description: 'Security and privacy concerns'
  },
  {
    id: 'technical',
    name: 'Technical Issues',
    icon: <Monitor className="h-4 w-4" />,
    description: 'Technical problems and bugs'
  },
  {
    id: 'features',
    name: 'Features & Usage',
    icon: <BookOpen className="h-4 w-4" />,
    description: 'How to use platform features'
  }
];

const supportChannels = [
  {
    id: 'email',
    name: 'Email Support',
    description: 'Get help via email within 24 hours',
    icon: <Mail className="h-5 w-5" />,
    contact: 'support@sweatshares.com',
    responseTime: '24 hours',
    available: true
  },
  {
    id: 'chat',
    name: 'Live Chat',
    description: 'Chat with our support team in real-time',
    icon: <MessageCircle className="h-5 w-5" />,
    contact: 'Available 9AM-6PM CET',
    responseTime: 'Instant',
    available: true
  },
  {
    id: 'phone',
    name: 'Phone Support',
    description: 'Call us for urgent issues',
    icon: <Phone className="h-5 w-5" />,
    contact: '+33 1 23 45 67 89',
    responseTime: 'Immediate',
    available: false
  }
];

export default function SupportPage() {
  const supabase = createClientComponentClient<Database>();
  const { user } = useUser();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('faq');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'medium' as const
  });

  // Mock FAQ data
  const mockFaqs: FAQ[] = [
    {
      id: '1',
      question: 'How do I create a listing?',
      answer: 'To create a listing, go to "My Listings" in your dashboard and click the "Create Listing" button. Fill in the required information including your profile type, what you\'re looking for, title, and description.',
      category: 'features',
      helpful: 45,
      not_helpful: 2
    },
    {
      id: '2',
      question: 'How do I connect with other users?',
      answer: 'You can connect with other users by visiting their profile and clicking the "Connect" button. You can also find potential partners using the "Find Partner" feature.',
      category: 'features',
      helpful: 38,
      not_helpful: 1
    },
    {
      id: '3',
      question: 'How do I update my payment information?',
      answer: 'Go to your Profile Settings and navigate to the Billing section. You can update your payment method, view invoices, and manage your subscription there.',
      category: 'account',
      helpful: 52,
      not_helpful: 3
    },
    {
      id: '4',
      question: 'Is my data secure?',
      answer: 'Yes, we use industry-standard encryption and security measures to protect your data. We never share your personal information with third parties without your consent.',
      category: 'security',
      helpful: 67,
      not_helpful: 0
    },
    {
      id: '5',
      question: 'How do I reset my password?',
      answer: 'Click on the "Forgot Password" link on the login page. Enter your email address and follow the instructions sent to your email to reset your password.',
      category: 'account',
      helpful: 41,
      not_helpful: 2
    },
    {
      id: '6',
      question: 'Can I delete my account?',
      answer: 'Yes, you can delete your account from your Profile Settings. Please note that this action is irreversible and will permanently delete all your data.',
      category: 'account',
      helpful: 29,
      not_helpful: 1
    }
  ];

  useEffect(() => {
    setFaqs(mockFaqs);
    fetchTickets();
    setLoading(false);
  }, []);

  const fetchTickets = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching tickets:', error);
      } else {
        setTickets(data || []);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
    }
  };

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: 'You must be logged in to submit a ticket', variant: 'destructive' });
      return;
    }

    if (!newTicket.title || !newTicket.description || !newTicket.category) {
      toast({ title: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user.id,
          title: newTicket.title,
          description: newTicket.description,
          category: newTicket.category,
          priority: newTicket.priority,
          status: 'open'
        });

      if (error) {
        toast({ title: 'Failed to submit ticket', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Ticket submitted successfully' });
        setNewTicket({ title: '', description: '', category: '', priority: 'medium' });
        fetchTickets();
        setActiveTab('my-tickets');
      }
    } catch (error) {
      toast({ title: 'An error occurred', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'open': return 'default';
      case 'in_progress': return 'secondary';
      case 'resolved': return 'default';
      case 'closed': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Support Center</h1>
          <p className="text-muted-foreground">
            Get help with your account, billing, or technical issues
          </p>
        </div>
      </div>

      {/* Support Channels */}
      <div className="grid gap-4 md:grid-cols-3">
        {supportChannels.map((channel) => (
          <Card key={channel.id} className={!channel.available ? 'opacity-50' : ''}>
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                {channel.icon}
                <CardTitle className="text-lg">{channel.name}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">{channel.description}</p>
              <div className="flex items-center space-x-2 text-sm">
                <Clock className="h-4 w-4" />
                <span>Response: {channel.responseTime}</span>
              </div>
              <p className="text-sm font-medium">{channel.contact}</p>
              {!channel.available && (
                <Badge variant="secondary">Coming Soon</Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="faq">FAQ</TabsTrigger>
          <TabsTrigger value="submit-ticket">Submit Ticket</TabsTrigger>
          <TabsTrigger value="my-tickets">My Tickets</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>

        {/* FAQ Tab */}
        <TabsContent value="faq" className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search FAQ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
                icon={<Search className="h-4 w-4" />}
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {faqCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {filteredFaqs.map((faq) => (
              <Card key={faq.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">{faq.answer}</p>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>Was this helpful?</span>
                      <Button variant="ghost" size="sm" className="h-6 px-2">
                        👍 {faq.helpful}
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 px-2">
                        👎 {faq.not_helpful}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Submit Ticket Tab */}
        <TabsContent value="submit-ticket" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Submit a Support Ticket</CardTitle>
              <CardDescription>
                Describe your issue in detail and we'll get back to you as soon as possible.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitTicket} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={newTicket.title}
                      onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                      placeholder="Brief description of your issue"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select value={newTicket.category} onValueChange={(value) => setNewTicket({ ...newTicket, category: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {faqCategories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={newTicket.priority} onValueChange={(value: any) => setNewTicket({ ...newTicket, priority: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={newTicket.description}
                    onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                    placeholder="Please provide detailed information about your issue..."
                    rows={6}
                    required
                  />
                </div>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Ticket'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* My Tickets Tab */}
        <TabsContent value="my-tickets" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>My Support Tickets</CardTitle>
              <CardDescription>
                Track the status of your support requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tickets.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No tickets yet</p>
                  <Button 
                    variant="outline" 
                    className="mt-2"
                    onClick={() => setActiveTab('submit-ticket')}
                  >
                    Submit your first ticket
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {tickets.map((ticket) => (
                    <Card key={ticket.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <h3 className="font-medium">{ticket.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {ticket.description}
                          </p>
                          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                            <span>Created: {new Date(ticket.created_at).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>Updated: {new Date(ticket.updated_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={getPriorityBadgeVariant(ticket.priority)}>
                            {ticket.priority}
                          </Badge>
                          <Badge variant={getStatusBadgeVariant(ticket.status)}>
                            {ticket.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5" />
                  <span>Documentation</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Link href="#" className="flex items-center space-x-2 text-sm hover:text-primary">
                    <ExternalLink className="h-4 w-4" />
                    <span>Getting Started Guide</span>
                  </Link>
                  <Link href="#" className="flex items-center space-x-2 text-sm hover:text-primary">
                    <ExternalLink className="h-4 w-4" />
                    <span>User Manual</span>
                  </Link>
                  <Link href="#" className="flex items-center space-x-2 text-sm hover:text-primary">
                    <ExternalLink className="h-4 w-4" />
                    <span>API Documentation</span>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Community</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Link href="#" className="flex items-center space-x-2 text-sm hover:text-primary">
                    <ExternalLink className="h-4 w-4" />
                    <span>Community Forum</span>
                  </Link>
                  <Link href="#" className="flex items-center space-x-2 text-sm hover:text-primary">
                    <ExternalLink className="h-4 w-4" />
                    <span>Discord Server</span>
                  </Link>
                  <Link href="#" className="flex items-center space-x-2 text-sm hover:text-primary">
                    <ExternalLink className="h-4 w-4" />
                    <span>GitHub Issues</span>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 