/**
 * Turns assistant markdown into readable HTML.
 * Asterisk emphasis is removed so replies do not show raw **stars**.
 * Label/value lines become quiet rows instead of bold ChatGPT-style labels.
 */
export function formatAssistantReplyHtml(text: string | null | undefined): string {
  const raw = (text ?? '').replace(/\r\n/g, '\n').trim();
  if (!raw) return '';

  const lines = raw.split('\n');
  const parts: string[] = [];
  let list: 'ol' | 'ul' | null = null;
  let cardOpen = false;

  const closeCard = () => {
    if (!cardOpen) return;
    parts.push('</div></li>');
    cardOpen = false;
  };

  const closeList = () => {
    closeCard();
    if (!list) return;
    parts.push(list === 'ol' ? '</ol>' : '</ul>');
    list = null;
  };

  const ensureList = (kind: 'ol' | 'ul') => {
    if (list === kind) return;
    closeList();
    parts.push(kind === 'ol' ? '<ol class="reply-list">' : '<ul class="reply-list">');
    list = kind;
  };

  for (const line of lines) {
    if (!line.trim()) continue;

    const escaped = escapeHtml(line);
    const item = escaped.match(/^(\s*)(\d+\.|[-*•])\s+(.*)$/);
    if (item) {
      const body = stripMarkers(item[3]);
      const field = parseField(body);
      const ordered = /^\d+\.$/.test(item[2]);

      if (ordered) {
        closeCard();
        ensureList('ol');
        if (field) {
          parts.push('<li class="reply-card"><div class="reply-fields">');
          parts.push(fieldHtml(field.label, field.value));
          cardOpen = true;
        } else {
          parts.push(`<li>${body}</li>`);
        }
        continue;
      }

      if (cardOpen && field) {
        parts.push(fieldHtml(field.label, field.value));
        continue;
      }

      closeCard();
      ensureList('ul');
      if (field) {
        parts.push(`<li class="reply-card"><div class="reply-fields">${fieldHtml(field.label, field.value)}</div></li>`);
      } else {
        parts.push(`<li>${body}</li>`);
      }
      continue;
    }

    closeList();
    const paragraph = stripMarkers(escaped);
    if (paragraph) parts.push(`<p>${paragraph}</p>`);
  }

  closeList();
  return parts.join('');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function stripMarkers(value: string): string {
  return value
    .replace(/^#{1,6}\s+/, '')
    .replace(/\*\*([\s\S]*?)\*\*/g, '$1')
    .replace(/__([\s\S]*?)__/g, '$1')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\*\*/g, '')
    .replace(/__/g, '')
    .replace(/(^|\s)\*([^*\n]+)\*(?=\s|$)/g, '$1$2')
    .replace(/[ \t]+$/g, '')
    .trim();
}

function parseField(body: string): { label: string; value: string } | null {
  const match = body.match(/^([^:]{1,40}):\s+(.+)$/);
  if (!match) return null;
  const label = match[1].trim();
  if (!/[A-Za-z]/.test(label) || label.includes('.')) return null;
  return { label, value: match[2].trim() };
}

function fieldHtml(label: string, value: string): string {
  return `<div class="reply-field"><span class="reply-field__k">${label}</span><span class="reply-field__v">${value}</span></div>`;
}
