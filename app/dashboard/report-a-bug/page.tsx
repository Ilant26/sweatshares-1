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
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/lib/database.types';
import { useUser } from '@/hooks/use-user';
import Link from 'next/link';

import {
  Bug,
  MessageSquarePlus,
  FileText,
  Search,
  AlertTriangle,
  CheckCircle,
  Clock,
  ExternalLink,
  Monitor,
  Smartphone,
  Globe,
  Settings,
  Users,
  CreditCard,
  Shield,
  Lock,
  Database as DatabaseIcon,
  Zap,
  Eye,
  Copy,
  Download,
} from 'lucide-react';

interface BugReport {
  id: string;
  title: string;
  description: string;
  steps_to_reproduce: string;
  expected_behavior: string;
  actual_behavior: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  browser?: string;
  os?: string;
  device?: string;
  status: 'open' | 'investigating' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  updated_at: string;
  user_id: string;
  screenshots?: string[];
  console_logs?: string;
}

const bugCategories = [
  {
    id: 'ui-ux',
    name: 'UI/UX Issues',
    icon: <Eye className="h-4 w-4" />,
    description: 'Visual glitches, layout problems, responsive design issues'
  },
  {
    id: 'functionality',
    name: 'Functional Bugs',
    icon: <Zap className="h-4 w-4" />,
    description: 'Features not working, broken functionality'
  },
  {
    id: 'performance',
    name: 'Performance Issues',
    icon: <Monitor className="h-4 w-4" />,
    description: 'Slow loading, crashes, memory leaks'
  },
  {
    id: 'security',
    name: 'Security Issues',
    icon: <Shield className="h-4 w-4" />,
    description: 'Security vulnerabilities, data exposure'
  },
  {
    id: 'mobile',
    name: 'Mobile Issues',
    icon: <Smartphone className="h-4 w-4" />,
    description: 'Mobile-specific problems, app issues'
  },
  {
    id: 'browser',
    name: 'Browser Compatibility',
    icon: <Globe className="h-4 w-4" />,
    description: 'Issues with specific browsers'
  },
  {
    id: 'data',
    name: 'Data Issues',
    icon: <DatabaseIcon className="h-4 w-4" />,
    description: 'Data corruption, sync problems, storage issues'
  }
];

const severityLevels = [
  {
    value: 'low',
    label: 'Low',
    description: 'Minor issue, doesn\'t affect functionality',
    color: 'bg-green-100 text-green-800'
  },
  {
    value: 'medium',
    label: 'Medium',
    description: 'Noticeable issue, some impact on usability',
    color: 'bg-yellow-100 text-yellow-800'
  },
  {
    value: 'high',
    label: 'High',
    description: 'Significant issue, affects core functionality',
    color: 'bg-orange-100 text-orange-800'
  },
  {
    value: 'critical',
    label: 'Critical',
    description: 'Severe issue, breaks core functionality',
    color: 'bg-red-100 text-red-800'
  }
];

export default function ReportABugPage() {
  const supabase = createClientComponentClient<Database>();
  const { user } = useUser();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('report');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [bugReports, setBugReports] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [newBugReport, setNewBugReport] = useState({
    title: '',
    description: '',
    steps_to_reproduce: '',
    expected_behavior: '',
    actual_behavior: '',
    severity: 'medium' as const,
    category: '',
    browser: '',
    os: '',
    device: '',
    include_system_info: false,
    include_console_logs: false
  });

  useEffect(() => {
    fetchBugReports();
    setLoading(false);
  }, []);

  const fetchBugReports = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('bug_reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching bug reports:', error);
      } else {
        setBugReports(data || []);
      }
    } catch (error) {
      console.error('Error fetching bug reports:', error);
    }
  };

  const handleSubmitBugReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: 'You must be logged in to submit a bug report', variant: 'destructive' });
      return;
    }

    if (!newBugReport.title || !newBugReport.description || !newBugReport.category) {
      toast({ title: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('bug_reports')
        .insert({
          user_id: user.id,
          title: newBugReport.title,
          description: newBugReport.description,
          steps_to_reproduce: newBugReport.steps_to_reproduce,
          expected_behavior: newBugReport.expected_behavior,
          actual_behavior: newBugReport.actual_behavior,
          severity: newBugReport.severity,
          category: newBugReport.category,
          browser: newBugReport.browser || null,
          os: newBugReport.os || null,
          device: newBugReport.device || null,
          status: 'open'
        });

      if (error) {
        toast({ title: 'Failed to submit bug report', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Bug report submitted successfully' });
        setNewBugReport({
          title: '',
          description: '',
          steps_to_reproduce: '',
          expected_behavior: '',
          actual_behavior: '',
          severity: 'medium',
          category: '',
          browser: '',
          os: '',
          device: '',
          include_system_info: false,
          include_console_logs: false
        });
        fetchBugReports();
        setActiveTab('my-reports');
      }
    } catch (error) {
      toast({ title: 'An error occurred', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'open': return 'default';
      case 'investigating': return 'secondary';
      case 'in_progress': return 'secondary';
      case 'resolved': return 'default';
      case 'closed': return 'outline';
      default: return 'secondary';
    }
  };

  const copySystemInfo = () => {
    const systemInfo = `
Browser: ${navigator.userAgent}
Platform: ${navigator.platform}
Language: ${navigator.language}
Screen Resolution: ${screen.width}x${screen.height}
Viewport: ${window.innerWidth}x${window.innerHeight}
URL: ${window.location.href}
Timestamp: ${new Date().toISOString()}
    `.trim();
    
    navigator.clipboard.writeText(systemInfo);
    toast({ title: 'System information copied to clipboard' });
  };

  const copyConsoleLogs = () => {
    // This would need to be implemented with a console log capture system
    toast({ title: 'Console logs feature coming soon' });
  };

      return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header Section */}
            <div className="flex flex-col space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <MessageSquarePlus className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Report a Bug</h1>
                            <p className="text-sm text-muted-foreground">Help us improve by reporting bugs and issues you encounter</p>
                        </div>
                    </div>
                </div>
            </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <Bug className="h-5 w-5 text-red-500" />
              <CardTitle className="text-lg">Report Bug</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Found a bug? Report it with detailed information to help us fix it quickly.
            </p>
            <Button onClick={() => setActiveTab('report')} className="w-full">
              Report New Bug
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-500" />
              <CardTitle className="text-lg">My Reports</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Track the status of your bug reports and see updates from our team.
            </p>
            <Button variant="outline" onClick={() => setActiveTab('my-reports')} className="w-full">
              View My Reports
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <Search className="h-5 w-5 text-green-500" />
              <CardTitle className="text-lg">Known Issues</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Check if your issue has already been reported and is being worked on.
            </p>
            <Button variant="outline" onClick={() => setActiveTab('known-issues')} className="w-full">
              Browse Issues
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="report">Report Bug</TabsTrigger>
          <TabsTrigger value="my-reports">My Reports</TabsTrigger>
          <TabsTrigger value="known-issues">Known Issues</TabsTrigger>
          <TabsTrigger value="guidelines">Guidelines</TabsTrigger>
        </TabsList>

        {/* Report Bug Tab */}
        <TabsContent value="report" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Submit a Bug Report</CardTitle>
              <CardDescription>
                Provide detailed information about the bug you encountered to help us fix it quickly.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitBugReport} className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Basic Information</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="title">Bug Title *</Label>
                      <Input
                        id="title"
                        value={newBugReport.title}
                        onChange={(e) => setNewBugReport({ ...newBugReport, title: e.target.value })}
                        placeholder="Brief description of the bug"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Category *</Label>
                      <Select value={newBugReport.category} onValueChange={(value) => setNewBugReport({ ...newBugReport, category: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {bugCategories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="severity">Severity</Label>
                    <Select value={newBugReport.severity} onValueChange={(value: any) => setNewBugReport({ ...newBugReport, severity: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {severityLevels.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            <div className="flex items-center space-x-2">
                              <span>{level.label}</span>
                              <span className="text-xs text-muted-foreground">- {level.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                {/* Bug Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Bug Details</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="description">Description *</Label>
                      <Textarea
                        id="description"
                        value={newBugReport.description}
                        onChange={(e) => setNewBugReport({ ...newBugReport, description: e.target.value })}
                        placeholder="Describe the bug in detail..."
                        rows={4}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="steps">Steps to Reproduce</Label>
                      <Textarea
                        id="steps"
                        value={newBugReport.steps_to_reproduce}
                        onChange={(e) => setNewBugReport({ ...newBugReport, steps_to_reproduce: e.target.value })}
                        placeholder="1. Go to...&#10;2. Click on...&#10;3. Observe..."
                        rows={4}
                      />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="expected">Expected Behavior</Label>
                        <Textarea
                          id="expected"
                          value={newBugReport.expected_behavior}
                          onChange={(e) => setNewBugReport({ ...newBugReport, expected_behavior: e.target.value })}
                          placeholder="What should happen?"
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="actual">Actual Behavior</Label>
                        <Textarea
                          id="actual"
                          value={newBugReport.actual_behavior}
                          onChange={(e) => setNewBugReport({ ...newBugReport, actual_behavior: e.target.value })}
                          placeholder="What actually happens?"
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* System Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">System Information</h3>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="browser">Browser</Label>
                      <Input
                        id="browser"
                        value={newBugReport.browser}
                        onChange={(e) => setNewBugReport({ ...newBugReport, browser: e.target.value })}
                        placeholder="Chrome, Firefox, Safari..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="os">Operating System</Label>
                      <Input
                        id="os"
                        value={newBugReport.os}
                        onChange={(e) => setNewBugReport({ ...newBugReport, os: e.target.value })}
                        placeholder="Windows, macOS, Linux..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="device">Device</Label>
                      <Input
                        id="device"
                        value={newBugReport.device}
                        onChange={(e) => setNewBugReport({ ...newBugReport, device: e.target.value })}
                        placeholder="Desktop, Mobile, Tablet..."
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Button type="button" variant="outline" size="sm" onClick={copySystemInfo}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy System Info
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={copyConsoleLogs}>
                      <Download className="h-4 w-4 mr-2" />
                      Copy Console Logs
                    </Button>
                  </div>
                </div>

                <Separator />

                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? 'Submitting...' : 'Submit Bug Report'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* My Reports Tab */}
        <TabsContent value="my-reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>My Bug Reports</CardTitle>
              <CardDescription>
                Track the status of your bug reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              {bugReports.length === 0 ? (
                <div className="text-center py-8">
                  <Bug className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No bug reports yet</p>
                  <Button 
                    variant="outline" 
                    className="mt-2"
                    onClick={() => setActiveTab('report')}
                  >
                    Report your first bug
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {bugReports.map((report) => (
                    <Card key={report.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <h3 className="font-medium">{report.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {report.description}
                          </p>
                          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                            <span>Category: {bugCategories.find(c => c.id === report.category)?.name}</span>
                            <span>•</span>
                            <span>Created: {new Date(report.created_at).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>Updated: {new Date(report.updated_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <Badge variant={getSeverityBadgeVariant(report.severity)}>
                            {report.severity}
                          </Badge>
                          <Badge variant={getStatusBadgeVariant(report.status)}>
                            {report.status.replace('_', ' ')}
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

        {/* Known Issues Tab */}
        <TabsContent value="known-issues" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Known Issues</CardTitle>
              <CardDescription>
                Issues that have been reported and are being worked on
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Known issues will be displayed here</p>
                <p className="text-sm text-muted-foreground mt-2">
                  This feature is coming soon. For now, please report any issues you encounter.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Guidelines Tab */}
        <TabsContent value="guidelines" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Before Reporting</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Check for existing reports</h4>
                  <p className="text-sm text-muted-foreground">
                    Search through known issues to see if your bug has already been reported.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Try to reproduce</h4>
                  <p className="text-sm text-muted-foreground">
                    Make sure you can consistently reproduce the issue before reporting.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Clear your cache</h4>
                  <p className="text-sm text-muted-foreground">
                    Try clearing your browser cache and cookies to see if the issue persists.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Test in different browsers</h4>
                  <p className="text-sm text-muted-foreground">
                    Check if the issue occurs in other browsers to help identify the scope.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Writing a Good Report</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Be specific</h4>
                  <p className="text-sm text-muted-foreground">
                    Provide clear, detailed descriptions of what you were doing when the bug occurred.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Include steps</h4>
                  <p className="text-sm text-muted-foreground">
                    List the exact steps to reproduce the issue so we can test it ourselves.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Add screenshots</h4>
                  <p className="text-sm text-muted-foreground">
                    Visual evidence helps us understand the issue better.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">System information</h4>
                  <p className="text-sm text-muted-foreground">
                    Include your browser, OS, and device information to help with debugging.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 