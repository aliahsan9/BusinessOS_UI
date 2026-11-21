export interface SupportChannel {
  channel: string;
  displayName: string;
  status: string;
  allowsInbound: boolean;
  allowsOutbound: boolean;
  implementation: string;
  externalAccountId?: string | null;
  lastInboundAt?: string | null;
  lastOutboundAt?: string | null;
  lastError?: string | null;
}

export interface SupportOverview {
  totalTickets: number;
  openTickets: number;
  pendingTickets: number;
  escalatedTickets: number;
  resolvedTickets: number;
  averageResolutionHours?: number | null;
  activeConversations: number;
  pendingApprovals: number;
  conversationsHandled: number;
  issuesResolved: number;
  escalations: number;
  averageResponseMinutes?: number | null;
  resolutionRate?: number | null;
  aiExecutions: number;
  estimatedAiCostUsd: number;
  costIsEstimate: boolean;
  channels: SupportChannel[];
}

export interface SupportTicketListItem {
  id: string;
  ticketNumber: string;
  customerId?: string | null;
  customerName?: string | null;
  subject: string;
  category: string;
  priority: string;
  status: string;
  channel: string;
  assignedAgentKey?: string | null;
  assignedUserId?: string | null;
  aiSummary?: string | null;
  recommendedAction?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  escalatedAt?: string | null;
  resolvedAt?: string | null;
  humanTakeover: boolean;
  messageCount: number;
}

export interface SupportMessage {
  id: string;
  ticketId: string;
  channel: string;
  direction: string;
  body: string;
  authorType: string;
  authorId?: string | null;
  deliveryStatus: string;
  isInternalNote: boolean;
  createdAt: string;
  deliveredAt?: string | null;
  error?: string | null;
}

export interface SupportFollowUp {
  id: string;
  ticketId: string;
  kind: string;
  status: string;
  dueAt: string;
  channel: string;
  messageTemplate: string;
  sentAt?: string | null;
  lastError?: string | null;
}

export interface SupportTicketDetail {
  id: string;
  ticketNumber: string;
  tenantId: string;
  customerId?: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  channel: string;
  assignedAgentKey?: string | null;
  assignedUserId?: string | null;
  externalThreadId?: string | null;
  aiSummary?: string | null;
  recommendedAction?: string | null;
  resolution?: string | null;
  escalationReason?: string | null;
  escalationSummary?: string | null;
  relatedOrderId?: string | null;
  relatedOrderNumber?: string | null;
  humanTakeover: boolean;
  marketingConsentForHandoff: boolean;
  reopenCount: number;
  createdAt: string;
  updatedAt?: string | null;
  escalatedAt?: string | null;
  resolvedAt?: string | null;
  closedAt?: string | null;
  messages: SupportMessage[];
  followUps: SupportFollowUp[];
}

export interface SupportProcessResult {
  ticketId: string;
  ticketNumber: string;
  status: string;
  summary: string;
  responseSent: boolean;
  responseDeliveryStatus: string;
  escalated: boolean;
  outboundMessageId?: string | null;
}
