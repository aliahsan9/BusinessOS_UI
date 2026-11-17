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
