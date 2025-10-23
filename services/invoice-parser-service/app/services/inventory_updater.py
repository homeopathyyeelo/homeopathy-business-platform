"""
Inventory Updater - Batch-wise inventory updates with expiry tracking
"""

from typing import Dict, List
from datetime import datetime, date
import asyncpg
import uuid

class InventoryUpdater:
    """Update inventory batches from GRN"""
    
    def __init__(self, db_conn):
        self.conn = db_conn
    
    async def update_from_grn(self, grn_id: str) -> Dict:
        """
        Update inventory from confirmed GRN
        Handles batch-wise updates with expiry tracking
        """
        # Get GRN details
        grn = await self._get_grn(grn_id)
        if not grn:
            raise ValueError(f"GRN {grn_id} not found")
        
        if grn['status'] != 'confirmed':
            raise ValueError(f"GRN must be confirmed. Current status: {grn['status']}")
        
        # Get GRN lines
        lines = await self._get_grn_lines(grn_id)
        
        results = []
        for line in lines:
            result = await self._update_batch(
                shop_id=grn['shop_id'],
                product_id=line['product_id'],
                batch_no=line['batch_no'],
                expiry_date=line['expiry_date'],
                qty=line['qty'],
                landed_cost=line['landed_unit_cost']
            )
            results.append(result)
        
        return {
            'grn_id': grn_id,
            'shop_id': grn['shop_id'],
            'batches_updated': len(results),
            'results': results
        }
    
    async def _update_batch(
        self,
        shop_id: str,
        product_id: str,
        batch_no: str,
        expiry_date: date,
        qty: float,
        landed_cost: float
    ) -> Dict:
        """
        Update or create inventory batch
        Key: (shop_id, product_id, batch_no)
        """
        
        # Check if batch exists
        existing = await self._find_batch(shop_id, product_id, batch_no)
        
        if existing:
            # Update existing batch
            new_qty = existing['quantity'] + qty
            new_available = existing['available'] + qty
            
            update_query = """
                UPDATE inventory_batches
                SET quantity = $1,
                    available = $2,
                    landed_cost = $3,
                    last_restocked = NOW(),
                    updated_at = NOW()
                WHERE id = $4
                RETURNING *
            """
            
            row = await self.conn.fetchrow(
                update_query,
                new_qty,
                new_available,
                landed_cost,
                existing['id']
            )
            
            return {
                'action': 'updated',
                'batch_id': existing['id'],
                'batch_no': batch_no,
                'previous_qty': existing['quantity'],
                'added_qty': qty,
                'new_qty': new_qty,
                'expiry_date': str(expiry_date)
            }
        else:
            # Create new batch
            batch_id = str(uuid.uuid4())
            
            insert_query = """
                INSERT INTO inventory_batches (
                    id, shop_id, product_id, batch_no, expiry_date,
                    quantity, reserved, available, landed_cost,
                    last_restocked, created_at, updated_at
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, 0, $6, $7, NOW(), NOW(), NOW()
                )
                RETURNING *
            """
            
            row = await self.conn.fetchrow(
                insert_query,
                batch_id, shop_id, product_id, batch_no, expiry_date,
                qty, landed_cost
            )
            
            return {
                'action': 'created',
                'batch_id': batch_id,
                'batch_no': batch_no,
                'qty': qty,
                'expiry_date': str(expiry_date)
            }
    
    async def _find_batch(self, shop_id: str, product_id: str, batch_no: str) -> Dict:
        """Find existing batch"""
        query = """
            SELECT * FROM inventory_batches
            WHERE shop_id = $1 AND product_id = $2 AND batch_no = $3
        """
        row = await self.conn.fetchrow(query, shop_id, product_id, batch_no)
        return dict(row) if row else None
    
    async def _get_grn(self, grn_id: str) -> Dict:
        """Get GRN details"""
        query = "SELECT * FROM purchase_receipts WHERE id = $1"
        row = await self.conn.fetchrow(query, grn_id)
        return dict(row) if row else None
    
    async def _get_grn_lines(self, grn_id: str) -> List[Dict]:
        """Get GRN lines"""
        query = "SELECT * FROM purchase_receipt_lines WHERE receipt_id = $1"
        rows = await self.conn.fetch(query, grn_id)
        return [dict(row) for row in rows]
    
    async def get_product_stock(self, product_id: str, shop_id: str = None) -> Dict:
        """
        Get total stock for a product across all batches
        """
        if shop_id:
            query = """
                SELECT 
                    product_id,
                    shop_id,
                    COUNT(*) as batch_count,
                    SUM(quantity) as total_quantity,
                    SUM(reserved) as total_reserved,
                    SUM(available) as total_available,
                    MIN(expiry_date) as earliest_expiry,
                    MAX(expiry_date) as latest_expiry
                FROM inventory_batches
                WHERE product_id = $1 AND shop_id = $2
                GROUP BY product_id, shop_id
            """
            row = await self.conn.fetchrow(query, product_id, shop_id)
        else:
            query = """
                SELECT 
                    product_id,
                    COUNT(*) as batch_count,
                    SUM(quantity) as total_quantity,
                    SUM(reserved) as total_reserved,
                    SUM(available) as total_available,
                    MIN(expiry_date) as earliest_expiry,
                    MAX(expiry_date) as latest_expiry
                FROM inventory_batches
                WHERE product_id = $1
                GROUP BY product_id
            """
            row = await self.conn.fetchrow(query, product_id)
        
        if not row:
            return {
                'product_id': product_id,
                'total_quantity': 0,
                'batch_count': 0
            }
        
        return dict(row)
    
    async def get_expiring_batches(self, shop_id: str, days: int = 90) -> List[Dict]:
        """Get batches expiring within specified days"""
        query = """
            SELECT 
                id, shop_id, product_id, batch_no, expiry_date,
                quantity, available,
                EXTRACT(DAY FROM (expiry_date - CURRENT_DATE)) as days_to_expiry
            FROM inventory_batches
            WHERE shop_id = $1
            AND expiry_date <= CURRENT_DATE + INTERVAL '%s days'
            AND quantity > 0
            ORDER BY expiry_date ASC
        """ % days
        
        rows = await self.conn.fetch(query, shop_id)
        return [dict(row) for row in rows]
    
    async def reserve_stock(self, product_id: str, shop_id: str, qty: float) -> Dict:
        """
        Reserve stock for sales order (FIFO by expiry)
        """
        # Get available batches ordered by expiry (FIFO)
        query = """
            SELECT * FROM inventory_batches
            WHERE product_id = $1 AND shop_id = $2 AND available > 0
            ORDER BY expiry_date ASC, created_at ASC
        """
        batches = await self.conn.fetch(query, product_id, shop_id)
        
        remaining_qty = qty
        reserved_batches = []
        
        for batch in batches:
            if remaining_qty <= 0:
                break
            
            available = batch['available']
            to_reserve = min(available, remaining_qty)
            
            # Update batch
            update_query = """
                UPDATE inventory_batches
                SET reserved = reserved + $1,
                    available = available - $1,
                    updated_at = NOW()
                WHERE id = $2
            """
            await self.conn.execute(update_query, to_reserve, batch['id'])
            
            reserved_batches.append({
                'batch_id': batch['id'],
                'batch_no': batch['batch_no'],
                'reserved_qty': to_reserve
            })
            
            remaining_qty -= to_reserve
        
        if remaining_qty > 0:
            return {
                'success': False,
                'message': f'Insufficient stock. Short by {remaining_qty}',
                'reserved_batches': reserved_batches
            }
        
        return {
            'success': True,
            'reserved_qty': qty,
            'reserved_batches': reserved_batches
        }
