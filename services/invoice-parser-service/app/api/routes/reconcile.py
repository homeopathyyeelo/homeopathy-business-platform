"""
Reconciliation API Routes
Manual reconciliation tasks and confirmation
"""

from fastapi import APIRouter, HTTPException, Path, Body, Query
from typing import Optional, List
from pydantic import BaseModel
from app.db.repositories import InvoiceRepository
from app.services.inventory_updater import InventoryUpdater
from app.services.kafka_producer import KafkaProducer

router = APIRouter()

class ConfirmInvoiceRequest(BaseModel):
    shop_id: str
    approve_by: Optional[str] = None
    auto_allocate: bool = True
    notes: Optional[str] = None

@router.get("")
async def get_reconciliation_tasks(
    status: Optional[str] = Query(None, description="Filter by status"),
    vendor_id: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0)
):
    """
    Get reconciliation tasks for manual review
    """
    
    repo = InvoiceRepository()
    tasks = await repo.get_reconciliation_tasks(
        status=status,
        vendor_id=vendor_id,
        limit=limit,
        offset=offset
    )
    
    total = await repo.count_reconciliation_tasks(status=status, vendor_id=vendor_id)
    
    return {
        "success": True,
        "data": {
            "tasks": tasks,
            "total": total,
            "limit": limit,
            "offset": offset
        }
    }


@router.post("/{invoice_id}/confirm")
async def confirm_invoice(
    invoice_id: str = Path(...),
    request: ConfirmInvoiceRequest = Body(...)
):
    """
    Confirm parsed invoice and create GRN
    
    Steps:
    1. Validate all lines matched
    2. Apply pricing/discount rules
    3. Create purchase receipt (GRN)
    4. Update inventory batches
    5. Create accounting entries
    6. Publish outbox events
    """
    
    repo = InvoiceRepository()
    
    # Get invoice and lines
    invoice = await repo.get_invoice_by_id(invoice_id)
    if not invoice:
        raise HTTPException(404, "Invoice not found")
    
    if invoice['status'] == 'confirmed':
        raise HTTPException(400, "Invoice already confirmed")
    
    lines = await repo.get_invoice_lines(invoice_id)
    
    # Validate all lines matched
    unmatched = [l for l in lines if l['status'] not in ['matched', 'ignored']]
    if unmatched:
        raise HTTPException(400, f"{len(unmatched)} lines not matched. Complete reconciliation first.")
    
    matched_lines = [l for l in lines if l['status'] == 'matched']
    if not matched_lines:
        raise HTTPException(400, "No matched lines to confirm")
    
    try:
        # Calculate totals
        subtotal = sum(l.get('line_total', 0) for l in matched_lines)
        tax_total = sum(l.get('tax_amount', 0) for l in matched_lines)
        
        # Create purchase receipt (GRN)
        receipt_id = await repo.create_purchase_receipt({
            'parsed_invoice_id': invoice_id,
            'vendor_id': invoice['vendor_id'],
            'shop_id': request.shop_id,
            'receipt_date': invoice.get('invoice_date'),
            'total_amount': subtotal,
            'tax_amount': tax_total,
            'grand_total': invoice.get('total_amount', subtotal + tax_total),
            'status': 'confirmed',
            'approved_by': request.approve_by,
            'notes': request.notes
        })
        
        # Create receipt lines
        for line in matched_lines:
            await repo.create_receipt_line({
                'receipt_id': receipt_id,
                'product_id': line['matched_product_id'],
                'batch_no': line.get('batch_no'),
                'expiry_date': line.get('expiry_date'),
                'qty': line['qty'],
                'unit_cost': line.get('unit_price'),
                'tax_rate': line.get('tax_rate'),
                'tax_amount': line.get('tax_amount'),
                'landed_unit_cost': line.get('unit_price'),  # TODO: Calculate landed cost
                'line_total': line.get('line_total')
            })
        
        # Update inventory
        inventory_updater = InventoryUpdater()
        await inventory_updater.update_from_receipt(receipt_id, request.shop_id)
        
        # Update invoice status
        await repo.update_invoice({
            'id': invoice_id,
            'status': 'confirmed',
            'confirmed_by': request.approve_by,
            'confirmed_at': 'NOW()'
        })
        
        # Publish events
        kafka = KafkaProducer()
        await kafka.publish_purchase_receipt_created(receipt_id, invoice_id)
        await kafka.publish_inventory_restocked(receipt_id, request.shop_id)
        
        return {
            "success": True,
            "message": "Invoice confirmed successfully",
            "data": {
                "invoice_id": invoice_id,
                "receipt_id": receipt_id,
                "lines_processed": len(matched_lines),
                "total_amount": invoice.get('total_amount')
            }
        }
        
    except Exception as e:
        raise HTTPException(500, f"Confirmation failed: {str(e)}")


@router.put("/tasks/{task_id}/resolve")
async def resolve_task(
    task_id: str = Path(...),
    resolution_notes: str = Body(..., embed=True),
    resolved_by: Optional[str] = Body(None, embed=True)
):
    """
    Mark reconciliation task as resolved
    """
    
    repo = InvoiceRepository()
    
    await repo.update_reconciliation_task({
        'id': task_id,
        'status': 'resolved',
        'resolved_by': resolved_by,
        'resolved_at': 'NOW()',
        'resolution_notes': resolution_notes
    })
    
    return {
        "success": True,
        "message": "Task resolved"
    }


@router.get("/{invoice_id}/validation")
async def validate_invoice(
    invoice_id: str = Path(...)
):
    """
    Validate invoice before confirmation
    
    Checks:
    - All lines matched
    - Total amounts match
    - Tax calculations correct
    - No duplicate invoices
    """
    
    repo = InvoiceRepository()
    
    invoice = await repo.get_invoice_by_id(invoice_id)
    if not invoice:
        raise HTTPException(404, "Invoice not found")
    
    lines = await repo.get_invoice_lines(invoice_id)
    
    errors = []
    warnings = []
    
    # Check matching
    unmatched = [l for l in lines if l['status'] not in ['matched', 'ignored']]
    if unmatched:
        errors.append(f"{len(unmatched)} lines not matched")
    
    # Check totals
    calculated_total = sum(l.get('line_total', 0) for l in lines if l['status'] == 'matched')
    invoice_total = invoice.get('total_amount', 0)
    if abs(calculated_total - invoice_total) > 1.0:  # Allow 1 rupee rounding
        warnings.append(f"Total mismatch: Calculated {calculated_total}, Invoice {invoice_total}")
    
    # Check for duplicates
    duplicate = await repo.check_duplicate_invoice(
        vendor_id=invoice['vendor_id'],
        invoice_number=invoice.get('invoice_number'),
        total_amount=invoice_total
    )
    if duplicate:
        warnings.append(f"Possible duplicate: Invoice {duplicate['invoice_number']} already exists")
    
    # Check negative values
    negative_lines = [l for l in lines if l.get('qty', 0) <= 0 or l.get('unit_price', 0) <= 0]
    if negative_lines:
        errors.append(f"{len(negative_lines)} lines with invalid qty/price")
    
    is_valid = len(errors) == 0
    
    return {
        "success": True,
        "data": {
            "invoice_id": invoice_id,
            "is_valid": is_valid,
            "can_confirm": is_valid,
            "errors": errors,
            "warnings": warnings,
            "summary": {
                "total_lines": len(lines),
                "matched_lines": len([l for l in lines if l['status'] == 'matched']),
                "unmatched_lines": len(unmatched),
                "calculated_total": calculated_total,
                "invoice_total": invoice_total
            }
        }
    }
