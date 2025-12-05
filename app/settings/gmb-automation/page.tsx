'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, XCircle, Info } from 'lucide-react';

export default function GMBAutomationSettings() {
    const [credentials, setCredentials] = useState({
        email: '',
        password: '',
    });
    const [loading, setLoading] = useState(false);
    const [testing, setTesting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

    const handleSaveCredentials = async () => {
        if (!credentials.email || !credentials.password) {
            setMessage({ type: 'error', text: 'Please enter both email and password' });
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            const response = await fetch('/api/settings/gmb-automation/credentials', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials),
            });

            const data = await response.json();

            if (data.success) {
                setMessage({ type: 'success', text: 'Credentials saved successfully!' });
                setCredentials({ email: credentials.email, password: '' }); // Clear password
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to save credentials' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to connect to server' });
        } finally {
            setLoading(false);
        }
    };

    const handleTestConnection = async () => {
        if (!credentials.email || !credentials.password) {
            setMessage({ type: 'error', text: 'Please enter credentials first' });
            return;
        }

        setTesting(true);
        setMessage({ type: 'info', text: 'Testing connection... This may take up to 30 seconds.' });

        try {
            const response = await fetch('http://localhost:3001/api/gmb/automate/test-credentials', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: credentials.email,
                    password: credentials.password,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setMessage({ type: 'success', text: 'Connection successful! You can now use GMB automation.' });
            } else {
                setMessage({
                    type: 'error',
                    text: `Connection failed: ${data.error || 'Invalid credentials'}`
                });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Automation service is not running' });
        } finally {
            setTesting(false);
        }
    };

    return (
        <div className="container mx-auto py-8 px-4 max-w-2xl">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">GMB Browser Automation</CardTitle>
                    <CardDescription>
                        Configure your Google My Business credentials to enable automatic posting
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Info Alert */}
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                            Your credentials are encrypted and stored securely. They're only used to automate posting on your behalf.
                            <br />
                            <strong>Note:</strong> If you have 2FA enabled, you may need to use an app-specific password.
                        </AlertDescription>
                    </Alert>

                    {/* Credential Form */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="gmb-email">Google Account Email</Label>
                            <Input
                                id="gmb-email"
                                type="email"
                                placeholder="your-email@gmail.com"
                                value={credentials.email}
                                onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                                disabled={loading || testing}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="gmb-password">Password</Label>
                            <Input
                                id="gmb-password"
                                type="password"
                                placeholder="Your Google password or app-specific password"
                                value={credentials.password}
                                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                                disabled={loading || testing}
                            />
                            <p className="text-sm text-muted-foreground">
                                For 2FA accounts, create an app-specific password in your Google Account settings
                            </p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <Button
                            onClick={handleTestConnection}
                            variant="outline"
                            disabled={loading || testing || !credentials.email || !credentials.password}
                        >
                            {testing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Testing...
                                </>
                            ) : (
                                'Test Connection'
                            )}
                        </Button>

                        <Button
                            onClick={handleSaveCredentials}
                            disabled={loading || testing || !credentials.email || !credentials.password}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save Credentials'
                            )}
                        </Button>
                    </div>

                    {/* Status Message */}
                    {message && (
                        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
                            {message.type === 'success' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                            {message.type === 'error' && <XCircle className="h-4 w-4" />}
                            {message.type === 'info' && <Info className="h-4 w-4" />}
                            <AlertDescription>{message.text}</AlertDescription>
                        </Alert>
                    )}

                    {/* How it Works */}
                    <div className="mt-6 p-4 bg-muted rounded-lg">
                        <h3 className="font-semibold mb-2">How Browser Automation Works</h3>
                        <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
                            <li>You create a post in the GMB interface</li>
                            <li>Our system launches a headless browser</li>
                            <li>Logs into GMB with your credentials</li>
                            <li>Fills in the post content automatically</li>
                            <li>Publishes to your Google Business Profile</li>
                            <li>Updates the status in your database</li>
                        </ol>
                        <p className="text-sm text-muted-foreground mt-2">
                            <strong>Time:</strong> ~60 seconds per post | <strong>Cost:</strong> FREE
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
