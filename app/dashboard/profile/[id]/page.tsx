"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { usePosts } from "@/hooks/use-posts";
import { useFavorites } from "@/hooks/use-favorites";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/hooks/use-user";
import { MapPin, Briefcase, DollarSign, Heart, Share2, Mail, MessageCircle, Bookmark, FileIcon, ImageIcon, Loader2, Send, UserPlus, MoreHorizontal, Edit, Plus, Globe, ThumbsUp, Trash2 } from "lucide-react";
import { motion, Variants } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      bounce: 0.2,
      duration: 0.8,
      stiffness: 50
    }
  },
  hover: {
    y: -5,
    transition: {
      type: "spring",
      bounce: 0.2,
      duration: 0.3
    }
  }
};

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

export default function ProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useUser();
  const { posts, createPost, likePost, unlikePost, savePost, unsavePost, addComment, addReply, likeComment, unlikeComment, deleteComment } = usePosts();
  const { 
    saveProfile, 
    unsaveProfile, 
    isProfileSaved, 
    likeListing, 
    unlikeListing, 
    isListingLiked 
  } = useFavorites();
  const [profile, setProfile] = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("posts");
  const [newComments, setNewComments] = useState<{ [key: string]: string }>({});
  const [newReplies, setNewReplies] = useState<{ [key: string]: string }>({});
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", id)
          .single();

        if (profileError) throw profileError;
        setProfile(profileData);

        const { data: listingsData, error: listingsError } = await supabase
          .from("listings")
          .select("*, profiles(full_name, professional_role, avatar_url, country)")
          .eq("user_id", id)
          .eq("status", "active")
          .order("created_at", { ascending: false });

        if (listingsError) throw listingsError;
        setListings(listingsData || []);
      } catch (error) {
        console.error("Error fetching profile data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProfile();
    }
  }, [id]);

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

  const stripHtml = (html: string) => {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!profile) {
    return <div className="flex items-center justify-center min-h-screen">Profile not found</div>;
  }

  const userPosts = posts.filter(post => post.author.id === id);

  const handleAddComment = async (postId: string) => {
    const content = newComments[postId];
    if (!content?.trim()) return;

    try {
      await addComment(postId, content);
      setNewComments(prev => ({ ...prev, [postId]: "" }));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddReply = async (postId: string, parentCommentId: string) => {
    const content = newReplies[parentCommentId];
    if (!content?.trim()) return;

    try {
      await addReply(postId, parentCommentId, content);
      setNewReplies(prev => ({ ...prev, [parentCommentId]: "" }));
      setReplyingTo(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add reply. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCommentAction = async (commentId: string, action: "like" | "unlike") => {
    try {
      switch (action) {
        case "like":
          await likeComment(commentId);
          break;
        case "unlike":
          await unlikeComment(commentId);
          break;
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to perform action. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePostAction = async (postId: string, action: "like" | "unlike" | "save" | "unsave") => {
    try {
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
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to perform action. Please try again.",
        variant: "destructive",
      });
    }
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

  const handleProfileClick = (userId: string) => {
    router.push(`/dashboard/profile/${userId}`);
  };

  const handleListingClick = (listingId: string) => {
    router.push(`/listing/${listingId}`);
  };

  const handleConnect = async () => {
    try {
      // Add connection logic here
      setIsConnected(!isConnected);
      toast({
        title: isConnected ? "Connection Removed" : "Connection Request Sent",
        description: isConnected ? "You've removed this connection." : "Your connection request has been sent.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send connection request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleMessage = () => {
    // Navigate to messages or open message dialog
    router.push(`/dashboard/messages?userId=${id}`);
  };

  const handleSaveProfile = async () => {
    if (!user || !profile) return;
    
    try {
      if (isProfileSaved(profile.id)) {
        await unsaveProfile(profile.id);
        toast({
          title: "Profile removed from favorites",
          description: "The profile has been removed from your favorites.",
        });
      } else {
        await saveProfile(profile.id);
        toast({
          title: "Profile saved to favorites",
          description: "The profile has been added to your favorites.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLikeListing = async (listingId: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to like listings.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isListingLiked(listingId)) {
        await unlikeListing(listingId);
        toast({
          title: "Listing removed from favorites",
          description: "The listing has been removed from your favorites.",
        });
      } else {
        await likeListing(listingId);
        toast({
          title: "Listing added to favorites",
          description: "The listing has been added to your favorites.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update favorites. Please try again.",
        variant: "destructive",
      });
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

  return (
    <motion.div 
      className="min-h-screen bg-background"
      initial="hidden"
      animate="visible"
      variants={pageVariants}
    >
      {/* Profile Header */}
      <motion.div className="relative" variants={itemVariants}>
        {/* Cover Image */}
        <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-500" />
        
        {/* Profile Info */}
        <div className="max-w-4xl mx-auto px-4">
          <div className="relative -mt-16">
            <Avatar className="h-32 w-32 border-4 border-background">
              <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
              <AvatarFallback>{profile.full_name?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            
            <div className="mt-4">
              <h1 className="text-2xl font-bold">{profile.full_name}</h1>
              <p className="text-muted-foreground">{profile.professional_role}</p>
              
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                {profile.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{profile.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Briefcase className="h-4 w-4" />
                  <span>{profile.company || 'No company'}</span>
                </div>
              </div>

              {/* LinkedIn-style action buttons */}
              <div className="flex items-center gap-3 mt-6">
                <Button 
                  variant={isConnected ? "outline" : "default"} 
                  size="sm"
                  onClick={handleConnect}
                  className="flex items-center gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  {isConnected ? "Connected" : "Connect"}
                </Button>
                <Button variant="outline" size="sm" onClick={handleMessage}>
                  <Mail className="h-4 w-4 mr-2" />
                  Message
                </Button>
                {user?.id !== id && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleSaveProfile}
                    className="flex items-center gap-2"
                  >
                    <Bookmark className={`h-4 w-4 ${isProfileSaved(id as string) ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                    {isProfileSaved(id as string) ? 'Saved' : 'Save Profile'}
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Share2 className="h-4 w-4 mr-2" />
                      Share Profile
                    </DropdownMenuItem>
                    {user?.id !== id && (
                      <DropdownMenuItem onClick={handleSaveProfile}>
                      <Bookmark className="h-4 w-4 mr-2" />
                        {isProfileSaved(id as string) ? 'Remove from Favorites' : 'Add to Favorites'}
                    </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div className="max-w-4xl mx-auto px-4 mt-8" variants={itemVariants}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="listings">Listings</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-6">
            <motion.div className="space-y-4" variants={itemVariants}>
              {userPosts.map((post) => (
                <motion.div key={post.id} variants={itemVariants}>
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Avatar>
                            <AvatarImage src={post.author.avatar_url || undefined} alt={post.author.full_name || undefined} />
                            <AvatarFallback>{post.author.full_name?.charAt(0) || 'U'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-semibold">{post.author.full_name}</h4>
                            <p className="text-sm text-muted-foreground">{post.author.professional_role}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(post.created_at)}</p>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">...</div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-4">{post.content}</p>
                      {post.attachments.length > 0 && (
                        <div className="grid gap-4 mb-4">
                          {post.attachments.map((attachment) => (
                            <div key={attachment.id}>
                              {getFilePreview(attachment)}
                            </div>
                          ))}
                        </div>
                      )}
                      {post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {post.tags.map((tag, idx) => (
                            <Badge key={idx} variant="secondary">{tag}</Badge>
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
                            <Heart className={`h-4 w-4 ${post.has_liked ? 'text-blue-500' : ''}`} />
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
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 px-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                                      >
                                        <Trash2 className="h-3 w-3 mr-1" />
                                        Delete
                                      </Button>
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
                                        <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-5 px-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                                            >
                                              <Trash2 className="h-3 w-3 mr-1" />
                                              Delete
                                            </Button>
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
          </TabsContent>

          <TabsContent value="listings" className="mt-6">
            <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-6" variants={itemVariants}>
              {listings.map((listing) => (
                <motion.div
                  key={listing.id}
                  variants={itemVariants}
                  whileHover={{ y: -5 }}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.3 }}
                >
                  <Card className="group flex flex-col justify-between h-full bg-white dark:bg-zinc-900/60 border border-primary/10 shadow-lg hover:shadow-xl transition-all duration-200 hover:border-primary/40 rounded-2xl overflow-hidden">
                    <CardContent className="p-0 flex flex-col h-full">
                      <div className="flex flex-col h-full">
                        {/* Header with Badge and Avatar */}
                        <div className="p-4 pb-2 flex items-center gap-3 border-b border-border/30">
                          <Avatar className="h-12 w-12 border-2 border-primary/30">
                            <AvatarImage src={listing.profiles?.avatar_url} alt={listing.profiles?.full_name} />
                            <AvatarFallback>{listing.profiles?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-base truncate">{listing.profiles?.full_name}</div>
                            <div className="text-xs text-muted-foreground truncate">{listing.profiles?.professional_role}</div>
                          </div>
                          <Badge variant="secondary" className="text-xs px-2 py-1 whitespace-nowrap">{listing.listing_type}</Badge>
                        </div>

                        {/* Title and Publication Date */}
                        <div className="px-4 pt-3 pb-1">
                          <h2 className="text-lg font-bold line-clamp-2 group-hover:text-primary transition-colors mb-1">{listing.title}</h2>
                          <span className="text-xs text-muted-foreground">{new Date(listing.created_at).toLocaleDateString()}</span>
                        </div>

                        {/* Description Preview */}
                        <div className="px-4 text-sm text-muted-foreground line-clamp-3 mb-2">
                          {stripHtml(listing.description)}
                        </div>

                        {/* Funding Stage and Compensation */}
                        <div className="px-4 mb-2">
                          <div className="flex flex-wrap gap-2">
                            {listing.funding_stage && (
                              <div className="flex items-center gap-1.5 bg-primary/5 text-primary px-2.5 py-1 rounded-full text-xs font-medium">
                                <Briefcase className="h-3.5 w-3.5" />
                                <span>{listing.funding_stage}</span>
                              </div>
                            )}
                            {listing.compensation_type && (
                              <div className="flex items-center gap-1.5 bg-primary/5 text-primary px-2.5 py-1 rounded-full text-xs font-medium">
                                <DollarSign className="h-3.5 w-3.5" />
                                <span>{listing.compensation_type}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Location and Sector */}
                        <div className="px-4 flex items-center gap-3 text-muted-foreground text-xs mb-2">
                          <MapPin className="h-4 w-4" />
                          <span>{listing.location_city ? `${listing.location_city}, ` : ""}{listing.location_country}</span>
                          {listing.sector && <><span className="mx-2">•</span><Badge variant="outline" className="text-xs">{listing.sector}</Badge></>}
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-auto border-t border-border/30">
                          <div className="p-4 flex items-center gap-2">
                            <Button 
                              variant="default" 
                              className="flex-1 font-semibold"
                              onClick={() => handleListingClick(listing.id)}
                            >
                              View Details
                            </Button>
                            <div className="flex gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={() => handleLikeListing(listing.id)}
                              >
                                <Heart className={`h-4 w-4 ${isListingLiked(listing.id) ? 'fill-red-500 text-red-500' : ''}`} />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Share2 className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Mail className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </TabsContent>

          <TabsContent value="about" className="mt-6">
            <motion.div className="space-y-6" variants={itemVariants}>
              {/* Enhanced About Section */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">About</h3>
                    {user?.id === id && (
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Enhanced Bio Section */}
                    <div>
                      <h4 className="font-medium mb-3 text-base">Bio</h4>
                      <div className="bg-muted/30 rounded-lg p-4">
                        <p className="text-muted-foreground leading-relaxed">
                          {profile.bio || 'No bio available. This person hasn\'t added a bio yet.'}
                        </p>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    {/* Enhanced Skills Section */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-base">Skills</h4>
                        {user?.id === id && (
                          <Button variant="ghost" size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Skill
                          </Button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {profile.skills && profile.skills.length > 0 ? (
                          profile.skills.map((skill: string, index: number) => (
                            <Badge 
                              key={index} 
                              variant="secondary"
                              className="px-3 py-1 text-sm font-medium bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors"
                            >
                              {skill}
                            </Badge>
                          ))
                        ) : (
                          <div className="text-muted-foreground text-sm italic">
                            No skills listed yet.
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <Separator />
                    
                    {/* Enhanced Experience Section */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-base">Experience</h4>
                        {user?.id === id && (
                          <Button variant="ghost" size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Experience
                          </Button>
                        )}
                      </div>
                      <div className="space-y-4">
                        {profile.experience && profile.experience.length > 0 ? (
                          profile.experience.map((exp: any, index: number) => (
                            <div key={index} className="flex gap-4 p-4 bg-muted/30 rounded-lg">
                              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Briefcase className="h-6 w-6 text-primary" />
                              </div>
                              <div className="flex-1">
                                <h5 className="font-medium text-base">{exp.title}</h5>
                                <p className="text-sm text-muted-foreground">{exp.company}</p>
                                <p className="text-xs text-muted-foreground">{exp.duration}</p>
                                {exp.description && (
                                  <p className="text-sm text-muted-foreground mt-2">{exp.description}</p>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-muted-foreground text-sm italic p-4 bg-muted/30 rounded-lg">
                            No experience listed yet.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Additional Sections */}
                    <Separator />
                    
                    {/* Education Section */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-base">Education</h4>
                        {user?.id === id && (
                          <Button variant="ghost" size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Education
                          </Button>
                        )}
                      </div>
                      <div className="space-y-4">
                        {profile.education && profile.education.length > 0 ? (
                          profile.education.map((edu: any, index: number) => (
                            <div key={index} className="flex gap-4 p-4 bg-muted/30 rounded-lg">
                              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Bookmark className="h-6 w-6 text-primary" />
                              </div>
                              <div className="flex-1">
                                <h5 className="font-medium text-base">{edu.degree}</h5>
                                <p className="text-sm text-muted-foreground">{edu.school}</p>
                                <p className="text-xs text-muted-foreground">{edu.year}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-muted-foreground text-sm italic p-4 bg-muted/30 rounded-lg">
                            No education listed yet.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Contact Information */}
                    <Separator />
                    <div>
                      <h4 className="font-medium text-base mb-3">Contact Information</h4>
                      <div className="space-y-2 text-sm">
                        {profile.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">{profile.email}</span>
                          </div>
                        )}
                        {profile.phone && (
                          <div className="flex items-center gap-2">
                            <MessageCircle className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">{profile.phone}</span>
                          </div>
                        )}
                        {profile.website && (
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                              {profile.website}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
} 