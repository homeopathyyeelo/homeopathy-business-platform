# 📋 P1 FEATURES - DETAILED IMPLEMENTATION SPECS

## Priority 1 Features - Technical Specifications

---

## 🔧 Feature 1: Dynamic Report Builder

### **Overview**
User-configurable report builder with drag-drop fields, custom filters, and multiple export formats.

### **Backend (Golang v2 - Gin)**

#### **Models**
```go
// internal/models/report_template.go
type ReportTemplate struct {
    ID          uuid.UUID       `json:"id" gorm:"type:uuid;primary_key"`
    Name        string          `json:"name" gorm:"type:varchar(255);not null"`
    Description string          `json:"description" gorm:"type:text"`
    Module      string          `json:"module" gorm:"type:varchar(50)"` // sales, inventory, etc
    QueryConfig datatypes.JSON  `json:"query_config" gorm:"type:jsonb"` // fields, joins, conditions
    ChartType   string          `json:"chart_type" gorm:"type:varchar(50)"` // bar, line, pie, table
    ChartConfig datatypes.JSON  `json:"chart_config" gorm:"type:jsonb"`
    CreatedBy   uuid.UUID       `json:"created_by" gorm:"type:uuid"`
    IsPublic    bool            `json:"is_public" gorm:"default:false"`
    CreatedAt   time.Time       `json:"created_at"`
    UpdatedAt   time.Time       `json:"updated_at"`
}

type ReportExecution struct {
    ID          uuid.UUID       `json:"id" gorm:"type:uuid;primary_key"`
    TemplateID  uuid.UUID       `json:"template_id" gorm:"type:uuid"`
    Parameters  datatypes.JSON  `json:"parameters" gorm:"type:jsonb"`
    ResultData  datatypes.JSON  `json:"result_data" gorm:"type:jsonb"`
    Format      string          `json:"format"` // pdf, excel, csv
    Status      string          `json:"status"` // pending, completed, failed
    FileURL     string          `json:"file_url"`
    CreatedBy   uuid.UUID       `json:"created_by"`
    CreatedAt   time.Time       `json:"created_at"`
}
```

#### **Service Layer**
```go
// internal/services/report_builder.go
type ReportBuilderService struct {
    db *database.DB
}

func (s *ReportBuilderService) CreateTemplate(template *models.ReportTemplate) error
func (s *ReportBuilderService) GetTemplates(userID uuid.UUID) ([]models.ReportTemplate, error)
func (s *ReportBuilderService) ExecuteReport(templateID uuid.UUID, params map[string]interface{}) (*models.ReportExecution, error)
func (s *ReportBuilderService) ExportToPDF(executionID uuid.UUID) ([]byte, error)
func (s *ReportBuilderService) ExportToExcel(executionID uuid.UUID) ([]byte, error)
func (s *ReportBuilderService) ExportToCSV(executionID uuid.UUID) ([]byte, error)

// Dynamic Query Builder
func (s *ReportBuilderService) buildDynamicQuery(config QueryConfig) (string, []interface{}, error) {
    // Build SELECT clause from fields
    // Build JOIN clauses from relationships
    // Build WHERE clause from filters
    // Build GROUP BY from aggregations
    // Build ORDER BY from sorting
}
```

#### **API Endpoints**
```go
// internal/handlers/report_builder.go
POST   /api/reports/templates           // Create template
GET    /api/reports/templates           // List templates
GET    /api/reports/templates/:id       // Get template
PUT    /api/reports/templates/:id       // Update template
DELETE /api/reports/templates/:id       // Delete template
POST   /api/reports/execute             // Execute report
GET    /api/reports/executions/:id      // Get execution result
GET    /api/reports/export/:id/:format  // Export (pdf/excel/csv)
```

### **Frontend (Next.js)**

#### **Pages**
```typescript
// app/reports/builder/page.tsx
- Main report builder interface
- Field selector (drag-drop)
- Filter builder
- Chart configuration
- Preview panel
- Save/Load templates

// Components needed
/components/ReportBuilder/
  FieldSelector.tsx       // Drag-drop field selection
  FilterBuilder.tsx       // Dynamic filter UI
  ChartConfig.tsx         // Chart type and options
  PreviewPanel.tsx        // Live preview
  TemplateList.tsx        // Saved templates
  ExportOptions.tsx       // PDF/Excel/CSV export
```

#### **State Management**
```typescript
// hooks/useReportBuilder.ts
const useReportBuilder = () => {
  const [selectedFields, setSelectedFields] = useState([])
  const [filters, setFilters] = useState([])
  const [chartType, setChartType] = useState('table')
  const [preview, setPreview] = useState(null)
  
  const buildQuery = () => { /* ... */ }
  const executeReport = () => { /* ... */ }
  const exportReport = (format) => { /* ... */ }
}
```

### **Database Migration**
```sql
-- migrations/004_report_builder.sql
CREATE TABLE report_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    module VARCHAR(50),
    query_config JSONB NOT NULL,
    chart_type VARCHAR(50),
    chart_config JSONB,
    created_by UUID REFERENCES users(id),
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE report_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES report_templates(id),
    parameters JSONB,
    result_data JSONB,
    format VARCHAR(20),
    status VARCHAR(20),
    file_url TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_report_templates_created_by ON report_templates(created_by);
CREATE INDEX idx_report_executions_template_id ON report_executions(template_id);
```

### **Acceptance Criteria**
- [ ] User can select fields from dropdown
- [ ] User can add multiple filters with AND/OR
- [ ] User can choose chart type (bar, line, pie, table)
- [ ] Preview updates in real-time
- [ ] User can save template
- [ ] User can load saved template
- [ ] Export to PDF works
- [ ] Export to Excel works
- [ ] Export to CSV works
- [ ] Pagination works for large datasets
- [ ] Proper error handling

---

## ⚖️ Feature 2: Weighing Machine Integration

### **Overview**
Integrate weighing scales via serial port for automatic weight capture in POS.

### **Backend (Golang v1 - Fiber/Echo)**

#### **Dependencies**
```go
// go.mod additions
require (
    github.com/tarm/serial v0.0.0-20180830031419-95a93ba35726
    github.com/jacobsa/go-serial v0.0.0-20180131005756-15cf729a72d4
)
```

#### **Models**
```go
// models/weighing_machine.go
type WeighingMachine struct {
    ID          uuid.UUID       `json:"id" gorm:"type:uuid;primary_key"`
    Name        string          `json:"name" gorm:"type:varchar(255)"`
    Type        string          `json:"type"` // serial, usb, network
    Port        string          `json:"port"` // COM1, /dev/ttyUSB0, etc
    BaudRate    int             `json:"baud_rate"`
    DataBits    int             `json:"data_bits"`
    StopBits    int             `json:"stop_bits"`
    Parity      string          `json:"parity"`
    Protocol    string          `json:"protocol"` // toledo, mettler, custom
    Config      datatypes.JSON  `json:"config" gorm:"type:jsonb"`
    IsActive    bool            `json:"is_active" gorm:"default:true"`
    BranchID    uuid.UUID       `json:"branch_id"`
    CreatedAt   time.Time       `json:"created_at"`
}
```

#### **Service**
```go
// services/weighing_machine.go
import "github.com/tarm/serial"

type WeighingMachineService struct {
    machines map[uuid.UUID]*serial.Port
}

func (s *WeighingMachineService) Connect(machineID uuid.UUID) error {
    machine, err := s.getMachine(machineID)
    if err != nil {
        return err
    }
    
    config := &serial.Config{
        Name:     machine.Port,
        Baud:     machine.BaudRate,
        Size:     byte(machine.DataBits),
        StopBits: serial.StopBits(machine.StopBits),
    }
    
    port, err := serial.OpenPort(config)
    if err != nil {
        return err
    }
    
    s.machines[machineID] = port
    return nil
}

func (s *WeighingMachineService) ReadWeight(machineID uuid.UUID) (float64, error) {
    port, exists := s.machines[machineID]
    if !exists {
        return 0, errors.New("device not connected")
    }
    
    // Read from serial port
    buf := make([]byte, 128)
    n, err := port.Read(buf)
    if err != nil {
        return 0, err
    }
    
    // Parse weight based on protocol
    weight, err := s.parseWeight(buf[:n], machine.Protocol)
    return weight, err
}

func (s *WeighingMachineService) parseWeight(data []byte, protocol string) (float64, error) {
    // Protocol-specific parsing
    switch protocol {
    case "toledo":
        return parseToledoFormat(data)
    case "mettler":
        return parseMettlerFormat(data)
    default:
        return parseGenericFormat(data)
    }
}

func (s *WeighingMachineService) Calibrate(machineID uuid.UUID, knownWeight float64) error
func (s *WeighingMachineService) GetStatus(machineID uuid.UUID) (string, error)
func (s *WeighingMachineService) Disconnect(machineID uuid.UUID) error
```

#### **API Endpoints**
```go
POST   /api/hardware/weighing/machines      // Add machine
GET    /api/hardware/weighing/machines      // List machines
PUT    /api/hardware/weighing/machines/:id  // Update config
POST   /api/hardware/weighing/connect/:id   // Connect to device
GET    /api/hardware/weighing/read/:id      // Read weight
POST   /api/hardware/weighing/calibrate/:id // Calibrate
GET    /api/hardware/weighing/status/:id    // Get status
POST   /api/hardware/weighing/disconnect/:id // Disconnect
```

### **Frontend**

#### **Configuration Page**
```typescript
// app/settings/hardware/weighing/page.tsx
- List configured machines
- Add new machine form
- Test connection button
- Calibration interface
- Real-time weight display
```

#### **POS Integration**
```typescript
// app/sales/pos/page.tsx additions
- Weight capture button
- Auto-weight display
- Weight-based pricing
- Connect to weighing machine on load

// Component
const WeightCapture = ({ onWeightCaptured }) => {
  const [weight, setWeight] = useState(0)
  const [connected, setConnected] = useState(false)
  
  const captureWeight = async () => {
    const response = await api.hardware.weighing.read(machineId)
    setWeight(response.weight)
    onWeightCaptured(response.weight)
  }
  
  return (
    <div>
      <Button onClick={captureWeight}>Capture Weight</Button>
      <div>Weight: {weight} kg</div>
    </div>
  )
}
```

### **Database Migration**
```sql
CREATE TABLE weighing_machines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50),
    port VARCHAR(100),
    baud_rate INTEGER,
    data_bits INTEGER,
    stop_bits INTEGER,
    parity VARCHAR(10),
    protocol VARCHAR(50),
    config JSONB,
    is_active BOOLEAN DEFAULT true,
    branch_id UUID REFERENCES branches(id),
    created_at TIMESTAMP DEFAULT NOW()
);
```

### **Acceptance Criteria**
- [ ] Device can be configured via UI
- [ ] Connection test works
- [ ] Weight reading is accurate
- [ ] Calibration works correctly
- [ ] POS captures weight automatically
- [ ] Weight-based pricing calculates correctly
- [ ] Handles connection errors gracefully
- [ ] Supports multiple protocols (Toledo, Mettler)

---

## 📱 Feature 3: Enhanced Customer Display

### **Overview**
Secondary display showing items and prices to customers during billing.

### **Backend**
```go
// WebSocket endpoint for real-time updates
GET /api/pos/display/ws/:sessionId

// Service
type CustomerDisplayService struct {
    sessions map[uuid.UUID]*websocket.Conn
}

func (s *CustomerDisplayService) BroadcastUpdate(sessionID uuid.UUID, data interface{}) error
func (s *CustomerDisplayService) AddItem(sessionID uuid.UUID, item POSItem) error
func (s *CustomerDisplayService) UpdateTotal(sessionID uuid.UUID, total float64) error
```

### **Frontend**
```typescript
// app/sales/customer-display/page.tsx
- Large font display
- Item list with prices
- Running total
- Payment confirmation
- Thank you message
- WebSocket connection

const CustomerDisplay = () => {
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  
  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:3005/api/pos/display/ws/${sessionId}`)
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'add_item') {
        setItems([...items, data.item])
      }
      if (data.type === 'update_total') {
        setTotal(data.total)
      }
    }
  }, [])
}
```

### **Acceptance Criteria**
- [ ] Displays in real-time as cashier scans
- [ ] Large, readable font
- [ ] Shows item name, quantity, price
- [ ] Running total updated instantly
- [ ] Payment confirmation shown
- [ ] Works on secondary monitor
- [ ] Handles reconnection gracefully

---

## 🌐 Feature 4: GMB Social Posting

### **Overview**
Google My Business integration for automated posting.

### **Backend (Fastify)**
```typescript
// services/gmb.service.ts
import { google } from 'googleapis'

class GMBService {
  private oauth2Client
  
  async authenticate(credentials) {
    // OAuth2 flow
  }
  
  async createPost(locationId: string, post: GMBPost) {
    const mybusiness = google.mybusiness({ version: 'v4', auth: this.oauth2Client })
    
    const postData = {
      languageCode: 'en',
      summary: post.summary,
      media: post.media.map(url => ({ mediaFormat: 'PHOTO', sourceUrl: url })),
      callToAction: post.callToAction,
      topicType: 'STANDARD'
    }
    
    await mybusiness.accounts.locations.localPosts.create({
      parent: `accounts/${accountId}/locations/${locationId}`,
      requestBody: postData
    })
  }
  
  async schedulePost(post: GMBPost, scheduledTime: Date) {
    // Add to queue
  }
  
  async getInsights(locationId: string) {
    // Fetch GMB insights
  }
}
```

### **API Endpoints**
```typescript
POST /api/social/gmb/auth           // OAuth authentication
POST /api/social/gmb/post           // Create post
GET  /api/social/gmb/locations      // List locations
POST /api/social/gmb/schedule       // Schedule post
GET  /api/social/gmb/insights/:id   // Get insights
```

### **Frontend**
```typescript
// app/marketing/social/gmb/page.tsx
- OAuth connection button
- Post creation form
- Media upload
- Scheduling interface
- Insights dashboard
```

### **Acceptance Criteria**
- [ ] OAuth flow works
- [ ] Can create posts with media
- [ ] Scheduling works correctly
- [ ] Posts appear on GMB
- [ ] Insights data fetched
- [ ] Error handling for API limits

---

## 📊 Feature 5: Grafana Dashboards

### **Kubernetes Deployment**
```yaml
# k8s/monitoring/grafana.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: grafana
spec:
  replicas: 1
  template:
    spec:
      containers:
      - name: grafana
        image: grafana/grafana:latest
        ports:
        - containerPort: 3000
        env:
        - name: GF_SECURITY_ADMIN_PASSWORD
          valueFrom:
            secretKeyRef:
              name: grafana-secrets
              key: admin-password
        volumeMounts:
        - name: grafana-storage
          mountPath: /var/lib/grafana
        - name: dashboards
          mountPath: /etc/grafana/provisioning/dashboards
        - name: datasources
          mountPath: /etc/grafana/provisioning/datasources
```

### **Dashboards**
1. **System Health** - Service uptime, request rates, error rates
2. **Business Metrics** - Sales, revenue, top products
3. **API Performance** - Latency, throughput, errors
4. **Infrastructure** - CPU, memory, database connections

### **Acceptance Criteria**
- [ ] Grafana accessible via K8s service
- [ ] Prometheus data source configured
- [ ] All 4 dashboards created
- [ ] Auto-refresh enabled
- [ ] Alerts configured
- [ ] Accessible to admin users

---

## ✅ IMPLEMENTATION TIMELINE

**Week 1:**
- Days 1-2: Grafana Setup
- Days 3-4: Customer Display
- Days 5-7: Report Builder (Start)

**Week 2:**
- Days 1-4: Report Builder (Complete)
- Days 4-7: Weighing Machine

**Week 3:**
- Days 1-3: GMB Posting
- Days 4-5: Testing & QA
- Days 6-7: Documentation

**Total: 3 weeks for all P1 features**

---

**Status:** Ready for Implementation  
**Estimated Effort:** 16-18 dev-days  
**Priority:** HIGH
