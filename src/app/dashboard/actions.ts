'use server';

import { Resend } from 'resend';
import { ODRequestEmail } from '@/emails/od-request';
import type { ODFormValues } from './page';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(data: ODFormValues) {
  try {
    const emailData = await resend.emails.send({
      from: 'OD Automator <onboarding@resend.dev>', // You will need to verify a domain on Resend to use a custom from address
      to: [data.facultyCoordinatorEmail],
      subject: `On-Duty Request: ${data.eventName}`,
      react: ODRequestEmail({ data }),
    });

    if (emailData.error) {
      return { success: false, error: emailData.error.message };
    }
    
    return { success: true, data: emailData.data };
  } catch (error) {
    console.error('Resend API Error:', error);
    if (error instanceof Error) {
        return { success: false, error: error.message };
    }
    return { success: false, error: 'An unknown error occurred.' };
  }
}
