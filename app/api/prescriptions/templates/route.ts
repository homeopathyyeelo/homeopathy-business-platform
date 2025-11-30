import { NextResponse } from 'next/server'

const templates = [
  {
    id: 't1',
    name: 'Acute Fever',
    diagnosis: 'Acute Fever with body ache',
    medicines: [
      { productId: '', productName: 'Belladonna', potency: '30C', dosage: '4 drops', frequency: 'TDS', duration: '3 days', instructions: 'Before meals' },
      { productId: '', productName: 'Ferrum Phos', potency: '6X', dosage: '4 tablets', frequency: 'QID', duration: '5 days', instructions: 'After meals' },
    ]
  },
  {
    id: 't2',
    name: 'Cold & Cough',
    diagnosis: 'Upper Respiratory Tract Infection',
    medicines: [
      { productId: '', productName: 'Pulsatilla', potency: '30C', dosage: '4 drops', frequency: 'TDS', duration: '7 days', instructions: 'Before meals' },
      { productId: '', productName: 'Bryonia', potency: '30C', dosage: '4 drops', frequency: 'BD', duration: '5 days', instructions: 'Before meals' },
    ]
  },
  {
    id: 't3',
    name: 'Digestive Issues',
    diagnosis: 'Indigestion and Acidity',
    medicines: [
      { productId: '', productName: 'Nux Vomica', potency: '30C', dosage: '4 drops', frequency: 'TDS', duration: '7 days', instructions: 'Before meals' },
      { productId: '', productName: 'Carbo Veg', potency: '30C', dosage: '4 drops', frequency: 'BD', duration: '5 days', instructions: 'After meals' },
    ]
  },
]

export async function GET() {
  return NextResponse.json({ success: true, data: templates })
}

export async function POST(req: Request) {
  const body = await req.json()
  const newTemplate = { ...body, id: `t${Date.now()}` }
  try {
    // Save to Golang API
    const GOLANG_API_URL = process.env.NEXT_PUBLIC_GOLANG_API_URL || 'http://localhost:3005';
    const res = await fetch(`${GOLANG_API_URL}/api/erp/prescriptions/templates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({ success: true, data: data.data });
    }
  } catch (error) {
    console.error('Template save error:', error);
  }
  return NextResponse.json({ success: true, data: newTemplate }, { status: 201 })
}
