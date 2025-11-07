
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, Trash2, RefreshCw, Upload, Users } from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MarketingContact } from "@/types";
import { authFetch } from '@/lib/api/fetch-utils';

const ContactsList = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const { data: contacts = [], isLoading, refetch } = useQuery({
    queryKey: ['marketing-contacts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketing_contacts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as MarketingContact[];
    }
  });
  
  const deleteContacts = useMutation({
    mutationFn: async (contactIds: string[]) => {
      const { error } = await supabase
        .from('marketing_contacts')
        .delete()
        .in('id', contactIds);
        
      if (error) throw error;
      return contactIds;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-contacts'] });
      toast({
        title: "Contacts deleted",
        description: `${selectedContacts.length} contact(s) have been deleted.`
      });
      setSelectedContacts([]);
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting contacts",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  const filteredContacts = contacts.filter(contact => {
    const searchLower = search.toLowerCase();
    return (
      (contact.first_name && contact.first_name.toLowerCase().includes(searchLower)) ||
      (contact.last_name && contact.last_name.toLowerCase().includes(searchLower)) ||
      (contact.phone_number && contact.phone_number.includes(search)) ||
      (contact.email && contact.email.toLowerCase().includes(searchLower))
    );
  });
  
  const toggleSelectAll = () => {
    if (selectedContacts.length === filteredContacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(filteredContacts.map(contact => contact.id));
    }
  };
  
  const toggleSelectContact = (id: string) => {
    if (selectedContacts.includes(id)) {
      setSelectedContacts(selectedContacts.filter(contactId => contactId !== id));
    } else {
      setSelectedContacts([...selectedContacts, id]);
    }
  };
  
  const handleDeleteConfirm = () => {
    if (selectedContacts.length > 0) {
      deleteContacts.mutate(selectedContacts);
      setIsDeleteDialogOpen(false);
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between flex-col sm:flex-row gap-2">
        <div className="flex grow items-center relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search contacts..." 
            className="pl-8" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Navigate to import contacts page
              window.location.href = "/marketing?tab=import";
            }}
          >
            <Upload className="h-4 w-4 mr-1" />
            Import
          </Button>
          
          <Button
            size="sm"
            onClick={() => {
              // Open new contact form
              toast({
                title: "Coming Soon",
                description: "The add contact form will be implemented soon."
              });
            }}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Contact
          </Button>
        </div>
      </div>
      
      {selectedContacts.length > 0 && (
        <div className="flex items-center justify-between bg-muted/50 p-2 rounded-md">
          <div className="text-sm">
            {selectedContacts.length} contact(s) selected
          </div>
          <Button 
            variant="destructive" 
            size="sm"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete Selected
          </Button>
        </div>
      )}
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : filteredContacts.length > 0 ? (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox 
                    checked={selectedContacts.length === filteredContacts.length && filteredContacts.length > 0} 
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell>
                    <Checkbox 
                      checked={selectedContacts.includes(contact.id)} 
                      onCheckedChange={() => toggleSelectContact(contact.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {contact.first_name} {contact.last_name}
                  </TableCell>
                  <TableCell>{contact.phone_number}</TableCell>
                  <TableCell>{contact.email || '-'}</TableCell>
                  <TableCell>
                    {contact.contact_type || (contact.is_doctor ? 'Doctor' : contact.is_existing_customer ? 'Customer' : 'Contact')}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={contact.is_subscribed ? "outline" : "destructive"}>
                      {contact.is_subscribed ? 'Subscribed' : 'Unsubscribed'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Users className="h-12 w-12 text-muted-foreground opacity-50 mb-2" />
              <h3 className="text-lg font-medium mb-2">No Contacts Found</h3>
              <p className="text-muted-foreground mb-4">
                {search ? 'No contacts match your search criteria.' : 'Import or add contacts to start building your marketing list.'}
              </p>
              <Button
                onClick={() => {
                  window.location.href = "/marketing?tab=import";
                }}
              >
                Import Contacts
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Contacts</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedContacts.length} contact(s)? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContactsList;
