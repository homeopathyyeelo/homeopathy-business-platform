"""
POS Billing Engine - Fast retail billing with real-time inventory
Optimized for speed: < 2 seconds per invoice
"""

from typing import Dict, List
from decimal import Decimal
from datetime import datetime
import asyncpg
import uuid

class POSBillingEngine:
    """
    High-speed POS billing for retail
    Features:
    - Real-time inventory check
    - Barcode scanning support
    - Quick payment processing
    - Auto print receipt
    - Loyalty points calculation
    """
    
    def __init__(self, db_conn):
        self.conn = db_conn
    
    async def create_quick_bill(self, bill_data: Dict) -> Dict:
        """
        Create POS bill in < 2 seconds
        Optimized for retail speed
        """
        shop_id = bill_data['shop_id']
        cashier_id = bill_data.get('cashier_id')
        customer_id = bill_data.get('customer_id')
        items = bill_data['items']
        payment_method = bill_data.get('payment_method', 'cash')
        
        # Quick inventory validation (parallel)
        validation_result = await self._quick_inventory_check(shop_id, items)
        if not validation_result['success']:
            return validation_result
        
        # Generate bill number
        bill_number = await self._generate_bill_number(shop_id)
        bill_id = str(uuid.uuid4())
        
        # Process items (optimized query)
        processed_items = await self._process_items_batch(shop_id, items)
        
        # Calculate totals
        totals = self._calculate_totals(processed_items)
        
        # Apply loyalty discount if customer
        if customer_id:
            loyalty_discount = await self._apply_loyalty_points(customer_id, totals['grand_total'])
            totals['loyalty_discount'] = float(loyalty_discount)
            totals['grand_total'] -= float(loyalty_discount)
        
        # Save bill (single transaction)
        await self._save_bill_fast(bill_id, bill_number, shop_id, customer_id, 
                                   cashier_id, processed_items, totals, payment_method)
        
        # Reserve inventory (async, non-blocking)
        await self._reserve_inventory_batch(shop_id, processed_items)
        
        # Calculate loyalty points earned
        points_earned = 0
        if customer_id:
            points_earned = await self._calculate_loyalty_points(customer_id, totals['grand_total'])
        
        return {
            'success': True,
            'bill_id': bill_id,
            'bill_number': bill_number,
            'grand_total': totals['grand_total'],
            'items': processed_items,
            'totals': totals,
            'points_earned': points_earned,
            'payment_method': payment_method
        }
    
    async def scan_barcode(self, barcode: str, shop_id: str) -> Dict:
        """
        Quick barcode scan - return product with price and stock
        """
        query = """
            SELECT 
                p.id, p.name, p.retail_price, p.mrp, p.tax_rate, p.hsn_code,
                COALESCE(SUM(ib.available), 0) as stock_available
            FROM products p
            LEFT JOIN inventory_batches ib ON ib.product_id = p.id AND ib.shop_id = $2
            WHERE p.barcode = $1 OR p.sku = $1
            GROUP BY p.id
        """
        row = await self.conn.fetchrow(query, barcode, shop_id)
        
        if not row:
            return {'success': False, 'error': 'Product not found'}
        
        return {
            'success': True,
            'product': {
                'id': row['id'],
                'name': row['name'],
                'price': float(row['retail_price'] or row['mrp']),
                'mrp': float(row['mrp']),
                'tax_rate': float(row['tax_rate']),
                'stock': float(row['stock_available']),
                'hsn_code': row['hsn_code']
            }
        }
    
    async def hold_bill(self, bill_data: Dict) -> Dict:
        """
        Hold bill for later (customer steps away)
        """
        hold_id = str(uuid.uuid4())
        
        query = """
            INSERT INTO pos_hold_bills (id, shop_id, cashier_id, items, created_at)
            VALUES ($1, $2, $3, $4, NOW())
            RETURNING id
        """
        
        await self.conn.execute(
            query, hold_id, bill_data['shop_id'], 
            bill_data.get('cashier_id'), bill_data['items']
        )
        
        return {
            'success': True,
            'hold_id': hold_id,
            'message': 'Bill held successfully'
        }
    
    async def retrieve_hold_bill(self, hold_id: str) -> Dict:
        """
        Retrieve held bill
        """
        query = "SELECT * FROM pos_hold_bills WHERE id = $1"
        row = await self.conn.fetchrow(query, hold_id)
        
        if not row:
            return {'success': False, 'error': 'Hold bill not found'}
        
        return {
            'success': True,
            'bill_data': dict(row)
        }
    
    async def _quick_inventory_check(self, shop_id: str, items: List[Dict]) -> Dict:
        """
        Fast inventory check for all items
        """
        product_ids = [item['product_id'] for item in items]
        
        query = """
            SELECT product_id, SUM(available) as total_available
            FROM inventory_batches
            WHERE shop_id = $1 AND product_id = ANY($2)
            GROUP BY product_id
        """
        
        rows = await self.conn.fetch(query, shop_id, product_ids)
        stock_map = {row['product_id']: float(row['total_available']) for row in rows}
        
        for item in items:
            available = stock_map.get(item['product_id'], 0)
            if available < item['qty']:
                return {
                    'success': False,
                    'error': f"Insufficient stock for product {item['product_id']}. Available: {available}"
                }
        
        return {'success': True}
    
    async def _process_items_batch(self, shop_id: str, items: List[Dict]) -> List[Dict]:
        """
        Process all items in single query (optimized)
        """
        product_ids = [item['product_id'] for item in items]
        
        query = """
            SELECT id, name, retail_price, mrp, tax_rate, hsn_code
            FROM products
            WHERE id = ANY($1)
        """
        
        rows = await self.conn.fetch(query, product_ids)
        product_map = {row['id']: dict(row) for row in rows}
        
        processed = []
        for item in items:
            product = product_map.get(item['product_id'])
            if not product:
                continue
            
            qty = Decimal(str(item['qty']))
            unit_price = Decimal(str(product['retail_price'] or product['mrp']))
            discount_pct = Decimal(str(item.get('discount_pct', 0))) / 100
            
            discount_amount = unit_price * qty * discount_pct
            taxable_amount = (unit_price * qty) - discount_amount
            
            tax_rate = Decimal(str(product['tax_rate'])) / 100
            tax_amount = taxable_amount * tax_rate
            
            line_total = taxable_amount + tax_amount
            
            processed.append({
                'product_id': item['product_id'],
                'product_name': product['name'],
                'qty': float(qty),
                'unit_price': float(unit_price),
                'mrp': float(product['mrp']),
                'discount_amount': float(discount_amount),
                'tax_rate': float(product['tax_rate']),
                'tax_amount': float(tax_amount),
                'line_total': float(line_total),
                'hsn_code': product['hsn_code']
            })
        
        return processed
    
    def _calculate_totals(self, items: List[Dict]) -> Dict:
        """
        Calculate bill totals
        """
        subtotal = sum(Decimal(str(item['line_total'])) - Decimal(str(item['tax_amount'])) 
                      for item in items)
        total_discount = sum(Decimal(str(item['discount_amount'])) for item in items)
        total_tax = sum(Decimal(str(item['tax_amount'])) for item in items)
        grand_total = sum(Decimal(str(item['line_total'])) for item in items)
        
        return {
            'subtotal': float(subtotal + total_discount),
            'total_discount': float(total_discount),
            'total_tax': float(total_tax),
            'grand_total': float(grand_total),
            'item_count': len(items)
        }
    
    async def _save_bill_fast(self, bill_id: str, bill_number: str, shop_id: str,
                             customer_id: str, cashier_id: str, items: List[Dict],
                             totals: Dict, payment_method: str):
        """
        Save bill in single transaction (fast)
        """
        async with self.conn.transaction():
            # Insert invoice
            insert_invoice = """
                INSERT INTO sales_invoices (
                    id, invoice_number, invoice_type, shop_id, customer_id,
                    invoice_date, subtotal, total_discount, total_tax, grand_total,
                    payment_method, status, created_at
                ) VALUES ($1, $2, 'POS_RETAIL', $3, $4, NOW(), $5, $6, $7, $8, $9, 'confirmed', NOW())
            """
            await self.conn.execute(
                insert_invoice, bill_id, bill_number, shop_id, customer_id,
                totals['subtotal'], totals['total_discount'], totals['total_tax'],
                totals['grand_total'], payment_method
            )
            
            # Insert lines (batch)
            for idx, item in enumerate(items):
                insert_line = """
                    INSERT INTO sales_invoice_lines (
                        id, invoice_id, product_id, qty, unit_price,
                        discount_amount, tax_rate, tax_amount, line_total
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                """
                await self.conn.execute(
                    insert_line, str(uuid.uuid4()), bill_id, item['product_id'],
                    item['qty'], item['unit_price'], item['discount_amount'],
                    item['tax_rate'], item['tax_amount'], item['line_total']
                )
    
    async def _reserve_inventory_batch(self, shop_id: str, items: List[Dict]):
        """
        Reserve inventory for all items (FIFO)
        """
        for item in items:
            query = """
                SELECT id, available FROM inventory_batches
                WHERE shop_id = $1 AND product_id = $2 AND available > 0
                ORDER BY expiry_date ASC
                LIMIT 5
            """
            batches = await self.conn.fetch(query, shop_id, item['product_id'])
            
            remaining = Decimal(str(item['qty']))
            for batch in batches:
                if remaining <= 0:
                    break
                
                available = Decimal(str(batch['available']))
                to_reserve = min(available, remaining)
                
                update = """
                    UPDATE inventory_batches
                    SET reserved = reserved + $1, available = available - $1
                    WHERE id = $2
                """
                await self.conn.execute(update, float(to_reserve), batch['id'])
                remaining -= to_reserve
    
    async def _generate_bill_number(self, shop_id: str) -> str:
        """
        Generate sequential bill number
        """
        query = """
            SELECT COUNT(*) as count FROM sales_invoices
            WHERE shop_id = $1 AND DATE(invoice_date) = CURRENT_DATE
        """
        row = await self.conn.fetchrow(query, shop_id)
        seq = (row['count'] or 0) + 1
        return f"POS-{datetime.now().strftime('%Y%m%d')}-{seq:04d}"
    
    async def _apply_loyalty_points(self, customer_id: str, amount: float) -> Decimal:
        """
        Apply loyalty points as discount
        """
        query = "SELECT loyalty_points FROM customers WHERE id = $1"
        row = await self.conn.fetchrow(query, customer_id)
        
        if not row or not row['loyalty_points']:
            return Decimal('0')
        
        points = Decimal(str(row['loyalty_points']))
        max_discount = Decimal(str(amount)) * Decimal('0.10')  # Max 10%
        
        discount = min(points, max_discount)
        
        # Deduct points
        if discount > 0:
            update = """
                UPDATE customers
                SET loyalty_points = loyalty_points - $1
                WHERE id = $2
            """
            await self.conn.execute(update, float(discount), customer_id)
        
        return discount
    
    async def _calculate_loyalty_points(self, customer_id: str, amount: float) -> int:
        """
        Calculate and add loyalty points (1% of bill)
        """
        points = int(amount * 0.01)
        
        if points > 0:
            update = """
                UPDATE customers
                SET loyalty_points = COALESCE(loyalty_points, 0) + $1
                WHERE id = $2
            """
            await self.conn.execute(update, points, customer_id)
        
        return points
