import React from 'react';
import { format } from 'date-fns';
import { Invoice, Product } from '@/types';

interface InvoicePrintViewProps {
  createdInvoice: Invoice;
  selectedCustomer: any;
  products: Product[];
  onPrint: () => void;
  onDownload: () => void;
}

const InvoicePrintView = ({ createdInvoice, selectedCustomer, products, onPrint, onDownload }: InvoicePrintViewProps) => {
  const getProductName = (productId: string) => {
    const product = products.find((p: Product) => p.id === productId);
    return product ? product.name : "Unknown Product";
  };

  const getCustomerName = () => {
    if (!selectedCustomer) return "Unknown Customer";
    
    if (selectedCustomer.name) {
      return selectedCustomer.name;
    }
    
    const firstName = selectedCustomer.first_name || "";
    const lastName = selectedCustomer.last_name || "";
    
    return `${firstName} ${lastName}`.trim() || "Unknown Customer";
  };

  return (
    <div className="p-4">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold">Invoice</h2>
        <p>Invoice Number: {createdInvoice.invoiceNumber}</p>
        <p>Date: {format(new Date(createdInvoice.date), 'PPP')}</p>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-semibold">Customer Information</h3>
        <p>Name: {getCustomerName()}</p>
        {selectedCustomer?.phone && <p>Phone: {selectedCustomer.phone}</p>}
        {selectedCustomer?.email && <p>Email: {selectedCustomer.email}</p>}
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-semibold">Items</h3>
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left">Product</th>
              <th className="text-left">Quantity</th>
              <th className="text-left">Unit Price</th>
              <th className="text-left">GST</th>
              <th className="text-left">Total</th>
            </tr>
          </thead>
          <tbody>
            {createdInvoice.items.map((item: any) => (
              <tr key={item.id}>
                <td>{getProductName(item.productId)}</td>
                <td>{item.quantity}</td>
                <td>{item.unitPrice}</td>
                <td>{item.gstAmount}</td>
                <td>{item.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-semibold">Summary</h3>
        <p>Subtotal: {createdInvoice.subtotal}</p>
        <p>Discount: {createdInvoice.discountAmount}</p>
        <p>GST: {createdInvoice.gstAmount}</p>
        <p>Total: {createdInvoice.total}</p>
      </div>

      <div className="flex justify-between">
        <button onClick={onPrint} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Print
        </button>
        <button onClick={onDownload} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
          Download
        </button>
      </div>
    </div>
  );
};

export default InvoicePrintView;
