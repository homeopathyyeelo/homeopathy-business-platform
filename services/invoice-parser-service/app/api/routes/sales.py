"""
Sales Invoice API Routes
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
import asyncpg

from app.services.sales_invoice_engine import SalesInvoiceEngine
from app.core.database import get_db_connection

router = APIRouter()

class InvoiceLine(BaseModel):
    product_id: str
    qty: float
    discount_pct: Optional[float] = 0

class POSInvoiceRequest(BaseModel):
    shop_id: str
    customer_id: Optional[str] = None
    lines: List[InvoiceLine]
    payment_method: str = "cash"

class WholesaleInvoiceRequest(BaseModel):
    shop_id: str
    customer_id: str
    lines: List[InvoiceLine]
    credit_days: int = 0

class OnlineOrderInvoiceRequest(BaseModel):
    order_id: str
    shop_id: str
    customer_id: str
    lines: List[InvoiceLine]
    shipping_address: dict
    shipping_charges: float = 0

@router.post("/pos/create")
async def create_pos_invoice(request: POSInvoiceRequest, db: asyncpg.Connection = Depends(get_db_connection)):
    """Create POS retail invoice"""
    engine = SalesInvoiceEngine(db)
    result = await engine.create_pos_invoice(request.dict())
    
    if not result['success']:
        raise HTTPException(status_code=400, detail=result['error'])
    
    return result

@router.post("/wholesale/create")
async def create_wholesale_invoice(request: WholesaleInvoiceRequest, db: asyncpg.Connection = Depends(get_db_connection)):
    """Create wholesale invoice"""
    engine = SalesInvoiceEngine(db)
    result = await engine.create_wholesale_invoice(request.dict())
    
    if not result['success']:
        raise HTTPException(status_code=400, detail=result['error'])
    
    return result

@router.post("/online/create")
async def create_online_invoice(request: OnlineOrderInvoiceRequest, db: asyncpg.Connection = Depends(get_db_connection)):
    """Create online order invoice"""
    engine = SalesInvoiceEngine(db)
    result = await engine.create_online_order_invoice(request.dict())
    
    if not result['success']:
        raise HTTPException(status_code=400, detail=result['error'])
    
    return result

@router.post("/{invoice_id}/confirm")
async def confirm_invoice(invoice_id: str, db: asyncpg.Connection = Depends(get_db_connection)):
    """Confirm invoice and deduct inventory"""
    engine = SalesInvoiceEngine(db)
    result = await engine.confirm_invoice(invoice_id)
    
    if not result['success']:
        raise HTTPException(status_code=400, detail=result['error'])
    
    return result

@router.get("/{invoice_id}")
async def get_invoice(invoice_id: str, db: asyncpg.Connection = Depends(get_db_connection)):
    """Get invoice details"""
    query = """
        SELECT i.*, 
               json_agg(l.*) as lines
        FROM sales_invoices i
        LEFT JOIN sales_invoice_lines l ON l.invoice_id = i.id
        WHERE i.id = $1
        GROUP BY i.id
    """
    row = await db.fetchrow(query, invoice_id)
    
    if not row:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    return dict(row)

@router.get("/shop/{shop_id}/today")
async def get_today_invoices(shop_id: str, db: asyncpg.Connection = Depends(get_db_connection)):
    """Get today's invoices for a shop"""
    query = """
        SELECT * FROM sales_invoices
        WHERE shop_id = $1 AND invoice_date::date = CURRENT_DATE
        ORDER BY created_at DESC
    """
    rows = await db.fetch(query, shop_id)
    return [dict(row) for row in rows]
