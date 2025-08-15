
'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText } from 'lucide-react';
import { format } from 'date-fns';
import type { ODRequest } from '@/lib/database';

export const RequestDetailsDialog = ({ request }: { request: ODRequest }) => {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm"><FileText className="w-4 h-4 mr-2" />View Details</Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col bg-secondary border-primary/50">
                <DialogHeader>
                    <DialogTitle className="text-primary text-glow">OD Request Details</DialogTitle>
                </DialogHeader>
                <ScrollArea className="flex-1 -mr-4 pr-4">
                    <div className="space-y-6">
                        <div>
                            <h3 className="font-headline font-semibold mb-2">Event: {request.eventName}</h3>
                            <p className="text-sm text-muted-foreground">Date: {format(request.eventDate, 'PPP')} ({request.eventFromTime} - {request.eventToTime})</p>
                            <p className="text-sm text-muted-foreground">Coordinator: {request.facultyCoordinatorName} ({request.facultyCoordinatorEmail})</p>
                        </div>

                        {request.classes.map(classInfo => (
                            <div key={classInfo.id} className="glass-panel-inner p-4 rounded-xl">
                                <h4 className="font-headline font-semibold mb-3 pb-2 border-b border-white/10">
                                    {classInfo.course} {classInfo.program} - Sem {classInfo.semester} (Sec {classInfo.section})
                                </h4>
                                {classInfo.lectures.map(lecture => (
                                    <div key={lecture.id} className="mb-4">
                                        <p className="font-semibold text-sm">{lecture.subject}</p>
                                        <p className="text-xs text-muted-foreground mb-2">{lecture.faculty} &bull; {lecture.fromTime} - {lecture.toTime}</p>
                                        <div className="bg-background/30 rounded-lg p-2 max-h-48 overflow-y-auto">
                                            <p className="text-xs whitespace-pre-wrap font-mono">{lecture.students}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}
