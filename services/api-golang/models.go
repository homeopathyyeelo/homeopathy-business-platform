package main

import (
	"time"

	"gorm.io/gorm"
)

// GORM Models for Homeopathy ERP Platform
// These models replace the raw SQL operations with type-safe ORM

// BaseEntity provides common fields for all models
type BaseEntity struct {
	ID        string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"autoUpdateTime" json:"updated_at"`
	IsActive  bool      `gorm:"default:true" json:"is_active"`
}

// WorkflowDefinition represents core workflow configurations
type WorkflowDefinition struct {
	BaseEntity
	Name         string                 `gorm:"not null;size:255" json:"name" validate:"required,min=3,max=255"`
	Description  string                 `gorm:"type:text" json:"description"`
	Category     string                 `gorm:"not null;size:100" json:"category" validate:"required"`
	Steps        []WorkflowStep         `gorm:"foreignKey:WorkflowDefinitionID" json:"steps"`
	Triggers     []WorkflowTrigger      `gorm:"foreignKey:WorkflowDefinitionID" json:"triggers"`
	AutomationRules []AutomationRule     `gorm:"foreignKey:WorkflowDefinitionID" json:"automation_rules"`
	SLAHours     *int                   `gorm:"default:24" json:"sla_hours"`
	Priority     string                 `gorm:"not null;default:medium;size:20" json:"priority" validate:"oneof=low medium high critical"`
	Executions   []WorkflowExecution    `gorm:"foreignKey:WorkflowDefinitionID" json:"executions,omitempty"`
}

// WorkflowExecution tracks runtime execution of workflows
type WorkflowExecution struct {
	BaseEntity
	WorkflowDefinitionID string                 `gorm:"not null;index" json:"workflow_definition_id"`
	Status               string                 `gorm:"not null;default:pending;size:20" json:"status" validate:"oneof=pending running completed failed cancelled"`
	StartTime            time.Time              `gorm:"not null;autoCreateTime" json:"start_time"`
	EndTime              *time.Time             `gorm:"null" json:"end_time"`
	CurrentStep          string                 `gorm:"size:255" json:"current_step"`
	ExecutedSteps        []string               `gorm:"type:jsonb" json:"executed_steps"`
	StepExecutions       []StepExecution        `gorm:"foreignKey:WorkflowExecutionID" json:"step_executions"`
	TriggeredBy          string                 `gorm:"not null;size:100" json:"triggered_by" validate:"required"`
	TriggerType          string                 `gorm:"not null;size:50" json:"trigger_type" validate:"required"`
	Variables            map[string]interface{} `gorm:"type:jsonb" json:"variables"`
	Errors               []WorkflowError        `gorm:"foreignKey:WorkflowExecutionID" json:"errors"`
}

// WorkflowStep defines individual steps in a workflow
type WorkflowStep struct {
	BaseEntity
	WorkflowDefinitionID string                 `gorm:"not null;index" json:"workflow_definition_id"`
	Name                 string                 `gorm:"not null;size:255" json:"name" validate:"required"`
	Description          string                 `gorm:"type:text" json:"description"`
	StepType             string                 `gorm:"not null;size:50" json:"step_type" validate:"required"`
	Order                int                    `gorm:"not null" json:"order" validate:"min=0"`
	EstimatedDuration    int                    `gorm:"default:5" json:"estimated_duration"` // minutes
	RequiredPermissions  []string               `gorm:"type:jsonb" json:"required_permissions"`
	InputData            map[string]interface{} `gorm:"type:jsonb" json:"input_data"`
	OutputData           map[string]interface{} `gorm:"type:jsonb" json:"output_data"`
	Conditions           []WorkflowCondition    `gorm:"foreignKey:WorkflowStepID" json:"conditions"`
	Actions              []WorkflowAction       `gorm:"foreignKey:WorkflowStepID" json:"actions"`
	NextSteps            []string               `gorm:"type:jsonb" json:"next_steps"`
	ParallelSteps        []string               `gorm:"type:jsonb" json:"parallel_steps"`
}

// WorkflowTrigger defines what triggers a workflow
type WorkflowTrigger struct {
	BaseEntity
	WorkflowDefinitionID string             `gorm:"not null;index" json:"workflow_definition_id"`
	EventType            string             `gorm:"not null;size:100" json:"event_type" validate:"required"`
	Conditions           []WorkflowCondition `gorm:"foreignKey:WorkflowTriggerID" json:"conditions"`
	Schedule             *TriggerSchedule   `gorm:"embedded" json:"schedule"`
}

// TriggerSchedule defines scheduling information for triggers
type TriggerSchedule struct {
	Frequency   string `gorm:"size:50" json:"frequency" validate:"oneof=once daily weekly monthly"`
	Time        string `gorm:"size:8" json:"time"` // HH:MM format
	DaysOfWeek  []int  `gorm:"type:jsonb" json:"days_of_week"`
	DaysOfMonth []int  `gorm:"type:jsonb" json:"days_of_month"`
}

// WorkflowCondition defines conditions for workflow execution
type WorkflowCondition struct {
	BaseEntity
	WorkflowStepID    *string     `gorm:"index" json:"workflow_step_id,omitempty"`
	WorkflowTriggerID *string     `gorm:"index" json:"workflow_trigger_id,omitempty"`
	Field             string      `gorm:"not null;size:255" json:"field" validate:"required"`
	Operator          string      `gorm:"not null;size:20" json:"operator" validate:"oneof=equals not_equals greater_than less_than contains starts_with ends_with"`
	Value             interface{} `gorm:"type:jsonb" json:"value"`
	LogicalOperator   string      `gorm:"default:AND;size:3" json:"logical_operator" validate:"oneof=AND OR"`
}

// WorkflowAction defines actions to be taken in workflows
type WorkflowAction struct {
	BaseEntity
	WorkflowStepID   *string                `gorm:"index" json:"workflow_step_id,omitempty"`
	ActionType       string                 `gorm:"not null;size:100" json:"action_type" validate:"required"`
	TargetEntity     string                 `gorm:"not null;size:100" json:"target_entity" validate:"required"`
	Parameters       map[string]interface{} `gorm:"type:jsonb" json:"parameters"`
	SuccessMessage   string                 `gorm:"size:500" json:"success_message"`
	ErrorMessage     string                 `gorm:"size:500" json:"error_message"`
}

// StepExecution tracks execution of individual steps
type StepExecution struct {
	BaseEntity
	WorkflowExecutionID string                 `gorm:"not null;index" json:"workflow_execution_id"`
	StepID              string                 `gorm:"not null;index" json:"step_id"`
	StartTime           time.Time              `gorm:"not null" json:"start_time"`
	EndTime             *time.Time             `gorm:"null" json:"end_time"`
	Status              string                 `gorm:"not null;default:pending;size:20" json:"status" validate:"oneof=pending running completed failed skipped"`
	Input               map[string]interface{} `gorm:"type:jsonb" json:"input"`
	Output              map[string]interface{} `gorm:"type:jsonb" json:"output"`
	Error               *WorkflowError         `gorm:"foreignKey:StepExecutionID" json:"error"`
	RetryCount          int                    `gorm:"default:0" json:"retry_count"`
	MaxRetries          int                    `gorm:"default:3" json:"max_retries"`
}

// WorkflowError tracks errors during workflow execution
type WorkflowError struct {
	BaseEntity
	WorkflowExecutionID *string   `gorm:"index" json:"workflow_execution_id,omitempty"`
	StepExecutionID     *string   `gorm:"index" json:"step_execution_id,omitempty"`
	ErrorID             string    `gorm:"not null;size:255" json:"error_id" validate:"required"`
	ErrorType           string    `gorm:"not null;size:100" json:"error_type" validate:"required"`
	Message             string    `gorm:"type:text;not null" json:"message"`
	StackTrace          string    `gorm:"type:text" json:"stack_trace"`
	Timestamp           time.Time `gorm:"not null" json:"timestamp"`
	Resolved            bool      `gorm:"default:false" json:"resolved"`
	Resolution          string    `gorm:"type:text" json:"resolution"`
}

// AutomationRule defines automated rules for workflows
type AutomationRule struct {
	BaseEntity
	WorkflowDefinitionID string             `gorm:"not null;index" json:"workflow_definition_id"`
	Name                 string             `gorm:"not null;size:255" json:"name" validate:"required"`
	Trigger              WorkflowTrigger    `gorm:"embedded" json:"trigger"`
	Conditions           []WorkflowCondition `gorm:"foreignKey:AutomationRuleID" json:"conditions"`
	Actions              []WorkflowAction   `gorm:"foreignKey:AutomationRuleID" json:"actions"`
	IsActive             bool               `gorm:"default:true" json:"is_active"`
	LastExecuted         *time.Time         `gorm:"null" json:"last_executed"`
	ExecutionCount       int                `gorm:"default:0" json:"execution_count"`
	SuccessCount         int                `gorm:"default:0" json:"success_count"`
	FailureCount         int                `gorm:"default:0" json:"failure_count"`
}

// InventoryLevel represents real-time inventory data
type InventoryLevel struct {
	BaseEntity
	ProductID       string  `gorm:"not null;index" json:"product_id" validate:"required"`
	ProductName     string  `gorm:"not null;size:255" json:"product_name" validate:"required"`
	CurrentStock    int     `gorm:"not null;default:0" json:"current_stock" validate:"min=0"`
	ReservedStock   int     `gorm:"not null;default:0" json:"reserved_stock" validate:"min=0"`
	AvailableStock  int     `gorm:"not null;default:0" json:"available_stock" validate:"min=0"`
	ReorderLevel    int     `gorm:"default:10" json:"reorder_level" validate:"min=0"`
	MaxStockLevel   int     `gorm:"default:1000" json:"max_stock_level" validate:"min=0"`
	WarehouseID     string  `gorm:"not null;index" json:"warehouse_id" validate:"required"`
	LastUpdated     time.Time `gorm:"autoUpdateTime" json:"last_updated"`
	UnitCost        float64 `gorm:"type:decimal(10,2);default:0" json:"unit_cost" validate:"min=0"`
	TotalValue      float64 `gorm:"type:decimal(10,2);default:0" json:"total_value" validate:"min=0"`
}

// CustomerServiceMetric tracks customer support KPIs
type CustomerServiceMetric struct {
	BaseEntity
	AgentID           string        `gorm:"not null;index" json:"agent_id" validate:"required"`
	AgentName         string        `gorm:"not null;size:255" json:"agent_name" validate:"required"`
	TicketsResolved   int           `gorm:"default:0" json:"tickets_resolved" validate:"min=0"`
	TicketsOpen       int           `gorm:"default:0" json:"tickets_open" validate:"min=0"`
	AverageResolutionTime time.Duration `gorm:"type:interval" json:"average_resolution_time"`
	CustomerSatisfaction float64     `gorm:"default:0;check:satisfaction >= 0 AND satisfaction <= 5" json:"customer_satisfaction" validate:"min=0,max=5"`
	FirstResponseTime time.Duration `gorm:"type:interval" json:"first_response_time"`
	Department        string        `gorm:"not null;size:100" json:"department" validate:"required"`
	ShiftStart        time.Time     `gorm:"not null" json:"shift_start"`
	ShiftEnd          time.Time     `gorm:"not null" json:"shift_end"`
}

// FinancialMetric tracks financial dashboard data
type FinancialMetric struct {
	BaseEntity
	PeriodStart     time.Time `gorm:"not null;index" json:"period_start"`
	PeriodEnd       time.Time `gorm:"not null" json:"period_end"`
	Revenue         float64   `gorm:"type:decimal(15,2);default:0" json:"revenue" validate:"min=0"`
	CostOfGoodsSold float64   `gorm:"type:decimal(15,2);default:0" json:"cost_of_goods_sold" validate:"min=0"`
	GrossProfit     float64   `gorm:"type:decimal(15,2);default:0" json:"gross_profit" validate:"min=0"`
	OperatingExpenses float64 `gorm:"type:decimal(15,2);default:0" json:"operating_expenses" validate:"min=0"`
	NetProfit       float64   `gorm:"type:decimal(15,2);default:0" json:"net_profit" validate:"min=0"`
	CashFlow        float64   `gorm:"type:decimal(15,2);default:0" json:"cash_flow"`
	AccountsReceivable float64 `gorm:"type:decimal(15,2);default:0" json:"accounts_receivable" validate:"min=0"`
	AccountsPayable float64   `gorm:"type:decimal(15,2);default:0" json:"accounts_payable" validate:"min=0"`
	InventoryValue  float64   `gorm:"type:decimal(15,2);default:0" json:"inventory_value" validate:"min=0"`
	PeriodType      string    `gorm:"not null;size:20" json:"period_type" validate:"oneof=daily weekly monthly quarterly yearly"`
}

// MedicinePreparation tracks homeopathy-specific medicine preparation
type MedicinePreparation struct {
	BaseEntity
	MedicineID      string    `gorm:"not null;index" json:"medicine_id" validate:"required"`
	MedicineName    string    `gorm:"not null;size:255" json:"medicine_name" validate:"required"`
	Potency         string    `gorm:"not null;size:20" json:"potency" validate:"required"`
	DilutionRatio   string    `gorm:"not null;size:20" json:"dilution_ratio" validate:"required"`
	PreparationMethod string  `gorm:"not null;size:100" json:"preparation_method" validate:"required"`
	PreparationDate time.Time `gorm:"not null" json:"preparation_date"`
	ExpiryDate      time.Time `gorm:"not null" json:"expiry_date"`
	BatchNumber     string    `gorm:"not null;size:100" json:"batch_number" validate:"required"`
	Quantity        int       `gorm:"not null;default:0" json:"quantity" validate:"min=0"`
	QualityStatus   string    `gorm:"not null;default:pending;size:20" json:"quality_status" validate:"oneof=pending approved rejected"`
	ApprovedBy      string    `gorm:"size:255" json:"approved_by"`
	ApprovalDate    *time.Time `gorm:"null" json:"approval_date"`
	StorageConditions string  `gorm:"type:text" json:"storage_conditions"`
}

// QualityControl tracks quality control processes
type QualityControl struct {
	BaseEntity
	MedicinePreparationID string    `gorm:"not null;index" json:"medicine_preparation_id"`
	TestType             string    `gorm:"not null;size:100" json:"test_type" validate:"required"`
	TestResult           string    `gorm:"not null;size:20" json:"test_result" validate:"oneof=pass fail inconclusive"`
	TestDate             time.Time `gorm:"not null" json:"test_date"`
	TestedBy             string    `gorm:"not null;size:255" json:"tested_by" validate:"required"`
	TestParameters       map[string]interface{} `gorm:"type:jsonb" json:"test_parameters"`
	Notes                string    `gorm:"type:text" json:"notes"`
	CertificateNumber    string    `gorm:"size:100" json:"certificate_number"`
	ComplianceStatus     string    `gorm:"not null;default:compliant;size:20" json:"compliance_status" validate:"oneof=compliant non_compliant under_review"`
}

// Certification tracks compliance certifications
type Certification struct {
	BaseEntity
	CertificateType     string    `gorm:"not null;size:100" json:"certificate_type" validate:"required"`
	CertificateNumber   string    `gorm:"not null;size:100;uniqueIndex" json:"certificate_number" validate:"required"`
	IssuingAuthority    string    `gorm:"not null;size:255" json:"issuing_authority" validate:"required"`
	IssueDate           time.Time `gorm:"not null" json:"issue_date"`
	ExpiryDate          time.Time `gorm:"not null" json:"expiry_date"`
	Status              string    `gorm:"not null;default:active;size:20" json:"status" validate:"oneof=active expired revoked suspended"`
	Scope               string    `gorm:"type:text" json:"scope"`
	ComplianceLevel     string    `gorm:"not null;size:20" json:"compliance_level" validate:"oneof=basic standard advanced"`
	RenewalRequired     bool      `gorm:"default:true" json:"renewal_required"`
	LastRenewalDate     *time.Time `gorm:"null" json:"last_renewal_date"`
	NextRenewalDate     *time.Time `gorm:"null" json:"next_renewal_date"`
}

// DrugInteraction tracks potential drug interactions
type DrugInteraction struct {
	BaseEntity
	Medicine1ID      string  `gorm:"not null;index" json:"medicine_1_id" validate:"required"`
	Medicine1Name    string  `gorm:"not null;size:255" json:"medicine_1_name" validate:"required"`
	Medicine2ID      string  `gorm:"not null;index" json:"medicine_2_id" validate:"required"`
	Medicine2Name    string  `gorm:"not null;size:255" json:"medicine_2_name" validate:"required"`
	InteractionType  string  `gorm:"not null;size:50" json:"interaction_type" validate:"required"`
	Severity         string  `gorm:"not null;size:20" json:"severity" validate:"oneof=mild moderate severe critical"`
	Description      string  `gorm:"type:text;not null" json:"description"`
	ClinicalEvidence string  `gorm:"type:text" json:"clinical_evidence"`
	ManagementStrategy string `gorm:"type:text" json:"management_strategy"`
	Contraindicated  bool    `gorm:"default:false" json:"contraindicated"`
	LastReviewed     time.Time `gorm:"autoUpdateTime" json:"last_reviewed"`
	ReviewedBy       string  `gorm:"size:255" json:"reviewed_by"`
}

// ComplianceAudit tracks compliance audits
type ComplianceAudit struct {
	BaseEntity
	AuditType       string    `gorm:"not null;size:100" json:"audit_type" validate:"required"`
	AuditScope      string    `gorm:"type:text;not null" json:"audit_scope"`
	AuditorName     string    `gorm:"not null;size:255" json:"auditor_name" validate:"required"`
	AuditDate       time.Time `gorm:"not null" json:"audit_date"`
	Findings        []AuditFinding `gorm:"foreignKey:ComplianceAuditID" json:"findings"`
	OverallStatus   string    `gorm:"not null;size:20" json:"overall_status" validate:"oneof=compliant minor_issues major_issues critical_issues"`
	ComplianceScore float64   `gorm:"default:0;check:score >= 0 AND score <= 100" json:"compliance_score" validate:"min=0,max=100"`
	NextAuditDate   *time.Time `gorm:"null" json:"next_audit_date"`
	Recommendations string    `gorm:"type:text" json:"recommendations"`
	FollowUpActions []string  `gorm:"type:jsonb" json:"follow_up_actions"`
}

// AuditFinding represents individual findings in an audit
type AuditFinding struct {
	BaseEntity
	ComplianceAuditID string `gorm:"not null;index" json:"compliance_audit_id"`
	FindingType       string `gorm:"not null;size:50" json:"finding_type" validate:"required"`
	Description       string `gorm:"type:text;not null" json:"description"`
	Severity          string `gorm:"not null;size:20" json:"severity" validate:"oneof=low medium high critical"`
	Status            string `gorm:"not null;default:open;size:20" json:"status" validate:"oneof=open in_progress resolved closed"`
	AssignedTo        string `gorm:"size:255" json:"assigned_to"`
	DueDate           *time.Time `gorm:"null" json:"due_date"`
	Resolution        string `gorm:"type:text" json:"resolution"`
	ResolutionDate    *time.Time `gorm:"null" json:"resolution_date"`
}

// SupplyChainWorkflow tracks supply chain operations
type SupplyChainWorkflow struct {
	BaseEntity
	WorkflowName    string    `gorm:"not null;size:255" json:"workflow_name" validate:"required"`
	SupplyChainStage string   `gorm:"not null;size:50" json:"supply_chain_stage" validate:"required"`
	Status           string   `gorm:"not null;default:active;size:20" json:"status" validate:"oneof=active inactive completed"`
	StartDate       time.Time `gorm:"not null" json:"start_date"`
	EndDate         *time.Time `gorm:"null" json:"end_date"`
	Progress        float64   `gorm:"default:0;check:progress >= 0 AND progress <= 100" json:"progress" validate:"min=0,max=100"`
	Stakeholders    []string  `gorm:"type:jsonb" json:"stakeholders"`
	Milestones      []SupplyChainMilestone `gorm:"foreignKey:SupplyChainWorkflowID" json:"milestones"`
	RiskLevel       string    `gorm:"default:low;size:20" json:"risk_level" validate:"oneof=low medium high critical"`
	BudgetAllocated float64   `gorm:"type:decimal(15,2);default:0" json:"budget_allocated" validate:"min=0"`
	BudgetSpent     float64   `gorm:"type:decimal(15,2);default:0" json:"budget_spent" validate:"min=0"`
}

// SupplyChainMilestone represents milestones in supply chain workflows
type SupplyChainMilestone struct {
	BaseEntity
	SupplyChainWorkflowID string    `gorm:"not null;index" json:"supply_chain_workflow_id"`
	MilestoneName        string    `gorm:"not null;size:255" json:"milestone_name" validate:"required"`
	Description          string    `gorm:"type:text" json:"description"`
	DueDate              time.Time `gorm:"not null" json:"due_date"`
	CompletionDate       *time.Time `gorm:"null" json:"completion_date"`
	Status               string    `gorm:"not null;default:pending;size:20" json:"status" validate:"oneof=pending in_progress completed overdue cancelled"`
	ResponsibleParty     string    `gorm:"not null;size:255" json:"responsible_party" validate:"required"`
	Deliverables         []string  `gorm:"type:jsonb" json:"deliverables"`
	Progress             float64   `gorm:"default:0;check:progress >= 0 AND progress <= 100" json:"progress" validate:"min=0,max=100"`
}

// TransportationWorkflow tracks transportation and logistics
type TransportationWorkflow struct {
	BaseEntity
	WorkflowName     string    `gorm:"not null;size:255" json:"workflow_name" validate:"required"`
	TransportationMode string   `gorm:"not null;size:50" json:"transportation_mode" validate:"required"`
	Status           string    `gorm:"not null;default:active;size:20" json:"status" validate:"oneof=active inactive completed"`
	StartDate        time.Time `gorm:"not null" json:"start_date"`
	EstimatedArrival *time.Time `gorm:"null" json:"estimated_arrival"`
	ActualArrival    *time.Time `gorm:"null" json:"actual_arrival"`
	Origin           string    `gorm:"not null;size:255" json:"origin" validate:"required"`
	Destination      string    `gorm:"not null;size:255" json:"destination" validate:"required"`
	CargoDetails     map[string]interface{} `gorm:"type:jsonb" json:"cargo_details"`
	CarrierName      string    `gorm:"not null;size:255" json:"carrier_name" validate:"required"`
	TrackingNumber   string    `gorm:"size:100" json:"tracking_number"`
	ShippingCost     float64   `gorm:"type:decimal(10,2);default:0" json:"shipping_cost" validate:"min=0"`
	InsuranceValue   float64   `gorm:"type:decimal(10,2);default:0" json:"insurance_value" validate:"min=0"`
	CustomsStatus    string    `gorm:"default:pending;size:20" json:"customs_status" validate:"oneof=pending cleared detained"`
}

// InternationalWorkflow tracks international operations
type InternationalWorkflow struct {
	BaseEntity
	WorkflowName     string    `gorm:"not null;size:255" json:"workflow_name" validate:"required"`
	Country          string    `gorm:"not null;size:100" json:"country" validate:"required"`
	OperationType    string    `gorm:"not null;size:50" json:"operation_type" validate:"required"`
	Status           string    `gorm:"not null;default:active;size:20" json:"status" validate:"oneof=active inactive completed"`
	StartDate        time.Time `gorm:"not null" json:"start_date"`
	EndDate          *time.Time `gorm:"null" json:"end_date"`
	LocalPartner     string    `gorm:"not null;size:255" json:"local_partner" validate:"required"`
	LocalRegulations []string  `gorm:"type:jsonb" json:"local_regulations"`
	Currency         string    `gorm:"not null;size:3" json:"currency" validate:"required"`
	ExchangeRate     float64   `gorm:"default:1.0" json:"exchange_rate" validate:"min=0"`
	TaxRequirements  map[string]interface{} `gorm:"type:jsonb" json:"tax_requirements"`
	ComplianceStatus string    `gorm:"not null;default:compliant;size:20" json:"compliance_status" validate:"oneof=compliant non_compliant under_review"`
}

// CurrencyWorkflow tracks currency exchange operations
type CurrencyWorkflow struct {
	BaseEntity
	WorkflowName    string    `gorm:"not null;size:255" json:"workflow_name" validate:"required"`
	FromCurrency    string    `gorm:"not null;size:3" json:"from_currency" validate:"required"`
	ToCurrency      string    `gorm:"not null;size:3" json:"to_currency" validate:"required"`
	ExchangeRate    float64   `gorm:"not null" json:"exchange_rate" validate:"min=0"`
	Amount          float64   `gorm:"type:decimal(15,2);not null" json:"amount" validate:"min=0"`
	ConvertedAmount float64   `gorm:"type:decimal(15,2);not null" json:"converted_amount" validate:"min=0"`
	ExchangeDate    time.Time `gorm:"not null" json:"exchange_date"`
	Provider        string    `gorm:"not null;size:100" json:"provider" validate:"required"`
	TransactionID   string    `gorm:"size:100" json:"transaction_id"`
	Fees            float64   `gorm:"type:decimal(10,2);default:0" json:"fees" validate:"min=0"`
	Status          string    `gorm:"not null;default:completed;size:20" json:"status" validate:"oneof=pending processing completed failed"`
}

// LanguageWorkflow tracks multilingual operations
type LanguageWorkflow struct {
	BaseEntity
	WorkflowName    string    `gorm:"not null;size:255" json:"workflow_name" validate:"required"`
	SourceLanguage  string    `gorm:"not null;size:5" json:"source_language" validate:"required"`
	TargetLanguages []string  `gorm:"type:jsonb" json:"target_languages"`
	ContentType     string    `gorm:"not null;size:50" json:"content_type" validate:"required"`
	TranslationStatus string  `gorm:"not null;default:pending;size:20" json:"translation_status" validate:"oneof=pending in_progress completed failed"`
	Translator      string    `gorm:"size:255" json:"translator"`
	TranslationDate *time.Time `gorm:"null" json:"translation_date"`
	ReviewStatus    string    `gorm:"default:not_reviewed;size:20" json:"review_status" validate:"oneof=not_reviewed approved rejected needs_revision"`
	Reviewer        string    `gorm:"size:255" json:"reviewer"`
	ReviewDate      *time.Time `gorm:"null" json:"review_date"`
	QualityScore    float64   `gorm:"default:0;check:score >= 0 AND score <= 100" json:"quality_score" validate:"min=0,max=100"`
}

// CRMLifecycle tracks customer relationship management
type CRMLifecycle struct {
	BaseEntity
	CustomerID      string    `gorm:"not null;index" json:"customer_id" validate:"required"`
	CustomerName    string    `gorm:"not null;size:255" json:"customer_name" validate:"required"`
	LifecycleStage  string    `gorm:"not null;size:50" json:"lifecycle_stage" validate:"required"`
	EntryDate       time.Time `gorm:"not null" json:"entry_date"`
	ExitDate        *time.Time `gorm:"null" json:"exit_date"`
	Value           float64   `gorm:"type:decimal(15,2);default:0" json:"value" validate:"min=0"`
	Interactions    []CRMInteraction `gorm:"foreignKey:CRMLifecycleID" json:"interactions"`
	LastInteraction time.Time `gorm:"not null" json:"last_interaction"`
	NextFollowUp    *time.Time `gorm:"null" json:"next_follow_up"`
	Status          string    `gorm:"not null;default:active;size:20" json:"status" validate:"oneof=active inactive churned won"`
}

// CRMInteraction represents interactions with customers
type CRMInteraction struct {
	BaseEntity
	CRMLifecycleID  string    `gorm:"not null;index" json:"crm_lifecycle_id"`
	InteractionType string    `gorm:"not null;size:50" json:"interaction_type" validate:"required"`
	Channel         string    `gorm:"not null;size:50" json:"channel" validate:"required"`
	Subject         string    `gorm:"size:255" json:"subject"`
	Description     string    `gorm:"type:text" json:"description"`
	InteractionDate time.Time `gorm:"not null" json:"interaction_date"`
	AgentID         string    `gorm:"not null;size:255" json:"agent_id" validate:"required"`
	Outcome         string    `gorm:"size:50" json:"outcome"`
	FollowUpRequired bool     `gorm:"default:false" json:"follow_up_required"`
	FollowUpDate    *time.Time `gorm:"null" json:"follow_up_date"`
	Duration        int       `gorm:"default:0" json:"duration"` // minutes
}

// LoyaltyProgram tracks customer loyalty programs
type LoyaltyProgram struct {
	BaseEntity
	ProgramName     string    `gorm:"not null;size:255" json:"program_name" validate:"required"`
	Description     string    `gorm:"type:text" json:"description"`
	TierLevels      []LoyaltyTier `gorm:"foreignKey:LoyaltyProgramID" json:"tier_levels"`
	PointsCurrency  string    `gorm:"not null;size:10" json:"points_currency" validate:"required"`
	ExpirationDays  int       `gorm:"default:365" json:"expiration_days" validate:"min=1"`
	IsActive        bool      `gorm:"default:true" json:"is_active"`
	StartDate       time.Time `gorm:"not null" json:"start_date"`
	EndDate         *time.Time `gorm:"null" json:"end_date"`
	TotalMembers    int       `gorm:"default:0" json:"total_members"`
	ActiveMembers   int       `gorm:"default:0" json:"active_members"`
}

// LoyaltyTier represents tiers in a loyalty program
type LoyaltyTier struct {
	BaseEntity
	LoyaltyProgramID string    `gorm:"not null;index" json:"loyalty_program_id"`
	TierName        string    `gorm:"not null;size:100" json:"tier_name" validate:"required"`
	TierLevel       int       `gorm:"not null" json:"tier_level" validate:"min=1"`
	MinPoints       int       `gorm:"not null;default:0" json:"min_points" validate:"min=0"`
	MaxPoints       *int      `gorm:"null" json:"max_points" validate:"min=0"`
	Benefits        []string  `gorm:"type:jsonb" json:"benefits"`
	DiscountPercent float64   `gorm:"default:0;check:discount >= 0 AND discount <= 100" json:"discount_percent" validate:"min=0,max=100"`
	IsActive        bool      `gorm:"default:true" json:"is_active"`
}

// AnalyticsWorkflow tracks analytics and reporting workflows
type AnalyticsWorkflow struct {
	BaseEntity
	WorkflowName    string    `gorm:"not null;size:255" json:"workflow_name" validate:"required"`
	ReportType      string    `gorm:"not null;size:100" json:"report_type" validate:"required"`
	DataSources     []string  `gorm:"type:jsonb" json:"data_sources"`
	Schedule        string    `gorm:"not null;size:50" json:"schedule" validate:"required"`
	LastRun         *time.Time `gorm:"null" json:"last_run"`
	NextRun         *time.Time `gorm:"null" json:"next_run"`
	Status          string    `gorm:"not null;default:active;size:20" json:"status" validate:"oneof=active inactive failed"`
	Recipients      []string  `gorm:"type:jsonb" json:"recipients"`
	ReportFormat    string    `gorm:"not null;size:20" json:"report_format" validate:"oneof=pdf excel csv json"`
	Parameters      map[string]interface{} `gorm:"type:jsonb" json:"parameters"`
	ErrorMessage    string    `gorm:"type:text" json:"error_message"`
	ExecutionTime   *int      `gorm:"null" json:"execution_time"` // seconds
}

// MLModel tracks machine learning models
type MLModel struct {
	BaseEntity
	ModelName       string    `gorm:"not null;size:255" json:"model_name" validate:"required"`
	ModelType       string    `gorm:"not null;size:100" json:"model_type" validate:"required"`
	Version         string    `gorm:"not null;size:50" json:"version" validate:"required"`
	TrainingData    string    `gorm:"type:text" json:"training_data"`
	Accuracy        float64   `gorm:"default:0;check:accuracy >= 0 AND accuracy <= 1" json:"accuracy" validate:"min=0,max=1"`
	Precision       float64   `gorm:"default:0;check:precision >= 0 AND precision <= 1" json:"precision" validate:"min=0,max=1"`
	Recall          float64   `gorm:"default:0;check:recall >= 0 AND recall <= 1" json:"recall" validate:"min=0,max=1"`
	F1Score         float64   `gorm:"default:0;check:f1_score >= 0 AND f1_score <= 1" json:"f1_score" validate:"min=0,max=1"`
	TrainingDate    time.Time `gorm:"not null" json:"training_date"`
	LastUsed        *time.Time `gorm:"null" json:"last_used"`
	IsActive        bool      `gorm:"default:true" json:"is_active"`
	ModelFilePath   string    `gorm:"size:500" json:"model_file_path"`
	Metadata        map[string]interface{} `gorm:"type:jsonb" json:"metadata"`
}

// AutomationRule tracks automation rules (already defined above)

// Import required packages
import (
	"context"
	"fmt"
	"gorm.io/driver/postgres"
)
