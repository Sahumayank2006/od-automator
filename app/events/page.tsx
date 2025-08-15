
'use client';

import React, { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { getAllOdRequests, deleteOdRequest, ODRequest, ODRequestStatus } from '@/lib/database';
import { Loader2, BarChart3, Home, Clock, CheckCircle, XCircle, Info, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RequestDetailsDialog } from '../dashboard/RequestDetailsDialog';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"


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

export default function EventStatusPage() {
    const [requests, setRequests] = useState<ODRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const fetchRequests = async () => {
        setIsLoading(true);
        const fetchedRequests = await getAllOdRequests();
        setRequests(fetchedRequests);
        setIsLoading(false);
    }

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleDelete = async (id: string) => {
        const result = await deleteOdRequest(id);
        if(result.success) {
            toast({ title: 'Request Deleted', description: 'The rejected OD request has been removed.' });
            fetchRequests();
        } else {
            toast({ variant: 'destructive', title: 'Deletion Failed', description: result.error });
        }
    }

    const summary = requests.reduce((acc, req) => {
        acc[req.status] = (acc[req.status] || 0) + 1;
        return acc;
    }, {} as Record<ODRequestStatus, number>);

    return (
        <ScrollArea className="h-screen bg-background">
            <div className="max-w-7xl mx-auto space-y-8 p-4 md:p-8">
                <header className="flex flex-wrap items-center justify-between gap-4 py-4">
                    <div className="flex items-center gap-3">
                        <BarChart3 className="w-8 h-8 text-primary" />
                        <h1 className="text-2xl font-headline font-bold text-foreground">Event Status Dashboard</h1>
                    </div>
                    <Link href="/dashboard" passHref>
                        <Button variant="ghost"><Home className="w-4 h-4 mr-2"/>Back to Dashboard</Button>
                    </Link>
                </header>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="glass-panel-inner"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Requests</CardTitle><BarChart3 className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{requests.length}</div></CardContent></Card>
                    <Card className="glass-panel-inner"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Accepted</CardTitle><CheckCircle className="h-4 w-4 text-green-400" /></CardHeader><CardContent><div className="text-2xl font-bold">{summary.Accepted || 0}</div></CardContent></Card>
                    <Card className="glass-panel-inner"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Pending</CardTitle><Clock className="h-4 w-4 text-yellow-400" /></CardHeader><CardContent><div className="text-2xl font-bold">{summary.Pending || 0}</div></CardContent></Card>
                </div>

                <div className="glass-panel p-6 md:p-8">
                    {isLoading ? (
                        <div className="flex justify-center items-center py-16">
                            <Loader2 className="w-8 h-8 mr-3 animate-spin text-primary"/>
                            <p className="text-muted-foreground">Loading OD Requests...</p>
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="text-center py-16 text-muted-foreground">
                            <Info className="w-12 h-12 mx-auto mb-4 text-primary/50" />
                            <p className="text-lg">No OD requests found.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {requests.map(req => (
                                <div key={req.id} className="glass-panel-inner p-4 flex flex-wrap justify-between items-center gap-4 rounded-xl">
                                    <div className="flex-1 min-w-[200px]">
                                        <p className="text-sm text-muted-foreground">{format(req.eventDate, 'PPP')}</p>
                                        <h3 className="font-headline font-semibold">{req.eventName}</h3>
                                        <p className="text-xs text-muted-foreground">To: {req.facultyCoordinatorName}</p>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <StatusBadge status={req.status} />
                                        <RequestDetailsDialog request={req}/>
                                        {req.status === 'Rejected' && (
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="destructive" size="icon"><Trash2 className="w-4 h-4" /></Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This action cannot be undone. This will permanently delete this OD request from the database.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDelete(req.id)}>Delete</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </ScrollArea>
    );
}
