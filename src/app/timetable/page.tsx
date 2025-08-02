
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import Link from 'next/link';
import { Home, Save, GraduationCap, Calendar, BookOpen, User, Tag, PlusCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';


const lectureFormSchema = z.object({
  subjectName: z.string().min(1, 'Subject name is required.'),
  subjectCode: z.string().min(1, 'Subject code is required.'),
  facultyName: z.string().min(1, 'Faculty name is required.'),
  facultyCode: z.string().optional(),
});

type LectureFormValues = z.infer<typeof lectureFormSchema>;

interface Lecture {
  id: string;
  fromTime: string;
  toTime: string;
  subjectName?: string;
  subjectCode?: string;
  facultyName?: string;
  facultyCode?: string;
}

export interface TimetableData {
  course: string;
  program: string;
  semester: string;
  section: string;
  schedule: Record<string, Lecture[]>;
}

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const lectureTimings = [
    { id: 'L1', fromTime: '09:15', toTime: '10:10' },
    { id: 'L2', fromTime: '10:15', toTime: '11:10' },
    { id: 'L3', fromTime: '11:15', toTime: '12:10' },
    { id: 'L4', fromTime: '12:15', toTime: '13:10' },
    { id: 'LUNCH', fromTime: '13:10', toTime: '14:10' },
    { id: 'L5', fromTime: '14:15', toTime: '15:10' },
    { id: 'L6', fromTime: '15:15', toTime: '16:10' },
    { id: 'L7', fromTime: '16:15', toTime: '17:10' },
];

const btechCse3A_Timetable: TimetableData = {
    course: 'B.Tech',
    program: 'CSE',
    semester: '3',
    section: 'A',
    schedule: {
        Monday: [
            { id: 'L1', fromTime: '09:15', toTime: '10:10', subjectName: 'Python Programming', subjectCode: 'CSE302', facultyName: 'Dr. Ghanshyam P', facultyCode: '' },
            { id: 'L2', fromTime: '10:15', toTime: '11:10', subjectName: 'Applied Mathematics - III', subjectCode: 'MAT 301', facultyName: 'Dr. Giriraj Kumar', facultyCode: '' },
            { id: 'L3', fromTime: '11:15', toTime: '12:10', subjectName: 'Digital Electronics and Logic Design', subjectCode: 'ECE 306', facultyName: 'Ms. Rashmi Tikar', facultyCode: '' },
            { id: 'L4', fromTime: '12:15', toTime: '13:10', subjectName: 'Data Structures Through C++', subjectCode: 'CSE 202', facultyName: 'Mr. Gaurav Kumar', facultyCode: '' },
            { id: 'LUNCH', fromTime: '13:10', toTime: '14:10' },
            { id: 'L5', fromTime: '14:15', toTime: '15:10', subjectName: 'Behavioural Science - III', subjectCode: 'BSU 343', facultyName: 'Dr. Jangjeet', facultyCode: '' },
            { id: 'L6', fromTime: '15:15', toTime: '16:10', subjectName: 'CSE Specialization', subjectCode: '', facultyName: '', facultyCode: '' },
            { id: 'L7', fromTime: '16:15', toTime: '17:10', subjectName: 'Database Management Systems', subjectCode: 'CSE 304', facultyName: 'Ms. Nishtha Paras', facultyCode: '' },
        ],
        Tuesday: [
            { id: 'L1', fromTime: '09:15', toTime: '10:10', subjectName: 'CSE Specialization', subjectCode: '', facultyName: '', facultyCode: '' },
            { id: 'L2', fromTime: '10:15', toTime: '11:10', subjectName: 'Python Programming Lab', subjectCode: 'CSE 322', facultyName: 'Arunima Shivhare', facultyCode: '' },
            { id: 'L3', fromTime: '11:15', toTime: '12:10', subjectName: 'DBMS Lab', subjectCode: 'CSE 324', facultyName: 'Jeetendra Singh Bh', facultyCode: '' },
            { id: 'L4', fromTime: '12:15', toTime: '13:10', subjectName: 'French - III', subjectCode: 'FLU 344', facultyName: 'Dr. Suketu Revar', facultyCode: '' },
            { id: 'LUNCH', fromTime: '13:10', toTime: '14:10' },
            { id: 'L5', fromTime: '14:15', toTime: '15:10', subjectName: 'DBMS Lab', subjectCode: 'CSE 324', facultyName: 'Jeetendra Singh Bh', facultyCode: '' },
            { id: 'L6', fromTime: '15:15', toTime: '16:10', subjectName: 'Data Structures through C++ Lab', subjectCode: 'CSE 222', facultyName: 'Dr. Giriraj Kumar', facultyCode: '' },
            { id: 'L7', fromTime: '16:15', toTime: '17:10', subjectName: 'LIBRARY/CCA', subjectCode: '', facultyName: '', facultyCode: '' },
        ],
        Wednesday: [
            { id: 'L1', fromTime: '09:15', toTime: '10:10', subjectName: 'Digital Electronics and Logic Design Lab', subjectCode: 'ECE 326', facultyName: 'Ms. Rashmi Tikar', facultyCode: '' },
            { id: 'L2', fromTime: '10:15', toTime: '11:10', subjectName: 'Python Programming Lab', subjectCode: 'CSE 322', facultyName: 'Arunima Shivhare', facultyCode: '' },
            { id: 'L3', fromTime: '11:15', toTime: '12:10', subjectName: 'Database Management Systems', subjectCode: 'CSE 304', facultyName: 'Ms. Nishtha Paras', facultyCode: '' },
            { id: 'L4', fromTime: '12:15', toTime: '13:10', subjectName: 'Python Programming', subjectCode: 'CSE302', facultyName: 'Dr. Ghanshyam P', facultyCode: '' },
            { id: 'LUNCH', fromTime: '13:10', toTime: '14:10' },
            { id: 'L5', fromTime: '14:15', toTime: '15:10', subjectName: 'Communication Skills - III', subjectCode: 'BSU 341', facultyName: 'Dr. Archana Sharn', facultyCode: '' },
            { id: 'L6', fromTime: '15:15', toTime: '16:10', subjectName: 'CSE Specialization', subjectCode: '', facultyName: '', facultyCode: '' },
            { id: 'L7', fromTime: '16:15', toTime: '17:10', subjectName: 'LIBRARY/CCA', subjectCode: '', facultyName: '', facultyCode: '' },
        ],
        Thursday: [
            { id: 'L1', fromTime: '09:15', toTime: '10:10', subjectName: 'CSE Specialization', subjectCode: '', facultyName: '', facultyCode: '' },
            { id: 'L2', fromTime: '10:15', toTime: '11:10', subjectName: 'CSE Specialization', subjectCode: '', facultyName: '', facultyCode: '' },
            { id: 'L3', fromTime: '11:15', toTime: '12:10', subjectName: 'Data Structures Through C++', subjectCode: 'CSE 202', facultyName: 'Mr. Gaurav Kumar', facultyCode: '' },
            { id: 'L4', fromTime: '12:15', toTime: '13:10', subjectName: 'Digital Electronics and Logic Design', subjectCode: 'ECE 306', facultyName: 'Ms. Rashmi Tikar', facultyCode: '' },
            { id: 'LUNCH', fromTime: '13:10', toTime: '14:10' },
            { id: 'L5', fromTime: '14:15', toTime: '15:10', subjectName: 'Communication Skills - III', subjectCode: 'BSU 341', facultyName: 'Dr. Archana Sharn', facultyCode: '' },
            { id: 'L6', fromTime: '15:15', toTime: '16:10', subjectName: 'Python Programming', subjectCode: 'CSE302', facultyName: 'Dr. Ghanshyam P', facultyCode: '' },
            { id: 'L7', fromTime: '16:15', toTime: '17:10', subjectName: 'Applied Mathematics - III', subjectCode: 'MAT 301', facultyName: 'Dr. Giriraj Kumar', facultyCode: '' },
        ],
        Friday: [
            { id: 'L1', fromTime: '09:15', toTime: '10:10', subjectName: 'Applied Mathematics - III', subjectCode: 'MAT 301', facultyName: 'Dr. Giriraj Kumar', facultyCode: '' },
            { id: 'L2', fromTime: '10:15', toTime: '11:10', subjectName: 'Database Management Systems', subjectCode: 'CSE 304', facultyName: 'Ms. Nishtha Paras', facultyCode: '' },
            { id: 'L3', fromTime: '11:15', toTime: '12:10', subjectName: 'Data Structures Through C++', subjectCode: 'CSE 202', facultyName: 'Mr. Gaurav Kumar', facultyCode: '' },
            { id: 'L4', fromTime: '12:15', toTime: '13:10', subjectName: 'Digital Electronics and Logic Design', subjectCode: 'ECE 306', facultyName: 'Ms. Rashmi Tikar', facultyCode: '' },
            { id: 'LUNCH', fromTime: '13:10', toTime: '14:10' },
            { id: 'L5', fromTime: '14:15', toTime: '15:10', subjectName: 'Data Structures through C++ Lab', subjectCode: 'CSE 222', facultyName: 'Mr. Gaurav Kumar', facultyCode: '' },
            { id: 'L6', fromTime: '15:15', toTime: '16:10', subjectName: 'Digital Electronics and Logic Design Lab', subjectCode: 'ECE 326', facultyName: 'Ms. Rashmi Tikar', facultyCode: '' },
            { id: 'L7', fromTime: '16:15', toTime: '17:10', subjectName: 'LIBRARY/CCA', subjectCode: '', facultyName: '', facultyCode: '' },
        ],
    },
};

const generateInitialSchedule = (): Record<string, Lecture[]> => {
    const schedule: Record<string, Lecture[]> = {};
    daysOfWeek.forEach(day => {
        schedule[day] = lectureTimings.map(timing => ({ ...timing }));
    });
    return schedule;
};


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


const LectureEditDialog = ({ open, onOpenChange, lecture, onSave }: { open: boolean, onOpenChange: (open: boolean) => void, lecture: Lecture, onSave: (values: LectureFormValues) => void }) => {
    const form = useForm<LectureFormValues>({
        resolver: zodResolver(lectureFormSchema),
        defaultValues: {
            subjectName: lecture.subjectName || '',
            subjectCode: lecture.subjectCode || '',
            facultyName: lecture.facultyName || '',
            facultyCode: lecture.facultyCode || '',
        },
    });

    useEffect(() => {
        form.reset({
            subjectName: lecture.subjectName || '',
            subjectCode: lecture.subjectCode || '',
            facultyName: lecture.facultyName || '',
            facultyCode: lecture.facultyCode || '',
        });
    }, [lecture, form]);


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
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="subjectName" render={({ field }) => (
                            <FormItem><FormLabel><BookOpen className="w-4 h-4 mr-2 inline"/>Subject Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="subjectCode" render={({ field }) => (
                            <FormItem><FormLabel><Tag className="w-4 h-4 mr-2 inline"/>Subject Code</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="facultyName" render={({ field }) => (
                            <FormItem><FormLabel><User className="w-4 h-4 mr-2 inline"/>Faculty Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="facultyCode" render={({ field }) => (
                            <FormItem><FormLabel><Tag className="w-4 h-4 mr-2 inline"/>Faculty Code</FormLabel><FormControl><Input {...field} placeholder="e.g. F001 (Optional)"/></FormControl><FormMessage /></FormItem>
                        )} />
                        <div className="flex justify-end pt-4">
                            <Button type="submit"><Save className="w-4 h-4 mr-2"/> Save Changes</Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};


export default function TimetablePage() {
    const { toast } = useToast();
    const [selectedClass, setSelectedClass] = useState({ course: 'B.Tech', program: 'CSE', semester: '3', section: 'A' });
    const [timetable, setTimetable] = useState<TimetableData | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedLecture, setSelectedLecture] = useState<{ day: string, lectureId: string } | null>(null);
    const [allTimetables, setAllTimetables] = useState<Record<string, TimetableData>>({
        'B.Tech-CSE-3-A': btechCse3A_Timetable
    });

    useEffect(() => {
        const storedTimetables = JSON.parse(localStorage.getItem('timetables') || '{}');
        const mergedTimetables = {...allTimetables, ...storedTimetables};
        setAllTimetables(mergedTimetables);
         // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadTimetable = useCallback(() => {
        const { course, program, semester, section } = selectedClass;
        if (course && program && semester && section) {
            const key = `${course}-${program}-${semester}-${section}`;
            const existingTimetable = allTimetables[key];
            if (existingTimetable) {
                setTimetable(existingTimetable);
            } else {
                setTimetable({ ...selectedClass, schedule: generateInitialSchedule() });
            }
        } else {
            setTimetable(null);
        }
    }, [selectedClass, allTimetables]);
    
    useEffect(() => {
        loadTimetable();
    }, [selectedClass, loadTimetable]);

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
            toast({ title: "Lecture Updated", description: "The lecture details have been saved locally." });
        }
    };
    
    const handleSaveTimetable = () => {
        if (!timetable) {
            toast({ variant: 'destructive', title: "No Timetable", description: "Please select a class and create a timetable first." });
            return;
        }

        const key = `${timetable.course}-${timetable.program}-${timetable.semester}-${timetable.section}`;
        const updatedTimetables = { ...allTimetables, [key]: timetable };
        
        localStorage.setItem('timetables', JSON.stringify(updatedTimetables));
        setAllTimetables(updatedTimetables);
        toast({ title: "Timetable Saved!", description: "The timetable has been saved to your browser's local storage." });
    };

    const getCurrentLecture = () => {
        if (!timetable || !selectedLecture) {
            return { id: '', fromTime: '', toTime: '' };
        }
        return timetable.schedule[selectedLecture.day].find(l => l.id === selectedLecture.lectureId) || { id: '', fromTime: '', toTime: '' };
    };

    return (
        <>
            <ScrollArea className="h-screen bg-background">
                <div className="max-w-7xl mx-auto space-y-8 p-4 md:p-8">
                     <header className="flex items-center justify-between py-4">
                        <div className="flex items-center gap-3">
                            <GraduationCap className="w-8 h-8 text-primary" />
                            <h1 className="text-2xl font-headline font-bold text-foreground">Timetable Manager</h1>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button onClick={handleSaveTimetable}><Save className="mr-2 h-4 w-4"/>Save Timetable</Button>
                            <Link href="/dashboard" passHref>
                                <Button variant="ghost">
                                    <Home className="w-4 h-4 mr-2"/>
                                    Back to Dashboard
                                </Button>
                            </Link>
                        </div>
                    </header>

                    <SectionPanel title="Select Class" icon={Calendar}>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                             <Select onValueChange={(v) => handleSelectChange('course', v)} value={selectedClass.course}><SelectTrigger><SelectValue placeholder="Course" /></SelectTrigger><SelectContent><SelectItem value="B.Tech">B.Tech</SelectItem><SelectItem value="BCA">BCA</SelectItem><SelectItem value="MCA">MCA</SelectItem></SelectContent></Select>
                             <Select onValueChange={(v) => handleSelectChange('program', v)} value={selectedClass.program}><SelectTrigger><SelectValue placeholder="Program" /></SelectTrigger><SelectContent><SelectItem value="CSE">Computer Science</SelectItem><SelectItem value="IT">Information Technology</SelectItem><SelectItem value="ECE">Electronics</SelectItem></SelectContent></Select>
                             <Select onValueChange={(v) => handleSelectChange('semester', v)} value={selectedClass.semester}><SelectTrigger><SelectValue placeholder="Semester" /></SelectTrigger><SelectContent>{Array.from({length: 8}, (_, i) => i + 1).map(sem => <SelectItem key={sem} value={String(sem)}>Semester {sem}</SelectItem>)}</SelectContent></Select>
                             <Select onValueChange={(v) => handleSelectChange('section', v)} value={selectedClass.section}><SelectTrigger><SelectValue placeholder="Section" /></SelectTrigger><SelectContent>{['A', 'B', 'C', 'D', 'E'].map(sec => <SelectItem key={sec} value={sec}>{sec}</SelectItem>)}</SelectContent></Select>
                        </div>
                    </SectionPanel>

                    {timetable ? (
                        <SectionPanel title="Weekly Schedule" icon={BookOpen}>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-center">
                                    <thead>
                                        <tr className="bg-secondary/50">
                                            <th className="p-2 border border-border">Day</th>
                                            {lectureTimings.map(t => (
                                                <th key={t.id} className="p-2 border border-border text-xs md:text-sm">
                                                    Lec {t.id.replace('L','')} <br/> <span className="font-normal text-muted-foreground">{t.fromTime}-{t.toTime}</span>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {daysOfWeek.map(day => (
                                            <tr key={day}>
                                                <td className="p-2 border border-border font-semibold">{day}</td>
                                                {timetable.schedule[day].map(lecture => {
                                                     if (lecture.id === 'LUNCH') {
                                                        return <td key={lecture.id} className="p-2 border border-border bg-muted/30 font-semibold text-muted-foreground align-middle">LUNCH</td>
                                                     }
                                                     return (
                                                        <td key={lecture.id} className="p-1 md:p-2 border border-border align-top h-28 hover:bg-primary/10 cursor-pointer transition-colors" onClick={() => handleLectureClick(day, lecture.id)}>
                                                            {lecture.subjectName ? (
                                                                <div className="text-xs md:text-sm text-left">
                                                                    <p className="font-bold text-foreground">{lecture.subjectName}</p>
                                                                    <p className="text-muted-foreground">{lecture.subjectCode}</p>
                                                                    <p className="text-foreground mt-1">{lecture.facultyName}</p>
                                                                    <p className="text-muted-foreground">{lecture.facultyCode}</p>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center justify-center h-full">
                                                                    <PlusCircle className="w-5 h-5 text-muted-foreground/50"/>
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
                        </SectionPanel>
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
