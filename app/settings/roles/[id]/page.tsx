"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Shield, CheckSquare, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useRole, usePermissions, assignPermissionsToRole, groupPermissionsByModule } from '@/lib/hooks/rbac';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function RolePermissionsPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const roleId = params.id as string;

  const { role, isLoading: roleLoading, mutate: mutateRole } = useRole(roleId);
  const { permissions, isLoading: permissionsLoading } = usePermissions();

  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  // Initialize selected permissions when role data loads
  useEffect(() => {
    if (role?.permissions) {
      setSelectedPermissions(new Set(role.permissions.map(p => p.id)));
    }
  }, [role]);

  const handleTogglePermission = (permissionId: string) => {
    const newSelected = new Set(selectedPermissions);
    if (newSelected.has(permissionId)) {
      newSelected.delete(permissionId);
    } else {
      newSelected.add(permissionId);
    }
    setSelectedPermissions(newSelected);
  };

  const handleToggleModule = (modulePermissions: any[]) => {
    const modulePermissionIds = modulePermissions.map(p => p.id);
    const allSelected = modulePermissionIds.every(id => selectedPermissions.has(id));
    
    const newSelected = new Set(selectedPermissions);
    if (allSelected) {
      // Deselect all
      modulePermissionIds.forEach(id => newSelected.delete(id));
    } else {
      // Select all
      modulePermissionIds.forEach(id => newSelected.add(id));
    }
    setSelectedPermissions(newSelected);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await assignPermissionsToRole(roleId, Array.from(selectedPermissions));
      toast({
        title: 'Success',
        description: 'Permissions updated successfully',
      });
      mutateRole();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update permissions',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (roleLoading || permissionsLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!role) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Role not found</AlertDescription>
      </Alert>
    );
  }

  const groupedPermissions = groupPermissionsByModule(permissions);
  const modules = Object.keys(groupedPermissions).sort();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{role.name}</h1>
                <p className="text-gray-600">Manage role permissions</p>
              </div>
            </div>
          </div>
        </div>
        <Button onClick={handleSave} disabled={isSaving || role.is_system}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {role.is_system && (
        <Alert>
          <AlertDescription>
            This is a system role. Permissions cannot be modified.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Role Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Code</p>
              <code className="text-sm bg-gray-100 px-2 py-1 rounded">{role.code}</code>
            </div>
            <div>
              <p className="text-sm text-gray-500">Level</p>
              <p className="font-semibold">{role.level}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <Badge variant={role.is_active ? 'default' : 'secondary'}>
                {role.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-500">Permissions</p>
              <p className="font-semibold text-lg">
                {selectedPermissions.size} / {permissions.length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Permissions</CardTitle>
            <CardDescription>
              Select the permissions to grant to users with this role
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={modules[0]} className="w-full">
              <TabsList className="w-full justify-start overflow-x-auto">
                {modules.map(module => {
                  const modulePerms = groupedPermissions[module];
                  const selectedCount = modulePerms.filter(p => selectedPermissions.has(p.id)).length;
                  return (
                    <TabsTrigger key={module} value={module} className="relative">
                      {module}
                      {selectedCount > 0 && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {selectedCount}
                        </Badge>
                      )}
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {modules.map(module => {
                const modulePerms = groupedPermissions[module];
                const allSelected = modulePerms.every(p => selectedPermissions.has(p.id));
                const someSelected = modulePerms.some(p => selectedPermissions.has(p.id));

                return (
                  <TabsContent key={module} value={module} className="space-y-4">
                    <div className="flex items-center justify-between py-2 border-b">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={allSelected}
                          onCheckedChange={() => handleToggleModule(modulePerms)}
                          disabled={role.is_system}
                        />
                        <span className="font-semibold">
                          Select All {module} Permissions
                        </span>
                      </div>
                      <Badge variant="outline">
                        {modulePerms.filter(p => selectedPermissions.has(p.id)).length} / {modulePerms.length}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {modulePerms.map(permission => (
                        <div
                          key={permission.id}
                          className={`flex items-start gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors ${
                            selectedPermissions.has(permission.id) ? 'border-primary bg-primary/5' : ''
                          }`}
                        >
                          <Checkbox
                            checked={selectedPermissions.has(permission.id)}
                            onCheckedChange={() => handleTogglePermission(permission.id)}
                            disabled={role.is_system}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{permission.name}</p>
                              <Badge variant="outline" className="text-xs">
                                {permission.action}
                              </Badge>
                            </div>
                            <code className="text-xs text-gray-500">{permission.code}</code>
                            {permission.description && (
                              <p className="text-sm text-gray-600 mt-1">{permission.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                );
              })}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
