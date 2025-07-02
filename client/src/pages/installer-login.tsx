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

  const [pendingApproval, setPendingApproval] = useState<{ 
    approvalStatus: string; 
    profileCompleted: boolean 
  } | null>(null);

  const loginMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/installers/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        if (response.status === 403) {
          // Account pending approval
          setPendingApproval({
            approvalStatus: responseData.approvalStatus,
            profileCompleted: responseData.profileCompleted
          });
          throw new Error("Account pending approval");
        }
        throw new Error(responseData.error || "Login failed");
      }
      
      return responseData;
    },
    onSuccess: (data: any) => {
      toast({
        title: "Login Successful",
        description: "Welcome back to your installer dashboard.",
      });
      // Store installer data in localStorage for session management
      localStorage.setItem("installer", JSON.stringify(data.installer));
      localStorage.setItem("installerId", data.installer.id.toString());
      setLocation(`/installer-dashboard/${data.installer.id}`);
    },
    onError: (error: any) => {
      if (error.message !== "Account pending approval") {
        toast({
          title: "Login Failed",
          description: error.message || "Please check your email and password.",
          variant: "destructive",
        });
      }
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

        {/* Approval Status Display */}
        {pendingApproval && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Lock className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-orange-900 mb-2">
                  Account Pending Approval
                </h3>
                <p className="text-sm text-orange-700 mb-4">
                  {!pendingApproval.profileCompleted 
                    ? "Please complete your profile first, then wait for admin approval to access the dashboard."
                    : "Your profile is complete. Please wait for admin approval to access the dashboard."
                  }
                </p>
                <div className="space-y-2">
                  {!pendingApproval.profileCompleted && (
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/installer-profile-setup">
                        Complete Profile
                      </Link>
                    </Button>
                  )}
                  <p className="text-xs text-orange-600">
                    Status: {pendingApproval.approvalStatus}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Registration Link */}
        <div className="text-center">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-green-800 text-sm font-medium mb-2">
              New to our platform?
            </p>
            <Button asChild variant="outline" className="w-full border-green-300 text-green-700 hover:bg-green-50">
              <Link href="/installer-registration">
                Create New Installer Account
              </Link>
            </Button>
            <p className="text-green-600 text-xs mt-2">
              Create account → Complete profile → Wait for admin approval
            </p>
          </div>
        </div>

        {/* Demo Access */}
        <div className="text-center">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-gray-600 text-sm">
              <strong>Demo Access:</strong> Use email "test@tradesbook.ie" with password "demo123" to explore the installer dashboard
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}