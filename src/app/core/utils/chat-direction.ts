/** Direction for a Sophia message. English and Roman Urdu stay left-to-right. */

export function directionForLanguage(language?: string | null): 'rtl' | 'ltr' {
  const code = (language || '').toLowerCase();
  if (code === 'ur' || code === 'ar') return 'rtl';
  return 'ltr';
}

export function directionForText(text: string, language?: string | null): 'rtl' | 'ltr' {
  const sample = text || '';
  const script = (sample.match(/[\u0600-\u06FF]/g) || []).length;
  if (script >= 3) return 'rtl';
  if (language) return directionForLanguage(language);
  return 'ltr';
}
