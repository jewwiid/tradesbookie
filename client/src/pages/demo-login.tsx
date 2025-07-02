import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';

export default function DemoLogin() {
  const [email, setEmail] = useState('demo@tradesbook.ie');
  const [password, setPassword] = useState('3UBg3nXAFLM48hQ>');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleDemoLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/demo-login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Demo Login Successful',
          description: `Welcome ${data.user.firstName}! You can now test booking creation.`,
        });
        
        // Redirect to booking page
        setLocation('/booking');
      } else {
        toast({
          title: 'Login Failed',
          description: data.error || 'Invalid credentials',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Demo login error:', error);
      toast({
        title: 'Login Error',
        description: 'Failed to authenticate demo user',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Demo User Login</CardTitle>
          <CardDescription>
            Login as demo user to test booking creation functionality
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleDemoLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="demo@tradesbook.ie"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter demo password"
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Login as Demo User'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p className="mb-2">Demo Credentials:</p>
            <p className="font-mono text-xs bg-gray-100 p-2 rounded">
              Email: demo@tradesbook.ie<br />
              Password: 3UBg3nXAFLM48hQ&gt;
            </p>
          </div>

          <div className="mt-4 text-center">
            <Button 
              variant="outline" 
              onClick={() => setLocation('/')}
              className="text-sm"
            >
              ← Back to Homepage
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}