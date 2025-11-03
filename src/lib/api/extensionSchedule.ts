import type { DraftChunk } from "@/lib/ocr/parseDraft";

type PersistedScheduleResponse = {
  schedule: DraftChunk[] | null;
  rawText: string | null;
  updatedAt: string | null;
};

const resolveSupabaseConfig = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error("VITE_SUPABASE_URL is not configured.");
  }

  if (!anonKey) {
    throw new Error("VITE_SUPABASE_ANON_KEY is not configured.");
  }

  return { url, anonKey };
};

const getFunctionUrl = (): string => {
  const { url } = resolveSupabaseConfig();
  return `${url}/functions/v1/extension-schedule`;
};

const defaultHeaders = () => {
  const { anonKey } = resolveSupabaseConfig();
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${anonKey}`,
  };
};

export const savePersistedSchedule = async (
  extensionId: string,
  rawText: string,
  schedule: DraftChunk[],
): Promise<void> => {
  const response = await fetch(getFunctionUrl(), {
    method: "POST",
    headers: defaultHeaders(),
    body: JSON.stringify({
      extensionId,
      rawText,
      schedule,
    }),
  });

  if (!response.ok) {
    let detail: unknown;
    try {
      detail = await response.json();
    } catch {
      // ignore
    }

    const message =
      typeof detail === "object" && detail && "error" in detail
        ? String((detail as { error?: unknown }).error ?? response.statusText)
        : response.statusText;

    throw new Error(`Failed to persist schedule: ${message}`);
  }
};

export const fetchPersistedSchedule = async (
  extensionId: string,
): Promise<PersistedScheduleResponse> => {
  const response = await fetch(`${getFunctionUrl()}?extensionId=${encodeURIComponent(extensionId)}`, {
    method: "GET",
    headers: defaultHeaders(),
  });

  if (!response.ok) {
    let detail: unknown;
    try {
      detail = await response.json();
    } catch {
      // ignore
    }

    const message =
      typeof detail === "object" && detail && "error" in detail
        ? String((detail as { error?: unknown }).error ?? response.statusText)
        : response.statusText;

    throw new Error(`Failed to load schedule: ${message}`);
  }

  const data = (await response.json()) as PersistedScheduleResponse;
  return {
    schedule: Array.isArray(data.schedule) ? data.schedule : [],
    rawText: typeof data.rawText === "string" ? data.rawText : null,
    updatedAt: typeof data.updatedAt === "string" ? data.updatedAt : null,
  };
};
