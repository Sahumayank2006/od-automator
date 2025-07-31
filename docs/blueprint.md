# **App Name**: OD Nimbus

## Core Features:

- User Authentication: Provides an authentication page with username and code/password inputs, plus a Sign Out button.
- Faculty Coordinator Input: Allows faculty coordinators to enter their name and email in a glass panel.
- Event Details Input: Enables the input of event details such as event name, date, day (auto-filled), and time (using dropdowns).
- Class Details Input: Features dynamic dropdowns for course name, program, semester, and section (radio buttons), with the ability to add multiple classes.
- Lecture & Attendance Details: Offers expandable panels for lecture and attendance details, including an 'Autofill Conflicting Lectures' button. Allows input of subject/faculty names and codes, along with student lists (manual input or OCR extraction tool).
- Multi-Class/Lecture Workflow: Supports a nested structure of class and lecture sections, with collapsible panels for better organization.
- Action Bar: Offers a sticky bottom bar with buttons to generate a PDF OD letter (with AMITY letterhead) and send emails to the faculty coordinator and students.

## Style Guidelines:

- Primary color: Soft light blue (#ADD8E6), reminiscent of distant, bright skies. Hex code conversion may vary slightly based on tool used.
- Background color: A very light, desaturated blue (#F0F8FF) for a clean, frosted glass effect. Hex code conversion may vary slightly based on tool used.
- Accent color: A brighter, analogous blue (#B0E2FF) for interactive elements and highlights, adding depth without overpowering the soft theme. Hex code conversion may vary slightly based on tool used.
- Font pairing: 'Poppins' (sans-serif) for headings to provide a geometric and modern feel, complemented by 'PT Sans' (sans-serif) for body text to ensure readability and a touch of warmth. Note: currently only Google Fonts are supported.
- Use line icons with neon glow effects to match the glass morphism style.
- Implement a sectioned layout with glass panels, collapsible sections, and a sticky action bar at the bottom.
- Use smooth transitions and hover effects to enhance user interaction, with sections expanding/collapsing using max-height animations.