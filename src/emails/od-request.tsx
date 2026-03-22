import * as React from 'react';
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Section,
  Row,
  Column,
  Hr,
} from '@react-email/components';
import { format } from 'date-fns';
import type { ODFormValues } from '../app/dashboard/page';

interface ODRequestEmailProps {
  data: ODFormValues;
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const box = {
  padding: '0 48px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  margin: '30px 0',
};

const text = {
  color: '#525f7f',
  fontSize: '16px',
  lineHeight: '24px',
};

const sectionTitle = {
    ...text,
    fontWeight: 'bold',
    marginBottom: '10px',
}

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
};

export const ODRequestEmail = ({ data }: ODRequestEmailProps) => {
  const getSemesterWithSuffix = (sem: string) => {
    if (sem === '1') return '1st';
    if (sem === '2') return '2nd';
    if (sem === '3') return '3rd';
    return `${sem}th`;
  };

  const getDayName = (date: Date) => {
    return format(date, 'EEEE');
  };

  const eventDateFormatted = data.eventDate ? format(data.eventDate, "dd-MMM-yyyy") : 'N/A';
  const eventDay = data.eventDate ? getDayName(data.eventDate) : data.eventDay || 'N/A';
  
  // Extract all unique students
  const studentMap = new Map<string, { course: string, name: string, enrollNo: string, contact: string }>();
  
  data.classes.forEach(c => {
    const courseStr = `${c.course} ${c.program} Sec ${c.section} ${getSemesterWithSuffix(c.semester)} Sem`;
    c.lectures.forEach(l => {
      const studentsRows = l.students.split('\n').filter(s => s.trim() !== '');
      studentsRows.forEach(studentStr => {
        studentStr = studentStr.trim();
        if (!studentMap.has(studentStr)) {
          const parts = studentStr.split(' ');
          let enrollNo = '';
          let name = studentStr;
          let contact = '';
          
          const enrollRegex = /[A-Za-z0-9]{6,}/;
          const contactRegex = /^\d{10}$/;

          // Find contact
          const contactMatch = parts.find(p => contactRegex.test(p));
          if (contactMatch) {
            contact = contactMatch;
            parts.splice(parts.indexOf(contactMatch), 1);
          }
          
          // Find enrollment (after contact is removed)
          const enrollMatch = parts.find(p => enrollRegex.test(p) && /\d/.test(p));
          if (enrollMatch) {
            enrollNo = enrollMatch;
            parts.splice(parts.indexOf(enrollMatch), 1);
          }

          name = parts.join(' ');
          
          studentMap.set(studentStr, {
            course: courseStr,
            name: name,
            enrollNo: enrollNo,
            contact: contact
          });
        }
      });
    });
  });

  const studentsList = Array.from(studentMap.values());

  return (
    <Html>
      <Head />
      <Preview>On-Duty Request for {data.eventName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <Text style={{ ...text, marginBottom: '20px' }}>
              Respected {data.facultyCoordinatorName},<br />
              Kindly consider the attendance of the following students-
            </Text>

            <Text style={{ ...text, marginTop: '30px', marginBottom: '10px' }}>
              ---{eventDateFormatted}---({eventDay})
            </Text>

            <table style={{ width: '100%', borderCollapse: 'collapse', paddingBottom: '20px' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '0 5px 10px 0', fontSize: '15px' }}>Time.</th>
                  <th style={{ textAlign: 'left', padding: '0 5px 10px 0', fontSize: '15px' }}>Subject.</th>
                  <th style={{ textAlign: 'left', padding: '0 5px 10px 0', fontSize: '15px' }}>Faculty.</th>
                </tr>
              </thead>
              <tbody>
                {data.classes.flatMap(c => c.lectures).map((lecture, index) => (
                  <tr key={index}>
                    <td style={{ padding: '0 5px 5px 0', fontSize: '15px' }}>{lecture.fromTime} - {lecture.toTime}</td>
                    <td style={{ padding: '0 5px 5px 0', fontSize: '15px' }}>{lecture.subject}</td>
                    <td style={{ padding: '0 5px 5px 0', fontSize: '15px' }}>{lecture.faculty}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '30px' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '0 5px 10px 0', fontSize: '15px', borderBottom: '1px solid #ddd' }}>S.No</th>
                  <th style={{ textAlign: 'left', padding: '0 5px 10px 0', fontSize: '15px', borderBottom: '1px solid #ddd' }}>Enrollment No.</th>
                  <th style={{ textAlign: 'left', padding: '0 5px 10px 0', fontSize: '15px', borderBottom: '1px solid #ddd' }}>Student Name</th>
                  <th style={{ textAlign: 'left', padding: '0 5px 10px 0', fontSize: '15px', borderBottom: '1px solid #ddd' }}>Eligible Course</th>
                  <th style={{ textAlign: 'left', padding: '0 5px 10px 0', fontSize: '15px', borderBottom: '1px solid #ddd' }}>Contact No.</th>
                </tr>
              </thead>
              <tbody>
                {studentsList.map((student, index) => (
                  <tr key={index}>
                    <td style={{ padding: '5px 5px 5px 0', fontSize: '15px', borderBottom: '1px solid #eee' }}>{index + 1}</td>
                    <td style={{ padding: '5px 5px 5px 0', fontSize: '15px', borderBottom: '1px solid #eee' }}>{student.enrollNo || '-'}</td>
                    <td style={{ padding: '5px 5px 5px 0', fontSize: '15px', borderBottom: '1px solid #eee' }}>{student.name || '-'}</td>
                    <td style={{ padding: '5px 5px 5px 0', fontSize: '15px', borderBottom: '1px solid #eee' }}>{student.course}</td>
                    <td style={{ padding: '5px 5px 5px 0', fontSize: '15px', borderBottom: '1px solid #eee' }}>{student.contact || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <Hr style={hr} />
            <Text style={text}>
              Thank you for your cooperation.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default ODRequestEmail;
