import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CheckCircle, Clock, AlertTriangle } from "lucide-react";

interface BatchSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  batches: any[];
  onSelectBatch: (batch: any) => void;
  productName: string;
}

const BatchSelector = ({ 
  isOpen, 
  onClose, 
  batches, 
  onSelectBatch, 
  productName 
}: BatchSelectorProps) => {
  
  const getExpiryStatus = (expiryDate: string | Date) => {
    if (!expiryDate) return 'unknown';
    
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysToExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysToExpiry < 0) return 'expired';
    if (daysToExpiry <= 90) return 'expiring-soon';
    return 'good';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'expiring-soon': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'expired': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'good': return <Badge variant="outline" className="bg-green-50 text-green-700">Good</Badge>;
      case 'expiring-soon': return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Expires Soon</Badge>;
      case 'expired': return <Badge variant="destructive">Expired</Badge>;
      default: return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const sortedBatches = [...batches].sort((a, b) => {
    // Sort by expiry date (earlier first) and then by quantity
    const dateA = new Date(a.expiryDate || '9999-12-31');
    const dateB = new Date(b.expiryDate || '9999-12-31');
    if (dateA.getTime() !== dateB.getTime()) {
      return dateA.getTime() - dateB.getTime();
    }
    return (b.quantityInStock || 0) - (a.quantityInStock || 0);
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Select Batch for {productName}</DialogTitle>
        </DialogHeader>
        
        <div className="max-h-96 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="text-right">Purchase Price</TableHead>
                <TableHead className="text-right">Retail Price</TableHead>
                <TableHead className="text-right">Wholesale Price</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedBatches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    No batches available for this product
                  </TableCell>
                </TableRow>
              ) : (
                sortedBatches.map((batch) => {
                  const expiryStatus = getExpiryStatus(batch.expiryDate);
                  const isOutOfStock = (batch.quantityInStock || 0) <= 0;
                  
                  return (
                    <TableRow 
                      key={batch.id} 
                      className={`${isOutOfStock ? 'opacity-50' : ''} ${expiryStatus === 'expired' ? 'bg-red-50' : ''}`}
                    >
                      <TableCell className="font-medium">
                        {batch.batchNumber || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(expiryStatus)}
                          {batch.expiryDate ? formatDate(batch.expiryDate) : 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(expiryStatus)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`${(batch.quantityInStock || 0) <= 5 ? "text-red-500 font-bold" : ""}`}>
                          {batch.quantityInStock || 0}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(batch.purchasePrice || 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(batch.sellingPriceRetail || 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(batch.sellingPriceWholesale || 0)}
                      </TableCell>
                      <TableCell>
                        {batch.rackLocation || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Button 
                          size="sm" 
                          onClick={() => {
                            onSelectBatch(batch);
                            onClose();
                          }}
                          disabled={isOutOfStock || expiryStatus === 'expired'}
                        >
                          {isOutOfStock ? 'Out of Stock' : 'Select'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BatchSelector;