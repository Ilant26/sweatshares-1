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
import { MapPin, Briefcase, DollarSign, Heart, Share2, Mail, MessageCircle, Bookmark, FileIcon, ImageIcon, Loader2, Send, UserPlus, MoreHorizontal, Edit, Plus, Globe, ThumbsUp, Trash2, Star, Users, Eye, Building2, Save, X } from "lucide-react";
import { motion, Variants } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SkillsSelector } from "@/components/ui/skills-selector";
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

// Type definitions for posts and comments
type PostAttachment = {
  id: string;
  post_id: string;
  file_path: string;
  file_name: string;
  file_size: number;
  content_type: string;
  type: 'image' | 'video' | 'document';
  created_at: string;
};

type PostComment = {
  id: string;
  content: string;
  created_at: string;
  parent_id: string | null;
  author: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  likes_count: number;
  has_liked: boolean;
  replies: PostComment[];
};

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

const getSkillColor = (skill: string) => {
  const colors = [
    'bg-blue-100 text-blue-800',
    'bg-purple-100 text-purple-800',
    'bg-green-100 text-green-800',
    'bg-yellow-100 text-yellow-800',
    'bg-red-100 text-red-800',
    'bg-orange-100 text-orange-800',
    'bg-indigo-100 text-indigo-800',
    'bg-teal-100 text-teal-800',
  ];
  const index = skill.length % colors.length;
  return colors[index];
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
  const [editingBio, setEditingBio] = useState(false);
  const [editingSkills, setEditingSkills] = useState(false);
  const [editingWebsite, setEditingWebsite] = useState(false);
  const [tempBio, setTempBio] = useState("");
  const [tempSkills, setTempSkills] = useState<string[]>([]);
  const [tempWebsite, setTempWebsite] = useState("");
  const [saving, setSaving] = useState(false);
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

  const handleMessage = (userId: string) => {
    if (userId) {
      router.push(`/dashboard/messages?userId=${userId}`);
    }
  };

  // Helper functions to get proper labels based on listing type and profile type
  const getAmountLabel = (listingType: string, profileType: string): string => {
    if (profileType === "Founder" && listingType === "sell-startup") {
      return "Sale Price";
    }
    if (profileType === "Investor" && (listingType === "investment-opportunity" || listingType === "buy-startup")) {
      return "Investment Capacity";
    }
    if (profileType === "Investor" && listingType === "co-investor") {
      return "Missing Capital";
    }
    if (profileType === "Founder" && listingType === "find-funding") {
      return "Amount Seeking";
    }
    return "Amount";
  };

  const getCompensationValueLabel = (listingType: string, profileType: string): string => {
    if (profileType === "Founder" && listingType === "sell-startup") {
      return "Percentage for Sale";
    }
    if (profileType === "Investor" && listingType === "co-investor") {
      return "Equity Offered";
    }
    return "Compensation";
  };

  // Function to format listing type values for display
  const formatListingType = (listingType: string): string => {
    const typeMap: { [key: string]: string } = {
      "find-funding": "Find Funding",
      "cofounder": "Co Founder",
      "expert-freelance": "Expert/ Freelance",
      "employee": "Employee",
      "mentor": "Mentor",
      "sell-startup": "Startup Sale",
      "investment-opportunity": "Investment Opportunity",
      "buy-startup": "Buy Startup",
      "co-investor": "Co-investor",
      "mission": "Mission",
      "job": "Job"
    };
    
    return typeMap[listingType] || listingType;
  };

  const getListingTypeColor = (listingType: string) => {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-purple-100 text-purple-800',
      'bg-green-100 text-green-800',
      'bg-yellow-100 text-yellow-800',
      'bg-red-100 text-red-800',
      'bg-orange-100 text-orange-800',
      'bg-indigo-100 text-indigo-800',
      'bg-teal-100 text-teal-800',
    ];
    const index = listingType.length % colors.length;
    return colors[index];
  };

  const handleListingClick = (listingId: string) => {
    const profileName = profile?.full_name || 'User';
    const encodedName = encodeURIComponent(profileName);
    router.push(`/dashboard/listings/${listingId}?source=profile&profileName=${encodedName}&profileId=${id}`);
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

  // Bio editing functions
  const startEditingBio = () => {
    setTempBio(profile.bio || "");
    setEditingBio(true);
  };

  const cancelEditingBio = () => {
    setEditingBio(false);
    setTempBio("");
  };

  const saveBio = async () => {
    if (!user || user.id !== id) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ bio: tempBio })
        .eq("id", user.id);

      if (error) throw error;

      setProfile((prev: any) => ({ ...prev, bio: tempBio }));
      setEditingBio(false);
      toast({
        title: "Bio updated",
        description: "Your bio has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update bio. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Skills editing functions
  const startEditingSkills = () => {
    setTempSkills(profile.skills || []);
    setEditingSkills(true);
  };

  const cancelEditingSkills = () => {
    setEditingSkills(false);
    setTempSkills([]);
  };

  const saveSkills = async () => {
    if (!user || user.id !== id) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ skills: tempSkills })
        .eq("id", user.id);

      if (error) throw error;

      setProfile((prev: any) => ({ ...prev, skills: tempSkills }));
      setEditingSkills(false);
      toast({
        title: "Skills updated",
        description: "Your skills have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update skills. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Website editing functions
  const startEditingWebsite = () => {
    setTempWebsite(profile.website || "");
    setEditingWebsite(true);
  };

  const cancelEditingWebsite = () => {
    setEditingWebsite(false);
    setTempWebsite("");
  };

  const saveWebsite = async () => {
    if (!user || user.id !== id) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ website: tempWebsite })
        .eq("id", user.id);

      if (error) throw error;

      setProfile((prev: any) => ({ ...prev, website: tempWebsite }));
      setEditingWebsite(false);
      toast({
        title: "Website updated",
        description: "Your website has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update website. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
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
                <Button variant="outline" size="sm" onClick={() => handleMessage(id as string)}>
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
                    <Star className={`h-4 w-4 ${isProfileSaved(id as string) ? 'fill-yellow-400 text-yellow-500' : 'text-muted-foreground'}`} strokeWidth={isProfileSaved(id as string) ? 0 : 1.5} />
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
                      <Star className="h-4 w-4 mr-2" />
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
                          <Avatar 
                            className="cursor-pointer"
                            onClick={() => handleProfileClick(post.author.id)}
                          >
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
                        <div className="text-sm text-muted-foreground">...</div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-4">{post.content}</p>
                      {post.attachments.length > 0 && (
                        <div className="grid gap-4 mb-4">
                          {post.attachments.map((attachment: PostAttachment) => (
                            <div key={attachment.id}>
                              {getFilePreview(attachment)}
                            </div>
                          ))}
                        </div>
                      )}
                      {post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {post.tags.map((tag: string, idx: number) => (
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
                            <Star className={`h-4 w-4 ${post.has_saved ? 'fill-yellow-400 text-yellow-500' : 'text-muted-foreground'}`} strokeWidth={post.has_saved ? 0 : 1.5} />
                            Save
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Share2 className="h-4 w-4" /> Share
                          </Button>
                        </div>
                      </div>
                      <Separator className="my-4" />
                      {post.comments.map((comment: PostComment) => (
                        <div key={comment.id} className="space-y-3">
                          {/* Main Comment */}
                          <div className="flex items-start space-x-2">
                          <Avatar 
                            className="h-7 w-7 cursor-pointer"
                            onClick={() => handleProfileClick(comment.author.id)}
                          >
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
                              {comment.replies.map((reply: PostComment) => (
                                <div key={reply.id} className="flex items-start space-x-2">
                                  <Avatar 
                                    className="h-6 w-6 cursor-pointer"
                                    onClick={() => handleProfileClick(reply.author.id)}
                                  >
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
          </TabsContent>

          <TabsContent value="listings" className="mt-6">
            <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" variants={itemVariants}>
              {listings.map((listing) => (
                <motion.div
                  key={listing.id}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover="hover"
                  className="h-full"
                >
                  <Card className="group relative h-full bg-gradient-to-br from-white to-gray-50/50 dark:from-zinc-900/80 dark:to-zinc-800/60 border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] rounded-3xl overflow-hidden backdrop-blur-sm">
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    <CardContent className="relative p-0 flex flex-col h-full">
                      {/* Header Section */}
                      <div className="p-4 pb-3">
                        {/* Listing Type Badge */}
                        <div className="flex justify-end mb-2">
                          <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-xs px-2 py-1">
                            {formatListingType(listing.listing_type)}
                          </Badge>
                        </div>
                        
                        <div className="flex items-start gap-4">
                          {/* Avatar */}
                          <Avatar className="h-12 w-12 border-4 border-white/80 dark:border-zinc-800/80 shadow-lg">
                            <AvatarImage src={listing.profiles?.avatar_url || undefined} alt={listing.profiles?.full_name || 'User'} />
                            <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-primary to-primary/80 text-white">
                              {listing.profiles?.full_name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          
                          {/* Listing Info */}
                          <div className="flex-1 min-w-0">
                            <h3 
                              className="font-bold text-base text-gray-900 dark:text-white cursor-pointer hover:text-primary transition-colors mb-1"
                              onClick={() => handleProfileClick(listing.profiles?.id)}
                            >
                              {listing.profiles?.full_name || 'Unknown User'}
                            </h3>
                          
                            {listing.profiles?.professional_role && (
                              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {listing.profiles.professional_role}
                              </p>
                            )}
                          </div>
                        </div>
                        </div>

                      {/* Title and Description */}
                      <div className="px-4 pb-4">
                        <h4 className="font-bold text-base text-gray-900 dark:text-white mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                          {listing.title}
                        </h4>
                        
                        <div 
                          className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3 leading-relaxed mb-4"
                          dangerouslySetInnerHTML={{ __html: listing.description || '' }}
                        />
                        </div>

                      {/* Details Section */}
                      <div className="px-4 pb-4 space-y-3">
                        {/* Skills */}
                        {listing.skills && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Required Skills</h4>
                            <div className="flex flex-wrap gap-1.5">
                              {(Array.isArray(listing.skills) ? listing.skills : listing.skills.split(",").map((s: string) => s.trim())).map((skill: string) => (
                                <Badge 
                                  key={skill} 
                                  variant="secondary"
                                  className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/20 
                                           text-blue-700 dark:text-blue-400 border-blue-200/50 dark:border-blue-700/50 
                                           hover:bg-blue-100 dark:hover:bg-blue-800/30 transition-colors
                                           text-xs px-2 py-0.5 rounded-lg"
                                >
                                  {skill}
                                </Badge>
                              ))}
                        </div>
                          </div>
                        )}

                        {/* Compensation Information */}
                        {(listing.compensation_type || listing.compensation_value || listing.amount) && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                              {listing.profiles?.profile_type === "Founder" && listing.listing_type === "sell-startup" ? "Sale Details" : 
                               listing.profiles?.profile_type === "Investor" && (listing.listing_type === "investment-opportunity" || listing.listing_type === "buy-startup") ? "Investment Details" :
                               listing.profiles?.profile_type === "Investor" && listing.listing_type === "co-investor" ? "Co-Investment Details" :
                               "Compensation"}
                            </h4>
                            <div className="flex flex-wrap gap-1.5">
                              {listing.compensation_type && (
                                <Badge 
                                  variant="secondary"
                                  className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/20 
                                           text-green-700 dark:text-green-400 border-green-200/50 dark:border-green-700/50 
                                           hover:bg-green-100 dark:hover:bg-green-800/30 transition-colors
                                           text-xs px-2 py-0.5 rounded-lg"
                                >
                                  {listing.compensation_type}
                                </Badge>
                              )}
                              {listing.compensation_value && (
                                <>
                                  {typeof listing.compensation_value === 'object' ? (
                                    <>
                                      {(listing.compensation_value as any).salary && (
                                        <Badge 
                                          variant="secondary"
                                          className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/20 
                                                   text-green-700 dark:text-green-400 border-green-200/50 dark:border-green-700/50 
                                                   hover:bg-green-100 dark:hover:bg-green-800/30 transition-colors
                                                   text-xs px-2 py-0.5 rounded-lg"
                                        >
                                          Salary: {(listing.compensation_value as any).salary}
                                        </Badge>
                                      )}
                                      {(listing.compensation_value as any).equity && (
                                        <Badge 
                                          variant="secondary"
                                          className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/20 
                                                   text-green-700 dark:text-green-400 border-green-200/50 dark:border-green-700/50 
                                                   hover:bg-green-100 dark:hover:bg-green-800/30 transition-colors
                                                   text-xs px-2 py-0.5 rounded-lg"
                                        >
                                          Equity: {(listing.compensation_value as any).equity}
                                        </Badge>
                                      )}
                                      {(listing.compensation_value as any).cash && (
                                        <Badge 
                                          variant="secondary"
                                          className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/20 
                                                   text-green-700 dark:text-green-400 border-green-200/50 dark:border-green-700/50 
                                                   hover:bg-green-100 dark:hover:bg-green-800/30 transition-colors
                                                   text-xs px-2 py-0.5 rounded-lg"
                                        >
                                          Cash: {(listing.compensation_value as any).cash}
                                        </Badge>
                                      )}
                                      {(listing.compensation_value as any).value && (
                                        <Badge 
                                          variant="secondary"
                                          className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/20 
                                                   text-green-700 dark:text-green-400 border-green-200/50 dark:border-green-700/50 
                                                   hover:bg-green-100 dark:hover:bg-green-800/30 transition-colors
                                                   text-xs px-2 py-0.5 rounded-lg"
                                        >
                                          {getCompensationValueLabel(listing.listing_type, listing.profiles?.profile_type || '')}: {(listing.compensation_value as any).value}
                                        </Badge>
                                      )}
                                    </>
                                  ) : (
                                    <Badge 
                                      variant="secondary"
                                      className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/20 
                                               text-green-700 dark:text-green-400 border-green-200/50 dark:border-green-700/50 
                                               hover:bg-green-100 dark:hover:bg-green-800/30 transition-colors
                                               text-xs px-2 py-0.5 rounded-lg"
                                    >
                                      {getCompensationValueLabel(listing.listing_type, listing.profiles?.profile_type || '')}: {listing.compensation_value}
                                    </Badge>
                                  )}
                                </>
                              )}
                              {listing.amount && (
                                <Badge 
                                  variant="secondary"
                                  className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/20 
                                           text-green-700 dark:text-green-400 border-green-200/50 dark:border-green-700/50 
                                           hover:bg-green-100 dark:hover:bg-green-800/30 transition-colors
                                           text-xs px-2 py-0.5 rounded-lg"
                                >
                                  {getAmountLabel(listing.listing_type, listing.profiles?.profile_type || '')}: {listing.amount}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Key Details Badges */}
                          <div className="flex flex-wrap gap-2">
                            {listing.funding_stage && (
                            <div className="flex items-center gap-1.5 bg-purple-500/10 text-purple-600 px-3 py-1.5 rounded-full text-xs font-medium">
                                <Briefcase className="h-3.5 w-3.5" />
                              <span>Stage: {listing.funding_stage}</span>
                              </div>
                            )}
                        </div>

                        {/* Location and Sector */}
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <MapPin className="h-3 w-3" />
                          <span>{listing.location_city ? `${listing.location_city}, ` : ""}{listing.location_country}</span>
                          {listing.sector && (
                            <>
                              <span className="mx-1">•</span>
                              <Badge variant="outline" className="text-xs border-gray-200 dark:border-gray-700">
                                {listing.sector}
                              </Badge>
                            </>
                          )}
                        </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-auto border-t border-border/30">
                          <div className="p-4 flex items-center gap-2">
                            <Button 
                              variant="default" 
                              className="flex-1 font-semibold"
                              onClick={() => handleListingClick(listing.id)}
                            >
                            <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                            <div className="flex gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={() => handleLikeListing(listing.id)}
                              >
                                <Star className={`h-4 w-4 ${isListingLiked(listing.id) ? 'fill-yellow-400 text-yellow-500' : 'text-muted-foreground'}`} strokeWidth={isListingLiked(listing.id) ? 0 : 1.5} />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Share2 className="h-4 w-4" />
                              </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleMessage(listing.profiles?.id)}>
                                <Mail className="h-4 w-4" />
                              </Button>
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
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Enhanced Bio Section */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-base">Bio</h4>
                        {user?.id === id && !editingBio && (
                          <Button variant="ghost" size="sm" onClick={startEditingBio}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        )}
                      </div>
                      
                      {editingBio ? (
                        <div className="space-y-3">
                          <Textarea
                            value={tempBio}
                            onChange={(e) => setTempBio(e.target.value)}
                            placeholder="Tell us about yourself..."
                            className="min-h-[100px]"
                          />
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              onClick={saveBio}
                              disabled={saving}
                            >
                              {saving ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <Save className="h-4 w-4 mr-2" />
                                  Save
                                </>
                              )}
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={cancelEditingBio}
                              disabled={saving}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-muted/30 rounded-lg p-4">
                          <p className="text-muted-foreground leading-relaxed">
                            {profile.bio || 'No bio available. This person hasn\'t added a bio yet.'}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <Separator />
                    
                    {/* Enhanced Skills Section */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-base">Skills</h4>
                        {user?.id === id && !editingSkills && (
                          <Button variant="ghost" size="sm" onClick={startEditingSkills}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Skills
                          </Button>
                        )}
                      </div>
                      
                      {editingSkills ? (
                        <div className="space-y-3">
                          <SkillsSelector
                            value={tempSkills}
                            onChange={setTempSkills}
                            placeholder="Search and select skills..."
                            label=""
                          />
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              onClick={saveSkills}
                              disabled={saving}
                            >
                              {saving ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <Save className="h-4 w-4 mr-2" />
                                  Save
                                </>
                              )}
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={cancelEditingSkills}
                              disabled={saving}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {profile.skills && profile.skills.length > 0 ? (
                            profile.skills.map((skill: string, index: number) => (
                              <Badge 
                                key={index} 
                                className={`px-3 py-1 text-sm font-medium ${getSkillColor(skill)}`}
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
                      )}
                    </div>
                    
                    <Separator />
                    
                    {/* Website Section */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-base">Website</h4>
                        {user?.id === id && !editingWebsite && (
                          <Button variant="ghost" size="sm" onClick={startEditingWebsite}>
                            <Edit className="h-4 w-4 mr-2" />
                            {profile.website ? 'Edit' : 'Add'}
                          </Button>
                        )}
                      </div>
                      
                      {editingWebsite ? (
                        <div className="space-y-3">
                          <Input
                            value={tempWebsite}
                            onChange={(e) => setTempWebsite(e.target.value)}
                            placeholder="https://example.com"
                            type="url"
                          />
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              onClick={saveWebsite}
                              disabled={saving}
                            >
                              {saving ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <Save className="h-4 w-4 mr-2" />
                                  Save
                                </>
                              )}
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={cancelEditingWebsite}
                              disabled={saving}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2 text-sm">
                          {profile.website ? (
                            <div className="flex items-center gap-2">
                              <Globe className="h-4 w-4 text-muted-foreground" />
                              <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                {profile.website}
                              </a>
                            </div>
                          ) : (
                            <div className="text-muted-foreground text-sm italic">
                              No website listed yet.
                            </div>
                          )}
                        </div>
                      )}
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