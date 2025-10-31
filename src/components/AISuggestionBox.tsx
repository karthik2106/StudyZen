import { Sparkles, Brain } from "lucide-react";

const AISuggestionBox = () => {
  return (
    <div className="bg-gradient-to-br from-primary/10 via-accent/5 to-transparent backdrop-blur-sm border border-primary/30 rounded-2xl p-6 hover:border-primary/50 transition-all duration-300">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-semibold">AI Study Suggestion</h2>
        <Sparkles className="w-4 h-4 text-primary ml-auto animate-pulse" />
      </div>
      
      <div className="bg-secondary/30 rounded-xl p-4 border border-primary/20">
        <p className="text-foreground/90 leading-relaxed">
          Looks like you have <span className="font-semibold text-primary">CS101</span> tomorrow at 9:00 AM. 
          Consider reviewing <span className="font-semibold text-accent">Lecture 4: Data Structures</span> today 
          to stay prepared. You have a 2-hour gap this afternoon—perfect for a focused study session!
        </p>
      </div>

      <div className="mt-4 flex gap-2">
        <div className="px-3 py-1 bg-primary/10 border border-primary/30 rounded-lg text-xs text-primary">
          Study Tip
        </div>
        <div className="px-3 py-1 bg-accent/10 border border-accent/30 rounded-lg text-xs text-accent">
          Time Management
        </div>
      </div>
    </div>
  );
};

export default AISuggestionBox;
