// Comprehensive Workflow API Service
// Handles all workflow operations with full ORM integration

import { PrismaClient } from '@prisma/client'
import { Kafka } from 'kafkajs'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'

const prisma = new PrismaClient()
const kafka = new Kafka({
  clientId: 'workflow-service',
  brokers: ['localhost:9092']
})

// Workflow Schemas and Validations
const workflowSchemas = {
  workflow_definition: z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    category: z.enum(['homeopathy', 'pharmacy', 'supply-chain', 'international', 'analytics', 'crm']),
    steps: z.array(z.any()),
    triggers: z.array(z.any()),
    automation_rules: z.array(z.any()).optional(),
    sla_hours: z.number().optional(),
    priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  }),

  workflow_execution: z.object({
    workflow_id: z.string().uuid(),
    triggered_by: z.string(),
    trigger_type: z.enum(['manual', 'scheduled', 'automated', 'api']).default('manual'),
    variables: z.record(z.any()).optional(),
  }),

  workflow_metric: z.object({
    workflow_id: z.string().uuid().optional(),
    execution_id: z.string().uuid().optional(),
    metric_type: z.enum(['success_rate', 'avg_processing_time', 'error_rate', 'completion_rate']),
    metric_value: z.number(),
    metric_unit: z.string().optional(),
    aggregation_period: z.enum(['hourly', 'daily', 'weekly', 'monthly']).optional(),
  }),

  inventory_level: z.object({
    location_id: z.string(),
    location_name: z.string(),
    product_id: z.string().optional(),
    product_name: z.string().optional(),
    current_stock: z.number().min(0),
    max_capacity: z.number().min(0),
    utilization_percentage: z.number().min(0).max(100),
  }),

  customer_service_metric: z.object({
    metric_type: z.enum(['avg_response_time', 'resolution_rate', 'satisfaction_score']),
    metric_value: z.number(),
    metric_unit: z.string().optional(),
    aggregation_period: z.enum(['hourly', 'daily', 'weekly', 'monthly']).optional(),
  }),

  financial_metric: z.object({
    metric_type: z.enum(['revenue', 'profit_margin', 'outstanding_payments', 'cash_flow']),
    metric_value: z.number(),
    metric_unit: z.string().optional(),
    aggregation_period: z.enum(['hourly', 'daily', 'weekly', 'monthly']).optional(),
  }),
}

// Kafka Event Publisher for Workflow Events
class WorkflowEventPublisher {
  private producer = kafka.producer()

  async connect() {
    await this.producer.connect()
  }

  async publishWorkflowEvent(eventType: string, workflowId: string, data: any) {
    const event = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      eventType,
      workflowId,
      data,
      source: 'workflow-service'
    }

    await this.producer.send({
      topic: 'workflow-events',
      messages: [{ value: JSON.stringify(event) }],
    })
  }

  async disconnect() {
    await this.producer.disconnect()
  }
}

// Workflow Metrics Calculator
class WorkflowMetricsCalculator {
  async calculateWorkflowMetrics(workflowId: string, period: string = 'daily') {
    const startDate = this.getPeriodStartDate(period)

    // Calculate success rate
    const totalExecutions = await prisma.workflowExecution.count({
      where: {
        workflow_id: workflowId,
        start_time: { gte: startDate }
      }
    })

    const successfulExecutions = await prisma.workflowExecution.count({
      where: {
        workflow_id: workflowId,
        status: 'completed',
        start_time: { gte: startDate }
      }
    })

    const successRate = totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0

    // Calculate average processing time
    const executions = await prisma.workflowExecution.findMany({
      where: {
        workflow_id: workflowId,
        status: 'completed',
        start_time: { gte: startDate }
      },
      select: {
        start_time: true,
        end_time: true
      }
    })

    const avgProcessingTime = executions.length > 0
      ? executions.reduce((acc: number, exec: any) => {
          if (exec.end_time && exec.start_time) {
            return acc + (exec.end_time.getTime() - exec.start_time.getTime()) / (1000 * 60 * 60) // hours
          }
          return acc
        }, 0) / executions.length
      : 0

    // Calculate error rate
    const errorRate = totalExecutions > 0 ? ((totalExecutions - successfulExecutions) / totalExecutions) * 100 : 0

    return {
      successRate,
      avgProcessingTime,
      errorRate,
      totalExecutions,
      successfulExecutions,
      period
    }
  }

  getPeriodStartDate(period: string): Date {
    const now = new Date()
    switch (period) {
      case 'hourly':
        return new Date(now.getTime() - 60 * 60 * 1000)
      case 'daily':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000)
      case 'weekly':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      case 'monthly':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      default:
        return new Date(now.getTime() - 24 * 60 * 60 * 1000)
    }
  }
}

// Workflow Service Class
export class WorkflowService {
  private eventPublisher = new WorkflowEventPublisher()
  private metricsCalculator = new WorkflowMetricsCalculator()

  async initialize() {
    await this.eventPublisher.connect()
  }

  async cleanup() {
    await this.eventPublisher.disconnect()
  }

  // Workflow Definition CRUD
  async createWorkflow(data: any) {
    try {
      const validation = workflowSchemas.workflow_definition.safeParse(data)
      if (!validation.success) {
        throw new Error(`Validation failed: ${validation.error.message}`)
      }

      const workflow = await prisma.workflowDefinition.create({
        data: {
          id: uuidv4(),
          ...data,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        }
      })

      await this.eventPublisher.publishWorkflowEvent('workflow_created', workflow.id, workflow)
      return workflow
    } catch (error: any) {
      console.error('Error creating workflow:', error)
      throw error
    }
  }

  async getWorkflow(id: string) {
    try {
      return await prisma.workflowDefinition.findUnique({
        where: { id },
        include: {
          executions: {
            orderBy: { created_at: 'desc' },
            take: 10
          }
        }
      })
    } catch (error: any) {
      console.error('Error getting workflow:', error)
      throw error
    }
  }

  async listWorkflows(filters?: any) {
    return await prisma.workflowDefinition.findMany({
      where: {
        is_active: true,
        ...filters
      },
      include: {
        executions: {
          orderBy: { created_at: 'desc' },
          take: 5
        }
      },
      orderBy: { created_at: 'desc' }
    })
  }

  async updateWorkflow(id: string, data: any) {
    try {
      const workflow = await prisma.workflowDefinition.update({
        where: { id },
        data: {
          ...data,
          updated_at: new Date(),
        }
      })

      await this.eventPublisher.publishWorkflowEvent('workflow_updated', id, workflow)
      return workflow
    } catch (error) {
      console.error('Error updating workflow:', error)
      throw error
    }
  }

  async deleteWorkflow(id: string) {
    try {
      const workflow = await prisma.workflowDefinition.update({
        where: { id },
        data: {
          is_active: false,
          updated_at: new Date(),
        }
      })

      await this.eventPublisher.publishWorkflowEvent('workflow_deleted', id, workflow)
      return workflow
    } catch (error: any) {
      console.error('Error deleting workflow:', error)
      throw error
    }
  }

  // Workflow Execution Management
  async startWorkflowExecution(data: any) {
    try {
      const validation = workflowSchemas.workflow_execution.safeParse(data)
      if (!validation.success) {
        throw new Error(`Validation failed: ${validation.error.message}`)
      }

      // Get workflow definition
      const workflow = await this.getWorkflow(data.workflow_id)
      if (!workflow) {
        throw new Error('Workflow not found')
      }

      const execution = await prisma.workflowExecution.create({
        data: {
          id: uuidv4(),
          ...data,
          status: 'running',
          start_time: new Date(),
          executed_steps: [],
          step_executions: [],
          created_at: new Date(),
          updated_at: new Date(),
        }
      })

      await this.eventPublisher.publishWorkflowEvent('execution_started', data.workflow_id, execution)
      return execution
    } catch (error) {
      console.error('Error starting workflow execution:', error)
      throw error
    }
  }

  async updateWorkflowExecution(id: string, data: any) {
    try {
      const execution = await prisma.workflowExecution.update({
        where: { id },
        data: {
          ...data,
          updated_at: new Date(),
        }
      })

      await this.eventPublisher.publishWorkflowEvent('execution_updated', execution.workflow_id, execution)
      return execution
    } catch (error) {
      console.error('Error updating workflow execution:', error)
      throw error
    }
  }

  async completeWorkflowExecution(id: string, result?: any) {
    try {
      const execution = await prisma.workflowExecution.update({
        where: { id },
        data: {
          status: 'completed',
          end_time: new Date(),
          updated_at: new Date(),
        }
      })

      // Calculate and store metrics
      await this.recordWorkflowMetrics(execution.workflow_id)

      await this.eventPublisher.publishWorkflowEvent('execution_completed', execution.workflow_id, execution)
      return execution
    } catch (error) {
      console.error('Error completing workflow execution:', error)
      throw error
    }
  }

  // Metrics Management
  async recordWorkflowMetrics(workflowId: string) {
    try {
      const metrics = await this.metricsCalculator.calculateWorkflowMetrics(workflowId)

      // Store each metric
      const metricRecords = [
        {
          workflow_id: workflowId,
          metric_type: 'success_rate',
          metric_value: metrics.successRate,
          metric_unit: '%',
          aggregation_period: 'daily'
        },
        {
          workflow_id: workflowId,
          metric_type: 'avg_processing_time',
          metric_value: metrics.avgProcessingTime,
          metric_unit: 'hours',
          aggregation_period: 'daily'
        },
        {
          workflow_id: workflowId,
          metric_type: 'error_rate',
          metric_value: metrics.errorRate,
          metric_unit: '%',
          aggregation_period: 'daily'
        }
      ]

      for (const metric of metricRecords) {
        await prisma.workflowMetric.create({
          data: {
            id: uuidv4(),
            ...metric,
            recorded_at: new Date(),
          }
        })
      }

      return metrics
    } catch (error) {
      console.error('Error recording workflow metrics:', error)
      throw error
    }
  }

  async getWorkflowMetrics(workflowId: string, period: string = 'daily') {
    return await this.metricsCalculator.calculateWorkflowMetrics(workflowId, period)
  }

  // Inventory Levels Management
  async updateInventoryLevel(data: any) {
    try {
      const validation = workflowSchemas.inventory_level.safeParse(data)
      if (!validation.success) {
        throw new Error(`Validation failed: ${validation.error.message}`)
      }

      const level = await prisma.inventoryLevel.upsert({
        where: {
          location_id_product_id: {
            location_id: data.location_id,
            product_id: data.product_id || 'default'
          }
        },
        update: {
          current_stock: data.current_stock,
          utilization_percentage: data.utilization_percentage,
          last_updated: new Date(),
        },
        create: {
          id: uuidv4(),
          ...data,
          last_updated: new Date(),
        }
      })

      return level
    } catch (error) {
      console.error('Error updating inventory level:', error)
      throw error
    }
  }

  async getInventoryLevels(filters?: any) {
    return await prisma.inventoryLevel.findMany({
      where: filters,
      orderBy: { last_updated: 'desc' }
    })
  }

  // Customer Service Metrics Management
  async recordCustomerServiceMetric(data: any) {
    try {
      const validation = workflowSchemas.customer_service_metric.safeParse(data)
      if (!validation.success) {
        throw new Error(`Validation failed: ${validation.error.message}`)
      }

      const metric = await prisma.customerServiceMetric.create({
        data: {
          id: uuidv4(),
          ...data,
          recorded_at: new Date(),
        }
      })

      return metric
    } catch (error) {
      console.error('Error recording customer service metric:', error)
      throw error
    }
  }

  async getCustomerServiceMetrics(period: string = 'daily') {
    const startDate = this.metricsCalculator.getPeriodStartDate(period)

    return await prisma.customerServiceMetric.findMany({
      where: {
        recorded_at: { gte: startDate }
      },
      orderBy: { recorded_at: 'desc' }
    })
  }

  // Financial Metrics Management
  async recordFinancialMetric(data: any) {
    try {
      const validation = workflowSchemas.financial_metric.safeParse(data)
      if (!validation.success) {
        throw new Error(`Validation failed: ${validation.error.message}`)
      }

      const metric = await prisma.financialMetric.create({
        data: {
          id: uuidv4(),
          ...data,
          recorded_at: new Date(),
        }
      })

      return metric
    } catch (error) {
      console.error('Error recording financial metric:', error)
      throw error
    }
  }

  async getFinancialMetrics(period: string = 'daily') {
    const startDate = this.metricsCalculator.getPeriodStartDate(period)

    return await prisma.financialMetric.findMany({
      where: {
        recorded_at: { gte: startDate }
      },
      orderBy: { recorded_at: 'desc' }
    })
  }
}

// API Routes for Workflow Service
export const workflowAPI = {
  // Workflow Definitions
  async GET_WORKFLOWS(request: Request) {
    const service = new WorkflowService()
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    const category = url.searchParams.get('category')

    try {
      if (id) {
        const workflow = await service.getWorkflow(id)
        return Response.json(workflow)
      } else {
        const workflows = await service.listWorkflows(category ? { category } : undefined)
        return Response.json(workflows)
      }
    } catch (error) {
      return Response.json({ error: error.message }, { status: 400 })
    }
  },

  async POST_WORKFLOWS(request: Request) {
    const service = new WorkflowService()

    try {
      const data = await request.json()
      const workflow = await service.createWorkflow(data)
      return Response.json(workflow, { status: 201 })
    } catch (error) {
      return Response.json({ error: error.message }, { status: 400 })
    }
  },

  async PUT_WORKFLOWS(request: Request, { params }: { params: { id: string } }) {
    const service = new WorkflowService()

    try {
      const data = await request.json()
      const workflow = await service.updateWorkflow(params.id, data)
      return Response.json(workflow)
    } catch (error) {
      return Response.json({ error: error.message }, { status: 400 })
    }
  },

  async DELETE_WORKFLOWS(request: Request, { params }: { params: { id: string } }) {
    const service = new WorkflowService()

    try {
      const workflow = await service.deleteWorkflow(params.id)
      return Response.json(workflow)
    } catch (error) {
      return Response.json({ error: error.message }, { status: 400 })
    }
  },

  // Workflow Executions
  async GET_EXECUTIONS(request: Request) {
    const service = new WorkflowService()
    const url = new URL(request.url)
    const workflowId = url.searchParams.get('workflow_id')
    const status = url.searchParams.get('status')

    try {
      const executions = await prisma.workflowExecution.findMany({
        where: {
          ...(workflowId && { workflow_id: workflowId }),
          ...(status && { status }),
        },
        orderBy: { created_at: 'desc' }
      })
      return Response.json(executions)
    } catch (error) {
      return Response.json({ error: error.message }, { status: 400 })
    }
  },

  async POST_EXECUTIONS(request: Request) {
    const service = new WorkflowService()

    try {
      const data = await request.json()
      const execution = await service.startWorkflowExecution(data)
      return Response.json(execution, { status: 201 })
    } catch (error) {
      return Response.json({ error: error.message }, { status: 400 })
    }
  },

  async PUT_EXECUTIONS(request: Request, { params }: { params: { id: string } }) {
    const service = new WorkflowService()

    try {
      const data = await request.json()
      const execution = await service.updateWorkflowExecution(params.id, data)
      return Response.json(execution)
    } catch (error) {
      return Response.json({ error: error.message }, { status: 400 })
    }
  },

  async POST_EXECUTIONS_COMPLETE(request: Request, { params }: { params: { id: string } }) {
    const service = new WorkflowService()

    try {
      const data = await request.json()
      const execution = await service.completeWorkflowExecution(params.id, data)
      return Response.json(execution)
    } catch (error) {
      return Response.json({ error: error.message }, { status: 400 })
    }
  },

  // Workflow Metrics
  async GET_METRICS(request: Request) {
    const service = new WorkflowService()
    const url = new URL(request.url)
    const workflowId = url.searchParams.get('workflow_id')
    const period = url.searchParams.get('period') || 'daily'

    try {
      if (workflowId) {
        const metrics = await service.getWorkflowMetrics(workflowId, period)
        return Response.json(metrics)
      } else {
        return Response.json({ error: 'workflow_id is required' }, { status: 400 })
      }
    } catch (error) {
      return Response.json({ error: error.message }, { status: 400 })
    }
  },

  // Inventory Levels
  async GET_INVENTORY_LEVELS(request: Request) {
    const service = new WorkflowService()
    const url = new URL(request.url)
    const locationId = url.searchParams.get('location_id')

    try {
      const levels = await service.getInventoryLevels(locationId ? { location_id: locationId } : undefined)
      return Response.json(levels)
    } catch (error) {
      return Response.json({ error: error.message }, { status: 400 })
    }
  },

  async POST_INVENTORY_LEVELS(request: Request) {
    const service = new WorkflowService()

    try {
      const data = await request.json()
      const level = await service.updateInventoryLevel(data)
      return Response.json(level, { status: 201 })
    } catch (error) {
      return Response.json({ error: error.message }, { status: 400 })
    }
  },

  // Customer Service Metrics
  async GET_CUSTOMER_SERVICE_METRICS(request: Request) {
    const service = new WorkflowService()
    const url = new URL(request.url)
    const period = url.searchParams.get('period') || 'daily'

    try {
      const metrics = await service.getCustomerServiceMetrics(period)
      return Response.json(metrics)
    } catch (error) {
      return Response.json({ error: error.message }, { status: 400 })
    }
  },

  async POST_CUSTOMER_SERVICE_METRICS(request: Request) {
    const service = new WorkflowService()

    try {
      const data = await request.json()
      const metric = await service.recordCustomerServiceMetric(data)
      return Response.json(metric, { status: 201 })
    } catch (error) {
      return Response.json({ error: error.message }, { status: 400 })
    }
  },

  // Financial Metrics
  async GET_FINANCIAL_METRICS(request: Request) {
    const service = new WorkflowService()
    const url = new URL(request.url)
    const period = url.searchParams.get('period') || 'daily'

    try {
      const metrics = await service.getFinancialMetrics(period)
      return Response.json(metrics)
    } catch (error) {
      return Response.json({ error: error.message }, { status: 400 })
    }
  },

  async POST_FINANCIAL_METRICS(request: Request) {
    const service = new WorkflowService()

    try {
      const data = await request.json()
      const metric = await service.recordFinancialMetric(data)
      return Response.json(metric, { status: 201 })
    } catch (error) {
      return Response.json({ error: error.message }, { status: 400 })
    }
  },
}

// Initialize service
const workflowService = new WorkflowService()

export default workflowService
