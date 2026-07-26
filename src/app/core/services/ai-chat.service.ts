import { Injectable, inject } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { API_ENDPOINTS, HTTP_HEADERS } from '../constants/api.constants';
import {
  AiChatResponse,
  AiConversationMessage,
  AiConversationSession,
  AiCopilotChatRequest,
  AiDashboardCopilot,
  AiDiagnosticsSummary,
  AiProactiveInsight,
  AiStreamChunk,
  AiStreamError,
} from '../models/ai.model';
import { AiContextService } from './ai-context.service';
import { TokenService } from './token.service';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AiChatService extends BaseApiService {
  private readonly aiContext = inject(AiContextService);
  private readonly tokenService = inject(TokenService);

  private sessionId: string | null = null;
  private streamAbort: AbortController | null = null;

  chat(message: string, options?: { regenerate?: boolean }): Observable<AiChatResponse> {
    const request = this.buildCopilotRequest(message, false);
    if (options?.regenerate) {
      request.regenerate = true;
    }
    return this.post<AiChatResponse>(API_ENDPOINTS.ai.chat, request);
  }

  streamMessage(message: string, options?: { regenerate?: boolean }): AsyncGenerator<AiStreamChunk> {
    const request = this.buildCopilotRequest(message, true);
    if (options?.regenerate) {
      request.regenerate = true;
    }
    return this.consumeStream(request);
  }

  /**
   * Prefer SSE streaming; on stream transport failure OR empty/unusable stream,
   * fall back to standard HTTP chat. Abort/cancel does not fall back.
   */
  async *streamWithFallback(
    message: string,
    options?: { regenerate?: boolean },
  ): AsyncGenerator<AiStreamChunk> {
    let receivedUsefulChunk = false;

    try {
      for await (const chunk of this.streamMessage(message, options)) {
        if (this.isUsefulChunk(chunk)) {
          receivedUsefulChunk = true;
        }
        yield chunk;
      }

      if (!receivedUsefulChunk) {
        throw new AiStreamError('Streaming returned no content.', 502);
      }
    } catch (err) {
      if (err instanceof AiStreamError && err.aborted) {
        throw err;
      }

      const response = await firstValueFrom(this.chat(message, options));
      const resolved = this.normalizeResponse(response);
      if (resolved.reply) {
        yield { type: 'token', content: resolved.reply };
      }
      yield { type: 'done', finalResponse: resolved };
    }
  }

  search(searchQuery: string): Observable<AiChatResponse> {
    const request = this.buildCopilotRequest('', false, searchQuery);
    return this.post<AiChatResponse>(API_ENDPOINTS.ai.chat, request);
  }

  chatWithRequest(request: AiCopilotChatRequest): Observable<AiChatResponse> {
    return this.post<AiChatResponse>(API_ENDPOINTS.ai.chat, request);
  }

  listConversations(limit = 20): Observable<AiConversationSession[]> {
    return this.get<AiConversationSession[]>(API_ENDPOINTS.ai.conversations, { limit });
  }

  getConversation(sessionId: string): Observable<AiConversationMessage[]> {
    return this.get<AiConversationMessage[]>(`${API_ENDPOINTS.ai.conversation}/${sessionId}`);
  }

  getInsights(): Observable<AiProactiveInsight[]> {
    return this.get<AiProactiveInsight[]>(API_ENDPOINTS.ai.insights);
  }

  getDashboardCopilot(): Observable<AiDashboardCopilot> {
    return this.get<AiDashboardCopilot>(API_ENDPOINTS.ai.dashboardCopilot);
  }

  getDiagnostics(since?: string): Observable<AiDiagnosticsSummary> {
    return this.get<AiDiagnosticsSummary>(API_ENDPOINTS.ai.diagnostics, since ? { since } : undefined);
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

  /** Cancel an in-flight SSE generation request. */
  stopGeneration(): void {
    this.streamAbort?.abort();
    this.streamAbort = null;
  }

  buildCopilotRequest(message: string, stream = false, searchQuery?: string): AiCopilotChatRequest {
    const base = this.aiContext.buildChatRequest(message, searchQuery ?? null);
    return {
      ...base,
      sessionId: this.sessionId,
      conversationId: this.sessionId,
      stream,
    };
  }

  /** Prefer sessionId, fall back to conversationId from backend payloads. */
  resolveSessionId(response: Pick<AiChatResponse, 'sessionId' | 'conversationId'>): string | null {
    return response.sessionId ?? response.conversationId ?? this.sessionId;
  }

  normalizeResponse(response: AiChatResponse): AiChatResponse {
    const sessionId = this.resolveSessionId(response);
    const reply =
      response.reply ??
      (response as unknown as { answer?: string; message?: string; content?: string }).answer ??
      (response as unknown as { answer?: string; message?: string; content?: string }).message ??
      (response as unknown as { answer?: string; message?: string; content?: string }).content ??
      '';

    return {
      ...response,
      reply,
      sessionId,
      conversationId: sessionId,
      suggestions: response.suggestions ?? [],
      quickActions: response.quickActions ?? [],
      searchResults: response.searchResults ?? [],
      sources: response.sources ?? { customers: 0, orders: 0, invoices: 0, projects: 0 },
      citations: response.citations ?? [],
      toolsUsed: response.toolsUsed ?? [],
    };
  }

  private async *consumeStream(request: AiCopilotChatRequest): AsyncGenerator<AiStreamChunk> {
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
    }, 45_000);

    let response: Response;
    try {
      response = await fetch(`${environment.apiUrl}${API_ENDPOINTS.ai.chatStream}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
        signal: this.streamAbort.signal,
      });
    } catch (err) {
      clearTimeout(timeoutId);
      if (timedOut) {
        throw new AiStreamError('Streaming timed out.', 408);
      }
      if (this.isAbortError(err)) {
        throw new AiStreamError('Generation stopped.', 0, true);
      }
      throw new AiStreamError('Unable to reach the AI streaming endpoint.', 0);
    }

    if (!response.ok || !response.body) {
      clearTimeout(timeoutId);
      const detail = await this.readErrorDetail(response);
      throw new AiStreamError(detail || `Streaming request failed (${response.status}).`, response.status);
    }

    const contentType = (response.headers.get('content-type') || '').toLowerCase();

    // Some backends expose /chat/stream but still return a normal JSON chat payload.
    if (contentType.includes('application/json') && !contentType.includes('text/event-stream')) {
      clearTimeout(timeoutId);
      const json = (await response.json()) as unknown;
      yield* this.yieldFromJsonPayload(json);
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

        // Support both SSE (`\n\n`) and NDJSON (`\n`) framing.
        const parts = buffer.includes('\n\n') ? buffer.split('\n\n') : buffer.split('\n');
        buffer = parts.pop() ?? '';

        for (const part of parts) {
          const chunk = this.parseSsePart(part);
          if (!chunk) continue;
          yield* this.emitNormalizedChunk(chunk);
        }
      }

      // Flush trailing buffer (last NDJSON/SSE frame without delimiter).
      if (buffer.trim()) {
        const chunk = this.parseSsePart(buffer);
        if (chunk) {
          yield* this.emitNormalizedChunk(chunk);
        } else {
          // Entire body may have been a single JSON object without SSE framing.
          try {
            const json = JSON.parse(buffer) as unknown;
            yield* this.yieldFromJsonPayload(json);
          } catch {
            /* ignore incomplete trailing data */
          }
        }
      }
    } catch (err) {
      if (timedOut) {
        throw new AiStreamError('Streaming timed out.', 408);
      }
      if (this.isAbortError(err) || (err instanceof AiStreamError && err.aborted)) {
        throw new AiStreamError('Generation stopped.', 0, true);
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
      try {
        reader.releaseLock();
      } catch {
        /* ignore */
      }
      if (this.streamAbort) {
        this.streamAbort = null;
      }
    }
  }

  private async *emitNormalizedChunk(chunk: AiStreamChunk): AsyncGenerator<AiStreamChunk> {
    if (chunk.sessionId || chunk.conversationId) {
      this.setSessionId(chunk.sessionId ?? chunk.conversationId ?? null);
    }

    if (chunk.type === 'error') {
      throw new AiStreamError(chunk.error || chunk.content || 'Streaming error.', 500);
    }

    if (chunk.finalResponse) {
      chunk = {
        ...chunk,
        finalResponse: this.normalizeResponse(chunk.finalResponse),
      };
    }

    yield chunk;
  }

  private async *yieldFromJsonPayload(json: unknown): AsyncGenerator<AiStreamChunk> {
    if (!json) return;

    if (Array.isArray(json)) {
      for (const item of json) {
        const chunk = this.normalizeRawChunk(item);
        if (chunk) {
          yield* this.emitNormalizedChunk(chunk);
        }
      }
      return;
    }

    const chunk = this.normalizeRawChunk(json);
    if (chunk) {
      yield* this.emitNormalizedChunk(chunk);
    }
  }

  private parseSsePart(part: string): AiStreamChunk | null {
    const trimmed = part.trim();
    if (!trimmed || trimmed.startsWith(':')) return null;

    const dataLines = trimmed
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.startsWith('data:'));

    const payload = dataLines.length
      ? dataLines.map((line) => line.slice(5).trim()).join('')
      : trimmed;

    if (!payload || payload === '[DONE]') {
      return payload === '[DONE]' ? { type: 'done' } : null;
    }

    try {
      return this.normalizeRawChunk(JSON.parse(payload));
    } catch {
      return { type: 'token', content: payload };
    }
  }

  /**
   * Accept common backend stream shapes:
   * { type:'token', content }, { type:'delta', delta }, { reply }, OpenAI-like deltas, etc.
   */
  private normalizeRawChunk(raw: unknown): AiStreamChunk | null {
    if (raw == null) return null;

    if (typeof raw === 'string') {
      return { type: 'token', content: raw };
    }

    if (typeof raw !== 'object') return null;

    const obj = raw as Record<string, unknown>;

    // Full chat response returned as one payload.
    if (typeof obj['reply'] === 'string' || typeof obj['answer'] === 'string') {
      const asResponse = this.normalizeResponse(obj as unknown as AiChatResponse);
      return {
        type: 'done',
        content: asResponse.reply,
        finalResponse: asResponse,
        sessionId: asResponse.sessionId,
        conversationId: asResponse.conversationId,
      };
    }

    const type = String(obj['type'] ?? obj['event'] ?? obj['kind'] ?? '').toLowerCase();

    let contentValue: unknown =
      obj['content'] ?? obj['delta'] ?? obj['text'] ?? obj['token'] ?? obj['message'] ?? null;

    if (contentValue != null && typeof contentValue === 'object') {
      const nested = contentValue as Record<string, unknown>;
      contentValue = nested['content'] ?? nested['text'] ?? nested['token'] ?? null;
    }

    if (contentValue == null && Array.isArray(obj['choices'])) {
      const firstChoice = obj['choices'][0] as Record<string, unknown> | undefined;
      const delta = firstChoice?.['delta'] as Record<string, unknown> | undefined;
      contentValue = delta?.['content'] ?? firstChoice?.['text'] ?? null;
    }

    const content =
      contentValue == null
        ? null
        : typeof contentValue === 'string'
          ? contentValue
          : String(contentValue);

    const finalResponse =
      (obj['finalResponse'] as AiChatResponse | undefined) ??
      (obj['response'] as AiChatResponse | undefined) ??
      null;

    const sessionId =
      (obj['sessionId'] as string | undefined) ?? (obj['conversationId'] as string | undefined) ?? null;

    if (type === 'error' || type === 'failed') {
      return {
        type: 'error',
        error: String(obj['error'] ?? obj['detail'] ?? content ?? 'Streaming error.'),
        content,
        sessionId,
      };
    }

    if (type === 'done' || type === 'complete' || type === 'end' || type === 'finished' || finalResponse) {
      return {
        type: 'done',
        content,
        finalResponse: finalResponse ? this.normalizeResponse(finalResponse) : null,
        sessionId,
        conversationId: sessionId,
      };
    }

    if (content) {
      return {
        type: 'token',
        content,
        sessionId,
        conversationId: sessionId,
      };
    }

    // Unknown object with no content - ignore rather than blocking the UI.
    return null;
  }

  private isUsefulChunk(chunk: AiStreamChunk): boolean {
    if (chunk.type === 'token' && !!chunk.content) return true;
    if (chunk.type === 'done' && (!!chunk.finalResponse?.reply || !!chunk.content)) return true;
    return false;
  }

  private async readErrorDetail(response: Response): Promise<string> {
    try {
      const body = (await response.json()) as { detail?: string; title?: string; message?: string };
      return body.detail || body.title || body.message || '';
    } catch {
      return '';
    }
  }

  private isAbortError(err: unknown): boolean {
    return (
      (err instanceof DOMException && err.name === 'AbortError') ||
      (err instanceof Error && err.name === 'AbortError')
    );
  }
}
