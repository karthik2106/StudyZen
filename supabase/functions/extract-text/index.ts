import { serve } from "./deps.ts";

const GEMINI_KEY = Deno.env.get("GEMINI_API_KEY");

if (!GEMINI_KEY) {
  throw new Error("GEMINI_API_KEY is not set");
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  try {
    const body = await req.json();
    const { fileBase64, mimeType } = body;

    if (!fileBase64) {
      return new Response(JSON.stringify({ error: "Missing fileBase64" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const dataUrlMatch = typeof fileBase64 === "string"
      ? fileBase64.match(/^data:(.+);base64,(.+)$/)
      : null;

    const normalizedMimeType =
      typeof mimeType === "string" && mimeType.length > 0
        ? mimeType
        : dataUrlMatch?.[1];
    const base64Payload = dataUrlMatch ? dataUrlMatch[2] : fileBase64;

    if (!normalizedMimeType) {
      return new Response(JSON.stringify({ error: "Missing mimeType" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const systemPrompt = `You are a timetable extraction assistant. Analyze this timetable document carefully:

1. The timetable has a HEADER ROW with days of the week (MON, TUE, WED, THU, FRI, SAT, SUN)
2. Each ROW represents a time slot (e.g., "0930 to 1030")
3. Each COLUMN under a day contains classes for that specific day
4. Pay close attention to which COLUMN each class appears in - the column position determines the day

Extract and return a JSON object with a "schedule" array. Each entry should have:
- day: The EXACT day from the column header (MON, TUE, WED, THU, FRI, SAT, or SUN)
- start: Start time in 24-hour format (e.g., "0930")
- end: End time in 24-hour format (e.g., "1030")
- course: Course code (e.g., "SC404S", "HW2208")
- location: Room/location (e.g., "ws119-19", "ONLINE")
- type: Class type (e.g., "LEC", "TUT", "SEM", "LAB")
- notes: Any additional information

CRITICAL: Match each class to the correct day by carefully checking which COLUMN it appears in.
Only include time slots that have scheduled classes. Skip empty cells.

Return ONLY valid JSON, no explanation or markdown.`;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text:
                    `${systemPrompt}\n\nCarefully analyze the attached timetable and produce the required JSON.`,
                },
                {
                  inlineData: {
                    mimeType: normalizedMimeType,
                    data: base64Payload,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
          },
        }),
      },
    );

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.text();
      throw new Error(`Gemini API error (${geminiResponse.status}): ${errorData}`);
    }

    const data = await geminiResponse.json();
    const text = data.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text ?? "")
      .join("") ?? "";

    return new Response(JSON.stringify({ text }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (err) {
    console.error("❌ OCR Error:", err);

    // Log more details about the error
    const errorMessage = err instanceof Error ? err.message : String(err);
    const errorStack = err instanceof Error ? err.stack : undefined;
    console.error("Error message:", errorMessage);
    console.error("Error stack:", errorStack);

    return new Response(JSON.stringify({
      error: "Failed to extract text",
      details: errorMessage
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
