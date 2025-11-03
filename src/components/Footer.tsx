import { GraduationCap } from "lucide-react";

const Footer = () => {
  return (
    <footer className="mt-12 py-6 border-t border-border/50">
      <div className="flex flex-col items-center justify-center gap-1 text-sm text-muted-foreground text-center">
        <div className="flex items-center justify-center gap-2">
        <GraduationCap className="w-4 h-4 text-primary" />
        <span>StudyZen.ai — Academic Assistant Dashboard</span>
        <span className="text-primary">•</span>
        <span>Chrome Extension UI</span>
      </div>
        <span className="text-xs text-muted-foreground/80">
          Crafted by <span className="font-medium text-primary">Karthik Adharsh Selvakumar</span>
        </span>
      </div>
    </footer>
  );
};

export default Footer;
