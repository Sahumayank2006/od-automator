'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const AmityLogoPlaceholder = () => (
  <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 text-primary ring-4 ring-primary/20">
    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
  </div>
);

export default function AuthPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md">
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-2xl blur-lg opacity-25"></div>
          <Card className="relative glass-panel">
            <CardHeader className="text-center">
              <AmityLogoPlaceholder />
              <CardTitle className="text-3xl font-headline text-foreground text-glow">AMITY UNIVERSITY</CardTitle>
              <CardDescription className="text-muted-foreground font-body">OD Nimbus Automator</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email">College ID/Email</Label>
                  <Input id="email" type="email" placeholder="College ID/Email" required className="transition-all duration-300 focus:shadow-neon-primary focus:scale-105" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Code/Password</Label>
                  <Input id="password" type="password" placeholder="Code/Password" required className="transition-all duration-300 focus:shadow-neon-primary focus:scale-105" />
                </div>
                <Link href="/dashboard" passHref>
                  <Button type="submit" className="w-full transition-transform duration-300 hover:scale-105 hover:shadow-neon-primary">
                    Sign In
                  </Button>
                </Link>
              </div>
              <div className="mt-4 text-center">
                 <Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Forgot Password?
                 </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
