import { Calendar, MapPin, Clock } from "lucide-react";

interface Class {
  time: string;
  subject: string;
  location: string;
  type?: string;
}

interface ClassCardProps {
  title: string;
  classes: Class[];
}

const ClassCard = ({ title, classes }: ClassCardProps) => {
  return (
    <div className="bg-glass backdrop-blur-sm border border-glass rounded-2xl p-6 hover:border-primary/50 transition-all duration-300">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-semibold">{title}</h2>
      </div>
      
      {classes.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No classes scheduled</p>
        </div>
      ) : (
        <div className="space-y-4">
          {classes.map((classItem, index) => (
            <div
              key={index}
              className="bg-secondary/50 rounded-xl p-4 border border-border hover:border-primary/30 transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-foreground">{classItem.subject}</h3>
                {classItem.type && (
                  <span className="px-2 py-1 text-xs rounded-md bg-primary/20 text-primary">
                    {classItem.type}
                  </span>
                )}
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{classItem.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{classItem.location}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClassCard;
