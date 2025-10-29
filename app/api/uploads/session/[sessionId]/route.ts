import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionId = params.sessionId;

    // Get session
    const sessionResult = await query(
      `SELECT * FROM upload_sessions WHERE id = $1`,
      [sessionId]
    );

    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const session = sessionResult.rows[0];

    // Get purchase upload details
    const purchaseResult = await query(
      `SELECT * FROM purchase_uploads WHERE session_id = $1 LIMIT 1`,
      [sessionId]
    );

    const purchase = purchaseResult.rows[0] || null;

    // Get upload items
    const itemsResult = await query(
      `SELECT * FROM upload_items 
       WHERE session_id = $1 
       ORDER BY row_number ASC`,
      [sessionId]
    );

    const items = itemsResult.rows;

    return NextResponse.json({
      session,
      purchase,
      items,
    });

  } catch (error: any) {
    console.error('Fetch session error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch session details' },
      { status: 500 }
    );
  }
}
