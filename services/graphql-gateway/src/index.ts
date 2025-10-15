import express from "express"
import cors from "cors"
import bodyParser from "body-parser"
import { ApolloServer } from "@apollo/server"
import { expressMiddleware } from "@apollo/server/express4"
import { gql } from "graphql-tag"
import fetch from "node-fetch"

const typeDefs = gql`
  type Query {
    health: Health!
    orders(shopId: String, customerId: String, page: Int, limit: Int): OrdersPage!
    order(id: String!): Order
    products(shopId: String, page: Int, limit: Int): ProductsPage!
    product(id: String!): Product
    customers(shopId: String, page: Int, limit: Int): CustomersPage!
    customer(id: String!): Customer
    inventorySummary(shopId: String!): [InventoryItem!]!
    analytics(shopId: String): Analytics!
    campaigns(shopId: String): [Campaign!]!
  }

  type Mutation {
    createOrder(input: CreateOrderInput!): Order!
    updateOrderStatus(id: String!, status: String!): Order!
    createProduct(input: CreateProductInput!): Product!
    updateProduct(id: String!, input: UpdateProductInput!): Product!
    createCustomer(input: CreateCustomerInput!): Customer!
    updateCustomer(id: String!, input: UpdateCustomerInput!): Customer!
  }

  type Health {
    status: String!
    timestamp: String!
    service: String!
  }

  type OrdersPage {
    orders: [Order!]!
    pagination: Pagination!
  }

  type ProductsPage {
    products: [Product!]!
    pagination: Pagination!
  }

  type CustomersPage {
    customers: [Customer!]!
    pagination: Pagination!
  }

  type Pagination {
    page: Int!
    limit: Int!
    total: Int!
    pages: Int!
  }

  type OrderItem {
    productId: String!
    quantity: Int!
    price: Float!
    product: Product
  }

  type Order {
    id: String!
    customerId: String!
    shopId: String!
    totalAmount: Float!
    status: String!
    paymentStatus: String
    items: [OrderItem!]!
    customer: Customer
    createdAt: String!
  }

  type Product {
    id: String!
    name: String!
    price: Float!
    stock: Int!
    category: String!
    description: String
    isActive: Boolean!
    shopId: String!
    createdAt: String!
  }

  type Customer {
    id: String!
    name: String!
    email: String!
    phone: String!
    address: String
    loyaltyPoints: Int!
    marketingConsent: Boolean!
    createdAt: String!
  }

  type InventoryItem {
    productId: String!
    name: String!
    totalStock: Int!
    reorderLevel: Int!
  }

  type Analytics {
    totalRevenue: Float!
    totalOrders: Int!
    totalCustomers: Int!
    averageOrderValue: Float!
  }

  type Campaign {
    id: String!
    name: String!
    channel: String!
    status: String!
    targetCount: Int!
    sentCount: Int!
    createdAt: String!
  }

  input CreateOrderInput {
    customerId: String!
    shopId: String!
    items: [OrderItemInput!]!
    totalAmount: Float!
    paymentMethod: String
  }

  input OrderItemInput {
    productId: String!
    quantity: Int!
    price: Float!
  }

  input CreateProductInput {
    name: String!
    price: Float!
    stock: Int!
    category: String!
    description: String
    shopId: String!
  }

  input UpdateProductInput {
    name: String
    price: Float
    stock: Int
    category: String
    description: String
  }

  input CreateCustomerInput {
    name: String!
    email: String!
    phone: String!
    address: String
    marketingConsent: Boolean
  }

  input UpdateCustomerInput {
    name: String
    email: String
    phone: String
    address: String
    marketingConsent: Boolean
  }
`

const resolvers = {
  Query: {
    health: () => ({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      service: "graphql-gateway"
    }),
    
    // Orders
    orders: async (_: any, args: any, ctx: any) => {
      const base = process.env.ORDERS_SERVICE_URL || "http://localhost:3002"
      const url = new URL("/api/orders", base)
      if (args.shopId) url.searchParams.set("shopId", args.shopId)
      if (args.customerId) url.searchParams.set("customerId", args.customerId)
      if (args.page) url.searchParams.set("page", String(args.page))
      if (args.limit) url.searchParams.set("limit", String(args.limit))
      
      const res = await fetch(url.toString(), { 
        headers: { Authorization: ctx.req.headers.authorization || "" } 
      })
      const data: any = await res.json()
      
      return {
        orders: data.data?.map((o: any) => ({
          id: o.id,
          customerId: o.customerId,
          shopId: o.shopId,
          totalAmount: Number(o.totalAmount),
          status: o.status,
          paymentStatus: o.paymentStatus,
          createdAt: o.createdAt,
          items: o.orderItems?.map((i: any) => ({ 
            productId: i.productId, 
            quantity: i.quantity, 
            price: Number(i.price) 
          })) || [],
        })) || [],
        pagination: data.pagination || { page: 1, limit: 20, total: 0, pages: 0 },
      }
    },

    order: async (_: any, { id }: any, ctx: any) => {
      const base = process.env.ORDERS_SERVICE_URL || "http://localhost:3002"
      const res = await fetch(`${base}/api/orders/${id}`, {
        headers: { Authorization: ctx.req.headers.authorization || "" }
      })
      const data: any = await res.json()
      
      if (!data.success) return null
      
      const o = data.data
      return {
        id: o.id,
        customerId: o.customerId,
        shopId: o.shopId,
        totalAmount: Number(o.totalAmount),
        status: o.status,
        paymentStatus: o.paymentStatus,
        createdAt: o.createdAt,
        items: o.orderItems?.map((i: any) => ({ 
          productId: i.productId, 
          quantity: i.quantity, 
          price: Number(i.price) 
        })) || [],
      }
    },

    // Products
    products: async (_: any, args: any, ctx: any) => {
      const base = process.env.ORDERS_SERVICE_URL || "http://localhost:3002"
      const url = new URL("/api/products", base)
      if (args.shopId) url.searchParams.set("shopId", args.shopId)
      if (args.page) url.searchParams.set("page", String(args.page))
      if (args.limit) url.searchParams.set("limit", String(args.limit))
      
      const res = await fetch(url.toString())
      const data: any = await res.json()
      
      return {
        products: data.data || [],
        pagination: data.pagination || { page: 1, limit: 20, total: 0, pages: 0 },
      }
    },

    product: async (_: any, { id }: any) => {
      const base = process.env.ORDERS_SERVICE_URL || "http://localhost:3002"
      const res = await fetch(`${base}/api/products/${id}`)
      const data: any = await res.json()
      return data.success ? data.data : null
    },

    // Customers
    customers: async (_: any, args: any, ctx: any) => {
      const base = process.env.ORDERS_SERVICE_URL || "http://localhost:3002"
      const url = new URL("/api/customers", base)
      if (args.shopId) url.searchParams.set("shopId", args.shopId)
      if (args.page) url.searchParams.set("page", String(args.page))
      if (args.limit) url.searchParams.set("limit", String(args.limit))
      
      const res = await fetch(url.toString(), {
        headers: { Authorization: ctx.req.headers.authorization || "" }
      })
      const data: any = await res.json()
      
      return {
        customers: data.data || [],
        pagination: data.pagination || { page: 1, limit: 20, total: 0, pages: 0 },
      }
    },

    customer: async (_: any, { id }: any, ctx: any) => {
      const base = process.env.ORDERS_SERVICE_URL || "http://localhost:3002"
      const res = await fetch(`${base}/api/customers/${id}`, {
        headers: { Authorization: ctx.req.headers.authorization || "" }
      })
      const data: any = await res.json()
      return data.success ? data.data : null
    },

    // Analytics
    analytics: async (_: any, { shopId }: any, ctx: any) => {
      const base = process.env.ORDERS_SERVICE_URL || "http://localhost:3002"
      const url = new URL("/api/analytics/dashboard", base)
      if (shopId) url.searchParams.set("shopId", shopId)
      
      const res = await fetch(url.toString(), {
        headers: { Authorization: ctx.req.headers.authorization || "" }
      })
      const data: any = await res.json()
      return data.data || {
        totalRevenue: 0,
        totalOrders: 0,
        totalCustomers: 0,
        averageOrderValue: 0
      }
    },

    // Campaigns
    campaigns: async (_: any, { shopId }: any, ctx: any) => {
      const base = process.env.ORDERS_SERVICE_URL || "http://localhost:3002"
      const url = new URL("/api/campaigns", base)
      if (shopId) url.searchParams.set("shopId", shopId)
      
      const res = await fetch(url.toString(), {
        headers: { Authorization: ctx.req.headers.authorization || "" }
      })
      const data: any = await res.json()
      return data.data || []
    },

    inventorySummary: async (_: any, { shopId }: any) => {
      const base = process.env.ORDERS_SERVICE_URL || "http://localhost:3002"
      const url = new URL(`/api/inventory/summary?shopId=${encodeURIComponent(shopId)}`, base)
      const res = await fetch(url.toString())
      const data: any = await res.json()
      return data.data || []
    },
  },

  Mutation: {
    // Order mutations
    createOrder: async (_: any, { input }: any, ctx: any) => {
      const base = process.env.ORDERS_SERVICE_URL || "http://localhost:3002"
      const res = await fetch(`${base}/api/orders`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: ctx.req.headers.authorization || "" 
        },
        body: JSON.stringify(input)
      })
      const data: any = await res.json()
      return data.data
    },

    updateOrderStatus: async (_: any, { id, status }: any, ctx: any) => {
      const base = process.env.ORDERS_SERVICE_URL || "http://localhost:3002"
      const res = await fetch(`${base}/api/orders/${id}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: ctx.req.headers.authorization || "" 
        },
        body: JSON.stringify({ status })
      })
      const data: any = await res.json()
      return data.data
    },

    // Product mutations
    createProduct: async (_: any, { input }: any, ctx: any) => {
      const base = process.env.ORDERS_SERVICE_URL || "http://localhost:3002"
      const res = await fetch(`${base}/api/products`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: ctx.req.headers.authorization || "" 
        },
        body: JSON.stringify(input)
      })
      const data: any = await res.json()
      return data.data
    },

    updateProduct: async (_: any, { id, input }: any, ctx: any) => {
      const base = process.env.ORDERS_SERVICE_URL || "http://localhost:3002"
      const res = await fetch(`${base}/api/products/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: ctx.req.headers.authorization || "" 
        },
        body: JSON.stringify(input)
      })
      const data: any = await res.json()
      return data.data
    },

    // Customer mutations
    createCustomer: async (_: any, { input }: any, ctx: any) => {
      const base = process.env.ORDERS_SERVICE_URL || "http://localhost:3002"
      const res = await fetch(`${base}/api/customers`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: ctx.req.headers.authorization || "" 
        },
        body: JSON.stringify(input)
      })
      const data: any = await res.json()
      return data.data
    },

    updateCustomer: async (_: any, { id, input }: any, ctx: any) => {
      const base = process.env.ORDERS_SERVICE_URL || "http://localhost:3002"
      const res = await fetch(`${base}/api/customers/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: ctx.req.headers.authorization || "" 
        },
        body: JSON.stringify(input)
      })
      const data: any = await res.json()
      return data.data
    },
  },
}

async function start() {
  const app = express()
  app.use(cors())
  app.use(bodyParser.json())

  const server = new ApolloServer({ typeDefs, resolvers })
  await server.start()

  app.use(
    "/graphql",
    expressMiddleware(server, {
      context: async ({ req }) => ({ req }),
    }),
  )

  const port = process.env.PORT || 4000
  app.listen(port, () => {
    console.log(`[GraphQL] Listening on :${port}`)
  })
}

start()
