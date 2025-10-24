"""
Parse Invoice API Routes
Get parsed invoice details and status
"""

from fastapi import APIRouter, HTTPException, Path
from typing import Optional
from app.db.repositories import InvoiceRepository

router = APIRouter()

@router.get("/{invoice_id}/parsed")
async def get_parsed_invoice(
    invoice_id: str = Path(..., description="Parsed invoice ID")
):
    """
    Get parsed invoice with all lines and matching status
    
    Returns:
    - Header: vendor, invoice_number, date, total
    - Lines: parsed items with match status
    - Confidence summary
    """
    
    repo = InvoiceRepository()
    
    # Get invoice header
    invoice = await repo.get_invoice_by_id(invoice_id)
    if not invoice:
        raise HTTPException(404, "Invoice not found")
    
    # Get all lines
    lines = await repo.get_invoice_lines(invoice_id)
    
    # Calculate confidence summary
    total_lines = len(lines)
    matched_lines = sum(1 for l in lines if l.get('status') == 'matched')
    needs_review = sum(1 for l in lines if l.get('status') == 'needs_review')
    avg_confidence = sum(l.get('match_confidence', 0) for l in lines) / total_lines if total_lines > 0 else 0
    
    return {
        "success": True,
        "data": {
            "header": {
                "id": invoice['id'],
                "vendor_id": invoice['vendor_id'],
                "shop_id": invoice['shop_id'],
                "invoice_number": invoice.get('invoice_number'),
                "invoice_date": invoice.get('invoice_date'),
                "total_amount": invoice.get('total_amount'),
                "currency": invoice.get('currency', 'INR'),
                "status": invoice['status'],
                "confidence_score": invoice.get('confidence_score'),
                "trace_id": invoice.get('trace_id'),
                "created_at": invoice['created_at']
            },
            "lines": [
                {
                    "line_id": line['id'],
                    "line_number": line['line_number'],
                    "raw_text": line.get('raw_text'),
                    "description": line.get('description'),
                    "qty": line.get('qty'),
                    "unit_price": line.get('unit_price'),
                    "tax_rate": line.get('tax_rate'),
                    "tax_amount": line.get('tax_amount'),
                    "line_total": line.get('line_total'),
                    "batch_no": line.get('batch_no'),
                    "expiry_date": line.get('expiry_date'),
                    "hsn_code": line.get('hsn_code'),
                    "suggested_product_id": line.get('suggested_product_id'),
                    "matched_product_id": line.get('matched_product_id'),
                    "match_type": line.get('match_type'),
                    "match_confidence": line.get('match_confidence'),
                    "status": line.get('status')
                }
                for line in lines
            ],
            "summary": {
                "total_lines": total_lines,
                "matched_lines": matched_lines,
                "needs_review": needs_review,
                "avg_confidence": round(avg_confidence, 2),
                "ready_to_confirm": needs_review == 0 and matched_lines == total_lines
            }
        }
    }


@router.get("/{invoice_id}/status")
async def get_invoice_status(
    invoice_id: str = Path(..., description="Parsed invoice ID")
):
    """
    Get processing status of invoice
    """
    
    repo = InvoiceRepository()
    invoice = await repo.get_invoice_by_id(invoice_id)
    
    if not invoice:
        raise HTTPException(404, "Invoice not found")
    
    return {
        "success": True,
        "data": {
            "invoice_id": invoice_id,
            "status": invoice['status'],
            "confidence_score": invoice.get('confidence_score'),
            "parsed_at": invoice.get('parsed_at'),
            "confirmed_at": invoice.get('confirmed_at')
        }
    }
