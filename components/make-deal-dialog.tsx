'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Handshake, MessageSquare, Clock, User } from 'lucide-react';
import { createDeal } from '@/lib/deals';
import { useSession } from '@/components/providers/session-provider';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';

interface MakeDealDialogProps {
  listing: any;
  profile: any;
  trigger?: React.ReactNode;
}

export function MakeDealDialog({ listing, profile, trigger }: MakeDealDialogProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [terms, setTerms] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useSession();
  const { toast } = useToast();

  // Define freelancer search listing types
  const freelancerSearchTypes = ['expert-freelance', 'employee', 'mentor', 'job'];
  const isFreelancerSearch = freelancerSearchTypes.includes(listing.listing_type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to make a deal.",
        variant: "destructive",
      });
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const deal = await createDeal(
        listing.id,
        user.id,
        listing.user_id,
        parseFloat(amount),
        description,
        terms
      );

      if (deal) {
        toast({
          title: "Deal Created Successfully!",
          description: isFreelancerSearch 
            ? "Your service offer has been sent to the client."
            : "Your deal offer has been sent to the seller.",
        });
        setOpen(false);
        // Reset form
        setAmount('');
        setDescription('');
        setTerms('');
      } else {
        throw new Error('Failed to create deal');
      }
    } catch (error) {
      console.error('Error creating deal:', error);
      toast({
        title: "Error",
        description: "Failed to create deal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const defaultTrigger = (
    <Button className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200">
      <Handshake className="h-5 w-5 mr-2" />
      {isFreelancerSearch ? 'Offer Services' : 'Make a Deal'}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Handshake className="h-6 w-6 text-primary" />
            {isFreelancerSearch ? 'Offer Your Services' : 'Make a Deal'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isFreelancerSearch 
              ? "Propose your services for this opportunity. The client can accept, reject, or make a counter offer."
              : "Propose a deal for this listing. The seller can accept, reject, or make a counter offer."
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Listing Info */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              <span className="font-medium">{profile.full_name}</span>
            </div>
            <h3 className="font-semibold text-lg">{listing.title}</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{listing.listing_type}</Badge>
              {listing.sector && <Badge variant="outline">{listing.sector}</Badge>}
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              {isFreelancerSearch ? 'Your Rate (USD)' : 'Deal Amount (USD)'}
            </Label>
            <Input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              placeholder={isFreelancerSearch ? "Enter your rate" : "Enter your offer amount"}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="text-lg font-medium"
            />
            <p className="text-sm text-muted-foreground">
              {isFreelancerSearch 
                ? "This is the rate you're charging for your services."
                : "This is the amount you're willing to pay for this service/opportunity."
              }
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Description
            </Label>
            <Textarea
              id="description"
              placeholder={isFreelancerSearch 
                ? "Describe your services, experience, and what you can deliver..."
                : "Describe what you're looking for or any specific requirements..."
              }
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
            <p className="text-sm text-muted-foreground">
              {isFreelancerSearch 
                ? "Provide details about your services, experience, and deliverables."
                : "Provide details about your requirements or expectations."
              }
            </p>
          </div>

          {/* Terms */}
          <div className="space-y-2">
            <Label htmlFor="terms" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Terms & Timeline
            </Label>
            <Textarea
              id="terms"
              placeholder="Any specific terms, timeline, or conditions..."
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              rows={2}
            />
            <p className="text-sm text-muted-foreground">
              Optional: Specify timeline, milestones, or special conditions.
            </p>
          </div>

          {/* Deal Process Info */}
          <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 space-y-2">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100">How it works:</h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Your offer will be sent to the {isFreelancerSearch ? 'client' : 'seller'}</li>
              <li>• {isFreelancerSearch ? 'Client' : 'Seller'} can accept, reject, or make a counter offer</li>
              <li>• Once accepted, payment is held securely until completion</li>
              <li>• Both parties mark the deal as complete to release payment</li>
            </ul>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !amount || parseFloat(amount) <= 0}
              className="bg-primary hover:bg-primary/90"
            >
              {isSubmitting ? (
                <>
                  <motion.div
                    className="h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  Creating Deal...
                </>
              ) : (
                <>
                  <Handshake className="h-4 w-4 mr-2" />
                  {isFreelancerSearch ? 'Send Service Offer' : 'Send Deal Offer'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 