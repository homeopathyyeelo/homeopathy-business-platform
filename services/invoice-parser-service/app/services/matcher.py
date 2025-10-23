"""
Product Matcher Service - P0 Implementation
Match parsed invoice lines to product catalog
"""

from typing import Dict, List, Optional
from fuzzywuzzy import fuzz
import re

class ProductMatcher:
    """
    Match invoice line items to products
    P0: SKU, vendor map, exact, fuzzy matching
    """
    
    def __init__(self):
        self.fuzzy_threshold = 0.75
        self.auto_match_threshold = 0.85
    
    async def match_product(
        self,
        description: str,
        vendor_id: str,
        qty: float = 0,
        trace_id: str = None
    ) -> Dict:
        """
        Main matching logic - hierarchy of matchers
        
        Returns:
            {
                'product_id': str or None,
                'match_type': 'sku'|'vendor_map'|'exact'|'fuzzy'|'manual',
                'confidence': float (0-1),
                'metadata': dict,
                'suggestions': list
            }
        """
        
        # Normalize description
        normalized = self._normalize_text(description)
        
        # 1. SKU exact match
        result = await self._match_by_sku(normalized)
        if result:
            return result
        
        # 2. Vendor mapping table
        result = await self._match_by_vendor_map(vendor_id, normalized)
        if result:
            return result
        
        # 3. Exact name match
        result = await self._match_exact(normalized)
        if result:
            return result
        
        # 4. Fuzzy match
        result = await self._match_fuzzy(normalized)
        if result:
            return result
        
        # 5. No match - return suggestions
        suggestions = await self._get_suggestions(normalized)
        
        return {
            'product_id': None,
            'match_type': 'manual',
            'confidence': 0.0,
            'metadata': {'description': description},
            'suggestions': suggestions
        }
    
    def _normalize_text(self, text: str) -> str:
        """Normalize product description"""
        if not text:
            return ""
        
        # Lower case
        text = text.lower()
        
        # Remove special chars
        text = re.sub(r'[^\w\s]', ' ', text)
        
        # Normalize units
        text = text.replace('ml', ' ml')
        text = text.replace('mg', ' mg')
        text = text.replace('gm', ' gm')
        
        # Remove extra spaces
        text = ' '.join(text.split())
        
        return text
    
    async def _match_by_sku(self, description: str) -> Optional[Dict]:
        """Match by SKU or barcode in description"""
        # Extract potential SKU
        sku_match = re.search(r'[A-Z]{3}-\d{3,}', description.upper())
        if not sku_match:
            return None
        
        sku = sku_match.group(0)
        
        # Query database (mock for now)
        from app.db.repositories import ProductRepository
        repo = ProductRepository()
        product = await repo.find_by_sku(sku)
        
        if product:
            return {
                'product_id': product['id'],
                'match_type': 'sku',
                'confidence': 1.0,
                'metadata': {'sku': sku},
                'suggestions': []
            }
        
        return None
    
    async def _match_by_vendor_map(self, vendor_id: str, description: str) -> Optional[Dict]:
        """Match using vendor-specific product mappings"""
        from app.db.repositories import VendorMappingRepository
        
        repo = VendorMappingRepository()
        mapping = await repo.find_mapping(vendor_id, description)
        
        if mapping and mapping['confidence'] >= 0.8:
            # Update usage
            await repo.update_usage(mapping['id'])
            
            return {
                'product_id': mapping['product_id'],
                'match_type': 'vendor_map',
                'confidence': mapping['confidence'],
                'metadata': {'mapping_id': mapping['id']},
                'suggestions': []
            }
        
        return None
    
    async def _match_exact(self, description: str) -> Optional[Dict]:
        """Exact normalized name match"""
        from app.db.repositories import ProductRepository
        
        repo = ProductRepository()
        product = await repo.find_by_normalized_name(description)
        
        if product:
            return {
                'product_id': product['id'],
                'match_type': 'exact',
                'confidence': 0.95,
                'metadata': {},
                'suggestions': []
            }
        
        return None
    
    async def _match_fuzzy(self, description: str) -> Optional[Dict]:
        """Fuzzy match using similarity"""
        from app.db.repositories import ProductRepository
        
        repo = ProductRepository()
        
        # Get all products (in production, use pg_trgm or vector search)
        products = await repo.get_all_active()
        
        best_match = None
        best_score = 0.0
        
        for product in products:
            # Normalize product name
            product_name = self._normalize_text(product['name'])
            
            # Calculate similarity
            score = fuzz.token_sort_ratio(description, product_name) / 100.0
            
            # Check brand/potency if present
            if product.get('brand'):
                brand_in_desc = product['brand'].lower() in description
                if brand_in_desc:
                    score += 0.1
            
            if score > best_score:
                best_score = score
                best_match = product
        
        if best_match and best_score >= self.fuzzy_threshold:
            return {
                'product_id': best_match['id'],
                'match_type': 'fuzzy',
                'confidence': best_score,
                'metadata': {
                    'similarity_score': best_score,
                    'matched_name': best_match['name']
                },
                'suggestions': []
            }
        
        return None
    
    async def _get_suggestions(self, description: str) -> List[Dict]:
        """Get product suggestions for manual matching"""
        from app.db.repositories import ProductRepository
        
        repo = ProductRepository()
        
        # Extract keywords
        keywords = description.split()[:5]  # First 5 words
        
        # Search products
        suggestions = await repo.search_products(' '.join(keywords), limit=5)
        
        return [
            {
                'product_id': p['id'],
                'name': p['name'],
                'brand': p.get('brand'),
                'potency': p.get('potency'),
                'similarity': 0.5
            }
            for p in suggestions
        ]
