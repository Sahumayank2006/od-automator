
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { KeyRound, ShieldCheck } from 'lucide-react';

interface PasscodeGateProps {
  children: React.ReactNode;
}

export function PasscodeGate({ children }: PasscodeGateProps) {
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState('');

  const correctPasscode = process.env.NEXT_PUBLIC_FACULTY_PASSCODE || '123456';

  useEffect(() => {
    const sessionAuth = sessionStorage.getItem('facultyAuthenticated');
    if (sessionAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = () => {
    if (passcode === correctPasscode) {
      sessionStorage.setItem('facultyAuthenticated', 'true');
      setIsAuthenticated(true);
      toast({
        title: 'Access Granted',
        description: 'Welcome, Faculty Coordinator.',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Access Denied',
        description: 'The passcode you entered is incorrect.',
      });
    }
  };
  
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLogin();
  };

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
      <div className="w-full max-w-md">
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-2xl blur-lg opacity-25"></div>
          <Card className="relative bg-secondary/20 backdrop-blur-lg border border-white/10">
            <CardHeader className="text-center">
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 text-primary ring-4 ring-primary/20">
                    <ShieldCheck className="h-8 w-8" />
                </div>
              <CardTitle className="text-xl font-headline font-bold uppercase tracking-widest text-primary text-glow">Faculty Access</CardTitle>
              <CardDescription className="text-muted-foreground font-body mt-2">
                Please enter the 6-digit passcode to manage OD requests.
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-6">
              <form onSubmit={handleFormSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="passcode" className="flex items-center text-muted-foreground"><KeyRound className="w-4 h-4 mr-2"/>Passcode</Label>
                  <Input 
                    id="passcode" 
                    type="password" 
                    placeholder="Enter 6-digit passcode" 
                    value={passcode} 
                    onChange={(e) => setPasscode(e.target.value)} 
                    maxLength={6}
                  />
                </div>
                 <div className="h-12">
                    <Button type="submit" size="lg" className="w-full transition-all duration-300 hover:scale-105 hover:shadow-neon-primary !font-bold !text-lg">
                      Authenticate
                    </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
