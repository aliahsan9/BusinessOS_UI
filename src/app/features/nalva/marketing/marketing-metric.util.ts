import { MetricField } from '../../../core/models/marketing.model';

/** Format a metric that may be unavailable (null) versus a real zero. */
export function formatMetric(raw: MetricField | number | null | undefined): string {
  if (raw == null) return 'Unavailable';
  if (typeof raw === 'number') return String(raw);
  if (raw.available === false) return raw.reason?.trim() || 'Unavailable';
  if (raw.value == null) return 'Unavailable';
  return String(raw.value);
}

export function isMetricAvailable(raw: MetricField | number | null | undefined): boolean {
  if (raw == null) return false;
  if (typeof raw === 'number') return true;
  if (raw.available === false) return false;
  return raw.value != null;
}
