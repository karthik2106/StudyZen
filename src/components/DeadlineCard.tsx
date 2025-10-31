import { useState } from "react";
import { AlertCircle, Calendar, Plus, Trash2, Edit2, Check, X, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface Deadline {
  id: string;
  title: string;
  dueDate: Date;
  course: string;
  urgency: "urgent" | "warning" | "success";
}

const DeadlineCard = () => {
  const [deadlines, setDeadlines] = useState<Deadline[]>([
    {
      id: "1",
      title: "Assignment 3: Binary Trees",
      dueDate: new Date(Date.now() + 86400000), // Tomorrow
      course: "CS101 - Data Structures",
      urgency: "urgent",
    },
    {
      id: "2",
      title: "Project Proposal",
      dueDate: new Date(Date.now() + 3 * 86400000), // 3 days from now
      course: "SE202 - Software Engineering",
      urgency: "warning",
    },
    {
      id: "3",
      title: "Midterm Exam Preparation",
      dueDate: new Date(Date.now() + 7 * 86400000), // 7 days from now
      course: "CS301 - Algorithms",
      urgency: "success",
    },
  ]);

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [newDeadline, setNewDeadline] = useState({
    title: "",
    dueDate: undefined as Date | undefined,
    course: "",
    urgency: "success" as "urgent" | "warning" | "success",
  });

  const [editDeadline, setEditDeadline] = useState({
    title: "",
    dueDate: undefined as Date | undefined,
    course: "",
    urgency: "success" as "urgent" | "warning" | "success",
  });
  const addDeadline = () => {
    if (newDeadline.title.trim() && newDeadline.dueDate && newDeadline.course.trim()) {
      const deadline: Deadline = {
        id: Date.now().toString(),
        title: newDeadline.title,
        dueDate: newDeadline.dueDate,
        course: newDeadline.course,
        urgency: newDeadline.urgency,
      };
      setDeadlines([...deadlines, deadline]);
      setNewDeadline({ title: "", dueDate: undefined, course: "", urgency: "success" });
      setIsAdding(false);
    }
  };

  const deleteDeadline = (id: string) => {
    setDeadlines(deadlines.filter((d) => d.id !== id));
  };

  const startEdit = (deadline: Deadline) => {
    setEditingId(deadline.id);
    setEditDeadline({
      title: deadline.title,
      dueDate: deadline.dueDate,
      course: deadline.course,
      urgency: deadline.urgency,
    });
  };

  const saveEdit = (id: string) => {
    if (editDeadline.title.trim() && editDeadline.dueDate && editDeadline.course.trim()) {
      setDeadlines(
        deadlines.map((d) =>
          d.id === id ? { ...d, title: editDeadline.title, dueDate: editDeadline.dueDate, course: editDeadline.course, urgency: editDeadline.urgency } : d
        )
      );
      setEditingId(null);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const cancelAdd = () => {
    setNewDeadline({ title: "", dueDate: undefined, course: "", urgency: "success" });
    setIsAdding(false);
  };

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
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Upcoming Deadlines</h2>
        </div>
        {!isAdding && (
          <Button
            onClick={() => setIsAdding(true)}
            size="icon"
            variant="ghost"
            className="text-primary hover:bg-primary/10"
          >
            <Plus className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Add new deadline form */}
      {isAdding && (
        <div className="mb-4 space-y-3 p-4 bg-secondary/50 rounded-xl border border-border">
          <Input
            type="text"
            placeholder="Assignment title..."
            value={newDeadline.title}
            onChange={(e) => setNewDeadline({ ...newDeadline, title: e.target.value })}
            className="bg-background"
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal bg-background",
                  !newDeadline.dueDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {newDeadline.dueDate ? format(newDeadline.dueDate, "PPP") : <span>Pick a due date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-popover border-border z-50" align="start">
              <CalendarComponent
                mode="single"
                selected={newDeadline.dueDate}
                onSelect={(date) => setNewDeadline({ ...newDeadline, dueDate: date })}
                initialFocus
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
          <Input
            type="text"
            placeholder="Course name..."
            value={newDeadline.course}
            onChange={(e) => setNewDeadline({ ...newDeadline, course: e.target.value })}
            className="bg-background"
          />
          <Select
            value={newDeadline.urgency}
            onValueChange={(value: "urgent" | "warning" | "success") =>
              setNewDeadline({ ...newDeadline, urgency: value })
            }
          >
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Select urgency" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border z-50">
              <SelectItem value="urgent">Urgent (Due Soon)</SelectItem>
              <SelectItem value="warning">Warning (This Week)</SelectItem>
              <SelectItem value="success">Upcoming (Future)</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button
              onClick={addDeadline}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              <Check className="w-4 h-4 mr-2" />
              Add
            </Button>
            <Button
              onClick={cancelAdd}
              variant="outline"
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      )}
      
      {/* Deadline list */}
      {deadlines.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No upcoming deadlines</p>
        </div>
      ) : (
        <div className="space-y-3">
          {deadlines.map((deadline) => (
            <div key={deadline.id}>
              {editingId === deadline.id ? (
                // Edit mode
                <div className="space-y-3 p-4 bg-secondary/50 rounded-xl border border-primary">
                  <Input
                    type="text"
                    value={editDeadline.title}
                    onChange={(e) => setEditDeadline({ ...editDeadline, title: e.target.value })}
                    className="bg-background"
                    placeholder="Assignment title..."
                  />
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal bg-background",
                          !editDeadline.dueDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {editDeadline.dueDate ? format(editDeadline.dueDate, "PPP") : <span>Pick a due date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-popover border-border z-50" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={editDeadline.dueDate}
                        onSelect={(date) => setEditDeadline({ ...editDeadline, dueDate: date })}
                        initialFocus
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                  <Input
                    type="text"
                    value={editDeadline.course}
                    onChange={(e) => setEditDeadline({ ...editDeadline, course: e.target.value })}
                    className="bg-background"
                    placeholder="Course name..."
                  />
                  <Select
                    value={editDeadline.urgency}
                    onValueChange={(value: "urgent" | "warning" | "success") =>
                      setEditDeadline({ ...editDeadline, urgency: value })
                    }
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border z-50">
                      <SelectItem value="urgent">Urgent (Due Soon)</SelectItem>
                      <SelectItem value="warning">Warning (This Week)</SelectItem>
                      <SelectItem value="success">Upcoming (Future)</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => saveEdit(deadline.id)}
                      className="flex-1 bg-success hover:bg-success/90"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                    <Button
                      onClick={cancelEdit}
                      variant="outline"
                      className="flex-1"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                // View mode
                <div
                  className={`rounded-xl p-4 border-l-4 ${getUrgencyColor(
                    deadline.urgency
                  )} ${getUrgencyBg(deadline.urgency)} transition-all duration-200 hover:scale-[1.01]`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-foreground flex-1">{deadline.title}</h3>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded-md ${getUrgencyColor(deadline.urgency)} border`}>
                        {deadline.urgency === "urgent" ? "Due Soon!" : deadline.urgency === "warning" ? "This Week" : "Upcoming"}
                      </span>
                      <Button
                        onClick={() => startEdit(deadline)}
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-accent"
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button
                        onClick={() => deleteDeadline(deadline.id)}
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{deadline.course}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>{format(deadline.dueDate, "PPP")}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DeadlineCard;
