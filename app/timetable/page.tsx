
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import Link from 'next/link';
import { Home, Save, GraduationCap, Calendar, BookOpen, User, Tag, PlusCircle } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { saveTimetable, loadAllTimetables } from '@/lib/database';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Combobox } from '@/components/ui/combobox';
import { defaultTimetables } from '@/lib/timetables';
import { Loader2 } from 'lucide-react';

const lectureFormSchema = z.object({
  subjectName: z.string().min(1, 'Subject name is required.'),
  subjectCode: z.string().min(1, 'Subject code is required.'),
  facultyName: z.string().min(1, 'Faculty name is required.'),
  facultyCode: z.string().optional(),
});

type LectureFormValues = z.infer<typeof lectureFormSchema>;

export interface Lecture {
  id: string;
  fromTime: string;
  toTime: string;
  subjectName?: string;
  subjectCode?: string;
  facultyName?: string;
  facultyCode?: string;
}

export interface Schedule {
  [day: string]: Lecture[];
}

export interface TimetableData {
  course: string;
  program: string;
  semester: string;
  section: string;
  schedule: Schedule;
}

export const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const defaultLectureTimings = [
    { id: 'L1', fromTime: '09:15', toTime: '10:10' },
    { id: 'L2', fromTime: '10:15', toTime: '11:10' },
    { id: 'L3', fromTime: '11:15', toTime: '12:10' },
    { id: 'L4', fromTime: '12:15', toTime: '13:10' },
    { id: 'LUNCH', fromTime: '13:10', toTime: '14:10' },
    { id: 'L5', fromTime: '14:15', toTime: '15:10' },
    { id: 'L6', fromTime: '15:15', toTime: '16:10' },
    { id: 'L7', fromTime: '16:15', toTime: '17:10' },
];

const semester1LectureTimings = [
    { id: 'L1', fromTime: '09:15', toTime: '10:10' },
    { id: 'L2', fromTime: '10:15', toTime: '11:10' },
    { id: 'L3', fromTime: '11:15', toTime: '12:10' },
    { id: 'LUNCH', fromTime: '12:15', toTime: '13:10' },
    { id: 'L4', fromTime: '13:15', toTime: '14:10' },
    { id: 'L5', fromTime: '14:15', toTime: '15:10' },
    { id: 'L6', fromTime: '15:15', toTime: '16:10' },
    { id: 'L7', fromTime: '16:15', toTime: '17:10' },
];

const bcaSem5LectureTimings = [
    { id: 'L1', fromTime: '09:15', toTime: '10:10' },
    { id: 'L2', fromTime: '10:15', toTime: '11:10' },
    { id: 'L3', fromTime: '11:15', toTime: '12:10' },
    { id: 'LUNCH', fromTime: '12:15', toTime: '13:15' },
    { id: 'L4', fromTime: '13:15', toTime: '14:10' },
    { id: 'L5', fromTime: '14:15', toTime: '15:10' },
    { id: 'L6', fromTime: '15:15', toTime: '16:10' },
    { id: 'L7', fromTime: '16:15', toTime: '17:10' },
];


const generateInitialSchedule = (timings: typeof defaultLectureTimings): Record<string, Lecture[]> => {
    const schedule: Record<string, Lecture[]> = {};
    daysOfWeek.forEach(day => {
        schedule[day] = timings.map(timing => ({ ...timing, id: `${day}-${timing.id}` }));
    });
    return schedule;
};


const SectionPanel = ({ title, icon: Icon, children, titleClassName }: { title: string; icon: React.ElementType, children: React.ReactNode, titleClassName?: string }) => (
    <div className="glass-panel p-6 md:p-8">
        <div className="flex items-center mb-6">
            <Icon className="w-6 h-6 mr-3 text-primary" />
            <h2 className={cn("text-xl font-headline font-semibold text-foreground", titleClassName)}>{title}</h2>
        </div>
        <div className="relative">
            {children}
        </div>
    </div>
);


const LectureEditDialog = ({ open, onOpenChange, lecture, onSave }: { open: boolean, onOpenChange: (open: boolean) => void, lecture: Lecture, onSave: (values: LectureFormValues) => void }) => {
    const formMethods = useForm<LectureFormValues>({
        resolver: zodResolver(lectureFormSchema),
        defaultValues: {
            subjectName: lecture.subjectName || '',
            subjectCode: lecture.subjectCode || '',
            facultyName: lecture.facultyName || '',
            facultyCode: lecture.facultyCode || '',
        },
    });

    useEffect(() => {
        formMethods.reset({
            subjectName: lecture.subjectName || '',
            subjectCode: lecture.subjectCode || '',
            facultyName: lecture.facultyName || '',
            facultyCode: lecture.facultyCode || '',
        });
    }, [lecture, formMethods]);


    const onSubmit = (values: LectureFormValues) => {
        onSave(values);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] bg-secondary border-primary/50">
                <DialogHeader>
                    <DialogTitle className="text-primary text-glow">Edit Lecture</DialogTitle>
                </DialogHeader>
                <FormProvider {...formMethods}>
                    <Form {...formMethods}>
                        <form onSubmit={formMethods.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField control={formMethods.control} name="subjectName" render={({ field }) => (
                                <FormItem><FormLabel><BookOpen className="w-4 h-4 mr-2 inline"/>Subject Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={formMethods.control} name="subjectCode" render={({ field }) => (
                                <FormItem><FormLabel><Tag className="w-4 h-4 mr-2 inline"/>Subject Code</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={formMethods.control} name="facultyName" render={({ field }) => (
                                <FormItem><FormLabel><User className="w-4 h-4 mr-2 inline"/>Faculty Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={formMethods.control} name="facultyCode" render={({ field }) => (
                                <FormItem><FormLabel><Tag className="w-4 h-4 mr-2 inline"/>Faculty Code</FormLabel><FormControl><Input {...field} placeholder="e.g. F001 (Optional)"/></FormControl><FormMessage /></FormItem>
                            )} />
                            <div className="flex justify-end pt-4">
                                <Button type="submit"><Save className="w-4 h-4 mr-2"/> Save Changes</Button>
                            </div>
                        </form>
                    </Form>
                </FormProvider>
            </DialogContent>
        </Dialog>
    );
};

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

const sectionOptions = ['A', 'B', 'C', 'D', 'E'].map(sec => ({
    value: sec,
    label: sec
}));


export default function TimetablePage() {
    const { toast } = useToast();
    const [selectedClass, setSelectedClass] = useState({ course: 'B.Tech', program: 'CSE', semester: '1', section: 'A' });
    const [timetable, setTimetable] = useState<TimetableData | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedLecture, setSelectedLecture] = useState<{ day: string, lectureId: string } | null>(null);
    const [allTimetables, setAllTimetables] = useState<Record<string, TimetableData>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const lectureTimings = useMemo(() => {
        if (selectedClass.course === 'BCA' && selectedClass.semester === '5') {
            return bcaSem5LectureTimings;
        }
        if (selectedClass.semester === '1') {
            return semester1LectureTimings;
        }
        return defaultLectureTimings;
    }, [selectedClass.course, selectedClass.semester]);

    useEffect(() => {
        async function fetchTimetables() {
            setIsLoading(true);
            try {
                const loadedTimetables = await loadAllTimetables();
                const mergedTimetables = { ...defaultTimetables, ...loadedTimetables };
                setAllTimetables(mergedTimetables);
            } catch(e) {
                console.error("Could not fetch timetables from database", e);
                setAllTimetables(defaultTimetables);
                 toast({ variant: 'destructive', title: "Error Loading Data", description: "Could not fetch timetables from the database. Using local defaults." });
            } finally {
                setIsLoading(false);
            }
        }
        fetchTimetables();
    }, [toast]);

    const loadTimetable = useCallback(() => {
        const { course, program, semester, section } = selectedClass;
        if (course && program && semester && section) {
            const key = `${course}-${program}-${semester}-${section}`;
            const existingTimetable = allTimetables[key];
            if (existingTimetable) {
                setTimetable(existingTimetable);
            } else {
                setTimetable({ ...selectedClass, schedule: generateInitialSchedule(lectureTimings) });
            }
        } else {
            setTimetable(null);
        }
    }, [selectedClass, allTimetables, lectureTimings]);
    
    useEffect(() => {
        if (!isLoading) {
            loadTimetable();
        }
    }, [selectedClass, isLoading, loadTimetable]);

    const handleSelectChange = (field: keyof typeof selectedClass, value: string) => {
        setSelectedClass(prev => ({ ...prev, [field]: value }));
    };

    const handleLectureClick = (day: string, lectureId: string) => {
        setSelectedLecture({ day, lectureId });
        setIsDialogOpen(true);
    };

    const handleSaveLecture = (values: LectureFormValues) => {
        if (!timetable || !selectedLecture) return;

        const { day, lectureId } = selectedLecture;

        const updatedSchedule = { ...timetable.schedule };
        const daySchedule = [...updatedSchedule[day]];
        const lectureIndex = daySchedule.findIndex(l => l.id === lectureId);

        if (lectureIndex !== -1) {
            daySchedule[lectureIndex] = {
                ...daySchedule[lectureIndex],
                ...values,
            };
            updatedSchedule[day] = daySchedule;
            setTimetable({ ...timetable, schedule: updatedSchedule });
            toast({ title: "Lecture Updated", description: "The lecture details have been saved locally. Click 'Save Timetable' to persist." });
        }
    };
    
    const handleSaveTimetable = async () => {
        if (!timetable) {
            toast({ variant: 'destructive', title: "No Timetable", description: "Please select a class and create a timetable first." });
            return;
        }
        setIsSaving(true);
        try {
            const result = await saveTimetable(timetable);
            if(result.success) {
                const key = `${timetable.course}-${timetable.program}-${timetable.semester}-${timetable.section}`;
                const updatedTimetables = { ...allTimetables, [key]: timetable };
                setAllTimetables(updatedTimetables);
                toast({ title: "Timetable Saved!", description: "The timetable has been saved to the database." });
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error("Error saving timetable:", error);
            toast({ variant: 'destructive', title: "Save Failed", description: "Could not save the timetable to the database." });
        } finally {
            setIsSaving(false);
        }
    };

    const getCurrentLecture = () => {
        if (!timetable || !selectedLecture) {
            return { id: '', fromTime: '', toTime: '' };
        }
        return timetable.schedule[selectedLecture.day]?.find(l => l.id === selectedLecture.lectureId) || { id: '', fromTime: '', toTime: '' };
    };

    return (
        <>
            <ScrollArea className="h-screen bg-background">
                <div className="container mx-auto space-y-8 p-4 md:p-8">
                     <header className="flex flex-wrap items-center justify-between gap-4 py-4">
                        <div className="flex items-center gap-3">
                            <GraduationCap className="w-8 h-8 text-primary" />
                            <h1 className="text-2xl font-headline font-bold text-foreground">Timetable Manager</h1>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <Button onClick={handleSaveTimetable} disabled={isSaving || isLoading}>
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                                Save Timetable
                            </Button>
                            <Link href="/dashboard" passHref>
                                <Button variant="ghost">
                                    <Home className="w-4 h-4 mr-2"/>
                                    Back to Dashboard
                                </Button>
                            </Link>
                        </div>
                    </header>

                    <SectionPanel title="Select Class" icon={Calendar}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                             <div className="space-y-1.5">
                                 <label className="text-xs font-medium text-muted-foreground">Course</label>
                                 <Combobox options={courseOptions} value={selectedClass.course} onChange={(v) => handleSelectChange('course', v)} placeholder='Select course...' />
                             </div>
                              <div className="space-y-1.5">
                                 <label className="text-xs font-medium text-muted-foreground">Program</label>
                                 <Combobox options={programOptions} value={selectedClass.program} onChange={(v) => handleSelectChange('program', v)} placeholder='Select program...' />
                             </div>
                             <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">Semester</label>
                                <Combobox options={semesterOptions} value={selectedClass.semester} onChange={(v) => handleSelectChange('semester', v)} placeholder='Select semester...' />
                             </div>
                             <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">Section</label>
                                <Combobox options={sectionOptions} value={selectedClass.section} onChange={(v) => handleSelectChange('section', v)} placeholder='Select section...' />
                             </div>
                        </div>
                    </SectionPanel>

                    {isLoading ? (
                         <div className="text-center py-16 text-muted-foreground flex items-center justify-center">
                            <Loader2 className="w-6 h-6 mr-3 animate-spin text-primary"/>
                            <p>Loading timetables from database...</p>
                        </div>
                    ) : timetable ? (
                        <div className="glass-panel p-6 md:p-8">
                             <div className="flex items-center mb-6">
                                <BookOpen className="w-6 h-6 mr-3 text-primary" />
                                <h2 className={cn("text-xl font-headline font-semibold text-foreground")}>Weekly Schedule</h2>
                            </div>
                            <div className="overflow-x-auto relative">
                                <table className="w-full border-collapse text-center min-w-[800px]">
                                    <thead>
                                        <tr className="bg-secondary/50">
                                            <th className="p-1 border border-border sticky left-0 bg-secondary/50 z-10 text-xs">Day</th>
                                            {lectureTimings.map(t => (
                                                <th key={t.id} className="p-1 border border-border text-xs">
                                                    {t.id !== 'LUNCH' ? `Lec ${t.id.replace('L','')}` : 'LUNCH'} <br/> <span className="font-normal text-muted-foreground text-[10px]">{t.fromTime}-{t.toTime}</span>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {daysOfWeek.map(day => (
                                            <tr key={day}>
                                                <td className="p-1 border border-border font-semibold sticky left-0 bg-secondary/80 z-10 text-xs">{day}</td>
                                                {timetable.schedule[day] && timetable.schedule[day].map((lecture, index) => {
                                                     if (lecture.id.endsWith('LUNCH')) {
                                                        return <td key={`${lecture.id}-${index}`} className="p-1 border border-border bg-muted/30 font-semibold text-muted-foreground align-middle text-xs">LUNCH</td>
                                                     }
                                                     return (
                                                        <td key={`${lecture.id}-${index}`} className="p-1 border border-border align-middle hover:bg-primary/10 cursor-pointer transition-colors" onClick={() => handleLectureClick(day, lecture.id)}>
                                                            {lecture.subjectCode || lecture.subjectName ? (
                                                                <div className="text-[10px] font-semibold text-foreground">
                                                                    {lecture.subjectCode || lecture.subjectName}
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center justify-center h-full min-h-[3rem]">
                                                                    <PlusCircle className="w-4 h-4 text-muted-foreground/50"/>
                                                                </div>
                                                            )}
                                                        </td>
                                                    )
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                         <div className="text-center py-16 text-muted-foreground">
                            <p>Please select a course, program, semester, and section to view or create a timetable.</p>
                        </div>
                    )}
                </div>
            </ScrollArea>
             {selectedLecture && (
                <LectureEditDialog
                    open={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                    lecture={getCurrentLecture()}
                    onSave={handleSaveLecture}
                />
            )}
        </>
    );
}
