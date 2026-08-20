export const AD_TIMEZONE_OPTIONS = [
  { value: 'America/New_York', label: 'Eastern Time (Nova York, Miami)' },
  { value: 'America/Chicago', label: 'Central Time (Chicago, Dallas)' },
  { value: 'America/Denver', label: 'Mountain Time (Denver)' },
  { value: 'America/Phoenix', label: 'Arizona Time (Phoenix)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (Los Angeles)' },
  { value: 'America/Anchorage', label: 'Alaska Time' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time' },
  { value: 'America/Sao_Paulo', label: 'Horário de Brasília' },
  { value: 'Europe/Lisbon', label: 'Horário de Lisboa' },
  { value: 'America/Toronto', label: 'Eastern Time (Toronto)' },
  { value: 'America/Vancouver', label: 'Pacific Time (Vancouver)' },
  { value: 'UTC', label: 'UTC' },
] as const;

export const DEFAULT_AD_TIMEZONE_BY_COUNTRY: Record<string, string> = {
  US: 'America/New_York',
  BR: 'America/Sao_Paulo',
  PT: 'Europe/Lisbon',
  CA: 'America/Toronto',
};

export const getDefaultAdTimezone = (country: string) =>
  DEFAULT_AD_TIMEZONE_BY_COUNTRY[country] ?? 'UTC';
