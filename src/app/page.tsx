
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { User, KeyRound } from 'lucide-react';

const AmityLogoPlaceholder = () => (
  <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 text-primary ring-4 ring-primary/20">
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-graduation-cap h-8 w-8"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.084a1 1 0 0 0 0 1.838l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 6 0 0 0 12 0v-3.5"/></svg>
  </div>
);

export default function AuthPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [isInvalid, setIsInvalid] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  const correctUserId = process.env.NEXT_PUBLIC_ADMIN_USER_ID || 'admin';
  const correctPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'password';

  const handleInputChange = (id: string, pass: string) => {
    setUserId(id);
    setPassword(pass);

    const isUserIdIncorrect = id.length > 0 && correctUserId.indexOf(id) !== 0;
    const isPasswordIncorrect = pass.length > 0 && correctPassword.indexOf(pass) !== 0;

    if (id.length > correctUserId.length || pass.length > correctPassword.length || isUserIdIncorrect || isPasswordIncorrect) {
      setIsInvalid(true);
      setPosition({
        x: Math.random() * 150 - 75,
        y: Math.random() * 50 - 25
      });
    } else {
      setIsInvalid(false);
      setPosition({ x: 0, y: 0 });
    }
  };

  const handleSignIn = () => {
    if (userId === correctUserId && password === correctPassword) {
      toast({
        title: 'Sign In Successful',
        description: 'Welcome to OD Automator!',
      });
      router.push('/dashboard');
    } else {
      toast({
        variant: 'destructive',
        title: 'Sign In Failed',
        description: 'Invalid User ID or Password.',
      });
      setIsInvalid(true);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isInvalid) {
      handleSignIn();
    }
  };

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
                Streamline your On-Duty requests with our intelligent AI-powered form.
              </p>
            </CardHeader>
            <CardContent className="mt-6">
              <form onSubmit={handleFormSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="userId" className="flex items-center text-muted-foreground"><User className="w-4 h-4 mr-2"/>User ID</Label>
                  <Input id="userId" type="text" placeholder="Enter your User ID" value={userId} onChange={(e) => handleInputChange(e.target.value, password)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center text-muted-foreground"><KeyRound className="w-4 h-4 mr-2"/>Password / Code</Label>
                  <Input id="password" type="password" placeholder="Enter your password or code" value={password} onChange={(e) => handleInputChange(userId, e.target.value)} />
                </div>
                 <div className="h-12">
                   <div
                    className="relative transition-all duration-200"
                    style={{
                      transform: `translate(${position.x}px, ${position.y}px)`
                    }}
                  >
                    <Button type="submit" size="lg" className="w-full transition-all duration-300 hover:scale-105 hover:shadow-neon-primary !font-bold !text-lg" disabled={isInvalid}>
                      Sign In
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
