'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ResponseForm } from './response-form';
import { useSession } from '@/components/providers/session-provider';
import { ResponseService } from '@/lib/responses';
import { useToast } from '@/components/ui/use-toast';
import { MessageSquare, Euro, Handshake, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ResponseButtonProps {
  listingId: string;
  listingTitle: string;
  listingOwnerId: string;
  className?: string;
}

export function ResponseButton({ listingId, listingTitle, listingOwnerId, className }: ResponseButtonProps) {
  const { user } = useSession();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [hasResponded, setHasResponded] = useState(false);
  const [loading, setLoading] = useState(false);

  // Vérifier si l'utilisateur a déjà répondu
  React.useEffect(() => {
    if (user && user.id !== listingOwnerId) {
      checkUserResponse();
    }
  }, [user, listingId]);

  const checkUserResponse = async () => {
    if (!user) return;
    
    const { data, error } = await ResponseService.hasUserResponded(listingId, user.id);
    if (!error) {
      setHasResponded(data);
    }
  };

  const handleSuccess = () => {
    setOpen(false);
    setHasResponded(true);
    checkUserResponse(); // Re-vérifier
  };

  const handleCancel = () => {
    setOpen(false);
  };

  // Si c'est l'annonce de l'utilisateur connecté
  if (user?.id === listingOwnerId) {
    return null;
  }

  // Si l'utilisateur a déjà répondu
  if (hasResponded) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="outline" disabled className={className}>
          <CheckCircle className="mr-2 h-4 w-4" />
          Réponse envoyée
        </Button>
        <Badge variant="secondary" className="text-xs">
          En attente
        </Badge>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className={className}>
          <MessageSquare className="mr-2 h-4 w-4" />
          Répondre
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Répondre à l'annonce</DialogTitle>
        </DialogHeader>
        <ResponseForm
          listingId={listingId}
          listingTitle={listingTitle}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
} 