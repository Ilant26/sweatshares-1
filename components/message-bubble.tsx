"use client"

import { Message, MessageAttachment } from "@/lib/messages"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from 'date-fns'
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

const handleFileDownload = async (filepath: string, filename: string) => {
  try {
    const { data, error } = await supabase.storage
      .from('message-attachments')
      .download(filepath);
    
    if (error) throw error;
    
    const url = window.URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    toast.error('Failed to download file');
  }
};

interface MessageBubbleProps {
  message: Message & { attachments?: MessageAttachment[] }
  currentUserId: string
  onAttachmentLoad?: () => void
}

export function MessageBubble({ message, currentUserId, onAttachmentLoad }: MessageBubbleProps) {
  const isSent = message.sender_id === currentUserId;

  return (
    <div
      className={cn(
        "flex items-end gap-2 max-w-[85%]",
        isSent ? "flex-row-reverse self-end" : "self-start"
      )}
    >
      <Avatar className="h-6 w-6 flex-shrink-0">
        <AvatarImage src={message.sender?.avatar_url || undefined} />
        <AvatarFallback>{message.sender?.username?.[0]?.toUpperCase()}</AvatarFallback>
      </Avatar>
      <div
        className={cn(
          "rounded-lg p-3 break-words",
          isSent ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm" : "bg-muted rounded-2xl rounded-tl-sm"
        )}
      >
        <p className="text-sm">{message.content}</p>
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 space-y-2">
            {message.attachments.map((attachment) => {
              const isImage = attachment.type?.startsWith('image/');
              const isVideo = attachment.type?.startsWith('video/');

              if (isImage) {
                return (
                  <div key={attachment.id} className="relative">
                    <img
                      src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/message-attachments/${attachment.filepath}`}
                      alt={attachment.filename}
                      className="max-w-full rounded-md"
                      loading="lazy"
                      onLoad={onAttachmentLoad}
                    />
                  </div>
                );
              }

              if (isVideo) {
                return (
                  <div key={attachment.id} className="relative">
                    <video
                      src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/message-attachments/${attachment.filepath}`}
                      controls
                      className="max-w-full rounded-md"
                      onLoadedData={onAttachmentLoad}
                    />
                  </div>
                );
              }

              return (
                <div key={attachment.id} className="flex items-center gap-2 bg-background/50 p-2 rounded-md">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm truncate">{attachment.filename}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFileDownload(attachment.filepath, attachment.filename)}
                  >
                    Download
                  </Button>
                </div>
              );
            })}
          </div>
        )}
        <span className={cn(
          "text-[10px] text-muted-foreground block mt-1",
          isSent ? "text-right" : "text-left"
        )}>
          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
        </span>
      </div>
    </div>
  );
} 