import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // For now, return mock data since the Go API has compilation issues
    // In production, this would proxy to the Go API
    return NextResponse.json({
      success: true,
      data: [
        {
          id: 1,
          email: 'admin@yeelo.com',
          username: 'admin',
          full_name: 'Yeelo Administrator', // API uses full_name
          name: 'Yeelo Administrator', // Also provide name for frontend compatibility
          phone: '8527672265',
          is_active: true,
          employee_code: 'EMP001',
          department: 'IT',
          designation: 'Administrator',
          role: 'ADMIN',
          salary: 50000,
          date_of_joining: '2025-01-01',
          created_at: new Date().toISOString()
        }
      ]
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch employees'
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // For now, just return success with mock data
    // In production, this would save to the database
    const newEmployee = {
      id: Date.now(),
      email: body.email || 'employee@example.com',
      username: body.employee_code || `EMP${Date.now()}`,
      full_name: body.name || 'New Employee',
      phone: body.phone || '',
      is_active: body.is_active !== false,
      employee_code: body.employee_code || `EMP${Date.now()}`,
      department: body.department || '',
      designation: body.designation || '',
      role: body.role || 'USER',
      salary: body.salary || 0,
      date_of_joining: body.date_of_joining || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      message: 'Employee created successfully',
      data: newEmployee
    });

  } catch (error: any) {
    console.error('Error creating employee:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to create employee'
    }, { status: 500 });
  }
}
