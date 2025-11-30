'use client';

import React from 'react';
import { format } from 'date-fns';
import { Invoice } from '@/types';

interface A4InvoicePrintProps {
  invoice: any; // Using any to accommodate extended invoice properties
  companyInfo?: {
    name: string;
    address: string;
    phone: string;
    email: string;
    gstin: string;
    drugLicenseNo?: string;
  };
  onClose?: () => void;
}

const A4InvoicePrint: React.FC<A4InvoicePrintProps> = ({ 
  invoice, 
  companyInfo,
  onClose 
}) => {
  const defaultCompanyInfo = {
    name: 'Yeelo Homeopathy',
    address: '123 Wellness Street, Healing City, HC 12345',
    phone: '+91 98765 43210',
    email: 'info@yeelohomeopathy.com',
    gstin: '29AABCU9603R1ZX',
    drugLicenseNo: 'DL/123/2023',
    ...companyInfo
  };

  const handlePrint = () => {
    const printContent = document.getElementById('a4-invoice-content');
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Get the HTML content with styles
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${invoice.invoiceNumber}</title>
          <style>
            @page {
              size: A4;
              margin: 15mm;
            }
            
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              font-size: 12px;
              line-height: 1.4;
              margin: 0;
              padding: 0;
              color: #333;
            }
            
            .invoice-container {
              width: 100%;
              max-width: 210mm;
              margin: 0 auto;
            }
            
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 30px;
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
            }
            
            .company-info h1 {
              font-size: 24px;
              font-weight: bold;
              margin: 0 0 5px 0;
              color: #2563eb;
            }
            
            .company-info p {
              margin: 2px 0;
              font-size: 11px;
            }
            
            .invoice-details {
              text-align: right;
            }
            
            .invoice-details h2 {
              font-size: 20px;
              font-weight: bold;
              margin: 0 0 10px 0;
              color: #333;
            }
            
            .invoice-details p {
              margin: 5px 0;
              font-size: 11px;
            }
            
            .customer-supplier {
              display: flex;
              justify-content: space-between;
              margin-bottom: 25px;
              gap: 20px;
            }
            
            .customer-info, .supplier-info {
              flex: 1;
            }
            
            .customer-info h3, .supplier-info h3 {
              font-size: 14px;
              font-weight: bold;
              margin: 0 0 10px 0;
              color: #333;
            }
            
            .customer-info p, .supplier-info p {
              margin: 5px 0;
              font-size: 11px;
            }
            
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            
            .items-table th {
              background-color: #f8f9fa;
              font-weight: bold;
              text-align: left;
              padding: 8px;
              border: 1px solid #dee2e6;
              font-size: 11px;
            }
            
            .items-table td {
              padding: 8px;
              border: 1px solid #dee2e6;
              font-size: 11px;
            }
            
            .items-table .text-right {
              text-align: right;
            }
            
            .items-table .text-center {
              text-align: center;
            }
            
            .totals-section {
              display: flex;
              justify-content: space-between;
              margin-bottom: 30px;
            }
            
            .payment-info {
              flex: 1;
            }
            
            .totals {
              width: 300px;
            }
            
            .totals table {
              width: 100%;
              border-collapse: collapse;
            }
            
            .totals td {
              padding: 5px;
              font-size: 11px;
            }
            
            .totals .text-right {
              text-align: right;
            }
            
            .totals .total-row td {
              font-weight: bold;
              border-top: 2px solid #333;
              padding-top: 8px;
            }
            
            .terms-section {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #dee2e6;
              font-size: 10px;
              color: #666;
            }
            
            .terms-section h4 {
              font-size: 11px;
              font-weight: bold;
              margin: 0 0 5px 0;
            }
            
            .terms-section p {
              margin: 3px 0;
            }
            
            .signature-section {
              display: flex;
              justify-content: space-between;
              margin-top: 50px;
            }
            
            .signature-box {
              width: 200px;
              text-align: center;
            }
            
            .signature-line {
              border-top: 1px solid #333;
              margin-top: 40px;
              padding-top: 5px;
              font-size: 11px;
            }
            
            .watermark {
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-45deg);
              font-size: 100px;
              color: rgba(0, 0, 0, 0.05);
              font-weight: bold;
              z-index: -1;
            }
            
            @media print {
              .no-print {
                display: none !important;
              }
              
              .watermark {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) rotate(-45deg);
                font-size: 100px;
                color: rgba(0, 0, 0, 0.05);
                font-weight: bold;
                z-index: -1;
              }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load before printing
    setTimeout(() => {
      printWindow.print();
      if (onClose) onClose();
    }, 500);
  };

  const handleDownloadPDF = () => {
    // For PDF download, we would typically use a library like jsPDF or puppeteer
    // For now, we'll trigger the print dialog which can save as PDF
    handlePrint();
  };

  const calculateTotals = () => {
    const subtotal = invoice.items.reduce((sum: number, item: any) => sum + (item.total || 0), 0);
    const discount = invoice.discountAmount || 0;
    const tax = invoice.gstAmount || 0;
    const total = invoice.total || subtotal - discount + tax;
    
    return { subtotal, discount, tax, total };
  };

  const totals = calculateTotals();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        {/* Print Controls */}
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center no-print">
          <h3 className="text-lg font-semibold">Invoice Preview - A4 Format</h3>
          <div className="flex gap-2">
            <button
              onClick={handleDownloadPDF}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download PDF
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>

        {/* A4 Invoice Content */}
        <div id="a4-invoice-content" className="p-6">
          {/* Watermark for paid invoices */}
          {invoice.paymentStatus === 'PAID' && (
            <div className="watermark">PAID</div>
          )}

          <div className="invoice-container">
            {/* Header */}
            <div className="header">
              <div className="company-info">
                <h1>{defaultCompanyInfo.name}</h1>
                <p>{defaultCompanyInfo.address}</p>
                <p>Phone: {defaultCompanyInfo.phone}</p>
                <p>Email: {defaultCompanyInfo.email}</p>
                <p><strong>GSTIN:</strong> {defaultCompanyInfo.gstin}</p>
                {defaultCompanyInfo.drugLicenseNo && (
                  <p><strong>Drug License No:</strong> {defaultCompanyInfo.drugLicenseNo}</p>
                )}
              </div>
              
              <div className="invoice-details">
                <h2>TAX INVOICE</h2>
                <p><strong>Invoice #:</strong> {invoice.invoiceNumber}</p>
                <p><strong>Date:</strong> {new Date(invoice.date).toLocaleDateString()}</p>
                <p><strong>Due Date:</strong> {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'Due on Receipt'}</p>
                <p><strong>Payment Status:</strong> {invoice.paymentStatus}</p>
                <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${
                    invoice.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' :
                    invoice.paymentStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {invoice.paymentStatus}
                  </span>
              </div>
            </div>

            {/* Customer & Supplier Info */}
            <div className="customer-supplier">
              <div className="customer-info">
                <h3>Bill To:</h3>
                <p><strong>{invoice.customer?.name || 'Customer'}</strong></p>
                {invoice.customer?.address && <p>{invoice.customer.address}</p>}
                {invoice.customer?.phone && <p>Phone: {invoice.customer.phone}</p>}
                {invoice.customer?.email && <p>Email: {invoice.customer.email}</p>}
                {invoice.customer?.gstNumber && <p>GSTIN: {invoice.customer.gstNumber}</p>}
                {(invoice.customer as any)?.drugLicenseNo && <p>Drug License: {(invoice.customer as any).drugLicenseNo}</p>}
              </div>
              
              <div className="supplier-info">
                <h3>Supply Details:</h3>
                <p><strong>Place of Supply:</strong> {(invoice as any).placeOfSupply || 'Karnataka'}</p>
                <p><strong>State Code:</strong> 29</p>
                <p><strong>Payment Method:</strong> {invoice.paymentMethod?.replace('_', ' ') || 'Cash'}</p>
                {(invoice as any).salesExecutive && <p><strong>Sales Executive:</strong> {(invoice as any).salesExecutive}</p>}
              </div>
            </div>

            {/* Items Table */}
            <table className="items-table">
              <thead>
                <tr>
                  <th className="text-center" style={{width: '40px'}}>S.No</th>
                  <th>Description of Goods</th>
                  <th className="text-center" style={{width: '80px'}}>HSN/SAC</th>
                  <th className="text-center" style={{width: '60px'}}>Batch</th>
                  <th className="text-center" style={{width: '40px'}}>Qty</th>
                  <th className="text-center" style={{width: '60px'}}>Rate</th>
                  <th className="text-center" style={{width: '50px'}}>GST %</th>
                  <th className="text-right" style={{width: '70px'}}>GST Amt</th>
                  <th className="text-right" style={{width: '80px'}}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item: any, index: number) => (
                  <tr key={item.id || index}>
                    <td className="text-center">{index + 1}</td>
                    <td>
                      <div>{item.product?.name || 'Product'}</div>
                      {item.product?.potency && <div className="text-xs text-gray-600">Potency: {item.product.potency}</div>}
                      {item.product?.manufacturer && <div className="text-xs text-gray-600">Mfg: {item.product.manufacturer}</div>}
                    </td>
                    <td className="text-center">{item.hsnCode || '3004'}</td>
                    <td className="text-center">{item.batchNumber || '-'}</td>
                    <td className="text-center">{item.quantity}</td>
                    <td className="text-right">₹{item.unitPrice?.toFixed(2) || '0.00'}</td>
                    <td className="text-center">{item.gstPercentage || 5}%</td>
                    <td className="text-right">₹{item.gstAmount?.toFixed(2) || '0.00'}</td>
                    <td className="text-right">₹{item.total?.toFixed(2) || '0.00'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals Section */}
            <div className="totals-section">
              <div className="payment-info">
                <h4 style={{fontWeight: 'bold', marginBottom: '10px'}}>Payment Information</h4>
                <p><strong>Payment Method:</strong> {invoice.paymentMethod?.replace('_', ' ') || 'Cash'}</p>
                <p><strong>Amount in Words:</strong> {numberToWords(totals.total)} Only</p>
                
                {invoice.notes && (
                  <div style={{marginTop: '15px'}}>
                    <h4 style={{fontWeight: 'bold', marginBottom: '5px'}}>Notes:</h4>
                    <p>{invoice.notes}</p>
                  </div>
                )}
              </div>
              
              <div className="totals">
                <table>
                  <tbody>
                    <tr>
                      <td>Subtotal:</td>
                      <td className="text-right">₹{totals.subtotal.toFixed(2)}</td>
                    </tr>
                    {totals.discount > 0 && (
                      <tr>
                        <td>Discount:</td>
                        <td className="text-right">-₹{totals.discount.toFixed(2)}</td>
                      </tr>
                    )}
                    <tr>
                      <td>GST:</td>
                      <td className="text-right">₹{totals.tax.toFixed(2)}</td>
                    </tr>
                    {invoice.roundOff && (
                      <tr>
                        <td>Round Off:</td>
                        <td className="text-right">₹{invoice.roundOff.toFixed(2)}</td>
                      </tr>
                    )}
                    <tr className="total-row">
                      <td><strong>Total:</strong></td>
                      <td className="text-right"><strong>₹{totals.total.toFixed(2)}</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Terms & Conditions */}
            <div className="terms-section">
              <h4>Terms & Conditions:</h4>
              <p>1. Goods once sold will not be taken back or exchanged.</p>
              <p>2. Payment is due within 30 days from the date of invoice.</p>
              <p>3. Interest @ 18% per annum will be charged on overdue payments.</p>
              <p>4. Subject to {(invoice as any).placeOfSupply || 'Karnataka'} jurisdiction.</p>
              <p>5. E&OE - Errors and Omissions Excepted.</p>
              <p style={{marginTop: '10px', fontStyle: 'italic'}}>
                This is a computer generated invoice and does not require a signature.
              </p>
            </div>

            {/* Signature Section */}
            <div className="signature-section">
              <div className="signature-box">
                <div className="signature-line">
                  Customer Signature
                </div>
              </div>
              
              <div className="signature-box">
                <div className="signature-line">
                  Authorized Signatory
                </div>
                <p style={{fontSize: '10px', marginTop: '5px'}}>For {defaultCompanyInfo.name}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to convert number to words
function numberToWords(num: number): string {
  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  const inr = Math.floor(num);
  const paisa = Math.round((num - inr) * 100);
  
  if (inr === 0) return 'Zero Rupees';
  
  let result = '';
  
  if (inr >= 100000) {
    result += units[Math.floor(inr / 100000)] + ' Lakh ';
    num %= 100000;
  }
  
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

export default A4InvoicePrint;
