import { useCallback, useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import UploadZone from "@/components/UploadZone";
import type { ExtractedSchedulePayload } from "@/components/UploadZone";
import ClassCard, { type ClassCardEntry } from "@/components/ClassCard";
import DeadlineCard from "@/components/DeadlineCard";
import AISuggestionBox from "@/components/AISuggestionBox";
import TodoList from "@/components/TodoList";
import Footer from "@/components/Footer";
import type { DraftChunk } from "@/lib/ocr/parseDraft";
import TimetableMini from "@/components/TimetableMini";
import TimetableDialog from "@/components/TimetableDialog";
import { formatTimeRange } from "@/lib/time";
import { DAY_CODES, DAY_LABELS } from "@/constants/days";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";

const WEEK_STORAGE_KEY = "study-zen-selected-week";
const WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;

type WeekState = {
  week: number;
  setAt: Date;
};

const startOfWeek = (input: Date): Date => {
  const date = new Date(input);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay();
  const diff = (day + 6) % 7; // Convert Sunday (0) => 6, Monday (1) => 0, ...
  date.setDate(date.getDate() - diff);
  return date;
};

const addWeeks = (date: Date, weeks: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + weeks * 7);
  return result;
};

const adjustWeekState = (state: WeekState, now = new Date()): WeekState => {
  const base = startOfWeek(state.setAt);
  const current = startOfWeek(now);
  const diff = Math.floor((current.getTime() - base.getTime()) / WEEK_IN_MS);

  if (diff <= 0) {
    return { week: state.week, setAt: base };
  }

  return {
    week: state.week + diff,
    setAt: addWeeks(base, diff),
  };
};

const getInitialWeekState = (): WeekState => {
  const now = new Date();
  const fallback: WeekState = {
    week: 1,
    setAt: startOfWeek(now),
  };

  if (typeof window === "undefined") {
    return fallback;
  }

  const raw = window.localStorage.getItem(WEEK_STORAGE_KEY);
  if (!raw) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(raw) as { week?: number; setAt?: string };
    const storedWeek = Number.isInteger(parsed?.week) && (parsed!.week ?? 0) > 0 ? parsed!.week! : 1;
    const storedDate = parsed?.setAt ? new Date(parsed.setAt) : fallback.setAt;
    const validDate = Number.isNaN(storedDate.getTime()) ? fallback.setAt : startOfWeek(storedDate);
    return adjustWeekState({ week: storedWeek, setAt: validDate }, now);
  } catch {
    return fallback;
  }
};

const serializeWeekState = (state: WeekState) => JSON.stringify({
  week: state.week,
  setAt: state.setAt.toISOString(),
});

const getNextWeekBoundary = (from: Date): Date => addWeeks(startOfWeek(from), 1);

const filterScheduleByWeek = (schedule: DraftChunk[], week: number): DraftChunk[] => {
  if (!schedule.length) return schedule;
  if (!Number.isInteger(week) || week <= 0) return schedule;

  return schedule.filter((chunk) => {
    if (!chunk.weeks || chunk.weeks.length === 0) {
      return true;
    }
    return chunk.weeks.includes(week);
  });
};

const sanitizeNotes = (value?: string): string | undefined => {
  if (!value) return undefined;
  const lines = value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) return undefined;

  return lines.join("\n");
};

const buildClassesForDay = (chunks: DraftChunk[], day: string): ClassCardEntry[] => {
  if (!day) return [];

  return chunks
    .filter((chunk) => chunk.day === day)
    .sort((a, b) => a.start.localeCompare(b.start))
    .map((chunk) => {
      const notes = sanitizeNotes(chunk.notes ?? (chunk.text && chunk.text !== chunk.type ? chunk.text : ""));

      return {
        time: formatTimeRange(chunk.start, chunk.end) || "Time TBA",
        subject: chunk.course || chunk.text || "Untitled class",
        location: chunk.location || "Location TBA",
        type: chunk.type,
        notes,
      };
    });
};

const Index = () => {
  const [schedule, setSchedule] = useState<DraftChunk[]>([]);
  const [weekState, setWeekState] = useState<WeekState>(() => getInitialWeekState());

  const persistWeekState = useCallback((state: WeekState) => {
    setWeekState(state);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(WEEK_STORAGE_KEY, serializeWeekState(state));
    }
  }, []);

  const updateWeek = useCallback(
    (week: number, referenceDate?: Date) => {
      const safeWeek = Number.isInteger(week) && week > 0 ? week : 1;
      const base = startOfWeek(referenceDate ?? new Date());
      persistWeekState({ week: safeWeek, setAt: base });
    },
    [persistWeekState],
  );

  const now = new Date();
  const todayDay = DAY_CODES[now.getDay()];
  const tomorrowDay = DAY_CODES[(now.getDay() + 1) % DAY_CODES.length];

  const availableWeeks = useMemo(() => {
    const weeks = new Set<number>();
    schedule.forEach((chunk) => {
      chunk.weeks?.forEach((week) => weeks.add(week));
    });
    return Array.from(weeks).sort((a, b) => a - b);
  }, [schedule]);

  const weekOptions = useMemo(() => {
    const baseOptions = availableWeeks.length
      ? availableWeeks
      : Array.from({ length: 15 }, (_, index) => index + 1);
    const optionSet = new Set<number>(baseOptions);
    if (Number.isInteger(weekState.week)) {
      optionSet.add(weekState.week);
    }
    return Array.from(optionSet).sort((a, b) => a - b);
  }, [availableWeeks, weekState.week]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const adjusted = adjustWeekState(weekState);
    if (adjusted.week !== weekState.week || adjusted.setAt.getTime() !== weekState.setAt.getTime()) {
      persistWeekState(adjusted);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!schedule.length || !availableWeeks.length) {
      return;
    }
    if (!availableWeeks.includes(weekState.week)) {
      updateWeek(availableWeeks[0]);
    }
  }, [availableWeeks, schedule.length, updateWeek, weekState.week]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const nowDate = new Date();
    const boundary = getNextWeekBoundary(nowDate);
    const timeoutId = window.setTimeout(() => {
      updateWeek(weekState.week + 1, boundary);
    }, boundary.getTime() - nowDate.getTime());

    return () => window.clearTimeout(timeoutId);
  }, [updateWeek, weekState.week, weekState.setAt]);

  const filteredSchedule = useMemo(
    () => filterScheduleByWeek(schedule, weekState.week),
    [schedule, weekState.week],
  );

  const todayClasses = useMemo(
    () => buildClassesForDay(filteredSchedule, todayDay),
    [filteredSchedule, todayDay],
  );
  const tomorrowClasses = useMemo(
    () => buildClassesForDay(filteredSchedule, tomorrowDay),
    [filteredSchedule, tomorrowDay],
  );

  const handleScheduleExtracted = useCallback(
    ({ schedule: extractedSchedule }: ExtractedSchedulePayload) => {
      setSchedule(extractedSchedule);
      const weeks = new Set<number>();
      extractedSchedule.forEach((chunk) => {
        chunk.weeks?.forEach((week) => weeks.add(week));
      });
      if (weeks.size > 0 && !weeks.has(weekState.week)) {
        updateWeek(Math.min(...weeks));
      }
    },
    [updateWeek, weekState.week],
  );

  return (
    <div className="min-h-screen bg-gradient-main p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <Header />

        <div className="grid gap-6 mb-6">
          <UploadZone onScheduleExtracted={handleScheduleExtracted} />
        </div>

        <div className="grid gap-6 mb-6 md:grid-cols-2">
          {filteredSchedule.length > 0 ? (
            <Dialog>
              <div className="bg-glass backdrop-blur-sm border border-glass rounded-2xl p-4 h-full flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-primary" />
                    <div>
                      <h3 className="text-base font-semibold uppercase tracking-wide text-muted-foreground">
                        Timetable Preview
                      </h3>
                      <p className="text-xs text-muted-foreground">Week {weekState.week}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => updateWeek(Math.max(1, weekState.week - 1))}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Select
                      value={String(weekState.week)}
                      onValueChange={(value) => updateWeek(Number.parseInt(value, 10))}
                    >
                      <SelectTrigger className="w-[120px] h-9 text-xs">
                        <SelectValue placeholder="Select week" />
                      </SelectTrigger>
                      <SelectContent>
                        {weekOptions.map((week) => (
                          <SelectItem key={week} value={String(week)}>
                            Week {week}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => updateWeek(weekState.week + 1)}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="flex-1 rounded-xl border border-dashed border-border/80 bg-background/60 hover:border-primary/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background"
                  >
                    <div className="max-h-[160px] overflow-hidden px-2 py-3">
                      <TimetableMini schedule={filteredSchedule} />
                    </div>
                    <p className="px-3 pb-3 text-[11px] text-muted-foreground text-right">
                      Click to view full timetable
                    </p>
                  </button>
                </DialogTrigger>
              </div>
              <DialogContent className="max-h-[80vh] overflow-hidden">
                <DialogTitle className="sr-only">Timetable Preview</DialogTitle>
                <TimetableDialog
                  schedule={filteredSchedule}
                  week={weekState.week}
                  availableWeeks={weekOptions}
                  onPrevWeek={() => updateWeek(Math.max(1, weekState.week - 1))}
                  onNextWeek={() => updateWeek(weekState.week + 1)}
                  onWeekSelect={(newWeek) => updateWeek(newWeek)}
                />
              </DialogContent>
            </Dialog>
          ) : (
            <div className="bg-glass backdrop-blur-sm border border-dashed border-border rounded-2xl p-6 flex flex-col items-center justify-center text-center text-sm text-muted-foreground">
              <CalendarDays className="w-6 h-6 mb-3 text-primary" />
              <p>Upload a timetable to see your weekly snapshot.</p>
            </div>
          )}
          <TodoList />
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <ClassCard title={`Today's Classes (Week ${weekState.week})`} classes={todayClasses} />
          <DeadlineCard />
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <AISuggestionBox />
          <ClassCard title={`Tomorrow's Classes (Week ${weekState.week})`} classes={tomorrowClasses} />
        </div>

        <Footer />
      </div>
    </div>
  );
};

export default Index;
