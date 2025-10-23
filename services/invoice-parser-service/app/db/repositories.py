"""
Database Repositories - P0 Implementation
Data access layer for invoice parsing
"""

from typing import Dict, List, Optional
import asyncpg
from app.core.config import settings

class BaseRepository:
    """Base repository with connection pool"""
    
    async def get_connection(self):
        """Get database connection"""
        return await asyncpg.connect(settings.DATABASE_URL)

class InvoiceRepository(BaseRepository):
    """Repository for parsed invoices"""
    
    async def create_parsed_invoice(self, data: Dict) -> Dict:
        """Create parsed invoice record"""
        conn = await self.get_connection()
        try:
            query = """
                INSERT INTO parsed_invoices (
                    id, vendor_id, shop_id, invoice_number, invoice_date,
                    source_type, source_ref, raw_pdf_path, ocr_text,
                    total_amount, currency, status, confidence_score,
                    uploaded_by, trace_id, parsed_at
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW()
                ) RETURNING *
            """
            row = await conn.fetchrow(
                query,
                data['id'], data['vendor_id'], data['shop_id'],
                data.get('invoice_number'), data.get('invoice_date'),
                data['source_type'], data.get('source_ref'),
                data['raw_pdf_path'], data.get('ocr_text'),
                data.get('total_amount', 0), data.get('currency', 'INR'),
                data.get('status', 'parsed'), data.get('confidence_score', 0),
                data.get('uploaded_by'), data['trace_id']
            )
            return dict(row)
        finally:
            await conn.close()
    
    async def create_parsed_line(self, data: Dict) -> Dict:
        """Create parsed invoice line"""
        conn = await self.get_connection()
        try:
            query = """
                INSERT INTO parsed_invoice_lines (
                    parsed_invoice_id, line_number, raw_text, description,
                    qty, unit_price, tax_rate, tax_amount, line_total,
                    batch_no, expiry_date, hsn_code, status
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
                ) RETURNING *
            """
            row = await conn.fetchrow(
                query,
                data['parsed_invoice_id'], data['line_number'],
                data.get('raw_text'), data.get('description'),
                data.get('qty', 0), data.get('unit_price', 0),
                data.get('tax_rate', 12), data.get('tax_amount', 0),
                data.get('line_total', 0), data.get('batch_no'),
                data.get('expiry_date'), data.get('hsn_code'),
                data.get('status', 'pending')
            )
            return dict(row)
        finally:
            await conn.close()
    
    async def get_invoice_lines(self, invoice_id: str, status: str = None) -> List[Dict]:
        """Get invoice lines"""
        conn = await self.get_connection()
        try:
            if status:
                query = "SELECT * FROM parsed_invoice_lines WHERE parsed_invoice_id = $1 AND status = $2"
                rows = await conn.fetch(query, invoice_id, status)
            else:
                query = "SELECT * FROM parsed_invoice_lines WHERE parsed_invoice_id = $1"
                rows = await conn.fetch(query, invoice_id)
            return [dict(row) for row in rows]
        finally:
            await conn.close()
    
    async def update_line(self, data: Dict):
        """Update parsed line with match results"""
        conn = await self.get_connection()
        try:
            query = """
                UPDATE parsed_invoice_lines
                SET suggested_product_id = $2,
                    match_type = $3,
                    match_confidence = $4,
                    match_metadata = $5,
                    status = $6,
                    updated_at = NOW()
                WHERE id = $1
            """
            await conn.execute(
                query,
                data['id'],
                data.get('suggested_product_id'),
                data.get('match_type'),
                data.get('match_confidence'),
                data.get('match_metadata'),
                data.get('status')
            )
        finally:
            await conn.close()
    
    async def create_reconciliation_task(self, data: Dict):
        """Create reconciliation task for manual review"""
        conn = await self.get_connection()
        try:
            query = """
                INSERT INTO reconciliation_tasks (
                    parsed_invoice_id, parsed_line_id, task_type,
                    description, suggested_actions, status
                ) VALUES ($1, $2, $3, $4, $5, $6)
            """
            await conn.execute(
                query,
                data['parsed_invoice_id'],
                data.get('parsed_line_id'),
                data['task_type'],
                data['description'],
                data.get('suggested_actions'),
                data.get('status', 'pending')
            )
        finally:
            await conn.close()

class ProductRepository(BaseRepository):
    """Repository for products"""
    
    async def find_by_sku(self, sku: str) -> Optional[Dict]:
        """Find product by SKU"""
        conn = await self.get_connection()
        try:
            query = "SELECT * FROM products WHERE sku = $1 AND is_active = true LIMIT 1"
            row = await conn.fetchrow(query, sku)
            return dict(row) if row else None
        finally:
            await conn.close()
    
    async def find_by_normalized_name(self, name: str) -> Optional[Dict]:
        """Find product by normalized name"""
        conn = await self.get_connection()
        try:
            query = """
                SELECT * FROM products 
                WHERE LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9 ]', '', 'g')) = $1
                AND is_active = true
                LIMIT 1
            """
            row = await conn.fetchrow(query, name)
            return dict(row) if row else None
        finally:
            await conn.close()
    
    async def get_all_active(self) -> List[Dict]:
        """Get all active products (for fuzzy matching)"""
        conn = await self.get_connection()
        try:
            query = "SELECT id, name, brand, potency FROM products WHERE is_active = true LIMIT 1000"
            rows = await conn.fetch(query)
            return [dict(row) for row in rows]
        finally:
            await conn.close()
    
    async def search_products(self, keywords: str, limit: int = 10) -> List[Dict]:
        """Search products by keywords"""
        conn = await self.get_connection()
        try:
            query = """
                SELECT id, name, brand, potency, pack_size
                FROM products
                WHERE name ILIKE $1 AND is_active = true
                LIMIT $2
            """
            rows = await conn.fetch(query, f'%{keywords}%', limit)
            return [dict(row) for row in rows]
        finally:
            await conn.close()

class VendorMappingRepository(BaseRepository):
    """Repository for vendor product mappings"""
    
    async def find_mapping(self, vendor_id: str, description: str) -> Optional[Dict]:
        """Find vendor product mapping"""
        conn = await self.get_connection()
        try:
            query = """
                SELECT * FROM vendor_product_mappings
                WHERE vendor_id = $1 
                AND LOWER(vendor_sku_name) = LOWER($2)
                ORDER BY confidence DESC, last_used_at DESC
                LIMIT 1
            """
            row = await conn.fetchrow(query, vendor_id, description)
            return dict(row) if row else None
        finally:
            await conn.close()
    
    async def update_usage(self, mapping_id: str):
        """Update mapping usage count and timestamp"""
        conn = await self.get_connection()
        try:
            query = """
                UPDATE vendor_product_mappings
                SET usage_count = usage_count + 1,
                    last_used_at = NOW()
                WHERE id = $1
            """
            await conn.execute(query, mapping_id)
        finally:
            await conn.close()
    
    async def create_mapping(self, data: Dict):
        """Create new vendor mapping (from manual match)"""
        conn = await self.get_connection()
        try:
            query = """
                INSERT INTO vendor_product_mappings (
                    vendor_id, vendor_sku_name, product_id,
                    confidence, created_by
                ) VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (vendor_id, vendor_sku_name) 
                DO UPDATE SET 
                    product_id = $3,
                    confidence = $4,
                    usage_count = vendor_product_mappings.usage_count + 1,
                    last_used_at = NOW()
            """
            await conn.execute(
                query,
                data['vendor_id'],
                data['vendor_sku_name'],
                data['product_id'],
                data.get('confidence', 1.0),
                data.get('created_by')
            )
        finally:
            await conn.close()
