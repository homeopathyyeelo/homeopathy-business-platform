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
  // TODO: Save to database
  return NextResponse.json({ success: true, data: newTemplate }, { status: 201 })
}
