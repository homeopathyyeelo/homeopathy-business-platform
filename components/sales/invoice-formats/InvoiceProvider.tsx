
import { createContext, useContext, useState } from "react";
import { Invoice } from "@/types";

export type InvoiceFormat = 'a4' | 'thermal' | 'mini' | 'receipt';

interface InvoiceContextType {
  format: InvoiceFormat;
  setFormat: (format: InvoiceFormat) => void;
  printInvoice: (invoice: Invoice) => void;
  downloadInvoice: (invoice: Invoice) => void;
}

const InvoiceContext = createContext<InvoiceContextType | undefined>(undefined);

export const InvoiceProvider = ({ children }: { children: React.ReactNode }) => {
  const [format, setFormat] = useState<InvoiceFormat>('a4');

  const printInvoice = (invoice: Invoice) => {
    // Prepare the appropriate content based on format
    const printContent = getPrintContent(invoice, format);
    
    // Create a printable iframe
    const printFrame = document.createElement('iframe');
    printFrame.style.display = 'none';
    document.body.appendChild(printFrame);
    
    printFrame.contentDocument?.write(printContent);
    printFrame.contentDocument?.close();
    
    // Wait for images to load
    setTimeout(() => {
      printFrame.contentWindow?.print();
      // Remove the frame after printing
      setTimeout(() => {
        document.body.removeChild(printFrame);
      }, 500);
    }, 500);
  };

  const downloadInvoice = (invoice: Invoice) => {
    // In a real app, this would create a PDF with the appropriate format
    console.log(`Downloading invoice ${invoice.invoiceNumber} in ${format} format`);
    
    // Simulated download - in reality, you'd use a PDF library
    const printContent = getPrintContent(invoice, format);
    const blob = new Blob([printContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice-${invoice.invoiceNumber}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getPrintContent = (invoice: Invoice, format: InvoiceFormat): string => {
    // Basic CSS for all formats
    const commonStyles = `
      body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
      .invoice-container { margin: 0 auto; }
      table { width: 100%; border-collapse: collapse; }
      th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
      th { font-weight: bold; }
      .text-right { text-align: right; }
      .company-header { margin-bottom: 20px; }
      .customer-details, .invoice-details { margin-bottom: 20px; }
      .totals { margin-top: 20px; }
    `;
    
    // Format-specific styles
    const formatSpecificStyles = {
      a4: `
        body { font-size: 12px; }
        .invoice-container { width: 210mm; padding: 15mm; }
        @media print {
          @page { size: A4; margin: 15mm; }
        }
      `,
      thermal: `
        body { font-size: 10px; }
        .invoice-container { width: 80mm; padding: 5mm; }
        @media print {
          @page { size: 80mm 297mm; margin: 5mm; }
        }
      `,
      mini: `
        body { font-size: 9px; }
        .invoice-container { width: 58mm; padding: 2mm; }
        @media print {
          @page { size: 58mm 297mm; margin: 2mm; }
        }
        th, td { padding: 4px; }
      `,
      receipt: `
        body { font-size: 10px; }
        .invoice-container { width: 72mm; padding: 3mm; }
        @media print {
          @page { size: 72mm 297mm; margin: 3mm; }
        }
        .simple-layout { border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 5px 0; }
      `
    };
    
    // Combine styles
    const styles = `<style>${commonStyles} ${formatSpecificStyles[format]}</style>`;
    
    // Generate HTML based on format
    let content = '';
    
    // Format-specific HTML structure
    switch (format) {
      case 'a4':
        content = generateA4Format(invoice);
        break;
      case 'thermal':
        content = generateThermalFormat(invoice);
        break;
      case 'mini':
        content = generateMiniFormat(invoice);
        break;
      case 'receipt':
        content = generateReceiptFormat(invoice);
        break;
    }
    
    return `<!DOCTYPE html><html><head>${styles}</head><body>${content}</body></html>`;
  };

  return (
    <InvoiceContext.Provider value={{ format, setFormat, printInvoice, downloadInvoice }}>
      {children}
    </InvoiceContext.Provider>
  );
};

export const useInvoice = () => {
  const context = useContext(InvoiceContext);
  if (!context) {
    throw new Error('useInvoice must be used within an InvoiceProvider');
  }
  return context;
};

// Format generator functions
function generateA4Format(invoice: Invoice): string {
  const customerName = invoice.customer?.name || 'Customer';
  const customerAddress = invoice.customer?.address || '';
  const customerGst = invoice.customer?.gstNumber || '';
  
  return `
    <div class="invoice-container">
      <div class="company-header">
        <h1>Health & Harmony</h1>
        <p>123 Wellness Street, Healing City, HC 12345</p>
        <p>GST: 29AABCU9603R1ZX</p>
      </div>
      
      <div style="display: flex; justify-content: space-between;">
        <div class="customer-details">
          <h3>Bill To:</h3>
          <p><strong>${customerName}</strong></p>
          <p>${customerAddress}</p>
          ${customerGst ? `<p>GST: ${customerGst}</p>` : ''}
        </div>
        
        <div class="invoice-details">
          <h2>TAX INVOICE</h2>
          <p><strong>Invoice #:</strong> ${invoice.invoiceNumber}</p>
          <p><strong>Date:</strong> ${new Date(invoice.date).toLocaleDateString()}</p>
          <p><strong>Payment Status:</strong> ${invoice.paymentStatus}</p>
        </div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Description</th>
            <th>HSN/SAC</th>
            <th>Batch</th>
            <th>Qty</th>
            <th>Rate</th>
            <th>GST %</th>
            <th>GST Amt</th>
            <th class="text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.items.map((item, idx) => `
            <tr>
              <td>${idx + 1}</td>
              <td>${item.product?.name || 'Product'}</td>
              <td>${item.hsnCode || ''}</td>
              <td>${item.batchNumber}</td>
              <td>${item.quantity}</td>
              <td>${item.unitPrice.toFixed(2)}</td>
              <td>${item.gstPercentage}%</td>
              <td>${item.gstAmount.toFixed(2)}</td>
              <td class="text-right">${item.total.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="totals" style="display: flex; justify-content: space-between;">
        <div>
          <p><strong>Payment Method:</strong> ${invoice.paymentMethod?.replace('_', ' ') || 'Cash'}</p>
          <p><strong>Amount in Words:</strong> ${numberToWords(invoice.total)} Only</p>
          
          <div style="margin-top: 50px;">
            <p><strong>Authorized Signatory</strong></p>
          </div>
        </div>
        
        <div style="width: 250px;">
          <table>
            <tr>
              <td>Subtotal:</td>
              <td class="text-right">${invoice.subtotal.toFixed(2)}</td>
            </tr>
            ${invoice.discountAmount ? `
            <tr>
              <td>Discount:</td>
              <td class="text-right">${invoice.discountAmount.toFixed(2)}</td>
            </tr>` : ''}
            <tr>
              <td>GST:</td>
              <td class="text-right">${invoice.gstAmount.toFixed(2)}</td>
            </tr>
            ${invoice.roundOff ? `
            <tr>
              <td>Round Off:</td>
              <td class="text-right">${invoice.roundOff.toFixed(2)}</td>
            </tr>` : ''}
            <tr>
              <td><strong>Total:</strong></td>
              <td class="text-right"><strong>${invoice.total.toFixed(2)}</strong></td>
            </tr>
          </table>
        </div>
      </div>
      
      <div style="margin-top: 30px; font-size: 10px;">
        <p><strong>Terms & Conditions:</strong></p>
        <p>${invoice.termsAndConditions || 'Goods once sold will not be taken back. E&OE'}</p>
        <p>This is a computer generated invoice and does not require a signature.</p>
      </div>
    </div>
  `;
}

function generateThermalFormat(invoice: Invoice): string {
  const customerName = invoice.customer?.name || 'Customer';
  
  return `
    <div class="invoice-container">
      <div style="text-align: center; margin-bottom: 10px;">
        <h2>Health & Harmony</h2>
        <p>123 Wellness Street, Healing City</p>
        <p>GST: 29AABCU9603R1ZX</p>
        <h3>TAX INVOICE</h3>
        <p>Invoice #: ${invoice.invoiceNumber}</p>
        <p>Date: ${new Date(invoice.date).toLocaleDateString()}</p>
        <p>Customer: ${customerName}</p>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            <th>Rate</th>
            <th class="text-right">Amt</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.items.map((item) => `
            <tr>
              <td>${item.product?.name || 'Product'}</td>
              <td>${item.quantity}</td>
              <td>${item.unitPrice.toFixed(2)}</td>
              <td class="text-right">${item.total.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div style="margin-top: 10px; border-top: 1px dashed #000; padding-top: 10px;">
        <table>
          <tr>
            <td>Subtotal:</td>
            <td class="text-right">${invoice.subtotal.toFixed(2)}</td>
          </tr>
          <tr>
            <td>GST:</td>
            <td class="text-right">${invoice.gstAmount.toFixed(2)}</td>
          </tr>
          <tr>
            <td><strong>Total:</strong></td>
            <td class="text-right"><strong>${invoice.total.toFixed(2)}</strong></td>
          </tr>
        </table>
      </div>
      
      <div style="margin-top: 10px; text-align: center; font-size: 9px;">
        <p>Payment: ${invoice.paymentMethod?.replace('_', ' ') || 'Cash'} - ${invoice.paymentStatus}</p>
        <p style="margin-top: 10px;">Thank you for your business!</p>
      </div>
    </div>
  `;
}

function generateMiniFormat(invoice: Invoice): string {
  return `
    <div class="invoice-container">
      <div style="text-align: center; margin-bottom: 5px;">
        <h3>Health & Harmony</h3>
        <p style="font-size: 8px;">123 Wellness Street, HC</p>
        <p style="margin: 3px 0;">#${invoice.invoiceNumber}</p>
        <p style="margin: 3px 0;">${new Date(invoice.date).toLocaleDateString()}</p>
      </div>
      
      <table style="font-size: 8px;">
        <tr>
          <th>Item</th>
          <th>Qty</th>
          <th class="text-right">Amt</th>
        </tr>
        ${invoice.items.map((item) => `
          <tr>
            <td>${item.product?.name || 'Product'}</td>
            <td>${item.quantity}</td>
            <td class="text-right">${item.total.toFixed(2)}</td>
          </tr>
        `).join('')}
      </table>
      
      <div style="margin-top: 5px; border-top: 1px dashed #000; padding-top: 5px; font-size: 8px;">
        <div style="display: flex; justify-content: space-between;">
          <span>Subtotal:</span>
          <span>${invoice.subtotal.toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span>GST:</span>
          <span>${invoice.gstAmount.toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-weight: bold;">
          <span>Total:</span>
          <span>${invoice.total.toFixed(2)}</span>
        </div>
      </div>
      
      <div style="margin-top: 5px; text-align: center; font-size: 7px;">
        <p>Thank You!</p>
      </div>
    </div>
  `;
}

function generateReceiptFormat(invoice: Invoice): string {
  return `
    <div class="invoice-container">
      <div style="text-align: center;">
        <h3>Health & Harmony</h3>
        <p>Receipt #${invoice.invoiceNumber}</p>
        <p>${new Date(invoice.date).toLocaleDateString()}</p>
      </div>
      
      <div class="simple-layout">
        <div style="display: flex; justify-content: space-between;">
          <span>Customer:</span>
          <span>${invoice.customer?.name || 'Customer'}</span>
        </div>
      </div>
      
      <div style="margin: 10px 0;">
        ${invoice.items.map((item) => `
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <div>${item.product?.name || 'Product'} x${item.quantity}</div>
            <div>${item.total.toFixed(2)}</div>
          </div>
        `).join('')}
      </div>
      
      <div class="simple-layout">
        <div style="display: flex; justify-content: space-between; font-weight: bold;">
          <span>Total:</span>
          <span>${invoice.total.toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span>Payment:</span>
          <span>${invoice.paymentMethod?.replace('_', ' ') || 'Cash'}</span>
        </div>
      </div>
      
      <div style="margin-top: 10px; text-align: center; font-size: 9px;">
        <p>Thank you for your purchase!</p>
        <p>Visit us again soon</p>
      </div>
    </div>
  `;
}

// Helper function to convert number to words (simplified)
function numberToWords(num: number): string {
  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  // Simple implementation for numbers < 10,000
  const inr = Math.floor(num);
  const paisa = Math.round((num - inr) * 100);
  
  if (inr === 0) return 'Zero Rupees';
  
  let result = '';
  
  if (inr >= 1000) {
    result += units[Math.floor(inr / 1000)] + ' Thousand ';
    num %= 1000;
  }
  
  if (inr >= 100) {
    result += units[Math.floor(inr / 100)] + ' Hundred ';
    num %= 100;
  }
  
  if (inr > 0) {
    if (result !== '') result += 'and ';
    
    if (inr < 10) result += units[inr];
    else if (inr < 20) result += teens[inr - 10];
    else {
      result += tens[Math.floor(inr / 10)];
      if (inr % 10 > 0) result += '-' + units[inr % 10];
    }
  }
  
  result += ' Rupees';
  
  if (paisa > 0) {
    result += ' and ';
    if (paisa < 10) result += units[paisa] + ' Paisa';
    else if (paisa < 20) result += teens[paisa - 10] + ' Paisa';
    else {
      result += tens[Math.floor(paisa / 10)];
      if (paisa % 10 > 0) result += '-' + units[paisa % 10];
      result += ' Paisa';
    }
  }
  
  return result;
}
