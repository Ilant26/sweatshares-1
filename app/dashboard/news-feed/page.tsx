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
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function NewsFeedPage() {
  const posts = [
    {
      id: "1",
      author: {
        name: "Camille Durand",
        title: "Co-founder, Technovate",
        avatar: "https://randomuser.me/api/portraits/women/1.jpg",
      },
      time: "2 hours ago",
      content:
        "Share your thoughts, ideas, or opportunities with your network...",
      media: [],
      comments: [
        { id: "c1", author: { name: "Sophia Dubois", avatar: "https://randomuser.me/api/portraits/women/2.jpg" }, time: "9 hours ago", text: "I like this!" },
      ],
      likes: 128,
      views: 42,
      tags: ["#Innovation", "#Tech"],
    },
    {
      id: "2",
      author: {
        name: "Thomas Moreau",
        title: "Co-founder of Nextech Solutions",
        avatar: "https://randomuser.me/api/portraits/men/1.jpg",
      },
      time: "2 hours ago",
      content:
        "We are thrilled to announce that Nextech Solutions has raised €2M to accelerate the development of our conversational AI platform for the healthcare sector! A huge thank you to our investors @PhilippeLaurent and @CaveFontaine for their trust. #HealthTech #AI #Funding",
      media: ["/images/post-image-1.jpg"],
      comments: [
        { id: "c2", author: { name: "Philippe Laurent", avatar: "https://randomuser.me/api/portraits/men/2.jpg" }, time: "30 minutes ago", text: "I'm interested in the adventure!" },
      ],
      likes: 50,
      views: 15,
      tags: ["#Hiring", "#React", "#NodeJS"],
      offerDetails: true,
    },
    {
      id: "3",
      author: {
        name: "Sophie Dubois",
        title: "Marketing Manager, Innovate Corp",
        avatar: "https://randomuser.me/api/portraits/women/3.jpg",
      },
      time: "1 day ago",
      content:
        "Congratulations on this fundraising! Your solution meets a real need in the health sector.",
      media: [],
      comments: [
        { id: "c3", author: { name: "Amira Benali", avatar: "https://randomuser.me/api/portraits/women/4.jpg" }, time: "8 hours ago", text: "Well done!" },
      ],
      likes: 30,
      views: 10,
      tags: ["#Success", "#Teamwork"],
    },
    {
      id: "4",
      author: {
        name: "Philippe Laurent",
        title: "CEO, InvestTech Group",
        avatar: "https://randomuser.me/api/portraits/men/3.jpg",
      },
      time: "30 minutes ago",
      content:
        "Offer: Full-Stack Developer (React / Node.js) We are looking for a passionate full-stack developer in education to join our team. Possibility of cash + equity remuneration. Mission: Make education accessible to all through technology. #Recruitment #EdTech #Developer",
      media: ["/images/post-image-2.jpg"],
      comments: [
        { id: "c4", author: { name: "Julien Mercier", avatar: "https://randomuser.me/api/portraits/men/4.jpg" }, time: "2 hours ago", text: "Great news!" },
      ],
      likes: 75,
      views: 20,
      tags: ["#Funding", "#Startups"],
      offerDetails: true,
    },
    {
      id: "5",
      author: {
        name: "Julien Mercier",
        title: "Product Manager, DataSolutions",
        avatar: "https://randomuser.me/api/portraits/men/5.jpg",
      },
      time: "2 hours ago",
      content:
        "Very happy to participate in this adventure! The team is exceptional and the product has already proven its worth with early clients.",
      media: [],
      comments: [
        { id: "c5", author: { name: "Claire Fontaine", avatar: "https://randomuser.me/api/portraits/women/5.jpg" }, time: "1 hour ago", text: "Indeed!" },
      ],
      likes: 45,
      views: 18,
      tags: ["#AI", "#Technology"],
    },
    {
      id: "6",
      author: {
        name: "Claire Fontaine",
        title: "CTO, SecureNet Systems",
        avatar: "https://randomuser.me/api/portraits/women/6.jpg",
      },
      time: "4 hours ago",
      content:
        "I am delighted to announce our new event \"B2B Startup Funding - 2023 Trends\" which will take place on June 15 in Paris. A unique opportunity to meet investors and exchange best practices for fundraising in 2023. Limited spots! #Funding #VentureCapital #Startup",
      media: ["/images/post-image-3.jpg"],
      comments: [
        { id: "c6", author: { name: "Camille Durand", avatar: "https://randomuser.me/api/portraits/women/1.jpg" }, time: "1 hour ago", text: "Impressive work!" },
      ],
      likes: 90,
      views: 25,
      tags: ["#Cloud", "#Security"],
      offerDetails: true,
    },
  ];

  const trendingTopics = [
    { name: "#ArtificialIntelligence", posts: "1,345 posts" },
    { name: "#StartupFunding", posts: "878 posts" },
    { name: "#SustainableDevelopment", posts: "733 posts" },
    { name: "#RemoteWork", posts: "681 posts" },
    { name: "#TechForGood", posts: "542 posts" },
  ];

  const savedPosts = [
    { title: "UI/UX Trends for French Applications in 2025", saved: "2 days ago" },
    { title: "Nextech Solutions Releases CRM for Conversation AI", saved: "1 week ago" },
    { title: "Event: B2B Startup Funding", saved: "2 weeks ago" },
  ];

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 lg:grid-cols-[250px_1fr_250px] xl:grid-cols-[300px_1fr_300px]">
          {/* Left Sidebar */}
          <div className="grid auto-rows-max items-start gap-4 md:gap-8">
            {/* Profile Card */}
            <Card x-chunk="dashboard-05-chunk-0">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src="https://randomuser.me/api/portraits/women/1.jpg" alt="Camille Durand" />
                    <AvatarFallback>CD</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold">Camille Durand</h3>
                    <p className="text-sm text-muted-foreground">
                      Co-founder, Technovate
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
            <Card x-chunk="dashboard-05-chunk-4">
              <CardHeader className="pb-3">
                <h3 className="text-lg font-semibold">My Saved Posts</h3>
              </CardHeader>
              <CardContent className="grid gap-2">
                {savedPosts.map((post, index) => (
                  <div key={index} className="pb-2 mb-2 border-b">
                    <h4 className="font-medium">{post.title}</h4>
                    <p className="text-xs text-muted-foreground">{post.saved}</p>
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
            <Card x-chunk="dashboard-05-chunk-1">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage src="/avatars/01.png" alt="Camille Durand" />
                    <AvatarFallback>CD</AvatarFallback>
                  </Avatar>
                  <Textarea
                    placeholder="Share your thoughts, ideas, or opportunities with your network..."
                    className="flex-grow min-h-[60px]"
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
                  <Button>Share <Share2 className="ml-2 h-4 w-4" /></Button>
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
                          <AvatarImage src={post.author.avatar} alt={post.author.name} />
                          <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold">{post.author.name}</h4>
                          <p className="text-sm text-muted-foreground">{post.author.title}</p>
                          <p className="text-xs text-muted-foreground">{post.time}</p>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">...</div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4">{post.content}</p>
                    {post.media.length > 0 && (
                      <div className="grid gap-2 mb-4">
                        {post.media.map((src, idx) => (
                          <img key={idx} src={src} alt={`Post media ${idx + 1}`} className="w-full rounded-md object-cover" />
                        ))}
                      </div>
                    )}
                    {post.offerDetails && (
                      <Button variant="link" className="px-0 pt-2 justify-start">
                        Full offer details <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    )}
                    <div className="flex justify-between text-muted-foreground text-sm">
                      <div className="flex items-center space-x-2">
                        <ThumbsUp className="h-4 w-4" /> {post.likes}
                        <MessageCircle className="h-4 w-4" /> {post.comments.length}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Bookmark className="h-4 w-4" /> Save
                        <Share2 className="h-4 w-4" /> Share
                      </div>
                    </div>
                    <Separator className="my-4" />
                    {post.comments.map((comment) => (
                      <div key={comment.id} className="flex items-start space-x-2 mb-2">
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={comment.author.avatar} alt={comment.author.name} />
                          <AvatarFallback>{comment.author.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <div className="flex items-baseline space-x-1">
                            <span className="text-sm font-semibold">{comment.author.name}</span>
                            <span className="text-xs text-muted-foreground">{comment.time}</span>
                          </div>
                          <p className="text-sm">{comment.text}</p>
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center space-x-2 mt-4">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="/avatars/01.png" alt="User" />
                        <AvatarFallback>U</AvatarFallback>
                      </Avatar>
                      <Input placeholder="Add a comment..." className="flex-grow" />
                      <Button size="icon" variant="ghost">
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
            <Card x-chunk="dashboard-05-chunk-2">
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
            <Card x-chunk="dashboard-05-chunk-3">
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