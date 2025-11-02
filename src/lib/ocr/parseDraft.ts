const TIME_RE = /(\d{3,4})\s*to\s*(\d{3,4})/i;
const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const WEEK_TOKEN_RE = /Wk\s*([0-9,\-\s]+)/gi;

export type DraftChunk = {
  day: string;
  start: string;
  end: string;
  course: string;
  location: string;
  text: string;
  type?: string;
  notes?: string;
  weeks?: number[];
};

const uniqueSortedWeeks = (weeks: Iterable<number>): number[] => {
  const result = Array.from(new Set([...weeks])).filter((week) => Number.isInteger(week) && week > 0);
  return result.sort((a, b) => a - b);
};

const parseWeeksFromText = (value: unknown): number[] | undefined => {
  if (typeof value !== "string") return undefined;

  const extracted = new Set<number>();
  let match: RegExpExecArray | null;

  while ((match = WEEK_TOKEN_RE.exec(value)) !== null) {
    const segment = match[1]?.replace(/[^\d,\-\s]/g, " ") ?? "";
    const tokens = segment.split(/[\s,]+/).filter(Boolean);

    tokens.forEach((token) => {
      if (token.includes("-")) {
        const [startRaw, endRaw] = token.split("-");
        const start = Number.parseInt(startRaw, 10);
        const end = Number.parseInt(endRaw, 10);
        if (Number.isInteger(start) && Number.isInteger(end) && end >= start) {
          for (let week = start; week <= end; week += 1) {
            extracted.add(week);
          }
        }
      } else {
        const week = Number.parseInt(token, 10);
        if (Number.isInteger(week)) {
          extracted.add(week);
        }
      }
    });
  }

  return extracted.size ? uniqueSortedWeeks(extracted) : undefined;
};

const normalizeWeekArray = (value: unknown): number[] | undefined => {
  if (!Array.isArray(value)) return undefined;
  const weeks = value
    .map((week) => Number.parseInt(String(week), 10))
    .filter((week) => Number.isInteger(week) && week > 0);

  return weeks.length ? uniqueSortedWeeks(weeks) : undefined;
};

export function draftChunk(raw: string): DraftChunk[] {
  if (!raw) {
    return [];
  }

  const trimmed = raw.trim();

  const toDigitsTime = (value: unknown): string => {
    if (typeof value !== "string") return "";
    const digits = value.replace(/\D/g, "");
    if (!digits) return "";
    if (digits.length === 3) {
      return `0${digits}`;
    }
    if (digits.length >= 4) {
      return digits.slice(0, 4);
    }
    return digits.padStart(4, "0");
  };

  const normalizeDay = (value: unknown): string => {
    if (typeof value !== "string") return "";
    const upper = value.trim().toUpperCase();
    return DAYS.includes(upper) ? upper : "";
  };

  const normalizeSingleLine = (value: unknown): string => {
    if (typeof value !== "string") return "";
    return value.replace(/\s+/g, " ").trim();
  };

  const normalizeMultiline = (value: unknown): string => {
    if (typeof value !== "string") return "";
    return value
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .join("\n");
  };

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      const schedule = Array.isArray(parsed?.schedule)
        ? parsed.schedule
        : Array.isArray(parsed)
          ? parsed
          : null;

      if (Array.isArray(schedule)) {
        return schedule
          .map((entry) => {
            const normalizedDay = normalizeDay(entry?.day);
            const start = toDigitsTime(entry?.start);
            const end = toDigitsTime(entry?.end);
            const course = normalizeSingleLine(entry?.course);
            const location = normalizeSingleLine(entry?.location);
            const classType = normalizeSingleLine(entry?.type);
            const notes = normalizeMultiline(entry?.notes);
            const text = notes || classType;
            const weeks =
              normalizeWeekArray(entry?.weeks) ??
              parseWeeksFromText(entry?.notes) ??
              parseWeeksFromText(entry?.text);

            return {
              day: normalizedDay,
              start,
              end,
              course,
              location,
              text,
              type: classType || undefined,
              notes: notes || undefined,
              weeks,
            } satisfies DraftChunk;
          })
          .filter((chunk) =>
            chunk.day && chunk.start && chunk.end && (chunk.course || chunk.location || chunk.text),
          );
      }
    } catch {
      // Fall back to legacy parsing if JSON parsing fails
    }
  }

  const lines = raw.split(/\r?\n/).map((line) => line.trim());
  const chunks: DraftChunk[] = [];

  // Find the header line with days
  let headerIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    const upperLine = lines[i].toUpperCase();
    if (DAYS.some(day => upperLine.includes(day))) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) {
    return [];
  }

  // Process each line after the header
  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i];

    // Skip empty lines and footer content
    if (!line || line.includes('Academic Year') || line.includes('Index') ||
        line.includes('Course') || line.includes('Title') || line.includes('Status')) {
      continue;
    }

    // Check if line contains a time range
    const timeMatch = line.match(TIME_RE);
    if (!timeMatch) continue;

    const [, start, end] = timeMatch;

    // Split the line into columns based on significant whitespace
    // Remove the time range part first
    const contentAfterTime = line.substring(timeMatch.index! + timeMatch[0].length).trim();

    if (!contentAfterTime) {
      // Empty slot
      DAYS.forEach(day => {
        chunks.push({
          day,
          start: start.padStart(4, '0'),
          end: end.padStart(4, '0'),
          course: '',
          location: '',
          text: ''
        });
      });
      continue;
    }

    // Split content by multiple spaces (column separator)
    const columns = contentAfterTime.split(/\s{2,}/).filter(Boolean);

    // Map columns to days (assuming left to right: MON, TUE, WED, THU, FRI, SAT)
    DAYS.forEach((day, idx) => {
      const columnContent = columns[idx] || '';

      if (columnContent) {
        // Extract course code and location
        const courseMatch = columnContent.match(/([A-Z]{2}\d{3,4}[A-Z]?)/);
        const locationMatch = columnContent.match(/\((.*?)\)/);
        const weeks = parseWeeksFromText(columnContent);

        chunks.push({
          day,
          start: start.padStart(4, '0'),
          end: end.padStart(4, '0'),
          course: courseMatch ? courseMatch[1] : '',
          location: locationMatch ? locationMatch[1] : '',
          text: columnContent,
          weeks,
        });
      } else {
        // Empty slot for this day
        chunks.push({
          day,
          start: start.padStart(4, '0'),
          end: end.padStart(4, '0'),
          course: '',
          location: '',
          text: ''
        });
      }
    });
  }

  return chunks.filter(chunk =>
    (chunk.course && chunk.course.trim() !== '') ||
    (chunk.location && chunk.location.trim() !== '') ||
    (chunk.text && chunk.text.trim() !== '')
  );
}
