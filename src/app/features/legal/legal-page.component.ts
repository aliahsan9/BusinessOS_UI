import { Component, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ViewportScroller } from '@angular/common';
import { FooterComponent } from '../footer/footer.component';
import { NavbarComponent } from '../navbar/navbar.component';
import { LegalDocument, LegalDocumentKey, LegalTextPart } from './legal-document.model';
import { LEGAL_DOCUMENTS } from './legal-documents';

@Component({
  selector: 'app-legal-inline',
  standalone: true,
  imports: [RouterLink],
  template: `@for (part of parts(); track $index) {@if (part.href && isRoute(part.href)) {<a [routerLink]="part.href">{{ part.text }}</a>}@else if (part.href) {<a [href]="part.href">{{ part.text }}</a>}@else {{{ part.text }}}}`,
  styles: `
    :host { display: inline; }
    a {
      color: var(--mkt-accent);
      font-weight: 600;
      text-decoration: underline;
      text-underline-offset: 0.15em;
    }
    a:hover { color: var(--mkt-accent-hover); }
  `,
})
export class LegalInlineComponent {
  readonly parts = input.required<LegalTextPart[]>();

  isRoute(href: string): boolean {
    return href.startsWith('/');
  }
}

@Component({
  selector: 'app-legal-page',
  standalone: true,
  imports: [RouterLink, NavbarComponent, FooterComponent, LegalInlineComponent],
  templateUrl: './legal-page.component.html',
  styleUrl: './legal-page.component.scss',
})
export class LegalPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly viewport = inject(ViewportScroller);

  readonly doc = signal<LegalDocument>(LEGAL_DOCUMENTS.privacy);
  readonly related = computed(() =>
    Object.values(LEGAL_DOCUMENTS).filter((item) => item.key !== this.doc().key),
  );

  constructor() {
    this.route.data.pipe(takeUntilDestroyed()).subscribe((data) => {
      const key = data['document'] as LegalDocumentKey;
      this.doc.set(LEGAL_DOCUMENTS[key] ?? LEGAL_DOCUMENTS.privacy);
      this.viewport.scrollToPosition([0, 0]);
    });
  }

  parts(text: string | undefined): LegalTextPart[] {
    if (!text) return [];

    const parts: LegalTextPart[] = [];
    const pattern = /\[\[([^\]|]+)\|([^\]]+)\]\]/g;
    let last = 0;

    for (const match of text.matchAll(pattern)) {
      const index = match.index ?? 0;
      if (index > last) {
        parts.push({ text: text.slice(last, index) });
      }
      parts.push({ text: match[2], href: match[1] });
      last = index + match[0].length;
    }

    if (last < text.length) {
      parts.push({ text: text.slice(last) });
    }

    return parts;
  }
}
