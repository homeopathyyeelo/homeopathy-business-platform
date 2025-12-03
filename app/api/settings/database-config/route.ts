import { NextRequest, NextResponse } from 'next/server';
import { golangAPI } from '@/lib/api';

// GET /api/settings/database-config - Get database configuration
export async function GET(request: NextRequest) {
  try {
    const response = await golangAPI.get('/api/erp/settings/category/database');
    
    if (response.data?.success) {
      const settings = response.data.data || [];
      
      // Parse settings into config object
      const config: any = {
        type: 'postgresql',
        host: 'localhost',
        port: 5432,
        database: 'yeelo_homeopathy',
        user: 'postgres',
        password: '',
        ssl: false
      };
      
      settings.forEach((setting: any) => {
        const key = setting.key.replace('database.', '');
        if (setting.value) {
          try {
            config[key] = JSON.parse(setting.value);
          } catch {
            config[key] = setting.value;
          }
        }
      });
      
      return NextResponse.json(config);
    }
    
    return NextResponse.json({ error: 'Failed to fetch database config' }, { status: 500 });
  } catch (error: any) {
    console.error('Error fetching database config:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/settings/database-config - Save database configuration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Prepare settings for bulk update
    const settings = [
      {
        key: 'database.host',
        value: body.host || 'localhost',
        category: 'database',
        type: 'string',
        description: 'PostgreSQL host'
      },
      {
        key: 'database.port',
        value: body.port || 5432,
        category: 'database',
        type: 'number',
        description: 'PostgreSQL port'
      },
      {
        key: 'database.name',
        value: body.database || 'yeelo_homeopathy',
        category: 'database',
        type: 'string',
        description: 'Database name'
      },
      {
        key: 'database.user',
        value: body.user || 'postgres',
        category: 'database',
        type: 'string',
        description: 'Database user'
      },
      {
        key: 'database.password',
        value: body.password || '',
        category: 'database',
        type: 'string',
        description: 'Database password',
        is_secret: true
      }
    ];
    
    const response = await golangAPI.post('/api/erp/settings/bulk', { settings });
    
    if (response.data?.success) {
      return NextResponse.json({ success: true, message: 'Database configuration saved' });
    }
    
    return NextResponse.json(
      { error: response.data?.error || 'Failed to save configuration' },
      { status: 500 }
    );
  } catch (error: any) {
    console.error('Error saving database config:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - same as POST for backward compatibility
export async function PUT(request: NextRequest) {
  return POST(request);
}
