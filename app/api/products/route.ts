import { NextRequest, NextResponse } from 'next/server';

// Mock products data - Homeopathy medicines
const mockProducts = [
  { id: 1, name: 'Arnica Montana 30C', sku: 'ARM-30C-001', category: 'Dilution', brand: 'SBL', potency: '30C', price: 150, mrp: 180, stock_qty: 250, unit: 'bottle', is_active: true },
  { id: 2, name: 'Belladonna 200C', sku: 'BEL-200C-002', category: 'Dilution', brand: 'Dr. Reckeweg', potency: '200C', price: 125, mrp: 150, stock_qty: 180, unit: 'bottle', is_active: true },
  { id: 3, name: 'Nux Vomica 1M', sku: 'NUX-1M-003', category: 'Dilution', brand: 'Allen', potency: '1M', price: 120, mrp: 145, stock_qty: 200, unit: 'bottle', is_active: true },
  { id: 4, name: 'Pulsatilla 30C', sku: 'PUL-30C-004', category: 'Dilution', brand: 'SBL', potency: '30C', price: 145, mrp: 170, stock_qty: 150, unit: 'bottle', is_active: true },
  { id: 5, name: 'Rhus Tox 200C', sku: 'RHU-200C-005', category: 'Dilution', brand: 'Dr. Reckeweg', potency: '200C', price: 130, mrp: 155, stock_qty: 175, unit: 'bottle', is_active: true },
  { id: 6, name: 'Calendula Mother Tincture', sku: 'CAL-MT-006', category: 'Mother Tincture', brand: 'SBL', potency: 'Q', price: 200, mrp: 240, stock_qty: 120, unit: 'bottle', is_active: true }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams} = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    
    let filtered = mockProducts;
    if (category && category !== 'all') filtered = filtered.filter(p => p.category === category);
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(p => p.name.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s));
    }

    return NextResponse.json({ success: true, products: filtered, data: filtered, total: filtered.length });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const newProduct = { id: mockProducts.length + 1, sku: `PRD-${mockProducts.length + 1}`, ...body, is_active: true };
    mockProducts.push(newProduct);
    return NextResponse.json({ success: true, product: newProduct }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
