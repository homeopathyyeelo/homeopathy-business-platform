"""
Product Matching API Routes
Manual matching and product search
"""

from fastapi import APIRouter, HTTPException, Path, Body, Query
from typing import Optional, List
from pydantic import BaseModel
from app.db.repositories import InvoiceRepository, ProductRepository

router = APIRouter()

class MatchLineRequest(BaseModel):
    product_id: Optional[str] = None
    action: str  # 'match', 'create', 'ignore'
    batch_no: Optional[str] = None
    expiry_date: Optional[str] = None
    unit_cost: Optional[float] = None

@router.post("/{invoice_id}/lines/{line_id}/match")
async def manual_match_line(
    invoice_id: str = Path(...),
    line_id: str = Path(...),
    request: MatchLineRequest = Body(...)
):
    """
    Manually match a parsed line to a product
    
    Actions:
    - match: Link to existing product
    - create: Create new product from parsed data
    - ignore: Skip this line
    """
    
    repo = InvoiceRepository()
    
    # Verify line exists
    line = await repo.get_line_by_id(line_id)
    if not line or line['parsed_invoice_id'] != invoice_id:
        raise HTTPException(404, "Line not found")
    
    if request.action == 'match':
        if not request.product_id:
            raise HTTPException(400, "product_id required for match action")
        
        # Update line with matched product
        await repo.update_line({
            'id': line_id,
            'matched_product_id': request.product_id,
            'match_type': 'manual',
            'match_confidence': 1.0,
            'status': 'matched',
            'reconciled_by': None,  # TODO: Get from JWT
            'reconciled_at': 'NOW()'
        })
        
        # Learn vendor mapping
        await repo.create_or_update_vendor_mapping({
            'vendor_id': line['vendor_id'],
            'vendor_sku_name': line['description'],
            'product_id': request.product_id,
            'confidence': 1.0
        })
        
        return {
            "success": True,
            "message": "Line matched successfully",
            "data": {
                "line_id": line_id,
                "product_id": request.product_id,
                "match_type": "manual"
            }
        }
    
    elif request.action == 'create':
        # Create new product from parsed data
        product_repo = ProductRepository()
        new_product = await product_repo.create_product({
            'name': line['description'],
            'sku': f"AUTO-{line_id[:8]}",
            'unit_price': request.unit_cost or line.get('unit_price'),
            'tax_rate': line.get('tax_rate'),
            'hsn_code': line.get('hsn_code'),
            'status': 'active'
        })
        
        # Match to new product
        await repo.update_line({
            'id': line_id,
            'matched_product_id': new_product['id'],
            'match_type': 'manual_create',
            'match_confidence': 1.0,
            'status': 'matched'
        })
        
        return {
            "success": True,
            "message": "Product created and matched",
            "data": {
                "line_id": line_id,
                "product_id": new_product['id'],
                "product_name": new_product['name']
            }
        }
    
    elif request.action == 'ignore':
        await repo.update_line({
            'id': line_id,
            'status': 'ignored',
            'reconciled_at': 'NOW()'
        })
        
        return {
            "success": True,
            "message": "Line ignored"
        }
    
    else:
        raise HTTPException(400, f"Invalid action: {request.action}")


@router.get("/products/search")
async def search_products(
    q: str = Query(..., min_length=2, description="Search query"),
    brand: Optional[str] = Query(None),
    potency: Optional[str] = Query(None),
    limit: int = Query(20, le=100)
):
    """
    Search products for manual matching
    
    Searches by:
    - Product name
    - SKU
    - Brand + potency
    """
    
    product_repo = ProductRepository()
    results = await product_repo.search_products(
        query=q,
        brand=brand,
        potency=potency,
        limit=limit
    )
    
    return {
        "success": True,
        "data": {
            "products": results,
            "count": len(results)
        }
    }


@router.post("/{invoice_id}/auto-match")
async def auto_match_invoice(
    invoice_id: str = Path(...),
    confidence_threshold: float = Query(0.85, ge=0.0, le=1.0)
):
    """
    Auto-match all unmatched lines above confidence threshold
    """
    
    repo = InvoiceRepository()
    
    # Get all unmatched lines
    lines = await repo.get_invoice_lines(invoice_id, status='needs_review')
    
    matched_count = 0
    for line in lines:
        if line.get('match_confidence', 0) >= confidence_threshold:
            await repo.update_line({
                'id': line['id'],
                'matched_product_id': line.get('suggested_product_id'),
                'status': 'matched'
            })
            matched_count += 1
    
    return {
        "success": True,
        "message": f"Auto-matched {matched_count} lines",
        "data": {
            "matched_count": matched_count,
            "total_lines": len(lines)
        }
    }
