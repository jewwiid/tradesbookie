import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Wrench, ArrowLeft, User, Lock } from "lucide-react";

export default function InstallerLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const loginMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/installers/login", "POST", data);
    },
    onSuccess: (data: any) => {
      toast({
        title: "Login Successful",
        description: "Welcome back to your installer dashboard.",
      });
      // Store installer ID in localStorage for session management
      localStorage.setItem("installerId", data.installer.id.toString());
      setLocation(`/installer-dashboard/${data.installer.id}`);
    },
    onError: (error) => {
      toast({
        title: "Login Failed",
        description: "Please check your email and password.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center text-primary hover:text-primary/80 mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-6">
            <Wrench className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Installer Login
          </h2>
          <p className="text-gray-600">
            Access your dashboard to manage bookings and track progress
          </p>
        </div>

        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Sign In to Your Account</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email" className="flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="installer@example.com"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="password" className="flex items-center">
                  <Lock className="w-4 h-4 mr-2" />
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="••••••••"
                  className="mt-1"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Signing In..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* OAuth Authentication */}
        <div className="text-center mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">OAuth Authentication</h3>
            <p className="text-blue-800 text-sm mb-3">
              Use your existing account from Google, GitHub, or other providers
            </p>
            <div className="space-y-2">
              <Button 
                onClick={() => {
                  console.log("Initiating OAuth login for installer role");
                  window.location.href = '/api/login?role=installer';
                }}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Sign In as Installer
              </Button>
              <Button 
                onClick={() => {
                  console.log("Initiating OAuth signup for installer role");
                  window.location.href = '/api/signup?role=installer';
                }}
                variant="outline"
                className="w-full border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                Sign Up as New Installer
              </Button>
            </div>
          </div>
        </div>

        {/* Registration Link */}
        <div className="text-center">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-green-800 text-sm font-medium mb-1">
              New Installer Registration Flow:
            </p>
            <p className="text-green-700 text-xs mb-2">
              1. Click "Sign Up as New Installer" above → 2. Complete OAuth signup → 3. Verify email → 4. Complete installer profile
            </p>
            <p className="text-gray-600 text-xs">
              Alternative:{" "}
              <Link href="/installer-registration" className="text-primary hover:text-primary/80 font-medium">
                Complete manual application form
              </Link>
            </p>
          </div>
        </div>

        {/* Demo Access */}
        <div className="text-center">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 text-sm">
              <strong>Demo Access:</strong> Use any email with password "demo123" to explore the installer dashboard
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}