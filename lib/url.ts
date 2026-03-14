const HTTP_PROTOCOL_PATTERN = /^https?:\/\//i;
const OTHER_SCHEME_PATTERN = /^[a-z][a-z0-9+.-]*:\/\//i;

export const normalizeHttpUrlInput = (value: string) => {
  const trimmed = value.trim();

  if (!trimmed) {
    return '';
  }

  if (HTTP_PROTOCOL_PATTERN.test(trimmed) || OTHER_SCHEME_PATTERN.test(trimmed)) {
    return trimmed;
  }

  if (/\s/.test(trimmed) || /^[/?#]/.test(trimmed)) {
    return trimmed;
  }

  const candidate = `https://${trimmed}`;

  try {
    const url = new URL(candidate);

    return url.hostname ? candidate : trimmed;
  } catch {
    return trimmed;
  }
};

export const isValidHttpUrl = (value: string) => {
  const normalized = normalizeHttpUrlInput(value);

  if (!HTTP_PROTOCOL_PATTERN.test(normalized)) {
    return false;
  }

  try {
    const url = new URL(normalized);

    return (url.protocol === 'http:' || url.protocol === 'https:') && Boolean(url.hostname);
  } catch {
    return false;
  }
};
