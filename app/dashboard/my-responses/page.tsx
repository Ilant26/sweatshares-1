'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSession } from '@/components/providers/session-provider';
import { ResponseService, ResponseWithDetails } from '@/lib/responses';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  MessageSquare, 
  Euro, 
  Handshake, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye,
  Loader2,
  Calendar,
  MapPin,
  Building2
} from 'lucide-react';
import Link from 'next/link';

const RESPONSE_TYPE_ICONS = {
  application: MessageSquare,
  offer: Euro,
  partnership: Handshake,
};

const RESPONSE_TYPE_LABELS = {
  application: 'Candidature',
  offer: 'Offre',
  partnership: 'Partenariat',
};

const STATUS_CONFIG = {
  pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  accepted: { label: 'Acceptée', color: 'bg-green-100 text-green-800 border-green-200' },
  rejected: { label: 'Rejetée', color: 'bg-red-100 text-red-800 border-red-200' },
  completed: { label: 'Terminée', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  cancelled: { label: 'Annulée', color: 'bg-gray-100 text-gray-800 border-gray-200' },
};

export default function MyResponsesPage() {
  const { user } = useSession();
  const { toast } = useToast();
  const [receivedResponses, setReceivedResponses] = useState<ResponseWithDetails[]>([]);
  const [sentResponses, setSentResponses] = useState<ResponseWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('received');

  useEffect(() => {
    if (user) {
      loadResponses();
    }
  }, [user]);

  const loadResponses = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Charger les réponses reçues
      const { data: received, error: receivedError } = await ResponseService.getReceivedResponses(user.id);
      if (receivedError) {
        console.error('Error loading received responses:', receivedError);
        toast({
          title: "Erreur",
          description: "Impossible de charger les réponses reçues",
          variant: "destructive",
        });
      } else {
        setReceivedResponses(received || []);
      }

      // Charger les réponses envoyées
      const { data: sent, error: sentError } = await ResponseService.getUserResponses(user.id);
      if (sentError) {
        console.error('Error loading sent responses:', sentError);
        toast({
          title: "Erreur",
          description: "Impossible de charger les réponses envoyées",
          variant: "destructive",
        });
      } else {
        setSentResponses(sent || []);
      }
    } catch (error: any) {
      console.error('Error loading responses:', error);
      toast({
        title: "Erreur",
        description: error?.message || "Impossible de charger les réponses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (responseId: string, newStatus: 'accepted' | 'rejected') => {
    try {
      const { error } = await ResponseService.updateResponseStatus(responseId, newStatus);
      
      if (error) {
        throw error;
      }

      // Recharger les données
      await loadResponses();

      toast({
        title: "Succès",
        description: `Réponse ${newStatus === 'accepted' ? 'acceptée' : 'rejetée'} avec succès`,
      });
    } catch (error) {
      console.error('Error updating response status:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive",
      });
    }
  };

  const ResponseCard = ({ response, isReceived = false }: { response: ResponseWithDetails; isReceived?: boolean }) => {
    const TypeIcon = RESPONSE_TYPE_ICONS[response.type as keyof typeof RESPONSE_TYPE_ICONS];
    const statusConfig = STATUS_CONFIG[response.status as keyof typeof STATUS_CONFIG];
    
    // Pour les réponses reçues, on affiche le profil du répondant
    // Pour les réponses envoyées, on affiche les infos de l'annonce
    const responderProfile = response.profiles;
    const listingInfo = response.listings;

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={responderProfile?.avatar_url || ''} />
                <AvatarFallback>
                  {responderProfile?.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg">
                  {isReceived 
                    ? responderProfile?.full_name || 'Utilisateur inconnu'
                    : listingInfo?.title || 'Annonce inconnue'
                  }
                </h3>
                {isReceived && responderProfile?.professional_role && (
                  <p className="text-sm text-muted-foreground">
                    {responderProfile.professional_role}
                  </p>
                )}
                {!isReceived && listingInfo && (
                  <p className="text-sm text-muted-foreground">
                    Annonce
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TypeIcon className="h-4 w-4 text-muted-foreground" />
              <Badge variant="outline" className="text-xs">
                {RESPONSE_TYPE_LABELS[response.type as keyof typeof RESPONSE_TYPE_LABELS]}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Listing info for received responses */}
          {isReceived && listingInfo && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Annonce concernée</h4>
              <p className="text-sm">{listingInfo.title}</p>
            </div>
          )}

          {/* Message preview */}
          <div>
            <p className="text-sm text-muted-foreground line-clamp-3">
              {response.message}
            </p>
          </div>

          {/* Amount for offers */}
          {response.proposed_amount && (
            <div className="flex items-center gap-2 text-sm">
              <Euro className="h-4 w-4 text-green-600" />
              <span className="font-medium">
                {response.proposed_amount} {response.currency}
              </span>
            </div>
          )}

          {/* Status and actions */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-3">
              <Badge className={`text-xs ${statusConfig.color}`}>
                {statusConfig.label}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {format(new Date(response.created_at), 'dd MMM yyyy', { locale: fr })}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Link href={`/dashboard/responses/${response.id}`}>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-1" />
                  Voir
                </Button>
              </Link>
              
              {isReceived && response.status === 'pending' && (
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    onClick={() => handleStatusUpdate(response.id, 'accepted')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Accepter
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusUpdate(response.id, 'rejected')}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Rejeter
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mes Réponses</h1>
          <p className="text-muted-foreground">
            Gérez vos candidatures, offres et partenariats
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="received">
            Réponses reçues ({receivedResponses.length})
          </TabsTrigger>
          <TabsTrigger value="sent">
            Mes réponses ({sentResponses.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="received" className="space-y-4">
          {receivedResponses.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucune réponse reçue</h3>
                <p className="text-muted-foreground text-center">
                  Vous n'avez pas encore reçu de réponses à vos annonces.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {receivedResponses.map((response) => (
                <ResponseCard key={response.id} response={response} isReceived={true} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sent" className="space-y-4">
          {sentResponses.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucune réponse envoyée</h3>
                <p className="text-muted-foreground text-center">
                  Vous n'avez pas encore répondu à d'autres annonces.
                </p>
                <Link href="/dashboard/listings">
                  <Button className="mt-4">
                    Parcourir les annonces
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {sentResponses.map((response) => (
                <ResponseCard key={response.id} response={response} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 