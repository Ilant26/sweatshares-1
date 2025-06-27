import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Paperclip, Upload, X, DollarSign, Users, Briefcase, Target, Building2 } from 'lucide-react';
import { createListingResponse, getPaymentResponsibility } from '@/lib/responses';
import { useSession } from '@/components/providers/session-provider';
import { useToast } from '@/components/ui/use-toast';

interface ResponseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listingType: string;
  listingId: string;
  onSubmit?: (data: ResponseFormData) => void;
  isLoading?: boolean;
}

export interface ResponseFormData {
  message: string;
  proposedAmount: number;
  currency: string;
  terms: string;
  attachments: File[];
}

const currencyOptions = [
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'GBP', label: 'GBP' },
  { value: 'ETH', label: 'ETH' },
  { value: 'USDT', label: 'USDT' },
];

function getAmountLabel(listingType: string) {
  switch (listingType) {
    case 'find-funding':
      return 'Investment Amount';
    case 'investment-opportunity':
      return 'Investment Amount';
    case 'job':
      return 'Salary/Compensation';
    case 'mission':
      return 'Project Budget';
    case 'expert-freelance':
      return 'Hourly Rate or Project Fee';
    case 'cofounder':
      return 'Equity Percentage';
    case 'employee':
      return 'Expected Salary';
    case 'mentor':
      return 'Consulting Fee';
    case 'sell-startup':
      return 'Purchase Offer';
    case 'buy-startup':
      return 'Investment Amount';
    case 'co-investor':
      return 'Investment Amount';
    default:
      return 'Proposed Amount';
  }
}

function getMessagePlaceholder(listingType: string) {
  switch (listingType) {
    case 'find-funding':
      return 'Introduce yourself and your startup. Explain why you need funding, how you plan to use it, and what makes your business unique...';
    case 'investment-opportunity':
      return 'Describe your investment thesis, experience, and why you\'re interested in this opportunity. Include your investment strategy...';
    case 'job':
      return 'Introduce yourself, highlight relevant experience, and explain why you\'re interested in this position. Include your qualifications...';
    case 'mission':
      return 'Describe your approach to this mission, relevant experience, and how you plan to deliver results. Include your methodology...';
    case 'expert-freelance':
      return 'Introduce yourself as a freelancer, highlight your expertise, and explain how you can help with this project. Include your approach...';
    case 'cofounder':
      return 'Introduce yourself and explain why you\'d be a great co-founder. Describe your skills, experience, and vision for the partnership...';
    case 'employee':
      return 'Introduce yourself, highlight relevant experience, and explain why you\'re interested in this position. Include your qualifications...';
    case 'mentor':
      return 'Introduce yourself as a mentor, describe your expertise, and explain how you can help. Include your mentoring approach...';
    case 'sell-startup':
      return 'Introduce yourself as a potential buyer, explain your interest in this startup, and describe your acquisition strategy...';
    case 'buy-startup':
      return 'Introduce yourself and your startup, explain why you\'re looking to acquire, and describe your vision for the business...';
    case 'co-investor':
      return 'Introduce yourself as a co-investor, describe your investment experience, and explain your interest in this opportunity...';
    default:
      return 'Write a message to the listing owner...';
  }
}

function getTermsPlaceholder(listingType: string) {
  switch (listingType) {
    case 'find-funding':
      return 'Specify funding terms, equity offered, milestones, use of funds, timeline, etc...';
    case 'investment-opportunity':
      return 'Specify investment terms, expected returns, timeline, involvement level, etc...';
    case 'job':
      return 'Specify work terms, availability, remote work preferences, benefits expectations, etc...';
    case 'mission':
      return 'Specify project terms, timeline, deliverables, milestones, communication preferences, etc...';
    case 'expert-freelance':
      return 'Specify project terms, timeline, deliverables, payment schedule, communication preferences, etc...';
    case 'cofounder':
      return 'Specify partnership terms, roles and responsibilities, equity split, commitment level, etc...';
    case 'employee':
      return 'Specify employment terms, start date, work arrangements, benefits expectations, etc...';
    case 'mentor':
      return 'Specify mentoring terms, session frequency, areas of focus, commitment level, etc...';
    case 'sell-startup':
      return 'Specify acquisition terms, due diligence timeline, transition plan, payment structure, etc...';
    case 'buy-startup':
      return 'Specify acquisition terms, due diligence requirements, transition timeline, integration plan, etc...';
    case 'co-investor':
      return 'Specify co-investment terms, investment amount, timeline, involvement level, etc...';
    default:
      return 'Specify any terms, milestones, or requirements...';
  }
}

function getListingTypeIcon(listingType: string) {
  switch (listingType) {
    case 'find-funding':
    case 'investment-opportunity':
    case 'buy-startup':
    case 'co-investor':
      return DollarSign;
    case 'job':
    case 'employee':
      return Briefcase;
    case 'mission':
    case 'expert-freelance':
      return Target;
    case 'cofounder':
    case 'mentor':
      return Users;
    case 'sell-startup':
      return Building2;
    default:
      return Briefcase;
  }
}

function getPaymentNotice(listingType: string) {
  const paymentResponsibility = getPaymentResponsibility(listingType);
  
  if (paymentResponsibility === 'responder') {
    return {
      title: "Payment Required",
      message: "You will be responsible for making the escrow payment if your response is accepted.",
      variant: "default" as const
    };
  } else {
    return {
      title: "No Payment Required",
      message: "The listing owner will handle the escrow payment if your response is accepted.",
      variant: "secondary" as const
    };
  }
}

export function ResponseForm({ open, onOpenChange, listingType, listingId, onSubmit, isLoading }: ResponseFormProps) {
  const { user } = useSession();
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [proposedAmount, setProposedAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [terms, setTerms] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const Icon = getListingTypeIcon(listingType);
  const paymentNotice = getPaymentNotice(listingType);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to submit a response.",
        variant: "destructive",
      });
      return;
    }

    if (!message.trim() || !proposedAmount.trim()) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(proposedAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await createListingResponse({
        listing_id: listingId,
        responder_id: user.id,
        type: listingType,
        message: message.trim(),
        proposed_amount: amount,
        currency,
        terms: terms.trim() || undefined,
        attachments: attachments.length > 0 ? attachments.map(f => ({ name: f.name, size: f.size })) : undefined,
      });

      if (response) {
        toast({
          title: "Response submitted",
          description: "Your response has been sent to the listing owner.",
        });
        
        // Reset form
        setMessage('');
        setProposedAmount('');
        setTerms('');
        setAttachments([]);
        onOpenChange(false);
        
        // Call parent onSubmit if provided
        if (onSubmit) {
          onSubmit({
            message: response.message,
            proposedAmount: response.proposed_amount,
            currency: response.currency,
            terms: response.terms,
            attachments: [],
          });
        }
      } else {
        throw new Error('Failed to create response');
      }
    } catch (error) {
      console.error('Error submitting response:', error);
      toast({
        title: "Submission failed",
        description: "There was an error submitting your response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => file.size <= 10 * 1024 * 1024); // 10MB limit
    
    if (validFiles.length !== files.length) {
      toast({
        title: "File size limit exceeded",
        description: "Some files were too large. Maximum size is 10MB per file.",
        variant: "destructive",
      });
    }
    
    setAttachments(prev => [...prev, ...validFiles]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Submit Your Response</DialogTitle>
              <p className="text-sm text-muted-foreground">
                {getAmountLabel(listingType)} • {listingType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </p>
            </div>
          </div>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Payment Notice */}
          <div className={`p-3 rounded-lg border ${
            paymentNotice.variant === 'default' 
              ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800' 
              : 'bg-gray-50 dark:bg-gray-950/20 border-gray-200 dark:border-gray-800'
          }`}>
            <div className="flex items-center gap-2">
              <DollarSign className={`h-4 w-4 ${
                paymentNotice.variant === 'default' ? 'text-blue-600' : 'text-gray-600'
              }`} />
              <span className={`text-sm font-medium ${
                paymentNotice.variant === 'default' ? 'text-blue-800 dark:text-blue-200' : 'text-gray-800 dark:text-gray-200'
              }`}>
                {paymentNotice.title}
              </span>
            </div>
            <p className={`text-xs mt-1 ${
              paymentNotice.variant === 'default' ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'
            }`}>
              {paymentNotice.message}
            </p>
          </div>

          <div>
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder={getMessagePlaceholder(listingType)}
              required
              className="mt-1"
              rows={4}
            />
          </div>
          
          <div>
            <Label htmlFor="proposedAmount">{getAmountLabel(listingType)} *</Label>
            <div className="flex gap-2">
              <Input
                id="proposedAmount"
                type="number"
                min="0"
                step="any"
                value={proposedAmount}
                onChange={e => setProposedAmount(e.target.value)}
                placeholder="Enter amount"
                required
                className="flex-1"
              />
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencyOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="terms">Terms & Conditions (optional)</Label>
            <Textarea
              id="terms"
              value={terms}
              onChange={e => setTerms(e.target.value)}
              placeholder={getTermsPlaceholder(listingType)}
              className="mt-1"
              rows={3}
            />
          </div>
          
          <div>
            <Label>Attachments (optional)</Label>
            <div className="mt-2 space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="flex-1"
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                />
                <Paperclip className="h-4 w-4 text-muted-foreground" />
              </div>
              
              {attachments.length > 0 && (
                <div className="space-y-1">
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                      <div className="flex items-center gap-2">
                        <Upload className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{file.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </Badge>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAttachment(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isLoading}>
              {isSubmitting ? 'Submitting...' : 'Submit Response'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 