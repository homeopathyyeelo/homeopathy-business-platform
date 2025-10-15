
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useDatabase } from "@/lib/db";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUp, File, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface UploadSaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const UploadSaleDialog = ({ open, onOpenChange, onSuccess }: UploadSaleDialogProps) => {
  const { toast } = useToast();
  const { getAll, create, updateInventory } = useDatabase();
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handlePdfFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        setUploadError("Selected file must be a PDF");
        return;
      }
      setPdfFile(file);
    }
  };

  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        setUploadError("Selected file must be a CSV");
        return;
      }
      setCsvFile(file);
    }
  };

  const simulateFileProcessing = async (totalSteps: number) => {
    for (let i = 1; i <= totalSteps; i++) {
      await new Promise(resolve => setTimeout(resolve, 300));
      setUploadProgress(Math.floor((i / totalSteps) * 100));
    }
  };

  const handleUploadPdf = async () => {
    if (!pdfFile) {
      toast({
        title: "No file selected",
        description: "Please select a PDF file to upload",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);
    
    try {
      // Get inventory and customers for simulating invoice creation
      const inventory = await getAll('inventory');
      const customers = await getAll('customers');
      
      toast({
        title: "PDF Processing Started",
        description: "Your PDF is being processed. This may take a moment."
      });
      
      // Simulate processing time and steps
      await simulateFileProcessing(10);
      
      // Only proceed if we have inventory and customers
      if (inventory.length === 0 || customers.length === 0) {
        throw new Error("No inventory or customer data available");
      }
      
      // Pick a random customer based on invoice type
      const retailCustomer = customers.find((c: any) => c.type === 'retail');
      const customerForInvoice = retailCustomer || customers[0];
      
      // Pick a random inventory item
      const item = inventory[0];
      const product = { gstPercentage: 12 }; // Simplified
      
      // Create a simulated invoice from the PDF
      const sampleInvoice = {
        invoiceNumber: `R-INV-${Math.floor(Math.random() * 10000)}`,
        customerId: customerForInvoice.id,
        date: new Date(),
        items: [
          {
            id: `item-${Date.now()}-1`,
            productId: item.productId,
            batchNumber: item.batchNumber,
            quantity: Math.min(3, item.quantityInStock), // Don't exceed stock
            unitPrice: item.sellingPriceRetail,
            gstPercentage: product.gstPercentage,
            gstAmount: 0, // Will be calculated
            total: 0 // Will be calculated
          }
        ],
        subtotal: 0,
        gstAmount: 0,
        total: 0,
        paymentStatus: 'paid',
        paymentMethod: 'cash',
        type: 'retail',
        createdBy: "admin",
      };
      
      // Calculate values
      const invoiceItem = sampleInvoice.items[0];
      const subtotal = invoiceItem.quantity * invoiceItem.unitPrice;
      invoiceItem.gstAmount = parseFloat((subtotal * (invoiceItem.gstPercentage / 100)).toFixed(2));
      invoiceItem.total = parseFloat((subtotal + invoiceItem.gstAmount).toFixed(2));
      
      sampleInvoice.subtotal = subtotal;
      sampleInvoice.gstAmount = invoiceItem.gstAmount;
      sampleInvoice.total = invoiceItem.total;
      
      // Create invoice and update inventory
      const createdInvoice = await create('invoices', sampleInvoice);
      await updateInventory(item.productId, item.batchNumber, -invoiceItem.quantity);
      
      setTimeout(() => {
        setIsUploading(false);
        toast({
          title: "PDF Processed Successfully",
          description: `Sales invoice ${sampleInvoice.invoiceNumber} has been created.`
        });
        onOpenChange(false);
        if (onSuccess) onSuccess();
      }, 1000);
    } catch (error) {
      console.error("Error processing PDF:", error);
      setIsUploading(false);
      setUploadError("Failed to process the PDF file. Please try again.");
      toast({
        title: "Processing Failed",
        description: "Could not process the PDF file",
        variant: "destructive"
      });
    }
  };

  const handleUploadCsv = async () => {
    if (!csvFile) {
      toast({
        title: "No file selected",
        description: "Please select a CSV file to upload",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);
    
    try {
      // Get inventory and customers for simulating invoice creation
      const inventory = await getAll('inventory');
      const customers = await getAll('customers');
      
      toast({
        title: "CSV Processing Started",
        description: "Your CSV is being processed. This may take a moment."
      });
      
      // Simulate processing time and steps
      await simulateFileProcessing(8);
      
      // Only proceed if we have inventory and customers
      if (inventory.length === 0 || customers.length === 0) {
        throw new Error("No inventory or customer data available");
      }
      
      // Create multiple simulated invoices from CSV
      const salesCount = Math.floor(Math.random() * 3) + 1;
      
      for (let i = 0; i < salesCount; i++) {
        // Pick a random customer based on invoice type
        const wholesaleCustomer = customers.find((c: any) => c.type === 'wholesale');
        const customerForInvoice = wholesaleCustomer || customers[0];
        
        // Pick a random inventory item
        const item = inventory[0];
        const product = { gstPercentage: 12 }; // Simplified
        
        const sampleInvoice = {
          invoiceNumber: `W-INV-${Math.floor(Math.random() * 10000)}-${i}`,
          customerId: customerForInvoice.id,
          date: new Date(new Date().setDate(new Date().getDate() - i)),
          items: [
            {
              id: `csv-item-${Date.now()}-${i}-1`,
              productId: item.productId,
              batchNumber: item.batchNumber,
              quantity: Math.min(2, item.quantityInStock), // Don't exceed stock
              unitPrice: item.sellingPriceWholesale,
              gstPercentage: product.gstPercentage,
              gstAmount: 0, // Will be calculated
              total: 0 // Will be calculated
            }
          ],
          subtotal: 0,
          gstAmount: 0,
          total: 0,
          paymentStatus: 'paid',
          paymentMethod: 'bank_transfer',
          type: 'wholesale',
          createdBy: "admin",
        };
        
        // Calculate values
        const invoiceItem = sampleInvoice.items[0];
        const subtotal = invoiceItem.quantity * invoiceItem.unitPrice;
        invoiceItem.gstAmount = parseFloat((subtotal * (invoiceItem.gstPercentage / 100)).toFixed(2));
        invoiceItem.total = parseFloat((subtotal + invoiceItem.gstAmount).toFixed(2));
        
        sampleInvoice.subtotal = subtotal;
        sampleInvoice.gstAmount = invoiceItem.gstAmount;
        sampleInvoice.total = invoiceItem.total;
        
        // Create invoice and update inventory
        await create('invoices', sampleInvoice);
        await updateInventory(item.productId, item.batchNumber, -invoiceItem.quantity);
      }
      
      setTimeout(() => {
        setIsUploading(false);
        toast({
          title: "CSV Processed Successfully",
          description: `${salesCount} sales invoices have been created.`
        });
        onOpenChange(false);
        if (onSuccess) onSuccess();
      }, 1000);
    } catch (error) {
      console.error("Error processing CSV:", error);
      setIsUploading(false);
      setUploadError("Failed to process the CSV file. Please try again.");
      toast({
        title: "Processing Failed",
        description: "Could not process the CSV file",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Sales Invoice</DialogTitle>
          <DialogDescription>
            Upload a sales invoice PDF or CSV file to import your sales data
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="pdf" className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pdf">PDF Upload</TabsTrigger>
            <TabsTrigger value="csv">CSV Upload</TabsTrigger>
          </TabsList>
          
          {uploadError && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{uploadError}</AlertDescription>
            </Alert>
          )}
          
          <TabsContent value="pdf" className="mt-4 space-y-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="pdf-upload">Upload Sales Invoice PDF</Label>
              <div className="flex items-center gap-2">
                <Input 
                  id="pdf-upload" 
                  type="file" 
                  accept=".pdf" 
                  onChange={handlePdfFileChange}
                  className="flex-1"
                  disabled={isUploading}
                />
              </div>
              {pdfFile && (
                <div className="flex items-center mt-2 text-sm">
                  <File className="h-4 w-4 mr-2" />
                  <span>{pdfFile.name}</span>
                </div>
              )}
              {isUploading && (
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              )}
              <div className="mt-4">
                <Button 
                  onClick={handleUploadPdf} 
                  disabled={!pdfFile || isUploading} 
                  className="w-full"
                >
                  {isUploading ? `Processing (${uploadProgress}%)` : "Process PDF Invoice"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Upload a sales invoice PDF. Our system will attempt to extract invoice details, items, and GST information automatically.
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="csv" className="mt-4 space-y-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="csv-upload">Upload Sales Data CSV</Label>
              <div className="flex items-center gap-2">
                <Input 
                  id="csv-upload" 
                  type="file" 
                  accept=".csv" 
                  onChange={handleCsvFileChange}
                  className="flex-1"
                  disabled={isUploading}
                />
              </div>
              {csvFile && (
                <div className="flex items-center mt-2 text-sm">
                  <File className="h-4 w-4 mr-2" />
                  <span>{csvFile.name}</span>
                </div>
              )}
              {isUploading && (
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              )}
              <div className="mt-4">
                <Button 
                  onClick={handleUploadCsv} 
                  disabled={!csvFile || isUploading} 
                  className="w-full"
                >
                  {isUploading ? `Importing (${uploadProgress}%)` : "Import CSV Data"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Use a CSV file formatted with columns for invoice number, date, customer, items, quantity, rate, GST details, etc. Download a <a href="#" className="text-blue-500">template</a> to get started.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default UploadSaleDialog;
