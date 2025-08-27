
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm, FormProvider } from 'react-hook-form';
import * as z from 'zod';
import React, { useState, useRef } from 'react';
import { format } from 'date-fns';
import Link from 'next/link';
import { sendEmail } from './actions';
import { AddClassDialog } from './AddClassDialog';
import { Loader2, Upload, Eye, FileUp } from 'lucide-react';
import { saveOdRequest, ODRequest } from '@/lib/database';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app } from '@/lib/firebase';


import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmailPreviewDialog } from './EmailPreviewDialog';


import { CalendarIcon, PlusCircle, Trash2, Mail, FileText, User, Building, LogOut, GraduationCap, Table as TableIcon, ShieldCheck, BarChart3, Users, Edit } from 'lucide-react';

export interface StudentData {
  name: string;
  enrollment: string;
  course: string;
  program: string;
  semester: string;
  section: string;
}

const lectureSchema = z.object({
  id: z.string(),
  subject: z.string().min(1, "Subject name & code are required."),
  faculty: z.string().min(1, "Faculty name & code are required."),
  fromTime: z.string().min(1, "Start time is required."),
  toTime: z.string().min(1, "End time is required."),
  students: z.string().min(1, "Student list is required."),
  section: z.string().optional(),
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
  cc: z.string().optional(),
  bcc: z.string().optional(),
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

const ClassAccordionItem = ({ classField, classIndex, removeClass, onEdit }: { classField: any, classIndex: number, removeClass: (index: number) => void, onEdit: (index: number) => void }) => {
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
                <div className="flex justify-end pt-4 mt-4 border-t border-white/10 gap-2">
                    <Button type="button" variant="outline" onClick={() => onEdit(classIndex)}><Edit className="w-4 h-4 mr-2"/>Edit Class</Button>
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
    const [editingClassIndex, setEditingClassIndex] = useState<number | null>(null);
    const [studentData, setStudentData] = useState<StudentData[]>([]);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewData, setPreviewData] = useState<ODFormValues | null>(null);
    const [uploadedPdfUrl, setUploadedPdfUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const processStudentData = (data: any[]) => {
        try {
            const students = data
              .map(row => ({
                name: (row as any).name?.trim(),
                enrollment: String((row as any).enrollment || (row as any)['enrolment no.']).trim(),
                course: (row as any).course?.trim(),
                program: (row as any).program?.trim(),
                semester: String((row as any).semester).trim(),
                section: (row as any).section?.trim().toUpperCase(),
              }))
              .filter(student => student.name && student.enrollment && student.course && student.program && student.semester && student.section);
  
            if (students.length === 0) {
              toast({
                variant: 'destructive',
                title: 'No Valid Students Found',
                description: 'Could not find valid student data. Required columns: name, enrollment, course, program, semester, section.',
              });
              return;
            }
            
            setStudentData(students);
            toast({
              title: 'Import Successful',
              description: `${students.length} students have been loaded.`,
            });
          } catch (error) {
             toast({
                variant: 'destructive',
                title: 'File Parsing Error',
                description: 'Please check the file format. Required columns: name, enrollment, course, program, semester, section.',
              });
          }
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
          toast({ variant: 'destructive', title: 'No file selected' });
          return;
        }

        const reader = new FileReader();
        
        if (file.name.endsWith('.csv')) {
            reader.onload = (e) => {
                const text = e.target?.result;
                if (typeof text === 'string') {
                    Papa.parse(text, {
                        header: true,
                        skipEmptyLines: true,
                        complete: (results) => processStudentData(results.data),
                        error: (error) => toast({ variant: 'destructive', title: 'CSV Error', description: error.message }),
                    });
                }
            };
            reader.readAsText(file);
        } else if (file.name.endsWith('.xlsx')) {
            reader.onload = (e) => {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet);
                processStudentData(json);
            };
            reader.readAsArrayBuffer(file);
        } else {
            toast({ variant: 'destructive', title: 'Unsupported File Type', description: 'Please upload a .csv or .xlsx file.' });
        }


        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
    };
    
    const form = useForm<ODFormValues>({
        resolver: zodResolver(odFormSchema),
        defaultValues: {
            facultyCoordinatorName: '',
            facultyCoordinatorEmail: '',
            cc: '',
            bcc: '',
            eventName: '',
            eventDate: undefined,
            eventDay: '',
            eventFromTime: '',
            eventToTime: '',
            classes: [],
        },
        mode: 'onChange',
    });

    const { fields: classFields, append: appendClass, remove: removeClass, update: updateClass } = useFieldArray({
        control: form.control,
        name: "classes",
    });

    const eventDetails = form.watch(['eventDate', 'eventFromTime', 'eventToTime']);

    const handleEditClass = (index: number) => {
        setEditingClassIndex(index);
        setIsAddClassModalOpen(true);
    };

    const handleOpenAddClassDialog = () => {
        setEditingClassIndex(null);
        setIsAddClassModalOpen(true);
    };

    const handleSaveClass = (newClass: z.infer<typeof classSchema>) => {
        if (editingClassIndex !== null) {
            updateClass(editingClassIndex, newClass);
            toast({
                title: "Class Updated",
                description: `${newClass.course} ${newClass.program} - Sem ${newClass.semester} has been updated.`
            });
        } else {
            appendClass(newClass);
            toast({
                title: "Class Added",
                description: `${newClass.course} ${newClass.program} - Sem ${newClass.semester} has been added to the list.`
            });
        }
        setEditingClassIndex(null);
    };

    const handlePreview = (data: ODFormValues) => {
        setPreviewData(data);
        setIsPreviewOpen(true);
    };


    const handleGeneratePdf = async (data: ODFormValues) => {
        setIsGeneratingPdf(true);
        setUploadedPdfUrl(null);
        const { default: jsPDF } = await import('jspdf');
        await import('jspdf-autotable');

        try {
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
        
            const pdfBlob = doc.output('blob');
            const storage = getStorage(app);
            const fileName = `od_requests/OD_Application_${data.eventName.replace(/ /g, '_')}_${Date.now()}.pdf`;
            const storageRef = ref(storage, fileName);

            await uploadBytes(storageRef, pdfBlob);
            const downloadURL = await getDownloadURL(storageRef);
            setUploadedPdfUrl(downloadURL);
            
            toast({
                title: "PDF Generated & Uploaded",
                description: "The PDF has been successfully uploaded and is ready to be sent with the email.",
            });

            // Also download locally
            doc.save(`OD_Application_${data.eventName.replace(/ /g, '_')}.pdf`);

        } catch (error) {
            console.error("Error generating or uploading PDF:", error);
            toast({
                variant: "destructive",
                title: "Error with PDF",
                description: error instanceof Error ? error.message : "An unknown error occurred.",
            });
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    const handleSendEmail = async (data: ODFormValues) => {
        setIsSending(true);
        try {
            if (!uploadedPdfUrl) {
                throw new Error("PDF has not been generated or uploaded yet. Please generate the PDF first.");
            }
            const dbResponse = await saveOdRequest(data, uploadedPdfUrl);
             if (!dbResponse.success) {
                throw new Error(dbResponse.error);
            }
            toast({ title: "Request Saved", description: "Your OD request has been saved to the database." });
            
            const response = await sendEmail(data, uploadedPdfUrl);
            if (response.success) {
                toast({
                    title: "Email Sent",
                    description: "The OD request email has been sent successfully with the PDF attached.",
                });
                 form.reset();
                 setUploadedPdfUrl(null);
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
                onSave={handleSaveClass}
                eventDetails={{
                  eventDate: eventDetails[0],
                  eventFromTime: eventDetails[1],
                  eventToTime: eventDetails[2],
                }}
                studentData={studentData}
                initialData={editingClassIndex !== null ? classFields[editingClassIndex] : undefined}
             />
             <EmailPreviewDialog
                open={isPreviewOpen}
                onOpenChange={setIsPreviewOpen}
                data={previewData}
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
                                <Button variant="outline"><TableIcon className="w-4 h-4 mr-2"/>Manage Timetable</Button>
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
                                                <FormLabel className="flex items-center"><Mail className="w-4 h-4 mr-2 opacity-70"/>To Email</FormLabel>
                                                <FormControl><Input placeholder="e.g., jane.doe@example.com" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}/>
                                         <FormField control={form.control} name="cc" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center"><Mail className="w-4 h-4 mr-2 opacity-70"/>CC (Optional)</FormLabel>
                                                <FormControl><Input placeholder="e.g., another.person@example.com" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}/>
                                         <FormField control={form.control} name="bcc" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center"><Mail className="w-4 h-4 mr-2 opacity-70"/>BCC (Optional)</FormLabel>
                                                <FormControl><Input placeholder="e.g., supervisor@example.com" {...field} /></FormControl>
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

                             <SectionPanel title="Student Data" icon={Users}>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                                            <Upload className="w-4 h-4 mr-2" /> Load Student Data (CSV or XLSX)
                                        </Button>
                                        <a href="/sample.xlsx" download>
                                            <Button type="button" variant="link">Download Sample XLSX</Button>
                                        </a>
                                         <a href="/sample.csv" download>
                                            <Button type="button" variant="link">Download Sample CSV</Button>
                                        </a>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileUpload}
                                            className="hidden"
                                            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                                        />
                                    </div>
                                    {studentData.length > 0 ? (
                                        <ScrollArea className="h-64 mt-4 border rounded-lg bg-background/30">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Name</TableHead>
                                                        <TableHead>Enrollment No.</TableHead>
                                                        <TableHead>Course</TableHead>
                                                        <TableHead>Program</TableHead>
                                                        <TableHead>Semester</TableHead>
                                                        <TableHead>Section</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {studentData.map((student, index) => (
                                                        <TableRow key={index}>
                                                            <TableCell>{student.name}</TableCell>
                                                            <TableCell>{student.enrollment}</TableCell>
                                                            <TableCell>{student.course}</TableCell>
                                                            <TableCell>{student.program}</TableCell>
                                                            <TableCell>{student.semester}</TableCell>
                                                            <TableCell>{student.section}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </ScrollArea>
                                    ) : (
                                        <div className="text-center py-8 text-muted-foreground bg-background/30 rounded-lg">
                                            <p>No student data loaded.</p>
                                            <p className="text-sm">Click the button to load a student CSV or XLSX file.</p>
                                        </div>
                                    )}
                                </div>
                            </SectionPanel>

                            <SectionPanel title="Affected Classes" icon={Building}>
                                <div className="space-y-4">
                                    <Accordion type="multiple" className="space-y-4">
                                        {classFields.map((field, index) => (
                                            <ClassAccordionItem 
                                                key={field.id} 
                                                classField={field} 
                                                classIndex={index} 
                                                removeClass={removeClass} 
                                                onEdit={handleEditClass}
                                            />
                                        ))}
                                    </Accordion>
                                    {classFields.length === 0 && (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <p>No classes added yet.</p>
                                            <p className="text-sm">Click the button below to add a class involved in the event.</p>
                                        </div>
                                    )}

                                    <Button type="button" variant="outline" onClick={handleOpenAddClassDialog}>
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Add Class
                                    </Button>
                                </div>
                            </SectionPanel>

                            <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/80 backdrop-blur-sm border-t border-white/10">
                                <div className="max-w-7xl mx-auto flex justify-end items-center gap-4">
                                    <Button type="button" variant="secondary" onClick={() => form.reset()}>Clear Form</Button>
                                    <Button type="button" variant="outline" onClick={form.handleSubmit(handlePreview)}>
                                        <Eye className="mr-2 h-4 w-4" />Preview Email
                                    </Button>
                                    <Button type="button" disabled={isGeneratingPdf || isSending} onClick={form.handleSubmit(handleGeneratePdf)}>
                                        {isGeneratingPdf ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating...</> : <><FileUp className="mr-2 h-4 w-4" />Generate & Upload PDF</>}
                                    </Button>
                                    <Button type="button" disabled={isSending || isGeneratingPdf || !uploadedPdfUrl} onClick={form.handleSubmit(handleSendEmail)}>
                                        {isSending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</> : <><Mail className="mr-2 h-4 w-4" />Save & Send Email</>}
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </Form>
                </div>
            </ScrollArea>
        </FormProvider>
    );
}

    
