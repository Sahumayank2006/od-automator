'use server';

import nodemailer from 'nodemailer';
import { render } from '@react-email/render';
import { ODRequestEmail } from '@/emails/od-request';
import type { ODFormValues } from './page';

export async function sendEmail(data: ODFormValues) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const emailHtml = render(ODRequestEmail({ data }));

  const options = {
    from: `"OD Automator" <${process.env.SMTP_USER}>`,
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