"""
PDF Parser Service - P0 Implementation
Extract structured data from vendor invoices
"""

import pdfplumber
import re
from typing import Dict, List, Any
from datetime import datetime
import io

class PDFParserService:
    """Parse PDF invoices and extract structured data"""
    
    def __init__(self):
        self.confidence_threshold = 0.75
    
    async def parse_pdf(self, pdf_content: bytes, trace_id: str) -> Dict[str, Any]:
        """
        Main parsing logic
        P0: Extract text, detect tables, parse invoice data
        """
        result = {
            'invoice_number': None,
            'invoice_date': None,
            'total_amount': 0.0,
            'currency': 'INR',
            'lines': [],
            'confidence_score': 0.0,
            'needs_ocr': False
        }
        
        try:
            with pdfplumber.open(io.BytesIO(pdf_content)) as pdf:
                # Extract text from all pages
                full_text = ""
                for page in pdf.pages:
                    full_text += page.extract_text() or ""
                
                # Check if PDF is scanned (no text)
                if len(full_text.strip()) < 50:
                    result['needs_ocr'] = True
                    return result
                
                # Extract header info
                result['invoice_number'] = self._extract_invoice_number(full_text)
                result['invoice_date'] = self._extract_date(full_text)
                result['total_amount'] = self._extract_total(full_text)
                
                # Extract tables (line items)
                for page in pdf.pages:
                    tables = page.extract_tables()
                    for table in tables:
                        lines = self._parse_table(table)
                        result['lines'].extend(lines)
                
                # Calculate confidence
                result['confidence_score'] = self._calculate_confidence(result)
                
        except Exception as e:
            print(f"PDF parsing error [{trace_id}]: {str(e)}")
            result['needs_ocr'] = True
        
        return result
    
    def _extract_invoice_number(self, text: str) -> str:
        """Extract invoice number from text"""
        patterns = [
            r'Invoice\s*(?:No|Number|#)[:\s]*([A-Z0-9\-/]+)',
            r'Bill\s*(?:No|Number)[:\s]*([A-Z0-9\-/]+)',
            r'INV[:\s]*([A-Z0-9\-/]+)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        
        return None
    
    def _extract_date(self, text: str) -> str:
        """Extract invoice date"""
        patterns = [
            r'Date[:\s]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})',
            r'(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                date_str = match.group(1)
                # Normalize date format
                try:
                    # Try parsing different formats
                    for fmt in ['%d-%m-%Y', '%d/%m/%Y', '%d-%m-%y', '%d/%m/%y']:
                        try:
                            dt = datetime.strptime(date_str, fmt)
                            return dt.strftime('%Y-%m-%d')
                        except:
                            continue
                except:
                    pass
        
        return None
    
    def _extract_total(self, text: str) -> float:
        """Extract total amount"""
        patterns = [
            r'Total[:\s]*₹?\s*([\d,]+\.?\d*)',
            r'Grand\s*Total[:\s]*₹?\s*([\d,]+\.?\d*)',
            r'Amount[:\s]*₹?\s*([\d,]+\.?\d*)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                amount_str = match.group(1).replace(',', '')
                try:
                    return float(amount_str)
                except:
                    pass
        
        return 0.0
    
    def _parse_table(self, table: List[List[str]]) -> List[Dict]:
        """
        Parse table rows into line items
        P0: Detect columns and extract product info
        """
        if not table or len(table) < 2:
            return []
        
        lines = []
        header = table[0]
        
        # Detect column indices
        desc_idx = self._find_column(header, ['description', 'item', 'product', 'particulars'])
        qty_idx = self._find_column(header, ['qty', 'quantity', 'qnty'])
        price_idx = self._find_column(header, ['rate', 'price', 'unit price', 'amount'])
        total_idx = self._find_column(header, ['total', 'amount'])
        
        # Parse data rows
        for row in table[1:]:
            if not row or len(row) < 2:
                continue
            
            # Skip header/footer rows
            if any(h in str(row).lower() for h in ['description', 'total', 'subtotal', 'grand']):
                continue
            
            try:
                line = {
                    'raw_text': ' '.join(str(cell) for cell in row if cell),
                    'description': row[desc_idx] if desc_idx < len(row) else '',
                    'qty': self._parse_number(row[qty_idx]) if qty_idx < len(row) else 0,
                    'unit_price': self._parse_number(row[price_idx]) if price_idx < len(row) else 0,
                    'line_total': self._parse_number(row[total_idx]) if total_idx < len(row) else 0,
                    'tax_rate': 12.0,  # Default GST
                    'batch_no': self._extract_batch(row),
                    'expiry_date': self._extract_expiry(row)
                }
                
                # Calculate tax if not present
                if line['line_total'] > 0 and line['qty'] > 0:
                    line['tax_amount'] = line['line_total'] * (line['tax_rate'] / 100)
                
                if line['description'] and line['qty'] > 0:
                    lines.append(line)
                    
            except Exception as e:
                print(f"Row parsing error: {str(e)}")
                continue
        
        return lines
    
    def _find_column(self, header: List[str], keywords: List[str]) -> int:
        """Find column index by keywords"""
        for idx, cell in enumerate(header):
            if cell and any(kw in str(cell).lower() for kw in keywords):
                return idx
        return 0
    
    def _parse_number(self, value: Any) -> float:
        """Parse number from string"""
        if not value:
            return 0.0
        try:
            return float(str(value).replace(',', '').replace('₹', '').strip())
        except:
            return 0.0
    
    def _extract_batch(self, row: List[str]) -> str:
        """Extract batch number from row"""
        for cell in row:
            if cell and re.search(r'B\d+|BATCH[:\s]*\w+', str(cell), re.IGNORECASE):
                match = re.search(r'(B\d+|\w+-\d+)', str(cell))
                if match:
                    return match.group(1)
        return None
    
    def _extract_expiry(self, row: List[str]) -> str:
        """Extract expiry date from row"""
        for cell in row:
            if cell and re.search(r'exp|expiry', str(cell), re.IGNORECASE):
                match = re.search(r'(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})', str(cell))
                if match:
                    return match.group(1)
        return None
    
    def _calculate_confidence(self, result: Dict) -> float:
        """Calculate parsing confidence score"""
        score = 0.0
        
        # Invoice number found
        if result['invoice_number']:
            score += 0.3
        
        # Date found
        if result['invoice_date']:
            score += 0.2
        
        # Total amount found
        if result['total_amount'] > 0:
            score += 0.2
        
        # Lines extracted
        if result['lines']:
            score += 0.3
        
        return min(score, 1.0)
    
    async def parse_with_ocr(self, ocr_text: str, trace_id: str) -> Dict[str, Any]:
        """Parse OCR text (fallback for scanned PDFs)"""
        result = {
            'invoice_number': self._extract_invoice_number(ocr_text),
            'invoice_date': self._extract_date(ocr_text),
            'total_amount': self._extract_total(ocr_text),
            'currency': 'INR',
            'lines': [],
            'confidence_score': 0.5,  # Lower confidence for OCR
            'needs_ocr': False
        }
        
        # Simple line extraction from OCR text
        lines_text = ocr_text.split('\n')
        for line_text in lines_text:
            if len(line_text) > 20:  # Skip short lines
                # Try to extract qty and price
                qty_match = re.search(r'(\d+)\s*(?:pcs|units|nos)', line_text, re.IGNORECASE)
                price_match = re.search(r'₹?\s*([\d,]+\.?\d*)', line_text)
                
                if qty_match and price_match:
                    result['lines'].append({
                        'raw_text': line_text,
                        'description': line_text[:50],
                        'qty': float(qty_match.group(1)),
                        'unit_price': self._parse_number(price_match.group(1)),
                        'tax_rate': 12.0
                    })
        
        return result
