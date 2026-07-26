import { Injectable, inject } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { API_ENDPOINTS, HTTP_HEADERS } from '../constants/api.constants';
import { AiContextService } from './ai-context.service';
import { TokenService } from './token.service';
import { environment } from '../../../environments/environment';
import { AiStreamError } from '../models/ai.model';
import {
  AgentChatRequest,
  AgentChatResponse,
  AgentEmployee,
  AgentOnboardingContinueRequest,
  AgentOnboardingResponse,
  AgentOnboardingStartRequest,
  AgentStreamChunk,
  AskSophiaSuggestions,
  SaveVoicePreferenceRequest,
  VoicePreference,
} from '../models/agent.model';

/**
 * Client for Sophia and other AI employees (/api/agents).
 */
@Injectable({ providedIn: 'root' })
export class AgentEmployeeService extends BaseApiService {
  private readonly aiContext = inject(AiContextService);
  private readonly tokenService = inject(TokenService);

  private sessionId: string | null = null;
  private streamAbort: AbortController | null = null;
  private preferredAgentKey = 'sophia';
  private language = 'en';

  chat(message: string): Observable<AgentChatResponse> {
    return this.post<AgentChatResponse>(API_ENDPOINTS.agents.chat, this.buildRequest(message, false));
  }

  listEmployees(): Observable<AgentEmployee[]> {
    return this.get<AgentEmployee[]>(API_ENDPOINTS.agents.employees);
  }

  getVoicePreferences(): Observable<VoicePreference> {
    return this.get<VoicePreference>(API_ENDPOINTS.agents.voicePreferences);
  }

  saveVoicePreferences(request: SaveVoicePreferenceRequest): Observable<VoicePreference> {
    return this.put<VoicePreference>(API_ENDPOINTS.agents.voicePreferences, request);
  }

  getAskSophiaSuggestions(): Observable<AskSophiaSuggestions> {
    return this.get<AskSophiaSuggestions>(API_ENDPOINTS.agents.askSophia);
  }

  startOnboarding(request: AgentOnboardingStartRequest = {}): Observable<AgentOnboardingResponse> {
    return this.post<AgentOnboardingResponse>(API_ENDPOINTS.agents.onboardingStart, {
      ...request,
      sessionId: request.sessionId ?? this.sessionId,
    });
  }

  continueOnboarding(request: AgentOnboardingContinueRequest): Observable<AgentOnboardingResponse> {
    return this.post<AgentOnboardingResponse>(API_ENDPOINTS.agents.onboardingContinue, {
      ...request,
      sessionId: request.sessionId ?? this.sessionId,
    });
  }

  setPreferences(opts: { agentKey?: string; language?: string }): void {
    if (opts.agentKey) this.preferredAgentKey = opts.agentKey;
    if (opts.language) this.language = opts.language;
  }

  setSessionId(sessionId: string | null): void {
    this.sessionId = sessionId;
  }

  getSessionId(): string | null {
    return this.sessionId;
  }

  clearSession(): void {
    this.sessionId = null;
  }

  stopGeneration(): void {
    this.streamAbort?.abort();
    this.streamAbort = null;
  }

  async *streamWithFallback(message: string): AsyncGenerator<AgentStreamChunk> {
    let receivedUseful = false;
    try {
      for await (const chunk of this.streamMessage(message)) {
        if (chunk.type === 'token' && chunk.content) receivedUseful = true;
        if (chunk.type === 'final' || chunk.type === 'done') receivedUseful = true;
        yield chunk;
      }
      if (!receivedUseful) {
        throw new AiStreamError('Streaming returned no content.', 502);
      }
    } catch (err) {
      if (err instanceof AiStreamError && err.aborted) throw err;
      const response = await firstValueFrom(this.chat(message));
      const normalized = this.normalizeResponse(response);
      if (normalized.reply) {
        yield { type: 'token', content: normalized.reply };
      }
      yield { type: 'final', finalResponse: normalized };
    }
  }

  private async *streamMessage(message: string): AsyncGenerator<AgentStreamChunk> {
    this.stopGeneration();
    this.streamAbort = new AbortController();

    const token = this.tokenService.getToken();
    const tenantId = this.tokenService.tenantId();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream, application/json',
    };
    if (token) headers[HTTP_HEADERS.authorization] = `Bearer ${token}`;
    if (tenantId) headers[HTTP_HEADERS.tenantId] = tenantId;

    let timedOut = false;
    const timeoutId = setTimeout(() => {
      timedOut = true;
      this.streamAbort?.abort();
    }, 60_000);

    let response: Response;
    try {
      response = await fetch(`${environment.apiUrl}${API_ENDPOINTS.agents.chatStream}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(this.buildRequest(message, true)),
        signal: this.streamAbort.signal,
      });
    } catch (err) {
      clearTimeout(timeoutId);
      if (timedOut) throw new AiStreamError('Streaming timed out.', 408);
      if (this.isAbortError(err)) throw new AiStreamError('Generation stopped.', 0, true);
      throw new AiStreamError('Unable to reach Sophia streaming endpoint.', 0);
    }

    if (!response.ok || !response.body) {
      clearTimeout(timeoutId);
      throw new AiStreamError(`Streaming request failed (${response.status}).`, response.status);
    }

    const contentType = (response.headers.get('content-type') || '').toLowerCase();
    if (contentType.includes('application/json') && !contentType.includes('text/event-stream')) {
      clearTimeout(timeoutId);
      const json = (await response.json()) as AgentChatResponse;
      yield { type: 'final', finalResponse: this.normalizeResponse(json) };
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.includes('\n\n') ? buffer.split('\n\n') : buffer.split('\n');
        buffer = parts.pop() ?? '';
        for (const part of parts) {
          const chunk = this.parseSsePart(part);
          if (chunk) yield chunk;
        }
      }
      if (buffer.trim()) {
        const chunk = this.parseSsePart(buffer);
        if (chunk) yield chunk;
      }
    } catch (err) {
      if (timedOut) throw new AiStreamError('Streaming timed out.', 408);
      if (this.isAbortError(err)) throw new AiStreamError('Generation stopped.', 0, true);
      throw err;
    } finally {
      clearTimeout(timeoutId);
      try {
        reader.releaseLock();
      } catch {
        /* ignore */
      }
      this.streamAbort = null;
    }
  }

  normalizeResponse(response: AgentChatResponse): AgentChatResponse {
    if (response.sessionId) this.sessionId = response.sessionId;
    return {
      ...response,
      reply: response.reply ?? '',
      spokenReply: response.spokenReply ?? response.reply ?? '',
      suggestions: response.suggestions ?? [],
      quickActions: response.quickActions ?? [],
      searchResults: response.searchResults ?? [],
      toolsUsed: response.toolsUsed ?? [],
      workflowSteps: response.workflowSteps ?? [],
      sources: response.sources ?? { customers: 0, orders: 0, invoices: 0, projects: 0 },
      citations: response.citations ?? [],
      agentKey: response.agentKey || 'sophia',
      agentDisplayName: response.agentDisplayName || 'Sophia',
    };
  }

  private buildRequest(message: string, stream: boolean): AgentChatRequest {
    const base = this.aiContext.buildChatRequest(message);
    return {
      message: base.message,
      currentPage: base.currentPage,
      searchQuery: base.searchQuery,
      customerId: base.customerId,
      orderId: base.orderId,
      invoiceId: base.invoiceId,
      projectId: base.projectId,
      sessionId: this.sessionId,
      agentKey: this.preferredAgentKey,
      language: this.language,
      preferEmployeeTone: true,
      stream,
    };
  }

  private parseSsePart(part: string): AgentStreamChunk | null {
    const trimmed = part.trim();
    if (!trimmed || trimmed.startsWith(':')) return null;
    const dataLines = trimmed
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.startsWith('data:'));
    const payload = dataLines.length
      ? dataLines.map((l) => l.slice(5).trim()).join('')
      : trimmed;
    if (!payload || payload === '[DONE]') {
      return payload === '[DONE]' ? { type: 'done' } : null;
    }
    try {
      const obj = JSON.parse(payload) as Record<string, unknown>;
      if (typeof obj['reply'] === 'string') {
        return {
          type: 'final',
          finalResponse: this.normalizeResponse(obj as unknown as AgentChatResponse),
        };
      }
      const type = String(obj['type'] ?? 'token').toLowerCase();
      const finalResponse = obj['finalResponse'] as AgentChatResponse | undefined;
      return {
        type: type === 'done' ? 'final' : type,
        content: (obj['content'] as string | undefined) ?? null,
        workflowStep: (obj['workflowStep'] as AgentStreamChunk['workflowStep']) ?? null,
        workflowId: (obj['workflowId'] as string | undefined) ?? null,
        finalResponse: finalResponse ? this.normalizeResponse(finalResponse) : null,
        error: (obj['error'] as string | undefined) ?? null,
      };
    } catch {
      return { type: 'token', content: payload };
    }
  }

  private isAbortError(err: unknown): boolean {
    return (
      (err instanceof DOMException && err.name === 'AbortError') ||
      (err instanceof Error && err.name === 'AbortError')
    );
  }
}
