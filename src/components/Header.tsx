import { useEffect, useRef, useState } from "react";
import { Clock, Sparkles, Edit3, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const NAME_STORAGE_KEY = "study-zen-user-name";

type WindowWithGoogle = Window & {
  googleUserName?: string;
  googleUser?: { name?: string };
  googleProfileName?: string;
  google?: {
    accounts?: {
      id?: {
        getProfile?: () => { name?: string };
      };
    };
  };
};

const detectGoogleName = (): string | null => {
  if (typeof window === "undefined") return null;
  const w = window as WindowWithGoogle;

  const directCandidates = [
    w.googleUserName,
    w.googleUser?.name,
    w.googleProfileName,
    w.google?.accounts?.id?.getProfile?.().name,
  ].filter((value): value is string => typeof value === "string" && value.trim().length > 0);

  if (directCandidates.length > 0) {
    return directCandidates[0]!.trim();
  }

  const storageCandidates = [
    "googleUserName",
    "google-user-name",
    "google_profile_name",
    "google_profile",
    "userName",
    "user_name",
  ];

  for (const key of storageCandidates) {
    try {
      const stored = window.localStorage.getItem(key);
      if (stored && stored.trim()) {
        return stored.trim();
      }
    } catch {
      // Ignore storage access errors
    }
  }

  return null;
};

const Header = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userName, setUserName] = useState<string>("Student");
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const saved = window.localStorage.getItem(NAME_STORAGE_KEY);
    if (saved && saved.trim()) {
      setUserName(saved.trim());
      return;
    }

    const initialGoogleName = detectGoogleName();
    if (initialGoogleName) {
      setUserName(initialGoogleName);
      window.localStorage.setItem(NAME_STORAGE_KEY, initialGoogleName);
      return;
    }

    let attempts = 0;
    const interval = window.setInterval(() => {
      attempts += 1;
      const candidate = detectGoogleName();
      if (candidate) {
        setUserName(candidate);
        window.localStorage.setItem(NAME_STORAGE_KEY, candidate);
        window.clearInterval(interval);
      }
      if (attempts >= 10) {
        window.clearInterval(interval);
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isEditingName) return undefined;
    const timeout = window.setTimeout(() => {
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
    }, 10);
    return () => window.clearTimeout(timeout);
  }, [isEditingName]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const startEditingName = () => {
    setNameDraft(userName);
    setIsEditingName(true);
  };

  const cancelEditingName = () => {
    setIsEditingName(false);
    setNameDraft("");
  };

  const saveName = () => {
    const trimmed = nameDraft.trim() || "Student";
    setUserName(trimmed);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(NAME_STORAGE_KEY, trimmed);
    }
    setIsEditingName(false);
  };

  return (
    <header className="mb-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6 gap-6">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h1 className="text-4xl font-bold text-foreground">
              {getGreeting()},
            </h1>
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <Input
                  ref={nameInputRef}
                  value={nameDraft}
                  onChange={(event) => setNameDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      saveName();
                    } else if (event.key === "Escape") {
                      event.preventDefault();
                      cancelEditingName();
                    }
                  }}
                  className="h-10 w-48 text-base"
                  placeholder="Enter your name"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={saveName}
                  aria-label="Save name"
                >
                  <Check className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={cancelEditingName}
                  aria-label="Cancel editing name"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={startEditingName}
                className="inline-flex items-center gap-2 rounded-lg border border-transparent px-3 py-1.5 text-3xl font-semibold text-primary transition-colors hover:border-primary/40 hover:bg-primary/10"
              >
                <span>{userName}</span>
                <Edit3 className="w-5 h-5 text-primary/70" />
              </button>
            )}
          </div>
          <p className="text-muted-foreground flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {formatDate(currentTime)} • {formatTime(currentTime)}
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 px-6 py-3 bg-glass backdrop-blur-sm border border-glass rounded-xl">
          <Sparkles className="w-5 h-5 text-primary" />
          <p className="text-sm italic text-foreground/90">
            "Success is the sum of small efforts repeated day in and day out."
          </p>
        </div>
      </div>
    </header>
  );
};

export default Header;
