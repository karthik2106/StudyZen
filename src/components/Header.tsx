import { useEffect, useState } from "react";
import { Clock, Sparkles } from "lucide-react";

const Header = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <header className="mb-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {getGreeting()}, Student
          </h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {formatDate(currentTime)} • {formatTime(currentTime)}
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 px-6 py-3 bg-glass backdrop-blur-sm border border-glass rounded-xl">
          <Sparkles className="w-5 h-5 text-primary" />
          <p className="text-sm italic text-foreground/90">
            "Success is the sum of small efforts repeated day in and day out."
          </p>
        </div>
      </div>
    </header>
  );
};

export default Header;
