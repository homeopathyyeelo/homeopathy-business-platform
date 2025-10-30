# Swagger Usage Guide

## 1. Run the API Gateway
```bash
./start-complete.sh
# or
PORT=3005 go run ./cmd/main.go
```

## 2. Obtain a JWT
Send a POST request to `/api/auth/login` with valid credentials to receive a bearer token.

## 3. Open the Swagger UI
Visit:
```
http://localhost:3005/docs/index.html?url=/docs/doc.json
```
Add the header:
```
Authorization: Bearer <your-token>
```

## 4. Try Routes
Use the "Authorize" button in Swagger to paste the bearer token, then exercise each route.

## 5. Extend Documentation
### Option A: Manual template
- Edit `docs/swagger.go` and append new path definitions for each handler you want visible in the UI.

### Option B: Swag annotations
1. Add swag comments above handlers:
   ```go
   // @Summary List customers
   // @Tags Customers
   // @Security BearerAuth
   // @Produce json
   // @Success 200 {array} models.Customer
   // @Router /api/v1/customers [get]
   ```
2. Install generator locally:
   ```bash
   go install github.com/swaggo/swag/cmd/swag@latest
   ```
3. Regenerate docs:
   ```bash
   swag init --generalInfo cmd/main.go --output docs
   ```
4. Restart the service to load the new Swagger spec.

## 6. Version Control
Commit the updated `docs` files alongside handler changes so the UI stays in sync. Prefer to regenerate after any API change.
