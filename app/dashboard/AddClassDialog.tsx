
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm, FormProvider } from 'react-hook-form';
import * as z from 'zod';
import React from 'react';
import { format, addMinutes } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Combobox } from '@/components/ui/combobox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

import { PlusCircle, Trash2, BookOpen, Copy, Save } from 'lucide-react';

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

type ClassFormValues = z.infer<typeof classSchema>;

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

const lectureStartTimes = ["09:15", "10:15", "11:15", "12:15", "13:15", "14:15", "15:15", "16:15"];


export function AddClassDialog({ open, onOpenChange, onSave }: { open: boolean, onOpenChange: (open: boolean) => void, onSave: (data: ClassFormValues) => void }) {
    const { toast } = useToast();

    const form = useForm<ClassFormValues>({
        resolver: zodResolver(classSchema),
        defaultValues: {
            id: crypto.randomUUID(),
            course: '',
            program: '',
            semester: '',
            section: 'A',
            lectures: [],
        },
        mode: 'onChange',
    });

     const { fields: lectureFields, append: appendLecture, remove: removeLecture } = useFieldArray({
        control: form.control,
        name: "lectures"
    });

    const handleStartTimeChange = (value: string, lectureIndex: number) => {
        form.setValue(`lectures.${lectureIndex}.fromTime`, value, { shouldValidate: true, shouldDirty: true });
        if (value) {
            const [hours, minutes] = value.split(':').map(Number);
            const startDate = new Date();
            startDate.setHours(hours, minutes, 0, 0);
            const endDate = addMinutes(startDate, 55);
            const toTime = format(endDate, 'HH:mm');
            form.setValue(`lectures.${lectureIndex}.toTime`, toTime, { shouldValidate: true, shouldDirty: true });
        }
    };

    const handleCopyStudents = () => {
        const lectures = form.getValues(`lectures`);
        if (lectures && lectures.length > 1) {
            const firstStudents = lectures[0].students;
            for (let i = 1; i < lectures.length; i++) {
                form.setValue(`lectures.${i}.students`, firstStudents, { shouldValidate: true, shouldDirty: true });
            }
            toast({
                title: "Students Copied",
                description: "The student list from the first lecture has been copied to all other lectures in this class.",
            });
        }
    };
    
    const onSubmit = (data: ClassFormValues) => {
        onSave(data);
        form.reset({
            id: crypto.randomUUID(),
            course: '',
            program: '',
            semester: '',
            section: 'A',
            lectures: [],
        });
        onOpenChange(false);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl bg-secondary border-primary/50">
                <DialogHeader>
                    <DialogTitle className="text-primary text-glow">Add New Class</DialogTitle>
                </DialogHeader>
                <FormProvider {...form}>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                             <ScrollArea className="h-[70vh] p-4">
                                <div className="space-y-6">
                                    <div className="grid md:grid-cols-3 gap-6">
                                        <FormField control={form.control} name="course" render={({ field }) => (<FormItem><FormLabel>Course Name</FormLabel><Combobox options={courseOptions} {...field} placeholder="Select course..." /><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="program" render={({ field }) => (<FormItem><FormLabel>Program</FormLabel><Combobox options={programOptions} {...field} placeholder="Select program..." /><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="semester" render={({ field }) => (<FormItem><FormLabel>Semester</FormLabel><Combobox options={semesterOptions} {...field} placeholder="Select semester..." /><FormMessage /></FormItem>)} />
                                    </div>
                                    <FormField control={form.control} name="section" render={({ field }) => (<FormItem><FormLabel>Section</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4 pt-2">{['A', 'B', 'C', 'D', 'E'].map(sec => <FormItem key={sec} className="flex items-center space-x-2"><FormControl><RadioGroupItem value={sec} /></FormControl><FormLabel className="font-normal">{sec}</FormLabel></FormItem>)}</RadioGroup></FormControl><FormMessage /></FormItem>)} />
                                    
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
                                        
                                        <Accordion type="multiple" className="space-y-2">
                                            {lectureFields.map((lectureField, lectureIndex) => (
                                                <AccordionItem key={lectureField.id} value={lectureField.id} className="border bg-background/50 rounded-lg p-3">
                                                    <AccordionTrigger className="hover:no-underline text-sm">Lecture {lectureIndex + 1}</AccordionTrigger>
                                                    <AccordionContent className="pt-4 space-y-4">
                                                        <div className="grid md:grid-cols-2 gap-4">
                                                            <FormField control={form.control} name={`lectures.${lectureIndex}.subject`} render={({ field }) => (<FormItem><FormLabel>Subject Name + Code</FormLabel><FormControl><Input placeholder="e.g., Intro to CS | CS101" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                                            <FormField control={form.control} name={`lectures.${lectureIndex}.faculty`} render={({ field }) => (<FormItem><FormLabel>Faculty Name + Code</FormLabel><FormControl><Input placeholder="e.g., Dr. Alan Turing | CST01" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                                            <FormField control={form.control} name={`lectures.${lectureIndex}.fromTime`} render={({ field }) => (
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
                                                            )}/>
                                                            <FormField control={form.control} name={`lectures.${lectureIndex}.toTime`} render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>To</FormLabel>
                                                                    <FormControl><Input type="time" {...field} readOnly className="bg-muted/50"/></FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}/>
                                                        </div>
                                                        <FormField control={form.control} name={`lectures.${lectureIndex}.students`} render={({ field }) => (<FormItem><FormLabel>Student List</FormLabel><FormControl><Textarea placeholder="Enter one student per line (Name + Enrollment No.)" {...field} className="min-h-[120px]"/></FormControl><FormMessage /></FormItem>)} />
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
                                </div>
                            </ScrollArea>
                            <DialogFooter className="mt-6 pr-4">
                                <DialogClose asChild>
                                    <Button type="button" variant="secondary">Cancel</Button>
                                </DialogClose>
                                <Button type="submit"><Save className="mr-2 h-4 w-4"/>Save Class</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </FormProvider>
            </DialogContent>
        </Dialog>
    )
}
