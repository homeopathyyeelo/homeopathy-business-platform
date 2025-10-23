"""
Upload Invoice Route - P0 Implementation
Handles PDF upload, storage, and initiates parsing
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks
from typing import Optional
import uuid
from datetime import datetime
import os

from app.core.config import settings
from app.services.pdf_parser import PDFParserService
from app.services.ocr_service import OCRService
from app.db.repositories import InvoiceRepository
from app.core.storage import MinIOStorage

router = APIRouter()

@router.post("/upload")
async def upload_invoice(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    vendor_id: str = Form(...),
    shop_id: str = Form(...),
    source: str = Form(default="manual"),
    uploader_id: Optional[str] = Form(None)
):
    """
    Upload and parse vendor invoice
    
    P0: Core upload + parse pipeline
    - Save PDF to MinIO
    - Extract text/tables
    - OCR if needed
    - Create parsed_invoice record
    - Kick off async matching
    """
    
    # Validate file
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(400, "Only PDF files allowed")
    
    if file.size > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(400, f"File too large. Max {settings.MAX_UPLOAD_SIZE} bytes")
    
    try:
        # Generate IDs
        invoice_id = str(uuid.uuid4())
        trace_id = str(uuid.uuid4())
        timestamp = datetime.utcnow()
        
        # Read file content
        content = await file.read()
        
        # Save to MinIO
        storage = MinIOStorage()
        pdf_path = f"invoices/{vendor_id}/{timestamp.strftime('%Y%m%d')}/{invoice_id}.pdf"
        await storage.upload(pdf_path, content)
        
        # Parse PDF
        parser = PDFParserService()
        parsed_data = await parser.parse_pdf(content, trace_id)
        
        # OCR if needed (scanned PDF)
        if parsed_data.get('needs_ocr'):
            ocr = OCRService()
            ocr_text = await ocr.extract_text(content)
            parsed_data['ocr_text'] = ocr_text
            parsed_data = await parser.parse_with_ocr(ocr_text, trace_id)
        
        # Save to database
        repo = InvoiceRepository()
        invoice = await repo.create_parsed_invoice({
            'id': invoice_id,
            'vendor_id': vendor_id,
            'shop_id': shop_id,
            'source_type': source,
            'raw_pdf_path': pdf_path,
            'ocr_text': parsed_data.get('ocr_text'),
            'invoice_number': parsed_data.get('invoice_number'),
            'invoice_date': parsed_data.get('invoice_date'),
            'total_amount': parsed_data.get('total_amount'),
            'currency': parsed_data.get('currency', 'INR'),
            'uploaded_by': uploader_id,
            'trace_id': trace_id,
            'status': 'parsed',
            'confidence_score': parsed_data.get('confidence_score', 0.0)
        })
        
        # Save parsed lines
        for idx, line in enumerate(parsed_data.get('lines', [])):
            await repo.create_parsed_line({
                'parsed_invoice_id': invoice_id,
                'line_number': idx + 1,
                'raw_text': line.get('raw_text'),
                'description': line.get('description'),
                'qty': line.get('qty'),
                'unit_price': line.get('unit_price'),
                'tax_rate': line.get('tax_rate'),
                'tax_amount': line.get('tax_amount'),
                'line_total': line.get('line_total'),
                'batch_no': line.get('batch_no'),
                'expiry_date': line.get('expiry_date'),
                'hsn_code': line.get('hsn_code'),
                'status': 'pending'
            })
        
        # Kick off async matching job
        background_tasks.add_task(match_invoice_lines, invoice_id, trace_id)
        
        return {
            "success": True,
            "data": {
                "parsed_invoice_id": invoice_id,
                "status": "processing",
                "trace_id": trace_id,
                "lines_count": len(parsed_data.get('lines', [])),
                "confidence_score": parsed_data.get('confidence_score', 0.0)
            }
        }
        
    except Exception as e:
        raise HTTPException(500, f"Upload failed: {str(e)}")


async def match_invoice_lines(invoice_id: str, trace_id: str):
    """
    Background task: Match parsed lines to products
    P0: SKU, vendor map, exact, fuzzy matching
    """
    from app.services.matcher import ProductMatcher
    
    repo = InvoiceRepository()
    matcher = ProductMatcher()
    
    # Get all pending lines
    lines = await repo.get_invoice_lines(invoice_id, status='pending')
    
    for line in lines:
        # Run matching hierarchy
        match_result = await matcher.match_product(
            description=line['description'],
            vendor_id=line['vendor_id'],
            qty=line['qty'],
            trace_id=trace_id
        )
        
        # Update line with match results
        await repo.update_line({
            'id': line['id'],
            'suggested_product_id': match_result.get('product_id'),
            'match_type': match_result.get('match_type'),
            'match_confidence': match_result.get('confidence'),
            'match_metadata': match_result.get('metadata'),
            'status': 'matched' if match_result.get('confidence', 0) >= 0.85 else 'needs_review'
        })
        
        # Create reconciliation task if low confidence
        if match_result.get('confidence', 0) < 0.6:
            await repo.create_reconciliation_task({
                'parsed_invoice_id': invoice_id,
                'parsed_line_id': line['id'],
                'task_type': 'unmatched',
                'description': f"Low confidence match: {match_result.get('confidence')}",
                'suggested_actions': match_result.get('suggestions', []),
                'status': 'pending'
            })
