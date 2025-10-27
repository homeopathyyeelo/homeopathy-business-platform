import { NextResponse } from 'next/server'

export async function GET() {
  // TODO: Fetch from system_bug_reports table
  const bugs = [
    { 
      id: 'BUG-001', 
      title: 'Validation error in purchase upload API', 
      severity: 'MEDIUM' as const, 
      status: 'AI_SUGGESTED' as const,
      aiSuggestion: 'Add null check for vendor_id field before validation'
    },
    { 
      id: 'BUG-002', 
      title: 'Memory leak in inventory batch processing', 
      severity: 'CRITICAL' as const, 
      status: 'OPEN' as const,
      aiSuggestion: 'Implement connection pooling and close DB connections after each batch'
    },
    { 
      id: 'BUG-003', 
      title: 'Slow query on sales report generation', 
      severity: 'LOW' as const, 
      status: 'AI_SUGGESTED' as const,
      aiSuggestion: 'Add composite index on (date, customer_id, status)'
    },
  ]

  return NextResponse.json(bugs)
}
