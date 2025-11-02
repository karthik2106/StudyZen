function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}

export type ExtractTextResult = {
  text: string;
  dataUrl: string;
  mimeType: string;
};

export async function extractTextFromFile(file: File): Promise<ExtractTextResult> {
  const dataUrl = await fileToDataUrl(file);
  const [, base64] = dataUrl.split(",");
  const mimeType =
    file.type || dataUrl.match(/^data:(.+);base64,/i)?.[1] || "";

  if (!base64) {
    throw new Error("Unable to read uploaded file.");
  }

  if (!mimeType) {
    throw new Error("Unsupported file type. Please upload an image or PDF.");
  }

  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error("VITE_SUPABASE_URL is not configured.");
  }

  if (!anonKey) {
    throw new Error("VITE_SUPABASE_ANON_KEY is not configured.");
  }

  const res = await fetch(`${url}/functions/v1/extract-text`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${anonKey}`,
    },
    body: JSON.stringify({ fileBase64: base64, mimeType }),
  });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(
      `Supabase function failed (${res.status}): ${message || res.statusText}`,
    );
  }

  const data: { text?: string; error?: string } = await res.json();
  if (!data.text) {
    throw new Error(data.error || "No text returned by extract-text function.");
  }

  return {
    text: data.text,
    dataUrl,
    mimeType,
  };
}
