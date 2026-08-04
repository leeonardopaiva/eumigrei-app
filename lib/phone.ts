export function formatInternationalPhone(value: string) {
  const hasPlus = value.trim().startsWith('+');
  const digits = value.replace(/\D/g, '').slice(0, 15);
  if (!digits) return hasPlus ? '+' : '';

  if (digits.startsWith('55')) {
    const country = digits.slice(0, 2);
    const area = digits.slice(2, 4);
    const local = digits.slice(4, 13);
    const first = local.length > 8 ? local.slice(0, 5) : local.slice(0, 4);
    const second = local.slice(first.length);
    return `+${country}${area ? ` (${area})` : ''}${first ? ` ${first}` : ''}${second ? `-${second}` : ''}`;
  }

  const countryLength = digits.startsWith('1') ? 1 : Math.min(2, Math.max(1, digits.length - 10));
  const country = digits.slice(0, countryLength);
  const area = digits.slice(countryLength, countryLength + 3);
  const local = digits.slice(countryLength + 3, countryLength + 10);
  return `+${country}${area ? ` (${area})` : ''}${local ? ` ${local.slice(0, 3)}` : ''}${local.length > 3 ? `-${local.slice(3)}` : ''}`;
}

export const normalizeInternationalPhone = (value: string) => {
  const digits = value.replace(/\D/g, '');
  return digits ? `+${digits}` : '';
};
