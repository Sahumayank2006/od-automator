
'use client';

import React, { useState, useEffect } from 'react';
import { PasscodeGate } from '@/components/PasscodeGate';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getAllOdRequests, updateOdRequestStatus, ODRequest, ODRequestStatus } from '@/lib/database';
import { Loader2, ShieldCheck, Home, Check, X, Info, Clock, CheckCircle, XCircle, FileText, Send, User, Mail } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const StatusBadge = ({ status }: { status: ODRequestStatus }) => {
    const statusStyles = {
        Pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40 hover:bg-yellow-500/30',
        Accepted: 'bg-green-500/20 text-green-300 border-green-500/40 hover:bg-green-500/30',
        Rejected: 'bg-red-500/20 text-red-300 border-red-500/40 hover:bg-red-500/30',
    };
    const statusIcons = {
        Pending: <Clock className="w-3 h-3 mr-1.5" />,
        Accepted: <CheckCircle className="w-3 h-3 mr-1.5" />,
        Rejected: <XCircle className="w-3 h-3 mr-1.5" />,
    }

    return (
        <Badge className={cn("capitalize pointer-events-none", statusStyles[status])}>
            {statusIcons[status]}
            {status}
        </Badge>
    );
};

const RequestDetailsDialog = ({ request }: { request: ODRequest }) => {
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

function FacultyAdminPage() {
    const { toast } = useToast();
    const [requests, setRequests] = useState<ODRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const fetchRequests = async () => {
        setIsLoading(true);
        const fetchedRequests = await getAllOdRequests();
        setRequests(fetchedRequests);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleStatusUpdate = async (id: string, status: ODRequestStatus) => {
        setUpdatingId(id);
        const result = await updateOdRequestStatus(id, status);
        if (result.success) {
            toast({
                title: "Status Updated",
                description: `The request has been marked as ${status.toLowerCase()}.`,
            });
            // Refresh the list to show the change
            fetchRequests();
        } else {
            toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: result.error,
            });
        }
        setUpdatingId(null);
    };

    return (
        <ScrollArea className="h-screen bg-background">
            <div className="max-w-7xl mx-auto space-y-8 p-4 md:p-8">
                <header className="flex flex-wrap items-center justify-between gap-4 py-4">
                    <div className="flex items-center gap-3">
                        <ShieldCheck className="w-8 h-8 text-primary" />
                        <h1 className="text-2xl font-headline font-bold text-foreground">Faculty Admin</h1>
                    </div>
                    <Link href="/dashboard" passHref>
                        <Button variant="ghost"><Home className="w-4 h-4 mr-2"/>Back to Dashboard</Button>
                    </Link>
                </header>

                <div className="glass-panel p-6 md:p-8">
                    {isLoading ? (
                        <div className="flex justify-center items-center py-16">
                            <Loader2 className="w-8 h-8 mr-3 animate-spin text-primary"/>
                            <p className="text-muted-foreground">Loading OD Requests...</p>
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="text-center py-16 text-muted-foreground">
                            <Info className="w-12 h-12 mx-auto mb-4 text-primary/50" />
                            <p className="text-lg">No OD requests have been submitted yet.</p>
                            <p>Check back later to review and approve new requests.</p>
                        </div>
                    ) : (
                        <Accordion type="single" collapsible className="w-full space-y-4">
                            {requests.map(req => (
                                <AccordionItem key={req.id} value={req.id} className="glass-panel-inner !border-t-0 p-4 rounded-2xl overflow-hidden">
                                    <AccordionTrigger className="hover:no-underline">
                                        <div className="flex justify-between w-full items-center pr-4">
                                            <div className="text-left">
                                                <p className="text-sm text-muted-foreground">{format(req.eventDate, 'PPP')}</p>
                                                <h3 className="text-lg font-headline">{req.eventName}</h3>
                                            </div>
                                            <StatusBadge status={req.status} />
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pt-4 space-y-6">
                                        <div className="border-t border-white/10 pt-6 grid md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                                            <div><span className="font-semibold text-muted-foreground">Coordinator:</span> {req.facultyCoordinatorName}</div>
                                            <div><span className="font-semibold text-muted-foreground">Coordinator Email:</span> {req.facultyCoordinatorEmail}</div>
                                            <div><span className="font-semibold text-muted-foreground">Event Time:</span> {req.eventFromTime} - {req.eventToTime}</div>
                                            <div><span className="font-semibold text-muted-foreground">Submitted At:</span> {req.createdAt ? format(req.createdAt, 'Pp') : 'N/A'}</div>
                                        </div>

                                        <div className="border-t border-white/10 pt-6">
                                            <h4 className="font-headline font-semibold mb-2">Affected Classes:</h4>
                                            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                                {req.classes.map(c => (
                                                    <li key={c.id}>{c.course} {c.program} - Sem {c.semester} (Sec {c.section}) - <span className="text-foreground">{c.lectures.length} lecture(s)</span></li>
                                                ))}
                                            </ul>
                                        </div>
                                        
                                        <div className="border-t border-white/10 pt-6">
                                            <h4 className="font-headline font-semibold mb-4">Forward to Higher Authority</h4>
                                            <div className="grid md:grid-cols-2 gap-4 mb-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor={`fwd-name-${req.id}`} className="flex items-center text-xs"><User className="w-3 h-3 mr-2" />Recipient Name</Label>
                                                    <Input id={`fwd-name-${req.id}`} placeholder="e.g. Dr. John Smith" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor={`fwd-email-${req.id}`} className="flex items-center text-xs"><Mail className="w-3 h-3 mr-2" />Recipient Email</Label>
                                                    <Input id={`fwd-email-${req.id}`} type="email" placeholder="e.g. john.smith@example.com" />
                                                </div>
                                            </div>
                                            <Button variant="secondary" size="sm" disabled>
                                                <Send className="w-4 h-4 mr-2" />Forward (Coming Soon)
                                            </Button>
                                        </div>

                                        <div className="flex justify-end pt-4 mt-4 border-t border-white/10 gap-2">
                                            <RequestDetailsDialog request={req} />
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                onClick={() => handleStatusUpdate(req.id, 'Rejected')}
                                                disabled={updatingId === req.id || req.status === 'Rejected'}
                                            >
                                                {updatingId === req.id && req.status !== 'Accepted' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <X className="w-4 h-4 mr-2"/>}
                                                Reject
                                            </Button>
                                            <Button 
                                                size="sm"
                                                onClick={() => handleStatusUpdate(req.id, 'Accepted')}
                                                disabled={updatingId === req.id || req.status === 'Accepted'}
                                            >
                                               {updatingId === req.id && req.status !== 'Rejected' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2"/>}
                                                Accept
                                            </Button>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    )}
                </div>
            </div>
        </ScrollArea>
    );
}

export default function FacultyPage() {
    return (
        <PasscodeGate>
            <FacultyAdminPage />
        </PasscodeGate>
    )
}
