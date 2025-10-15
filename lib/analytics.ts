/**
 * Analytics and Business Intelligence System
 * Provides comprehensive business metrics, KPIs, and insights
 *
 * Features:
 * - Sales and revenue analytics
 * - Customer behavior analysis
 * - Marketing campaign performance
 * - Inventory and product insights
 * - Geographic and demographic analysis
 * - Predictive analytics and forecasting
 * - Real-time dashboard metrics
 * - Custom report generation
 */

import { db } from "./database"

export class AnalyticsEngine {
  /**
   * Get comprehensive business dashboard metrics
   */
  async getDashboardMetrics(dateRange: { start: Date; end: Date }): Promise<any> {
    const metrics = await Promise.all([
      this.getSalesMetrics(dateRange),
      this.getCustomerMetrics(dateRange),
      this.getMarketingMetrics(dateRange),
      this.getInventoryMetrics(),
      this.getTopProducts(dateRange),
      this.getGeographicInsights(dateRange),
    ])

    return {
      sales: metrics[0],
      customers: metrics[1],
      marketing: metrics[2],
      inventory: metrics[3],
      top_products: metrics[4],
      geographic: metrics[5],
      generated_at: new Date(),
    }
  }

  /**
   * Get sales and revenue metrics
   */
  async getSalesMetrics(dateRange: { start: Date; end: Date }): Promise<any> {
    const queries = {
      overview: `
        SELECT 
          COUNT(*) as total_orders,
          SUM(total_amount) as total_revenue,
          AVG(total_amount) as avg_order_value,
          SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered_orders,
          SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders
        FROM orders 
        WHERE created_at BETWEEN ? AND ?
      `,
      daily_sales: `
        SELECT 
          DATE(created_at) as sale_date,
          COUNT(*) as orders_count,
          SUM(total_amount) as daily_revenue,
          AVG(total_amount) as avg_order_value
        FROM orders 
        WHERE created_at BETWEEN ? AND ?
        GROUP BY DATE(created_at)
        ORDER BY sale_date DESC
      `,
      monthly_comparison: `
        SELECT 
          YEAR(created_at) as year,
          MONTH(created_at) as month,
          COUNT(*) as orders_count,
          SUM(total_amount) as monthly_revenue
        FROM orders 
        WHERE created_at >= DATE_SUB(?, INTERVAL 12 MONTH)
        GROUP BY YEAR(created_at), MONTH(created_at)
        ORDER BY year DESC, month DESC
      `,
      payment_methods: `
        SELECT 
          payment_method,
          COUNT(*) as order_count,
          SUM(total_amount) as revenue,
          AVG(total_amount) as avg_value
        FROM orders 
        WHERE created_at BETWEEN ? AND ?
        GROUP BY payment_method
        ORDER BY revenue DESC
      `,
    }

    const [overview] = await db.execute(queries.overview, [dateRange.start, dateRange.end])
    const [dailySales] = await db.execute(queries.daily_sales, [dateRange.start, dateRange.end])
    const [monthlyComparison] = await db.execute(queries.monthly_comparison, [dateRange.end])
    const [paymentMethods] = await db.execute(queries.payment_methods, [dateRange.start, dateRange.end])

    // Calculate growth rates
    const currentRevenue = overview[0]?.total_revenue || 0
    const previousPeriodStart = new Date(dateRange.start)
    previousPeriodStart.setDate(
      previousPeriodStart.getDate() - (dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24),
    )

    const [previousPeriod] = await db.execute(queries.overview, [previousPeriodStart, dateRange.start])
    const previousRevenue = previousPeriod[0]?.total_revenue || 0
    const revenueGrowth = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0

    return {
      overview: overview[0],
      revenue_growth: Math.round(revenueGrowth * 100) / 100,
      daily_breakdown: dailySales,
      monthly_trends: monthlyComparison,
      payment_methods: paymentMethods,
    }
  }

  /**
   * Get customer analytics and behavior metrics
   */
  async getCustomerMetrics(dateRange: { start: Date; end: Date }): Promise<any> {
    const queries = {
      overview: `
        SELECT 
          COUNT(*) as total_customers,
          COUNT(CASE WHEN created_at BETWEEN ? AND ? THEN 1 END) as new_customers,
          AVG(total_spent) as avg_customer_value,
          COUNT(CASE WHEN last_order_date >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as active_customers
        FROM customers
      `,
      customer_segments: `
        SELECT 
          CASE 
            WHEN total_spent >= 10000 THEN 'VIP'
            WHEN total_spent >= 5000 THEN 'Premium'
            WHEN total_spent >= 1000 THEN 'Regular'
            ELSE 'New'
          END as segment,
          COUNT(*) as customer_count,
          AVG(total_spent) as avg_spent,
          SUM(total_spent) as total_revenue
        FROM customers
        GROUP BY segment
        ORDER BY avg_spent DESC
      `,
      geographic_distribution: `
        SELECT 
          ca.area_name,
          ca.pincode,
          COUNT(c.id) as customer_count,
          AVG(c.total_spent) as avg_spent,
          SUM(c.total_spent) as total_revenue
        FROM customers c
        JOIN customer_areas ca ON c.area_id = ca.id
        GROUP BY ca.id, ca.area_name, ca.pincode
        ORDER BY customer_count DESC
        LIMIT 20
      `,
      retention_analysis: `
        SELECT 
          DATEDIFF(CURDATE(), created_at) DIV 30 as months_since_signup,
          COUNT(*) as customers,
          COUNT(CASE WHEN last_order_date >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as active,
          ROUND(COUNT(CASE WHEN last_order_date >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) * 100.0 / COUNT(*), 2) as retention_rate
        FROM customers
        WHERE created_at <= DATE_SUB(NOW(), INTERVAL 1 MONTH)
        GROUP BY months_since_signup
        HAVING months_since_signup <= 12
        ORDER BY months_since_signup
      `,
    }

    const [overview] = await db.execute(queries.overview, [dateRange.start, dateRange.end])
    const [segments] = await db.execute(queries.customer_segments)
    const [geographic] = await db.execute(queries.geographic_distribution)
    const [retention] = await db.execute(queries.retention_analysis)

    return {
      overview: overview[0],
      segments: segments,
      geographic_distribution: geographic,
      retention_analysis: retention,
    }
  }

  /**
   * Get marketing campaign performance metrics
   */
  async getMarketingMetrics(dateRange: { start: Date; end: Date }): Promise<any> {
    const queries = {
      campaign_overview: `
        SELECT 
          COUNT(*) as total_campaigns,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_campaigns,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_campaigns,
          AVG(budget) as avg_budget
        FROM campaigns
        WHERE created_at BETWEEN ? AND ?
      `,
      campaign_performance: `
        SELECT 
          c.id,
          c.name,
          c.type,
          c.channel,
          c.budget,
          COUNT(cm.id) as messages_sent,
          SUM(CASE WHEN cm.status = 'delivered' THEN 1 ELSE 0 END) as delivered_count,
          SUM(CASE WHEN cm.status = 'clicked' THEN 1 ELSE 0 END) as clicked_count,
          ROUND(SUM(CASE WHEN cm.status = 'delivered' THEN 1 ELSE 0 END) * 100.0 / COUNT(cm.id), 2) as delivery_rate,
          ROUND(SUM(CASE WHEN cm.status = 'clicked' THEN 1 ELSE 0 END) * 100.0 / COUNT(cm.id), 2) as click_rate
        FROM campaigns c
        LEFT JOIN campaign_messages cm ON c.id = cm.campaign_id
        WHERE c.created_at BETWEEN ? AND ?
        GROUP BY c.id
        ORDER BY messages_sent DESC
        LIMIT 10
      `,
      channel_performance: `
        SELECT 
          c.channel,
          COUNT(DISTINCT c.id) as campaign_count,
          COUNT(cm.id) as total_messages,
          SUM(CASE WHEN cm.status = 'delivered' THEN 1 ELSE 0 END) as delivered_messages,
          SUM(CASE WHEN cm.status = 'clicked' THEN 1 ELSE 0 END) as clicked_messages,
          ROUND(AVG(CASE WHEN cm.status = 'delivered' THEN 1 ELSE 0 END) * 100, 2) as avg_delivery_rate,
          ROUND(AVG(CASE WHEN cm.status = 'clicked' THEN 1 ELSE 0 END) * 100, 2) as avg_click_rate
        FROM campaigns c
        LEFT JOIN campaign_messages cm ON c.id = cm.campaign_id
        WHERE c.created_at BETWEEN ? AND ?
        GROUP BY c.channel
        ORDER BY total_messages DESC
      `,
      automation_stats: `
        SELECT 
          event_type,
          COUNT(*) as trigger_count,
          DATE(created_at) as trigger_date
        FROM automation_events
        WHERE created_at BETWEEN ? AND ?
        GROUP BY event_type, DATE(created_at)
        ORDER BY trigger_count DESC
      `,
    }

    const [campaignOverview] = await db.execute(queries.campaign_overview, [dateRange.start, dateRange.end])
    const [campaignPerformance] = await db.execute(queries.campaign_performance, [dateRange.start, dateRange.end])
    const [channelPerformance] = await db.execute(queries.channel_performance, [dateRange.start, dateRange.end])
    const [automationStats] = await db.execute(queries.automation_stats, [dateRange.start, dateRange.end])

    return {
      overview: campaignOverview[0],
      top_campaigns: campaignPerformance,
      channel_performance: channelPerformance,
      automation_triggers: automationStats,
    }
  }

  /**
   * Get inventory and product performance metrics
   */
  async getInventoryMetrics(): Promise<any> {
    const queries = {
      overview: `
        SELECT 
          COUNT(*) as total_products,
          COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_products,
          SUM(stock_quantity) as total_stock_units,
          COUNT(CASE WHEN stock_quantity <= reorder_point THEN 1 END) as low_stock_products,
          AVG(price) as avg_product_price
        FROM products
      `,
      stock_alerts: `
        SELECT 
          id,
          name,
          category,
          stock_quantity,
          reorder_point,
          (reorder_point - stock_quantity) as shortage
        FROM products
        WHERE stock_quantity <= reorder_point
        AND is_active = 1
        ORDER BY shortage DESC
        LIMIT 20
      `,
      category_performance: `
        SELECT 
          p.category,
          COUNT(p.id) as product_count,
          SUM(p.stock_quantity) as total_stock,
          AVG(p.price) as avg_price,
          COALESCE(SUM(oi.quantity), 0) as units_sold,
          COALESCE(SUM(oi.quantity * oi.price), 0) as category_revenue
        FROM products p
        LEFT JOIN order_items oi ON p.id = oi.product_id
        LEFT JOIN orders o ON oi.order_id = o.id
        WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) OR o.created_at IS NULL
        GROUP BY p.category
        ORDER BY category_revenue DESC
      `,
      inventory_turnover: `
        SELECT 
          p.id,
          p.name,
          p.category,
          p.stock_quantity,
          COALESCE(SUM(oi.quantity), 0) as units_sold_30d,
          CASE 
            WHEN p.stock_quantity > 0 AND SUM(oi.quantity) > 0 
            THEN ROUND(SUM(oi.quantity) / p.stock_quantity, 2)
            ELSE 0 
          END as turnover_ratio
        FROM products p
        LEFT JOIN order_items oi ON p.id = oi.product_id
        LEFT JOIN orders o ON oi.order_id = o.id AND o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        WHERE p.is_active = 1
        GROUP BY p.id
        ORDER BY turnover_ratio DESC
        LIMIT 20
      `,
    }

    const [overview] = await db.execute(queries.overview)
    const [stockAlerts] = await db.execute(queries.stock_alerts)
    const [categoryPerformance] = await db.execute(queries.category_performance)
    const [inventoryTurnover] = await db.execute(queries.inventory_turnover)

    return {
      overview: overview[0],
      stock_alerts: stockAlerts,
      category_performance: categoryPerformance,
      inventory_turnover: inventoryTurnover,
    }
  }

  /**
   * Get top performing products
   */
  async getTopProducts(dateRange: { start: Date; end: Date }): Promise<any> {
    const query = `
      SELECT 
        p.id,
        p.name,
        p.category,
        p.price,
        SUM(oi.quantity) as units_sold,
        SUM(oi.quantity * oi.price) as revenue,
        COUNT(DISTINCT o.customer_id) as unique_customers,
        AVG(oi.price) as avg_selling_price
      FROM products p
      JOIN order_items oi ON p.id = oi.product_id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.created_at BETWEEN ? AND ?
      AND o.status != 'cancelled'
      GROUP BY p.id
      ORDER BY revenue DESC
      LIMIT 20
    `

    const [topProducts] = await db.execute(query, [dateRange.start, dateRange.end])
    return topProducts
  }

  /**
   * Get geographic insights and performance by location
   */
  async getGeographicInsights(dateRange: { start: Date; end: Date }): Promise<any> {
    const queries = {
      area_performance: `
        SELECT 
          ca.area_name,
          ca.pincode,
          COUNT(DISTINCT c.id) as customer_count,
          COUNT(o.id) as order_count,
          SUM(o.total_amount) as total_revenue,
          AVG(o.total_amount) as avg_order_value
        FROM customer_areas ca
        LEFT JOIN customers c ON ca.id = c.area_id
        LEFT JOIN orders o ON c.id = o.customer_id AND o.created_at BETWEEN ? AND ?
        GROUP BY ca.id
        HAVING order_count > 0
        ORDER BY total_revenue DESC
        LIMIT 15
      `,
      delivery_performance: `
        SELECT 
          ca.area_name,
          AVG(DATEDIFF(o.delivered_at, o.created_at)) as avg_delivery_days,
          COUNT(CASE WHEN o.status = 'delivered' THEN 1 END) as delivered_orders,
          COUNT(o.id) as total_orders,
          ROUND(COUNT(CASE WHEN o.status = 'delivered' THEN 1 END) * 100.0 / COUNT(o.id), 2) as delivery_success_rate
        FROM orders o
        JOIN customers c ON o.customer_id = c.id
        JOIN customer_areas ca ON c.area_id = ca.id
        WHERE o.created_at BETWEEN ? AND ?
        GROUP BY ca.id
        HAVING total_orders >= 5
        ORDER BY delivery_success_rate DESC
      `,
    }

    const [areaPerformance] = await db.execute(queries.area_performance, [dateRange.start, dateRange.end])
    const [deliveryPerformance] = await db.execute(queries.delivery_performance, [dateRange.start, dateRange.end])

    return {
      top_areas: areaPerformance,
      delivery_performance: deliveryPerformance,
    }
  }

  /**
   * Generate predictive analytics and forecasting
   */
  async getPredictiveAnalytics(): Promise<any> {
    const queries = {
      sales_forecast: `
        SELECT 
          DATE_FORMAT(created_at, '%Y-%m') as month,
          SUM(total_amount) as monthly_revenue,
          COUNT(*) as order_count
        FROM orders
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
        AND status != 'cancelled'
        GROUP BY DATE_FORMAT(created_at, '%Y-%m')
        ORDER BY month
      `,
      customer_lifetime_value: `
        SELECT 
          AVG(total_spent) as avg_clv,
          AVG(DATEDIFF(last_order_date, created_at)) as avg_customer_lifespan,
          AVG(total_orders) as avg_orders_per_customer
        FROM customers
        WHERE total_orders > 0
      `,
      churn_prediction: `
        SELECT 
          COUNT(*) as at_risk_customers,
          AVG(total_spent) as avg_spent_at_risk
        FROM customers
        WHERE last_order_date <= DATE_SUB(NOW(), INTERVAL 60 DAY)
        AND last_order_date >= DATE_SUB(NOW(), INTERVAL 365 DAY)
        AND total_orders > 1
      `,
      seasonal_trends: `
        SELECT 
          MONTH(created_at) as month,
          MONTHNAME(created_at) as month_name,
          AVG(total_amount) as avg_monthly_revenue,
          COUNT(*) as avg_monthly_orders
        FROM orders
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 MONTH)
        AND status != 'cancelled'
        GROUP BY MONTH(created_at), MONTHNAME(created_at)
        ORDER BY month
      `,
    }

    const [salesForecast] = await db.execute(queries.sales_forecast)
    const [clvData] = await db.execute(queries.customer_lifetime_value)
    const [churnData] = await db.execute(queries.churn_prediction)
    const [seasonalTrends] = await db.execute(queries.seasonal_trends)

    // Simple linear regression for next month prediction
    const recentMonths = (salesForecast as any[]).slice(-6)
    const avgGrowth =
      recentMonths.length > 1
        ? (recentMonths[recentMonths.length - 1].monthly_revenue - recentMonths[0].monthly_revenue) /
          (recentMonths.length - 1)
        : 0

    const lastMonthRevenue = recentMonths[recentMonths.length - 1]?.monthly_revenue || 0
    const predictedNextMonth = lastMonthRevenue + avgGrowth

    return {
      sales_trend: salesForecast,
      predicted_next_month_revenue: Math.max(0, Math.round(predictedNextMonth)),
      customer_lifetime_value: clvData[0],
      churn_risk: churnData[0],
      seasonal_patterns: seasonalTrends,
    }
  }

  /**
   * Generate custom report based on filters
   */
  async generateCustomReport(filters: {
    date_range: { start: Date; end: Date }
    metrics: string[]
    group_by?: string
    filters?: any
  }): Promise<any> {
    // This would be a more complex implementation allowing dynamic report generation
    // For now, return a simplified version
    const baseMetrics = await this.getDashboardMetrics(filters.date_range)

    return {
      report_generated_at: new Date(),
      filters: filters,
      data: baseMetrics,
    }
  }

  /**
   * Get real-time metrics for live dashboard
   */
  async getRealTimeMetrics(): Promise<any> {
    const queries = {
      today_sales: `
        SELECT 
          COUNT(*) as orders_today,
          COALESCE(SUM(total_amount), 0) as revenue_today,
          COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR) THEN 1 END) as orders_last_hour
        FROM orders
        WHERE DATE(created_at) = CURDATE()
      `,
      active_campaigns: `
        SELECT 
          COUNT(*) as active_campaigns,
          SUM(CASE WHEN cm.created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR) THEN 1 ELSE 0 END) as messages_sent_last_hour
        FROM campaigns c
        LEFT JOIN campaign_messages cm ON c.id = cm.campaign_id
        WHERE c.status = 'active'
      `,
      inventory_alerts: `
        SELECT COUNT(*) as low_stock_count
        FROM products
        WHERE stock_quantity <= reorder_point AND is_active = 1
      `,
      recent_customers: `
        SELECT COUNT(*) as new_customers_today
        FROM customers
        WHERE DATE(created_at) = CURDATE()
      `,
    }

    const [todaySales] = await db.execute(queries.today_sales)
    const [activeCampaigns] = await db.execute(queries.active_campaigns)
    const [inventoryAlerts] = await db.execute(queries.inventory_alerts)
    const [recentCustomers] = await db.execute(queries.recent_customers)

    return {
      timestamp: new Date(),
      today_sales: todaySales[0],
      active_campaigns: activeCampaigns[0],
      inventory_alerts: inventoryAlerts[0],
      new_customers: recentCustomers[0],
    }
  }
}

// Export singleton instance
export const analyticsEngine = new AnalyticsEngine()
