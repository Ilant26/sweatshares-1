'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/lib/database.types';
import { useUser } from '@/hooks/use-user';
import { Bug, Send, CheckCircle, AlertCircle } from 'lucide-react';

export default function ReportABugPage() {
  const supabase = createClientComponentClient<Database>();
  const { user } = useUser();
  const { toast } = useToast();
  
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    severity: 'medium',
    description: '',
    steps_to_reproduce: '',
    expected_behavior: '',
    actual_behavior: '',
    browser: '',
    operating_system: '',
    device: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.category) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/bug-reports/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          userId: user?.id
        }),
      });

      if (response.ok) {
        toast({
          title: "Bug Report Submitted Successfully",
          description: "Thank you for helping us improve the platform!",
        });
        
        // Reset form
        setFormData({
          title: '',
          category: '',
          severity: 'medium',
          description: '',
          steps_to_reproduce: '',
          expected_behavior: '',
          actual_behavior: '',
          browser: '',
          operating_system: '',
          device: ''
        });
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit bug report');
      }
    } catch (error) {
      console.error('Error submitting bug report:', error);
      toast({
        title: "Error Submitting Bug Report",
        description: "Please try again or contact support directly.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Submit a Bug Report</h1>
          <p className="text-muted-foreground">
            Provide detailed information about the bug you encountered to help us fix it quickly.
          </p>
        </div>

        {/* Bug Report Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5" />
              Bug Report Form
            </CardTitle>
            <CardDescription>
              Please provide as much detail as possible to help us understand and fix the issue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Basic Information</h3>
                
                {/* Bug Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Bug Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Brief description of the bug"
                    required
                  />
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => handleInputChange('category', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ui-ux">UI/UX Issues</SelectItem>
                      <SelectItem value="functionality">Functional Bugs</SelectItem>
                      <SelectItem value="performance">Performance Issues</SelectItem>
                      <SelectItem value="security">Security Issues</SelectItem>
                      <SelectItem value="mobile">Mobile Issues</SelectItem>
                      <SelectItem value="browser">Browser Compatibility</SelectItem>
                      <SelectItem value="data">Data Issues</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Severity */}
                <div className="space-y-2">
                  <Label htmlFor="severity">Severity</Label>
                  <Select 
                    value={formData.severity} 
                    onValueChange={(value) => handleInputChange('severity', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low - Minor issue, doesn't affect functionality</SelectItem>
                      <SelectItem value="medium">Medium - Noticeable issue, some impact on usability</SelectItem>
                      <SelectItem value="high">High - Significant issue, affects core functionality</SelectItem>
                      <SelectItem value="critical">Critical - Severe issue, breaks core functionality</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Bug Details Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Bug Details</h3>
                
                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe the bug in detail..."
                    rows={4}
                    required
                  />
                </div>

                {/* Steps to Reproduce */}
                <div className="space-y-2">
                  <Label htmlFor="steps_to_reproduce">Steps to Reproduce</Label>
                  <Textarea
                    id="steps_to_reproduce"
                    value={formData.steps_to_reproduce}
                    onChange={(e) => handleInputChange('steps_to_reproduce', e.target.value)}
                    placeholder="1. Go to...&#10;2. Click on...&#10;3. Observe..."
                    rows={4}
                  />
                </div>

                {/* Expected Behavior */}
                <div className="space-y-2">
                  <Label htmlFor="expected_behavior">Expected Behavior</Label>
                  <Textarea
                    id="expected_behavior"
                    value={formData.expected_behavior}
                    onChange={(e) => handleInputChange('expected_behavior', e.target.value)}
                    placeholder="What should happen?"
                    rows={3}
                  />
                </div>

                {/* Actual Behavior */}
                <div className="space-y-2">
                  <Label htmlFor="actual_behavior">Actual Behavior</Label>
                  <Textarea
                    id="actual_behavior"
                    value={formData.actual_behavior}
                    onChange={(e) => handleInputChange('actual_behavior', e.target.value)}
                    placeholder="What actually happens?"
                    rows={3}
                  />
                </div>
              </div>

              {/* System Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">System Information</h3>
                
                {/* Browser */}
                <div className="space-y-2">
                  <Label htmlFor="browser">Browser</Label>
                  <Select 
                    value={formData.browser} 
                    onValueChange={(value) => handleInputChange('browser', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select browser" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="chrome">Chrome</SelectItem>
                      <SelectItem value="firefox">Firefox</SelectItem>
                      <SelectItem value="safari">Safari</SelectItem>
                      <SelectItem value="edge">Edge</SelectItem>
                      <SelectItem value="opera">Opera</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Operating System */}
                <div className="space-y-2">
                  <Label htmlFor="operating_system">Operating System</Label>
                  <Select 
                    value={formData.operating_system} 
                    onValueChange={(value) => handleInputChange('operating_system', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select operating system" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="windows">Windows</SelectItem>
                      <SelectItem value="macos">macOS</SelectItem>
                      <SelectItem value="linux">Linux</SelectItem>
                      <SelectItem value="android">Android</SelectItem>
                      <SelectItem value="ios">iOS</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Device */}
                <div className="space-y-2">
                  <Label htmlFor="device">Device</Label>
                  <Select 
                    value={formData.device} 
                    onValueChange={(value) => handleInputChange('device', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select device type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desktop">Desktop</SelectItem>
                      <SelectItem value="laptop">Laptop</SelectItem>
                      <SelectItem value="mobile">Mobile</SelectItem>
                      <SelectItem value="tablet">Tablet</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                disabled={submitting}
                className="w-full"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Bug Report
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 