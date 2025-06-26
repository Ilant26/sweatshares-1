'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { ResponseService } from '@/lib/responses';
import { useSession } from '@/components/providers/session-provider';
import { Loader2, Upload, X, Euro, MessageSquare, Handshake } from 'lucide-react';

interface ResponseFormProps {
  listingId: string;
  listingTitle: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const RESPONSE_TYPES = [
  { value: 'application', label: 'Candidature', icon: MessageSquare, description: 'Postuler pour cette opportunité' },
  { value: 'offer', label: 'Offre', icon: Euro, description: 'Faire une offre financière' },
  { value: 'partnership', label: 'Partenariat', icon: Handshake, description: 'Proposer un partenariat' },
];

export function ResponseForm({ listingId, listingTitle, onSuccess, onCancel }: ResponseFormProps) {
  const { user } = useSession();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    type: 'application' as 'application' | 'offer' | 'partnership',
    message: '',
    proposedAmount: '',
    currency: 'EUR',
    terms: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      // Validation
      if (!formData.message.trim()) {
        toast({
          title: "Erreur",
          description: "Veuillez saisir un message",
          variant: "destructive",
        });
        return;
      }

      if (formData.type === 'offer' && !formData.proposedAmount) {
        toast({
          title: "Erreur",
          description: "Veuillez saisir un montant pour votre offre",
          variant: "destructive",
        });
        return;
      }

      // TODO: Upload files if any
      const attachments: string[] = []; // URLs des fichiers uploadés

      // Créer la réponse
      const response = await ResponseService.createResponse({
        listing_id: listingId,
        responder_id: user.id,
        type: formData.type,
        message: formData.message,
        proposed_amount: formData.proposedAmount ? parseFloat(formData.proposedAmount) : null,
        currency: formData.currency,
        terms: formData.terms || null,
        attachments: attachments.length > 0 ? attachments : null,
      });

      if (response.error) {
        throw new Error(response.error.message || 'Erreur lors de la création de la réponse');
      }

      toast({
        title: "Succès",
        description: "Votre réponse a été envoyée avec succès",
      });

      onSuccess?.();
    } catch (error) {
      console.error('Error submitting response:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'envoi de votre réponse",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedType = RESPONSE_TYPES.find(type => type.value === formData.type);
  const TypeIcon = selectedType?.icon || MessageSquare;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TypeIcon className="h-5 w-5" />
          Répondre à l'annonce
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {listingTitle}
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Type de réponse */}
          <div className="space-y-2">
            <Label>Type de réponse</Label>
            <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RESPONSE_TYPES.map((type) => {
                  const Icon = type.icon;
                  return (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-xs text-muted-foreground">{type.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">
              {formData.type === 'application' && 'Lettre de motivation'}
              {formData.type === 'offer' && 'Détails de votre offre'}
              {formData.type === 'partnership' && 'Proposition de partenariat'}
            </Label>
            <Textarea
              id="message"
              placeholder={
                formData.type === 'application' 
                  ? "Présentez-vous et expliquez pourquoi vous êtes intéressé par cette opportunité..."
                  : formData.type === 'offer'
                  ? "Décrivez votre offre et les conditions..."
                  : "Expliquez votre proposition de partenariat..."
              }
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              rows={6}
              required
            />
          </div>

          {/* Montant proposé (pour les offres) */}
          {formData.type === 'offer' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Montant proposé</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.proposedAmount}
                  onChange={(e) => handleInputChange('proposedAmount', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Devise</Label>
                <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Conditions/Termes */}
          <div className="space-y-2">
            <Label htmlFor="terms">Conditions ou termes supplémentaires (optionnel)</Label>
            <Textarea
              id="terms"
              placeholder="Précisez vos conditions, délais, ou autres termes importants..."
              value={formData.terms}
              onChange={(e) => handleInputChange('terms', e.target.value)}
              rows={3}
            />
          </div>

          {/* Upload de fichiers */}
          <div className="space-y-2">
            <Label>Pièces jointes (optionnel)</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-gray-400" />
                  <div className="text-sm text-gray-600">
                    Cliquez pour ajouter des fichiers ou glissez-déposez
                  </div>
                  <div className="text-xs text-gray-500">
                    PDF, DOC, JPG, PNG (max 10MB par fichier)
                  </div>
                </div>
              </label>
            </div>
            
            {/* Liste des fichiers */}
            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm truncate">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Envoyer la réponse
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 