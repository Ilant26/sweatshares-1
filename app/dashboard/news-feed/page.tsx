"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, Variants } from "framer-motion";
import { useUser } from "@/hooks/use-user";
import { usePosts } from "@/hooks/use-posts";
import { useToast } from "@/components/ui/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Share2,
  ThumbsUp,
  MessageCircle,
  Bookmark,
  Send,
  ImageIcon,
  Filter,
  ArrowRight,
  FileIcon,
  X,
  Loader2,
  MoreHorizontal,
  Edit,
  Trash2,
  UserPlus,
  Check,
  Briefcase,
  MapPin,
  DollarSign,
} from "lucide-react";
import { AttachmentType } from "@/lib/database.types";
import { supabase } from "@/lib/supabase";

const pageVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.5,
      when: "beforeChildren",
      staggerChildren: 0.1
    }
  }
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      bounce: 0.2,
      duration: 0.8
    }
  }
};

export default function NewsFeedPage() {
  const { user } = useUser();
  const { posts, loading, createPost, likePost, unlikePost, savePost, unsavePost, addComment, addReply, likeComment, unlikeComment, deleteComment, updatePost, deletePost } = usePosts();
  const [newPostContent, setNewPostContent] = useState("");
  const [newComments, setNewComments] = useState<{ [key: string]: string }>({});
  const [newReplies, setNewReplies] = useState<{ [key: string]: string }>({});
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [editingPost, setEditingPost] = useState<{ id: string; content: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [stats, setStats] = useState({
    connections: 0,
    posts: 0,
    listings: 0
  });
  const [suggestedConnections, setSuggestedConnections] = useState<any[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<{[key: string]: 'none' | 'pending' | 'accepted' | 'rejected'}>({});
  const [recentListings, setRecentListings] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      try {
        // Fetch connections count (only accepted connections)
        const { count: connectionsCount } = await supabase
          .from('connections')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'accepted')
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

        // Fetch posts count
        const { count: postsCount } = await supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        // Fetch listings count
        const { count: listingsCount } = await supabase
          .from('listings')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'active');

        setStats({
          connections: connectionsCount || 0,
          posts: postsCount || 0,
          listings: listingsCount || 0
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    const fetchSuggestedConnections = async () => {
      if (!user) return;

      try {
        // Get all connections (accepted, pending, rejected) for current user
        const { data: userConnections } = await supabase
          .from('connections')
          .select('*')
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

        // Get IDs of users the current user is already connected with
        const connectedUserIds = userConnections?.map(conn => 
          conn.sender_id === user.id ? conn.receiver_id : conn.sender_id
        ) || [];

        // Fetch profiles that the user is not connected with
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url, professional_role, bio, country, is_online, last_seen')
          .neq('id', user.id)
          .not('id', 'in', `(${connectedUserIds.join(',')})`)
          .limit(3); // Limit to 3 suggestions

        if (profiles) {
          setSuggestedConnections(profiles);
          
          // Build connection status map for suggested connections
          const statusMap: {[key: string]: 'none' | 'pending' | 'accepted' | 'rejected'} = {};
          profiles.forEach(profile => {
            statusMap[profile.id] = 'none';
          });
          setConnectionStatus(statusMap);
        }
      } catch (error) {
        console.error('Error fetching suggested connections:', error);
      }
    };

    const fetchRecentListings = async () => {
      try {
        const { data: listings } = await supabase
          .from('listings')
          .select('*, profiles(full_name, professional_role, avatar_url)')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(5); // Limit to 5 recent listings

        if (listings) {
          setRecentListings(listings);
        }
      } catch (error) {
        console.error('Error fetching recent listings:', error);
      }
    };

    fetchStats();
    fetchSuggestedConnections();
    fetchRecentListings();
  }, [user]);



  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() && selectedFiles.length === 0) return;
    
    try {
      setIsPosting(true);
      await createPost(newPostContent, selectedFiles);
      setNewPostContent("");
      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPosting(false);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
    if (file.type.startsWith('video/')) return <FileIcon className="h-4 w-4" />;
    return <FileIcon className="h-4 w-4" />;
  };

  const getFilePreview = (attachment: any) => {
    const { data: { publicUrl } } = supabase.storage
      .from('post-attachments')
      .getPublicUrl(attachment.file_path)
    
    switch (attachment.type) {
      case 'image':
        return (
          <img 
            src={publicUrl} 
            alt={attachment.file_name}
            className="w-full rounded-md object-cover max-h-96"
          />
        );
      case 'video':
        return (
          <video 
            src={publicUrl}
            controls
            className="w-full rounded-md max-h-96"
          />
        );
      case 'document':
        return (
          <a 
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 p-4 border rounded-md hover:bg-gray-50"
          >
            <FileIcon className="h-6 w-6" />
            <span>{attachment.file_name}</span>
          </a>
        );
      default:
        return null;
    }
  };

  const handleAddComment = async (postId: string) => {
    const content = newComments[postId];
    if (!content?.trim()) return;

    await addComment(postId, content);
    setNewComments(prev => ({ ...prev, [postId]: "" }));
  };

  const handleAddReply = async (postId: string, parentCommentId: string) => {
    const content = newReplies[parentCommentId];
    if (!content?.trim()) return;

    await addReply(postId, parentCommentId, content);
    setNewReplies(prev => ({ ...prev, [parentCommentId]: "" }));
    setReplyingTo(null);
  };

  const handleCommentAction = async (commentId: string, action: "like" | "unlike") => {
    switch (action) {
      case "like":
        await likeComment(commentId);
        break;
      case "unlike":
        await unlikeComment(commentId);
        break;
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment(commentId);
      toast({
        title: "Comment deleted",
        description: "Your comment has been deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete comment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePostAction = async (postId: string, action: "like" | "unlike" | "save" | "unsave") => {
    switch (action) {
      case "like":
        await likePost(postId);
        break;
      case "unlike":
        await unlikePost(postId);
        break;
      case "save":
        await savePost(postId);
        break;
      case "unsave":
        await unsavePost(postId);
        break;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const handleProfileClick = (userId: string) => {
    router.push(`/dashboard/profile/${userId}?source=news-feed`);
  };

  const isPostEditable = (createdAt: string) => {
    const postDate = new Date(createdAt);
    const now = new Date();
    const diffInMinutes = (now.getTime() - postDate.getTime()) / (1000 * 60);
    return diffInMinutes <= 15;
  };

  const handleEditPost = async (postId: string, newContent: string) => {
    try {
      if (!postId || !newContent) {
        throw new Error('Missing required fields for post update');
      }

      if (!isPostEditable(posts.find(p => p.id === postId)?.created_at || '')) {
        throw new Error('Post can only be edited within 15 minutes of creation');
      }

      await updatePost(postId, newContent);
      setEditingPost(null);
      
      toast({
        title: "Success",
        description: "Post updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update post",
        variant: "destructive",
      });
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      setIsDeleting(true);
      
      if (!postId) {
        throw new Error('Missing post ID for deletion');
      }

      await deletePost(postId);
      
      toast({
        title: "Success",
        description: "Post deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete post",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConnect = async (profileId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('connections')
        .insert({
          sender_id: user.id,
          receiver_id: profileId,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('Error sending connection request:', error);
        toast({
          title: "Error",
          description: "Failed to send connection request. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Update local state
      setConnectionStatus(prev => ({
        ...prev,
        [profileId]: 'pending'
      }));

      // Create notification for the receiver
      await supabase
        .from('notifications')
        .insert({
          user_id: profileId,
          type: 'connection_request',
          content: 'sent you a connection request',
          sender_id: user.id,
          read: false
        });

      toast({
        title: "Success",
        description: "Connection request sent successfully.",
      });
    } catch (error) {
      console.error('Error in handleConnect:', error);
      toast({
        title: "Error",
        description: "Failed to send connection request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getConnectionButton = (profile: any) => {
    const status = connectionStatus[profile.id] || 'none';

    if (status === 'pending') {
      return (
        <Button variant="outline" size="sm" disabled>
          <UserPlus className="h-4 w-4 mr-1" />
          Connection sent
        </Button>
      );
    }
    if (status === 'accepted') {
      return (
        <Button variant="ghost" size="sm" disabled>
          <Check className="h-4 w-4 mr-1" />
          Connected
        </Button>
      );
    }
    if (status === 'rejected') {
      return null;
    }
    return (
      <Button variant="outline" size="sm" onClick={() => handleConnect(profile.id)}>
        <UserPlus className="h-4 w-4 mr-1" />
        Connect
      </Button>
    );
  };

  const formatListingType = (listingType: string): string => {
    const typeMap: { [key: string]: string } = {
      // Founder listing types
      "find-funding": "Find Funding",
      "cofounder": "Co Founder",
      "expert-freelance": "Expert/ Freelance",
      "employee": "Employee",
      "mentor": "Mentor",
      "sell-startup": "Startup Sale",
      
      // Investor listing types
      "investment-opportunity": "Investment Opportunity",
      "buy-startup": "Buy Startup",
      "co-investor": "Co-investor",
      
      // Expert listing types
      "mission": "Mission",
      "job": "Job"
    };
    
    return typeMap[listingType] || listingType;
  };

  return (
    <motion.div 
      className="flex min-h-screen w-full flex-col bg-background"
      initial="hidden"
      animate="visible"
      variants={pageVariants}
    >
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-8">
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-4 sm:py-0 md:gap-6 lg:grid-cols-[220px_1fr_250px] xl:grid-cols-[250px_1fr_300px]">
          {/* Left Sidebar */}
          <motion.div className="grid auto-rows-max items-start gap-4 md:gap-8" variants={itemVariants}>
            {/* Profile Card */}
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.user_metadata?.full_name} />
                      <AvatarFallback>{user?.user_metadata?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-lg font-semibold">{user?.user_metadata?.full_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {user?.user_metadata?.professional_role}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-2">
                  <div className="flex justify-between text-sm">
                    <div>
                      <span className="font-semibold">{stats.connections}</span> Connections
                    </div>
                    <div>
                      <span className="font-semibold">{stats.listings}</span> Listings
                    </div>
                    <div>
                      <span className="font-semibold">{stats.posts}</span> Posts
                    </div>
                  </div>
                  <Button variant="outline" className="mt-2" onClick={() => router.push(`/dashboard/profile/${user?.id}`)}>
                    My Profile
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* My Saved Posts Card */}
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader className="pb-3">
                  <h3 className="text-lg font-semibold">My Saved Posts</h3>
                </CardHeader>
                <CardContent className="grid gap-2">
                  {posts.filter(post => post.has_saved).slice(0, 3).map((post, index) => (
                    <div key={post.id} className="pb-2 mb-2 border-b">
                      <h4 className="font-medium">{post.content.slice(0, 50)}...</h4>
                      <p className="text-xs text-muted-foreground">Saved {formatDate(post.created_at)}</p>
                    </div>
                  ))}
                  <Button variant="link" className="px-0 pt-2 justify-start">
                    View all saved posts <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Middle Column (Main Feed) */}
          <motion.div className="grid auto-rows-max items-start gap-4 md:gap-8" variants={itemVariants}>
            {/* Create Post Card */}
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.user_metadata?.full_name} />
                      <AvatarFallback>{user?.user_metadata?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <Textarea
                      placeholder="Share your thoughts, ideas, or opportunities with your network..."
                      className="flex-grow min-h-[60px]"
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                    />
                  </div>
                  {selectedFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                          <div className="flex items-center space-x-2">
                            {getFileIcon(file)}
                            <span className="text-sm truncate">{file.name}</span>
                          </div>
                          <Button
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
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center text-muted-foreground text-sm">
                    <div className="flex items-center space-x-4">
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        multiple
                        onChange={handleFileSelect}
                        accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                      />
                      <Button
                        variant="ghost"
                        className="text-blue-500 hover:text-blue-600"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <ImageIcon className="mr-2 h-4 w-4" /> Media
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="text-orange-500 hover:text-orange-600"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <FileIcon className="mr-2 h-4 w-4" /> Attachments
                      </Button>
                    </div>
                    <Button
                      onClick={handleCreatePost}
                      disabled={isPosting || (!newPostContent.trim() && selectedFiles.length === 0)}
                    >
                      {isPosting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Posting...
                        </>
                      ) : (
                        <>
                          Publish <Share2 className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Main Feed Posts */}
            <motion.div className="grid gap-4" variants={itemVariants}>
              {posts.map((post, index) => (
                <motion.div 
                  key={post.id} 
                  variants={itemVariants}
                  custom={index}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Avatar>
                            <AvatarImage src={post.author.avatar_url || undefined} alt={post.author.full_name || undefined} />
                            <AvatarFallback>{post.author.full_name?.charAt(0) || 'U'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 
                              className="font-semibold cursor-pointer hover:text-primary transition-colors"
                              onClick={() => handleProfileClick(post.author.id)}
                            >
                              {post.author.full_name}
                            </h4>
                            <p className="text-sm text-muted-foreground">{post.author.professional_role}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(post.created_at)}</p>
                          </div>
                        </div>
                        {post.author.id === user?.id && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {isPostEditable(post.created_at) && (
                                <DropdownMenuItem
                                  onClick={() => setEditingPost({ id: post.id, content: post.content })}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                              )}
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onSelect={(e) => e.preventDefault()}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Post</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this post? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeletePost(post.id)}
                                      className="bg-red-500 hover:bg-red-600 text-white"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {editingPost?.id === post.id ? (
                        <div className="space-y-4">
                          <Textarea
                            value={editingPost.content}
                            onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })}
                            className="min-h-[100px]"
                          />
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              onClick={() => setEditingPost(null)}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={() => handleEditPost(post.id, editingPost.content)}
                            >
                              Save Changes
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="mb-4">{post.content}</p>
                      )}
                      {post.attachments.length > 0 && (
                        <div className="grid gap-4 mb-4">
                          {post.attachments.map((attachment) => (
                            <div key={attachment.id}>
                              {getFilePreview(attachment)}
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex justify-between text-muted-foreground text-sm">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePostAction(post.id, post.has_liked ? 'unlike' : 'like')}
                          >
                            <ThumbsUp className={`h-4 w-4 ${post.has_liked ? 'text-blue-500' : ''}`} />
                            <span className="ml-1">{post.likes_count}</span>
                          </Button>
                          <Button variant="ghost" size="sm">
                            <MessageCircle className="h-4 w-4" />
                            <span className="ml-1">{post.comments_count}</span>
                          </Button>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePostAction(post.id, post.has_saved ? 'unsave' : 'save')}
                          >
                            <Bookmark className={`h-4 w-4 ${post.has_saved ? 'text-yellow-500' : ''}`} />
                            Save
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Share2 className="h-4 w-4" /> Share
                          </Button>
                        </div>
                      </div>
                      <Separator className="my-4" />
                      {post.comments.map((comment) => (
                        <div key={comment.id} className="space-y-3">
                          {/* Main Comment */}
                          <div className="flex items-start space-x-2">
                            <Avatar className="h-7 w-7">
                              <AvatarImage src={comment.author.avatar_url || undefined} alt={comment.author.full_name || undefined} />
                              <AvatarFallback>{comment.author.full_name?.charAt(0) || 'U'}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-baseline space-x-1">
                                <span 
                                  className="text-sm font-semibold cursor-pointer hover:text-primary transition-colors"
                                  onClick={() => handleProfileClick(comment.author.id)}
                                >
                                  {comment.author.full_name}
                                </span>
                                <span className="text-xs text-muted-foreground">{formatDate(comment.created_at)}</span>
                              </div>
                              <p className="text-sm">{comment.content}</p>
                              
                              {/* Comment Actions */}
                              <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-xs"
                                  onClick={() => handleCommentAction(comment.id, comment.has_liked ? 'unlike' : 'like')}
                                >
                                  <ThumbsUp className={`h-3 w-3 mr-1 ${comment.has_liked ? 'text-blue-500' : ''}`} />
                                  {comment.likes_count}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-xs"
                                  onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                >
                                  <MessageCircle className="h-3 w-3 mr-1" />
                                  Reply
                                </Button>
                                {comment.author.id === user?.id && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <DropdownMenuItem className="text-red-600" onSelect={e => e.preventDefault()}>
                                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                                          </DropdownMenuItem>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>Delete Comment</AlertDialogTitle>
                                            <AlertDialogDescription>
                                              Are you sure you want to delete this comment? This action cannot be undone.
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                              onClick={() => handleDeleteComment(comment.id)}
                                              className="bg-red-500 hover:bg-red-600 text-white"
                                            >
                                              Delete
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                              </div>

                              {/* Reply Input */}
                              {replyingTo === comment.id && (
                                <div className="flex items-center space-x-2 mt-3">
                                  <Avatar className="h-6 w-6">
                                    <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.user_metadata?.full_name} />
                                    <AvatarFallback>{user?.user_metadata?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                                  </Avatar>
                                  <Input
                                    placeholder="Write a reply..."
                                    className="flex-grow text-xs"
                                    value={newReplies[comment.id] || ''}
                                    onChange={(e) => setNewReplies(prev => ({ ...prev, [comment.id]: e.target.value }))}
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleAddReply(post.id, comment.id);
                                      }
                                    }}
                                  />
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    onClick={() => handleAddReply(post.id, comment.id)}
                                    className="h-6 px-2"
                                  >
                                    <Send className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Replies */}
                          {comment.replies.length > 0 && (
                            <div className="ml-9 space-y-2">
                              {comment.replies.map((reply) => (
                                <div key={reply.id} className="flex items-start space-x-2">
                                  <Avatar className="h-6 w-6">
                                    <AvatarImage src={reply.author.avatar_url || undefined} alt={reply.author.full_name || undefined} />
                                    <AvatarFallback>{reply.author.full_name?.charAt(0) || 'U'}</AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <div className="flex items-baseline space-x-1">
                                      <span 
                                        className="text-sm font-semibold cursor-pointer hover:text-primary transition-colors"
                                        onClick={() => handleProfileClick(reply.author.id)}
                                      >
                                        {reply.author.full_name}
                                      </span>
                                      <span className="text-xs text-muted-foreground">{formatDate(reply.created_at)}</span>
                                    </div>
                                    <p className="text-sm">{reply.content}</p>
                                    
                                    {/* Reply Actions */}
                                    <div className="flex items-center space-x-4 mt-1 text-xs text-muted-foreground">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-5 px-2 text-xs"
                                        onClick={() => handleCommentAction(reply.id, reply.has_liked ? 'unlike' : 'like')}
                                      >
                                        <ThumbsUp className={`h-3 w-3 mr-1 ${reply.has_liked ? 'text-blue-500' : ''}`} />
                                        {reply.likes_count}
                                      </Button>
                                      {reply.author.id === user?.id && (
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-5 w-5 p-0">
                                              <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            <AlertDialog>
                                              <AlertDialogTrigger asChild>
                                                <DropdownMenuItem className="text-red-600" onSelect={e => e.preventDefault()}>
                                                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                                                </DropdownMenuItem>
                                              </AlertDialogTrigger>
                                              <AlertDialogContent>
                                                <AlertDialogHeader>
                                                  <AlertDialogTitle>Delete Reply</AlertDialogTitle>
                                                  <AlertDialogDescription>
                                                    Are you sure you want to delete this reply? This action cannot be undone.
                                                  </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                  <AlertDialogAction
                                                    onClick={() => handleDeleteComment(reply.id)}
                                                    className="bg-red-500 hover:bg-red-600 text-white"
                                                  >
                                                    Delete
                                                  </AlertDialogAction>
                                                </AlertDialogFooter>
                                              </AlertDialogContent>
                                            </AlertDialog>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                      
                      {/* Main Comment Input */}
                      <div className="flex items-center space-x-2 mt-4">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.user_metadata?.full_name} />
                          <AvatarFallback>{user?.user_metadata?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                        <Input
                          placeholder="Add a comment..."
                          className="flex-grow"
                          value={newComments[post.id] || ''}
                          onChange={(e) => setNewComments(prev => ({ ...prev, [post.id]: e.target.value }))}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleAddComment(post.id);
                            }
                          }}
                        />
                        <Button size="icon" variant="ghost" onClick={() => handleAddComment(post.id)}>
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right Sidebar */}
          <motion.div className="grid auto-rows-max items-start gap-4 md:gap-8" variants={itemVariants}>
            {/* Suggested Connections Card */}
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader className="pb-2">
                  <h3 className="text-base font-semibold">Suggested Connections</h3>
                </CardHeader>
                <CardContent className="grid gap-2">
                  {suggestedConnections.length > 0 ? (
                    suggestedConnections.map((profile) => (
                      <div key={profile.id} className="flex items-center space-x-2 p-2 rounded-lg border">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name || undefined} />
                          <AvatarFallback>{profile.full_name?.charAt(0) || profile.username?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h4 
                            className="text-sm font-medium cursor-pointer hover:text-primary transition-colors truncate"
                            onClick={() => handleProfileClick(profile.id)}
                          >
                            {profile.full_name || profile.username}
                          </h4>
                          <p className="text-xs text-muted-foreground truncate">
                            {profile.professional_role}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          {getConnectionButton(profile)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-3">
                      <p className="text-sm text-muted-foreground">No suggestions available</p>
                    </div>
                  )}
                  <Button variant="outline" className="w-full mt-1" size="sm" onClick={() => router.push('/dashboard/connect')}>
                    View More
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

                        {/* Recent Listings Card */}
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader className="pb-2">
                  <h3 className="text-base font-semibold">Recent Listings</h3>
                </CardHeader>
                <CardContent className="grid gap-2">
                  {recentListings.length > 0 ? (
                    recentListings.map((listing) => (
                      <div key={listing.id} className="p-2 rounded border hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => router.push(`/dashboard/listings/${listing.id}`)}>
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-6 w-6 flex-shrink-0">
                            <AvatarImage src={listing.profiles?.avatar_url || undefined} alt={listing.profiles?.full_name || undefined} />
                            <AvatarFallback>{listing.profiles?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0 overflow-hidden">
                            <div className="flex items-center space-x-1 mb-1">
                              <h4 className="text-xs font-medium truncate flex-1">
                                {listing.profiles?.full_name || listing.profiles?.username || 'Unknown User'}
                              </h4>
                              <Badge variant="outline" className="text-xs flex-shrink-0 px-1 py-0">
                                {formatListingType(listing.listing_type)}
                              </Badge>
                            </div>
                            <p className="text-xs font-medium text-primary line-clamp-1">
                              {listing.title}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-3">
                      <Briefcase className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">No recent listings</p>
                    </div>
                  )}
                  <Button variant="outline" className="w-full mt-1" size="sm" onClick={() => router.push('/dashboard/listings')}>
                    View All Listings
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </main>
      </div>
    </motion.div>
  );
}