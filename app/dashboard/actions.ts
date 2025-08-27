
'use server';

import nodemailer from 'nodemailer';
import { render } from '@react-email/render';
import { ODRequestEmail } from '@/emails/od-request';
import type { ODFormValues } from './page';

export async function sendEmail(data: ODFormValues, pdfUrl?: string) {
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

  const options: nodemailer.SendMailOptions = {
    from: `"OD Automator" <${process.env.GMAIL_EMAIL}>`,
    to: data.facultyCoordinatorEmail,
    subject: `On-Duty Request: ${data.eventName}`,
    html: emailHtml,
  };

  if (data.cc) {
    options.cc = data.cc;
  }

  if (data.bcc) {
    options.bcc = data.bcc;
  }

  if (pdfUrl) {
    options.attachments = [
        {
            filename: `OD_Application_${data.eventName.replace(/ /g, '_')}.pdf`,
            path: pdfUrl,
        },
    ];
  }

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
