"""
Discount Engine - Calculate discounts and landed costs
"""

from typing import Dict, List, Optional
from decimal import Decimal
import asyncpg

class DiscountEngine:
    """Calculate discounts and landed costs for invoice lines"""
    
    def __init__(self, db_conn):
        self.conn = db_conn
    
    async def calculate_line_discount(self, line: Dict) -> Dict:
        """
        Calculate discount for a single line
        Priority: Line > Vendor > Brand > Category > Global
        """
        product_id = line.get('matched_product_id')
        vendor_id = line.get('vendor_id')
        qty = Decimal(str(line.get('qty', 0)))
        unit_price = Decimal(str(line.get('unit_price', 0)))
        
        # Get applicable discount rules
        rules = await self._get_applicable_rules(product_id, vendor_id, qty)
        
        total_discount = Decimal('0')
        applied_rules = []
        
        for rule in rules:
            discount = self._apply_rule(rule, qty, unit_price)
            total_discount += discount
            applied_rules.append({
                'rule_id': rule['id'],
                'rule_name': rule['name'],
                'discount_amount': float(discount)
            })
        
        return {
            'discount_amount': float(total_discount),
            'applied_rules': applied_rules,
            'discounted_price': float(unit_price - (total_discount / qty))
        }
    
    async def calculate_landed_cost(self, line: Dict, invoice_totals: Dict) -> Decimal:
        """
        Calculate landed cost including freight, insurance, duties
        """
        unit_cost = Decimal(str(line.get('unit_cost', 0)))
        qty = Decimal(str(line.get('qty', 0)))
        line_total = unit_cost * qty
        
        # Get invoice-level charges
        freight = Decimal(str(invoice_totals.get('freight_charges', 0)))
        insurance = Decimal(str(invoice_totals.get('insurance', 0)))
        other_charges = Decimal(str(invoice_totals.get('other_charges', 0)))
        invoice_total = Decimal(str(invoice_totals.get('total_amount', 0)))
        
        # Pro-rate charges based on line value
        if invoice_total > 0:
            proportion = line_total / invoice_total
            allocated_freight = freight * proportion
            allocated_insurance = insurance * proportion
            allocated_other = other_charges * proportion
            
            landed_unit_cost = unit_cost + (
                (allocated_freight + allocated_insurance + allocated_other) / qty
            )
        else:
            landed_unit_cost = unit_cost
        
        return landed_unit_cost
    
    async def calculate_tax(self, line: Dict) -> Dict:
        """Calculate GST/tax for line"""
        unit_price = Decimal(str(line.get('unit_price', 0)))
        qty = Decimal(str(line.get('qty', 0)))
        tax_rate = Decimal(str(line.get('tax_rate', 12))) / 100
        
        taxable_amount = unit_price * qty
        tax_amount = taxable_amount * tax_rate
        
        # Split SGST/CGST for intra-state, IGST for inter-state
        is_interstate = line.get('is_interstate', False)
        
        if is_interstate:
            return {
                'tax_type': 'IGST',
                'tax_rate': float(tax_rate * 100),
                'tax_amount': float(tax_amount),
                'igst': float(tax_amount),
                'sgst': 0,
                'cgst': 0
            }
        else:
            sgst = tax_amount / 2
            cgst = tax_amount / 2
            return {
                'tax_type': 'SGST+CGST',
                'tax_rate': float(tax_rate * 100),
                'tax_amount': float(tax_amount),
                'igst': 0,
                'sgst': float(sgst),
                'cgst': float(cgst)
            }
    
    async def _get_applicable_rules(self, product_id: str, vendor_id: str, qty: Decimal) -> List[Dict]:
        """Get all applicable discount rules"""
        query = """
            SELECT * FROM discount_rules
            WHERE is_active = true
            AND (start_date IS NULL OR start_date <= CURRENT_DATE)
            AND (end_date IS NULL OR end_date >= CURRENT_DATE)
            AND (
                (scope = 'vendor' AND scope_id = $1)
                OR (scope = 'product' AND scope_id = $2)
                OR (scope = 'global')
            )
            AND (threshold_qty IS NULL OR threshold_qty <= $3)
            ORDER BY priority DESC, created_at DESC
        """
        
        rows = await self.conn.fetch(query, vendor_id, product_id, float(qty))
        return [dict(row) for row in rows]
    
    def _apply_rule(self, rule: Dict, qty: Decimal, unit_price: Decimal) -> Decimal:
        """Apply a single discount rule"""
        rule_type = rule['type']
        
        if rule_type == 'percentage':
            discount_rate = Decimal(str(rule['discount_rate'])) / 100
            return (unit_price * qty) * discount_rate
        
        elif rule_type == 'fixed':
            return Decimal(str(rule['discount_amount']))
        
        elif rule_type == 'tiered':
            # Tiered discount based on quantity
            if qty >= Decimal(str(rule.get('threshold_qty', 0))):
                discount_rate = Decimal(str(rule['discount_rate'])) / 100
                return (unit_price * qty) * discount_rate
        
        return Decimal('0')
    
    async def process_invoice_discounts(self, invoice_id: str) -> Dict:
        """Process all discounts for an invoice"""
        # Get invoice lines
        lines_query = """
            SELECT * FROM parsed_invoice_lines
            WHERE parsed_invoice_id = $1
        """
        lines = await self.conn.fetch(lines_query, invoice_id)
        
        # Get invoice header
        invoice_query = """
            SELECT * FROM parsed_invoices
            WHERE id = $1
        """
        invoice = await self.conn.fetchrow(invoice_query, invoice_id)
        
        invoice_totals = {
            'total_amount': invoice['total_amount'],
            'freight_charges': 0,
            'insurance': 0,
            'other_charges': 0
        }
        
        results = []
        total_discount = Decimal('0')
        
        for line in lines:
            line_dict = dict(line)
            line_dict['vendor_id'] = invoice['vendor_id']
            
            # Calculate discount
            discount_result = await self.calculate_line_discount(line_dict)
            
            # Calculate landed cost
            line_dict['unit_cost'] = line_dict['unit_price']
            landed_cost = await self.calculate_landed_cost(line_dict, invoice_totals)
            
            # Calculate tax
            tax_result = await self.calculate_tax(line_dict)
            
            # Update line
            update_query = """
                UPDATE parsed_invoice_lines
                SET discount_amount = $1,
                    landed_unit_cost = $2,
                    tax_amount = $3,
                    match_metadata = $4,
                    updated_at = NOW()
                WHERE id = $5
            """
            
            metadata = {
                'discount_rules': discount_result['applied_rules'],
                'tax_breakdown': tax_result
            }
            
            await self.conn.execute(
                update_query,
                discount_result['discount_amount'],
                float(landed_cost),
                tax_result['tax_amount'],
                metadata,
                line['id']
            )
            
            total_discount += Decimal(str(discount_result['discount_amount']))
            
            results.append({
                'line_id': line['id'],
                'description': line['description'],
                'discount': discount_result,
                'landed_cost': float(landed_cost),
                'tax': tax_result
            })
        
        return {
            'invoice_id': invoice_id,
            'lines_processed': len(results),
            'total_discount': float(total_discount),
            'lines': results
        }
