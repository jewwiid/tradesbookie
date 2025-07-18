import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { passwordResetRequestSchema, type PasswordResetRequest } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function ForgotPassword() {
  const [success, setSuccess] = useState(false);
  const [userType, setUserType] = useState<'customer' | 'installer'>('customer');

  const form = useForm<PasswordResetRequest>({
    resolver: zodResolver(passwordResetRequestSchema),
    defaultValues: {
      email: "",
      userType: "customer"
    }
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: PasswordResetRequest) => {
      const response = await apiRequest('POST', '/api/password-reset/request', data);
      return response;
    },
    onSuccess: () => {
      setSuccess(true);
    },
    onError: (error: any) => {
      console.error('Password reset error:', error);
    }
  });

  const onSubmit = (data: PasswordResetRequest) => {
    resetPasswordMutation.mutate({
      ...data,
      userType
    });
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-800">Check Your Email</CardTitle>
            <CardDescription className="text-green-600">
              Password reset instructions have been sent to your email address.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-green-200 bg-green-50">
              <Mail className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                If an account with this email exists, you will receive a password reset link shortly.
                Check your spam folder if you don't see it in your inbox.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900">Next Steps:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Check your email for the reset link</li>
                <li>• The link will expire in 1 hour</li>
                <li>• Use the link to set a new password</li>
                <li>• Contact support if you need help</li>
              </ul>
            </div>
            
            <div className="pt-4 border-t">
              <Link href={userType === 'installer' ? '/installer-login' : '/'}>
                <Button variant="ghost" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to {userType === 'installer' ? 'Installer Login' : 'Home'}
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
            <Mail className="w-6 h-6 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">Reset Password</CardTitle>
          <CardDescription className="text-gray-600">
            Enter your email address and we'll send you a link to reset your password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userType">Account Type</Label>
              <Select value={userType} onValueChange={(value: 'customer' | 'installer') => setUserType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">Customer Account</SelectItem>
                  <SelectItem value="installer">Installer Account</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email address"
                {...form.register("email")}
                className="w-full"
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
              )}
            </div>

            {resetPasswordMutation.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {(resetPasswordMutation.error as any)?.message || 'An error occurred while requesting password reset'}
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700"
              disabled={resetPasswordMutation.isPending}
            >
              {resetPasswordMutation.isPending ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t text-center">
            <p className="text-sm text-gray-600">
              Remember your password?{' '}
              <Link href={userType === 'installer' ? '/installer-login' : '/'} className="text-red-600 hover:text-red-700 font-medium">
                {userType === 'installer' ? 'Back to Login' : 'Sign In'}
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}