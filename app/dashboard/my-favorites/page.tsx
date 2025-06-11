'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

import { Search, SlidersHorizontal, Eye, Heart, Share2, Mail, Briefcase, MapPin, Building2 } from 'lucide-react';

interface Profile {
  id: string;
  type: 'profile';
  addedDate: string;
  image: string;
  name: string;
  title: string;
  description: string;
  skills: { label: string; color: string; }[];
  location: string;
}

interface Listing {
  id: string;
  type: 'listing';
  addedDate: string;
  icon: React.ReactNode;
  title: string;
  company: string;
  location: string;
  description: string;
  postedAgo: string;
}

type FavoriteItem = Profile | Listing;

export default function MyFavoritesPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const profiles: Profile[] = [
    {
      id: 'p1',
      type: 'profile',
      addedDate: 'May 15, 2025',
      image: 'https://randomuser.me/api/portraits/women/1.jpg',
      name: 'Sophie Dubois',
      title: 'Expert Digital Marketing',
      description: 'Specialist in digital marketing strategies with over 15 years of experience. Expertise in customer acquisition, loyalty, and analysis of ROI.',
      skills: [
        { label: 'Marketing', color: 'bg-blue-100 text-blue-800' },
        { label: 'Consulting', color: 'bg-purple-100 text-purple-800' },
      ],
      location: 'Paris, France',
    },
    {
      id: 'p2',
      type: 'profile',
      addedDate: 'May 18, 2025',
      image: 'https://randomuser.me/api/portraits/men/2.jpg',
      name: 'Philippe Laurent',
      title: 'Investor, Business Angel',
      description: 'Experienced investor with a diversified portfolio in tech and fintech sectors. Supported more than 20 startups in their...',
      skills: [
        { label: 'Investment', color: 'bg-green-100 text-green-800' },
        { label: 'Fintech', color: 'bg-yellow-100 text-yellow-800' },
      ],
      location: 'Lyon, France',
    },
    {
      id: 'p3',
      type: 'profile',
      addedDate: 'May 8, 2025',
      image: 'https://randomuser.me/api/portraits/women/3.jpg',
      name: 'Amina Benali',
      title: 'Founder, EduTech+',
      description: 'Passionate entrepreneur in education and technology. Founded EduTech+, a platform for innovative learning that has already won over...',
      skills: [
        { label: 'EdTech', color: 'bg-red-100 text-red-800' },
        { label: 'Startup', color: 'bg-orange-100 text-orange-800' },
      ],
      location: 'Toulouse, France',
    },
    {
      id: 'p4',
      type: 'profile',
      addedDate: 'May 5, 2025',
      image: 'https://randomuser.me/api/portraits/men/4.jpg',
      name: 'Julien Mercier',
      title: 'Full-stack Developer',
      description: 'Full-stack developer with 8 years of experience in web and mobile application development. Specialist in React, Node.js and architecture...',
      skills: [
        { label: 'Development', color: 'bg-indigo-100 text-indigo-800' },
        { label: 'React', color: 'bg-teal-100 text-teal-800' },
      ],
      location: 'Nantes, France',
    },
    {
      id: 'p5',
      type: 'profile',
      addedDate: 'May 22, 2025',
      image: 'https://randomuser.me/api/portraits/women/5.jpg',
      name: 'Clara Dubois',
      title: 'Product Manager',
      description: 'Experienced Product Manager with a focus on SaaS solutions and agile methodologies.',
      skills: [
        { label: 'Product Management', color: 'bg-blue-100 text-blue-800' },
        { label: 'SaaS', color: 'bg-purple-100 text-purple-800' },
      ],
      location: 'Bordeaux, France',
    },
    {
      id: 'p6',
      type: 'profile',
      addedDate: 'May 28, 2025',
      image: 'https://randomuser.me/api/portraits/men/6.jpg',
      name: 'Paul Lefebvre',
      title: 'Cybersecurity Expert',
      description: 'Cybersecurity consultant specialized in network security and data protection.',
      skills: [
        { label: 'Cybersecurity', color: 'bg-green-100 text-green-800' },
        { label: 'Network Security', color: 'bg-yellow-100 text-yellow-800' },
      ],
      location: 'Marseille, France',
    },
  ];

  const listings: Listing[] = [
    {
      id: 'l1',
      type: 'listing',
      addedDate: 'May 20, 2025',
      icon: <Briefcase className="h-8 w-8 text-muted-foreground" />,
      title: 'Senior React.js Developer',
      company: 'TechVision',
      location: 'Paris',
      description: 'We are looking for an experienced React.js developer to join our product team. You will work on innovative projects in a dynamic and stimulating environment.',
      postedAgo: '5 days ago',
    },
    {
      id: 'l2',
      type: 'listing',
      addedDate: 'May 12, 2025',
      icon: <Building2 className="h-8 w-8 text-muted-foreground" />,
      title: 'Senior Data Scientist',
      company: 'FinanceAI',
      location: 'Paris',
      description: 'We are seeking an experienced Data Scientist to join our team to develop and implement artificial intelligence solutions...',
      postedAgo: '5 days ago',
    },
  ];

  const filteredContent: FavoriteItem[] = [
    ...profiles.filter(profile => {
      const matchesSearch = searchTerm === '' || profile.name.toLowerCase().includes(searchTerm.toLowerCase()) || profile.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTab = activeTab === 'all' || activeTab === 'profiles';
      return matchesSearch && matchesTab;
    }),
    ...listings.filter(listing => {
      const matchesSearch = searchTerm === '' || listing.title.toLowerCase().includes(searchTerm.toLowerCase()) || listing.description.toLowerCase().includes(searchTerm.toLowerCase()) || listing.company.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTab = activeTab === 'all' || activeTab === 'listings';
      return matchesSearch && matchesTab;
    }),
  ];

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">My Favorites</h2>
        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <SlidersHorizontal className="mr-2 h-4 w-4" /> Sort by
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Date Added (newest)</DropdownMenuItem>
              <DropdownMenuItem>Date Added (oldest)</DropdownMenuItem>
              <DropdownMenuItem>Name (A-Z)</DropdownMenuItem>
              <DropdownMenuItem>Name (Z-A)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search in your favorites..."
            className="pl-8 max-w-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Tabs defaultValue="all" onValueChange={setActiveTab} className="w-auto">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="profiles">Profiles</TabsTrigger>
            <TabsTrigger value="listings">Listings</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredContent.length > 0 ? (
          filteredContent.map((item) => (
            <Card key={item.id} className="flex flex-col">
              <CardHeader className="flex-row items-center gap-4 space-y-0 pb-2">
                {item.type === 'profile' ? (
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={item.image} alt={item.name} />
                    <AvatarFallback>{item.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                ) : (
                  (item as Listing).icon
                )}
                <div className="flex-1">
                  <CardDescription className="text-xs font-semibold">Added {item.addedDate}</CardDescription>
                  <CardTitle className="text-lg leading-tight">
                    {item.type === 'profile' ? item.name : item.title}
                  </CardTitle>
                  {item.type === 'listing' && (
                    <CardDescription className="text-sm text-muted-foreground">
                      {(item as Listing).company} &bull; {(item as Listing).location}
                    </CardDescription>
                  )}
                  {item.type === 'profile' && (
                    <CardDescription className="text-sm text-muted-foreground">
                      {item.title}
                    </CardDescription>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-2">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {item.description}
                </p>
                {item.type === 'profile' && item.skills && item.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {item.skills.map((skill, index) => (
                      <Badge key={index} className={skill.color}>
                        {skill.label}
                      </Badge>
                    ))}
                  </div>
                )}
                {item.type === 'listing' && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="mr-1 h-4 w-4" />
                    <span>{(item as Listing).location}</span>
                  </div>
                )}
              </CardContent>
              <CardFooter className="mt-auto flex justify-between pt-4">
                <Button variant="outline" size="sm">
                  {item.type === 'profile' ? 'View Profile' : 'View Listing'}
                </Button>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon"><Heart className="h-4 w-4 fill-red-500 text-red-500" /></Button>
                  <Button variant="ghost" size="icon"><Share2 className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon"><Mail className="h-4 w-4" /></Button>
                </div>
              </CardFooter>
            </Card>
          ))
        ) : (
          <p className="col-span-full text-center text-muted-foreground">
            No favorites found.
          </p>
        )}
      </div>
    </div>
  );
}
 