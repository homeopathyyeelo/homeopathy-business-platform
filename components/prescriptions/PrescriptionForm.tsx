
import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { format, addDays } from "date-fns";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  CalendarIcon,
  Trash2,
  PlusCircle,
  Info,
  XCircle
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useDatabase } from "@/lib/db-client";
import { Customer } from "@/types";

const prescriptionSchema = z.object({
  patientId: z.string().min(1, { message: "Patient is required" }),
  doctorName: z.string().min(1, { message: "Doctor name is required" }),
  prescriptionDate: z.date({ required_error: "Prescription date is required" }),
  expiryDate: z.date().optional().nullable(),
  notes: z.string().optional().nullable(),
  isRecurring: z.boolean().default(false),
  refillPeriodDays: z.number().min(1).optional().nullable(),
  medications: z.array(z.object({
    productId: z.string().min(1, { message: "Product is required" }),
    dosage: z.string().min(1, { message: "Dosage is required" }),
    duration: z.string().min(1, { message: "Duration is required" }),
    instructions: z.string().optional().nullable(),
    quantity: z.number().min(1, { message: "Quantity must be at least 1" }),
    refillsAllowed: z.number().min(0),
  })).min(1, { message: "At least one medication is required" }),
  createReminder: z.boolean().default(true),
});

type FormValues = z.infer<typeof prescriptionSchema>;

interface PrescriptionFormProps {
  onSave: () => void;
  prescriptionId?: string;
}

const PrescriptionForm = ({ onSave, prescriptionId }: PrescriptionFormProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const db = useDatabase();
  
  // Fetch patients
  const { data: patients = [], isLoading: isLoadingPatients } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      try {
        return await db.getAll('customers') as Customer[];
      } catch (error) {
        console.error('Error fetching customers:', error);
        return [];
      }
    }
  });
  
  // Fetch products
  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      try {
        return await db.getAll('products');
      } catch (error) {
        console.error('Error fetching products:', error);
        return [];
      }
    }
  });
  
  // Default form values
  const defaultValues: Partial<FormValues> = {
    prescriptionDate: new Date(),
    expiryDate: addDays(new Date(), 180), // 6 months by default
    isRecurring: false,
    refillPeriodDays: 30,
    medications: [
      {
        productId: "",
        dosage: "",
        duration: "",
        instructions: "",
        quantity: 1,
        refillsAllowed: 0
      }
    ],
    createReminder: true
  };
  
  const form = useForm<FormValues>({
    resolver: zodResolver(prescriptionSchema),
    defaultValues
  });
  
  // Use field array for medications
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "medications"
  });
  
  // Watch form values
  const isRecurring = form.watch("isRecurring");
  
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    
    try {
      // Check if selected products actually exist
      const invalidProducts = data.medications.filter(
        med => !products.find(p => p.id === med.productId)
      );
      
      if (invalidProducts.length > 0) {
        toast({
          title: "Invalid products",
          description: "One or more selected products do not exist",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }
      
      // 1. Create the prescription record
      let nextRefillDate = null;
      if (data.isRecurring && data.refillPeriodDays) {
        nextRefillDate = addDays(new Date(), data.refillPeriodDays);
      }
      
      // Format prescription data to match the database schema
      const prescriptionData = {
        patient_id: data.patientId,
        doctor_name: data.doctorName,
        prescription_date: data.prescriptionDate,
        expiry_date: data.expiryDate,
        notes: data.notes || null,
        status: 'active',
        is_recurring: data.isRecurring,
        refill_period_days: data.isRecurring ? data.refillPeriodDays : null,
        next_refill_date: nextRefillDate
      };
      
      // Use the database hook to create the prescription
      const prescription = await db.create('prescriptions', prescriptionData);
      
      if (!prescription) {
        throw new Error("Failed to create prescription");
      }
      
      // 2. Create prescription items
      const prescriptionItems = data.medications.map(med => {
        const product = products.find(p => p.id === med.productId);
        
        return {
          prescription_id: prescription.id,
          product_id: med.productId,
          product_name: product ? product.name : 'Unknown Product',
          dosage: med.dosage,
          duration: med.duration,
          instructions: med.instructions || null,
          quantity: med.quantity,
          refills_allowed: med.refillsAllowed,
          refills_used: 0
        };
      });
      
      // Create all prescription items
      for (const item of prescriptionItems) {
        await db.create('prescription_items', item);
      }
      
      // 3. Create a reminder if requested
      if (data.createReminder && data.isRecurring && nextRefillDate) {
        const reminderDate = addDays(nextRefillDate, -3); // 3 days before refill
        const patient = patients.find(p => p.id === data.patientId);
        const medication = products.find(p => p.id === data.medications[0].productId);
        
        const reminderData = {
          prescription_id: prescription.id,
          patient_id: data.patientId,
          reminder_date: reminderDate,
          reminder_type: 'refill',
          status: 'pending',
          message: `Reminder for ${patient?.firstName || 'patient'}: It's time to refill your prescription for ${medication?.name || 'medication'}.`
        };
        
        await db.create('prescription_reminders', reminderData);
      }
      
      toast({
        title: "Prescription created",
        description: "The prescription has been saved successfully."
      });
      
      onSave();
    } catch (error: any) {
      toast({
        title: "Error saving prescription",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const addMedication = () => {
    append({
      productId: "",
      dosage: "",
      duration: "",
      instructions: "",
      quantity: 1,
      refillsAllowed: 0
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left column */}
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="patientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Patient</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingPatients ? "Loading patients..." : "Select patient"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {patients.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.firstName} {patient.lastName || ''} {patient.phone ? `(${patient.phone})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="doctorName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Doctor Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter doctor name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="prescriptionDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Prescription Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="expiryDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Expiry Date (Optional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter notes about the prescription" 
                      className="resize-none h-20" 
                      {...field}
                      value={field.value || ''} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {/* Right column */}
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="isRecurring"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Recurring Prescription</FormLabel>
                    <FormDescription>
                      Set this prescription to require periodic refills
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            
            {isRecurring && (
              <FormField
                control={form.control}
                name="refillPeriodDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Refill Period (Days)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={1} 
                        {...field} 
                        onChange={event => field.onChange(parseInt(event.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Number of days between refills
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            {isRecurring && (
              <FormField
                control={form.control}
                name="createReminder"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Create Refill Reminder</FormLabel>
                      <FormDescription>
                        Automatically create a reminder for the next refill
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            )}
            
            <div className="mt-6">
              <Label className="text-base">Additional Information</Label>
              <Alert className="mt-2">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Reminders will be sent based on your reminder settings. Make sure the patient's contact information is up to date.
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </div>
        
        {/* Medications section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <Label className="text-base">Medications</Label>
            <Button type="button" variant="outline" size="sm" onClick={addMedication}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Medication
            </Button>
          </div>
          
          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="border rounded-md p-4 relative">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-2 h-8 w-8 p-0"
                  onClick={() => fields.length > 1 && remove(index)}
                  disabled={fields.length <= 1}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name={`medications.${index}.productId`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Medication</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={isLoadingProducts ? "Loading products..." : "Select medication"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {products.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`medications.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={1} 
                              {...field}
                              onChange={event => field.onChange(parseInt(event.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name={`medications.${index}.refillsAllowed`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Refills Allowed</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={0} 
                              {...field}
                              onChange={event => field.onChange(parseInt(event.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 md:col-span-2">
                    <FormField
                      control={form.control}
                      name={`medications.${index}.dosage`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dosage</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 1 tablet twice daily" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name={`medications.${index}.duration`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 7 days, 2 weeks" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name={`medications.${index}.instructions`}
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Instructions (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Take with food" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onSave}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Prescription"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default PrescriptionForm;
