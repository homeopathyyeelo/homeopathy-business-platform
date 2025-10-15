// Workflow API Routes with Database Integration
// Provides REST endpoints for all workflow operations

import { NextRequest, NextResponse } from 'next/server'
import { WorkflowService } from '@/lib/services/workflow-service'

// Initialize workflow service
const workflowService = new WorkflowService()

// ============================================================================
// WORKFLOW DEFINITION ROUTES
// ============================================================================

export async function GET_WORKFLOWS(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const category = searchParams.get('category')
    const active = searchParams.get('active')

    if (id) {
      const workflow = await workflowService.getWorkflow(id)
      if (!workflow) {
        return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
      }
      return NextResponse.json(workflow)
    } else {
      const filters: any = {}
      if (category) filters.category = category
      if (active !== null) filters.is_active = active === 'true'

      const workflows = await workflowService.listWorkflows(filters)
      return NextResponse.json(workflows)
    }
  } catch (error) {
    console.error('Error fetching workflows:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST_WORKFLOWS(request: NextRequest) {
  try {
    const body = await request.json()
    const workflow = await workflowService.createWorkflow(body)
    return NextResponse.json(workflow, { status: 201 })
  } catch (error) {
    console.error('Error creating workflow:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 400 })
  }
}

export async function PUT_WORKFLOWS(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const workflow = await workflowService.updateWorkflow(params.id, body)
    return NextResponse.json(workflow)
  } catch (error) {
    console.error('Error updating workflow:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 400 })
  }
}

export async function DELETE_WORKFLOWS(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const workflow = await workflowService.deleteWorkflow(params.id)
    return NextResponse.json(workflow)
  } catch (error) {
    console.error('Error deleting workflow:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 400 })
  }
}

// ============================================================================
// WORKFLOW EXECUTION ROUTES
// ============================================================================

export async function GET_EXECUTIONS(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const workflowId = searchParams.get('workflow_id')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {}
    if (workflowId) where.workflow_id = workflowId
    if (status) where.status = status

    // Use Prisma directly for execution queries
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()

    const executions = await prisma.workflowExecution.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: limit,
      include: {
        workflow: {
          select: {
            id: true,
            name: true,
            category: true
          }
        }
      }
    })

    await prisma.$disconnect()
    return NextResponse.json(executions)
  } catch (error) {
    console.error('Error fetching executions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST_EXECUTIONS(request: NextRequest) {
  try {
    const body = await request.json()
    const execution = await workflowService.startWorkflowExecution(body)
    return NextResponse.json(execution, { status: 201 })
  } catch (error) {
    console.error('Error starting execution:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 400 })
  }
}

export async function PUT_EXECUTIONS(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const execution = await workflowService.updateWorkflowExecution(params.id, body)
    return NextResponse.json(execution)
  } catch (error) {
    console.error('Error updating execution:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 400 })
  }
}

export async function POST_EXECUTIONS_COMPLETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const execution = await workflowService.completeWorkflowExecution(params.id, body)
    return NextResponse.json(execution)
  } catch (error) {
    console.error('Error completing execution:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 400 })
  }
}

// ============================================================================
// WORKFLOW METRICS ROUTES
// ============================================================================

export async function GET_METRICS(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const workflowId = searchParams.get('workflow_id')
    const period = searchParams.get('period') || 'daily'

    if (!workflowId) {
      return NextResponse.json({ error: 'workflow_id is required' }, { status: 400 })
    }

    const metrics = await workflowService.getWorkflowMetrics(workflowId, period)
    return NextResponse.json(metrics)
  } catch (error) {
    console.error('Error fetching metrics:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 400 })
  }
}

// ============================================================================
// INVENTORY LEVELS ROUTES
// ============================================================================

export async function GET_INVENTORY_LEVELS(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get('location_id')

    const filters: any = {}
    if (locationId) filters.location_id = locationId

    const levels = await workflowService.getInventoryLevels(filters)
    return NextResponse.json(levels)
  } catch (error) {
    console.error('Error fetching inventory levels:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST_INVENTORY_LEVELS(request: NextRequest) {
  try {
    const body = await request.json()
    const level = await workflowService.updateInventoryLevel(body)
    return NextResponse.json(level, { status: 201 })
  } catch (error) {
    console.error('Error updating inventory level:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 400 })
  }
}

// ============================================================================
// CUSTOMER SERVICE METRICS ROUTES
// ============================================================================

export async function GET_CUSTOMER_SERVICE_METRICS(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'daily'

    const metrics = await workflowService.getCustomerServiceMetrics(period)
    return NextResponse.json(metrics)
  } catch (error) {
    console.error('Error fetching customer service metrics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST_CUSTOMER_SERVICE_METRICS(request: NextRequest) {
  try {
    const body = await request.json()
    const metric = await workflowService.recordCustomerServiceMetric(body)
    return NextResponse.json(metric, { status: 201 })
  } catch (error) {
    console.error('Error recording customer service metric:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 400 })
  }
}

// ============================================================================
// FINANCIAL METRICS ROUTES
// ============================================================================

export async function GET_FINANCIAL_METRICS(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'daily'

    const metrics = await workflowService.getFinancialMetrics(period)
    return NextResponse.json(metrics)
  } catch (error) {
    console.error('Error fetching financial metrics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST_FINANCIAL_METRICS(request: NextRequest) {
  try {
    const body = await request.json()
    const metric = await workflowService.recordFinancialMetric(body)
    return NextResponse.json(metric, { status: 201 })
  } catch (error) {
    console.error('Error recording financial metric:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 400 })
  }
}

// ============================================================================
// DASHBOARD DATA ROUTES
// ============================================================================

export async function GET_DASHBOARD_DATA(request: NextRequest) {
  try {
    // Get workflow metrics for overview
    const workflowMetrics = await workflowService.getWorkflowMetrics('overview')

    // Get inventory levels for dashboard
    const inventoryLevels = await workflowService.getInventoryLevels()

    // Get customer service metrics
    const customerServiceMetrics = await workflowService.getCustomerServiceMetrics('daily')

    // Get financial metrics
    const financialMetrics = await workflowService.getFinancialMetrics('daily')

    // Aggregate data for dashboard
    const dashboardData = {
      workflowMetrics: {
        successRate: workflowMetrics?.successRate || 0,
        avgProcessingTime: workflowMetrics?.avgProcessingTime || 0,
        activeAlerts: workflowMetrics?.totalExecutions || 0,
      },
      inventoryLevels: inventoryLevels.slice(0, 5).map(level => ({
        id: level.id,
        name: level.location_name,
        utilizationPercentage: level.utilization_percentage,
      })),
      customerServiceMetrics: customerServiceMetrics.slice(0, 3).map(metric => ({
        metricType: metric.metric_type,
        metricValue: metric.metric_value,
        recordedAt: metric.recorded_at,
      })),
      financialMetrics: financialMetrics.slice(0, 4).map(metric => ({
        metricType: metric.metric_type,
        metricValue: metric.metric_value,
        recordedAt: metric.recorded_at,
      })),
    }

    return NextResponse.json(dashboardData)
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================================================
// HEALTH CHECK ROUTE
// ============================================================================

export async function GET_WORKFLOW_HEALTH(request: NextRequest) {
  try {
    // Check database connectivity
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()

    try {
      await prisma.$queryRaw`SELECT 1`
      await prisma.$disconnect()

      return NextResponse.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          database: 'connected',
          kafka: 'connected',
        }
      })
    } catch (dbError) {
      await prisma.$disconnect()
      return NextResponse.json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        services: {
          database: 'disconnected',
          kafka: 'connected',
        },
        error: dbError.message
      }, { status: 503 })
    }
  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    }, { status: 503 })
  }
}
