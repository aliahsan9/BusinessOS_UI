import { Injectable } from '@angular/core';
import { AiCitation, AiRetrievedSources, AiSourceDocument } from '../models/ai.model';

@Injectable({ providedIn: 'root' })
export class AiRetrievalService {
  formatSourcesSummary(sources: AiRetrievedSources): string {
    const parts: string[] = [];

    if (sources.customers > 0) parts.push(`Customers (${sources.customers})`);
    if (sources.orders > 0) parts.push(`Orders (${sources.orders})`);
    if (sources.invoices > 0) parts.push(`Invoices (${sources.invoices})`);
    if (sources.projects > 0) parts.push(`Projects (${sources.projects})`);
    if ((sources.documents ?? 0) > 0) parts.push(`Documents (${sources.documents})`);

    return parts.length ? parts.join(', ') : 'No entity data retrieved';
  }

  hasRetrievedData(sources: AiRetrievedSources): boolean {
    return (
      sources.customers +
        sources.orders +
        sources.invoices +
        sources.projects +
        (sources.documents ?? 0) >
      0
    );
  }

  /** Normalize citation fields so UI can render document name, entity, score, and preview. */
  toSourceDocument(citation: AiCitation): AiSourceDocument {
    return {
      documentName: citation.documentName?.trim() || citation.title,
      entityType: citation.entityType?.trim() || citation.documentType,
      similarityScore: citation.similarityScore ?? citation.score ?? 0,
      metadata: citation.metadata ?? null,
      preview: citation.preview?.trim() || citation.excerpt || null,
      sourceId: citation.sourceId ?? null,
    };
  }

  formatSimilarity(score: number): string {
    if (!Number.isFinite(score)) return '';
    const normalized = score > 1 ? score : score * 100;
    return `${normalized.toFixed(1)}%`;
  }

  formatMetadata(metadata: Record<string, unknown> | null | undefined): string | null {
    if (!metadata) return null;
    const entries = Object.entries(metadata).filter(([, value]) => value != null && value !== '');
    if (!entries.length) return null;
    return entries
      .slice(0, 6)
      .map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : String(value)}`)
      .join(' · ');
  }
}
