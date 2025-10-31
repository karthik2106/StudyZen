import { useState } from "react";
import { Upload, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const UploadZone = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);
  const { toast } = useToast();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleUpload();
  };

  const handleUpload = () => {
    setIsUploaded(true);
    toast({
      title: "Timetable uploaded successfully!",
      description: "Your schedule has been processed.",
    });
    setTimeout(() => setIsUploaded(false), 3000);
  };

  return (
    <div
      className={`relative bg-glass backdrop-blur-sm border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
        isDragging
          ? "border-primary bg-primary/10 scale-105"
          : "border-glass hover:border-primary/50"
      } ${isUploaded ? "border-success" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
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
            Drag and drop your timetable screenshot here, or click to browse
          </p>
          <Button onClick={handleUpload} className="bg-primary hover:bg-primary/90">
            Choose File
          </Button>
        </>
      )}
    </div>
  );
};

export default UploadZone;
