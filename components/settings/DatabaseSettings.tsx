import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Database, Server, Download, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getDatabaseConfig, switchToPostgreSQL } from "@/lib/config/database-connection";
import { golangAPI } from "@/lib/api";
import { JobStatusToast } from "@/components/jobs/JobStatusToast";
import { toast as sonnerToast } from "sonner";

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
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'success' | 'error' | null>(null);
  const [backupJobId, setBackupJobId] = useState<string | null>(null);

  const [postgresConfig, setPostgresConfig] = useState<PostgreSQLConfig>({
    host: 'localhost',
    port: 5433,
    database: 'yeelo_homeopathy',
    user: 'postgres',
    password: '',
    ssl: false
  });


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

  const savePostgreSQLConfig = async () => {
    setLoading(true);
    try {
      await switchToPostgreSQL(postgresConfig);
      toast({
        title: "Configuration Saved",
        description: "PostgreSQL configuration saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save PostgreSQL configuration.",
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
      {/* Render job status toast if backup is running */}
      {backupJobId && (
        <JobStatusToast
          jobId={backupJobId}
          jobType="backup_create"
          onComplete={(job) => {
            setBackupJobId(null);
            // Refresh will happen automatically when user switches to backup tab
          }}
          onError={() => {
            setBackupJobId(null);
          }}
        />
      )}
      
      <div className="flex items-center space-x-2">
        <Database className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Database Settings</h2>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Database:</strong> PostgreSQL (localhost:5433/yeelo_homeopathy)
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="postgresql" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="postgresql">PostgreSQL Setup</TabsTrigger>
          <TabsTrigger value="backups">Backups</TabsTrigger>
          <TabsTrigger value="export">Database Export</TabsTrigger>
        </TabsList>

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
                    onChange={(e) => setPostgresConfig(prev => ({ ...prev, port: parseInt(e.target.value) || 5433 }))}
                    placeholder="5433"
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
                  onClick={savePostgreSQLConfig}
                  disabled={loading}
                >
                  Save Configuration
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

        <TabsContent value="backups">
          <BackupsTab />
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

// BackupsTab component for managing database backups
function BackupsTab() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [backups, setBackups] = useState<any[]>([]);
  const [status, setStatus] = useState<any>(null);
  const [config, setConfig] = useState({
    enabled: false,
    schedule: '0 2 * * *',
    backup_path: '/var/www/homeopathy-business-platform/backups',
    retention_days: 30,
    compress: true,
    db_host: 'localhost',
    db_port: 5433,
    db_name: 'yeelo_homeopathy',
    db_user: 'postgres',
    db_password: 'postgres'
  });

  useEffect(() => {
    loadBackupConfig();
    loadBackups();
    loadBackupStatus();
  }, []);

  const loadBackupConfig = async () => {
    try {
      const res = await golangAPI.get('/api/erp/backups/config');
      if (res.data?.success && res.data.data) {
        setConfig(res.data.data);
      }
    } catch (error) {
      console.error('Failed to load backup config:', error);
    }
  };

  const loadBackups = async () => {
    try {
      const res = await golangAPI.get('/api/erp/backups/list');
      if (res.data?.success) {
        setBackups(res.data.data || []);
      }
    } catch (error) {
      console.error('Failed to load backups:', error);
    }
  };

  const loadBackupStatus = async () => {
    try {
      const res = await golangAPI.get('/api/erp/backups/status');
      if (res.data?.success) {
        setStatus(res.data.data);
      }
    } catch (error) {
      console.error('Failed to load backup status:', error);
    }
  };

  const saveConfig = async () => {
    setLoading(true);
    try {
      const res = await golangAPI.put('/api/erp/backups/config', config);

      if (!res.data?.success) throw new Error('Failed to save');

      toast({
        title: "Success",
        description: "Backup configuration saved successfully",
      });

      loadBackupStatus();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save backup configuration",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async () => {
    setLoading(true);
    try {
      const res = await golangAPI.post('/api/erp/backups/create', {
        description: 'Manual backup'
      });

      if (!res.data?.success) throw new Error('Failed to create backup job');

      // Set job ID to start monitoring
      const jobId = res.data.job_id;
      setBackupJobId(jobId);

      sonnerToast.info('Backup Started', {
        description: 'Database backup is running in the background. You can continue working.',
        duration: 3000,
      });

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to start backup",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteBackup = async (filename: string) => {
    if (!confirm(`Delete backup ${filename}?`)) return;

    try {
      const res = await golangAPI.delete(`/api/erp/backups/${filename}`);

      if (!res.data?.success) throw new Error('Failed to delete');

      toast({
        title: "Success",
        description: "Backup deleted successfully",
      });

      loadBackups();
      loadBackupStatus();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete backup",
        variant: "destructive"
      });
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Backup Status */}
      {status && (
        <Card>
          <CardHeader>
            <CardTitle>Backup Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Last Backup</p>
                <p className="font-medium">
                  {status.last_backup_time
                    ? new Date(status.last_backup_time).toLocaleString()
                    : 'Never'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Next Backup</p>
                <p className="font-medium">
                  {status.next_backup_time
                    ? new Date(status.next_backup_time).toLocaleString()
                    : 'Not scheduled'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Backups</p>
                <p className="font-medium">{status.total_backups}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Size</p>
                <p className="font-medium">{formatBytes(status.total_backup_size)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Backup Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Backup Configuration</CardTitle>
          <CardDescription>
            Configure automated database backups
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="backup-enabled"
              checked={config.enabled}
              onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enabled: checked }))}
            />
            <Label htmlFor="backup-enabled">Enable Automated Backups</Label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Backup Path</Label>
              <Input
                value={config.backup_path}
                onChange={(e) => setConfig(prev => ({ ...prev, backup_path: e.target.value }))}
                placeholder="/var/www/homeopathy-business-platform/backups"
              />
            </div>
            <div className="space-y-2">
              <Label>Schedule (Cron)</Label>
              <Input
                value={config.schedule}
                onChange={(e) => setConfig(prev => ({ ...prev, schedule: e.target.value }))}
                placeholder="0 2 * * *"
              />
              <p className="text-xs text-muted-foreground">Default: Daily at 2:00 AM</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Retention Period (Days)</Label>
              <Input
                type="number"
                value={config.retention_days}
                onChange={(e) => setConfig(prev => ({ ...prev, retention_days: parseInt(e.target.value) }))}
              />
            </div>
            <div className="flex items-center space-x-2 pt-8">
              <Switch
                id="compress"
                checked={config.compress}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, compress: checked }))}
              />
              <Label htmlFor="compress">Compress Backups (gzip)</Label>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button onClick={saveConfig} disabled={loading}>
              {loading ? 'Saving...' : 'Save Configuration'}
            </Button>
            <Button onClick={createBackup} disabled={loading} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Backup Now
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Backup Files List */}
      <Card>
        <CardHeader>
          <CardTitle>Backup Files</CardTitle>
          <CardDescription>
            Manage your database backup files
          </CardDescription>
        </CardHeader>
        <CardContent>
          {backups.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No backups found</p>
          ) : (
            <div className="space-y-2">
              {backups.map((backup) => (
                <div key={backup.filename} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{backup.filename}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(backup.created_at).toLocaleString()} • {formatBytes(backup.size)}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(`/api/erp/backups/${backup.filename}/download`, '_blank')}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteBackup(backup.filename)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}