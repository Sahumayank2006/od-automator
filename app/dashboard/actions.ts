'use server';

import nodemailer from 'nodemailer';
import { render } from '@react-email/render';
import { ODRequestEmail } from '@/emails/od-request';
import type { ODFormValues } from './page';
import { generate } from 'genkit/ai';
import { extractTimetableFlow } from '@/ai/flows/extract-timetable-flow';

export async function sendEmail(data: ODFormValues) {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // true for 465
    auth: {
      user: process.env.GMAIL_EMAIL,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  const emailHtml = render(ODRequestEmail({ data }));

  const options = {
    from: `"OD Automator" <${process.env.GMAIL_EMAIL}>`,
    to: data.facultyCoordinatorEmail,
    subject: `On-Duty Request: ${data.eventName}`,
    html: emailHtml,
  };

  try {
    const emailData = await transporter.sendMail(options);
    return { success: true, data: emailData };
  } catch (error) {
    console.error('Nodemailer Error:', error);
    if (error instanceof Error) {
        return { success: false, error: error.message };
    }
    return { success: false, error: 'An unknown error occurred while sending the email.' };
  }
}

export async function extractTimetable(data: string) {
    const result = await extractTimetableFlow({
        image: data,
    });
    return result;
}
