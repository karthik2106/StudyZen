import type { DraftChunk } from "@/lib/ocr/parseDraft";
import { formatTimeRange, compareTimeRange } from "@/lib/time";
import { DAY_CODES, DAY_LABELS } from "@/constants/days";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";

const COLORS = [
  "bg-primary/15 border border-primary/40",
  "bg-secondary/20 border border-secondary/40",
  "bg-emerald-100/70 border border-emerald-200",
  "bg-blue-100/70 border border-blue-200",
  "bg-amber-100/70 border border-amber-200",
  "bg-rose-100/70 border border-rose-200",
];

const colorForCourse = (course: string, index: number) => {
  if (!course) {
    return COLORS[index % COLORS.length] ?? COLORS[0];
  }
  const hash = Array.from(course).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return COLORS[hash % COLORS.length] ?? COLORS[0];
};

interface TimetableDialogProps {
  schedule: DraftChunk[];
  week: number;
  onPrevWeek?: () => void;
  onNextWeek?: () => void;
  onWeekSelect?: (week: number) => void;
  availableWeeks: number[];
}

const TimetableDialog = ({
  schedule,
  week,
  onPrevWeek,
  onNextWeek,
  onWeekSelect,
  availableWeeks,
}: TimetableDialogProps) => {
  const timeSlots = useMemo(() => {
    const slots = new Set<string>();
    schedule.forEach((chunk) => {
      slots.add(`${chunk.start}-${chunk.end}`);
    });
    return Array.from(slots).sort(compareTimeRange);
  }, [schedule]);

  const classMap = useMemo(() => {
    const map = new Map<string, DraftChunk[]>();
    schedule.forEach((chunk) => {
      const key = `${chunk.start}-${chunk.end}|${chunk.day}`;
      const existing = map.get(key) ?? [];
      existing.push(chunk);
      map.set(key, existing);
    });
    return map;
  }, [schedule]);

  if (!schedule.length) {
    return (
      <div className="text-muted-foreground text-sm">
        Upload a timetable to see the detailed view.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">Week {week} Timetable</h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPrevWeek}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-foreground hover:bg-primary/10 disabled:opacity-40 disabled:cursor-not-allowed"
            disabled={!onPrevWeek}
            aria-label="Previous week"
          >
            ‹
          </button>
          {availableWeeks.length > 0 && onWeekSelect ? (
            <select
              value={String(week)}
              onChange={(event) => onWeekSelect(Number.parseInt(event.target.value, 10))}
              className="h-9 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {availableWeeks.map((value) => (
                <option key={value} value={value}>
                  Week {value}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-sm text-muted-foreground">Week {week}</span>
          )}
          <button
            type="button"
            onClick={onNextWeek}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-foreground hover:bg-primary/10 disabled:opacity-40 disabled:cursor-not-allowed"
            disabled={!onNextWeek}
            aria-label="Next week"
          >
            ›
          </button>
        </div>
      </div>
      <div className="max-h-[60vh] overflow-y-auto pr-2">
        <table className="w-full border border-border rounded-xl overflow-hidden text-sm">
          <thead className="bg-secondary/40 text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left font-medium w-28 sticky left-0 bg-secondary/40 backdrop-blur">
                Time
              </th>
              {DAY_CODES.filter((day) => day !== "SUN").map((day) => (
                <th key={day} className="px-3 py-2 font-medium">
                  {DAY_LABELS[day] ?? day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map((slot) => {
              const [start, end] = slot.split("-");
              const label = formatTimeRange(start, end ?? start);
              return (
                <tr key={slot} className="border-t border-border">
                  <td className="px-3 py-2 align-top text-xs font-medium text-muted-foreground bg-secondary/20 sticky left-0 backdrop-blur">
                    {label}
                  </td>
                  {DAY_CODES.filter((day) => day !== "SUN").map((day, dayIndex) => {
                    const entries = classMap.get(`${slot}|${day}`) ?? [];
                    return (
                      <td key={`${slot}-${day}`} className="px-2 py-2 align-top min-w-[150px]">
                        {entries.length === 0 ? (
                          <div className="text-xs text-muted-foreground/60 italic">—</div>
                        ) : (
                          <div className="space-y-2">
                            {entries.map((entry, idx) => {
                              const color = colorForCourse(entry.course, idx + dayIndex);
                              return (
                                <div
                                  key={`${entry.course}-${idx}`}
                                  className={`rounded-lg p-2 shadow-sm ${color}`}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <div className="font-semibold text-foreground text-xs">
                                        {entry.course || entry.text || "Untitled class"}
                                      </div>
                                      <div className="text-[11px] text-muted-foreground">
                                        {entry.location || "Location TBA"}
                                      </div>
                                    </div>
                                    {entry.type && (
                                      <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
                                        {entry.type}
                                      </Badge>
                                    )}
                                  </div>
                                  {entry.notes && (
                                    <div className="mt-2 text-[11px] text-muted-foreground/80 whitespace-pre-line leading-relaxed">
                                      {entry.notes}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TimetableDialog;
