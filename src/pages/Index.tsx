import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Header from "@/components/Header";
import UploadZone, { type ExtractedSchedulePayload, type UploadZoneHandle } from "@/components/UploadZone";
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
import { useToast } from "@/hooks/use-toast";
import { getExtensionIdentity } from "@/lib/extensionIdentity";
import { fetchPersistedSchedule, savePersistedSchedule } from "@/lib/api/extensionSchedule";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

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
  const [extensionId, setExtensionId] = useState<string | null>(null);
  const [classView, setClassView] = useState<"today" | "tomorrow">("today");
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const currentWeekRef = useRef(weekState.week);
  const uploadZoneRef = useRef<UploadZoneHandle | null>(null);
  const hasSchedule = schedule.length > 0;
  const navLinks = useMemo(() => ([
    {
      label: "NTULearn",
      href: "https://ntulearn.ntu.edu.sg",
      icon: "/icons/ntulearn.svg",
      alt: "NTULearn",
    },
    {
      label: "ChatGPT",
      href: "https://chatgpt.com/",
      icon: "/icons/chatgpt.svg",
      alt: "ChatGPT",
    },
  ]), []);

  useEffect(() => {
    currentWeekRef.current = weekState.week;
  }, [weekState.week]);

  useEffect(() => {
    const sectionMap: Record<string, string> = {
      "/dashboard": "dashboard",
      "/timetable": "timetable",
      "/tasks": "tasks",
      "/deadlines": "deadlines",
    };

    const sectionId = sectionMap[location.pathname];
    if (!sectionId) {
      return;
    }

    if (typeof window !== "undefined") {
      window.requestAnimationFrame(() => {
        const element = document.getElementById(sectionId);
        element?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }

    if (location.pathname !== "/") {
      navigate("/", { replace: true });
    }
  }, [location.pathname, navigate]);

  const registerUninstallCleanup = useCallback((id: string) => {
    if (typeof chrome === "undefined" || !chrome.runtime?.setUninstallURL) {
      return;
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      return;
    }

    const uninstallUrl = `${supabaseUrl}/functions/v1/extension-schedule?action=delete&extensionId=${encodeURIComponent(id)}`;
    try {
      chrome.runtime.setUninstallURL(uninstallUrl);
    } catch (error) {
      console.warn("Unable to set uninstall URL:", error);
    }
  }, []);

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

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        const id = await getExtensionIdentity();
        if (cancelled) return;

        setExtensionId(id);
        registerUninstallCleanup(id);

        const persisted = await fetchPersistedSchedule(id);
        if (cancelled) return;

        const persistedSchedule = Array.isArray(persisted.schedule) ? persisted.schedule : [];
        if (persistedSchedule.length > 0) {
          setSchedule(persistedSchedule);
          const weeks = new Set<number>();
          persistedSchedule.forEach((chunk) => {
            chunk.weeks?.forEach((week) => weeks.add(week));
          });
          if (weeks.size > 0 && !weeks.has(currentWeekRef.current)) {
            updateWeek(Math.min(...weeks));
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to restore timetable.";
        console.error("Failed to restore schedule from Supabase:", error);
        toast({
          title: "Unable to load saved timetable",
          description: message,
          variant: "destructive",
        });
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [registerUninstallCleanup, toast, updateWeek]);

  const handleUploadButtonClick = useCallback(() => {
    uploadZoneRef.current?.openFilePicker();
  }, []);

  const now = new Date();
  const todayIndex = now.getDay();
  const todayDay = DAY_CODES[todayIndex];
  const tomorrowDay = DAY_CODES[(todayIndex + 1) % DAY_CODES.length];

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

  const previewDays = useMemo(
    () => Array.from({ length: 4 }, (_, offset) => DAY_CODES[(todayIndex + offset) % DAY_CODES.length]),
    [todayIndex],
  );

  const previewSchedule = useMemo(() => {
    const daySet = new Set(previewDays);
    return filteredSchedule.filter((chunk) => daySet.has(chunk.day));
  }, [filteredSchedule, previewDays]);

  const todayClasses = useMemo(
    () => buildClassesForDay(filteredSchedule, todayDay),
    [filteredSchedule, todayDay],
  );
  const tomorrowClasses = useMemo(
    () => buildClassesForDay(filteredSchedule, tomorrowDay),
    [filteredSchedule, tomorrowDay],
  );
  const displayedClasses = classView === "today" ? todayClasses : tomorrowClasses;
  const displayedLabel = classView === "today" ? "Today's" : "Tomorrow's";

  const handleScheduleExtracted = useCallback(
    async ({ schedule: extractedSchedule, rawText }: ExtractedSchedulePayload) => {
      setSchedule(extractedSchedule);

      const weeks = new Set<number>();
      extractedSchedule.forEach((chunk) => {
        chunk.weeks?.forEach((week) => weeks.add(week));
      });
      if (weeks.size > 0 && !weeks.has(weekState.week)) {
        updateWeek(Math.min(...weeks));
      }

      try {
        let resolvedId = extensionId;
        if (!resolvedId) {
          resolvedId = await getExtensionIdentity();
          setExtensionId(resolvedId);
          registerUninstallCleanup(resolvedId);
        }

        await savePersistedSchedule(resolvedId, rawText, extractedSchedule);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to save timetable.";
        console.error("Failed to persist schedule to Supabase:", error);
        toast({
          title: "Unable to save timetable",
          description: message,
          variant: "destructive",
        });
      }
    },
    [extensionId, registerUninstallCleanup, toast, updateWeek, weekState.week],
  );

  return (
    <div className="min-h-screen bg-gradient-main p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <Header />

        <div id="dashboard" className="mb-6 space-y-4">
          <div className="bg-glass backdrop-blur-sm border border-glass rounded-2xl px-4 py-3 md:px-6 flex flex-wrap items-center justify-between gap-3">
            <nav className="flex flex-wrap items-center gap-3 text-sm font-medium text-muted-foreground">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full px-3 py-1 transition-colors duration-200 hover:bg-primary/10 hover:text-foreground"
                >
                  <img
                    src={link.icon}
                    alt={link.alt}
                    className="h-5 w-5 rounded-full object-contain bg-white/80 p-[2px]"
                    referrerPolicy="no-referrer"
                  />
                  <span>{link.label}</span>
                </a>
              ))}
            </nav>
            <Button
              size="sm"
              variant="secondary"
              className="flex items-center gap-2"
              onClick={handleUploadButtonClick}
            >
              Re-upload timetable
            </Button>
          </div>
          <UploadZone
            ref={uploadZoneRef}
            onScheduleExtracted={handleScheduleExtracted}
            isVisible={false}
          />
        </div>

        <div id="timetable" className="grid gap-6 mb-6 md:grid-cols-2">
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
                  className="flex-1 rounded-xl border border-border/70 bg-background/70 hover:border-primary/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background flex flex-col"
                  >
                    <div className="flex-1 overflow-hidden px-4 py-2 flex">
                      <TimetableMini schedule={previewSchedule} days={previewDays} className="h-full w-full" />
                    </div>
                    <p className="px-4 pb-2 pt-1 text-[11px] text-muted-foreground text-right">
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
          <div id="tasks" className="h-full">
            <TodoList />
          </div>
        </div>

        <div id="deadlines" className="grid md:grid-cols-2 gap-6 mb-6">
          <ClassCard
            title={`${displayedLabel} Classes (Week ${weekState.week})`}
            classes={displayedClasses}
            actions={(
              <div className="relative inline-flex w-44 select-none rounded-full bg-secondary/40 p-1">
                <span
                  className={`absolute inset-1 w-[calc(50%-0.25rem)] rounded-full bg-primary shadow-sm transition-transform duration-300 ease-out ${
                    classView === "tomorrow" ? "translate-x-full" : "translate-x-0"
                  }`}
                />
                <button
                  type="button"
                  className={`relative z-10 flex-1 rounded-full px-4 py-1 text-xs font-semibold transition-colors duration-200 ${
                    classView === "today" ? "text-primary-foreground" : "text-muted-foreground"
                  }`}
                  onClick={() => setClassView("today")}
                >
                  Today
                </button>
                <button
                  type="button"
                  className={`relative z-10 flex-1 rounded-full px-4 py-1 text-xs font-semibold transition-colors duration-200 ${
                    classView === "tomorrow" ? "text-primary-foreground" : "text-muted-foreground"
                  }`}
                  onClick={() => setClassView("tomorrow")}
                >
                  Tomorrow
                </button>
              </div>
            )}
          />
          <DeadlineCard />
        </div>

        <div className="grid md:grid-cols-1 gap-6 mb-6">
          <AISuggestionBox />
        </div>

        <Footer />
      </div>
    </div>
  );
};

export default Index;
