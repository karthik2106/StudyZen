import { GraduationCap } from "lucide-react";

const Footer = () => {
  return (
    <footer className="mt-12 py-6 border-t border-border/50">
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <GraduationCap className="w-4 h-4 text-primary" />
        <span>Student Focus — Academic Assistant Dashboard</span>
        <span className="text-primary">•</span>
        <span>Chrome Extension UI</span>
      </div>
    </footer>
  );
};

export default Footer;
