
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useDatabase } from "@/lib/db-client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface UploadPurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const UploadPurchaseDialog = ({
  open,
  onOpenChange,
  onSuccess
}: UploadPurchaseDialogProps) => {
  const { toast } = useToast();
  const { create } = useDatabase();
  const [file, setFile] = useState<File | null>(null);
  const [fileFormat, setFileFormat] = useState("csv");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate file reading and progress
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        // In a real application, you'd process the file and create purchases
        // For now, we'll just simulate a successful upload
        
        // Simulate processing time with progress updates
        for (let i = 0; i <= 100; i += 10) {
          await new Promise(resolve => setTimeout(resolve, 200));
          setUploadProgress(i);
        }
        
        // Sample purchase creation to simulate successful import
        await create("purchases", {
          purchaseNumber: `IMPORT-${Date.now()}`,
          supplierId: "00000000-0000-0000-0000-000000000000", // Default supplier ID
          purchase_date: new Date().toISOString(),
          subtotal: 1000,
          tax_amount: 180,
          total: 1180,
          status: "draft",
          paymentStatus: "pending",
          notes: `Imported from ${file.name}`,
          created_at: new Date()
        });

        toast({
          title: "Upload Successful",
          description: "Your purchase data has been imported successfully"
        });
        
        onSuccess?.();
        onOpenChange(false);
      } catch (error) {
        toast({
          title: "Upload Failed",
          description: "There was an error processing your file",
          variant: "destructive"
        });
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    };

    reader.readAsText(file);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Purchase Data</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="fileFormat">File Format</Label>
            <Select
              value={fileFormat}
              onValueChange={setFileFormat}
            >
              <SelectTrigger id="fileFormat">
                <SelectValue placeholder="Select Format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="excel">Excel</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="file">Upload File</Label>
            <Input
              id="file"
              type="file"
              accept={fileFormat === "csv" ? ".csv" : fileFormat === "excel" ? ".xlsx,.xls" : ".json"}
              onChange={handleFileChange}
              disabled={isUploading}
            />
            {file && (
              <p className="text-sm text-muted-foreground">
                Selected file: {file.name} ({Math.round(file.size / 1024)} KB)
              </p>
            )}
          </div>
          
          {isUploading && (
            <div className="space-y-2">
              <div className="text-sm">Uploading: {uploadProgress}%</div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary" 
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
          
          <div className="text-xs text-muted-foreground">
            <p>Supported file formats:</p>
            <ul className="list-disc list-inside">
              <li>CSV: comma-separated values file with headers</li>
              <li>Excel: .xlsx or .xls spreadsheet</li>
              <li>JSON: structured purchase data</li>
            </ul>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUploading}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={!file || isUploading}>
            {isUploading ? "Uploading..." : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UploadPurchaseDialog;
