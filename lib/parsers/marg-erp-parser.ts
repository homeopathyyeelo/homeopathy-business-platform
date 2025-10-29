/**
 * Marg ERP CSV Parser
 * Parses the complex Marg ERP format into structured data
 */

interface MargHeader {
  invoiceNumber: string;
  invoiceDate: string | null;
  supplierName: string;
  supplierGSTIN: string;
  totalAmount: number;
}

interface MargItem {
  brand: string;
  productCode: string;
  productName: string;
  size: string;
  batchNumber: string;
  quantity: number;
  mrp: number;
  unitPrice: number; // computed pre-tax unit cost
  grossAmount: number; // qty * rate (before discounts)
  discountPercent: number; // primary discount
  splPercent: number; // special discount
  gstPercent: number; // GST rate
  netAmount: number; // net including tax (as provided)
  taxAmount: number; // tax amount
  hsnCode: string;
  expiryDate?: string | null;
}

interface MargInvoice {
  header: MargHeader;
  items: MargItem[];
}

/**
 * Parse Marg ERP CSV format
 * Format: H,... (header) followed by T,... (transaction lines)
 */
export function parseMargERPCSV(content: string): MargInvoice[] {
  const lines = content.split('\n').filter(line => line.trim());
  const invoices: MargInvoice[] = [];
  
  let currentHeader: MargHeader | null = null;
  let currentItems: MargItem[] = [];

  for (const line of lines) {
    const fields = line.split(',');
    const recordType = fields[0];

    if (recordType === 'H') {
      // Save previous invoice if exists
      if (currentHeader && currentItems.length > 0) {
        invoices.push({
          header: currentHeader,
          items: currentItems,
        });
      }

      // Parse header
      // H,1,GC10943,08102025,...,YEELO HOMOEOPATHY GURGAON,8527672265,06BUAPG3815Q1ZH,...
      currentHeader = {
        invoiceNumber: fields[2] || '',
        invoiceDate: parseDate(fields[3] || ''),
        supplierName: fields[30] || '',
        supplierGSTIN: fields[32] || '',
        totalAmount: 0, // Will calculate from items
      };
      currentItems = [];
    } else if (recordType === 'T' && currentHeader) {
      // Parse transaction line
      // T,OIF,SBL (DILUTION),0001973,,SBL DILUTION 200,30ML,,N5,00000000,,,5,0,130,,130,,0,,71,0,64,6065.37,4.76,3164.63,...
      const qty = parseFloat(fields[20] || '0'); // 71
      const gstPercent = parseFloat(fields[12] || '0'); // 5 (GST%)
      const mrp = parseFloat(fields[14] || '0') || parseFloat(fields[16] || '0'); // 130 (Rate)
      const discPercent = parseFloat(fields[22] || '0'); // 64 (Disc%)
      const grossAmount = parseFloat(fields[23] || '0'); // 6065.37 (Gross)
      const splPercent = parseFloat(fields[24] || '0'); // 4.76 (Spl%)
      const netAmount = parseFloat(fields[25] || '0'); // 3164.63 (Net incl GST)
      const taxAmount = parseFloat(fields[26] || '0'); // 158.23

      // Derive pre-tax total and unit price used by our importer
      const preTaxTotal = isFinite(netAmount - taxAmount) ? (netAmount - taxAmount) : 0;
      const unitPrice = qty > 0 ? preTaxTotal / qty : 0;

      const item: MargItem = {
        brand: fields[2] || '',
        productCode: fields[3] || '',
        productName: fields[5] || '',
        size: fields[6] || '',
        batchNumber: fields[8] || '',
        quantity: qty,
        mrp: mrp,
        unitPrice: unitPrice,
        grossAmount: grossAmount,
        discountPercent: discPercent,
        splPercent: splPercent,
        gstPercent: gstPercent,
        netAmount: netAmount,
        taxAmount: taxAmount,
        hsnCode: fields[39] || '',
        expiryDate: parseDate(fields[9] || ''),
      };

      currentItems.push(item);
    } else if (recordType === 'F' && currentHeader) {
      // Footer row - contains totals
      // F,46271,51477.28,0,0,0,0,,0,2203.37,
      const totalAmount = parseFloat(fields[2] || '0');
      currentHeader.totalAmount = totalAmount;
    }
  }

  // Save last invoice
  if (currentHeader && currentItems.length > 0) {
    invoices.push({
      header: currentHeader,
      items: currentItems,
    });
  }

  return invoices;
}

/**
 * Parse date from Marg ERP format (DDMMYYYY or 00000000 for none)
 * Returns null for invalid/empty dates instead of empty string
 */
function parseDate(dateStr: string): string | null {
  if (!dateStr || dateStr === '00000000' || dateStr.length !== 8) {
    return null;
  }

  try {
    const day = dateStr.substring(0, 2);
    const month = dateStr.substring(2, 4);
    const year = dateStr.substring(4, 8);
    
    // Validate date parts
    if (day === '00' || month === '00' || year === '0000') {
      return null;
    }
    
    return `${year}-${month}-${day}`; // YYYY-MM-DD format
  } catch {
    return null;
  }
}

/**
 * Convert Marg invoice to our standard format
 */
export function convertMargToStandard(margInvoices: MargInvoice[]) {
  return margInvoices.map(invoice => ({
    invoiceNumber: invoice.header.invoiceNumber,
    invoiceDate: invoice.header.invoiceDate,
    supplierName: invoice.header.supplierName,
    supplierGSTIN: invoice.header.supplierGSTIN,
    totalAmount: invoice.header.totalAmount,
    items: invoice.items.map(item => ({
      'Invoice Number': invoice.header.invoiceNumber,
      'Invoice Date': invoice.header.invoiceDate || '', // Convert null to empty string for compatibility
      'Supplier Name': invoice.header.supplierName,
      'Supplier GSTIN': invoice.header.supplierGSTIN,
      'Product Code': item.productCode,
      'Product Name': item.productName,
      'Brand': item.brand.replace(/[()]/g, '').trim(), // Remove parentheses
      'Potency': extractPotency(item.productName),
      'Size': item.size,
      'Form': extractForm(item.brand),
      'HSN Code': item.hsnCode,
      'Batch Number': item.batchNumber,
      'Expiry Date': item.expiryDate || '',
      'Quantity': item.quantity.toString(),
      // Use computed pre-tax unit cost to align with importer
      'Unit Price': item.unitPrice.toFixed(2),
      'MRP': item.mrp.toFixed(2),
      // Combine Disc% + Spl% (and potential SPL2 if present in future)
      'Discount %': (item.discountPercent + item.splPercent).toFixed(2),
      // Set GST as Tax % for importer to recompute tax correctly
      'Tax %': item.gstPercent.toFixed(2),
      // Use pre-tax total so importer adds tax to reach Net
      'Total Amount': (item.unitPrice * item.quantity).toFixed(2),
    })),
  }));
}

/**
 * Extract potency from product name
 * e.g., "SBL DILUTION 200" -> "200"
 */
function extractPotency(productName: string): string {
  const potencyMatch = productName.match(/\b(\d+|[QXCMcm]+)\b/);
  return potencyMatch ? potencyMatch[1] : '';
}

/**
 * Extract form from brand field
 * e.g., "SBL (DILUTION)" -> "DILUTION"
 */
function extractForm(brand: string): string {
  const formMatch = brand.match(/\(([^)]+)\)/);
  return formMatch ? formMatch[1] : '';
}

/**
 * Detect if CSV is Marg ERP format
 */
export function isMargERPFormat(content: string): boolean {
  const firstLine = content.split('\n')[0];
  return firstLine.startsWith('H,') && firstLine.includes('<MARGERP FORMAT>');
}
