"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

import {
  Share2,
  ThumbsUp,
  MessageCircle,
  Bookmark,
  Send,
  Link,
  Tag,
  ImageIcon,
  Filter,
  ArrowRight,
} from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { usePosts } from "@/hooks/use-posts";
import { useState } from "react";

export default function NewsFeedPage() {
  const { user } = useUser();
  const { posts, loading, createPost, likePost, unlikePost, savePost, unsavePost, addComment } = usePosts();
  const [newPostContent, setNewPostContent] = useState("");
  const [newComments, setNewComments] = useState<{ [key: string]: string }>({});

  const trendingTopics = [
    { name: "#ArtificialIntelligence", posts: "1,345 posts" },
    { name: "#StartupFunding", posts: "878 posts" },
    { name: "#SustainableDevelopment", posts: "733 posts" },
    { name: "#RemoteWork", posts: "681 posts" },
    { name: "#TechForGood", posts: "542 posts" },
  ];

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;
    await createPost(newPostContent);
    setNewPostContent("");
  };

  const handleAddComment = async (postId: string) => {
    const content = newComments[postId];
    if (!content?.trim()) return;

    await addComment(postId, content);
    setNewComments(prev => ({ ...prev, [postId]: "" }));
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

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 lg:grid-cols-[250px_1fr_250px] xl:grid-cols-[300px_1fr_300px]">
          {/* Left Sidebar */}
          <div className="grid auto-rows-max items-start gap-4 md:gap-8">
            {/* Profile Card */}
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
                    <span className="font-semibold">128</span> Connections
                  </div>
                  <div>
                    <span className="font-semibold">42</span> Views
                  </div>
                  <div>
                    <span className="font-semibold">8</span> Posts
                  </div>
                </div>
                <Button variant="outline" className="mt-2">
                  My publications
                </Button>
              </CardContent>
            </Card>

            {/* My Saved Posts Card */}
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
          </div>

          {/* Middle Column (Main Feed) */}
          <div className="grid auto-rows-max items-start gap-4 md:gap-8">
            {/* Create Post Card */}
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
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center text-muted-foreground text-sm">
                  <div className="flex items-center space-x-4">
                    <Button variant="ghost" className="text-blue-500 hover:text-blue-600">
                      <ImageIcon className="mr-2 h-4 w-4" /> Media
                    </Button>
                    <Button variant="ghost" className="text-green-500 hover:text-green-600">
                      <Link className="mr-2 h-4 w-4" /> Link
                    </Button>
                    <Button variant="ghost" className="text-purple-500 hover:text-purple-600">
                      <Tag className="mr-2 h-4 w-4" /> Tags
                    </Button>
                  </div>
                  <Button onClick={handleCreatePost}>Share <Share2 className="ml-2 h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>

            {/* Main Feed Posts */}
            <div className="grid gap-4">
              {posts.map((post) => (
                <Card key={post.id}>
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
                    {post.media_urls.length > 0 && (
                      <div className="grid gap-2 mb-4">
                        {post.media_urls.map((src, idx) => (
                          <img key={idx} src={src} alt={`Post media ${idx + 1}`} className="w-full rounded-md object-cover" />
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
                      <div key={comment.id} className="flex items-start space-x-2 mb-2">
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={comment.author.avatar_url || undefined} alt={comment.author.full_name || undefined} />
                          <AvatarFallback>{comment.author.full_name?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <div className="flex items-baseline space-x-1">
                            <span className="text-sm font-semibold">{comment.author.full_name}</span>
                            <span className="text-xs text-muted-foreground">{formatDate(comment.created_at)}</span>
                          </div>
                          <p className="text-sm">{comment.content}</p>
                        </div>
                      </div>
                    ))}
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
              ))}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="grid auto-rows-max items-start gap-4 md:gap-8">
            {/* Filter Card */}
            <Card>
              <CardHeader className="pb-3">
                <h3 className="text-lg font-semibold">Filter by</h3>
              </CardHeader>
              <CardContent className="grid gap-2">
                <h4 className="text-sm font-medium">Industry</h4>
                <Input placeholder="Select industries" />
                <h4 className="text-sm font-medium mt-4">Publication date</h4>
                <Button variant="outline" className="w-full justify-start">
                  Show all
                  <Filter className="ml-auto h-4 w-4" />
                </Button>
                <Button variant="secondary" className="mt-4">
                  Reset filters
                </Button>
              </CardContent>
            </Card>

            {/* Trending Topics Card */}
            <Card>
              <CardHeader className="pb-3">
                <h3 className="text-lg font-semibold">Trending Topics</h3>
              </CardHeader>
              <CardContent className="grid gap-2">
                {trendingTopics.map((topic, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <div>{topic.name}</div>
                    <div className="text-muted-foreground">{topic.posts}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}