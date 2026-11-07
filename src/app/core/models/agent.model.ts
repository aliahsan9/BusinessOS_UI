/** DTOs aligned with BusinessOS `/api/v1/agents` endpoints. */

export type VoiceUiState = 'idle' | 'listening' | 'processing' | 'speaking' | 'paused' | 'working';

export interface AgentEmployee {
  key: string;
  displayName: string;
  roleTitle: string;
  specialty: string;
  defaultLanguage: string;
  isDefault: boolean;
  isActive: boolean;
  avatarHint?: string | null;
}

export interface AgentWorkflowStep {
  id?: string;
  stepKey: string;
  title: string;
  status: 'Pending' | 'Running' | 'Completed' | 'Failed' | 'Skipped' | number | string;
  sortOrder: number;
  message?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
}

export interface AgentChatRequest {
  message: string;
  agentKey?: string | null;
  language?: string | null;
  currentPage?: string | null;
  searchQuery?: string | null;
  customerId?: string | null;
  orderId?: string | null;
  invoiceId?: string | null;
  projectId?: string | null;
  sessionId?: string | null;
  conversationId?: string | null;
  clientRequestId?: string | null;
  workflowId?: string | null;
  preferEmployeeTone?: boolean;
  stream?: boolean;
}

export interface AgentChatResponse {
  reply: string;
  spokenReply?: string | null;
  sessionId?: string | null;
  conversationId?: string | null;
  agentKey: string;
  agentDisplayName: string;
  intent?: string | number | null;
  workflowId?: string | null;
  workflowSteps?: AgentWorkflowStep[];
  toolsUsed?: string[];
  citations?: import('./ai.model').AiCitation[];
  suggestions?: import('./ai.model').AiSuggestionDto[];
  quickActions?: import('./ai.model').AiQuickActionDto[];
  searchResults?: import('./ai.model').AiSearchResultDto[];
  sources?: import('./ai.model').AiRetrievedSources;
  actionResult?: import('./ai.model').AiActionResult | null;
  permissionDenied?: boolean;
  language?: string | null;
  textDirection?: 'ltr' | 'rtl' | string | null;
  pendingConfirmation?: AiPendingConfirmation | null;
}

export interface AiPendingConfirmation {
  action: string;
  fields: AiConfirmationField[];
}

export interface AiConfirmationField {
  label: string;
  value: string;
}

export interface AgentStreamChunk {
  type: string;
  content?: string | null;
  toolName?: string | null;
  workflowStep?: AgentWorkflowStep | null;
  workflowId?: string | null;
  finalResponse?: AgentChatResponse | null;
  error?: string | null;
}

export interface VoicePreference {
  id?: string;
  language: string;
  voiceLanguage?: number | string;
  voiceName: string;
  speechRate: number;
  pitch: number;
  continuousListening: boolean;
  autoSpeak: boolean;
  preferredAgentKey?: string | null;
}

export interface SaveVoicePreferenceRequest {
  language: string;
  voiceName?: string;
  speechRate?: number;
  pitch?: number;
  continuousListening?: boolean;
  autoSpeak?: boolean;
  preferredAgentKey?: string | null;
}

export interface TtsVoiceOption {
  id: string;
  label: string;
  description?: string | null;
}

export interface TtsVoiceCatalog {
  provider: string;
  defaultVoice: string;
  voices: TtsVoiceOption[];
}

export interface SynthesizedSpeech {
  blob: Blob;
  provider: string | null;
  voice: string | null;
  fromCache: boolean;
}

/** Used only when the voice catalog cannot be loaded. Ids match the OpenAI provider. */
export const FALLBACK_TTS_VOICES: TtsVoiceOption[] = [
  { id: 'alloy', label: 'Alloy', description: 'Neutral' },
  { id: 'ash', label: 'Ash', description: 'Clear' },
  { id: 'ballad', label: 'Ballad', description: 'Warm' },
  { id: 'coral', label: 'Coral', description: 'Friendly' },
  { id: 'echo', label: 'Echo', description: 'Steady' },
  { id: 'fable', label: 'Fable', description: 'Expressive' },
  { id: 'nova', label: 'Nova', description: 'Bright' },
  { id: 'onyx', label: 'Onyx', description: 'Deep' },
  { id: 'sage', label: 'Sage', description: 'Calm' },
  { id: 'shimmer', label: 'Shimmer', description: 'Light' },
  { id: 'verse', label: 'Verse', description: 'Narrative' },
];

export interface AskSophiaSuggestion {
  label: string;
  message: string;
  category?: string | null;
  agentKey?: string | null;
  icon?: string | null;
}

export interface AskSophiaSuggestions {
  greeting: string;
  agentKey: string;
  agentDisplayName: string;
  suggestions: AskSophiaSuggestion[];
}

export interface AgentOnboardingStartRequest {
  agentKey?: string | null;
  language?: string | null;
  sessionId?: string | null;
}

export interface AgentOnboardingContinueRequest {
  message: string;
  agentKey?: string | null;
  language?: string | null;
  sessionId?: string | null;
  workflowId?: string | null;
}

export interface AgentOnboardingResponse {
  reply: string;
  spokenReply?: string | null;
  agentKey: string;
  agentDisplayName: string;
  sessionId?: string | null;
  workflowId?: string | null;
  currentStep: number;
  stepKey?: string | null;
  isComplete: boolean;
  collectedData?: Record<string, string | null>;
  suggestions?: import('./ai.model').AiSuggestionDto[];
  workflowSteps?: AgentWorkflowStep[];
}
