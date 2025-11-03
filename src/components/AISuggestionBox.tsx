import { Construction, Brain } from "lucide-react";

const AISuggestionBox = () => {
  return (
    <div className="bg-gradient-to-br from-primary/10 via-accent/5 to-transparent backdrop-blur-sm border border-primary/30 rounded-2xl p-6 hover:border-primary/50 transition-all duration-300">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-semibold">AI Study Suggestions</h2>
        <Construction className="w-4 h-4 text-primary ml-auto animate-pulse" />
      </div>

      <div className="bg-secondary/30 rounded-xl p-6 border border-dashed border-primary/30 text-center space-y-3">
        <p className="text-foreground/90 text-base font-medium">We&apos;re building something smart here.</p>
        <p className="text-muted-foreground text-sm leading-relaxed">
          AI-powered revision tips, personalised study plans, and session scheduling are under construction.
          Check back soon for automated suggestions tailored to your timetable.
        </p>
      </div>

      <div className="mt-4 text-xs text-muted-foreground text-center">
        Have an idea for this space? Drop it in the feedback section.
      </div>
    </div>
  );
};

export default AISuggestionBox;
