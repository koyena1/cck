export function normalizeDistrictName(value?: string | null) {
  const input = String(value || '').trim();
  if (!input) return input;

  if (/^east\s+medinipur$/i.test(input)) return 'Purba Medinipur';
  if (/^east\s+midnapore$/i.test(input)) return 'Purba Medinipur';
  if (/^purba\s+midnapore$/i.test(input)) return 'Purba Medinipur';

  return input;
}
