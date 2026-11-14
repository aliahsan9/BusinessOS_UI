export type LegalDocumentKey = 'privacy' | 'terms' | 'refunds';

export interface LegalBlock {
  type: 'p' | 'ul';
  text?: string;
  items?: string[];
}

export interface LegalSection {
  id: string;
  title: string;
  blocks: LegalBlock[];
}

export interface LegalDocument {
  key: LegalDocumentKey;
  path: string;
  label: string;
  eyebrow: string;
  title: string;
  lead: string;
  updated: string;
  sections: LegalSection[];
}

export interface LegalTextPart {
  text: string;
  href?: string;
}
