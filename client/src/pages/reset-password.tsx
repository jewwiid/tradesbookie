import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { passwordResetConfirmSchema, type PasswordResetConfirm } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, CheckCircle, AlertCircle, Lock } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function ResetPassword() {
  const [location] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Parse URL parameters
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const token = urlParams.get('token');
  const userType = urlParams.get('userType') as 'customer' | 'installer';

  const form = useForm<PasswordResetConfirm>({
    resolver: zodResolver(passwordResetConfirmSchema),
    defaultValues: {
      token: token || "",
      newPassword: "",
      confirmPassword: "",
      userType: userType || "customer"
    }
  });

  // Verify token validity
  const tokenQuery = useQuery({
    queryKey: ['verify-reset-token', token, userType],
    queryFn: async () => {
      if (!token || !userType) throw new Error('Missing token or user type');
      const response = await apiRequest('GET', `/api/password-reset/verify-token?token=${token}&userType=${userType}`);
      return response;
    },
    enabled: !!token && !!userType,
    retry: false
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: PasswordResetConfirm) => {
      const response = await apiRequest('POST', '/api/password-reset/confirm', data);
      return response;
    },
    onSuccess: () => {
      setSuccess(true);
    },
    onError: (error: any) => {
      console.error('Password reset error:', error);
    }
  });

  const onSubmit = (data: PasswordResetConfirm) => {
    resetPasswordMutation.mutate({
      ...data,
      token: token || "",
      userType: userType || "customer"
    });
  };

  // Show error state if token is invalid
  if (tokenQuery.isError || !token || !userType) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-red-800">Invalid Reset Link</CardTitle>
            <CardDescription className="text-red-600">
              This password reset link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {(tokenQuery.error as any)?.message || 'The reset link is invalid or has expired. Please request a new password reset.'}
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900">What you can do:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Request a new password reset</li>
                <li>• Check if you used the correct link</li>
                <li>• Contact support if you need help</li>
              </ul>
            </div>
            
            <div className="pt-4 border-t space-y-2">
              <Link href="/forgot-password">
                <Button className="w-full bg-red-600 hover:bg-red-700">
                  Request New Reset Link
                </Button>
              </Link>
              <Link href={userType === 'installer' ? '/installer-login' : '/'}>
                <Button variant="ghost" className="w-full">
                  Back to {userType === 'installer' ? 'Login' : 'Home'}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show success state
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-800">Password Reset Successful</CardTitle>
            <CardDescription className="text-green-600">
              Your password has been successfully reset.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                You can now log in with your new password.
              </AlertDescription>
            </Alert>
            
            <div className="pt-4 border-t">
              <Link href={userType === 'installer' ? '/installer-login' : '/'}>
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  Continue to {userType === 'installer' ? 'Installer Login' : 'Sign In'}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <Lock className="w-6 h-6 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">Create New Password</CardTitle>
          <CardDescription className="text-gray-600">
            Enter your new password below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tokenQuery.isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            </div>
          )}

          {tokenQuery.isSuccess && (
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    {...form.register("newPassword")}
                    className="w-full pr-12"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </Button>
                </div>
                {form.formState.errors.newPassword && (
                  <p className="text-sm text-red-600">{form.formState.errors.newPassword.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    {...form.register("confirmPassword")}
                    className="w-full pr-12"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </Button>
                </div>
                {form.formState.errors.confirmPassword && (
                  <p className="text-sm text-red-600">{form.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              <div className="text-sm text-gray-600">
                <p className="font-medium">Password requirements:</p>
                <ul className="mt-1 space-y-1">
                  <li>• At least 8 characters long</li>
                  <li>• Must match confirmation password</li>
                </ul>
              </div>

              {resetPasswordMutation.error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {(resetPasswordMutation.error as any)?.message || 'An error occurred while resetting your password'}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700"
                disabled={resetPasswordMutation.isPending}
              >
                {resetPasswordMutation.isPending ? 'Resetting...' : 'Reset Password'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}