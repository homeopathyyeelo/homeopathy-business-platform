
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format, isToday, isTomorrow, isYesterday } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bell,
  Check,
  Phone,
  Send,
  MoreVertical,
  Calendar,
  Mail,
  Loader2
} from "lucide-react";
import CustomerSelector from "@/components/shared/CustomerSelector";

const RefillReminders = () => {
  const { toast } = useToast();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [sending, setSending] = useState<string | null>(null);
  
  // Fetch reminders
  const { data: reminders = [], isLoading, refetch } = useQuery({
    queryKey: ['prescription-reminders', selectedCustomerId],
    queryFn: async () => {
      let query = supabase
        .from('prescription_reminders')
        .select(`
          *,
          patient:patient_id (id, name, phone, email),
          prescription:prescription_id (id, prescription_date, doctor_name)
        `)
        .order('reminder_date', { ascending: true });
      
      if (selectedCustomerId) {
        query = query.eq('patient_id', selectedCustomerId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    }
  });
  
  // Format date in a human-readable way
  const formatReminderDate = (dateString: string) => {
    const date = new Date(dateString);
    
    if (isToday(date)) {
      return 'Today';
    } else if (isTomorrow(date)) {
      return 'Tomorrow';
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'MMM d, yyyy');
    }
  };
  
  const handleSendReminder = async (reminder: any, channel: 'whatsapp' | 'sms' | 'email') => {
    if (!reminder.patient || sending) return;
    
    setSending(reminder.id);
    
    try {
      // In a real implementation, we would call an API to send the reminder
      // For this demo, we'll simulate sending and update the status
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const { error } = await supabase
        .from('prescription_reminders')
        .update({
          status: 'sent',
          sent_via: channel,
          sent_at: new Date().toISOString()
        })
        .eq('id', reminder.id);
      
      if (error) throw error;
      
      toast({
        title: 'Reminder sent',
        description: `Reminder has been sent to ${reminder.patient.name} via ${channel}.`
      });
      
      refetch();
    } catch (error: any) {
      toast({
        title: 'Error sending reminder',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setSending(null);
    }
  };
  
  const handleMarkAsComplete = async (reminderId: string) => {
    try {
      const { error } = await supabase
        .from('prescription_reminders')
        .update({
          status: 'completed'
        })
        .eq('id', reminderId);
      
      if (error) throw error;
      
      toast({
        title: 'Reminder completed',
        description: 'The reminder has been marked as completed.'
      });
      
      refetch();
    } catch (error: any) {
      toast({
        title: 'Error updating reminder',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="w-full sm:w-[250px]">
          <CustomerSelector
            selectedCustomerId={selectedCustomerId}
            onSelect={setSelectedCustomerId}
            placeholder="Filter by patient"
          />
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
            Pending: {reminders.filter(r => r.status === 'pending').length}
          </Badge>
          <Badge variant="outline" className="bg-green-100 text-green-800">
            Sent: {reminders.filter(r => r.status === 'sent').length}
          </Badge>
          <Badge variant="outline" className="bg-blue-100 text-blue-800">
            Completed: {reminders.filter(r => r.status === 'completed').length}
          </Badge>
        </div>
      </div>
      
      <div className="rounded-md border">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : reminders.length === 0 ? (
          <div className="text-center py-12">
            <div className="flex justify-center">
              <Bell className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No reminders found</h3>
            <p className="text-sm text-muted-foreground mt-2">
              {selectedCustomerId
                ? "Try selecting a different patient."
                : "Set up reminders for prescription refills to get started."}
            </p>
            {selectedCustomerId && (
              <Button 
                variant="outline" 
                className="mt-4" 
                onClick={() => setSelectedCustomerId("")}
              >
                Clear filter
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Reminder Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reminders.map((reminder: any) => (
                <TableRow key={reminder.id}>
                  <TableCell>
                    <div className="font-medium">{reminder.patient?.name || "Unknown"}</div>
                    <div className="text-sm text-muted-foreground">
                      {reminder.prescription?.doctor_name && (
                        <>Dr. {reminder.prescription.doctor_name}</>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{formatReminderDate(reminder.reminder_date)}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(reminder.reminder_date), 'h:mm a')}
                    </div>
                  </TableCell>
                  <TableCell>
                    {reminder.reminder_type === 'refill' && (
                      <Badge variant="outline" className="bg-blue-100 text-blue-800">Refill</Badge>
                    )}
                    {reminder.reminder_type === 'expiry' && (
                      <Badge variant="outline" className="bg-amber-100 text-amber-800">Expiry</Badge>
                    )}
                    {reminder.reminder_type === 'followup' && (
                      <Badge variant="outline" className="bg-purple-100 text-purple-800">Follow-up</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {reminder.status === 'pending' && (
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pending</Badge>
                    )}
                    {reminder.status === 'sent' && (
                      <Badge variant="outline" className="bg-green-100 text-green-800">
                        Sent via {reminder.sent_via}
                      </Badge>
                    )}
                    {reminder.status === 'completed' && (
                      <Badge variant="outline" className="bg-blue-100 text-blue-800">Completed</Badge>
                    )}
                    {reminder.status === 'cancelled' && (
                      <Badge variant="outline">Cancelled</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {reminder.patient?.phone && (
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3" /> 
                          {reminder.patient.phone}
                        </div>
                      )}
                      {reminder.patient?.email && (
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3" /> 
                          {reminder.patient.email}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {reminder.status === 'pending' && (
                        <>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 w-8 p-0"
                                disabled={sending === reminder.id}
                              >
                                {sending === reminder.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Send className="h-4 w-4" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleSendReminder(reminder, 'whatsapp')}>
                                Send via WhatsApp
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleSendReminder(reminder, 'sms')}>
                                Send via SMS
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleSendReminder(reminder, 'email')}>
                                Send via Email
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => handleMarkAsComplete(reminder.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      
                      {(reminder.status === 'sent' || reminder.status === 'completed') && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default RefillReminders;
