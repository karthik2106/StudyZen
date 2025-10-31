import Header from "@/components/Header";
import UploadZone from "@/components/UploadZone";
import ClassCard from "@/components/ClassCard";
import DeadlineCard from "@/components/DeadlineCard";
import AISuggestionBox from "@/components/AISuggestionBox";
import TodoList from "@/components/TodoList";
import Footer from "@/components/Footer";

const Index = () => {
  // Mock data for today's classes
  const todayClasses = [
    {
      time: "9:00 AM - 10:30 AM",
      subject: "Computer Science 101",
      location: "Room 304, Engineering Building",
      type: "Lecture",
    },
    {
      time: "2:00 PM - 3:30 PM",
      subject: "Data Structures",
      location: "Lab 201, CS Building",
      type: "Lab",
    },
  ];

  // Mock data for tomorrow's classes
  const tomorrowClasses = [
    {
      time: "10:00 AM - 11:30 AM",
      subject: "Algorithms",
      location: "Room 405, Engineering Building",
      type: "Lecture",
    },
    {
      time: "1:00 PM - 2:30 PM",
      subject: "Software Engineering",
      location: "Room 502, CS Building",
      type: "Tutorial",
    },
  ];

  // Mock data for deadlines
  const deadlines = [
    {
      title: "Assignment 3: Binary Trees",
      dueDate: "Tomorrow, 11:59 PM",
      course: "CS101 - Data Structures",
      urgency: "urgent" as const,
    },
    {
      title: "Project Proposal",
      dueDate: "Friday, Oct 3",
      course: "SE202 - Software Engineering",
      urgency: "warning" as const,
    },
    {
      title: "Midterm Exam Preparation",
      dueDate: "Next Monday, Oct 6",
      course: "CS301 - Algorithms",
      urgency: "success" as const,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-main p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <Header />

        <div className="grid gap-6 mb-6">
          <UploadZone />
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <ClassCard title="Today's Classes" classes={todayClasses} />
          <ClassCard title="Tomorrow's Classes" classes={tomorrowClasses} />
          <DeadlineCard deadlines={deadlines} />
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <AISuggestionBox />
          <TodoList />
        </div>

        <Footer />
      </div>
    </div>
  );
};

export default Index;
