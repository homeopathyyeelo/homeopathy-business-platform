// Advanced workflow types for comprehensive business processes
export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  category: 'homeopathy' | 'pharmacy' | 'supply-chain' | 'international' | 'analytics' | 'crm';
  steps: WorkflowStep[];
  triggers: WorkflowTrigger[];
  automationRules?: AutomationRule[];
  slaHours?: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  stepType: 'manual' | 'automated' | 'approval' | 'integration' | 'notification';
  order: number;
  estimatedDuration?: number; // in minutes
  requiredPermissions?: string[];
  inputData?: Record<string, any>;
  outputData?: Record<string, any>;
  conditions?: WorkflowCondition[];
  actions?: WorkflowAction[];
  nextSteps?: string[]; // step IDs
  parallelSteps?: string[]; // step IDs that can run in parallel
}

export interface WorkflowTrigger {
  id: string;
  eventType: 'manual' | 'schedule' | 'data-change' | 'api-call' | 'user-action';
  conditions: WorkflowCondition[];
  schedule?: {
    frequency: 'once' | 'daily' | 'weekly' | 'monthly' | 'quarterly';
    time?: string; // HH:MM format
    daysOfWeek?: number[]; // 0-6, Sunday = 0
    daysOfMonth?: number[]; // 1-31
  };
}

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not-equals' | 'greater-than' | 'less-than' | 'contains' | 'in' | 'not-in';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface WorkflowAction {
  actionType: 'create' | 'update' | 'delete' | 'notify' | 'integrate' | 'calculate' | 'validate';
  targetEntity: string;
  parameters: Record<string, any>;
  successMessage?: string;
  errorMessage?: string;
}

// Homeopathy-specific workflow types
export interface HomeopathyWorkflow extends WorkflowDefinition {
  category: 'homeopathy';
  medicineType: 'classical' | 'combination' | 'nosode' | 'sarcodes' | 'mother-tincture';
  potencyWorkflow?: PotencyWorkflow;
  dilutionWorkflow?: DilutionWorkflow;
  qualityControl?: QualityControlWorkflow;
}

export interface QualityControlWorkflow {
  tests: QualityTest[];
  standards: QualityStandard[];
  certifications: Certification[];
  batchTracking: boolean;
  documentation: QualityDocument[];
}

export interface QualityTest {
  testId: string;
  testName: string;
  testType: 'physical' | 'chemical' | 'biological' | 'microbiological' | 'organoleptic';
  required: boolean;
  frequency: 'per-batch' | 'daily' | 'weekly' | 'monthly';
  method: string;
  acceptanceCriteria: string;
  lastPerformed?: Date;
  nextDue?: Date;
  status: 'passed' | 'failed' | 'pending';
}

export interface QualityStandard {
  standardId: string;
  name: string;
  description: string;
  authority: 'usp' | 'bp' | 'ip' | 'who' | 'iso' | 'ayush' | 'custom';
  version: string;
  effectiveDate: Date;
  requirements: string[];
}

export interface Certification {
  certificationId: string;
  name: string;
  issuingAuthority: string;
  issueDate: Date;
  expiryDate?: Date;
  scope: string[];
  status: 'active' | 'expired' | 'suspended' | 'revoked';
  documents: string[];
}

export interface QualityDocument {
  documentId: string;
  name: string;
  type: 'sop' | 'protocol' | 'report' | 'certificate' | 'guideline';
  version: string;
  effectiveDate: Date;
  reviewDate?: Date;
  approvalStatus: 'draft' | 'review' | 'approved' | 'obsolete';
  content: string;
  attachments?: string[];
}

export interface PotencyWorkflow {
  baseSubstance: string;
  targetPotency: string;
  dilutionMethod: 'hahnemanian' | 'korsakovian' | 'continuous-flow';
  succussionCount: number;
  steps: PotencyStep[];
}

export interface PotencyStep {
  stepNumber: number;
  action: 'dilution' | 'succussion' | 'medication' | 'quality-check';
  materialUsed?: string;
  ratio?: string;
  duration?: number; // seconds for succussion
  notes?: string;
}

export interface DilutionWorkflow {
  motherTincture: string;
  targetDilution: string;
  alcoholPercentage: number;
  waterSource: string;
  steps: DilutionStep[];
}

export interface DilutionStep {
  stepNumber: number;
  action: 'measurement' | 'mixing' | 'succussion' | 'filtration' | 'bottling';
  measurements?: {
    substance: string;
    quantity: string;
    unit: string;
  }[];
  duration?: number;
  temperature?: number;
}

// Pharmacy compliance workflow types
export interface PharmacyComplianceWorkflow extends WorkflowDefinition {
  category: 'pharmacy';
  regulationType: 'schedule-h' | 'schedule-x' | 'narcotics' | 'ayush' | 'fda' | 'who-gmp';
  complianceChecks: ComplianceCheck[];
  auditTrail: AuditEntry[];
  documentationRequired: string[];
}

export interface ComplianceCheck {
  checkType: 'prescription-validation' | 'stock-verification' | 'expiry-check' | 'temperature-monitoring' | 'documentation-review';
  frequency: 'per-transaction' | 'daily' | 'weekly' | 'monthly' | 'quarterly';
  mandatory: boolean;
  lastPerformed?: Date;
  nextDue?: Date;
  status: 'passed' | 'failed' | 'pending' | 'overdue';
  notes?: string;
}

export interface AuditEntry {
  timestamp: Date;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  changes: Record<string, { old: any; new: any }>;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface DrugInteractionCheck {
  id: string;
  medicines: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  interactionType: 'pharmacokinetic' | 'pharmacodynamic' | 'pharmaceutical' | 'therapeutic';
  description: string;
  clinicalSignificance: string;
  managementStrategy: string;
  references: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Supply chain workflow types
export interface SupplyChainWorkflow extends WorkflowDefinition {
  category: 'supply-chain';
  supplyChainType: 'procurement' | 'manufacturing' | 'distribution' | 'returns';
  locations: LocationWorkflow[];
  transportation: TransportationWorkflow;
  inventoryOptimization: InventoryOptimizationWorkflow;
}

export interface LocationWorkflow {
  locationId: string;
  locationType: 'warehouse' | 'branch' | 'franchise' | 'supplier' | 'customer';
  role: 'source' | 'destination' | 'transit' | 'storage';
  operations: string[];
  capacity?: number;
  currentLoad?: number;
}

export interface TransportationWorkflow {
  mode: 'air' | 'sea' | 'road' | 'rail' | 'courier';
  carrier: string;
  trackingNumber?: string;
  estimatedDelivery: Date;
  actualDelivery?: Date;
  cost: number;
  currency: string;
  insurance?: number;
  temperatureControlled?: boolean;
  requiredDocuments: string[];
}

export interface InventoryOptimizationWorkflow {
  algorithm: 'min-max' | 'abc-analysis' | 'just-in-time' | 'vendor-managed' | 'ml-forecasting';
  parameters: Record<string, any>;
  recommendations: InventoryRecommendation[];
  lastRun: Date;
  nextRun: Date;
}

export interface InventoryRecommendation {
  productId: string;
  currentStock: number;
  recommendedStock: number;
  action: 'reorder' | 'transfer' | 'discontinue' | 'promote';
  confidence: number; // 0-1
  rationale: string;
}

// International expansion workflow types
export interface InternationalWorkflow extends WorkflowDefinition {
  category: 'international';
  targetMarkets: string[];
  currencyManagement: CurrencyWorkflow;
  languageManagement: LanguageWorkflow;
  regulatoryCompliance: RegulatoryComplianceWorkflow;
  localization: LocalizationWorkflow;
}

export interface CurrencyWorkflow {
  baseCurrency: string;
  targetCurrencies: string[];
  exchangeRateSource: 'manual' | 'ecb' | 'fixer' | 'custom-api';
  autoUpdate: boolean;
  updateFrequency: 'hourly' | 'daily' | 'weekly';
  conversionRules: CurrencyConversionRule[];
}

export interface CurrencyConversionRule {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  inverseRate: number;
  lastUpdated: Date;
  source: string;
}

export interface LanguageWorkflow {
  baseLanguage: string;
  supportedLanguages: string[];
  translationSource: 'manual' | 'google-translate' | 'deepl' | 'custom-service';
  rtlSupport: string[]; // languages that need RTL support
  dateFormats: Record<string, string>;
  numberFormats: Record<string, string>;
}

export interface RegulatoryComplianceWorkflow {
  countries: string[];
  regulations: Regulation[];
  complianceStatus: Record<string, 'compliant' | 'non-compliant' | 'pending' | 'exempt'>;
  lastAudit: Date;
  nextAudit: Date;
  responsiblePerson: string;
}

export interface Regulation {
  country: string;
  regulationName: string;
  regulationType: 'import' | 'export' | 'labeling' | 'packaging' | 'advertising' | 'pricing';
  requirements: string[];
  effectiveDate: Date;
  complianceDeadline?: Date;
  penalties?: string;
}

export interface LocalizationWorkflow {
  contentTypes: string[];
  translationProgress: Record<string, number>; // language -> percentage
  culturalAdaptations: Record<string, string[]>;
  legalRequirements: Record<string, string[]>;
}

// CRM and Loyalty workflow types
export interface CRMWorkflow extends WorkflowDefinition {
  category: 'crm';
  customerSegment: 'retail' | 'wholesale' | 'doctor' | 'hospital' | 'distributor';
  lifecycleStages: CustomerLifecycleStage[];
  communicationPreferences: CommunicationPreference[];
  loyaltyProgram: LoyaltyProgramWorkflow;
}

export interface CustomerLifecycleStage {
  stage: 'prospect' | 'new-customer' | 'active' | 'vip' | 'at-risk' | 'inactive' | 'former';
  entryCriteria: WorkflowCondition[];
  actions: WorkflowAction[];
  communicationFrequency: 'daily' | 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly';
  exitCriteria: WorkflowCondition[];
}

export interface CommunicationPreference {
  channel: 'email' | 'sms' | 'whatsapp' | 'phone' | 'mail';
  frequency: 'immediate' | 'daily-digest' | 'weekly' | 'monthly' | 'never';
  topics: string[];
  optInDate?: Date;
  optOutDate?: Date;
}

export interface LoyaltyProgramWorkflow {
  programType: 'points' | 'tier' | 'subscription' | 'referral' | 'cashback';
  earningRules: LoyaltyRule[];
  redemptionRules: LoyaltyRule[];
  tiers?: LoyaltyTier[];
  expiryPolicy: {
    pointsExpiryDays: number;
    tierDowngradeDays: number;
  };
}

export interface LoyaltyRule {
  trigger: string;
  condition: WorkflowCondition;
  reward: {
    type: 'points' | 'discount' | 'free-shipping' | 'bonus-product';
    value: number;
    description: string;
  };
  limit?: {
    perUser: number;
    perPeriod: number;
    periodType: 'day' | 'week' | 'month' | 'year';
  };
}

export interface LoyaltyTier {
  name: string;
  minPoints: number;
  benefits: string[];
  upgradeMessage?: string;
  downgradeMessage?: string;
}

// Analytics and ML workflow types
export interface AnalyticsWorkflow extends WorkflowDefinition {
  category: 'analytics';
  dataSources: string[];
  analysisTypes: ('descriptive' | 'diagnostic' | 'predictive' | 'prescriptive')[];
  mlModels: MLModel[];
  reportingFrequency: 'real-time' | 'hourly' | 'daily' | 'weekly' | 'monthly';
  recipients: string[];
}

export interface MLModel {
  modelId: string;
  modelType: 'forecasting' | 'classification' | 'clustering' | 'recommendation';
  algorithm: string;
  features: string[];
  target: string;
  accuracy: number;
  lastTrained: Date;
  nextTraining: Date;
  status: 'active' | 'training' | 'deprecated' | 'failed';
}

export interface AutomationRule {
  ruleId: string;
  name: string;
  trigger: WorkflowTrigger;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  active: boolean;
  lastExecuted?: Date;
  executionCount: number;
  successCount: number;
  failureCount: number;
}

// Workflow execution and monitoring types
export interface WorkflowExecution {
  executionId: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'paused';
  startTime: Date;
  endTime?: Date;
  currentStep?: string;
  executedSteps: string[];
  stepExecutions: StepExecution[];
  triggeredBy: string;
  triggerType: 'manual' | 'scheduled' | 'automated' | 'api';
  variables: Record<string, any>;
  errors?: WorkflowError[];
}

export interface StepExecution {
  stepId: string;
  startTime: Date;
  endTime?: Date;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  input: Record<string, any>;
  output?: Record<string, any>;
  error?: WorkflowError;
  retryCount: number;
  maxRetries: number;
}

export interface WorkflowError {
  errorId: string;
  stepId?: string;
  errorType: 'validation' | 'authorization' | 'integration' | 'data' | 'system';
  message: string;
  stackTrace?: string;
  timestamp: Date;
  resolved: boolean;
  resolution?: string;
}

// Workflow visualization types
export interface WorkflowVisualization {
  workflowId: string;
  layout: 'horizontal' | 'vertical' | 'circular' | 'hierarchical';
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  groups: WorkflowGroup[];
}

export interface WorkflowNode {
  id: string;
  type: 'start' | 'step' | 'decision' | 'parallel' | 'end' | 'milestone';
  position: { x: number; y: number };
  label: string;
  status?: 'completed' | 'active' | 'pending' | 'error';
  metadata?: Record<string, any>;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  type: 'success' | 'failure' | 'conditional' | 'parallel';
  condition?: WorkflowCondition;
  label?: string;
}

export interface WorkflowGroup {
  id: string;
  name: string;
  nodeIds: string[];
  color?: string;
  collapsed: boolean;
}
