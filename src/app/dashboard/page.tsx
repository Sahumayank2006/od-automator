
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm, FormProvider } from 'react-hook-form';
import * as z from 'zod';
import React, { useEffect } from 'react';
import { format } from 'date-fns';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

import { CalendarIcon, PlusCircle, Trash2, Mail, FileText, Bot, User, Building, BookOpen, LogOut, GraduationCap, Copy, Zap, FileJson } from 'lucide-react';

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

type ODFormValues = z.infer<typeof odFormSchema>;

const SectionPanel = ({ title, icon: Icon, children, titleClassName }: { title: string; icon: React.ElementType, children: React.ReactNode, titleClassName?: string }) => (
    <div className="glass-panel p-6 md:p-8 relative overflow-hidden">
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

const ClassAccordionItem = ({ classField, classIndex, removeClass, control, form }: { classField: any, classIndex: number, removeClass: (index: number) => void, control: any, form: any }) => {
    const { fields: lectureFields, append: appendLecture, remove: removeLecture } = useFieldArray({
        control,
        name: `classes.${classIndex}.lectures`
    });
    const { toast } = useToast();

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
                    <FormField control={control} name={`classes.${classIndex}.course`} render={({ field }) => (<FormItem><FormLabel>Course Name</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="e.g., B.Tech" /></SelectTrigger></FormControl><SelectContent><SelectItem value="B.Tech">B.Tech</SelectItem><SelectItem value="BCA">BCA</SelectItem><SelectItem value="MCA">MCA</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                    <FormField control={control} name={`classes.${classIndex}.program`} render={({ field }) => (<FormItem><FormLabel>Program</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="e.g., Information Technology" /></SelectTrigger></FormControl><SelectContent><SelectItem value="IT">Information Technology</SelectItem><SelectItem value="CSE">Computer Science</SelectItem><SelectItem value="ECE">Electronics</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                    <FormField control={control} name={`classes.${classIndex}.semester`} render={({ field }) => (<FormItem><FormLabel>Semester</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="e.g., Semester 4" /></SelectTrigger></FormControl><SelectContent>{Array.from({length: 8}, (_, i) => i + 1).map(sem => <SelectItem key={sem} value={String(sem)}>Semester {sem}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
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
                    <Button type="button" size="sm" className="mb-4"><Bot className="w-4 h-4 mr-2" />Autofill Conflicting Lectures</Button>
                    <Accordion type="multiple" className="space-y-2">
                        {lectureFields.map((lectureField, lectureIndex) => (
                            <AccordionItem key={lectureField.id} value={lectureField.id} className="border bg-background/50 rounded-lg p-3">
                                <AccordionTrigger className="hover:no-underline text-sm">Lecture {lectureIndex + 1}</AccordionTrigger>
                                <AccordionContent className="pt-4 space-y-4">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <FormField control={control} name={`classes.${classIndex}.lectures.${lectureIndex}.subject`} render={({ field }) => (<FormItem><FormLabel>Subject Name + Code</FormLabel><FormControl><Input placeholder="e.g., Intro to CS | CS101" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={control} name={`classes.${classIndex}.lectures.${lectureIndex}.faculty`} render={({ field }) => (<FormItem><FormLabel>Faculty Name + Code</FormLabel><FormControl><Input placeholder="e.g., Dr. Alan Turing | CST01" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={control} name={`classes.${classIndex}.lectures.${lectureIndex}.fromTime`} render={({ field }) => (<FormItem><FormLabel>From</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={control} name={`classes.${classIndex}.lectures.${lectureIndex}.toTime`} render={({ field }) => (<FormItem><FormLabel>To</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    </div>
                                    <FormField control={control} name={`classes.${classIndex}.lectures.${lectureIndex}.students`} render={({ field }) => (<FormItem><FormLabel>Student List</FormLabel><FormControl><Textarea placeholder="Enter one student per line (Name + Enrollment No.)" {...field} className="min-h-[120px]"/></FormControl><FormMessage /></FormItem>)} />
                                    <div className="flex justify-end items-center gap-2">
                                        <Button type="button" size="sm" variant="outline">Extract Students</Button>
                                        <Button type="button" size="sm" variant="destructive" onClick={() => removeLecture(lectureIndex)}><Trash2 className="w-4 h-4"/></Button>
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

    useEffect(() => {
        const timer = setTimeout(() => {
            toast({
                title: "Timetables Loaded",
                description: "Your saved timetables have been loaded from local storage.",
            });
        }, 1000);
        return () => clearTimeout(timer);
    }, [toast]);
    
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
    
    function onSubmit(data: ODFormValues) {
        console.log(data);
        const jsonData = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'od_form_data.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast({
            title: "Form Data Downloaded!",
            description: "The form data has been saved as a JSON file.",
        });
    }
    
    return (
        <FormProvider {...form}>
            <ScrollArea className="h-screen bg-background">
                <div className="max-w-7xl mx-auto space-y-8 pb-32 p-4 md:p-8">
                    <header className="flex items-center justify-between py-4">
                        <div className="flex items-center gap-3">
                            <GraduationCap className="w-8 h-8 text-primary" />
                            <h1 className="text-2xl font-headline font-bold text-foreground">OD Automator</h1>
                        </div>
                        <Link href="/" passHref>
                            <Button variant="ghost">
                                <LogOut className="w-4 h-4 mr-2"/>
                                Sign Out
                            </Button>
                        </Link>
                    </header>
                    
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                            
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


                            <SectionPanel title="Class & Lecture Details" icon={Building}>
                                <Accordion type="multiple" className="space-y-4">
                                    {classFields.map((classField, classIndex) => (
                                        <ClassAccordionItem 
                                            key={classField.id}
                                            classField={classField}
                                            classIndex={classIndex}
                                            removeClass={removeClass}
                                            control={form.control}
                                            form={form}
                                        />
                                    ))}
                                </Accordion>
                                <Button type="button" onClick={() => appendClass({ id: crypto.randomUUID(), course: '', program: '', semester: '', section: 'A', lectures: []})} className="mt-4 w-full"><PlusCircle className="mr-2 h-4 w-4" /> Add Another Class</Button>
                            </SectionPanel>
                            
                            <div className="flex justify-center">
                                <Button size="lg" type="submit" className="w-full md:w-1/2">
                                    <FileJson className="mr-2 w-5 h-5"/>
                                    Download Form Data as JSON
                                </Button>
                            </div>

                        </form>
                    </Form>
                </div>
            </ScrollArea>
        </FormProvider>
    );
}
