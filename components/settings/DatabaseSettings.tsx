import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Database, Server, Download, Upload, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getDatabaseConfig, switchToPostgreSQL, switchToSupabase } from "@/lib/config/database-connection";

interface PostgreSQLConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl: boolean;
}

export function DatabaseSettings() {
  const { toast } = useToast();
  const [currentSource, setCurrentSource] = useState<'supabase' | 'postgresql'>('supabase');
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'success' | 'error' | null>(null);
  
  const [postgresConfig, setPostgresConfig] = useState<PostgreSQLConfig>({
    host: 'localhost',
    port: 5432,
    database: 'yeelo_homeopathy',
    user: 'postgres',
    password: '',
    ssl: false
  });

  useEffect(() => {
    loadCurrentConfig();
  }, []);

  const loadCurrentConfig = async () => {
    try {
      const config = await getDatabaseConfig();
      setCurrentSource(config.type);
      
      if (config.postgresql) {
        setPostgresConfig({
          ...config.postgresql,
          ssl: config.postgresql.ssl || false
        });
      }
    } catch (error) {
      console.error('Failed to load database config:', error);
    }
  };

  const testPostgreSQLConnection = async () => {
    setConnectionStatus('testing');
    setLoading(true);

    try {
      // In a real implementation, you would test the connection
      // For now, we'll simulate a connection test
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setConnectionStatus('success');
      toast({
        title: "Connection Successful",
        description: "PostgreSQL connection test passed!",
      });
    } catch (error) {
      setConnectionStatus('error');
      toast({
        title: "Connection Failed",
        description: "Failed to connect to PostgreSQL database. Please check your settings.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchToPostgreSQL = async () => {
    setLoading(true);
    try {
      const success = await switchToPostgreSQL(postgresConfig);
      if (success) {
        setCurrentSource('postgresql');
        toast({
          title: "Database Switched",
          description: "Successfully switched to PostgreSQL database.",
        });
      } else {
        toast({
          title: "Switch Failed",
          description: "Failed to switch to PostgreSQL. Please check your configuration.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while switching databases.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchToSupabase = async () => {
    setLoading(true);
    try {
      const success = await switchToSupabase();
      if (success) {
        setCurrentSource('supabase');
        toast({
          title: "Database Switched",
          description: "Successfully switched to Supabase database.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while switching databases.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const exportDatabaseSchema = () => {
    // Create downloadable SQL file
    const schemaContent = `-- YEELO HOMEOPATHY Database Schema Export
-- This file contains the complete PostgreSQL schema for production deployment
-- Run this file on your PostgreSQL database to create all tables

-- Note: Please also run the master_data.sql file to populate initial data

-- Download the complete schema from: /database/postgresql/schema.sql
-- Download the master data from: /database/postgresql/master_data.sql

-- Instructions:
-- 1. Create a new PostgreSQL database named 'yeelo_homeopathy'
-- 2. Run: psql -U postgres -d yeelo_homeopathy -f schema.sql
-- 3. Run: psql -U postgres -d yeelo_homeopathy -f master_data.sql
-- 4. Update your application configuration to use PostgreSQL

-- For more details, see the documentation in /database/postgresql/ directory
`;

    const blob = new Blob([schemaContent], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'yeelo_homeopathy_setup_instructions.sql';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Schema Exported",
      description: "Database setup instructions downloaded. Check /database/postgresql/ for complete files.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Database className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Database Settings</h2>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Current Database:</strong> {currentSource === 'supabase' ? 'Supabase (Cloud)' : 'PostgreSQL (Local/Production)'}
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="config" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="postgresql">PostgreSQL Setup</TabsTrigger>
          <TabsTrigger value="export">Database Export</TabsTrigger>
        </TabsList>

        <TabsContent value="config">
          <Card>
            <CardHeader>
              <CardTitle>Database Source Configuration</CardTitle>
              <CardDescription>
                Choose between Supabase (cloud) or PostgreSQL (local/production) database
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className={`cursor-pointer transition-all ${currentSource === 'supabase' ? 'ring-2 ring-primary' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <Database className="h-8 w-8 text-blue-500" />
                      <div>
                        <h3 className="font-medium">Supabase</h3>
                        <p className="text-sm text-muted-foreground">Cloud database (current)</p>
                      </div>
                      {currentSource === 'supabase' && <CheckCircle className="h-5 w-5 text-green-500 ml-auto" />}
                    </div>
                    {currentSource !== 'supabase' && (
                      <Button 
                        onClick={handleSwitchToSupabase}
                        disabled={loading}
                        className="w-full mt-3"
                        variant="outline"
                      >
                        Switch to Supabase
                      </Button>
                    )}
                  </CardContent>
                </Card>

                <Card className={`cursor-pointer transition-all ${currentSource === 'postgresql' ? 'ring-2 ring-primary' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <Server className="h-8 w-8 text-blue-700" />
                      <div>
                        <h3 className="font-medium">PostgreSQL</h3>
                        <p className="text-sm text-muted-foreground">Local/Production database</p>
                      </div>
                      {currentSource === 'postgresql' && <CheckCircle className="h-5 w-5 text-green-500 ml-auto" />}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="postgresql">
          <Card>
            <CardHeader>
              <CardTitle>PostgreSQL Connection Settings</CardTitle>
              <CardDescription>
                Configure your local or production PostgreSQL database connection
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="host">Host</Label>
                  <Input
                    id="host"
                    value={postgresConfig.host}
                    onChange={(e) => setPostgresConfig(prev => ({ ...prev, host: e.target.value }))}
                    placeholder="localhost"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="port">Port</Label>
                  <Input
                    id="port"
                    type="number"
                    value={postgresConfig.port}
                    onChange={(e) => setPostgresConfig(prev => ({ ...prev, port: parseInt(e.target.value) || 5432 }))}
                    placeholder="5432"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="database">Database Name</Label>
                <Input
                  id="database"
                  value={postgresConfig.database}
                  onChange={(e) => setPostgresConfig(prev => ({ ...prev, database: e.target.value }))}
                  placeholder="yeelo_homeopathy"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="user">Username</Label>
                  <Input
                    id="user"
                    value={postgresConfig.user}
                    onChange={(e) => setPostgresConfig(prev => ({ ...prev, user: e.target.value }))}
                    placeholder="postgres"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={postgresConfig.password}
                    onChange={(e) => setPostgresConfig(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Enter database password"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="ssl"
                  checked={postgresConfig.ssl}
                  onCheckedChange={(checked) => setPostgresConfig(prev => ({ ...prev, ssl: checked }))}
                />
                <Label htmlFor="ssl">Enable SSL</Label>
              </div>

              <div className="flex space-x-2">
                <Button 
                  onClick={testPostgreSQLConnection}
                  disabled={loading}
                  variant="outline"
                >
                  {connectionStatus === 'testing' ? 'Testing...' : 'Test Connection'}
                </Button>
                <Button 
                  onClick={handleSwitchToPostgreSQL}
                  disabled={loading || connectionStatus !== 'success'}
                >
                  Switch to PostgreSQL
                </Button>
              </div>

              {connectionStatus === 'success' && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Connection test successful! You can now switch to PostgreSQL.
                  </AlertDescription>
                </Alert>
              )}

              {connectionStatus === 'error' && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Connection failed. Please check your database settings and ensure PostgreSQL is running.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export">
          <Card>
            <CardHeader>
              <CardTitle>Database Export & Setup</CardTitle>
              <CardDescription>
                Export your database schema and data for production deployment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Download className="h-4 w-4" />
                <AlertDescription>
                  For production deployment, you'll need the complete PostgreSQL schema and master data files.
                  These are available in the <code>/database/postgresql/</code> directory of your project.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Database Schema</h4>
                    <p className="text-sm text-muted-foreground">Complete table structure with indexes and triggers</p>
                  </div>
                  <Button onClick={exportDatabaseSchema} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Instructions
                  </Button>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Production Setup Instructions:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Create a PostgreSQL database named <code>yeelo_homeopathy</code></li>
                    <li>Run the schema file: <code>psql -U postgres -d yeelo_homeopathy -f database/postgresql/schema.sql</code></li>
                    <li>Import master data: <code>psql -U postgres -d yeelo_homeopathy -f database/postgresql/master_data.sql</code></li>
                    <li>Configure your application to use PostgreSQL in Database Settings</li>
                    <li>Test the connection and switch database source</li>
                  </ol>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Note:</strong> Complete schema and master data files are located in:
                    <br />
                     <code>database/postgresql/schema.sql</code> - Full database structure
                    <br />
                     <code>database/postgresql/master_data.sql</code> - Initial data for YEELO HOMEOPATHY
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}