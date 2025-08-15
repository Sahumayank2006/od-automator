
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm, FormProvider } from 'react-hook-form';
import * as z from 'zod';
import React, { useState, useRef } from 'react';
import { format } from 'date-fns';
import Link from 'next/link';
import { sendEmail } from './actions';
import { AddClassDialog } from './AddClassDialog';
import { Loader2 } from 'lucide-react';
import { saveOdRequest } from '@/lib/database';


import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

import { CalendarIcon, PlusCircle, Trash2, Mail, FileText, User, Building, LogOut, GraduationCap, Table, ShieldCheck, BarChart3 } from 'lucide-react';

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
  lectures: z.array(lectureSchema),
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

const ClassAccordionItem = ({ classField, classIndex, removeClass }: { classField: any, classIndex: number, removeClass: (index: number) => void }) => {
    return (
        <AccordionItem value={classField.id} className="glass-panel-inner !border-t-0 p-4 rounded-2xl overflow-hidden">
            <AccordionTrigger className="hover:no-underline">
                <div className="flex justify-between w-full items-center pr-4">
                    <h3 className="text-lg font-headline">
                      {classField.course} {classField.program} - Sem {classField.semester} (Sec {classField.section})
                    </h3>
                </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 space-y-6">
                <div className="border-t border-white/10 pt-6">
                     <p className="text-sm text-muted-foreground mb-4">This class has {classField.lectures.length} lecture(s) affected. You can view student and lecture details in the generated PDF or email.</p>
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
    const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false);
    
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

    const eventDetails = form.watch(['eventDate', 'eventFromTime', 'eventToTime']);

    const handleGeneratePdf = async (data: ODFormValues) => {
        setIsGeneratingPdf(true);
        const { default: jsPDF } = await import('jspdf');
        await import('jspdf-autotable');

        try {
            const dbResponse = await saveOdRequest(data);
            if (!dbResponse.success) {
                throw new Error(dbResponse.error);
            }
            toast({ title: "Request Saved", description: "Your OD request has been saved to the database." });

            const doc = new (jsPDF as any)();
            let yPos = 45;
        
            doc.setFontSize(20);
            doc.text("Amity University", 105, 20, { align: 'center' });
            doc.setFontSize(16);
            doc.text("On-Duty Application Form", 105, 30, { align: 'center' });
        
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text("Faculty Coordinator Information", 14, yPos);
            yPos += 7;
            doc.autoTable({
                startY: yPos,
                head: [['Name', 'Email']],
                body: [[data.facultyCoordinatorName, data.facultyCoordinatorEmail]],
                theme: 'grid',
                styles: { fontSize: 10 },
                headStyles: { fillColor: [22, 160, 133] },
            });
            yPos = doc.lastAutoTable.finalY + 10;
        
            doc.setFont('helvetica', 'bold');
            doc.text("Event Information", 14, yPos);
            yPos += 7;
            doc.autoTable({
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
            yPos = doc.lastAutoTable.finalY + 10;
        
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
                doc.autoTable({
                    startY: yPos,
                    head: [['Subject', 'Faculty', 'Time Slot']],
                    body: lectureBody,
                    theme: 'striped',
                    styles: { fontSize: 9 },
                    headStyles: { fillColor: [41, 128, 185] },
                });
                yPos = doc.lastAutoTable.finalY + 5;
                
                classInfo.lectures.forEach((lecture) => {
                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'bold');
                    doc.text(`Students for: ${lecture.subject} (${lecture.fromTime} - ${lecture.toTime})`, 14, yPos);
                    yPos += 5;
                    const studentList = lecture.students.split('\n').map(s => [s]);
                    doc.autoTable({
                        startY: yPos,
                        head: [['Student Name & Enrollment No.']],
                        body: studentList,
                        theme: 'grid',
                        styles: { fontSize: 8 },
                        headStyles: { fillColor: [80, 80, 80] },
                    });
                    yPos = doc.lastAutoTable.finalY + 8;
                });
            });
        
            doc.save(`OD_Application_${data.eventName.replace(/ /g, '_')}.pdf`);
        } catch (error) {
            console.error("Error generating PDF or saving data:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: error instanceof Error ? error.message : "An unknown error occurred.",
            });
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    const handleSendEmail = async (data: ODFormValues) => {
        setIsSending(true);
        try {
            const dbResponse = await saveOdRequest(data);
             if (!dbResponse.success) {
                throw new Error(dbResponse.error);
            }
            toast({ title: "Request Saved", description: "Your OD request has been saved to the database." });
            
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
             <AddClassDialog
                open={isAddClassModalOpen}
                onOpenChange={setIsAddClassModalOpen}
                onSave={(newClass) => {
                    appendClass(newClass);
                    toast({
                        title: "Class Added",
                        description: `${newClass.course} ${newClass.program} - Sem ${newClass.semester} has been added to the list.`
                    });
                }}
                eventDetails={{
                  eventDate: eventDetails[0],
                  eventFromTime: eventDetails[1],
                  eventToTime: eventDetails[2],
                }}
             />
            <ScrollArea className="h-screen bg-background">
                <div className="max-w-7xl mx-auto space-y-8 pb-32 p-4 md:p-8">
                    <header className="flex flex-wrap items-center justify-between gap-4 py-4">
                        <div className="flex items-center gap-3">
                            <GraduationCap className="w-8 h-8 text-primary" />
                            <h1 className="text-2xl font-headline font-bold text-foreground">OD Automator</h1>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <Link href="/timetable" passHref>
                                <Button variant="outline"><Table className="w-4 h-4 mr-2"/>Manage Timetable</Button>
                            </Link>
                             <Link href="/faculty" passHref>
                                <Button variant="outline"><ShieldCheck className="w-4 h-4 mr-2"/>Faculty Admin</Button>
                            </Link>
                             <Link href="/events" passHref>
                                <Button variant="outline"><BarChart3 className="w-4 h-4 mr-2"/>Event Status</Button>
                            </Link>
                            <Link href="/" passHref>
                                <Button variant="ghost"><LogOut className="w-4 h-4 mr-2"/>Sign Out</Button>
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
                                            />
                                        ))}
                                    </Accordion>
                                    {classFields.length === 0 && (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <p>No classes added yet.</p>
                                            <p className="text-sm">Click the button below to add a class involved in the event.</p>
                                        </div>
                                    )}

                                    <Button type="button" variant="outline" onClick={() => setIsAddClassModalOpen(true)}>
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Add Class
                                    </Button>
                                </div>
                            </SectionPanel>

                            <div className="flex justify-end space-x-4">
                                <Button type="button" variant="secondary" onClick={() => form.reset()}>Clear Form</Button>
                                <Button type="button" disabled={isGeneratingPdf || isSending} onClick={form.handleSubmit(handleGeneratePdf)}>
                                    {isGeneratingPdf ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating...</> : <><FileText className="mr-2 h-4 w-4" />Generate PDF & Save</>}
                                </Button>
                                <Button type="button" disabled={isSending || isGeneratingPdf} onClick={form.handleSubmit(handleSendEmail)}>
                                    {isSending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</> : <><Mail className="mr-2 h-4 w-4" />Send Email & Save</>}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </ScrollArea>
        </FormProvider>
    );
}
