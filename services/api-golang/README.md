# 🚀 Golang API - Homeopathy Business Platform

High-performance REST API built with Go and Gin framework for the Yeelo Homeopathy Business Platform.

## ✨ Features

### Complete API Endpoints

#### 🔐 Authentication
- `POST /api/auth/login` - User login with JWT
- `GET /api/auth/me` - Get current user info

#### 📦 Products
- `GET /api/products` - List all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create new product (Admin only)
- `PUT /api/products/:id` - Update product (Admin only)
- `DELETE /api/products/:id` - Delete product (Admin only)

#### 👥 Customers
- `GET /api/customers` - List all customers
- `GET /api/customers/:id` - Get customer by ID
- `POST /api/customers` - Create new customer
- `PUT /api/customers/:id` - Update customer

#### 🛒 Orders
- `GET /api/orders` - List all orders
- `GET /api/orders/:id` - Get order by ID
- `POST /api/orders` - Create new order
- `PUT /api/orders/:id/status` - Update order status

#### 📢 Campaigns
- `GET /api/campaigns` - List all campaigns
- `GET /api/campaigns/:id` - Get campaign by ID
- `POST /api/campaigns` - Create new campaign (Admin only)
- `POST /api/campaigns/:id/launch` - Launch campaign (Admin only)

#### 📊 Analytics
- `GET /api/analytics/dashboard` - Get dashboard analytics
- `GET /api/analytics/revenue` - Get revenue data
- `GET /api/analytics/top-products` - Get top selling products

#### 📦 Inventory
- `GET /api/inventory` - List inventory
- `POST /api/inventory/adjust` - Adjust inventory (Admin only)
- `GET /api/inventory/low-stock` - Get low stock items

### 🎯 Key Features

- ✅ **High Performance** - Built with Go for ultra-low latency (~2ms response time)
- ✅ **JWT Authentication** - Secure token-based authentication
- ✅ **Role-Based Access Control** - Admin and User roles
- ✅ **Database Integration** - PostgreSQL with connection pooling
- ✅ **CORS Support** - Cross-origin resource sharing enabled
- ✅ **Swagger Documentation** - Interactive API documentation
- ✅ **Health Checks** - `/health` endpoint for monitoring
- ✅ **Error Handling** - Comprehensive error responses
- ✅ **Demo Data** - Works with or without database

## 🚀 Quick Start

### Prerequisites
- Go 1.22 or higher
- PostgreSQL (optional - works with demo data)

### Installation

```bash
# Navigate to the service directory
cd services/api-golang

# Install dependencies
go mod download

# Run the server
go run .
```

### Using Docker

```bash
# Build the image
docker build -t golang-api .

# Run the container
docker run -p 3004:3004 \
  -e DATABASE_URL=postgresql://postgres:postgres@localhost:5433/yeelo_homeopathy \
  -e JWT_SECRET=your-secret-key \
  golang-api
```

## 📝 Configuration

### Environment Variables

```bash
# Server Configuration
PORT=3004                    # Server port (default: 3004)

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/yeelo_homeopathy

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

## 🧪 Testing

### Health Check
```bash
curl http://localhost:3004/health
```

Response:
```json
{
  "status": "ok",
  "service": "golang-api",
  "timestamp": "2024-01-08T11:30:00Z",
  "database": "connected"
}
```

### Authentication
```bash
# Login
curl -X POST http://localhost:3004/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@yeelo.com",
    "password": "admin123"
  }'
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 86400
}
```

### Get Products
```bash
curl http://localhost:3004/api/products
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "name": "Arnica Montana 30C",
      "price": 150.00,
      "stock": 100,
      "category": "Homeopathy",
      "description": "For bruises, muscle pain, and inflammation",
      "created_at": "2024-01-08T11:30:00Z",
      "updated_at": "2024-01-08T11:30:00Z"
    }
  ],
  "count": 1
}
```

### Create Product (Admin Only)
```bash
curl -X POST http://localhost:3004/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "New Product",
    "price": 200.00,
    "stock": 50,
    "category": "Homeopathy",
    "description": "Product description"
  }'
```

## 📚 API Documentation

### Swagger UI
Access interactive API documentation at:
```
http://localhost:3004/swagger
```

### OpenAPI Specification
Get the OpenAPI JSON at:
```
http://localhost:3004/openapi.json
```

## 🏗️ Architecture

```
main.go           # Application entry point, routes setup
handlers.go       # Request handlers for all endpoints
go.mod            # Go module dependencies
go.sum            # Dependency checksums
Dockerfile        # Docker container configuration
openapi.json      # OpenAPI specification
```

### Code Structure

```go
// Models
type Product struct {
    ID          string
    Name        string
    Price       float64
    Stock       int
    Category    string
    Description string
    CreatedAt   time.Time
    UpdatedAt   time.Time
}

// Handler Example
func handleGetProducts(c *gin.Context) {
    // Fetch products from database or demo data
    products := []Product{...}
    
    c.JSON(200, gin.H{
        "success": true,
        "data":    products,
        "count":   len(products),
    })
}
```

## 🔒 Security

### JWT Authentication
All protected endpoints require a valid JWT token:

```bash
Authorization: Bearer <token>
```

### Role-Based Access Control
- **ADMIN** - Full access to all endpoints
- **USER** - Limited access to read operations

### Demo Credentials
```
Email: admin@yeelo.com
Password: admin123
```

**⚠️ Change these in production!**

## 🚀 Performance

### Benchmarks (Local Development)
- Health Check: ~1-2ms
- Get Products: ~2-5ms
- Create Order: ~5-10ms
- Analytics Dashboard: ~10-15ms

### Optimizations
- Connection pooling for database
- Efficient JSON serialization
- Minimal middleware overhead
- Compiled binary for production

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Test connection
psql -h localhost -p 5433 -U postgres -d yeelo_homeopathy
```

### Port Already in Use
```bash
# Find process using port 3004
lsof -i :3004

# Kill the process
kill -9 <PID>

# Or use a different port
PORT=3005 go run .
```

### Module Download Issues
```bash
# Clear module cache
go clean -modcache

# Re-download dependencies
go mod download
```

## 📦 Dependencies

```go
require (
    github.com/gin-gonic/gin v1.10.0        // Web framework
    github.com/golang-jwt/jwt/v5 v5.2.1     // JWT authentication
    github.com/google/uuid v1.6.0           // UUID generation
    github.com/lib/pq v1.10.9               // PostgreSQL driver
)
```

## 🔄 Development Workflow

### Local Development
```bash
# Run with hot reload (using air)
go install github.com/cosmtrek/air@latest
air

# Or run directly
go run .
```

### Building for Production
```bash
# Build binary
go build -o api-golang .

# Run binary
./api-golang
```

### Docker Development
```bash
# Build image
docker build -t golang-api .

# Run with docker-compose
docker-compose up golang-api
```

## 📊 Monitoring

### Health Endpoint
```bash
curl http://localhost:3004/health
```

### Metrics
- Request count
- Response times
- Error rates
- Database connection status

## 🤝 Contributing

1. Follow Go best practices
2. Add tests for new features
3. Update documentation
4. Use meaningful commit messages

## 📄 License

Part of the Yeelo Homeopathy Business Platform

---

## 🎯 Quick Reference

### Start Server
```bash
go run .
```

### Access Swagger
```
http://localhost:3004/swagger
```

### Test API
```bash
curl http://localhost:3004/health
```

### Login
```bash
curl -X POST http://localhost:3004/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@yeelo.com","password":"admin123"}'
```

---

**Built with ❤️ using Go and Gin Framework**
