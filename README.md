# 🧠 StudyZen — AI Timetable & Productivity Assistant

**StudyZen** is an AI-powered Chrome Extension that transforms your uploaded university timetable into a personalized study planner — built to help **NTU students** (and anyone else who studies smart ✨) stay organized, focused, and productive.

---

## 🚀 Overview

StudyZen intelligently reads and converts PDF timetables into a structured dashboard of classes, deadlines, and to-dos.  
It leverages **Gemini Pro API** for OCR and context extraction, then uses built-in AI models to generate **smart task breakdowns** and **study suggestions** tailored to your schedule.

Whether you're planning revision sessions, tracking coursework deadlines, or just finding your next productive hour — StudyZen keeps you one step ahead.

---

## ✨ Key Features

- 🧾 **Timetable OCR (Gemini Pro API)** — Upload any NTU timetable PDF; it’s automatically parsed into class cards and schedule blocks.  
- 🕒 **AI-Generated Study Schedule** — Converts free slots into optimal study sessions, minimizing overload.  
- ✅ **To-Do Management** — Add, prioritize, and mark off tasks with a clean, distraction-free interface.  
- 📚 **Deadline Tracking** —  displays assignment or exam deadlines, and it can be added to google calender 
- 💡 **AI Suggestion Box** — Personalized task or study-tip generation based on workload and time availability.  
- ☁️ **Supabase Integration** — Secure cloud storage for user tasks, timetables, and preferences.  
- 🎨 **Modern UI** — Built with React + Tailwind CSS for a sleek, minimal, and responsive experience.

---

## 🧠 Tech Stack

| Layer | Technology |
|-------|-------------|
| Frontend | React + TypeScript + Vite |
| Styling | Tailwind CSS |
| Database & Auth | Supabase |
| AI / OCR | Gemini Pro API |
| Extension Framework | Chrome Manifest V3 |

---

## 📸 Sneak Peek


### 📅 MainPage
Beautifully organized class cards and upcoming deadlines at a glance.  
![Dashboard](assets/dashboard.png)

### 🧾 Timetable popup
AI extracts class data directly from your uploaded NTU PDF timetable.  
![timetable](assets/timetable.png)



- Dashboard with Timetable View  
- AI-Generated Study Plan  
- To-Do and Deadline Cards  
- Suggestion Panel  

---

## 🌐 Designed For

Originally created for **Nanyang Technological University (NTU)** students to simplify academic planning — but fully adaptable for **any student or self-learner** who wants AI-driven productivity.

---

## 🧩 Core Components

- `UploadZone.tsx` — Handles PDF uploads and OCR extraction  
- `TimetableDialog.tsx` — Displays AI-parsed class schedules  
- `TodoList.tsx` — Smart task manager with progress tracking  
- `DeadlineCard.tsx` — Upcoming deadlines and reminders  
- `AISuggestionBox.tsx` — Context-aware productivity suggestions  
- `Supabase` — Auth + persistent user data  

---

## 📄 License

MIT License © 2025 Karthik Adharsh Selvakumar

---

### 💬 “Study smarter. Plan effortlessly. Let AI handle the rest.”
