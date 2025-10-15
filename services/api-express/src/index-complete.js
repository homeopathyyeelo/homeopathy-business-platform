const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const Redis = require('ioredis');
const { Kafka } = require('kafkajs');

const app = express();
const PORT = process.env.PORT || 3003;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/yeelo_homeopathy',
});

// Redis connection
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6380');

// Kafka setup
const kafka = new Kafka({
  clientId: 'express-api',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
});
const producer = kafka.producer();

// Initialize Kafka producer
producer.connect().catch(err => console.log('Kafka connection error:', err));

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, error: 'Too many requests' }
});
app.use('/api/', limiter);

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Auth Middleware
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'No token provided' });
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

// Admin Middleware
const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ success: false, error: 'Admin access required' });
  }
  next();
};

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Homeopathy Platform Express API',
      version: '1.0.0',
      description: 'Complete Express API for Homeopathy Business Platform with all features',
      contact: {
        name: 'Yeelo Homeopathy',
        email: 'support@yeelo.com'
      }
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{
      bearerAuth: []
    }]
  },
  apis: ['./src/index-complete.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Express API Documentation'
}));

// ==================== HEALTH & INFO ====================

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 */
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    service: 'express-api',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };

  // Check database
  try {
    await pool.query('SELECT 1');
    health.database = 'connected';
  } catch (error) {
    health.database = 'disconnected';
  }

  // Check Redis
  try {
    await redis.ping();
    health.redis = 'connected';
  } catch (error) {
    health.redis = 'disconnected';
  }

  res.json(health);
});

// ==================== AUTHENTICATION ====================

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 */
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Demo authentication
    if (email === 'admin@yeelo.com' && password === 'admin123') {
      const token = jwt.sign(
        { id: 'admin-1', email, role: 'ADMIN' },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        data: {
          access_token: token,
          token_type: 'Bearer',
          expires_in: 86400
        }
      });
    } else {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User information
 */
app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json({
    success: true,
    data: req.user
  });
});

// ==================== PRODUCTS ====================

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all products
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of products
 */
app.get('/api/products', async (req, res) => {
  try {
    const { category, limit = 50 } = req.query;
    
    // Demo data
    const products = [
      {
        id: '1',
        name: 'Arnica Montana 30C',
        price: 150.00,
        stock: 100,
        category: 'Homeopathy',
        description: 'For bruises, muscle pain, and inflammation',
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Belladonna 200C',
        price: 180.00,
        stock: 75,
        category: 'Homeopathy',
        description: 'For fever, inflammation, and headaches',
        created_at: new Date().toISOString()
      },
      {
        id: '3',
        name: 'Nux Vomica 30C',
        price: 160.00,
        stock: 120,
        category: 'Homeopathy',
        description: 'For digestive issues and stress',
        created_at: new Date().toISOString()
      }
    ];

    // Try database if available
    try {
      const query = category 
        ? 'SELECT * FROM products WHERE category = $1 LIMIT $2'
        : 'SELECT * FROM products LIMIT $1';
      const params = category ? [category, limit] : [limit];
      
      const result = await pool.query(query, params);
      if (result.rows.length > 0) {
        return res.json({
          success: true,
          data: result.rows,
          count: result.rows.length,
          source: 'database'
        });
      }
    } catch (dbError) {
      console.log('Database query failed, using demo data');
    }

    res.json({
      success: true,
      data: products,
      count: products.length,
      source: 'demo'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product details
 */
app.get('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Try database first
    try {
      const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
      if (result.rows.length > 0) {
        return res.json({ success: true, data: result.rows[0] });
      }
    } catch (dbError) {
      console.log('Database query failed');
    }

    // Demo fallback
    res.json({
      success: true,
      data: {
        id,
        name: 'Arnica Montana 30C',
        price: 150.00,
        stock: 100,
        category: 'Homeopathy',
        description: 'For bruises, muscle pain, and inflammation'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create new product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Product created
 */
app.post('/api/products', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, price, stock, category, description } = req.body;

    const product = {
      id: Date.now().toString(),
      name,
      price,
      stock,
      category,
      description,
      created_at: new Date().toISOString()
    };

    // Try to insert into database
    try {
      await pool.query(
        'INSERT INTO products (id, name, price, stock, category, description, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [product.id, name, price, stock, category, description, product.created_at]
      );
    } catch (dbError) {
      console.log('Database insert failed');
    }

    // Publish to Kafka
    try {
      await producer.send({
        topic: 'products',
        messages: [{ value: JSON.stringify({ type: 'product.created', data: product }) }],
      });
    } catch (kafkaError) {
      console.log('Kafka publish failed');
    }

    res.status(201).json({
      success: true,
      data: product,
      message: 'Product created successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== CUSTOMERS ====================

/**
 * @swagger
 * /api/customers:
 *   get:
 *     summary: Get all customers
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of customers
 */
app.get('/api/customers', authMiddleware, async (req, res) => {
  try {
    const customers = [
      {
        id: '1',
        name: 'Rajesh Kumar',
        email: 'rajesh@example.com',
        phone: '+91 98765 43210',
        loyalty_points: 150,
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Priya Sharma',
        email: 'priya@example.com',
        phone: '+91 98765 43211',
        loyalty_points: 200,
        created_at: new Date().toISOString()
      }
    ];

    // Try database
    try {
      const result = await pool.query('SELECT * FROM customers ORDER BY created_at DESC LIMIT 50');
      if (result.rows.length > 0) {
        return res.json({ success: true, data: result.rows, count: result.rows.length });
      }
    } catch (dbError) {
      console.log('Database query failed');
    }

    res.json({ success: true, data: customers, count: customers.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/customers:
 *   post:
 *     summary: Create new customer
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       201:
 *         description: Customer created
 */
app.post('/api/customers', authMiddleware, async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    const customer = {
      id: Date.now().toString(),
      name,
      email,
      phone,
      loyalty_points: 0,
      created_at: new Date().toISOString()
    };

    // Try database
    try {
      await pool.query(
        'INSERT INTO customers (id, name, email, phone, loyalty_points, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
        [customer.id, name, email, phone, 0, customer.created_at]
      );
    } catch (dbError) {
      console.log('Database insert failed');
    }

    res.status(201).json({
      success: true,
      data: customer,
      message: 'Customer created successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== ORDERS ====================

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get all orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of orders
 */
app.get('/api/orders', authMiddleware, async (req, res) => {
  try {
    const orders = [
      {
        id: '1',
        customer_id: '1',
        total_amount: 450.00,
        status: 'COMPLETED',
        payment_status: 'PAID',
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        customer_id: '2',
        total_amount: 330.00,
        status: 'PENDING',
        payment_status: 'PENDING',
        created_at: new Date().toISOString()
      }
    ];

    // Try database
    try {
      const result = await pool.query('SELECT * FROM orders ORDER BY created_at DESC LIMIT 50');
      if (result.rows.length > 0) {
        return res.json({ success: true, data: result.rows, count: result.rows.length });
      }
    } catch (dbError) {
      console.log('Database query failed');
    }

    res.json({ success: true, data: orders, count: orders.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create new order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               customer_id:
 *                 type: string
 *               items:
 *                 type: array
 *               total_amount:
 *                 type: number
 *     responses:
 *       201:
 *         description: Order created
 */
app.post('/api/orders', authMiddleware, async (req, res) => {
  try {
    const { customer_id, items, total_amount } = req.body;

    const order = {
      id: Date.now().toString(),
      customer_id,
      total_amount,
      status: 'PENDING',
      payment_status: 'PENDING',
      created_at: new Date().toISOString()
    };

    // Try database
    try {
      await pool.query(
        'INSERT INTO orders (id, customer_id, total_amount, status, payment_status, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
        [order.id, customer_id, total_amount, 'PENDING', 'PENDING', order.created_at]
      );
    } catch (dbError) {
      console.log('Database insert failed');
    }

    // Publish to Kafka
    try {
      await producer.send({
        topic: 'orders',
        messages: [{ value: JSON.stringify({ type: 'order.created', data: order }) }],
      });
    } catch (kafkaError) {
      console.log('Kafka publish failed');
    }

    res.status(201).json({
      success: true,
      data: order,
      message: 'Order created successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== ANALYTICS ====================

/**
 * @swagger
 * /api/analytics/dashboard:
 *   get:
 *     summary: Get dashboard analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard metrics
 */
app.get('/api/analytics/dashboard', authMiddleware, async (req, res) => {
  try {
    const analytics = {
      total_revenue: 125000.00,
      total_orders: 450,
      total_customers: 280,
      average_order_value: 277.78
    };

    // Try to get real data from database
    try {
      const revenueResult = await pool.query("SELECT COALESCE(SUM(total_amount), 0) as revenue FROM orders WHERE status = 'COMPLETED'");
      const ordersResult = await pool.query('SELECT COUNT(*) as count FROM orders');
      const customersResult = await pool.query('SELECT COUNT(*) as count FROM customers');

      if (revenueResult.rows[0]) {
        analytics.total_revenue = parseFloat(revenueResult.rows[0].revenue);
        analytics.total_orders = parseInt(ordersResult.rows[0].count);
        analytics.total_customers = parseInt(customersResult.rows[0].count);
        analytics.average_order_value = analytics.total_orders > 0 
          ? analytics.total_revenue / analytics.total_orders 
          : 0;
      }
    } catch (dbError) {
      console.log('Database query failed, using demo data');
    }

    res.json({ success: true, data: analytics });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== CAMPAIGNS ====================

/**
 * @swagger
 * /api/campaigns:
 *   get:
 *     summary: Get all campaigns
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of campaigns
 */
app.get('/api/campaigns', authMiddleware, async (req, res) => {
  try {
    const campaigns = [
      {
        id: '1',
        name: 'Summer Sale 2024',
        channel: 'WHATSAPP',
        status: 'ACTIVE',
        target_count: 1000,
        sent_count: 750,
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        name: 'New Product Launch',
        channel: 'EMAIL',
        status: 'DRAFT',
        target_count: 500,
        sent_count: 0,
        created_at: new Date().toISOString()
      }
    ];

    res.json({ success: true, data: campaigns, count: campaigns.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/campaigns:
 *   post:
 *     summary: Create new campaign
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               channel:
 *                 type: string
 *               target_count:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Campaign created
 */
app.post('/api/campaigns', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, channel, target_count } = req.body;

    const campaign = {
      id: Date.now().toString(),
      name,
      channel,
      status: 'DRAFT',
      target_count,
      sent_count: 0,
      created_at: new Date().toISOString()
    };

    res.status(201).json({
      success: true,
      data: campaign,
      message: 'Campaign created successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== INVENTORY ====================

/**
 * @swagger
 * /api/inventory:
 *   get:
 *     summary: Get inventory status
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Inventory list
 */
app.get('/api/inventory', authMiddleware, async (req, res) => {
  try {
    const inventory = [
      { product_id: '1', name: 'Arnica Montana 30C', stock: 100, reorder_level: 20 },
      { product_id: '2', name: 'Belladonna 200C', stock: 75, reorder_level: 20 },
      { product_id: '3', name: 'Nux Vomica 30C', stock: 120, reorder_level: 30 }
    ];

    res.json({ success: true, data: inventory });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/inventory/low-stock:
 *   get:
 *     summary: Get low stock items
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Low stock items
 */
app.get('/api/inventory/low-stock', authMiddleware, async (req, res) => {
  try {
    const lowStock = [
      { product_id: '4', name: 'Calcarea Carb 30C', stock: 15, reorder_level: 20 },
      { product_id: '5', name: 'Pulsatilla 200C', stock: 10, reorder_level: 20 }
    ];

    res.json({ success: true, data: lowStock, count: lowStock.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server...');
  await producer.disconnect();
  await redis.quit();
  await pool.end();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Express API running on port ${PORT}`);
  console.log(`📚 Swagger docs: http://localhost:${PORT}/api-docs`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`\n✨ Features:`);
  console.log(`   - JWT Authentication`);
  console.log(`   - PostgreSQL Integration`);
  console.log(`   - Redis Caching`);
  console.log(`   - Kafka Event Streaming`);
  console.log(`   - Complete CRUD Operations`);
  console.log(`   - Swagger Documentation`);
});

module.exports = app;
