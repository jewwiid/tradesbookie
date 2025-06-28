import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function VerifyEmail() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) {
      setVerificationStatus('error');
      setMessage('Invalid verification link. Please check your email for the correct link.');
      return;
    }

    // Verify the email token
    fetch(`/api/auth/verify-email?token=${token}`)
      .then(response => response.json())
      .then(data => {
        if (data.message && !data.message.includes('failed') && !data.message.includes('Invalid') && !data.message.includes('expired')) {
          setVerificationStatus('success');
          setMessage(data.message);
          toast({
            title: "Email verified successfully!",
            description: "You can now access all features with unlimited AI previews.",
          });
        } else {
          setVerificationStatus('error');
          setMessage(data.message || 'Email verification failed');
        }
      })
      .catch(error => {
        console.error('Error verifying email:', error);
        setVerificationStatus('error');
        setMessage('Email verification failed. Please try again.');
      });
  }, [toast]);

  const handleContinue = () => {
    if (verificationStatus === 'success') {
      setLocation('/');
    } else {
      setLocation('/');
    }
  };

  const handleResendEmail = () => {
    // This would need user email - for now redirect to sign in
    setLocation('/api/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-16">
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              {verificationStatus === 'loading' && (
                <Loader2 className="h-12 w-12 text-indigo-600 animate-spin" />
              )}
              {verificationStatus === 'success' && (
                <CheckCircle className="h-12 w-12 text-green-600" />
              )}
              {verificationStatus === 'error' && (
                <XCircle className="h-12 w-12 text-red-600" />
              )}
            </div>
            
            <CardTitle className="text-2xl font-bold">
              {verificationStatus === 'loading' && 'Verifying Email...'}
              {verificationStatus === 'success' && 'Email Verified!'}
              {verificationStatus === 'error' && 'Verification Failed'}
            </CardTitle>
            
            <CardDescription className="text-center">
              {verificationStatus === 'loading' && 'Please wait while we verify your email address.'}
              {verificationStatus === 'success' && 'Your email has been successfully verified. You now have full access to tradesbook.ie.'}
              {verificationStatus === 'error' && 'There was a problem verifying your email address.'}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {message && (
              <div className={`p-4 rounded-lg ${
                verificationStatus === 'success' 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : verificationStatus === 'error'
                  ? 'bg-red-50 text-red-800 border border-red-200'
                  : 'bg-blue-50 text-blue-800 border border-blue-200'
              }`}>
                <p className="text-sm">{message}</p>
              </div>
            )}

            {verificationStatus === 'success' && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className="font-medium text-green-800 mb-2">What's now available:</h3>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>✅ Unlimited AI room visualizations</li>
                  <li>✅ Complete booking and payment process</li>
                  <li>✅ Booking history & QR tracking</li>
                  <li>✅ Priority customer support</li>
                  <li>✅ Exclusive discounts & referral rewards</li>
                </ul>
              </div>
            )}
            
            <div className="flex flex-col space-y-3">
              <Button onClick={handleContinue} className="w-full">
                {verificationStatus === 'success' ? 'Continue to tradesbook.ie' : 'Return to Home'}
              </Button>
              
              {verificationStatus === 'error' && (
                <Button variant="outline" onClick={handleResendEmail} className="w-full">
                  <Mail className="w-4 h-4 mr-2" />
                  Sign In to Resend Verification
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}