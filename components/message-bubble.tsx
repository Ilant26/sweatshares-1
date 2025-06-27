"use client"

import { Message, MessageAttachment } from "@/lib/messages"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from 'date-fns'
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

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
  const router = useRouter();

  // Function to render message content with enhanced formatting and action buttons
  const renderMessageContent = (content: string) => {
    // Check if this is a system message (listing response notification)
    const isSystemMessage = content.includes('**New Response Received!**') || 
                           content.includes('**Response Submitted Successfully!**') ||
                           content.includes('**Response Accepted!**') ||
                           content.includes('**Response Rejected**') ||
                           content.includes('**Escrow Started!**') ||
                           content.includes('**Deal Completed Successfully!**') ||
                           content.includes('**Payment Received!**') ||
                           content.includes('**Response Not Accepted**') ||
                           content.includes('**Payment Required for Escrow**');

    if (isSystemMessage) {
      return renderSystemMessage(content);
    }

    // Regular message with clickable links
    const linkRegex = /(\/dashboard\/[^\s]+)/g;
    const parts = content.split(linkRegex);
    
    return parts.map((part, index) => {
      if (linkRegex.test(part)) {
        return (
          <Button
            key={index}
            variant="link"
            className="h-auto p-0 text-blue-500 underline hover:text-blue-700 transition-colors"
            onClick={() => router.push(part)}
          >
            {part}
          </Button>
        );
      }
      return part;
    });
  };

  // Function to render system messages with enhanced Shadcn UI styling
  const renderSystemMessage = (content: string) => {
    const lines = content.split('\n').filter(line => line.trim());
    const title = lines[0];
    const details: { [key: string]: string } = {};
    const actions: { text: string; link: string }[] = [];
    let message = '';
    let inMessageSection = false;

    // Parse the message content
    lines.forEach((line, index) => {
      if (index === 0) return; // Skip title

      if (line.includes('**Listing:**')) {
        details.listing = line.replace('**Listing:**', '').trim();
      } else if (line.includes('**From:**')) {
        details.from = line.replace('**From:**', '').trim();
      } else if (line.includes('**Offer:**') || line.includes('**Your Offer:**') || line.includes('**Amount:**')) {
        details.amount = line.replace(/^\*\*(Offer|Your Offer|Amount):\*\*\s*/, '').trim();
      } else if (line.includes('**Responder:**')) {
        details.responder = line.replace('**Responder:**', '').trim();
      } else if (line.includes('**Message:**')) {
        inMessageSection = true;
      } else if (line.includes('**Next Steps:**') || line.includes('**What\'s Next:**') || line.includes('**Don\'t Give Up:**')) {
        inMessageSection = false;
      } else if (line.includes('**Manage Response:**') || line.includes('**View All Responses:**') || line.includes('**Manage Escrow:**') || line.includes('**View Completed Deals:**')) {
        const linkMatch = line.match(/\/dashboard\/[^\s]+/);
        if (linkMatch) {
          actions.push({
            text: line.replace(/^\*\*[^*]+\*\*:\s*/, '').replace(/\s*\/dashboard\/[^\s]+$/, '').trim(),
            link: linkMatch[0]
          });
        }
      } else if (line.includes('**Track Your Response:**') || line.includes('**Track Your Response Status:**') || line.includes('**Complete Payment:**') || line.includes('**View Your Earnings:**') || line.includes('**Browse More Listings:**')) {
        const linkMatch = line.match(/\/dashboard\/[^\s]+/);
        if (linkMatch) {
          actions.push({
            text: line.replace(/^\*\*[^*]+\*\*:\s*/, '').replace(/\s*\/dashboard\/[^\s]+$/, '').trim(),
            link: linkMatch[0]
          });
        }
      } else if (inMessageSection && line.trim() && !line.startsWith('**')) {
        message += line + '\n';
      }
    });

    // Get icon and color based on message type
    const getMessageStyle = () => {
      if (title.includes('New Response Received')) {
        return { 
          icon: '🎯', 
          bgColor: 'bg-blue-50 dark:bg-blue-950/20', 
          borderColor: 'border-blue-200 dark:border-blue-800', 
          textColor: 'text-blue-800 dark:text-blue-200',
          badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
        };
      } else if (title.includes('Response Submitted')) {
        return { 
          icon: '📝', 
          bgColor: 'bg-green-50 dark:bg-green-950/20', 
          borderColor: 'border-green-200 dark:border-green-800', 
          textColor: 'text-green-800 dark:text-green-200',
          badgeColor: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
        };
      } else if (title.includes('Response Accepted') || title.includes('Your Response Was Accepted')) {
        return { 
          icon: '🎉', 
          bgColor: 'bg-emerald-50 dark:bg-emerald-950/20', 
          borderColor: 'border-emerald-200 dark:border-emerald-800', 
          textColor: 'text-emerald-800 dark:text-emerald-200',
          badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
        };
      } else if (title.includes('Response Rejected') || title.includes('Response Not Accepted')) {
        return { 
          icon: '😔', 
          bgColor: 'bg-red-50 dark:bg-red-950/20', 
          borderColor: 'border-red-200 dark:border-red-800', 
          textColor: 'text-red-800 dark:text-red-200',
          badgeColor: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
        };
      } else if (title.includes('Escrow Started') || title.includes('Payment Required')) {
        return { 
          icon: '🔒', 
          bgColor: 'bg-purple-50 dark:bg-purple-950/20', 
          borderColor: 'border-purple-200 dark:border-purple-800', 
          textColor: 'text-purple-800 dark:text-purple-200',
          badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
        };
      } else if (title.includes('Deal Completed') || title.includes('Payment Received')) {
        return { 
          icon: '💰', 
          bgColor: 'bg-amber-50 dark:bg-amber-950/20', 
          borderColor: 'border-amber-200 dark:border-amber-800', 
          textColor: 'text-amber-800 dark:text-amber-200',
          badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
        };
      }
      return { 
        icon: '📢', 
        bgColor: 'bg-gray-50 dark:bg-gray-950/20', 
        borderColor: 'border-gray-200 dark:border-gray-800', 
        textColor: 'text-gray-800 dark:text-gray-200',
        badgeColor: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
      };
    };

    const style = getMessageStyle();

    return (
      <Card className={`${style.bgColor} ${style.borderColor} border shadow-sm`}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-background shadow-sm">
              <span className="text-sm">{style.icon}</span>
            </div>
            <div className="flex-1">
              <CardTitle className={`text-sm font-semibold ${style.textColor}`}>
                {title.replace(/\*\*/g, '')}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                System notification
              </p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {/* Details */}
          {Object.keys(details).length > 0 && (
            <div className="space-y-2">
              {details.listing && (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Listing</span>
                  <Badge variant="secondary" className="text-xs">
                    {details.listing}
                  </Badge>
                </div>
              )}
              {details.from && (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">From</span>
                  <span className="text-sm font-medium">{details.from}</span>
                </div>
              )}
              {details.responder && (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Responder</span>
                  <span className="text-sm font-medium">{details.responder}</span>
                </div>
              )}
              {details.amount && (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Amount</span>
                  <Badge className={`${style.badgeColor} font-bold`}>
                    {details.amount}
                  </Badge>
                </div>
              )}
            </div>
          )}

          {/* Message */}
          {message.trim() && (
            <div className="rounded-lg bg-background/50 p-3 border">
              <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">
                {message.trim()}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          {actions.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {actions.map((action, index) => (
                <Button
                  key={index}
                  size="sm"
                  variant="default"
                  className="text-xs"
                  onClick={() => router.push(action.link)}
                >
                  {action.text}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div
      className={cn(
        "flex items-end gap-2 max-w-[85%]",
        isSent ? "flex-row-reverse self-end" : "self-start"
      )}
    >
      <Avatar className="h-6 w-6 flex-shrink-0">
        <AvatarImage src={message.sender?.avatar_url || undefined} />
        <AvatarFallback className="text-xs">{message.sender?.username?.[0]?.toUpperCase()}</AvatarFallback>
      </Avatar>
      <div
        className={cn(
          "rounded-2xl p-3 break-words shadow-sm",
          isSent 
            ? "bg-primary text-primary-foreground rounded-br-md" 
            : "bg-muted rounded-bl-md"
        )}
      >
        <div className="space-y-2">
          {renderMessageContent(message.content)}
          {message.attachments && message.attachments.length > 0 && (
            <div className="space-y-2">
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
        </div>
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