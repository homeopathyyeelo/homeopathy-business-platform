# Software Requirements Specification (SRS) - Yeelo Homeopathy Business Platform

## 1. Introduction

### 1.1 Purpose
This document specifies the requirements for the Yeelo Homeopathy Business Platform, a next-generation, AI-powered, microservices-based platform designed for comprehensive homeopathy business management. The platform integrates multi-channel marketing, inventory management, customer relationship management, and advanced analytics to streamline operations and enhance business growth.

### 1.2 Scope
The system encompasses backend microservices, frontend applications, infrastructure services, and integration components. It supports homeopathy businesses in managing products, orders, customers, inventory, campaigns, and analytics while leveraging AI for intelligent insights and automation.

### 1.3 Definitions and Acronyms
- **API**: Application Programming Interface
- **JWT**: JSON Web Token
- **RBAC**: Role-Based Access Control
- **CRUD**: Create, Read, Update, Delete
- **AI/ML**: Artificial Intelligence/Machine Learning
- **RAG**: Retrieval-Augmented Generation
- **CQRS**: Command Query Responsibility Segregation

### 1.4 References
- Master Architecture Document (MASTER-ARCHITECTURE.md)
- API Documentation (Various service endpoints)
- Infrastructure Setup Guides
- Deployment Configurations

## 2. Overall Description

### 2.1 Product Perspective
The Yeelo Homeopathy Business Platform is a distributed system consisting of multiple microservices that communicate asynchronously via event-driven architecture. It provides a unified interface for business operations while maintaining high performance, scalability, and security.

### 2.2 Product Features
- **Complete Business Management**: Products, Orders, Customers, Inventory
- **AI-Powered Intelligence**: Content generation, demand forecasting, customer segmentation
- **Multi-Channel Marketing**: WhatsApp, Email, SMS campaigns
- **Advanced Analytics**: Real-time dashboards, revenue tracking, insights
- **Enterprise Security**: JWT authentication, RBAC, data encryption
- **High Performance**: Microservices architecture, event-driven design
- **Multi-Technology Stack**: Go, Node.js, Python, TypeScript

### 2.3 User Classes and Characteristics
- **Administrators**: Full system access, manage users, products, campaigns
- **Business Users**: Manage daily operations, view analytics, handle orders
- **Customers**: Access product catalog, place orders, track deliveries
- **System Integrators**: API access for third-party integrations

### 2.4 Operating Environment
- **Runtime**: Node.js 20.x, Go 1.22, Python 3.11
- **Databases**: PostgreSQL 15 with pgVector, Redis 7
- **Message Queue**: Apache Kafka with Zookeeper
- **Storage**: MinIO (S3-compatible)
- **Containerization**: Docker and Docker Compose

## 3. System Features

The Yeelo Homeopathy Business Platform is a comprehensive ERP system with 20 main modules, each with full CRUD operations, API endpoints, and Next.js pages. All modules are built on the master data foundation and integrated with the latest technology stack.

### 3.1 Dashboard Module
**Overview**: Central hub for business insights and quick actions.
- Sales, Purchase, Stock, Profit overview
- Quick stats (Today/Week/Month)
- Alerts & Notifications (Expiry, Low Stock)
- Top selling products
- Recent activity log
- Branch/Store selector

### 3.2 Products Module
**Overview**: Complete product lifecycle management.
- Product list (CRUD)
- Add/Edit product forms
- Category/Subcategory management
- Brand/Manufacturer management
- Batch management with expiry tracking
- Barcodes/QR codes generation
- Price management (MRP, Purchase, Selling)
- Tax/GST settings
- Product images and variants
- Import/Export (Excel/CSV)

### 3.3 Inventory Module
**Overview**: Real-time inventory tracking and management.
- Inventory dashboard
- Stock list per branch/warehouse
- Batch & expiry tracking
- Stock adjustments and transfers
- Stock reconciliation (audit)
- Low stock and dead stock reports
- Real-time stock valuation
- Inventory history log

### 3.4 Sales Module
**Overview**: Complete sales workflow management.
- POS (Point of Sale) interface
- B2C sales billing
- B2B dealer sales
- D2D (Dealer to Dealer) transactions
- Sales orders/quotations (draft)
- Sales invoices (CRUD)
- Credit sales and due management
- Returns/credit notes
- Receipts/payments
- E-invoice/PDF generation
- Customer-wise sales history

### 3.5 Purchases Module
**Overview**: Procurement and vendor management.
- Purchase orders (PO) CRUD
- GRN/pending receipts
- Purchase bills/invoices
- Vendor payments
- Purchase returns
- Price comparison (vendor-wise)
- Purchase history reports
- Vendor credit management
- Auto reorder suggestions (AI)

### 3.6 Customers Module
**Overview**: Customer relationship management.
- Customer list (CRUD)
- Customer groups (Retail/B2B/VIP)
- Contact details and preferences
- Purchase history and loyalty points
- Credit limit and outstanding
- Feedback and reviews
- Customer GST details
- Address book
- Communication logs (WhatsApp/SMS)

### 3.7 Vendors Module
**Overview**: Supplier and vendor management.
- Vendor list (CRUD)
- Vendor types (Manufacturer/Distributor)
- Contact details and terms
- Purchase history
- Payment terms and credit management
- Outstanding ledgers
- Contracts and agreements
- Performance ratings

### 3.8 HR & Staff Module
**Overview**: Employee and human resource management.
- Employee list (CRUD)
- Roles and permissions (RBAC)
- Attendance/check-in/check-out
- Leave management
- Shift scheduling
- Salary/payroll processing
- Incentives and commissions
- Performance tracking
- Activity audit logs

### 3.9 Finance & Accounting Module
**Overview**: Financial management and accounting.
- Sales and purchase ledgers
- Cash book and bank book
- Expense management (CRUD)
- Petty cash management
- GST/tax reports
- P&L (Profit & Loss)
- Balance sheet and trial balance
- Payment and receipt vouchers
- Bank reconciliation

### 3.10 Reports Module
**Overview**: Comprehensive reporting with export capabilities.
- Sales reports (Daily/Monthly/Branch/Product)
- Purchase and inventory reports
- Batch and expiry reports
- Profit analysis and GST reports
- Customer and vendor reports
- Employee and financial statements
- Custom report builder
- All reports exportable to PDF/Excel

### 3.11 Marketing Module
**Overview**: Multi-channel marketing campaign management.
- Campaign dashboard
- WhatsApp bulk campaigns
- SMS and email campaigns
- Offer/coupon management
- Customer segmentation
- Auto follow-up messages
- Festival/seasonal campaigns
- Dealer announcements
- Templates library

### 3.12 Social Media Automation
**Overview**: Automated social media management.
- GMB post scheduler
- Instagram/Facebook post scheduler
- YouTube video posts
- WordPress blog auto-publish
- Daily AI content generation
- Hashtags and SEO keywords
- Multi-account management

### 3.13 CRM / Customer Service
**Overview**: Customer service and support.
- Ticket/complaint system
- Follow-up reminders
- Appointment booking
- Chat (WhatsApp/Web)
- Interaction history
- Feedback collection
- AI chatbot integration

### 3.14 AI Module (Next Level)
**Overview**: Advanced AI-powered features.
- AI chat for business queries
- AI product suggestions (cross-sell)
- AI demand forecasting
- AI purchase order generation
- AI sales insights
- AI price optimization
- AI content writer (posts/blogs)
- AI customer segmentation
- AI health/remedy suggestions
- AI workflow automation

### 3.15 Analytics Module
**Overview**: Business intelligence and analytics.
- Business dashboard (BI)
- KPI dashboards
- Sales vs purchase analytics
- Product performance
- Customer lifetime value (LTV)
- Forecasting charts (AI)
- Branch performance comparison
- Marketing ROI
- Expense vs profit graphs

### 3.16 AI Campaigns Module
**Overview**: AI-generated marketing campaigns.
- Create AI-generated campaigns
- Multi-channel deployment
- Auto content and image generation
- Schedule/trigger-based campaigns
- Campaign performance analysis

### 3.17 AI Insights Module
**Overview**: Daily business insights and suggestions.
- Daily business summary (auto)
- Top/low performing products
- Action suggestions (reorder/discount/bundle)
- Cash flow predictions
- Profit leak detection (AI alerts)
- Customer behavior insights

### 3.18 AI Demo / Lab Module
**Overview**: AI feature testing and experimentation.
- Test AI features interface
- Prompt playground
- Model comparisons
- Data training interface
- LLM integration tests
- Fine-tune domain models

### 3.19 Settings & Configuration
**Overview**: System-wide configuration management.
- Company profile settings
- Branch/store management
- Roles and permissions
- Tax/GST configurations
- Units and measures
- Payment methods
- Email/WhatsApp gateway setup
- AI model selection
- Backup and restore
- Notification preferences
- Integration settings (API keys)

### 3.20 User Profile / Security
**Overview**: User account and security management.
- Profile information
- Password change
- Activity log
- 2FA security settings
- Sign out functionality

### 3.21 Hidden Infrastructure Modules
**Overview**: Backend services not visible to end-users but essential for operation.
- Authentication (JWT + RBAC)
- API Gateway (GraphQL/REST)
- Event system (Kafka)
- Audit logs
- Notification system (Email/SMS/WhatsApp)
- Background jobs (campaign send, AI tasks)
- Scheduler (cron jobs)
- File storage (product images, reports)
- Global search (ElasticSearch/pg_trgm)

### 3.22 Technical Implementation Requirements
**Overview**: Every module requires full-stack implementation.
- **Form Pages**: Add/Edit with validation
- **Table/List Pages**: Search, filter, pagination
- **Detail View Pages**: Read-only with actions
- **Modal Components**: Quick edit/add
- **Export/Print**: PDF/Excel generation
- **AI Assistant**: Integrated into each module
- **API Integration**: REST/GraphQL endpoints
- **Database Connectivity**: PostgreSQL with ORM
- **Event Publishing**: Kafka for major changes
- **Search & Analytics**: Real-time capabilities</parameter,


## 4. Functional Requirements

### 4.1 Master Data Management Requirements
**Overview**: All master data tables must support full CRUD operations with proper validation, audit trails, and integration with dependent modules.

#### 4.1.1 System-Wide Masters CRUD
- **Company Profile**: Create, read, update company settings
- **Branch/Store Master**: Multi-branch management with CRUD
- **Role & Permission Master**: RBAC setup with granular permissions
- **User/Staff Master**: User management with profile CRUD
- **Tax/GST Master**: GST slab management
- **Units of Measure**: UOM definitions and conversions
- **Payment Methods**: Payment option configurations
- **Notification Templates**: Template management for all channels

#### 4.1.2 Product & Inventory Masters CRUD
- **Product Master**: Complete product lifecycle management
- **Category/Subcategory**: Hierarchical category management
- **Brand/Manufacturer**: Brand information with CRUD
- **Batch Master**: Batch tracking with expiry management
- **Rack/Shelf/Location**: Storage location management
- **Warehouse/Godown**: Multi-warehouse support
- **Price List/Rate Master**: Dynamic pricing management
- **Reorder Level Master**: Stock threshold configurations

#### 4.1.3 Sales Masters CRUD
- **Sales Type Master**: Sales channel definitions
- **Invoice Series Master**: Automated numbering systems
- **Payment Terms Master**: Credit period configurations
- **Credit Limit Master**: Customer credit management
- **POS Settings Master**: Point of sale configurations
- **Return Reason Master**: Return categorization

#### 4.1.4 Purchase Masters CRUD
- **Vendor Master**: Supplier database management
- **Purchase Order Terms**: Default term configurations
- **PO Status Master**: Workflow status definitions
- **Price Comparison Master**: Vendor price tracking
- **GRN Template Master**: Receipt note templates

#### 4.1.5 Customer/CRM Masters CRUD
- **Customer Master**: Customer database with segmentation
- **Customer Group Master**: Group-based categorizations
- **Address Book Master**: Multi-address management
- **Loyalty Program Master**: Points and reward systems
- **Feedback Type Master**: Feedback categorization
- **Ticket Category Master**: Support ticket types

#### 4.1.6 HR & Staff Masters CRUD
- **Employee Master**: Staff information management
- **Department Master**: Department organization
- **Designation Master**: Role definitions
- **Shift Master**: Shift schedule management
- **Leave Type Master**: Leave policy configurations
- **Salary Structure Master**: Compensation frameworks

#### 4.1.7 Finance Masters CRUD
- **Ledger Master**: Chart of accounts management
- **Cost Center Master**: Cost allocation centers
- **Expense Category Master**: Expense classification
- **Bank Master**: Banking information management
- **Cheque Book Master**: Cheque tracking systems

#### 4.1.8 Marketing Masters CRUD
- **Campaign Type Master**: Campaign channel definitions
- **Template Master**: Message template management
- **Offer/Coupon Master**: Discount system management
- **Target Segment Master**: Customer segmentation rules
- **AI Prompt Template Master**: AI content prompt libraries

#### 4.1.9 Social Media Masters CRUD
- **Social Account Master**: Account management
- **Hashtag Library Master**: Hashtag collections
- **Blog Category Master**: Content categorization
- **Auto Post Schedule Master**: Posting schedule management
- **Media Library Master**: Asset management

#### 4.1.10 AI Masters CRUD
- **AI Agent Master**: Agent configuration
- **AI Task Master**: Task definition management
- **AI Prompt Library**: Prompt template management
- **Model Version Master**: AI model versioning
- **Business Rule Master**: Rule engine configurations

### 4.2 Module-Specific Requirements
**Overview**: Each of the 20 modules must implement comprehensive CRUD operations, API endpoints, and Next.js pages.

#### 4.2.1 Dashboard Module
- Real-time overview displays
- Quick action buttons
- Alert notifications
- Activity feed
- Branch selection
- Performance metrics

#### 4.2.2 Products Module
- Product CRUD with validation
- Category/Subcategory CRUD
- Brand management
- Batch tracking
- Price management
- Image upload and management
- Barcode/QR generation
- Import/Export functionality
- Variant management

#### 4.2.3 Inventory Module
- Stock level tracking
- Batch expiry monitoring
- Stock adjustment workflows
- Transfer management
- Reconciliation processes
- Low stock alerts
- Valuation calculations
- History tracking

#### 4.2.4 Sales Module
- POS interface
- Invoice generation
- Credit management
- Return processing
- Receipt management
- E-invoice compliance
- Customer history
- Payment processing

#### 4.2.5 Purchases Module
- PO creation and approval
- GRN processing
- Vendor payment tracking
- Return management
- Price comparison tools
- Reorder suggestions
- History tracking

#### 4.2.6 Customers Module
- Customer CRUD
- Group management
- Loyalty program
- Communication tracking
- Feedback management
- GST information
- Address management
- Purchase history

#### 4.2.7 Vendors Module
- Vendor CRUD
- Performance tracking
- Payment management
- Contract management
- Rating systems
- Outstanding tracking

#### 4.2.8 HR Module
- Employee CRUD
- Attendance tracking
- Leave management
- Payroll processing
- Performance evaluation
- Shift scheduling

#### 4.2.9 Finance Module
- Ledger management
- Expense tracking
- GST reporting
- Financial statements
- Voucher management
- Bank reconciliation

#### 4.2.10 Reports Module
- Report generation
- Export functionality
- Custom report builder
- Scheduled reports
- Data visualization

#### 4.2.11 Marketing Module
- Campaign CRUD
- Multi-channel support
- Segmentation tools
- Template management
- Performance tracking

#### 4.2.12 Social Media Module
- Account management
- Post scheduling
- Content generation
- Analytics integration
- Multi-platform support

#### 4.2.13 CRM Module
- Ticket management
- Follow-up systems
- Appointment booking
- Chat integration
- Feedback collection

#### 4.2.14 AI Module
- AI chat interface
- Content generation
- Forecasting tools
- Insight generation
- Workflow automation

#### 4.2.15 Analytics Module
- Dashboard creation
- KPI tracking
- Forecasting
- Performance analysis
- ROI calculations

#### 4.2.16 AI Campaigns Module
- Campaign generation
- Content creation
- Deployment automation
- Performance analysis

#### 4.2.17 AI Insights Module
- Daily summaries
- Action suggestions
- Prediction models
- Alert systems

#### 4.2.18 AI Demo Module
- Feature testing
- Prompt engineering
- Model comparison
- Training interfaces

#### 4.2.19 Settings Module
- Configuration management
- Integration setup
- Security settings
- Backup management

#### 4.2.20 User Profile Module
- Profile management
- Security settings
- Activity tracking
- Authentication

### 4.3 Technical Integration Requirements
**Overview**: All modules must integrate seamlessly with the technology stack.

#### 4.3.1 API Requirements
- RESTful endpoints for all CRUD operations
- GraphQL federation for complex queries
- JWT authentication on all endpoints
- Rate limiting and security headers
- Swagger/OpenAPI documentation
- Versioned API endpoints
- Error handling and logging

#### 4.3.2 Database Requirements
- PostgreSQL with proper indexing
- ORM integration (Prisma/Drizzle)
- Migration scripts for schema changes
- Backup and recovery procedures
- Audit trail implementation
- Vector database (pgVector) for AI features

#### 4.3.3 Event System Requirements
- Kafka event publishing for major changes
- Event consumers for background processing
- Retry mechanisms for failed events
- Dead letter queue management
- Event schema definitions

#### 4.3.4 Frontend Requirements
- Next.js pages for all modules
- Responsive design (mobile/desktop)
- Form validation and error handling
- Real-time updates (WebSocket/GraphQL subscriptions)
- Search and filtering capabilities
- Export functionality (PDF/Excel)
- Accessibility compliance (WCAG 2.1)

#### 4.3.5 AI Integration Requirements
- LLM integration (OpenAI with fallbacks)
- RAG implementation for contextual responses
- Vector embeddings for similarity search
- Model fine-tuning capabilities
- Prompt engineering interfaces
- AI suggestion systems

#### 4.3.6 Security Requirements
- JWT-based authentication
- RBAC with granular permissions
- Data encryption (at rest and in transit)
- API rate limiting
- Input validation and sanitization
- Audit logging for all actions
- 2FA support

#### 4.3.7 Performance Requirements
- Response times: <5ms for core APIs
- Concurrent user support: 10,000+
- Database query optimization
- Caching strategies (Redis)
- CDN integration for static assets
- Background job processing</parameter,

## 5. Non-Functional Requirements

### 5.1 Performance Requirements
- API response times: <5ms for Golang/Fastify, <20ms for Express, <25ms for NestJS
- System must handle 10,000+ concurrent users
- Database queries must complete within 100ms
- AI processing must complete within 500ms

### 5.2 Security Requirements
- All data must be encrypted in transit and at rest
- API rate limiting must prevent abuse
- Authentication must use industry-standard practices
- Regular security audits and updates required

### 5.3 Reliability and Availability
- System uptime target: 99.9%
- Automated backup and recovery procedures
- Graceful degradation during service failures
- Comprehensive error handling and logging

### 5.4 Scalability Requirements
- Horizontal scaling support for all services
- Database must support read replicas
- Caching layer for improved performance
- Event-driven architecture for loose coupling

### 5.5 Usability Requirements
- Intuitive user interface design
- Responsive layout for all devices
- Accessibility compliance (WCAG 2.1)
- Comprehensive user documentation

## 6. System Architecture

### 6.1 High-Level Architecture
The system follows a microservices architecture with the following layers:

**Client Layer**: Web App (Next.js), Mobile App (React), Admin Panel (Next.js)
**Gateway Layer**: API Gateway (Port 5000), GraphQL Gateway (Port 4000)
**Service Layer**: Golang API, Express API, NestJS API, Fastify API, Python AI Service, Auth Service, Worker Services
**Data & Event Layer**: PostgreSQL, Redis, Kafka, MinIO

### 6.2 Data Flow
1. Client requests routed through API Gateway or GraphQL Gateway
2. Gateway forwards requests to appropriate microservices
3. Services process requests and interact with databases
4. Events published to Kafka for asynchronous processing
5. Workers consume events for background tasks
6. Responses aggregated and returned to clients

### 6.3 Integration Points
- External APIs (OpenAI, payment gateways)
- Third-party services (SMS, Email providers)
- File storage (MinIO for media assets)
- Message queues (Kafka for event streaming)

## 7. Assumptions and Dependencies

### 7.1 Assumptions
- Docker and containerization tools are available
- Internet connectivity for external API calls
- Sufficient hardware resources for containerized services
- Team has expertise in specified technologies

### 7.2 Dependencies
- PostgreSQL 15 with pgVector extension
- Redis 7 for caching and sessions
- Apache Kafka for event streaming
- Node.js 20.x runtime environment
- Go 1.22 compiler and runtime
- Python 3.11 for AI services
- OpenAI API key for AI features

## 7. Master Data Management

The system is built on comprehensive master data that serves as the foundation for all ERP modules. Below is a detailed list of all master tables required for complete functionality.

### 7.1 System-Wide Masters (Core Masters)
These masters are used across all modules.

| Master Name | Purpose |
|-------------|---------|
| Company Profile | Business settings and configuration |
| Branch / Store Master | Multiple branches and locations |
| Department Master | HR, Sales, Inventory departments |
| Role & Permission Master | User access control (RBAC) |
| User / Staff Master | Login users and profiles |
| Currency Master | INR, USD, etc. |
| Tax/GST Master | GST slabs and rates |
| Units of Measure (UOM) | ml, gm, bottle, strip |
| Payment Methods | Cash, Card, UPI, Credit |
| Notification Templates | SMS/WhatsApp/Email templates |
| AI Model Settings | AI configuration |
| Integration Keys | API keys for external services |

### 7.2 Product & Inventory Masters

| Master Name | Purpose |
|-------------|---------|
| Product Master | Base product information |
| SKU / Item Code Master | Internal product codes |
| Category Master | e.g., Mother Tincture, Biochemic |
| Subcategory Master | e.g., Kidney Care, Respiratory |
| Brand / Manufacturer Master | e.g., SBL, Dr. Reckeweg |
| Product Group / Segment | For grouping products |
| Potency Master | e.g., 30C, 200C, 1M |
| Size / Packing Master | 30ml, 100ml, etc. |
| Variant Master | e.g., Liquid, Tablets |
| Batch Master | Batch No, Expiry dates |
| Rack / Shelf / Location Master | Storage locations |
| Warehouse / Godown Master | Multiple storage facilities |
| HSN Code Master | GST compliance codes |
| Tax Slab Master | GST percentage rates |
| Price List / Rate Master | Purchase Price, MRP, Selling Price |
| Discount/Offer Master | Default discounts |
| Reorder Level Master | Min/Max stock levels |

### 7.3 Sales Masters

| Master Name | Purpose |
|-------------|---------|
| Sales Type Master | Retail, Wholesale, D2D |
| Invoice Series Master | Bill numbering system |
| Price Level Master | Retail vs Dealer pricing |
| Salesperson / Agent Master | Commission setup |
| Payment Terms Master | Credit periods |
| Credit Limit Master | Maximum credit allowed |
| POS Settings Master | Point of Sale configuration |
| E-Invoice Template Master | PDF templates |
| Return Reason Master | Return categories |

### 7.4 Purchase Masters

| Master Name | Purpose |
|-------------|---------|
| Vendor Master | Supplier/Distributor information |
| Vendor Type Master | Manufacturer, Distributor |
| Purchase Order Terms | Default payment terms |
| PO Status Master | Draft, Approved, Received |
| Freight/Charges Master | Additional charges |
| Purchase Return Reason Master | Return reasons |
| Price Comparison Master | Vendor price history |
| GRN Template Master | Goods receipt notes |
| Purchase Tax Master | Tax application rules |

### 7.5 Customer / CRM Masters

| Master Name | Purpose |
|-------------|---------|
| Customer Master | Retail, B2B, VIP customers |
| Customer Group Master | B2B, B2C, VIP categories |
| Contact Type Master | Phone, Email, WhatsApp |
| Address Book Master | Shipping/Billing addresses |
| Loyalty Program Master | Points and rewards |
| Feedback Type Master | Complaint/Praise categories |
| Lead Source Master | Referral, Campaign sources |
| Follow-up Status Master | Pending/Done status |
| Ticket Category Master | Support issue types |

### 7.6 HR & Staff Masters

| Master Name | Purpose |
|-------------|---------|
| Employee Master | Staff information |
| Department Master | Sales, HR, Inventory departments |
| Designation Master | Manager, Clerk roles |
| Shift Master | Morning/Evening shifts |
| Attendance Rule Master | Work hours and rules |
| Leave Type Master | Casual, Sick leave types |
| Salary Structure Master | Basic pay and incentives |
| Commission Rule Master | Per sale commissions |
| Performance Metric Master | KPI definitions |

### 7.7 Finance & Accounting Masters

| Master Name | Purpose |
|-------------|---------|
| Ledger Master | Chart of accounts |
| Cost Center Master | Branch, Project centers |
| Payment Voucher Type | Cash, Bank, UPI |
| Expense Category Master | Rent, Salary categories |
| GST Return Period Master | Monthly/Quarterly periods |
| Bank Master | Bank account details |
| Cheque Book Master | Cheque tracking |
| Vendor/Customer Ledger Master | Outstanding management |

### 7.8 Marketing & Campaign Masters

| Master Name | Purpose |
|-------------|---------|
| Campaign Type Master | WhatsApp, SMS, Email |
| Template Master | Message templates |
| Offer/Coupon Master | Discount management |
| Target Segment Master | Customer groupings |
| Channel Config Master | API credentials |
| Post Scheduler Master | Scheduling settings |
| AI Prompt Template Master | Content generation |
| Festival/Event Master | Diwali, New Year events |

### 7.9 Social Media & Automation Masters

| Master Name | Purpose |
|-------------|---------|
| Social Account Master | GMB, Insta, FB accounts |
| Hashtag Library Master | SEO and hashtag tags |
| Blog Category Master | WordPress categories |
| Auto Post Schedule Master | Daily posting schedules |
| Media Library Master | Images and videos |
| Workflow Rule Master | Automation rules |

### 7.10 AI & Insights Masters

| Master Name | Purpose |
|-------------|---------|
| AI Agent Master | Content, Insights agents |
| AI Task Master | Forecast, Reorder tasks |
| AI Prompt Library | Saved prompt templates |
| Model Version Master | LLM version management |
| Vector Index Master | Embedding storage |
| AI Action Template | Suggestion actions |
| Business Rule Master | Logic configuration |

### 7.11 Settings Masters

| Master Name | Purpose |
|-------------|---------|
| System Settings | Global configuration |
| SMS/Email Gateway | API key management |
| WhatsApp Gateway | API and phone setup |
| Backup Settings | Auto backup configuration |
| Notification Preference | Alert settings |
| Audit Log Settings | Change tracking |
| Security Policy | 2FA, Password rules |

### 7.12 User Profile / Security Masters

| Master Name | Purpose |
|-------------|---------|
| User Profile Master | Personal settings |
| Permission Master | CRUD access control |
| Activity Log Master | User action tracking |
| 2FA Settings Master | Two-factor authentication |
| Session Master | Login session tracking |

## 8. Appendices

### 8.1 Port Reference
| Port | Service | Status |
|------|---------|--------|
| 3000 | Next.js Frontend | In Development |
| 3001 | NestJS API | Needs Fixing |
| 3002 | Fastify API | In Development |
| 3003 | Express API | Production Ready |
| 3004 | Golang API | Production Ready |
| 4000 | GraphQL Gateway | In Development |
| 5000 | API Gateway | In Development |
| 8001 | Python AI Service | In Development |
| 5433 | PostgreSQL | Running |
| 6380 | Redis | Running |
| 9092 | Kafka | Running |

### 8.2 Demo Credentials
```
Email: admin@yeelo.com
Password: admin123
Role: ADMIN
```

### 8.3 Quick Start Commands
```bash
# Start infrastructure
./START-INFRA.sh

# Run smoke tests
./scripts/smoke-test.sh

# Start working services
cd services/api-golang && ./start.sh
cd services/api-express && node src/index-complete.js
```

---

**Version**: 1.0.0
**Last Updated**: October 15, 2025
**Status**: Production Infrastructure Ready, Services In Development
