import { NextResponse } from 'next/server'

interface RouteParams {
  params: { id: string }
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = params;

    // For now, return mock data based on ID
    // In production, this would fetch from database
    const mockEmployee = {
      id: parseInt(id),
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
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: mockEmployee
    });

  } catch (error: any) {
    console.error('Error fetching employee:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch employee'
    }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = params;
    const body = await request.json();

    // Handle both name and full_name fields from frontend
    const employeeName = body.name || body.full_name || 'Updated Employee';

    // For now, just return success with updated data
    // In production, this would update the database
    const updatedEmployee = {
      id: parseInt(id),
      email: body.email || 'admin@yeelo.com',
      username: body.username || 'admin',
      full_name: employeeName, // API response uses full_name
      name: employeeName, // Also provide name for frontend compatibility
      phone: body.phone || '8527672265',
      is_active: body.is_active !== false,
      employee_code: body.employee_code || 'EMP001',
      department: body.department || 'IT',
      designation: body.designation || 'Administrator',
      role: body.role || 'ADMIN',
      salary: body.salary || 50000,
      date_of_joining: body.date_of_joining || '2025-01-01',
      created_at: body.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      message: 'Employee updated successfully',
      data: updatedEmployee
    });

  } catch (error: any) {
    console.error('Error updating employee:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to update employee'
    }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = params;

    // For now, just return success
    // In production, this would soft delete from database
    return NextResponse.json({
      success: true,
      message: 'Employee deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting employee:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to delete employee'
    }, { status: 500 });
  }
}
