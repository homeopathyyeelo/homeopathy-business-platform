import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    // Check authentication - get user from auth token cookie
    const authToken = req.cookies.get('auth-token')?.value;
    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized - No auth token' }, { status: 401 });
    }

    // For now, we'll use a simple approach - in production, validate the token
    // Extract user ID from token (this is a simplified approach)
    let userId = null;
    try {
      // Simple JWT decode (in production, use proper verification)
      const payload = JSON.parse(atob(authToken.split('.')[1]));
      userId = payload.user_id || payload.id || null;
    } catch (error) {
      console.error('Token decode error:', error);
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    // Convert user.id to UUID or null (handle "0" or invalid UUIDs)
    userId = userId && userId !== '0' ? userId : null;

    const sessionId = params.sessionId;

    // Verify session exists
    const sessionResult = await query(
      `SELECT id FROM upload_sessions WHERE id = $1`,
      [sessionId]
    );

    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Get upload items with match status
    const itemsResult = await query(
      `SELECT 
         ui.*,
         CASE WHEN ui.matched_product_id IS NOT NULL THEN true ELSE false END as is_matched
       FROM upload_items ui 
       WHERE ui.session_id = $1 
       ORDER BY ui.row_number ASC`,
      [sessionId]
    );

    const items = itemsResult.rows;

    return NextResponse.json({
      success: true,
      items,
      summary: {
        total: items.length,
        matched: items.filter(item => item.matched_product_id).length,
        unmatched: items.filter(item => !item.matched_product_id).length,
      }
    });

  } catch (error: any) {
    console.error('Fetch session items error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch session items' },
      { status: 500 }
    );
  }
}
