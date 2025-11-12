"use client";

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert } from 'lucide-react';

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <ShieldAlert className="h-16 w-16 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold">Access Denied</CardTitle>
          <CardDescription>
            You don&apos;t have permission to access this page
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            This page requires specific permissions that your account doesn&apos;t have.
            Please contact your administrator if you believe this is an error.
          </p>
          
          <div className="flex gap-2">
            <Button 
              onClick={() => router.back()} 
              variant="outline"
              className="flex-1"
            >
              Go Back
            </Button>
            <Button 
              onClick={() => router.push('/dashboard')}
              className="flex-1"
            >
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
