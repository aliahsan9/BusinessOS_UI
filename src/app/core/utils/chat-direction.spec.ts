import { directionForLanguage, directionForText } from './chat-direction';

describe('chat direction', () => {
  it('keeps English and Roman Urdu left to right', () => {
    expect(directionForText('Show my total sales this month.')).toBe('ltr');
    expect(directionForText('Mujhe is month ki total sales batao.')).toBe('ltr');
    expect(directionForLanguage('ur-Latn')).toBe('ltr');
  });

  it('renders Urdu and Arabic right to left', () => {
    expect(directionForText('اس مہینے کی کل سیلز کتنی ہیں؟')).toBe('rtl');
    expect(directionForText('كم بلغت مبيعات هذا الشهر؟')).toBe('rtl');
    expect(directionForLanguage('ur')).toBe('rtl');
    expect(directionForLanguage('ar')).toBe('rtl');
    expect(directionForLanguage('en')).toBe('ltr');
  });
});
