const normalizeDigits = (value: string): string => {
  const digitsOnly = value.replace(/\D/g, "");
  if (digitsOnly.length === 3) {
    return `0${digitsOnly}`;
  }
  if (digitsOnly.length >= 4) {
    return digitsOnly.slice(0, 4);
  }
  return digitsOnly.padStart(4, "0");
};

export const formatTime = (value: string): string => {
  if (!value) return "";
  const digitsOnly = value.replace(/\D/g, "");
  if (!/^\d{3,4}$/.test(digitsOnly)) {
    return value;
  }

  const padded = normalizeDigits(digitsOnly);
  const hours = Number(padded.slice(0, 2));
  const minutes = Number(padded.slice(2, 4));

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return value;
  }

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
};

export const formatTimeRange = (start: string, end: string): string => {
  const formattedStart = formatTime(start);
  const formattedEnd = formatTime(end);

  if (formattedStart && formattedEnd) {
    return `${formattedStart} - ${formattedEnd}`;
  }

  return formattedStart || formattedEnd || "";
};

export const compareTimeRange = (a: string, b: string): number => {
  const [aStart] = a.split("-");
  const [bStart] = b.split("-");
  const normalizedA = normalizeDigits(aStart);
  const normalizedB = normalizeDigits(bStart);
  if (normalizedA === normalizedB) {
    return a.localeCompare(b);
  }
  return normalizedA.localeCompare(normalizedB);
};
