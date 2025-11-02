import { useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { Upload, CheckCircle2, Redo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { extractTextFromFile, type ExtractTextResult } from "@/lib/ai/extractTextFromFile";
import { draftChunk, type DraftChunk } from "@/lib/ocr/parseDraft";

export type ExtractedSchedulePayload = {
  schedule: DraftChunk[];
  rawText: string;
};

type UploadZoneProps = {
  onScheduleExtracted?: (payload: ExtractedSchedulePayload) => void;
};

const UploadZone = ({ onScheduleExtracted }: UploadZoneProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<ExtractTextResult & { name: string } | null>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (isProcessing) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      void handleFileUpload(file);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || isProcessing) return;

    void handleFileUpload(file);
    // allow re-selecting the same file later
    event.target.value = "";
  };

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    console.log("📎 Uploaded file:", file);

    try {
      const { text: rawText, dataUrl, mimeType } = await extractTextFromFile(file);
      console.log("🧾 Extracted OCR text:", rawText);

      const draft = draftChunk(rawText);
      console.log("📊 Draft timetable blocks:", draft);

      if (!rawText.trim()) {
        throw new Error("No text returned by Gemini 2.0.");
      }

      onScheduleExtracted?.({ schedule: draft, rawText });
      setPreview({ text: rawText, dataUrl, mimeType, name: file.name });

      setIsUploaded(true);
      toast({
        title: "Timetable processed!",
        description: draft.length
          ? `Extracted ${draft.length} timetable entries with Gemini 2.0.`
          : "Extracted text with Gemini 2.0.",
      });
      setTimeout(() => setIsUploaded(false), 3000);
    } catch (error) {
      console.error("Vision extraction failed", error);
      toast({
        title: "Unable to process timetable",
        description:
          error instanceof Error ? error.message : "Gemini 2.0 request failed.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      className={`relative bg-glass backdrop-blur-sm border-2 ${preview ? "" : "border-dashed"} rounded-2xl p-8 text-center transition-all duration-300 ${
        isDragging
          ? "border-primary bg-primary/10 scale-105"
          : "border-glass hover:border-primary/50"
      } ${isUploaded ? "border-success" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input ref={fileInputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileInputChange} />
      {preview ? (
        <Button
          variant="secondary"
          onClick={handleButtonClick}
          disabled={isProcessing}
          className="flex items-center gap-2 mx-auto"
        >
          <Redo2 className="w-4 h-4" />
          Re-upload timetable
        </Button>
      ) : (
        <>
          {isUploaded ? (
            <div className="animate-scale-in">
              <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-success" />
              <h3 className="text-xl font-semibold mb-2 text-success">Upload Successful!</h3>
              <p className="text-muted-foreground">Your timetable has been processed</p>
            </div>
          ) : (
            <>
              <Upload className="w-16 h-16 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">Upload Your Timetable</h3>
              <p className="text-muted-foreground mb-6">
                Drag and drop your timetable screenshot or PDF here, or click to browse
              </p>
              <Button
                onClick={handleButtonClick}
                disabled={isProcessing}
                className="bg-primary hover:bg-primary/90 disabled:opacity-70"
              >
                {isProcessing ? "Processing..." : "Choose File"}
              </Button>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default UploadZone;
