import { NextResponse } from 'next/server'

export async function GET() {
  // TODO: Fetch from system_audit_logs table
  const events = [
    { 
      id: '1', 
      event: 'Invoice INV-1021 generated', 
      module: 'Sales', 
      timestamp: new Date(Date.now() - 2 * 60000).toISOString(), 
      details: 'Customer: Rajesh Kumar, Amount: ₹1,250' 
    },
    { 
      id: '2', 
      event: 'Purchase uploaded (Allen Labs)', 
      module: 'Purchase', 
      timestamp: new Date(Date.now() - 5 * 60000).toISOString(), 
      details: '25 items, Total: ₹45,000' 
    },
    { 
      id: '3', 
      event: 'Stock updated (Globules Batch G-021)', 
      module: 'Inventory', 
      timestamp: new Date(Date.now() - 10 * 60000).toISOString(), 
      details: 'Added 500 units, Expiry: 2025-12-31' 
    },
    { 
      id: '4', 
      event: 'Customer payment received ₹3,500', 
      module: 'Finance', 
      timestamp: new Date(Date.now() - 15 * 60000).toISOString(), 
      details: 'Customer: Amit Patel, Mode: UPI' 
    },
    { 
      id: '5', 
      event: 'Low stock alert triggered', 
      module: 'Inventory', 
      timestamp: new Date(Date.now() - 20 * 60000).toISOString(), 
      details: '3 products below reorder level' 
    },
    { 
      id: '6', 
      event: 'New customer registered', 
      module: 'CRM', 
      timestamp: new Date(Date.now() - 25 * 60000).toISOString(), 
      details: 'Priya Sharma, Phone: 9876543210' 
    },
    { 
      id: '7', 
      event: 'Prescription created RX-045', 
      module: 'Prescriptions', 
      timestamp: new Date(Date.now() - 30 * 60000).toISOString(), 
      details: 'Patient: Anita Rao, Medicines: 3' 
    },
    { 
      id: '8', 
      event: 'Vendor payment processed', 
      module: 'Finance', 
      timestamp: new Date(Date.now() - 35 * 60000).toISOString(), 
      details: 'SBL Pharmaceuticals, Amount: ₹25,000' 
    },
  ]

  return NextResponse.json(events)
}
