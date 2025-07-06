'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Upload, X, Link, FileText } from 'lucide-react';
import { type EscrowTransaction } from '@/lib/escrow';

interface WorkCompletionFormProps {
  transaction: EscrowTransaction;
  onComplete: () => void;
  onCancel: () => void;
}

export function WorkCompletionForm({ transaction, onComplete, onCancel }: WorkCompletionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [links, setLinks] = useState<string[]>(['']);
  const [notes, setNotes] = useState('');
  const [description, setDescription] = useState('');
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = Array.from(event.target.files || []);
    setFiles(prev => [...prev, ...uploadedFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const addLink = () => {
    setLinks(prev => [...prev, '']);
  };

  const updateLink = (index: number, value: string) => {
    setLinks(prev => prev.map((link, i) => i === index ? value : link));
  };

  const removeLink = (index: number) => {
    setLinks(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      toast({
        title: "Missing Description",
        description: "Please provide a description of the completed work.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: Upload files to storage and get URLs
      const fileUrls: string[] = []; // await uploadFiles(files);
      
      const completionProof = {
        files: fileUrls,
        links: links.filter(link => link.trim()),
        notes: notes.trim(),
        description: description.trim()
      };

      const response = await fetch('/api/escrow/submit-work-completion', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId: transaction.id,
          completionProof
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit work completion');
      }

      toast({
        title: "Work Completed",
        description: "Your work has been submitted for review. The client has 7 days to approve or request revisions.",
      });

      onComplete();
    } catch (error) {
      console.error('Error submitting work completion:', error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your work completion. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Submit Work Completion
        </CardTitle>
        <CardDescription>
          Upload your deliverables and provide completion details for invoice #{transaction.invoice_id}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Work Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Work Description *</Label>
          <Textarea
            id="description"
            placeholder="Describe the work you have completed..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[100px]"
            required
          />
        </div>

        {/* File Upload */}
        <div className="space-y-2">
          <Label>Deliverables (Optional)</Label>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="flex-1"
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.zip,.rar"
              />
              <Upload className="h-4 w-4 text-muted-foreground" />
            </div>
            
            {files.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm">Uploaded Files:</Label>
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
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
        </div>

        {/* Links */}
        <div className="space-y-2">
          <Label>Links (Optional)</Label>
          <div className="space-y-2">
            {links.map((link, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  type="url"
                  placeholder="https://..."
                  value={link}
                  onChange={(e) => updateLink(index, e.target.value)}
                  className="flex-1"
                />
                {links.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLink(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addLink}
              className="w-full"
            >
              <Link className="h-4 w-4 mr-2" />
              Add Link
            </Button>
          </div>
        </div>

        {/* Additional Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Additional Notes (Optional)</Label>
          <Textarea
            id="notes"
            placeholder="Any additional information or context..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[80px]"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !description.trim()}
            className="flex-1"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Work Completion'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 