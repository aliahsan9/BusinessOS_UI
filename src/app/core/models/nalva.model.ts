export interface NalvaOverview {
  activatedAgents: number;
  activeAgents: number;
  runningExecutions: number;
  completedTasks: number;
  failedExecutions: number;
  pendingApprovals: number;
  totalTokens: number;
  estimatedCostUsd: number;
  costIsEstimate: boolean;
  pricingVersion: string;
  workflowRuns: number;
  costAlert: boolean;
}

export interface NalvaAgentCard {
  key: string;
  name: string;
  description: string;
  role: string;
  category: string;
  status: string;
  health: string;
  isCustom: boolean;
  isCore: boolean;
  autonomyLevel: number;
  departmentName?: string;
  responsibilities: string[];
  recentExecution?: string;
  executions: number;
  tokens: number;
  estimatedCostUsd: number;
}

export interface NalvaToolInfo {
  name: string;
  description: string;
  isWrite: boolean;
  requiresApproval: boolean;
  approvalAction?: string;
  risk: string;
  integration: string;
  permissions: string[];
}

export interface NalvaAgentDetail extends NalvaAgentCard {
  healthMessage?: string;
  version: number;
  departmentId?: string;
  model?: string;
  temperature?: number;
  dailyExecutionLimit: number;
  monthlyTokenBudget: number;
  tools: NalvaToolInfo[];
  permissions: string[];
  workflows: string[];
  approvalActions: string[];
  usesKnowledge: boolean;
  executionAvailable: boolean;
  unavailableReason?: string;
}

export interface NalvaTask {
  id: string;
  agentKey: string;
  objective: string;
  status: string;
  priority: number;
  deadline?: string;
  runAfter: string;
  intervalMinutes?: number;
  attempt: number;
  lastError?: string;
  completedExecutionId?: string;
  createdAt: string;
  parentTaskId?: string;
}

export interface NalvaWorkflowStep {
  key: string;
  agentKey: string;
  objective: string;
  tools: string[];
  condition?: string;
  parallelGroup?: number;
  outputKey?: string;
}

export interface NalvaWorkflow {
  id: string;
  key: string;
  name: string;
  description: string;
  triggerKind: string;
  triggerEvent?: string;
  intervalMinutes?: number;
  isActive: boolean;
  steps: NalvaWorkflowStep[];
  version?: number;
  timeZoneId?: string;
  recurrenceKind?: string;
  localTimeOfDay?: string;
  daysOfWeek?: string;
  dayOfMonth?: number;
  isPaused?: boolean;
  maxConcurrentRuns?: number;
  nextRunAt?: string;
  lastRunAt?: string;
  isCancelled?: boolean;
  consecutiveFailures?: number;
  lastFailure?: string;
}

export interface NalvaReliabilitySnapshot {
  queuedTasks: number;
  runningTasks: number;
  deadLetterTasks: number;
  failedTasks: number;
  pendingApprovals: number;
  expiredApprovals: number;
  pendingEvents: number;
  deadLetterEvents: number;
  stuckRunningTasks: number;
  stuckRunningExecutions: number;
  stuckRunningEvents: number;
  failedWorkflowRunsToday: number;
  generatedAtUtc: string;
}

export interface NalvaAutomationDashboard {
  activeAutomations: number;
  pausedSchedules: number;
  scheduledAutomations: number;
  eventAutomations: number;
  runningExecutions: number;
  completedToday: number;
  failedToday: number;
  pendingApprovals: number;
  expiredApprovals: number;
  deadLetterTasks: number;
  agentActivity: NalvaAgentActivity[];
  upcomingSchedules: NalvaSchedule[];
  recentFailures: NalvaFailedAutomation[];
}

export interface NalvaSchedule {
  id: string;
  key: string;
  name: string;
  description: string;
  recurrenceKind: string;
  intervalMinutes?: number;
  timeZoneId: string;
  localTimeOfDay?: string;
  daysOfWeek?: string;
  dayOfMonth?: number;
  nextRunAt?: string;
  lastRunAt?: string;
  isActive: boolean;
  isPaused: boolean;
  isCancelled: boolean;
  maxConcurrentRuns: number;
  consecutiveFailures: number;
  lastFailure?: string;
}

export interface NalvaFailedAutomation {
  id: string;
  kind: string;
  name: string;
  agentKey?: string;
  status: string;
  error?: string;
  occurredAt: string;
  definitionId?: string;
  taskId?: string;
}

export interface NalvaAgentActivity {
  agentKey: string;
  displayName: string;
  status: string;
  executionsToday: number;
  failuresToday: number;
  pendingApprovals: number;
  lastActivityAt?: string;
}

export interface NalvaAutomationRule {
  id: string;
  key: string;
  name: string;
  description: string;
  triggerKind: string;
  triggerEvent?: string;
  condition?: string;
  recurrenceKind: string;
  intervalMinutes?: number;
  timeZoneId: string;
  isEnabled: boolean;
  isPaused: boolean;
  agentKeys: string[];
  steps: NalvaWorkflowStep[];
  version: number;
  nextRunAt?: string;
}

export interface NalvaApprovalPolicy {
  approvalExpiryDays: number;
  notifyPendingApprovals: boolean;
  autoExpireApprovals: boolean;
  requireApprovalForExternalActions: boolean;
  extraApprovalTools: string[];
  catalogApprovalTools: string[];
}

export interface NalvaWorkflowRun {
  id: string;
  definitionId: string;
  workflowName: string;
  status: string;
  currentStep: number;
  summary?: string;
  error?: string;
  startedAt: string;
  completedAt?: string;
  triggerSource?: string;
  isDryRun?: boolean;
  estimatedCostUsd?: number;
}

export interface NalvaApproval {
  id: string;
  executionId: string;
  agentKey: string;
  action: string;
  toolName: string;
  risk: string;
  contextJson?: string;
  status: string;
  requestedAt: string;
  requestedByUserId?: string;
  approverUserId?: string;
  decidedAt?: string;
  decisionNote?: string;
  executionResult?: string;
  workflowRunId?: string;
  workflowName?: string;
  taskObjective?: string;
  relatedEntitySummary?: string;
  amountSummary?: string;
  riskSummary?: string;
  expiresAt?: string;
  argsFingerprint?: string;
  exactActionParametersJson?: string;
}

export interface NalvaObjectivePlan {
  objective: string;
  workflowKey: string;
  workflowName: string;
  description: string;
  confidence: number;
  requiredAgents: string[];
  missingAgents: string[];
  steps: NalvaWorkflowStep[];
  clarifyingQuestions: string[];
  canStart: boolean;
  blockReason?: string;
  workflowDefinitionId?: string;
  workflowRunId?: string;
  runStatus?: string;
  reportSummary?: string;
}

export interface NalvaCollaborationWorkflowInfo {
  key: string;
  name: string;
  description: string;
  category: string;
  agents: string[];
  isActive: boolean;
  definitionId?: string;
}

export interface NalvaWorkforceBoard {
  overview: NalvaOverview;
  agents: NalvaAgentCard[];
  activeWorkflows: NalvaWorkflowRun[];
  recentWorkflows: NalvaWorkflowRun[];
  failedOrBlockedTasks: NalvaTask[];
  pendingApprovals: NalvaApproval[];
  recentExecutions: NalvaExecution[];
  collaborationWorkflows: NalvaCollaborationWorkflowInfo[];
  estimatedCostUsdThisMonth: number;
  costIsEstimate: boolean;
}

export interface NalvaWorkflowDetail {
  run: NalvaWorkflowRun;
  steps: NalvaWorkflowStep[];
  contextJson: string;
  stepLogJson: string;
  executions: NalvaExecution[];
  approvals: NalvaApproval[];
  agentResults: Array<{
    taskId: string;
    agentKey: string;
    status: string;
    verified: boolean;
    summary: string;
  }>;
  finalReport: string;
}

export interface NalvaKnowledge {
  id: string;
  agentKey?: string;
  title: string;
  excerpt: string;
  createdAt: string;
}

export interface NalvaMemory {
  id: string;
  agentKey: string;
  kind: string;
  title: string;
  excerpt: string;
  createdAt: string;
}

export interface NalvaExecution {
  id: string;
  agentKey: string;
  taskId?: string;
  startedAt: string;
  completedAt?: string;
  status: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  toolCallCount: number;
  approvalCount: number;
  retryAttempt: number;
  durationMs: number;
  estimatedCostUsd: number;
  costIsEstimate: boolean;
  error?: string;
  summary?: string;
}

export interface NalvaAnalytics {
  executions: number;
  succeeded: number;
  failed: number;
  successRate: number;
  averageDurationMs: number;
  tokens: number;
  estimatedCostUsd: number;
  costIsEstimate: boolean;
  pricingVersion: string;
  toolCalls: number;
  approvalRequests: number;
  rejectedActions: number;
  retries: number;
  tasksCompleted: number;
}

export interface NalvaAgentOutcome {
  agentKey: string;
  agentName: string;
  executions: number;
  succeeded: number;
  failed: number;
  pendingApprovals: number;
  approvedActions: number;
  rejectedActions: number;
  leadsCreated: number;
  dealsCreated: number;
  followUpsCreated: number;
  contentDrafts: number;
  emailDrafts: number;
  campaignDrafts: number;
  supportTickets: number;
  purchaseDrafts: number;
  reports: number;
  workItems: number;
  estimatedCostUsd: number;
  costIsEstimate: boolean;
}

export interface NalvaWorkforceRecommendation {
  businessType: string;
  packKey: string;
  packName: string;
  description: string;
  agents: Array<{
    key: string;
    name: string;
    role: string;
    category: string;
    isActive: boolean;
    isRecommended: boolean;
  }>;
  workflows: Array<{
    key: string;
    name: string;
    triggerKind: string;
    isActive: boolean;
    isRecommended: boolean;
  }>;
  alreadyActiveAgents: number;
  recommendedAgentCount: number;
}

export interface NalvaSettings {
  defaultModel: string;
  embeddingModel: string;
  temperature: number;
  monthlyTokenBudget: number;
  monthlyBudgetUsd: number;
  dailyExecutionLimit: number;
  alertThresholdPercent: number;
  costAlert: boolean;
  autonomyCeiling: number;
  tokensUsedThisMonth: number;
  estimatedSpendThisMonthUsd: number;
  pricingVersion: string;
}

export interface NalvaModel {
  model: string;
  kind: string;
  inputUsdPerMillion: number;
  outputUsdPerMillion: number;
  maxTokens: number;
  supportsTools: boolean;
  pricingVersion: string;
  isDefault: boolean;
}

export interface NalvaRunResult {
  executionId: string;
  status: string;
  agentKey: string;
  summary?: string;
  approvalId?: string;
  estimatedCostUsd: number;
  costIsEstimate: boolean;
  error?: string;
}


export interface NalvaAuditEntry {
  id: string;
  actorUserId: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: string | null;
  newValue?: string | null;
  createdAt: string;
}
