# 🔌 Complete API Reference

## Overview
All backend services are running with Swagger documentation for easy testing and exploration.

## Service Endpoints

### 1. NestJS API (Port 3001)
**Base URL:** `http://localhost:3001`  
**Swagger:** `http://localhost:3001/api`

#### Features
- Enterprise-grade TypeScript framework
- Main ERP backend
- Complete CRUD operations
- JWT authentication
- Rate limiting

#### Key Endpoints
```
GET    /health                    - Health check
GET    /api/products              - List products
POST   /api/products              - Create product
GET    /api/orders                - List orders
POST   /api/orders                - Create order
GET    /api/customers             - List customers
POST   /api/customers             - Create customer
GET    /api/inventory             - Inventory status
POST   /api/finance/invoices      - Create invoice
GET    /api/finance/reports       - Financial reports
```

---

### 2. Fastify API (Port 3002)
**Base URL:** `http://localhost:3002`  
**Swagger:** `http://localhost:3002/documentation`

#### Features
- High-performance HTTP server
- Low latency operations
- Schema validation
- Fast JSON serialization

#### Key Endpoints
```
GET    /health                    - Health check
GET    /api/products              - List products (fast)
POST   /api/products              - Create product (fast)
GET    /api/orders                - List orders (fast)
POST   /api/orders                - Create order (fast)
```

---

### 3. Express API (Port 3003)
**Base URL:** `http://localhost:3003`  
**Swagger:** `http://localhost:3003/api-docs`

#### Features
- Traditional Node.js framework
- Legacy support
- Simple and flexible
- Wide middleware ecosystem

#### Key Endpoints
```
GET    /health                    - Health check
GET    /api/products              - List products
GET    /api/orders                - List orders
GET    /api/customers             - List customers
```

---

### 4. Golang API (Port 3004)
**Base URL:** `http://localhost:3004`

#### Features
- Ultra-low latency
- High concurrency
- Efficient memory usage
- Native performance

#### Key Endpoints
```
GET    /health                    - Health check
GET    /api/products              - List products (ultra-fast)
POST   /api/products              - Create product (ultra-fast)
GET    /api/analytics             - Real-time analytics
```

---

### 5. Python AI Service (Port 8001)
**Base URL:** `http://localhost:8001`  
**Swagger:** `http://localhost:8001/docs`

#### Features
- Machine learning operations
- AI content generation
- Natural language processing
- Image processing
- Demand forecasting

#### Key Endpoints
```
GET    /health                           - Health check
POST   /api/ai/generate                  - Generate content
POST   /api/ai/analyze                   - Analyze text
POST   /api/ai/forecast                  - Demand forecasting
POST   /api/ai/embeddings                - Generate embeddings
GET    /api/ai/models                    - List available models
POST   /api/ai/content/product           - Generate product description
POST   /api/ai/content/social            - Generate social media post
POST   /api/ai/content/blog              - Generate blog post
```

---

### 6. GraphQL Gateway (Port 4000)
**Base URL:** `http://localhost:4000/graphql`  
**Playground:** `http://localhost:4000`

#### Features
- Unified GraphQL API
- Query multiple services
- Real-time subscriptions
- Efficient data fetching

#### Example Queries

**Get Products:**
```graphql
query {
  products {
    id
    name
    price
    stock
  }
}
```

**Get Orders with Customer:**
```graphql
query {
  orders {
    id
    orderNumber
    totalAmount
    customer {
      id
      name
      email
    }
    items {
      product {
        name
      }
      quantity
      price
    }
  }
}
```

**Create Order:**
```graphql
mutation {
  createOrder(input: {
    customerId: "123"
    items: [
      { productId: "456", quantity: 2 }
    ]
  }) {
    id
    orderNumber
    totalAmount
  }
}
```

**Real-time Subscription:**
```graphql
subscription {
  orderCreated {
    id
    orderNumber
    totalAmount
  }
}
```

---

### 7. API Gateway (Port 5000)
**Base URL:** `http://localhost:5000`

#### Features
- REST API aggregation
- Load balancing
- Request routing
- Response caching

#### Key Endpoints
```
GET    /health                    - Health check
GET    /api/products              - Aggregated products
GET    /api/orders                - Aggregated orders
GET    /api/analytics             - Cross-service analytics
```

---

## Testing Examples

### cURL Examples

#### NestJS - Create Product
```bash
curl -X POST http://localhost:3001/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Arnica Montana 30C",
    "price": 150,
    "stock": 100,
    "category": "homeopathy"
  }'
```

#### Express - Get Products
```bash
curl http://localhost:3003/api/products
```

#### Python AI - Generate Content
```bash
curl -X POST http://localhost:8001/api/ai/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Write a product description for Arnica Montana",
    "type": "product",
    "maxTokens": 200
  }'
```

#### GraphQL - Query Products
```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{ products { id name price } }"
  }'
```

### JavaScript/TypeScript Examples

#### Using Fetch API
```typescript
// NestJS API
const response = await fetch('http://localhost:3001/api/products', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    name: 'Arnica Montana 30C',
    price: 150,
    stock: 100
  })
});
const data = await response.json();
```

#### Using GraphQL Client
```typescript
import { GraphQLClient } from 'graphql-request';

const client = new GraphQLClient('http://localhost:4000/graphql');

const query = `
  query {
    products {
      id
      name
      price
    }
  }
`;

const data = await client.request(query);
```

### Python Examples

#### Using Requests
```python
import requests

# NestJS API
response = requests.post(
    'http://localhost:3001/api/products',
    json={
        'name': 'Arnica Montana 30C',
        'price': 150,
        'stock': 100
    },
    headers={'Authorization': f'Bearer {token}'}
)
data = response.json()

# AI Service
response = requests.post(
    'http://localhost:8001/api/ai/generate',
    json={
        'prompt': 'Write a product description',
        'type': 'product'
    }
)
content = response.json()
```

---

## Authentication

### JWT Token
Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Get Token
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

---

## Rate Limiting

All APIs have rate limiting enabled:
- **100 requests per 15 minutes** per IP address
- Rate limit headers included in responses:
  - `X-RateLimit-Limit`
  - `X-RateLimit-Remaining`
  - `X-RateLimit-Reset`

---

## Error Handling

### Standard Error Response
```json
{
  "success": false,
  "error": "Error message",
  "statusCode": 400,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

---

## WebSocket Support

### Real-time Updates
Connect to WebSocket endpoints for real-time updates:

```javascript
const ws = new WebSocket('ws://localhost:4000/graphql');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Real-time update:', data);
};
```

---

## API Versioning

APIs support versioning through URL path:
- `/api/v1/products` - Version 1
- `/api/v2/products` - Version 2

Current version: **v1** (default)

---

## Swagger/OpenAPI Documentation

Visit these URLs for interactive API documentation:

- **NestJS:** http://localhost:3001/api
- **Fastify:** http://localhost:3002/documentation
- **Express:** http://localhost:3003/api-docs
- **Python AI:** http://localhost:8001/docs

All Swagger UIs support:
- Interactive API testing
- Request/response examples
- Schema definitions
- Authentication testing

---

## Performance Benchmarks

Approximate response times (local development):

| Service | Endpoint | Avg Response Time |
|---------|----------|-------------------|
| Golang | GET /api/products | ~2ms |
| Fastify | GET /api/products | ~5ms |
| NestJS | GET /api/products | ~10ms |
| Express | GET /api/products | ~15ms |
| Python AI | POST /api/ai/generate | ~500ms |

---

## Support

For API issues or questions:
1. Check Swagger documentation
2. View service logs: `make logs-[service-name]`
3. Check health endpoints
4. Review error responses
