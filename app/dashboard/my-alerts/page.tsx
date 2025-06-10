'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { BellRing, Search, Plus, User, PenLine, Trash2, SlidersHorizontal, CalendarIcon } from "lucide-react";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

export default function MyAlertsPage() {
  const [activeTab, setActiveTab] = useState("active");
  const [date, setDate] = useState<Date | undefined>(undefined);

  const activeAlerts = [
    {
      id: "1",
      name: "Expert Digital Marketing",
      criteria: [
        { label: "Co-founder", color: "bg-blue-100 text-blue-800" },
        { label: "Marketing", color: "bg-green-100 text-green-800" },
        { label: "Paris", color: "bg-red-100 text-red-800" },
        { label: "+2", color: "bg-gray-100 text-gray-800" },
      ],
      lastNotification: "May 29, 2025, 10:23 AM",
      results: "3 new results",
      status: true,
    },
    {
      id: "2",
      name: "Seed Investor",
      criteria: [
        { label: "Investor", color: "bg-purple-100 text-purple-800" },
        { label: "Fintech", color: "bg-yellow-100 text-yellow-800" },
        { label: "€100k-€500k", color: "bg-pink-100 text-pink-800" },
        { label: "+3", color: "bg-gray-100 text-gray-800" },
      ],
      lastNotification: "May 28, 2025, 4:45 PM",
      results: "1 new result",
      status: true,
    },
    {
      id: "3",
      name: "Full-stack Developer",
      criteria: [
        { label: "Developer", color: "bg-indigo-100 text-indigo-800" },
        { label: "Remote", color: "bg-orange-100 text-orange-800" },
        { label: "5+ years", color: "bg-teal-100 text-teal-800" },
        { label: "+2", color: "bg-gray-100 text-gray-800" },
      ],
      lastNotification: "May 27, 2025, 9:12 AM",
      results: "5 new results",
      status: true,
    },
    {
      id: "4",
      name: "Startup Co-founder",
      criteria: [
        { label: "Co-founder", color: "bg-cyan-100 text-cyan-800" },
        { label: "Lyon", color: "bg-lime-100 text-lime-800" },
        { label: "SaaS", color: "bg-amber-100 text-amber-800" },
        { label: "+1", color: "bg-gray-100 text-gray-800" },
      ],
      lastNotification: "May 25, 2025, 2:30 PM",
      results: "No new results",
      status: false,
    },
    {
      id: "5",
      name: "Business Angel",
      criteria: [
        { label: "Investor", color: "bg-fuchsia-100 text-fuchsia-800" },
        { label: "GreenTech", color: "bg-emerald-100 text-emerald-800" },
        { label: "€500k+", color: "bg-rose-100 text-rose-800" },
        { label: "+2", color: "bg-gray-100 text-gray-800" },
      ],
      lastNotification: "-",
      results: "Pending approval",
      status: true,
    },
  ];

  const notificationHistory = [
    {
      id: "101",
      alertName: "Expert Digital Marketing",
      date: "2025-05-29",
      time: "10:23",
      type: "New Results",
      details: "3 new profiles matched your criteria.",
    },
    {
      id: "102",
      alertName: "Seed Investor",
      date: "2025-05-28",
      time: "16:45",
      type: "New Results",
      details: "1 new profile matched your criteria.",
    },
    {
      id: "103",
      alertName: "Full-stack Developer",
      date: "2025-05-27",
      time: "09:12",
      type: "New Results",
      details: "5 new profiles matched your criteria.",
    },
    {
      id: "104",
      alertName: "Startup Co-founder",
      date: "2025-05-25",
      time: "14:30",
      type: "No New Results",
      details: "No new profiles matched your criteria.",
    },
  ];

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">My Alerts</h2>
        <div className="flex items-center space-x-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> New Alert
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] md:max-w-[700px]">
              <DialogHeader>
                <DialogTitle>Create New Alert</DialogTitle>
                <DialogDescription>
                  Define your criteria to get notified when new profiles match.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="alertName" className="text-right">
                    Alert Name
                  </Label>
                  <Input id="alertName" placeholder="e.g., Senior Software Engineer" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="criteria" className="text-right">
                    Criteria
                  </Label>
                  <Textarea id="criteria" placeholder="e.g., Location: Paris, Role: Marketing, Experience: 5+ years (comma separated)" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="notificationFrequency" className="text-right">
                    Frequency
                  </Label>
                  <Select>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select notification frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Create Alert</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <p className="text-muted-foreground">
        Get notified instantly when new profiles match your search criteria
      </p>

      <Tabs defaultValue="active" onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active Alerts ({activeAlerts.filter(alert => alert.status).length})</TabsTrigger>
          <TabsTrigger value="history">Notification History ({notificationHistory.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search alerts..." className="pl-8 max-w-sm" />
            </div>
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status: All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" className="shrink-0">
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">ALERT NAME</TableHead>
                  <TableHead>CRITERIA</TableHead>
                  <TableHead className="w-[200px]">LAST NOTIFICATION</TableHead>
                  <TableHead className="text-right w-[150px]">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeAlerts.map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell className="font-medium">
                      <div className='flex items-center gap-2'>
                        <BellRing className='h-4 w-4 text-muted-foreground' />
                        {alert.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {alert.criteria.map((c, index) => (
                          <Badge key={index} className={c.color}>
                            {c.label}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {alert.lastNotification} <br/>
                      <span className="text-muted-foreground text-sm">{alert.results}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Switch checked={alert.status} />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <User className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Matches</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <PenLine className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        <TabsContent value="history" className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search history..." className="pl-8 max-w-sm" />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[240px] justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Button variant="outline" size="icon" className="shrink-0">
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">ALERT NAME</TableHead>
                  <TableHead>DATE & TIME</TableHead>
                  <TableHead>TYPE</TableHead>
                  <TableHead>DETAILS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notificationHistory.map((notification) => (
                  <TableRow key={notification.id}>
                    <TableCell className="font-medium">{notification.alertName}</TableCell>
                    <TableCell>{notification.date} {notification.time}</TableCell>
                    <TableCell>{notification.type}</TableCell>
                    <TableCell>{notification.details}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}