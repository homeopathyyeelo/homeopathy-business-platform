package docs

import (
	"strings"

	"github.com/swaggo/swag"
)

const docTemplate = `{
    "swagger": "2.0",
    "info": {
        "description": "{{.Description}}",
        "title": "{{.Title}}",
        "contact": {},
        "version": "{{.Version}}"
    },
    "host": "{{.Host}}",
    "basePath": "{{.BasePath}}",
    "schemes": {{.Schemes}},
    "paths": {
        "/health": {
            "get": {
                "tags": ["System"],
                "summary": "Public health check",
                "produces": ["application/json"],
                "responses": {
                    "200": {
                        "description": "Service is healthy"
                    }
                }
            }
        },
        "/api/v1/system/health": {
            "get": {
                "tags": ["System"],
                "summary": "Authenticated system health",
                "produces": ["application/json"],
                "security": [{"BearerAuth": []}],
                "responses": {
                    "200": {
                        "description": "Aggregated service health",
                        "schema": {"$ref": "#/definitions/SystemHealth"}
                    },
                    "401": {
                        "description": "Unauthorized"
                    }
                }
            }
        },
        "/api/v1/system/info": {
            "get": {
                "tags": ["System"],
                "summary": "Authenticated system metadata",
                "produces": ["application/json"],
                "security": [{"BearerAuth": []}],
                "responses": {
                    "200": {
                        "description": "System information",
                        "schema": {"$ref": "#/definitions/SystemInfo"}
                    },
                    "401": {
                        "description": "Unauthorized"
                    }
                }
            }
        },
        "/api/v1/customers": {
            "get": {
                "tags": ["Customers"],
                "summary": "List customers",
                "produces": ["application/json"],
                "security": [{"BearerAuth": []}],
                "responses": {
                    "200": {
                        "description": "Customers fetched",
                        "schema": {
                            "type": "array",
                            "items": {"$ref": "#/definitions/CustomerSummary"}
                        }
                    }
                }
            },
            "post": {
                "tags": ["Customers"],
                "summary": "Create customer",
                "consumes": ["application/json"],
                "produces": ["application/json"],
                "security": [{"BearerAuth": []}],
                "parameters": [{
                    "in": "body",
                    "name": "payload",
                    "required": true,
                    "schema": {"$ref": "#/definitions/CustomerCreate"}
                }],
                "responses": {
                    "201": {
                        "description": "Customer created",
                        "schema": {"$ref": "#/definitions/CustomerSummary"}
                    }
                }
            }
        },
        "/api/v1/customers/{id}": {
            "get": {
                "tags": ["Customers"],
                "summary": "Fetch customer by ID",
                "produces": ["application/json"],
                "security": [{"BearerAuth": []}],
                "parameters": [{
                    "in": "path",
                    "name": "id",
                    "type": "string",
                    "required": true
                }],
                "responses": {
                    "200": {
                        "description": "Customer found",
                        "schema": {"$ref": "#/definitions/CustomerDetail"}
                    },
                    "404": {
                        "description": "Customer not found"
                    }
                }
            },
            "put": {
                "tags": ["Customers"],
                "summary": "Update customer",
                "consumes": ["application/json"],
                "produces": ["application/json"],
                "security": [{"BearerAuth": []}],
                "parameters": [
                    {
                        "in": "path",
                        "name": "id",
                        "type": "string",
                        "required": true
                    },
                    {
                        "in": "body",
                        "name": "payload",
                        "required": true,
                        "schema": {"$ref": "#/definitions/CustomerUpdate"}
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Customer updated",
                        "schema": {"$ref": "#/definitions/CustomerDetail"}
                    }
                }
            }
        },
        "/api/erp/products": {
            "get": {
                "tags": ["Products"],
                "summary": "List products",
                "produces": ["application/json"],
                "security": [{"BearerAuth": []}],
                "responses": {
                    "200": {
                        "description": "Products fetched",
                        "schema": {
                            "type": "array",
                            "items": {"$ref": "#/definitions/ProductSummary"}
                        }
                    }
                }
            },
            "post": {
                "tags": ["Products"],
                "summary": "Create product",
                "consumes": ["application/json"],
                "produces": ["application/json"],
                "security": [{"BearerAuth": []}],
                "parameters": [{
                    "in": "body",
                    "name": "payload",
                    "required": true,
                    "schema": {"$ref": "#/definitions/ProductCreate"}
                }],
                "responses": {
                    "201": {
                        "description": "Product created",
                        "schema": {"$ref": "#/definitions/ProductDetail"}
                    }
                }
            }
        },
        "/api/erp/products/{id}": {
            "get": {
                "tags": ["Products"],
                "summary": "Fetch product",
                "produces": ["application/json"],
                "security": [{"BearerAuth": []}],
                "parameters": [{
                    "in": "path",
                    "name": "id",
                    "type": "string",
                    "required": true
                }],
                "responses": {
                    "200": {
                        "description": "Product detail",
                        "schema": {"$ref": "#/definitions/ProductDetail"}
                    },
                    "404": {
                        "description": "Product not found"
                    }
                }
            },
            "put": {
                "tags": ["Products"],
                "summary": "Update product",
                "consumes": ["application/json"],
                "produces": ["application/json"],
                "security": [{"BearerAuth": []}],
                "parameters": [
                    {
                        "in": "path",
                        "name": "id",
                        "type": "string",
                        "required": true
                    },
                    {
                        "in": "body",
                        "name": "payload",
                        "required": true,
                        "schema": {"$ref": "#/definitions/ProductUpdate"}
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Product updated",
                        "schema": {"$ref": "#/definitions/ProductDetail"}
                    }
                }
            }
        },
        "/api/erp/dashboard/stats": {
            "get": {
                "tags": ["Dashboard"],
                "summary": "Fetch dashboard KPI sets",
                "produces": ["application/json"],
                "security": [{"BearerAuth": []}],
                "responses": {
                    "200": {
                        "description": "Dashboard stats",
                        "schema": {"$ref": "#/definitions/DashboardStats"}
                    }
                }
            }
        },
        "/api/erp/inventory": {
            "get": {
                "tags": ["Inventory"],
                "summary": "Inventory snapshot",
                "produces": ["application/json"],
                "security": [{"BearerAuth": []}],
                "responses": {
                    "200": {
                        "description": "Inventory response",
                        "schema": {
                            "type": "array",
                            "items": {"$ref": "#/definitions/InventoryItem"}
                        }
                    }
                }
            }
        }
    },
    "definitions": {
        "SystemHealth": {
            "type": "object",
            "properties": {
                "success": {"type": "boolean"},
                "data": {
                    "type": "object",
                    "properties": {
                        "services": {
                            "type": "array",
                            "items": {"$ref": "#/definitions/ServiceStatus"}
                        }
                    }
                }
            }
        },
        "SystemInfo": {
            "type": "object",
            "properties": {
                "success": {"type": "boolean"},
                "data": {
                    "type": "object",
                    "additionalProperties": true
                }
            }
        },
        "ServiceStatus": {
            "type": "object",
            "properties": {
                "service": {"type": "string"},
                "status": {"type": "string"},
                "latency": {"type": "integer"}
            }
        },
        "CustomerSummary": {
            "type": "object",
            "properties": {
                "id": {"type": "string"},
                "name": {"type": "string"},
                "email": {"type": "string"},
                "phone": {"type": "string"},
                "loyaltyPoints": {"type": "integer"}
            }
        },
        "CustomerDetail": {
            "allOf": [
                {"$ref": "#/definitions/CustomerSummary"},
                {
                    "type": "object",
                    "properties": {
                        "address": {"type": "object", "additionalProperties": true},
                        "creditLimit": {"type": "number"},
                        "outstanding": {"type": "number"}
                    }
                }
            ]
        },
        "CustomerCreate": {
            "type": "object",
            "required": ["name", "email"],
            "properties": {
                "name": {"type": "string"},
                "email": {"type": "string"},
                "phone": {"type": "string"},
                "groupId": {"type": "string"}
            }
        },
        "CustomerUpdate": {
            "type": "object",
            "properties": {
                "name": {"type": "string"},
                "email": {"type": "string"},
                "phone": {"type": "string"},
                "loyaltyPoints": {"type": "integer"}
            }
        },
        "ProductSummary": {
            "type": "object",
            "properties": {
                "id": {"type": "string"},
                "name": {"type": "string"},
                "sku": {"type": "string"},
                "price": {"type": "number"},
                "stock": {"type": "integer"}
            }
        },
        "ProductDetail": {
            "allOf": [
                {"$ref": "#/definitions/ProductSummary"},
                {
                    "type": "object",
                    "properties": {
                        "description": {"type": "string"},
                        "category": {"type": "string"},
                        "brand": {"type": "string"}
                    }
                }
            ]
        },
        "ProductCreate": {
            "type": "object",
            "required": ["name", "sku", "price"],
            "properties": {
                "name": {"type": "string"},
                "sku": {"type": "string"},
                "price": {"type": "number"},
                "stock": {"type": "integer"}
            }
        },
        "ProductUpdate": {
            "type": "object",
            "properties": {
                "name": {"type": "string"},
                "price": {"type": "number"},
                "stock": {"type": "integer"}
            }
        },
        "DashboardStats": {
            "type": "object",
            "properties": {
                "revenue": {"type": "number"},
                "topProducts": {
                    "type": "array",
                    "items": {"type": "string"}
                },
                "pendingInvoices": {"type": "integer"}
            }
        },
        "InventoryItem": {
            "type": "object",
            "properties": {
                "productId": {"type": "string"},
                "location": {"type": "string"},
                "available": {"type": "integer"},
                "reserved": {"type": "integer"}
            }
        }
    },
    "securityDefinitions": {
        "BearerAuth": {
            "type": "apiKey",
            "name": "Authorization",
            "in": "header"
        }
    }
}`

type swaggerInfo struct {
	Version          string
	Host             string
	BasePath         string
	Schemes          []string
	Title            string
	Description      string
	InfoInstanceName string
	SwaggerTemplate  string
	LeftDelim        string
	RightDelim       string
}

// SwaggerInfo provides metadata for the generated docs.
var SwaggerInfo = &swaggerInfo{
	Version:          "1.0",
	Host:             "",
	BasePath:         "",
	Schemes:          []string{"http"},
	Title:            "Homeopathy ERP API",
	Description:      "API documentation for Homeopathy ERP microservices.",
	InfoInstanceName: "swagger",
	SwaggerTemplate:  docTemplate,
	LeftDelim:        "{{",
	RightDelim:       "}}",
}

type swaggerDoc struct{}

// ReadDoc returns the Swagger document after injecting runtime metadata.
func (s *swaggerInfo) ReadDoc() string {
	schemes := "[]"
	if len(s.Schemes) > 0 {
		schemes = "[\"" + strings.Join(s.Schemes, "\",\"") + "\"]"
	}

	replacer := strings.NewReplacer(
		"{{.Version}}", s.Version,
		"{{.Host}}", s.Host,
		"{{.BasePath}}", s.BasePath,
		"{{.Title}}", s.Title,
		"{{.Description}}", s.Description,
		"{{.Schemes}}", schemes,
	)

	return replacer.Replace(s.SwaggerTemplate)
}

func (s *swaggerInfo) InstanceName() string {
	return s.InfoInstanceName
}

func (swaggerDoc) ReadDoc() string {
	return SwaggerInfo.ReadDoc()
}

func init() {
	swag.Register(SwaggerInfo.InstanceName(), &swaggerDoc{})
}
