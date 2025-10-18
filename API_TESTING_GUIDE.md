# API Testing Guide for Homeopathy ERP Platform

## Base URL
- Development: `http://localhost:3000`
- Port 3004: `http://localhost:3004`

## Authentication
Most endpoints require authentication. Use the login endpoint first to get a token.

### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "medicine@yeelohomeopathy.com",
  "password": "XXghosh@147"
}
```

## Customer Management APIs

### 1. Create Customer (ERP Endpoint)
```bash
POST /api/erp/customers
Content-Type: application/json

{
  "name": "Amit Ghosh",
  "phone": "8527672265",
  "email": "admin@yeelo.com",
  "address": "Dhunela",
  "city": "Delhi",
  "state": "Delhi",
  "pincode": "110001",
  "type": "retail",
  "gstNumber": ""
}
```

### 2. Get All Customers
```bash
GET /api/erp/customers?page=1&limit=20
```

### 3. Update Customer
```bash
PUT /api/erp/customers
Content-Type: application/json

{
  "id": "customer_id_here",
  "name": "Updated Name",
  "phone": "9999999999"
}
```

### 4. Delete Customer
```bash
DELETE /api/erp/customers?id=customer_id_here
```

## Generic Entity APIs

The platform supports generic CRUD operations for all master data entities:

### Supported Entities
- customers
- products
- suppliers
- vendors
- (more can be added to the entity map)

### Generic Endpoints Pattern
```bash
GET    /api/erp/[entity]?page=1&limit=20&search=query
POST   /api/erp/[entity]
PUT    /api/erp/[entity]
DELETE /api/erp/[entity]?id=entity_id
```

## Master Data APIs

### Get Master Data
```bash
GET /api/masters/[masterType]?page=1&limit=20
```

Supported master types:
- categories
- brands
- units
- tax-rates
- payment-terms
- and many more...

## Testing with cURL

### Create Customer Example
```bash
curl -X POST http://localhost:3000/api/erp/customers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Amit Ghosh",
    "phone": "8527672265",
    "email": "admin@yeelo.com",
    "address": "Dhunela",
    "city": "Delhi",
    "state": "Delhi",
    "pincode": "110001",
    "type": "retail",
    "gstNumber": ""
  }'
```

### Get Customers Example
```bash
curl http://localhost:3000/api/erp/customers?page=1&limit=10
```

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": "Detailed error information"
}
```

## Common Issues and Solutions

### 1. 500 Error on POST
**Cause**: Missing required fields or database connection issue
**Solution**: 
- Check all required fields are provided
- Verify database is running
- Check Prisma schema matches the data structure

### 2. 404 Error
**Cause**: Endpoint not found
**Solution**: 
- Verify the URL is correct
- Check if the entity is registered in the entity map
- Restart the development server

### 3. 401 Unauthorized
**Cause**: Missing or invalid authentication token
**Solution**: 
- Login first to get a valid token
- Include the token in the Authorization header

## Database Setup

If you encounter database errors, run:
```bash
npx prisma generate
npx prisma db push
```

## Development Server

Start the server:
```bash
npm run dev:app
```

Server will be available at: http://localhost:3000

## Notes
- All timestamps are in ISO 8601 format
- IDs are generated using cuid()
- Pagination is 1-indexed
- Search is case-insensitive
- All responses include a `success` boolean field
