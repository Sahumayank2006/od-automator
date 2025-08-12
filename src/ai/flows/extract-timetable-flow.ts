
'use server';
/**
 * @fileoverview
 * This file defines a Genkit flow for extracting timetable information from an image.
 *
 * It takes an image of a timetable as input and uses a multimodal model
 * to extract the structured schedule information. It then ensures the
 * output conforms to the required TimetableData schema, filling in any missing
 * days of the week.
 */
import { z } from 'zod';
import { ai } from '@/ai/genkit';
import { TimetableData, daysOfWeek } from '@/app/timetable/page';

const ExtractTimetableInputSchema = z.object({
  image: z.string().describe('The timetable image as a data URI.'),
});

const PartialScheduleSchema = z.record(z.string(), z.array(z.object({
    id: z.string(),
    fromTime: z.string(),
    toTime: z.string(),
    subjectName: z.string().optional(),
    subjectCode: z.string().optional(),
    facultyName: z.string().optional(),
    facultyCode: z.string().optional(),
})));

const ExtractTimetableOutputSchema = z.object({
    course: z.string().optional().describe("The course name, e.g., B.Tech"),
    program: z.string().optional().describe("The program name, e.g., CSE"),
    semester: z.string().optional().describe("The semester, e.g., 3"),
    section: z.string().optional().describe("The section, e.g., A"),
    schedule: PartialScheduleSchema.optional(),
});

const timetablePrompt = ai.definePrompt(
  {
    name: 'timetableExtractor',
    input: { schema: ExtractTimetableInputSchema },
    output: { schema: ExtractTimetableOutputSchema },
    prompt: `You are an expert at reading and parsing class schedules from images. 
  Your task is to extract the timetable information from the provided image and return it in a structured JSON format.
  The timetable has days of the week as rows and time slots as columns.
  Each cell in the timetable contains the subject name, subject code, and faculty name/code.
  
  Instructions:
  1.  Identify all the days of the week present in the timetable (Monday, Tuesday, Wednesday, Thursday, Friday).
  2.  For each day, identify all the scheduled lectures.
  3.  For each lecture, extract the following information:
      - id: A unique identifier in the format "Day-L#", e.g., "Monday-L1", "Tuesday-L3".
      - fromTime: The start time of the lecture (e.g., "09:15").
      - toTime: The end time of the lecture (e.g., "10:10").
      - subjectName: The full name of the subject. If multiple subjects are in one slot, combine them.
      - subjectCode: The code for the subject (e.g., "CSE302"). If multiple, combine them.
      - facultyName: The name of the faculty member. If multiple, combine them.
      - facultyCode: The code/initials for the faculty member, if available.
  4.  If a cell represents a break (like LUNCH), skip it and do not include it in the output.
  5.  If a cell is empty or marked as free/unassigned, create a lecture object with only the id, fromTime, and toTime, leaving the other fields blank.
  6.  Structure the output as a JSON object with a 'schedule' key. The value of 'schedule' should be an object where each key is a day of the week (e.g., "Monday") and the value is an array of lecture objects for that day.
  7.  Only include the days that are explicitly mentioned in the provided timetable image. Do not add days that are not present.

  Here is the image you need to process:
  {{media url=image}}`
  }
);


export const extractTimetableFlow = ai.defineFlow(
  {
    name: 'extractTimetableFlow',
    inputSchema: ExtractTimetableInputSchema,
    outputSchema: z.custom<TimetableData>(),
  },
  async (input): Promise<TimetableData> => {

    const llmResponse = await timetablePrompt(input);

    const extractedData = llmResponse.output;
    
    if (!extractedData || !extractedData.schedule) {
        throw new Error("Failed to extract timetable from the provided file.");
    }
    
    // Create a complete schedule object, filling in missing days
    const completeSchedule: TimetableData['schedule'] = {};
    for (const day of daysOfWeek) {
        completeSchedule[day] = extractedData.schedule[day] || [];
    }

    // Return a full TimetableData object
    return {
        course: extractedData.course || '', 
        program: extractedData.program || '',
        semester: extractedData.semester || '',
        section: extractedData.section || '',
        schedule: completeSchedule,
    };
  }
);
