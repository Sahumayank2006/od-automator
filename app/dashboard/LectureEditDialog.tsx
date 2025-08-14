
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import React, { useEffect } from 'react';
import { format, addMinutes } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpen, User, Clock, Save } from 'lucide-react';

const lectureSchema = z.object({
  id: z.string(),
  subject: z.string().min(1, "Subject name & code are required."),
  faculty: z.string().min(1, "Faculty name & code are required."),
  fromTime: z.string().min(1, "Start time is required."),
  toTime: z.string().min(1, "End time is required."),
  students: z.string().min(1, "Student list is required."),
});

export type LectureFormValues = z.infer<typeof lectureSchema>;

const lectureStartTimes = ["09:15", "10:15", "11:15", "12:15", "13:15", "14:15", "15:15", "16:15"];

interface LectureEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: LectureFormValues) => void;
  initialData?: Partial<LectureFormValues>;
}

export function LectureEditDialog({ open, onOpenChange, onSave, initialData }: LectureEditDialogProps) {
  const form = useForm<LectureFormValues>({
    resolver: zodResolver(lectureSchema),
    defaultValues: {
      id: initialData?.id || crypto.randomUUID(),
      subject: '',
      faculty: '',
      fromTime: '',
      toTime: '',
      students: '',
    },
    mode: 'onChange',
  });

  useEffect(() => {
    if (open) {
      form.reset({
        id: initialData?.id || crypto.randomUUID(),
        subject: initialData?.subject || '',
        faculty: initialData?.faculty || '',
        fromTime: initialData?.fromTime || '',
        toTime: initialData?.toTime || '',
        students: initialData?.students || '',
      });
    }
  }, [open, initialData, form]);

  const handleStartTimeChange = (value: string) => {
    form.setValue('fromTime', value, { shouldValidate: true, shouldDirty: true });
    if (value) {
      const [hours, minutes] = value.split(':').map(Number);
      const startDate = new Date();
      startDate.setHours(hours, minutes, 0, 0);
      const endDate = addMinutes(startDate, 55);
      const toTime = format(endDate, 'HH:mm');
      form.setValue('toTime', toTime, { shouldValidate: true, shouldDirty: true });
    }
  };

  const onSubmit = (data: LectureFormValues) => {
    onSave(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-secondary border-primary/50">
        <DialogHeader>
          <DialogTitle className="text-primary text-glow">{initialData?.id ? 'Edit Lecture' : 'Add New Lecture'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <ScrollArea className="h-[60vh] p-1">
              <div className="space-y-6 pr-4">
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center"><BookOpen className="w-4 h-4 mr-2" />Subject Name + Code</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Intro to CS | CS101" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="faculty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center"><User className="w-4 h-4 mr-2" />Faculty Name + Code</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Dr. Alan Turing | CST01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="fromTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center"><Clock className="w-4 h-4 mr-2" />From</FormLabel>
                          <Select onValueChange={handleStartTimeChange} defaultValue={field.value}>
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
                      control={form.control}
                      name="toTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center"><Clock className="w-4 h-4 mr-2" />To</FormLabel>
                          <FormControl><Input type="time" {...field} readOnly className="bg-muted/50" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="students"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center"><User className="w-4 h-4 mr-2" />Student List</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Enter one student per line (Name + Enrollment No.)" {...field} className="min-h-[200px]" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
            </ScrollArea>
            <DialogFooter className="pt-4 border-t border-white/10">
              <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit"><Save className="mr-2 h-4 w-4" />Save Lecture</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
