'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const AmityLogoPlaceholder = () => (
  <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 text-primary ring-4 ring-primary/20">
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-graduation-cap h-8 w-8"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.084a1 1 0 0 0 0 1.838l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 6 0 0 0 12 0v-3.5"/></svg>
  </div>
);

export default function AuthPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
      <div className="w-full max-w-md">
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-2xl blur-lg opacity-25"></div>
          <Card className="relative bg-secondary/20 backdrop-blur-lg border border-white/10">
            <CardHeader className="text-center">
              <AmityLogoPlaceholder />
              <CardTitle className="text-xl font-headline font-bold uppercase tracking-widest text-primary text-glow">Amity University</CardTitle>
              <CardDescription className="text-5xl font-headline font-bold text-foreground text-glow !mt-2">OD Automator</CardDescription>
              <p className="text-muted-foreground font-body mt-4">
                Streamline your On-Duty requests with our intelligent AI-powered form. You can configure timetables in the settings.
              </p>
            </CardHeader>
            <CardContent className="mt-6">
               <Link href="/dashboard" passHref>
                  <Button type="submit" size="lg" className="w-full transition-all duration-300 hover:scale-105 hover:shadow-neon-primary !font-bold !text-lg">
                    Go to Dashboard
                  </Button>
                </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
