import { serve, createClient } from "./deps.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!SUPABASE_URL) {
  throw new Error("SUPABASE_URL is not set");
}

if (!SERVICE_KEY) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: {
    persistSession: false,
  },
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type SchedulePayload = {
  extensionId?: unknown;
  rawText?: unknown;
  schedule?: unknown;
};

const isUuid = (value: string | null | undefined): value is string =>
  typeof value === "string" && UUID_RE.test(value);

const toErrorResponse = (message: string, status = 400) =>
  new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });

const toSuccessResponse = (payload: Record<string, unknown> = {}, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });

const toHtmlResponse = (body: string, status = 200) =>
  new Response(body, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const queryExtensionId = url.searchParams.get("extensionId");
    const action = url.searchParams.get("action")?.toLowerCase();

    if (req.method === "GET") {
      if (action === "delete") {
        if (!isUuid(queryExtensionId)) {
          return toHtmlResponse("<h1>Invalid uninstall token.</h1>", 400);
        }

        const { error } = await supabase
          .from("extension_schedules")
          .delete()
          .eq("extension_id", queryExtensionId);

        if (error) {
          console.error("Failed to delete schedule on uninstall", error);
          return toHtmlResponse("<h1>Failed to delete your data.</h1>", 500);
        }

        return toHtmlResponse("<h1>Your StudyZen.ai extension data was removed.</h1>");
      }

      if (!isUuid(queryExtensionId)) {
        return toErrorResponse("extensionId query parameter is required");
      }

      const { data, error } = await supabase
        .from("extension_schedules")
        .select("raw_text, schedule, updated_at")
        .eq("extension_id", queryExtensionId)
        .maybeSingle();

      if (error) {
        console.error("Failed to fetch schedule", error);
        return toErrorResponse("Unable to fetch schedule", 500);
      }

      if (!data) {
        return toSuccessResponse({ schedule: null, rawText: null, updatedAt: null }, 200);
      }

      return toSuccessResponse({
        schedule: data.schedule,
        rawText: data.raw_text,
        updatedAt: data.updated_at,
      });
    }

    if (req.method === "DELETE") {
      let extensionId = queryExtensionId;
      if (!extensionId) {
        const payload = (await req.json()) as SchedulePayload;
        if (typeof payload.extensionId === "string") {
          extensionId = payload.extensionId;
        }
      }

      if (!isUuid(extensionId)) {
        return toErrorResponse("extensionId is required for deletion");
      }

      const { error } = await supabase
        .from("extension_schedules")
        .delete()
        .eq("extension_id", extensionId);

      if (error) {
        console.error("Failed to delete schedule", error);
        return toErrorResponse("Unable to delete schedule", 500);
      }

      return toSuccessResponse({ success: true });
    }

    if (req.method === "POST") {
      const payload = (await req.json()) as SchedulePayload;

      if (!isUuid(payload.extensionId as string)) {
        return toErrorResponse("Valid extensionId is required");
      }

      if (typeof payload.rawText !== "string" || !payload.rawText.trim()) {
        return toErrorResponse("rawText is required");
      }

      let schedule: unknown = null;
      if (Array.isArray(payload.schedule)) {
        schedule = payload.schedule;
      } else if (typeof payload.schedule === "string") {
        try {
          schedule = JSON.parse(payload.schedule);
        } catch {
          return toErrorResponse("schedule must be valid JSON");
        }
      }

      if (!schedule || !Array.isArray(schedule)) {
        return toErrorResponse("schedule array is required");
      }

      const { error } = await supabase
        .from("extension_schedules")
        .upsert(
          {
            extension_id: payload.extensionId,
            raw_text: payload.rawText,
            schedule: schedule as unknown[],
          },
          {
            onConflict: "extension_id",
            ignoreDuplicates: false,
          },
        );

      if (error) {
        console.error("Failed to persist schedule", error);
        return toErrorResponse("Unable to persist schedule", 500);
      }

      return toSuccessResponse({ success: true });
    }

    return toErrorResponse("Unsupported method", 405);
  } catch (error) {
    console.error("Unhandled error in extension-schedule function:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return toErrorResponse(message, 500);
  }
});
