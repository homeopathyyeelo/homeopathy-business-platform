import { NextResponse } from 'next/server'

export async function GET() {
  // TODO: Ping actual services
  const services = [
    { name: 'api-golang-v2', port: 3005, status: 'OK' as const, responseTime: 54, version: 'v2.1.3' },
    { name: 'purchase-service', port: 8006, status: 'OK' as const, responseTime: 45, version: 'v1.9' },
    { name: 'ai-service', port: 8005, status: 'OK' as const, responseTime: 67, version: 'v1.5' },
    { name: 'api-gateway', port: 4000, status: 'SLOW' as const, responseTime: 320, version: 'v2.0' },
    { name: 'invoice-parser', port: 8007, status: 'OK' as const, responseTime: 89, version: 'v1.2' },
  ]

  return NextResponse.json(services)
}
