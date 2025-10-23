"""
Sales Invoice Engine - Generate invoices for POS, Wholesale, and Online Orders
Handles inventory deduction, pricing, discounts, and tax calculation
"""

from typing import Dict, List, Optional
from decimal import Decimal
from datetime import datetime, date
import asyncpg
import uuid
import json

class SalesInvoiceEngine:
    """
    Complete sales invoice generation for multiple channels
    - POS Retail (B2C)
    - Wholesale (B2B)
    - Online Orders (E-commerce)
    """
    
    def __init__(self, db_conn):
        self.conn = db_conn
    
    async def create_pos_invoice(self, invoice_data: Dict) -> Dict:
        """
        Create POS retail invoice (B2C)
        Fast billing with real-time inventory check
        """
        shop_id = invoice_data['shop_id']
        customer_id = invoice_data.get('customer_id')
        lines = invoice_data['lines']
        payment_method = invoice_data.get('payment_method', 'cash')
        
        # Validate inventory availability
        for line in lines:
            available = await self._check_inventory(shop_id, line['product_id'], line['qty'])
            if not available:
                return {
                    'success': False,
                    'error': f"Insufficient stock for product {line['product_id']}"
                }
        
        # Create invoice header
        invoice_id = str(uuid.uuid4())
        invoice_number = await self._generate_invoice_number('POS', shop_id)
        
        invoice = {
            'id': invoice_id,
            'invoice_number': invoice_number,
            'invoice_type': 'POS_RETAIL',
            'shop_id': shop_id,
            'customer_id': customer_id,
            'invoice_date': datetime.now(),
            'payment_method': payment_method,
            'status': 'draft'
        }
        
        # Process lines
        processed_lines = []
        subtotal = Decimal('0')
        total_tax = Decimal('0')
        total_discount = Decimal('0')
        
        for line in lines:
            processed_line = await self._process_pos_line(shop_id, line)
            processed_lines.append(processed_line)
            
            subtotal += Decimal(str(processed_line['line_total']))
            total_tax += Decimal(str(processed_line['tax_amount']))
            total_discount += Decimal(str(processed_line['discount_amount']))
        
        grand_total = subtotal + total_tax - total_discount
        
        # Save invoice
        await self._save_invoice(invoice, processed_lines, {
            'subtotal': float(subtotal),
            'total_tax': float(total_tax),
            'total_discount': float(total_discount),
            'grand_total': float(grand_total)
        })
        
        # Reserve inventory (FIFO)
        for line in processed_lines:
            await self._reserve_inventory(shop_id, line['product_id'], line['qty'])
        
        return {
            'success': True,
            'invoice_id': invoice_id,
            'invoice_number': invoice_number,
            'grand_total': float(grand_total),
            'lines': processed_lines
        }
    
    async def create_wholesale_invoice(self, invoice_data: Dict) -> Dict:
        """
        Create wholesale invoice (B2B)
        Includes credit terms, bulk discounts, and GST
        """
        shop_id = invoice_data['shop_id']
        customer_id = invoice_data['customer_id']
        lines = invoice_data['lines']
        credit_days = invoice_data.get('credit_days', 0)
        
        # Get customer details for pricing tier
        customer = await self._get_customer(customer_id)
        pricing_tier = customer.get('pricing_tier', 'standard')
        
        # Create invoice
        invoice_id = str(uuid.uuid4())
        invoice_number = await self._generate_invoice_number('WSL', shop_id)
        
        invoice = {
            'id': invoice_id,
            'invoice_number': invoice_number,
            'invoice_type': 'WHOLESALE',
            'shop_id': shop_id,
            'customer_id': customer_id,
            'invoice_date': datetime.now(),
            'credit_days': credit_days,
            'due_date': self._calculate_due_date(credit_days),
            'status': 'draft'
        }
        
        # Process lines with wholesale pricing
        processed_lines = []
        subtotal = Decimal('0')
        total_tax = Decimal('0')
        total_discount = Decimal('0')
        
        for line in lines:
            processed_line = await self._process_wholesale_line(
                shop_id, line, pricing_tier
            )
            processed_lines.append(processed_line)
            
            subtotal += Decimal(str(processed_line['line_total']))
            total_tax += Decimal(str(processed_line['tax_amount']))
            total_discount += Decimal(str(processed_line['discount_amount']))
        
        # Apply bulk discount if applicable
        if subtotal >= Decimal('50000'):  # Bulk order discount
            bulk_discount = subtotal * Decimal('0.05')  # 5% discount
            total_discount += bulk_discount
        
        grand_total = subtotal + total_tax - total_discount
        
        # Save invoice
        await self._save_invoice(invoice, processed_lines, {
            'subtotal': float(subtotal),
            'total_tax': float(total_tax),
            'total_discount': float(total_discount),
            'grand_total': float(grand_total),
            'payment_status': 'pending' if credit_days > 0 else 'paid'
        })
        
        # Reserve inventory
        for line in processed_lines:
            await self._reserve_inventory(shop_id, line['product_id'], line['qty'])
        
        # Create accounts receivable entry if credit
        if credit_days > 0:
            await self._create_receivable_entry(customer_id, invoice_id, grand_total)
        
        return {
            'success': True,
            'invoice_id': invoice_id,
            'invoice_number': invoice_number,
            'grand_total': float(grand_total),
            'due_date': invoice['due_date'].isoformat(),
            'lines': processed_lines
        }
    
    async def create_online_order_invoice(self, order_data: Dict) -> Dict:
        """
        Create invoice from online order
        Includes shipping, payment gateway integration
        """
        order_id = order_data['order_id']
        shop_id = order_data['shop_id']
        customer_id = order_data['customer_id']
        lines = order_data['lines']
        shipping_address = order_data['shipping_address']
        shipping_charges = Decimal(str(order_data.get('shipping_charges', 0)))
        
        # Create invoice
        invoice_id = str(uuid.uuid4())
        invoice_number = await self._generate_invoice_number('ONL', shop_id)
        
        invoice = {
            'id': invoice_id,
            'invoice_number': invoice_number,
            'invoice_type': 'ONLINE_ORDER',
            'order_id': order_id,
            'shop_id': shop_id,
            'customer_id': customer_id,
            'invoice_date': datetime.now(),
            'shipping_address': json.dumps(shipping_address),
            'status': 'draft'
        }
        
        # Process lines
        processed_lines = []
        subtotal = Decimal('0')
        total_tax = Decimal('0')
        total_discount = Decimal('0')
        
        for line in lines:
            processed_line = await self._process_online_line(shop_id, line)
            processed_lines.append(processed_line)
            
            subtotal += Decimal(str(processed_line['line_total']))
            total_tax += Decimal(str(processed_line['tax_amount']))
            total_discount += Decimal(str(processed_line['discount_amount']))
        
        # Add shipping charges
        grand_total = subtotal + total_tax - total_discount + shipping_charges
        
        # Save invoice
        await self._save_invoice(invoice, processed_lines, {
            'subtotal': float(subtotal),
            'total_tax': float(total_tax),
            'total_discount': float(total_discount),
            'shipping_charges': float(shipping_charges),
            'grand_total': float(grand_total)
        })
        
        # Reserve inventory
        for line in processed_lines:
            await self._reserve_inventory(shop_id, line['product_id'], line['qty'])
        
        # Update order status
        await self._update_order_status(order_id, 'invoiced')
        
        return {
            'success': True,
            'invoice_id': invoice_id,
            'invoice_number': invoice_number,
            'order_id': order_id,
            'grand_total': float(grand_total),
            'lines': processed_lines
        }
    
    async def confirm_invoice(self, invoice_id: str) -> Dict:
        """
        Confirm invoice and deduct inventory
        Creates accounting entries and publishes events
        """
        # Get invoice
        invoice = await self._get_invoice(invoice_id)
        if not invoice:
            return {'success': False, 'error': 'Invoice not found'}
        
        if invoice['status'] != 'draft':
            return {'success': False, 'error': 'Invoice already confirmed'}
        
        # Get invoice lines
        lines = await self._get_invoice_lines(invoice_id)
        
        # Deduct inventory (FIFO from reserved batches)
        for line in lines:
            result = await self._deduct_inventory(
                invoice['shop_id'],
                line['product_id'],
                line['qty']
            )
            if not result['success']:
                return result
        
        # Update invoice status
        await self._update_invoice_status(invoice_id, 'confirmed')
        
        # Create accounting entries
        await self._create_sales_accounting_entries(invoice, lines)
        
        # Publish events
        await self._publish_invoice_events(invoice, lines)
        
        return {
            'success': True,
            'invoice_id': invoice_id,
            'status': 'confirmed',
            'message': 'Invoice confirmed and inventory deducted'
        }
    
    async def _process_pos_line(self, shop_id: str, line: Dict) -> Dict:
        """Process POS line with retail pricing"""
        product_id = line['product_id']
        qty = Decimal(str(line['qty']))
        
        # Get retail price
        price = await self._get_retail_price(shop_id, product_id)
        unit_price = Decimal(str(price['retail_price']))
        
        # Calculate discount
        discount_pct = Decimal(str(line.get('discount_pct', 0))) / 100
        discount_amount = unit_price * qty * discount_pct
        
        # Calculate tax
        tax_rate = Decimal(str(price.get('tax_rate', 12))) / 100
        taxable_amount = (unit_price * qty) - discount_amount
        tax_amount = taxable_amount * tax_rate
        
        line_total = taxable_amount + tax_amount
        
        return {
            'product_id': product_id,
            'qty': float(qty),
            'unit_price': float(unit_price),
            'discount_amount': float(discount_amount),
            'tax_rate': float(tax_rate * 100),
            'tax_amount': float(tax_amount),
            'line_total': float(line_total)
        }
    
    async def _process_wholesale_line(self, shop_id: str, line: Dict, pricing_tier: str) -> Dict:
        """Process wholesale line with tier pricing"""
        product_id = line['product_id']
        qty = Decimal(str(line['qty']))
        
        # Get wholesale price based on tier
        price = await self._get_wholesale_price(shop_id, product_id, pricing_tier)
        unit_price = Decimal(str(price['wholesale_price']))
        
        # Quantity-based discount
        if qty >= 100:
            discount_pct = Decimal('0.10')  # 10% for 100+ units
        elif qty >= 50:
            discount_pct = Decimal('0.07')  # 7% for 50+ units
        elif qty >= 20:
            discount_pct = Decimal('0.05')  # 5% for 20+ units
        else:
            discount_pct = Decimal('0')
        
        discount_amount = unit_price * qty * discount_pct
        
        # Calculate GST
        tax_rate = Decimal(str(price.get('tax_rate', 12))) / 100
        taxable_amount = (unit_price * qty) - discount_amount
        tax_amount = taxable_amount * tax_rate
        
        line_total = taxable_amount + tax_amount
        
        return {
            'product_id': product_id,
            'qty': float(qty),
            'unit_price': float(unit_price),
            'discount_amount': float(discount_amount),
            'tax_rate': float(tax_rate * 100),
            'tax_amount': float(tax_amount),
            'line_total': float(line_total)
        }
    
    async def _process_online_line(self, shop_id: str, line: Dict) -> Dict:
        """Process online order line with MRP pricing"""
        product_id = line['product_id']
        qty = Decimal(str(line['qty']))
        
        # Get MRP
        price = await self._get_mrp(shop_id, product_id)
        unit_price = Decimal(str(price['mrp']))
        
        # Apply online discount if any
        discount_pct = Decimal(str(line.get('discount_pct', 0))) / 100
        discount_amount = unit_price * qty * discount_pct
        
        # Calculate tax
        tax_rate = Decimal(str(price.get('tax_rate', 12))) / 100
        taxable_amount = (unit_price * qty) - discount_amount
        tax_amount = taxable_amount * tax_rate
        
        line_total = taxable_amount + tax_amount
        
        return {
            'product_id': product_id,
            'qty': float(qty),
            'unit_price': float(unit_price),
            'discount_amount': float(discount_amount),
            'tax_rate': float(tax_rate * 100),
            'tax_amount': float(tax_amount),
            'line_total': float(line_total)
        }
    
    async def _check_inventory(self, shop_id: str, product_id: str, qty: float) -> bool:
        """Check if sufficient inventory available"""
        query = """
            SELECT SUM(available) as total_available
            FROM inventory_batches
            WHERE shop_id = $1 AND product_id = $2
        """
        row = await self.conn.fetchrow(query, shop_id, product_id)
        return row and row['total_available'] >= qty
    
    async def _reserve_inventory(self, shop_id: str, product_id: str, qty: float) -> Dict:
        """Reserve inventory FIFO by expiry"""
        query = """
            SELECT * FROM inventory_batches
            WHERE shop_id = $1 AND product_id = $2 AND available > 0
            ORDER BY expiry_date ASC, created_at ASC
        """
        batches = await self.conn.fetch(query, shop_id, product_id)
        
        remaining = Decimal(str(qty))
        reserved_batches = []
        
        for batch in batches:
            if remaining <= 0:
                break
            
            available = Decimal(str(batch['available']))
            to_reserve = min(available, remaining)
            
            update_query = """
                UPDATE inventory_batches
                SET reserved = reserved + $1,
                    available = available - $1
                WHERE id = $2
            """
            await self.conn.execute(update_query, float(to_reserve), batch['id'])
            
            reserved_batches.append({
                'batch_id': batch['id'],
                'batch_no': batch['batch_no'],
                'qty': float(to_reserve)
            })
            
            remaining -= to_reserve
        
        return {'success': True, 'reserved_batches': reserved_batches}
    
    async def _deduct_inventory(self, shop_id: str, product_id: str, qty: float) -> Dict:
        """Deduct inventory from reserved batches"""
        query = """
            SELECT * FROM inventory_batches
            WHERE shop_id = $1 AND product_id = $2 AND reserved > 0
            ORDER BY expiry_date ASC
        """
        batches = await self.conn.fetch(query, shop_id, product_id)
        
        remaining = Decimal(str(qty))
        
        for batch in batches:
            if remaining <= 0:
                break
            
            reserved = Decimal(str(batch['reserved']))
            to_deduct = min(reserved, remaining)
            
            update_query = """
                UPDATE inventory_batches
                SET quantity = quantity - $1,
                    reserved = reserved - $1
                WHERE id = $2
            """
            await self.conn.execute(update_query, float(to_deduct), batch['id'])
            
            remaining -= to_deduct
        
        return {'success': True}
    
    async def _save_invoice(self, invoice: Dict, lines: List[Dict], totals: Dict):
        """Save invoice and lines to database"""
        # Insert invoice header
        insert_invoice = """
            INSERT INTO sales_invoices (
                id, invoice_number, invoice_type, shop_id, customer_id,
                invoice_date, subtotal, total_tax, total_discount, grand_total,
                status, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
        """
        await self.conn.execute(
            insert_invoice,
            invoice['id'], invoice['invoice_number'], invoice['invoice_type'],
            invoice['shop_id'], invoice.get('customer_id'),
            invoice['invoice_date'], totals['subtotal'], totals['total_tax'],
            totals['total_discount'], totals['grand_total'], invoice['status']
        )
        
        # Insert lines
        for line in lines:
            insert_line = """
                INSERT INTO sales_invoice_lines (
                    id, invoice_id, product_id, qty, unit_price,
                    discount_amount, tax_rate, tax_amount, line_total
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            """
            await self.conn.execute(
                insert_line,
                str(uuid.uuid4()), invoice['id'], line['product_id'],
                line['qty'], line['unit_price'], line['discount_amount'],
                line['tax_rate'], line['tax_amount'], line['line_total']
            )
    
    async def _generate_invoice_number(self, prefix: str, shop_id: str) -> str:
        """Generate sequential invoice number"""
        query = """
            SELECT COUNT(*) as count FROM sales_invoices
            WHERE shop_id = $1 AND invoice_date::date = CURRENT_DATE
        """
        row = await self.conn.fetchrow(query, shop_id)
        seq = (row['count'] or 0) + 1
        return f"{prefix}-{datetime.now().strftime('%Y%m%d')}-{seq:04d}"
    
    async def _get_retail_price(self, shop_id: str, product_id: str) -> Dict:
        """Get retail price for product"""
        # Placeholder - implement actual price lookup
        return {'retail_price': 150.00, 'tax_rate': 12}
    
    async def _get_wholesale_price(self, shop_id: str, product_id: str, tier: str) -> Dict:
        """Get wholesale price based on tier"""
        # Placeholder - implement actual price lookup
        return {'wholesale_price': 120.00, 'tax_rate': 12}
    
    async def _get_mrp(self, shop_id: str, product_id: str) -> Dict:
        """Get MRP for product"""
        # Placeholder - implement actual price lookup
        return {'mrp': 180.00, 'tax_rate': 12}
    
    async def _get_customer(self, customer_id: str) -> Dict:
        """Get customer details"""
        query = "SELECT * FROM customers WHERE id = $1"
        row = await self.conn.fetchrow(query, customer_id)
        return dict(row) if row else {}
    
    async def _get_invoice(self, invoice_id: str) -> Dict:
        """Get invoice by ID"""
        query = "SELECT * FROM sales_invoices WHERE id = $1"
        row = await self.conn.fetchrow(query, invoice_id)
        return dict(row) if row else None
    
    async def _get_invoice_lines(self, invoice_id: str) -> List[Dict]:
        """Get invoice lines"""
        query = "SELECT * FROM sales_invoice_lines WHERE invoice_id = $1"
        rows = await self.conn.fetch(query, invoice_id)
        return [dict(row) for row in rows]
    
    async def _update_invoice_status(self, invoice_id: str, status: str):
        """Update invoice status"""
        query = "UPDATE sales_invoices SET status = $1 WHERE id = $2"
        await self.conn.execute(query, status, invoice_id)
    
    async def _calculate_due_date(self, credit_days: int) -> date:
        """Calculate due date"""
        from datetime import timedelta
        return date.today() + timedelta(days=credit_days)
    
    async def _create_receivable_entry(self, customer_id: str, invoice_id: str, amount: Decimal):
        """Create accounts receivable entry"""
        # Placeholder - implement accounting entry
        pass
    
    async def _update_order_status(self, order_id: str, status: str):
        """Update online order status"""
        query = "UPDATE online_orders SET status = $1 WHERE id = $2"
        await self.conn.execute(query, status, order_id)
    
    async def _create_sales_accounting_entries(self, invoice: Dict, lines: List[Dict]):
        """Create accounting entries for sales"""
        # Placeholder - implement accounting entries
        pass
    
    async def _publish_invoice_events(self, invoice: Dict, lines: List[Dict]):
        """Publish invoice events to Kafka"""
        event = {
            'id': str(uuid.uuid4()),
            'aggregate_type': 'sales_invoice',
            'aggregate_id': invoice['id'],
            'event_type': 'sales.invoice.confirmed.v1',
            'payload': {
                'invoice_id': invoice['id'],
                'invoice_number': invoice['invoice_number'],
                'invoice_type': invoice['invoice_type'],
                'grand_total': float(invoice['grand_total']),
                'line_count': len(lines)
            }
        }
        
        # Insert into outbox
        query = """
            INSERT INTO outbox_events (id, aggregate_type, aggregate_id, event_type, payload)
            VALUES ($1, $2, $3, $4, $5)
        """
        await self.conn.execute(
            query, event['id'], event['aggregate_type'],
            event['aggregate_id'], event['event_type'], json.dumps(event['payload'])
        )
