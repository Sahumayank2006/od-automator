
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm, FormProvider } from 'react-hook-form';
import * as z from 'zod';
import React, { useEffect, useState, useRef } from 'react';
import { format, addMinutes, getDay } from 'date-fns';
import Link from 'next/link';
import { sendEmail, extractTimetable } from './actions';


import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Combobox } from '@/components/ui/combobox';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

import { CalendarIcon, PlusCircle, Trash2, Mail, FileText, Bot, User, Building, BookOpen, LogOut, GraduationCap, Copy, Table, Upload } from 'lucide-react';
import type { TimetableData } from '../timetable/page';
import { defaultTimetables } from '@/lib/timetables';
import { Loader2 } from 'lucide-react';

const lectureSchema = z.object({
  id: z.string(),
  subject: z.string().min(1, "Subject name & code are required."),
  faculty: z.string().min(1, "Faculty name & code are required."),
  fromTime: z.string().min(1, "Start time is required."),
  toTime: z.string().min(1, "End time is required."),
  students: z.string().min(1, "Student list is required."),
});

const classSchema = z.object({
  id: z.string(),
  course: z.string().min(1, "Course name is required."),
  program: z.string().min(1, "Program is required."),
  semester: z.string().min(1, "Semester is required."),
  section: z.enum(["A", "B", "C", "D", "E"], { required_error: "Section is required." }),
  lectures: z.array(lectureSchema).min(1, "At least one lecture must be added."),
});

const odFormSchema = z.object({
  facultyCoordinatorName: z.string().min(1, "Faculty coordinator name is required."),
  facultyCoordinatorEmail: z.string().email("Please enter a valid email."),
  eventName: z.string().min(1, "Event name is required."),
  eventDate: z.date({ required_error: "Event date is required." }),
  eventDay: z.string(),
  eventFromTime: z.string().min(1, "Event start time is required."),
  eventToTime: z.string().min(1, "Event end time is required."),
  classes: z.array(classSchema).min(1, "At least one class must be added."),
});

export type ODFormValues = z.infer<typeof odFormSchema>;

const SectionPanel = ({ title, icon: Icon, children, titleClassName }: { title: string; icon: React.ElementType, children: React.ReactNode, titleClassName?: string }) => (
    <div className="glass-panel p-6 md:p-8 relative overflow-hidden group">
        <div className="absolute -inset-px bg-gradient-to-r from-primary/50 to-accent/50 rounded-2xl blur-lg opacity-25 group-hover:opacity-50 transition-opacity duration-500"></div>
        <div className="relative flex items-center mb-6">
            <Icon className="w-6 h-6 mr-3 text-primary" />
            <h2 className={cn("text-xl font-headline font-semibold text-foreground", titleClassName)}>{title}</h2>
        </div>
        <div className="relative">
            {children}
        </div>
    </div>
);

const courseOptions = [
    { value: 'B.Tech', label: 'B.Tech' },
    { value: 'BCA', label: 'BCA' },
    { value: 'MCA', label: 'MCA' },
];

const programOptions = [
    { value: 'IT', label: 'Information Technology' },
    { value: 'CSE', label: 'Computer Science' },
    { value: 'ECE', label: 'Electronics' },
];

const semesterOptions = Array.from({ length: 8 }, (_, i) => ({
    value: String(i + 1),
    label: `Semester ${i + 1}`,
}));

const ClassAccordionItem = ({ classField, classIndex, removeClass, control, form }: { classField: any, classIndex: number, removeClass: (index: number) => void, control: any, form: any }) => {
    const { fields: lectureFields, append: appendLecture, remove: removeLecture } = useFieldArray({
        control,
        name: `classes.${classIndex}.lectures`
    });
    const { toast } = useToast();

    const lectureStartTimes = ["09:15", "10:15", "11:15", "12:15", "13:15", "14:15", "15:15", "16:15"];
    
    const timeToMinutes = (time: string) => {
      if (!time || !time.includes(':')) return 0;
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };
    
    const handleAutofill = () => {
        const { course, program, semester, section } = form.getValues(`classes.${classIndex}`);
        const { eventDate, eventFromTime, eventToTime } = form.getValues();
        
        if (!course || !program || !semester || !section) {
            toast({ variant: 'destructive', title: "Missing Class Details", description: "Please select course, program, semester, and section." });
            return;
        }

        if (!eventDate || !eventFromTime || !eventToTime) {
            toast({ variant: 'destructive', title: "Missing Event Details", description: "Please provide the event date and time." });
            return;
        }

        const storedTimetables = JSON.parse(localStorage.getItem('timetables') || '{}');
        const allTimetables = { ...defaultTimetables, ...storedTimetables };
        const timetableKey = `${course}-${program}-${semester}-${section}`;
        const timetable: TimetableData = allTimetables[timetableKey];

        if (!timetable) {
            toast({ variant: 'destructive', title: "No Timetable Found", description: "A timetable for this class and section has not been created yet." });
            return;
        }

        const eventDayIndex = (getDay(eventDate) + 6) % 7; // Monday = 0, Sunday = 6
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const eventDayName = days[eventDayIndex];

        const eventStartMinutes = timeToMinutes(eventFromTime);
        const eventEndMinutes = timeToMinutes(eventToTime);

        const daySchedule = timetable.schedule[eventDayName];
        if (!daySchedule) return;

        const conflictingLectures = daySchedule.filter(lecture => {
            if (!lecture.fromTime || !lecture.toTime || !lecture.subjectName || lecture.subjectName.toUpperCase().includes('LIBRARY') || lecture.subjectName.toUpperCase().includes('CCA')) return false;
            
            const lectureStartMinutes = timeToMinutes(lecture.fromTime);
            const lectureEndMinutes = timeToMinutes(lecture.toTime);
            
            // Calculate the overlap duration
            const overlapStart = Math.max(eventStartMinutes, lectureStartMinutes);
            const overlapEnd = Math.min(eventEndMinutes, lectureEndMinutes);
            const overlapDuration = overlapEnd - overlapStart;

            // Check if the overlap is 15 minutes or more
            return overlapDuration >= 15;
        });

        if (conflictingLectures.length === 0) {
            toast({ title: "No Conflicts", description: "No lectures conflict with the specified event time for 15 minutes or more." });
            return;
        }

        // Clear existing lectures before adding new ones
        removeLecture(Array.from({length: lectureFields.length}, (_, i) => i));

        conflictingLectures.forEach(lec => {
            appendLecture({
                id: crypto.randomUUID(),
                subject: `${lec.subjectName} | ${lec.subjectCode}`,
                faculty: `${lec.facultyName}${lec.facultyCode ? ` | ${lec.facultyCode}` : ''}`,
                fromTime: lec.fromTime,
                toTime: lec.toTime,
                students: ''
            }, { shouldFocus: false });
        });

        toast({ title: "Lectures Autofilled", description: `${conflictingLectures.length} conflicting lectures have been added.` });
    };

    const handleStartTimeChange = (value: string, lectureIndex: number) => {
        form.setValue(`classes.${classIndex}.lectures.${lectureIndex}.fromTime`, value, { shouldValidate: true, shouldDirty: true });
        if (value) {
            const [hours, minutes] = value.split(':').map(Number);
            const startDate = new Date();
            startDate.setHours(hours, minutes, 0, 0);
            const endDate = addMinutes(startDate, 55);
            const toTime = format(endDate, 'HH:mm');
            form.setValue(`classes.${classIndex}.lectures.${lectureIndex}.toTime`, toTime, { shouldValidate: true, shouldDirty: true });
        }
    };

    const handleCopyStudents = () => {
        const lectures = form.getValues(`classes.${classIndex}.lectures`);
        if (lectures && lectures.length > 1) {
            const firstStudents = lectures[0].students;
            for (let i = 1; i < lectures.length; i++) {
                form.setValue(`classes.${classIndex}.lectures.${i}.students`, firstStudents, { shouldValidate: true, shouldDirty: true });
            }
            toast({
                title: "Students Copied",
                description: "The student list from the first lecture has been copied to all other lectures in this class.",
            });
        }
    };

    return (
        <AccordionItem value={classField.id} className="glass-panel-inner !border-t-0 p-4 rounded-2xl overflow-hidden">
            <AccordionTrigger className="hover:no-underline">
                <div className="flex justify-between w-full items-center pr-4">
                    <h3 className="text-lg font-headline">Class {classIndex + 1}</h3>
                </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 space-y-6">
                <div className="grid md:grid-cols-3 gap-6">
                    <FormField control={control} name={`classes.${classIndex}.course`} render={({ field }) => (<FormItem><FormLabel>Course Name</FormLabel><Combobox options={courseOptions} {...field} placeholder="Select course..." /><FormMessage /></FormItem>)} />
                    <FormField control={control} name={`classes.${classIndex}.program`} render={({ field }) => (<FormItem><FormLabel>Program</FormLabel><Combobox options={programOptions} {...field} placeholder="Select program..." /><FormMessage /></FormItem>)} />
                    <FormField control={control} name={`classes.${classIndex}.semester`} render={({ field }) => (<FormItem><FormLabel>Semester</FormLabel><Combobox options={semesterOptions} {...field} placeholder="Select semester..." /><FormMessage /></FormItem>)} />
                </div>
                <FormField control={control} name={`classes.${classIndex}.section`} render={({ field }) => (<FormItem><FormLabel>Section</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4 pt-2">{['A', 'B', 'C', 'D', 'E'].map(sec => <FormItem key={sec} className="flex items-center space-x-2"><FormControl><RadioGroupItem value={sec} /></FormControl><FormLabel className="font-normal">{sec}</FormLabel></FormItem>)}</RadioGroup></FormControl><FormMessage /></FormItem>)} />
                
                <div className="border-t border-white/10 pt-6 mt-6">
                    <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
                        <h4 className="text-md font-headline font-semibold flex items-center"><BookOpen className="w-5 h-5 mr-2 text-primary"/>Lecture Details</h4>
                        <div className="flex gap-2">
                           {lectureFields.length > 1 && (
                                <Button type="button" size="sm" variant="outline" onClick={handleCopyStudents}><Copy className="mr-2 h-4 w-4"/>Copy Students</Button>
                           )}
                            <Button type="button" size="sm" variant="ghost" onClick={() => appendLecture({ id: crypto.randomUUID(), subject: '', faculty: '', fromTime: '', toTime: '', students: ''})}><PlusCircle className="mr-2 h-4 w-4"/>Add Lecture</Button>
                        </div>
                    </div>
                    <Button type="button" size="sm" className="mb-4" onClick={handleAutofill}><Bot className="w-4 h-4 mr-2" />Autofill Conflicting Lectures</Button>
                    <Accordion type="multiple" className="space-y-2">
                        {lectureFields.map((lectureField, lectureIndex) => (
                            <AccordionItem key={lectureField.id} value={lectureField.id} className="border bg-background/50 rounded-lg p-3">
                                <AccordionTrigger className="hover:no-underline text-sm">Lecture {lectureIndex + 1}</AccordionTrigger>
                                <AccordionContent className="pt-4 space-y-4">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <FormField control={control} name={`classes.${classIndex}.lectures.${lectureIndex}.subject`} render={({ field }) => (<FormItem><FormLabel>Subject Name + Code</FormLabel><FormControl><Input placeholder="e.g., Intro to CS | CS101" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={control} name={`classes.${classIndex}.lectures.${lectureIndex}.faculty`} render={({ field }) => (<FormItem><FormLabel>Faculty Name + Code</FormLabel><FormControl><Input placeholder="e.g., Dr. Alan Turing | CST01" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField
                                            control={control}
                                            name={`classes.${classIndex}.lectures.${lectureIndex}.fromTime`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>From</FormLabel>
                                                    <Select onValueChange={(value) => handleStartTimeChange(value, lectureIndex)} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select start time" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {lectureStartTimes.map(time => <SelectItem key={time} value={time}>{time}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={control}
                                            name={`classes.${classIndex}.lectures.${lectureIndex}.toTime`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>To</FormLabel>
                                                    <FormControl><Input type="time" {...field} readOnly className="bg-muted/50"/></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <FormField control={control} name={`classes.${classIndex}.lectures.${lectureIndex}.students`} render={({ field }) => (<FormItem><FormLabel>Student List</FormLabel><FormControl><Textarea placeholder="Enter one student per line (Name + Enrollment No.)" {...field} className="min-h-[120px]"/></FormControl><FormMessage /></FormItem>)} />
                                    <div className="flex justify-end items-center gap-2">
                                        
                                        {lectureFields.length > 1 && (
                                            <Button type="button" size="sm" variant="destructive" onClick={() => removeLecture(lectureIndex)}><Trash2 className="w-4 h-4"/></Button>
                                        )}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
                <div className="flex justify-end pt-4 mt-4 border-t border-white/10">
                    <Button type="button" variant="destructive" onClick={() => removeClass(classIndex)}><Trash2 className="w-4 h-4 mr-2"/>Remove Class</Button>
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}

export default function DashboardPage() {
    const { toast } = useToast();
    const [isSending, setIsSending] = useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [isExtracting, setIsExtracting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const form = useForm<ODFormValues>({
        resolver: zodResolver(odFormSchema),
        defaultValues: {
            facultyCoordinatorName: '',
            facultyCoordinatorEmail: '',
            eventName: '',
            eventDate: undefined,
            eventDay: '',
            eventFromTime: '',
            eventToTime: '',
            classes: [],
        },
        mode: 'onChange',
    });

    const { fields: classFields, append: appendClass, remove: removeClass } = useFieldArray({
        control: form.control,
        name: "classes",
    });

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsExtracting(true);
        toast({ title: 'Processing Timetable', description: 'Please wait while we extract the data...' });

        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64Image = reader.result as string;
                const result = await extractTimetable(base64Image);

                // Update form fields with extracted data
                form.reset({ ...form.getValues(), ...result });
                
                toast({ title: 'Timetable Imported', description: 'Data has been extracted and filled into the form.' });
            };
        } catch (error) {
            console.error("Error during timetable extraction:", error);
            toast({ variant: 'destructive', title: 'Extraction Failed', description: error instanceof Error ? error.message : 'An unknown error occurred.' });
        } finally {
            setIsExtracting(false);
            // Reset file input so the same file can be selected again
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };
    
    const handleGeneratePdf = async (data: ODFormValues) => {
        setIsGeneratingPdf(true);
        const { default: jsPDF } = await import('jspdf');
        const { default: autoTable } = await import('jspdf-autotable');

        const doc = new jsPDF();
        let yPos = 45;
    
        // Add content to the PDF
        doc.setFontSize(20);
        doc.text("Amity University", 105, 20, { align: 'center' });
        doc.setFontSize(16);
        doc.text("On-Duty Application Form", 105, 30, { align: 'center' });
    
        // Faculty Coordinator Details
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text("Faculty Coordinator Information", 14, yPos);
        yPos += 7;
        autoTable(doc, {
            startY: yPos,
            head: [['Name', 'Email']],
            body: [[data.facultyCoordinatorName, data.facultyCoordinatorEmail]],
            theme: 'grid',
            styles: { fontSize: 10 },
            headStyles: { fillColor: [22, 160, 133] },
        });
        yPos = (doc as any).lastAutoTable.finalY + 10;
    
        // Event Details
        doc.setFont('helvetica', 'bold');
        doc.text("Event Information", 14, yPos);
        yPos += 7;
        autoTable(doc, {
            startY: yPos,
            head: [['Event Name', 'Date', 'Day', 'From', 'To']],
            body: [[
                data.eventName,
                data.eventDate ? format(data.eventDate, "PPP") : 'N/A',
                data.eventDay,
                data.eventFromTime,
                data.eventToTime,
            ]],
            theme: 'grid',
            styles: { fontSize: 10 },
            headStyles: { fillColor: [22, 160, 133] },
        });
        yPos = (doc as any).lastAutoTable.finalY + 10;
    
        // Classes and Lectures
        doc.setFont('helvetica', 'bold');
        doc.text("Affected Classes & Lectures", 14, yPos);
        yPos += 7;
    
        data.classes.forEach((classInfo) => {
            const classHeader = `Class: ${classInfo.course} ${classInfo.program} - Semester ${classInfo.semester} (Section ${classInfo.section})`;
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text(classHeader, 14, yPos);
            yPos += 6;
    
            const lectureBody = classInfo.lectures.map(lec => [lec.subject, lec.faculty, `${lec.fromTime} - ${lec.toTime}`]);
            autoTable(doc, {
                startY: yPos,
                head: [['Subject', 'Faculty', 'Time Slot']],
                body: lectureBody,
                theme: 'striped',
                styles: { fontSize: 9 },
                headStyles: { fillColor: [41, 128, 185] },
            });
            yPos = (doc as any).lastAutoTable.finalY + 5;
            
            // Student List per Lecture
            classInfo.lectures.forEach((lecture) => {
                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                doc.text(`Students for: ${lecture.subject} (${lecture.fromTime} - ${lecture.toTime})`, 14, yPos);
                yPos += 5;
                const studentList = lecture.students.split('\n').map(s => [s]);
                autoTable(doc, {
                    startY: yPos,
                    head: [['Student Name & Enrollment No.']],
                    body: studentList,
                    theme: 'grid',
                    styles: { fontSize: 8 },
                    headStyles: { fillColor: [80, 80, 80] },
                });
                yPos = (doc as any).lastAutoTable.finalY + 8;
            });
        });
    
        doc.save(`OD_Application_${data.eventName.replace(/ /g, '_')}.pdf`);
        setIsGeneratingPdf(false);
    };

    const handleSendEmail = async (data: ODFormValues) => {
        setIsSending(true);
        try {
            const response = await sendEmail(data);
            if (response.success) {
                toast({
                    title: "Email Sent",
                    description: "The OD request email has been sent successfully.",
                });
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            console.error("Error sending email:", error);
            toast({
                variant: "destructive",
                title: "Error Sending Email",
                description: error instanceof Error ? error.message : "An unknown error occurred.",
            });
        } finally {
            setIsSending(false);
        }
    };
    
    return (
        <FormProvider {...form}>
            <ScrollArea className="h-screen bg-background">
                <div className="max-w-7xl mx-auto space-y-8 pb-32 p-4 md:p-8">
                    <header className="flex flex-wrap items-center justify-between gap-4 py-4">
                        <div className="flex items-center gap-3">
                            <GraduationCap className="w-8 h-8 text-primary" />
                            <h1 className="text-2xl font-headline font-bold text-foreground">OD Automator</h1>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                             <Button
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isExtracting}
                            >
                                {isExtracting ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Upload className="w-4 h-4 mr-2" />
                                )}
                                Import Timetable
                            </Button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                accept="image/*,application/pdf"
                            />
                            <Link href="/timetable" passHref>
                                <Button variant="outline">
                                    <Table className="w-4 h-4 mr-2"/>
                                    Manage Timetable
                                </Button>
                            </Link>
                            <Link href="/" passHref>
                                <Button variant="ghost">
                                    <LogOut className="w-4 h-4 mr-2"/>
                                    Sign Out
                                </Button>
                            </Link>
                        </div>
                    </header>
                    
                    <Form {...form}>
                        <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
                            
                            <div className="grid md:grid-cols-2 gap-8">
                                <SectionPanel title="Faculty Coordinator" icon={User}>
                                    <div className="space-y-6">
                                        <FormField control={form.control} name="facultyCoordinatorName" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center"><User className="w-4 h-4 mr-2 opacity-70"/>Name</FormLabel>
                                                <FormControl><Input placeholder="e.g., Dr. Jane Doe" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}/>
                                        <FormField control={form.control} name="facultyCoordinatorEmail" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center"><Mail className="w-4 h-4 mr-2 opacity-70"/>Email</FormLabel>
                                                <FormControl><Input placeholder="e.g., jane.doe@example.com" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}/>
                                    </div>
                                </SectionPanel>

                                <SectionPanel title="Event Details" icon={CalendarIcon}>
                                    <div className="space-y-6">
                                        <FormField control={form.control} name="eventName" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center"><FileText className="w-4 h-4 mr-2 opacity-70"/>Event Name</FormLabel>
                                                <FormControl><Input placeholder="e.g., CodeFest 2024" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}/>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <FormField control={form.control} name="eventDate" render={({ field }) => (
                                                <FormItem className="flex flex-col">
                                                     <FormLabel className="flex items-center"><CalendarIcon className="w-4 h-4 mr-2 opacity-70"/>Date</FormLabel>
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <FormControl>
                                                                <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                                    {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                                </Button>
                                                            </FormControl>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-auto p-0" align="start">
                                                            <Calendar mode="single" selected={field.value} onSelect={(date) => {
                                                                field.onChange(date);
                                                                if(date) form.setValue('eventDay', format(date, 'EEEE'));
                                                            }} initialFocus />
                                                        </PopoverContent>
                                                    </Popover>
                                                    <FormMessage />
                                                </FormItem>
                                            )}/>
                                            <FormField control={form.control} name="eventDay" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Day</FormLabel>
                                                    <FormControl><Input placeholder="Auto-filled" {...field} readOnly className="bg-muted/50"/></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}/>
                                        </div>
                                        <div className="grid grid-cols-2 gap-6">
                                            <FormField control={form.control} name="eventFromTime" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>From</FormLabel>
                                                    <FormControl><Input type="time" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}/>
                                            <FormField control={form.control} name="eventToTime" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>To</FormLabel>
                                                    <FormControl><Input type="time" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}/>
                                        </div>
                                    </div>
                                </SectionPanel>
                            </div>

                            <SectionPanel title="Affected Classes" icon={Building}>
                                <div className="space-y-4">
                                    <Accordion type="multiple" className="space-y-4">
                                        {classFields.map((field, index) => (
                                            <ClassAccordionItem 
                                                key={field.id} 
                                                classField={field} 
                                                classIndex={index} 
                                                removeClass={removeClass} 
                                                control={form.control} 
                                                form={form} 
                                            />
                                        ))}
                                    </Accordion>

                                    <Button type="button" variant="outline" onClick={() => appendClass({ id: crypto.randomUUID(), course: '', program: '', semester: '', section: 'A', lectures: [] })}>
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Add Class
                                    </Button>
                                </div>
                            </SectionPanel>

                            <div className="flex justify-end space-x-4">
                                <Button type="button" variant="secondary" onClick={() => form.reset()}>Clear Form</Button>
                                <Button type="button" disabled={isGeneratingPdf || isSending} onClick={form.handleSubmit(handleGeneratePdf)}>
                                    {isGeneratingPdf ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating...</> : <><FileText className="mr-2 h-4 w-4" />Generate PDF</>}
                                </Button>
                                <Button type="button" disabled={isSending || isGeneratingPdf} onClick={form.handleSubmit(handleSendEmail)}>
                                    {isSending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</> : <><Mail className="mr-2 h-4 w-4" />Send Email</>}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </ScrollArea>
        </FormProvider>
    );
}
