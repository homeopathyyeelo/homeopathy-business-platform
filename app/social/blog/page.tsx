'use client';

import { useState } from 'react';
import { FileText, Plus, Search, Filter, Download, Upload, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function BlogWordPressPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const blogPosts = [
    {
      id: 1,
      title: 'Top 10 Homeopathic Remedies for Winter',
      platform: 'WordPress',
      status: 'Published',
      views: 1234,
      date: '2024-11-28'
    },
    {
      id: 2,
      title: 'Understanding Constitutional Remedies',
      platform: 'Medium',
      status: 'Draft',
      views: 0,
      date: '2024-11-30'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Blog & WordPress</h1>
            <p className="text-gray-500">Manage blog posts across platforms</p>
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search blog posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Sparkles className="h-4 w-4 mr-2" />
              AI Generate
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Post
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Blog Posts */}
      <Card>
        <CardHeader>
          <CardTitle>Blog Posts</CardTitle>
          <CardDescription>Manage and publish blog content</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {blogPosts.map((post) => (
              <div key={post.id} className="flex items-center justify-between p-4 bg-white border rounded-lg">
                <div>
                  <h3 className="font-medium">{post.title}</h3>
                  <p className="text-sm text-gray-500">{post.platform} • {post.date}</p>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant={post.status === 'Published' ? 'default' : 'secondary'}>
                    {post.status}
                  </Badge>
                  <span className="text-sm text-gray-500">{post.views} views</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
