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
  const activityDateTime = data.eventDate ? 
    `${format(data.eventDate, "MMMM d, yyyy")} from ${data.eventFromTime} to ${data.eventToTime}` 
    : 'N/A';

  return (
    <Html>
      <Head />
      <Preview>On-Duty Request for {data.eventName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <Heading style={h1}>On-Duty Request</Heading>
            <Text style={text}>
              Dear {data.facultyCoordinatorName},
            </Text>
            <Text style={text}>
              This is to certify that the students listed below were on duty for the following activity:
            </Text>
            <Hr style={hr} />
            <Text style={sectionTitle}>Event Details:</Text>
            <Text style={text}>
              <strong>Purpose:</strong> {data.eventName}<br/>
              <strong>Date & Time:</strong> {activityDateTime}
            </Text>
            <Hr style={hr} />

            {data.classes.map((classInfo, classIndex) => (
                <Section key={classIndex}>
                    <Text style={sectionTitle}>
                       Class: {classInfo.course} {classInfo.program} - Sem {classInfo.semester} (Sec {classInfo.section})
                    </Text>
                    {classInfo.lectures.map((lecture, lectureIndex) => {
                        const students = lecture.students.split('\n').filter(s => s.trim() !== '');
                        return (
                            <Section key={lectureIndex} style={{marginBottom: '20px'}}>
                                <Text style={{...text, fontStyle: 'italic'}}>
                                    Lecture from {lecture.fromTime} to {lecture.toTime}
                                </Text>
                                <Row>
                                    <Column style={{...text, paddingRight: '10px'}}><strong>Subject:</strong> {lecture.subject}</Column>
                                    <Column style={text}><strong>Faculty:</strong> {lecture.faculty}</Column>
                                </Row>
                                <Text style={{...text, marginTop: '10px'}}>
                                    <strong>Students Involved:</strong>
                                </Text>
                                <ul style={{paddingLeft: '20px', margin: 0}}>
                                    {students.map((student, studentIndex) => (
                                        <li key={studentIndex} style={text}>{student}</li>
                                    ))}
                                </ul>
                            </Section>
                        )
                    })}
                   {classIndex < data.classes.length - 1 && <Hr style={hr} />}
                </Section>
            ))}

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
