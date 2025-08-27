
'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { render } from '@react-email/render';
import { ODRequestEmail } from '@/emails/od-request';
import type { ODFormValues } from './page';

interface EmailPreviewDialogProps {
    data: ODFormValues | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const EmailPreviewDialog = ({ data, open, onOpenChange }: EmailPreviewDialogProps) => {
    if (!data) return null;

    // A simple check for a potentially uninitialized date
    const isDataReady = data.eventDate instanceof Date && !isNaN(data.eventDate.getTime());

    const emailHtml = isDataReady ? render(<ODRequestEmail data={data} />) : '<p>Please fill out the form to see the preview.</p>';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col bg-secondary border-primary/50">
                <DialogHeader>
                    <DialogTitle className="text-primary text-glow">Email Preview</DialogTitle>
                </DialogHeader>
                <div className="flex-1 border rounded-lg overflow-hidden bg-white">
                     <iframe
                        srcDoc={emailHtml}
                        className="w-full h-full border-0"
                        title="Email Preview"
                    />
                </div>
                 <div className="flex justify-end pt-4 mt-4 border-t border-white/10">
                    <DialogClose asChild>
                        <Button variant="outline"><X className="w-4 h-4 mr-2" />Close</Button>
                    </DialogClose>
                </div>
            </DialogContent>
        </Dialog>
    );
}
