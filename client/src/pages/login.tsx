import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface MockCredentials {
  installer: { email: string; password: string; name: string };
  client: { email: string; password: string; name: string };
  admin: { email: string; password: string; name: string };
}

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [mockCredentials, setMockCredentials] = useState<MockCredentials | null>(null);
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: ""
  });

  useEffect(() => {
    // Fetch mock credentials for testing
    fetch("/api/auth/mock-credentials")
      .then(res => res.json())
      .then(data => setMockCredentials(data))
      .catch(err => console.error("Failed to load mock credentials:", err));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(loginForm)
      });

      if (response.success) {
        // Store user data and token in localStorage for testing
        localStorage.setItem("auth_token", response.token);
        localStorage.setItem("user_data", JSON.stringify(response.user));

        toast({
          title: "Login Successful",
          description: `Welcome back, ${response.user.name}!`,
        });

        // Redirect based on user role
        if (response.user.role === "installer") {
          setLocation("/installer-dashboard");
        } else if (response.user.role === "admin") {
          setLocation("/admin-dashboard");
        } else {
          setLocation("/customer-dashboard");
        }
      }
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = (role: "installer" | "client" | "admin") => {
    if (!mockCredentials) return;
    
    const credentials = mockCredentials[role];
    setLoginForm({
      email: credentials.email,
      password: credentials.password
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">SmartTVMount</CardTitle>
          <CardDescription>
            Sign in to access your dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={loginForm.email}
                onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={loginForm.password}
                onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          {mockCredentials && (
            <div className="mt-8 pt-6 border-t">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                Demo Accounts (Testing Only)
              </h3>
              <Tabs defaultValue="installer" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="installer">Installer</TabsTrigger>
                  <TabsTrigger value="client">Client</TabsTrigger>
                  <TabsTrigger value="admin">Admin</TabsTrigger>
                </TabsList>
                
                <TabsContent value="installer" className="space-y-2">
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    <p><strong>Email:</strong> {mockCredentials.installer.email}</p>
                    <p><strong>Password:</strong> {mockCredentials.installer.password}</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => quickLogin("installer")}
                  >
                    Quick Login as Installer
                  </Button>
                </TabsContent>
                
                <TabsContent value="client" className="space-y-2">
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    <p><strong>Email:</strong> {mockCredentials.client.email}</p>
                    <p><strong>Password:</strong> {mockCredentials.client.password}</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => quickLogin("client")}
                  >
                    Quick Login as Client
                  </Button>
                </TabsContent>
                
                <TabsContent value="admin" className="space-y-2">
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    <p><strong>Email:</strong> {mockCredentials.admin.email}</p>
                    <p><strong>Password:</strong> {mockCredentials.admin.password}</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => quickLogin("admin")}
                  >
                    Quick Login as Admin
                  </Button>
                </TabsContent>
              </Tabs>
            </div>
          )}

          <div className="mt-6 text-center">
            <Button 
              variant="link" 
              onClick={() => setLocation("/")}
              className="text-sm"
            >
              Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}