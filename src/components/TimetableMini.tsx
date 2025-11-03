import type { DraftChunk } from "@/lib/ocr/parseDraft";
import { DAY_CODES } from "@/constants/days";
import { useMemo } from "react";
import clsx from "clsx";

const COLORS = [
  "bg-primary/20 border-primary/30 text-primary-foreground",
  "bg-secondary/40 border-secondary/60 text-secondary-foreground",
  "bg-emerald-200/70 border-emerald-300 text-emerald-900",
  "bg-blue-200/70 border-blue-300 text-blue-900",
  "bg-amber-200/70 border-amber-300 text-amber-900",
  "bg-rose-200/70 border-rose-300 text-rose-900",
];

const getColorForCourse = (course: string, index: number): string => {
  if (!course) {
    return COLORS[index % COLORS.length] ?? COLORS[0];
  }
  const hash = Array.from(course).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return COLORS[hash % COLORS.length] ?? COLORS[0];
};

export type TimetableMiniProps = {
  schedule: DraftChunk[];
  condensed?: boolean;
  days?: readonly string[];
  className?: string;
};

const TimetableMini = ({ schedule, days, className }: TimetableMiniProps) => {
  const dayOrder = useMemo(
    () => (days && days.length ? Array.from(new Set(days)) : DAY_CODES),
    [days],
  );

  const groupedByDay = useMemo(() => {
    const dayMap = new Map<string, DraftChunk[]>();
    dayOrder.forEach((day) => dayMap.set(day, []));
    schedule.forEach((entry) => {
      if (!dayMap.has(entry.day)) {
        dayMap.set(entry.day, []);
      }
      dayMap.get(entry.day)?.push(entry);
    });
    dayOrder.forEach((day) => {
      const items = dayMap.get(day);
      if (items) {
        items.sort((a, b) => a.start.localeCompare(b.start));
      }
    });
    return dayMap;
  }, [schedule, dayOrder]);

  if (!schedule.length) {
    return (
      <div className="text-center text-xs text-muted-foreground">
        Upload a timetable to see your schedule.
      </div>
    );
  }
  return (
    <div
      className={clsx("grid gap-2", className)}
      style={{ gridTemplateColumns: `repeat(${dayOrder.length}, minmax(0, 1fr))` }}
    >
      {dayOrder.map((day, dayIndex) => {
        const entries = groupedByDay.get(day) ?? [];
        if (entries.length === 0) {
          return (
            <div
              key={day}
              className="min-h-[120px] rounded-xl border border-dashed border-border/60 bg-background/80 flex flex-col items-center justify-center text-xs text-muted-foreground gap-1"
            >
              <span className="text-sm font-medium">{day}</span>
              <span>No classes</span>
            </div>
          );
        }

        return (
          <div
            key={day}
            className="min-h-[120px] rounded-xl border border-border bg-background/80 p-2 flex flex-col gap-2"
          >
            <span className="text-sm font-semibold text-foreground text-center">{day}</span>
            <div className="flex flex-col gap-2">
              {entries.map((entry, index) => {
                const colorClass = getColorForCourse(entry.course, index + dayIndex);
                return (
                  <div
                    key={`${entry.course}-${entry.start}-${index}`}
                    className={`rounded-lg border text-[10px] leading-tight p-2 shadow-sm ${colorClass}`}
                  >
                    <div className="font-semibold text-xs text-center truncate">
                      {entry.course || entry.text || "Class"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TimetableMini;
