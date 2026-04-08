const BRAZILIAN_DATE_TIME_PATTERN =
  /^(\d{2})\/(\d{2})\/(\d{4})(?:[\sT]+(\d{2}):(\d{2}))?$/;

const ISO_LOCAL_DATE_TIME_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

const isValidDateTimeParts = (
  year: number,
  month: number,
  day: number,
  hours: number,
  minutes: number,
) => {
  const date = new Date(year, month - 1, day, hours, minutes);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day &&
    date.getHours() === hours &&
    date.getMinutes() === minutes
  );
};

export const formatDateTimeInputPtBr = (value: string | null | undefined) => {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

export const parseDateTimeInputPtBr = (value: string) => {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const brazilianMatch = trimmed.match(BRAZILIAN_DATE_TIME_PATTERN);

  if (brazilianMatch) {
    const [, dayValue, monthValue, yearValue, hoursValue = '00', minutesValue = '00'] =
      brazilianMatch;
    const day = Number(dayValue);
    const month = Number(monthValue);
    const year = Number(yearValue);
    const hours = Number(hoursValue);
    const minutes = Number(minutesValue);

    if (!isValidDateTimeParts(year, month, day, hours, minutes)) {
      return null;
    }

    return new Date(year, month - 1, day, hours, minutes).toISOString();
  }

  const isoLocalMatch = trimmed.match(ISO_LOCAL_DATE_TIME_PATTERN);

  if (isoLocalMatch) {
    const [, yearValue, monthValue, dayValue, hoursValue, minutesValue] = isoLocalMatch;
    const day = Number(dayValue);
    const month = Number(monthValue);
    const year = Number(yearValue);
    const hours = Number(hoursValue);
    const minutes = Number(minutesValue);

    if (!isValidDateTimeParts(year, month, day, hours, minutes)) {
      return null;
    }

    return new Date(year, month - 1, day, hours, minutes).toISOString();
  }

  return null;
};
