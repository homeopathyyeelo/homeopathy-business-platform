"""
Pricing Engine - Multi-tier pricing for different customer types
"""

from typing import Dict, Optional
from decimal import Decimal
import asyncpg

class PricingEngine:
    """
    Handle pricing for different customer segments:
    - Retail (B2C) - MRP/Retail Price
    - Wholesale (B2B) - Tiered pricing
    - Online - Special online pricing
    - Doctor - Professional discount
    """
    
    def __init__(self, db_conn):
        self.conn = db_conn
    
    async def get_price(self, product_id: str, customer_type: str, qty: float = 1) -> Dict:
        """
        Get price based on customer type and quantity
        """
        if customer_type == 'retail':
            return await self.get_retail_price(product_id)
        elif customer_type == 'wholesale':
            return await self.get_wholesale_price(product_id, qty)
        elif customer_type == 'online':
            return await self.get_online_price(product_id)
        elif customer_type == 'doctor':
            return await self.get_doctor_price(product_id)
        else:
            return await self.get_retail_price(product_id)
    
    async def get_retail_price(self, product_id: str) -> Dict:
        """Get retail/MRP price"""
        query = """
            SELECT 
                p.id,
                p.name,
                p.mrp,
                p.retail_price,
                p.tax_rate,
                p.hsn_code
            FROM products p
            WHERE p.id = $1
        """
        row = await self.conn.fetchrow(query, product_id)
        
        if not row:
            return None
        
        return {
            'product_id': row['id'],
            'product_name': row['name'],
            'price': float(row['retail_price'] or row['mrp']),
            'mrp': float(row['mrp']),
            'tax_rate': float(row['tax_rate']),
            'hsn_code': row['hsn_code'],
            'price_type': 'retail'
        }
    
    async def get_wholesale_price(self, product_id: str, qty: float) -> Dict:
        """Get wholesale price with quantity-based tiers"""
        query = """
            SELECT 
                p.id,
                p.name,
                p.mrp,
                p.wholesale_price,
                p.tax_rate,
                p.hsn_code
            FROM products p
            WHERE p.id = $1
        """
        row = await self.conn.fetchrow(query, product_id)
        
        if not row:
            return None
        
        base_price = Decimal(str(row['wholesale_price'] or row['mrp']))
        
        # Quantity-based discount tiers
        if qty >= 100:
            discount = Decimal('0.10')  # 10% off
        elif qty >= 50:
            discount = Decimal('0.07')  # 7% off
        elif qty >= 20:
            discount = Decimal('0.05')  # 5% off
        else:
            discount = Decimal('0')
        
        final_price = base_price * (1 - discount)
        
        return {
            'product_id': row['id'],
            'product_name': row['name'],
            'price': float(final_price),
            'base_price': float(base_price),
            'discount_pct': float(discount * 100),
            'mrp': float(row['mrp']),
            'tax_rate': float(row['tax_rate']),
            'hsn_code': row['hsn_code'],
            'price_type': 'wholesale'
        }
    
    async def get_online_price(self, product_id: str) -> Dict:
        """Get online price (may include online-specific discounts)"""
        query = """
            SELECT 
                p.id,
                p.name,
                p.mrp,
                p.online_price,
                p.tax_rate,
                p.hsn_code
            FROM products p
            WHERE p.id = $1
        """
        row = await self.conn.fetchrow(query, product_id)
        
        if not row:
            return None
        
        return {
            'product_id': row['id'],
            'product_name': row['name'],
            'price': float(row['online_price'] or row['mrp']),
            'mrp': float(row['mrp']),
            'tax_rate': float(row['tax_rate']),
            'hsn_code': row['hsn_code'],
            'price_type': 'online'
        }
    
    async def get_doctor_price(self, product_id: str) -> Dict:
        """Get doctor/professional price"""
        query = """
            SELECT 
                p.id,
                p.name,
                p.mrp,
                p.wholesale_price,
                p.tax_rate,
                p.hsn_code
            FROM products p
            WHERE p.id = $1
        """
        row = await self.conn.fetchrow(query, product_id)
        
        if not row:
            return None
        
        # Doctors get 15% off wholesale price
        base_price = Decimal(str(row['wholesale_price'] or row['mrp']))
        doctor_price = base_price * Decimal('0.85')
        
        return {
            'product_id': row['id'],
            'product_name': row['name'],
            'price': float(doctor_price),
            'base_price': float(base_price),
            'discount_pct': 15.0,
            'mrp': float(row['mrp']),
            'tax_rate': float(row['tax_rate']),
            'hsn_code': row['hsn_code'],
            'price_type': 'doctor'
        }
    
    async def calculate_line_total(self, product_id: str, qty: float, customer_type: str, 
                                   additional_discount: float = 0) -> Dict:
        """
        Calculate complete line total with tax
        """
        price_info = await self.get_price(product_id, customer_type, qty)
        
        if not price_info:
            return None
        
        qty_decimal = Decimal(str(qty))
        unit_price = Decimal(str(price_info['price']))
        
        # Apply additional discount if any
        additional_discount_amount = Decimal('0')
        if additional_discount > 0:
            additional_discount_amount = unit_price * qty_decimal * (Decimal(str(additional_discount)) / 100)
        
        # Calculate taxable amount
        taxable_amount = (unit_price * qty_decimal) - additional_discount_amount
        
        # Calculate tax
        tax_rate = Decimal(str(price_info['tax_rate'])) / 100
        tax_amount = taxable_amount * tax_rate
        
        # Line total
        line_total = taxable_amount + tax_amount
        
        return {
            'product_id': product_id,
            'product_name': price_info['product_name'],
            'qty': float(qty),
            'unit_price': float(unit_price),
            'mrp': price_info['mrp'],
            'discount_amount': float(additional_discount_amount),
            'taxable_amount': float(taxable_amount),
            'tax_rate': price_info['tax_rate'],
            'tax_amount': float(tax_amount),
            'line_total': float(line_total),
            'hsn_code': price_info['hsn_code']
        }
    
    async def get_customer_pricing_tier(self, customer_id: str) -> str:
        """Get customer's pricing tier"""
        query = """
            SELECT pricing_tier FROM customers WHERE id = $1
        """
        row = await self.conn.fetchrow(query, customer_id)
        return row['pricing_tier'] if row else 'standard'
    
    async def apply_loyalty_discount(self, customer_id: str, amount: Decimal) -> Decimal:
        """Apply loyalty points discount"""
        query = """
            SELECT loyalty_points FROM customers WHERE id = $1
        """
        row = await self.conn.fetchrow(query, customer_id)
        
        if not row or not row['loyalty_points']:
            return Decimal('0')
        
        # 1 point = ₹1 discount
        points = Decimal(str(row['loyalty_points']))
        max_discount = amount * Decimal('0.10')  # Max 10% discount
        
        discount = min(points, max_discount)
        
        return discount
