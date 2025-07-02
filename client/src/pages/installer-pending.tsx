import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, XCircle, AlertCircle, Mail, Phone, MapPin, User, Building, FileText } from "lucide-react";
import { useLocation } from "wouter";

interface InstallerProfile {
  id: number;
  email: string;
  contactName: string;
  businessName: string;
  phone: string;
  address: string;
  county: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  adminComments?: string;
  profileCompleted: boolean;
  createdAt: string;
}

export default function InstallerPending() {
  const [, setLocation] = useLocation();
  const [profile, setProfile] = useState<InstallerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      // First check authentication status
      const authResponse = await fetch('/api/installer/auth/status', {
        credentials: 'include'
      });
      
      if (!authResponse.ok) {
        console.log('Not authenticated, redirecting to login');
        setLocation('/installer-login');
        return;
      }

      const authData = await authResponse.json();
      if (!authData.authenticated) {
        console.log('Authentication failed, redirecting to login');
        setLocation('/installer-login');
        return;
      }

      // If authenticated, get full profile
      const response = await fetch('/api/installer/profile', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      } else if (response.status === 401) {
        setLocation('/installer-login');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setLocation('/installer-login');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="border-yellow-300 text-yellow-700 bg-yellow-50">Pending Review</Badge>;
      case 'approved':
        return <Badge variant="outline" className="border-green-300 text-green-700 bg-green-50">Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="border-red-300 text-red-700 bg-red-50">Not Approved</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          title: "Application Under Review",
          message: "Your installer application is currently being reviewed by our admin team. This process typically takes 24-48 hours.",
          action: "Please wait for admin approval before accessing your dashboard."
        };
      case 'approved':
        return {
          title: "Welcome to tradesbook.ie!",
          message: "Congratulations! Your installer application has been approved. You can now access your dashboard and start receiving leads.",
          action: "Click below to access your installer dashboard."
        };
      case 'rejected':
        return {
          title: "Application Not Approved",
          message: "Unfortunately, your application was not approved at this time. Please review the feedback below and consider reapplying in the future.",
          action: "You may create a new application with updated information if circumstances change."
        };
      default:
        return {
          title: "Application Status Unknown",
          message: "We're unable to determine your application status. Please contact support.",
          action: "Contact our support team for assistance."
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-32"></div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Profile Not Found</h2>
            <p className="text-gray-600 mb-4">Unable to load your installer profile.</p>
            <Button onClick={() => setLocation('/installer-login')} className="w-full">
              Return to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusInfo = getStatusMessage(profile.approvalStatus);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Installer Application Status</h1>
            <p className="text-gray-600">Track your application progress and next steps</p>
          </div>

          {/* Status Overview */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  {getStatusIcon(profile.approvalStatus)}
                  <span>{statusInfo.title}</span>
                </CardTitle>
                {getStatusBadge(profile.approvalStatus)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-700">{statusInfo.message}</p>
                <p className="text-sm text-gray-600">{statusInfo.action}</p>
                
                {profile.adminComments && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                      <FileText className="w-4 h-4 mr-2" />
                      Admin Feedback
                    </h4>
                    <p className="text-gray-700 italic">"{profile.adminComments}"</p>
                  </div>
                )}

                {profile.approvalStatus === 'approved' && (
                  <div className="pt-4">
                    <Button 
                      onClick={() => setLocation('/installer-dashboard')} 
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      Access Installer Dashboard
                    </Button>
                  </div>
                )}

                {profile.approvalStatus === 'pending' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">What Happens Next?</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Our admin team will review your application details</li>
                      <li>• You'll receive an email notification with the decision</li>
                      <li>• If approved, you'll get immediate access to your dashboard</li>
                      <li>• If not approved, you'll receive feedback for future applications</li>
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Profile Information */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Your Application Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Building className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-900">{profile.businessName}</p>
                      <p className="text-sm text-gray-600">Business Name</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <User className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-900">{profile.contactName}</p>
                      <p className="text-sm text-gray-600">Contact Person</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-900">{profile.email}</p>
                      <p className="text-sm text-gray-600">Email Address</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-900">{profile.phone}</p>
                      <p className="text-sm text-gray-600">Phone Number</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-900">{profile.address}</p>
                      <p className="text-sm text-gray-600">Service Address</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-900">{profile.county}</p>
                      <p className="text-sm text-gray-600">County</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Application Submitted</span>
                  <span>{new Date(profile.createdAt).toLocaleDateString('en-IE', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4">
            <Button 
              variant="outline" 
              onClick={() => setLocation('/installer-login')}
            >
              Return to Login
            </Button>
            
            {profile.approvalStatus === 'rejected' && (
              <Button 
                variant="default" 
                onClick={() => setLocation('/installer-registration')}
              >
                Create New Application
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}