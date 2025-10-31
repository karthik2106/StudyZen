import { AlertCircle, Calendar } from "lucide-react";

interface Deadline {
  title: string;
  dueDate: string;
  course: string;
  urgency: "urgent" | "warning" | "success";
}

interface DeadlineCardProps {
  deadlines: Deadline[];
}

const DeadlineCard = ({ deadlines }: DeadlineCardProps) => {
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "urgent":
        return "border-urgent text-urgent";
      case "warning":
        return "border-warning text-warning";
      case "success":
        return "border-success text-success";
      default:
        return "border-muted text-muted-foreground";
    }
  };

  const getUrgencyBg = (urgency: string) => {
    switch (urgency) {
      case "urgent":
        return "bg-urgent/10";
      case "warning":
        return "bg-warning/10";
      case "success":
        return "bg-success/10";
      default:
        return "bg-muted";
    }
  };

  return (
    <div className="bg-glass backdrop-blur-sm border border-glass rounded-2xl p-6 hover:border-primary/50 transition-all duration-300">
      <div className="flex items-center gap-2 mb-4">
        <AlertCircle className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-semibold">Upcoming Deadlines</h2>
      </div>
      
      {deadlines.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No upcoming deadlines</p>
        </div>
      ) : (
        <div className="space-y-3">
          {deadlines.map((deadline, index) => (
            <div
              key={index}
              className={`rounded-xl p-4 border-l-4 ${getUrgencyColor(
                deadline.urgency
              )} ${getUrgencyBg(deadline.urgency)} transition-all duration-200 hover:scale-[1.02]`}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-foreground">{deadline.title}</h3>
                <span className={`px-2 py-1 text-xs rounded-md ${getUrgencyColor(deadline.urgency)} border`}>
                  {deadline.urgency === "urgent" ? "Due Soon!" : deadline.urgency === "warning" ? "This Week" : "Upcoming"}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">{deadline.course}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>{deadline.dueDate}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DeadlineCard;
