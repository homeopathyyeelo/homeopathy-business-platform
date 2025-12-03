
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { golangAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Customer } from "@/types";
import { Prescription } from "@/types/prescription";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MoreVertical,
  Edit,
  Trash2,
  Search,
  FileText,
  Plus,
  RefreshCw,
  Calendar,
  AlertCircle
} from "lucide-react";
import CustomerSelector from "@/components/shared/CustomerSelector";
import { authFetch } from '@/lib/api/fetch-utils';

const PrescriptionsList = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);
  
  // Fetch prescriptions
  const { data: prescriptions = [], isLoading, refetch } = useQuery({
    queryKey: ['prescriptions', selectedCustomerId],
    queryFn: async () => {
      let query = supabase
        .from('prescriptions')
        .select(`
          *,
          patient:patient_id (id, name, phone),
          items:prescription_items (*)
        `)
        .order('created_at', { ascending: false });
      
      if (selectedCustomerId) {
        query = query.eq('patient_id', selectedCustomerId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    }
  });

  const filteredPrescriptions = prescriptions.filter((prescription: any) => {
    const patientName = prescription.patient?.name?.toLowerCase() || '';
    const doctorName = prescription.doctor_name?.toLowerCase() || '';
    const searchLower = searchTerm.toLowerCase();
    
    return patientName.includes(searchLower) || doctorName.includes(searchLower);
  });
  
  // Calculate prescription status
  const getStatus = (prescription: any) => {
    const today = new Date();
    
    if (prescription.status === 'completed') {
      return { label: 'Completed', variant: 'outline', color: 'bg-green-100 text-green-800' };
    }
    
    if (prescription.status === 'expired' || (prescription.expiry_date && new Date(prescription.expiry_date) < today)) {
      return { label: 'Expired', variant: 'outline', color: 'bg-red-100 text-red-800' };
    }
    
    if (prescription.is_recurring && prescription.next_refill_date) {
      const nextRefill = new Date(prescription.next_refill_date);
      const daysDiff = Math.ceil((nextRefill.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff <= 3) {
        return { label: 'Refill Soon', variant: 'outline', color: 'bg-amber-100 text-amber-800' };
      }
    }
    
    return { label: 'Active', variant: 'outline', color: 'bg-blue-100 text-blue-800' };
  };
  
  const handleDeletePrescription = async () => {
    if (!deleteDialog) return;
    
    try {
      // First delete prescription items
      const { error: itemsError } = await supabase
        .from('prescription_items')
        .delete()
        .eq('prescription_id', deleteDialog);
      
      if (itemsError) throw itemsError;
      
      // Then delete reminders
      const { error: remindersError } = await supabase
        .from('prescription_reminders')
        .delete()
        .eq('prescription_id', deleteDialog);
      
      if (remindersError) throw remindersError;
      
      // Finally delete the prescription
      const { error: prescriptionError } = await supabase
        .from('prescriptions')
        .delete()
        .eq('id', deleteDialog);
      
      if (prescriptionError) throw prescriptionError;
      
      toast({
        title: 'Prescription deleted',
        description: 'The prescription has been successfully deleted.'
      });
      
      refetch();
    } catch (error: any) {
      toast({
        title: 'Error deleting prescription',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setDeleteDialog(null);
    }
  };
  
  const createRefillReminder = async (prescription: any) => {
    if (!prescription.patient || !prescription.is_recurring) return;
    
    try {
      const reminderDate = new Date();
      reminderDate.setDate(reminderDate.getDate() + 1); // Set reminder for tomorrow
      
      const { error } = await supabase
        .from('prescription_reminders')
        .insert({
          prescription_id: prescription.id,
          patient_id: prescription.patient.id,
          reminder_date: reminderDate.toISOString(),
          reminder_type: 'refill',
          status: 'pending',
          message: `Reminder: Time to refill your prescription for ${prescription.items[0]?.product_name || 'medication'}.`
        });
      
      if (error) throw error;
      
      toast({
        title: 'Refill reminder created',
        description: 'A refill reminder has been scheduled for this prescription.'
      });
    } catch (error: any) {
      toast({
        title: 'Error creating reminder',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex-1 relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search prescriptions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="w-full sm:w-[250px]">
          <CustomerSelector
            selectedCustomerId={selectedCustomerId}
            onSelect={setSelectedCustomerId}
            placeholder="Filter by patient"
          />
        </div>
      </div>
      
      <div className="rounded-md border">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : filteredPrescriptions.length === 0 ? (
          <div className="text-center py-12">
            <div className="flex justify-center">
              <FileText className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No prescriptions found</h3>
            <p className="text-sm text-muted-foreground mt-2">
              {searchTerm || selectedCustomerId
                ? "Try adjusting your search or filter."
                : "Add your first prescription to get started."}
            </p>
            {(searchTerm || selectedCustomerId) && (
              <div className="mt-4 flex justify-center gap-2">
                {searchTerm && (
                  <Button variant="outline" onClick={() => setSearchTerm("")}>
                    Clear search
                  </Button>
                )}
                {selectedCustomerId && (
                  <Button variant="outline" onClick={() => setSelectedCustomerId("")}>
                    Clear filter
                  </Button>
                )}
              </div>
            )}
            {!searchTerm && !selectedCustomerId && (
              <Button className="mt-4 gap-2" onClick={() => {}}>
                <Plus className="h-4 w-4" />
                Add Prescription
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Medications</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPrescriptions.map((prescription: any) => {
                const status = getStatus(prescription);
                
                return (
                  <TableRow key={prescription.id}>
                    <TableCell>
                      <div className="font-medium">{prescription.patient?.name || "Unknown"}</div>
                      <div className="text-sm text-muted-foreground">
                        {prescription.patient?.phone}
                      </div>
                    </TableCell>
                    <TableCell>{prescription.doctor_name || "Unknown"}</TableCell>
                    <TableCell>
                      <div>{new Date(prescription.prescription_date).toLocaleDateString()}</div>
                      {prescription.expiry_date && (
                        <div className="text-sm text-muted-foreground">
                          Expires: {new Date(prescription.expiry_date).toLocaleDateString()}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {prescription.items?.length ? (
                        <div className="space-y-1">
                          <div>{prescription.items[0]?.product_name}</div>
                          {prescription.items.length > 1 && (
                            <div className="text-sm text-muted-foreground">
                              +{prescription.items.length - 1} more
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No medications</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={status.color}
                      >
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => setShowDetails(prescription.id)}>
                            <FileText className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {}}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => createRefillReminder(prescription)}
                            disabled={!prescription.is_recurring}
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Create Refill Reminder
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive" 
                            onClick={() => setDeleteDialog(prescription.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
      
      {/* Prescription Details Dialog */}
      {showDetails && (
        <Dialog open={!!showDetails} onOpenChange={() => setShowDetails(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Prescription Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {prescriptions.find((p: any) => p.id === showDetails) && (
                <PrescriptionDetails prescription={prescriptions.find((p: any) => p.id === showDetails)} />
              )}
            </div>
            <DialogFooter>
              <Button onClick={() => setShowDetails(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteDialog} onOpenChange={(open) => !open && setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this prescription? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeletePrescription}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Prescription details component
const PrescriptionDetails = ({ prescription }: { prescription: any }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-medium text-muted-foreground">Patient</h4>
          <p className="text-base">{prescription.patient?.name || "Unknown"}</p>
        </div>
        <div>
          <h4 className="text-sm font-medium text-muted-foreground">Doctor</h4>
          <p className="text-base">{prescription.doctor_name || "Unknown"}</p>
        </div>
        <div>
          <h4 className="text-sm font-medium text-muted-foreground">Prescription Date</h4>
          <p className="text-base">{new Date(prescription.prescription_date).toLocaleDateString()}</p>
        </div>
        <div>
          <h4 className="text-sm font-medium text-muted-foreground">Expiry Date</h4>
          <p className="text-base">{prescription.expiry_date ? new Date(prescription.expiry_date).toLocaleDateString() : "Not specified"}</p>
        </div>
      </div>
      
      <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-2">Medications</h4>
        <div className="border rounded-md divide-y">
          {prescription.items && prescription.items.length > 0 ? (
            prescription.items.map((item: any) => (
              <div key={item.id} className="p-3">
                <div className="font-medium">{item.product_name}</div>
                <div className="grid grid-cols-2 gap-2 text-sm mt-1">
                  <div>
                    <span className="text-muted-foreground">Dosage:</span> {item.dosage}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Duration:</span> {item.duration}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Quantity:</span> {item.quantity}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Refills:</span> {item.refills_used}/{item.refills_allowed}
                  </div>
                </div>
                {item.instructions && (
                  <div className="text-sm mt-2">
                    <span className="text-muted-foreground">Instructions:</span> {item.instructions}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              No medications listed
            </div>
          )}
        </div>
      </div>
      
      {prescription.is_recurring && (
        <div className="flex items-center p-3 bg-blue-50 rounded-md border border-blue-100">
          <Calendar className="h-5 w-5 text-blue-500 mr-3" />
          <div>
            <h4 className="font-medium">Recurring Prescription</h4>
            <p className="text-sm text-muted-foreground">
              Refill every {prescription.refill_period_days} days
              {prescription.next_refill_date && (
                <> - Next refill: {new Date(prescription.next_refill_date).toLocaleDateString()}</>
              )}
            </p>
          </div>
        </div>
      )}
      
      {prescription.notes && (
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-1">Notes</h4>
          <p className="text-sm border rounded-md p-2">{prescription.notes}</p>
        </div>
      )}
    </div>
  );
};

export default PrescriptionsList;
