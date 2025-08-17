🔐 Login Credentials (For Testing/Demo Purposes)
 For testing purposes, use the following credentials to access the OD Automator web app: 
Admin login with acc@admin and password mayank, and 
Faculty Dashboard access using passcode 002025.


🧠 Project Report: OD Automator Web Application
📅 Date: August 17, 2025
This project was collaboratively developed by team members :
 Aditya Tiwari 
Mayank Sahu 
Navya Awasthi. 
Together, we combined technical expertise and creative vision to build the OD Automator web application.


🛠 Project Overview
The OD Automator is a full-stack web application engineered to automate and streamline the On-Duty (OD) request workflow for students, faculty, and coordinators. Designed with a modern Glassmorphism UI, the app merges aesthetic finesse with powerful backend logic, ensuring seamless communication, real-time updates, and secure data handling.

This system was built to eliminate manual OD handling, reduce errors, and enhance coordination across departments. It is scalable, secure, and optimized for real-world academic workflows.

⚙ Key Features & Implementation
✉ 1. Email Automation
One-click email dispatch with dynamic content based on OD request status.
SMTP authentication and role-based access control.
Integrated using Nodemailer for backend email services.
📄 2. PDF Generation
Client-side PDF rendering using jsPDF.
Structured layout with headers, tables, and timestamps.
Enables formal documentation and offline sharing.
🕒 3. Auto-Fill Lecture Conflict Detection
Time comparison algorithm detects lecture-event overlaps.
Automatically fills affected lectures in the OD form.
Ensures academic transparency and reduces manual errors.
🧑‍🏫 4. Faculty Dashboard
View, approve, or reject OD requests.
Forward requests to higher authorities via email.
Access full OD history with real-time updates.
📋 5. Event Status Panel
Coordinators can view and manage OD requests linked to their events.
Delete rejected requests to maintain clean records.
Role-based access ensures data integrity.
🗃 6. Database Integration
Firebase Firestore used for real-time data storage.
Collections for users, OD requests, events, and timetables.
Firestore rules enforce secure, role-based access.
🧾 7. Unified OD Form
Supports multiple classes and sections in a single form.
Dynamic fields adjust based on user input and role.
Formik + Yup used for robust validation.
📆 8. Time Table Management
Editable timetable grid with drag-and-drop support.
Integrated conflict detection logic.
Stored in Firestore for real-time access and updates.
🎨 UI/UX Design Highlights
Glassmorphism Aesthetic: Frosted panels with blur effects (backdrop-filter: blur(10px)).
Responsive Layout: Optimized for desktop and mobile devices.
Interactive Elements: Hover effects, animated transitions, and real-time feedback.
Accessibility: Clean fonts, high contrast, and intuitive icons.
📅 Development Timeline & Google Meet Discussions
🔹 28 July 2025
Google Meet: Basic App Architecture & Feature Planning

Finalized tech stack: React, Firebase, Node.js, jsPDF.
Discussed modular component structure and routing logic.
Brainstormed additional features like auto-fill and email triggers.
🔹 30 July 2025
Google Meet: Prototype Review & GitHub Deployment

Pushed initial commits to GitHub.
Set up CI/CD pipeline using Vercel.
Discussed branching strategy and version control best practices.
🔹 01 August 2025
Google Meet: UI Enhancements & Email Automation

Integrated Framer Motion for UI animations.
Implemented Nodemailer for email automation.
Added reusable components for form and dashboard.
🔹 Offline College Meetup
Discussion: Real-World Use Cases & Feedback Integration

Collected feedback from faculty and students.
Refined dashboard layout and added event status panel.
Finalized database schema and user roles.
🔹 12 August 2025
Google Meet: Final Touches & Feature Showcase

Polished UI with advanced blur effects and responsive design.
Completed PDF generation and conflict detection logic.
Presented live demo and received approval from management.
📸 Screenshot-Based Feature Highlights
(Based on your screenshots, the following features were visually confirmed and implemented)

Glassmorphism Panels across all pages with blur and light effects.
Faculty Dashboard with approval buttons, OD history, and mail forwarding.
Event Status Page showing OD requests with delete options.
Unified OD Form with dropdowns for class/section and auto-filled lecture conflicts.
PDF Preview Section with download and print options.
Timetable Manager with editable slots and program filters.
🧩 Challenges & Solutions
Challenge	Solution
Real-time data sync	Used Firebase Firestore with snapshot listeners
Email formatting	Created dynamic templates with HTML and inline CSS
UI responsiveness	Used Flexbox/Grid and media queries
Role-based access	Implemented Firestore rules and conditional rendering
🏁 Conclusion
The OD Automator web app is a transformative solution for academic institutions seeking to digitize and streamline OD management. With its powerful automation, elegant design, and robust backend, it stands as a model of innovation and efficiency.

This project reflects a commitment to enhancing student-faculty coordination, reducing administrative overhead, and embracing modern web technologies.
