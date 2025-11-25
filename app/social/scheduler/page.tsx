'use client';

import { useState, useEffect } from 'react';
import { Calendar, Plus, Search, Filter, Download, Upload, RefreshCw, Clock, Check, X, Edit, Trash2, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { useScheduler } from '@/lib/hooks/useScheduler';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const config = {
  title: "Social Media Scheduler",
  description: "Schedule and manage your social media posts across all platforms"
};

const platforms = [
  { id: 'facebook', name: 'Facebook', icon: '📘' },
  { id: 'instagram', name: 'Instagram', icon: '📸' },
  { id: 'twitter', name: 'Twitter', name: '𝕏', icon: '𝕏' },
  { id: 'linkedin', name: 'LinkedIn', icon: '💼' },
  { id: 'gmb', name: 'Google My Business', icon: '🔍' },
];

export default function SocialSchedulerPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    platforms: [] as string[],
    scheduledFor: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
  });
  
  const { loading, error, posts, schedulePost, fetchScheduledPosts } = useScheduler();

  useEffect(() => {
    fetchScheduledPosts();
  }, [fetchScheduledPosts]);

  const handlePlatformToggle = (platformId: string) => {
    setNewPost(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platformId)
        ? prev.platforms.filter(id => id !== platformId)
        : [...prev.platforms, platformId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await schedulePost({
        ...newPost,
        status: 'scheduled',
        scheduledFor: new Date(newPost.scheduledFor).toISOString(),
      });
      setIsDialogOpen(false);
      setNewPost({
        title: '',
        content: '',
        platforms: [],
        scheduledFor: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
      });
    } catch (error) {
      console.error('Failed to schedule post:', error);
    }
  };

  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const upcomingPosts = filteredPosts.filter(post => 
    new Date(post.scheduledFor) > new Date() && post.status === 'scheduled'
  );
  
  const publishedPosts = filteredPosts.filter(post => 
    post.status === 'published'
  );
  
  const drafts = filteredPosts.filter(post => 
    post.status === 'draft'
  );
  
  const failedPosts = filteredPosts.filter(post => 
    post.status === 'failed'
  );

  const renderPostCard = (post: any) => (
    <Card key={post.id} className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{post.title}</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={post.status === 'published' ? 'success' : 
                             post.status === 'failed' ? 'destructive' : 'outline'}>
                {post.status}
              </Badge>
              <span className="text-sm text-gray-500">
                {format(new Date(post.scheduledFor), 'MMM d, yyyy h:mm a')}
              </span>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                <span>Edit</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-700 mb-3">{post.content}</p>
        <div className="flex flex-wrap gap-2">
          {post.platforms?.map((platform: string) => (
            <Badge key={platform} variant="secondary" className="gap-1">
              {platforms.find(p => p.id === platform)?.icon || '🌐'}
              {platforms.find(p => p.id === platform)?.name || platform}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{config.title}</h1>
              <p className="text-gray-500">{config.description}</p>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Schedule Post
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Schedule New Post</DialogTitle>
                <DialogDescription>
                  Create and schedule a new social media post
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={newPost.title}
                      onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                      placeholder="Enter post title"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="content">Content</Label>
                    <Textarea
                      id="content"
                      value={newPost.content}
                      onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                      placeholder="Write your post content here..."
                      className="min-h-[120px]"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Platforms</Label>
                    <div className="flex flex-wrap gap-2">
                      {platforms.map((platform) => (
                        <div key={platform.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={platform.id}
                            checked={newPost.platforms.includes(platform.id)}
                            onCheckedChange={() => handlePlatformToggle(platform.id)}
                          />
                          <Label htmlFor={platform.id} className="cursor-pointer">
                            {platform.icon} {platform.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="scheduledFor">Schedule For</Label>
                    <Input
                      id="scheduledFor"
                      type="datetime-local"
                      value={newPost.scheduledFor}
                      onChange={(e) => setNewPost({...newPost, scheduledFor: e.target.value})}
                      min={new Date().toISOString().slice(0, 16)}
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Scheduling...' : 'Schedule Post'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Actions Bar */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="upcoming" className="space-y-4">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="upcoming" className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Upcoming
              {upcomingPosts.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {upcomingPosts.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="published" className="flex items-center gap-1">
              <Check className="h-4 w-4" />
              Published
              {publishedPosts.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {publishedPosts.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="drafts" className="flex items-center gap-1">
              <Edit className="h-4 w-4" />
              Drafts
              {drafts.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {drafts.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="failed" className="flex items-center gap-1">
              <X className="h-4 w-4" />
              Failed
              {failedPosts.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {failedPosts.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          <Button variant="ghost" size="sm" onClick={fetchScheduledPosts} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <TabsContent value="upcoming" className="space-y-4">
          {loading && upcomingPosts.length === 0 ? (
            <div className="text-center py-8">
              <div className="animate-pulse">Loading scheduled posts...</div>
            </div>
          ) : upcomingPosts.length > 0 ? (
            upcomingPosts.map(renderPostCard)
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No upcoming posts</h3>
                <p className="text-sm text-gray-500 mb-4">Schedule your first post to get started</p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule Post
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="published" className="space-y-4">
          {loading && publishedPosts.length === 0 ? (
            <div className="text-center py-8">
              <div className="animate-pulse">Loading published posts...</div>
            </div>
          ) : publishedPosts.length > 0 ? (
            publishedPosts.map(renderPostCard)
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <Check className="h-12 w-12 mx-auto text-green-500 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No published posts yet</h3>
                <p className="text-sm text-gray-500">Your published posts will appear here</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="drafts" className="space-y-4">
          {loading && drafts.length === 0 ? (
            <div className="text-center py-8">
              <div className="animate-pulse">Loading drafts...</div>
            </div>
          ) : drafts.length > 0 ? (
            drafts.map(renderPostCard)
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <Edit className="h-12 w-12 mx-auto text-blue-500 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No drafts yet</h3>
                <p className="text-sm text-gray-500">Save a post as a draft to see it here</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="failed" className="space-y-4">
          {loading && failedPosts.length === 0 ? (
            <div className="text-center py-8">
              <div className="animate-pulse">Loading failed posts...</div>
            </div>
          ) : failedPosts.length > 0 ? (
            failedPosts.map(renderPostCard)
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <X className="h-12 w-12 mx-auto text-red-500 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No failed posts</h3>
                <p className="text-sm text-gray-500">Great job! All your posts were published successfully</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
