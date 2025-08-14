
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, FormProvider } from 'react-hook-form';
import * as z from 'zod';
import React, { useState } from 'react';
import { getDay } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Combobox } from '@/components/ui/combobox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TimetableData } from '../timetable/page';
import { defaultTimetables } from '@/lib/timetables';
import { PlusCircle, Trash2, BookOpen, Save, Bot, Edit, FileText } from 'lucide-react';
import { LectureEditDialog, type LectureFormValues } from './LectureEditDialog';

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

interface AddClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: ClassFormValues) => void;
  eventDetails: {
    eventDate?: Date;
    eventFromTime?: string;
    eventToTime?: string;
  };
}

export function AddClassDialog({ open, onOpenChange, onSave, eventDetails }: AddClassDialogProps) {
    const { toast } = useToast();
    const [isLectureModalOpen, setIsLectureModalOpen] = useState(false);
    const [editingLecture, setEditingLecture] = useState<LectureFormValues | undefined>(undefined);

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

    const lectures = form.watch('lectures');

    const timeToMinutes = (time: string) => {
      if (!time || !time.includes(':')) return 0;
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const handleAutofill = () => {
        const { course, program, semester, section } = form.getValues();
        const { eventDate, eventFromTime, eventToTime } = eventDetails;
        
        if (!course || !program || !semester || !section) {
            toast({ variant: 'destructive', title: "Missing Class Details", description: "Please select course, program, semester, and section." });
            return;
        }

        if (!eventDate || !eventFromTime || !eventToTime) {
            toast({ variant: 'destructive', title: "Missing Event Details", description: "Please provide the event date and time on the main page." });
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
            
            const overlapStart = Math.max(eventStartMinutes, lectureStartMinutes);
            const overlapEnd = Math.min(eventEndMinutes, lectureEndMinutes);
            const overlapDuration = overlapEnd - overlapStart;

            return overlapDuration >= 15;
        });

        if (conflictingLectures.length === 0) {
            toast({ title: "No Conflicts", description: "No lectures conflict with the specified event time for 15 minutes or more." });
            return;
        }

        const newLectures = conflictingLectures.map(lec => ({
            id: crypto.randomUUID(),
            subject: `${lec.subjectName} | ${lec.subjectCode}`,
            faculty: `${lec.facultyName}${lec.facultyCode ? ` | ${lec.facultyCode}` : ''}`,
            fromTime: lec.fromTime,
            toTime: lec.toTime,
            students: ''
        }));
        
        form.setValue('lectures', newLectures, { shouldValidate: true });

        toast({ title: "Lectures Autofilled", description: `${conflictingLectures.length} conflicting lectures have been added.` });
    };

    const handleSaveLecture = (lectureData: LectureFormValues) => {
        const currentLectures = form.getValues('lectures');
        const existingIndex = currentLectures.findIndex(l => l.id === lectureData.id);

        if (existingIndex > -1) {
            currentLectures[existingIndex] = lectureData;
            form.setValue('lectures', [...currentLectures], { shouldValidate: true });
            toast({ title: 'Lecture Updated', description: `Details for ${lectureData.subject} have been updated.`});
        } else {
            form.setValue('lectures', [...currentLectures, lectureData], { shouldValidate: true });
            toast({ title: 'Lecture Added', description: `${lectureData.subject} has been added.`});
        }
    };
    
    const handleEditLecture = (lecture: LectureFormValues) => {
        setEditingLecture(lecture);
        setIsLectureModalOpen(true);
    }
    
    const handleAddNewLecture = () => {
        setEditingLecture(undefined);
        setIsLectureModalOpen(true);
    };

    const handleRemoveLecture = (lectureId: string) => {
        const updatedLectures = form.getValues('lectures').filter(l => l.id !== lectureId);
        form.setValue('lectures', updatedLectures, { shouldValidate: true });
    };
    
    const onSubmit = (data: ClassFormValues) => {
        if(data.lectures.length === 0){
             toast({
                variant: "destructive",
                title: "No Lectures Added",
                description: "Please add at least one lecture for this class.",
            });
            return;
        }
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
        <>
            <LectureEditDialog
                open={isLectureModalOpen}
                onOpenChange={setIsLectureModalOpen}
                onSave={handleSaveLecture}
                initialData={editingLecture}
            />
            <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) form.reset(); onOpenChange(isOpen); }}>
                <DialogContent className="max-w-4xl h-[90vh] flex flex-col bg-secondary border-primary/50">
                    <DialogHeader className="flex-shrink-0">
                        <DialogTitle className="text-primary text-glow">Add New Class</DialogTitle>
                    </DialogHeader>
                    <FormProvider {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
                            <div className="flex-shrink-0 space-y-6 px-1 pb-4">
                                <div className="grid md:grid-cols-3 gap-6">
                                    <FormField control={form.control} name="course" render={({ field }) => (<FormItem><FormLabel>Course Name</FormLabel><Combobox options={courseOptions} {...field} placeholder="Select course..." /><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name="program" render={({ field }) => (<FormItem><FormLabel>Program</FormLabel><Combobox options={programOptions} {...field} placeholder="Select program..." /><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name="semester" render={({ field }) => (<FormItem><FormLabel>Semester</FormLabel><Combobox options={semesterOptions} {...field} placeholder="Select semester..." /><FormMessage /></FormItem>)} />
                                </div>
                                <FormField control={form.control} name="section" render={({ field }) => (<FormItem><FormLabel>Section</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4 pt-2">{['A', 'B', 'C', 'D', 'E'].map(sec => <FormItem key={sec} className="flex items-center space-x-2"><FormControl><RadioGroupItem value={sec} /></FormControl><FormLabel className="font-normal">{sec}</FormLabel></FormItem>)}</RadioGroup></FormControl><FormMessage /></FormItem>)} />
                            </div>
                            
                            <div className="flex-1 flex flex-col min-h-0 border-t border-white/10 pt-6 mt-6 px-1">
                                <div className="flex flex-wrap justify-between items-center mb-4 gap-2 flex-shrink-0">
                                    <h4 className="text-md font-headline font-semibold flex items-center"><BookOpen className="w-5 h-5 mr-2 text-primary"/>Affected Lectures</h4>
                                    <div className="flex gap-2">
                                        <Button type="button" size="sm" onClick={handleAutofill}><Bot className="w-4 h-4 mr-2" />Autofill Conflicts</Button>
                                        <Button type="button" size="sm" variant="ghost" onClick={handleAddNewLecture}><PlusCircle className="mr-2 h-4 w-4"/>Add New Lecture</Button>
                                    </div>
                                </div>

                                <ScrollArea className="flex-1 -mr-4 pr-4">
                                    <div className="space-y-3">
                                        {lectures.length === 0 ? (
                                            <div className="text-center py-8 text-muted-foreground bg-background/30 rounded-lg">
                                                <p>No lectures added yet.</p>
                                                <p className="text-sm">Click "Add New Lecture" or "Autofill Conflicts".</p>
                                            </div>
                                        ) : (
                                            lectures.map((lecture) => (
                                                <div key={lecture.id} className="glass-panel-inner p-4 flex justify-between items-center gap-4">
                                                    <div className="flex-1">
                                                        <p className="font-semibold text-sm truncate">{lecture.subject}</p>
                                                        <p className="text-xs text-muted-foreground truncate">{lecture.faculty} &bull; {lecture.fromTime} - {lecture.toTime}</p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button type="button" size="icon" variant="ghost" onClick={() => handleEditLecture(lecture)}><Edit className="w-4 h-4" /></Button>
                                                        <Button type="button" size="icon" variant="destructive" onClick={() => handleRemoveLecture(lecture.id)}><Trash2 className="w-4 h-4"/></Button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </ScrollArea>
                            </div>

                            <DialogFooter className="flex-shrink-0 pt-4 border-t border-white/10 mt-4">
                                <DialogClose asChild>
                                    <Button type="button" variant="secondary">Cancel</Button>
                                </DialogClose>
                                <Button type="submit"><Save className="mr-2 h-4 w-4"/>Save Class</Button>
                            </DialogFooter>
                        </form>
                    </FormProvider>
                </DialogContent>
            </Dialog>
        </>
    );
}

    