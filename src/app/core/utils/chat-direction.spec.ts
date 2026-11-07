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

  it('lays out the assistant audit prompts in the script direction', () => {
    expect(directionForText('Mujhe batao meri total inventory kitni hai?')).toBe('ltr');
    expect(directionForText('Kon sa product sab se zyada sell ho raha hai?')).toBe('ltr');
    expect(directionForText('آج میری کتنی سیل ہوئی ہے؟')).toBe('rtl');
    expect(directionForText('میرے ٹاپ کسٹمرز کون سے ہیں؟')).toBe('rtl');
    expect(directionForText('مجھے بتائیں کہ کون سے پروڈکٹس کا اسٹاک ختم ہونے والا ہے؟')).toBe('rtl');
    expect(directionForText('تحدث معي باللغة العربية.')).toBe('rtl');
    expect(directionForText('ما هي المنتجات الأكثر مبيعاً في متجري؟')).toBe('rtl');
    expect(directionForLanguage('ur-Latn')).toBe('ltr');
  });
});
