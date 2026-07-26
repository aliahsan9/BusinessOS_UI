export interface AiPageContext {
  url: string;
  module: string;
  customerId?: string | null;
  orderId?: string | null;
  invoiceId?: string | null;
  projectId?: string | null;
}

export interface AiChatRequest {
  message: string;
  currentPage?: string | null;
  searchQuery?: string | null;
  customerId?: string | null;
  orderId?: string | null;
  invoiceId?: string | null;
  projectId?: string | null;
  sessionId?: string | null;
  /** Alias for sessionId when backend returns/accepts conversationId. */
  conversationId?: string | null;
}

export interface AiCopilotChatRequest extends AiChatRequest {
  stream?: boolean;
  /** When true, asks the backend to regenerate the last assistant reply. */
  regenerate?: boolean;
}

export interface AiRetrievedSources {
  customers: number;
  orders: number;
  invoices: number;
  projects: number;
  /** Optional additional entity counts returned by hybrid/semantic retrieval. */
  documents?: number;
}

export interface AiActionResult {
  action: string;
  success: boolean;
  message: string;
  entityType?: string | null;
  entityId?: string | null;
  route?: string | null;
}

export interface AiCitation {
  title: string;
  documentType: string;
  sourceId?: string | null;
  excerpt?: string | null;
  score: number;
  /** Prefer when backend sends an explicit document display name. */
  documentName?: string | null;
  /** Prefer when backend sends entity type separately from documentType. */
  entityType?: string | null;
  /** Prefer when backend sends similarityScore instead of/in addition to score. */
  similarityScore?: number | null;
  /** Free-form retrieval metadata from Qdrant / hybrid search. */
  metadata?: Record<string, unknown> | null;
  /** Prefer when backend sends preview instead of/in addition to excerpt. */
  preview?: string | null;
}

/** Normalized source document view for citation panels. */
export interface AiSourceDocument {
  documentName: string;
  entityType: string;
  similarityScore: number;
  metadata?: Record<string, unknown> | null;
  preview?: string | null;
  sourceId?: string | null;
}

export interface AiCopilotDiagnostics {
  intent: string;
  toolsUsed: string[];
  executionTimeMs: number;
  tokenUsage?: number | null;
  retrievedDocuments: number;
  usedLlm: boolean;
}

export interface AiChatResponse {
  reply: string;
  sessionId?: string | null;
  /** Alias for sessionId when backend uses conversationId. */
  conversationId?: string | null;
  intent?: string | null;
  toolsUsed?: string[];
  citations?: AiCitation[];
  sourceDocuments?: AiSourceDocument[];
  suggestions: AiSuggestionDto[];
  quickActions: AiQuickActionDto[];
  searchResults: AiSearchResultDto[];
  sources: AiRetrievedSources;
  actionResult?: AiActionResult | null;
  diagnostics?: AiCopilotDiagnostics | null;
  permissionDenied?: boolean;
}

export interface AiSuggestionDto {
  label: string;
  message: string;
}

export interface AiQuickActionDto {
  label: string;
  route: string;
  icon: string;
}

export interface AiSearchResultDto {
  type: string;
  id: string;
  title: string;
  subtitle?: string | null;
  route: string;
}

export interface AiChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: AiRetrievedSources | null;
  citations?: AiCitation[] | null;
  toolsUsed?: string[] | null;
  actionResult?: AiActionResult | null;
  streaming?: boolean;
  workflowSteps?: import('./agent.model').AgentWorkflowStep[] | null;
  agentDisplayName?: string | null;
}

export interface AiConversationSession {
  id: string;
  title: string;
  lastActivityAt: string;
  messageCount: number;
  /** Optional preview of the last turn for sidebar summaries. */
  lastMessagePreview?: string | null;
}

export interface AiConversationMessage {
  id: string;
  prompt: string;
  response: string;
  intent?: string | null;
  toolsUsed: string[];
  citations: AiCitation[];
  createdAt: string;
}

export interface AiProactiveInsight {
  type: string;
  severity: string;
  title: string;
  message: string;
  actionRoute?: string | null;
  actionLabel?: string | null;
}

export interface AiDashboardCopilot {
  summary: string;
  insights: AiProactiveInsight[];
  focusAreas: AiSuggestionDto[];
}

export interface AiDiagnosticsSummary {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageExecutionTimeMs: number;
  totalTokenUsage: number;
  intentBreakdown: { intent: string; count: number }[];
  toolBreakdown: { tool: string; count: number }[];
  recentLogs: AiCopilotAuditEntry[];
}

export interface AiCopilotAuditEntry {
  id: string;
  intent: string;
  userMessage?: string | null;
  toolsUsed: string[];
  executionTimeMs: number;
  tokenUsage?: number | null;
  success: boolean;
  errorMessage?: string | null;
  createdAt: string;
}

export interface AiStreamChunk {
  type: string;
  content?: string | null;
  finalResponse?: AiChatResponse | null;
  error?: string | null;
  sessionId?: string | null;
  conversationId?: string | null;
}

/** Convenience aliases matching backend/domain naming without replacing existing types. */
export type Conversation = AiConversationSession;
export type ConversationSummary = AiConversationSession;
export type ChatMessage = AiChatMessage;
export type Citation = AiCitation;
export type SourceDocument = AiSourceDocument;
export type ChatRequest = AiCopilotChatRequest;
export type ChatResponse = AiChatResponse;
export type StreamingChunk = AiStreamChunk;

export class AiStreamError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly aborted = false,
  ) {
    super(message);
    this.name = 'AiStreamError';
  }
}
