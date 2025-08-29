import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/navigation";
import Footer from "@/components/Footer";
import InstallerWalletDashboard from "@/components/installer/InstallerWalletDashboard";
import PastLeadsManagement from "@/components/installer/PastLeadsManagement";
import InstallerReviews from "@/components/installer/InstallerReviews";

import { 
  Hammer, 
  Star,
  MapPin,
  Clock,
  CheckCircle,
  User,
  LogOut,
  Zap,
  AlertCircle,
  DollarSign,
  Settings,
  Tv,
  Calendar,
  Wrench,
  Euro
} from "lucide-react";

interface InstallerStats {
  monthlyJobs: number;
  earnings: number;
  rating: number;
  activeRequests: number;
}

interface ClientRequest {
  id: number;
  address: string;
  serviceType: string;
  tvSize: string;
  wallType: string;
  mountType: string;
  addons: string[];
  estimatedTotal: string;
  leadFee: number;
  estimatedEarnings: number;
  profitMargin: number;
  status: 'pending' | 'urgent' | 'emergency' | 'accepted' | 'in_progress' | 'completed' | 'open' | 'confirmed';
  scheduledDate?: string;
  createdAt: string;
  qrCode: string;
  notes?: string;
  difficulty: string;
  distance?: number;
  customerName?: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  customerNotes?: string;
  totalPrice?: string;
  preferredDate?: string;
  preferredTime?: string;
  tvInstallations?: any[];
  tvQuantity?: number;
}

export default function InstallerDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<ClientRequest | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Get current installer profile
  const { data: installerProfile, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: ["/api/installers/profile"],
    retry: false
  });

  // Check authentication and redirect if needed
  useEffect(() => {
    if (profileError && !profileLoading) {
      // Redirect to login if not authenticated
      window.location.href = '/installer-login';
      return;
    }
  }, [profileError, profileLoading]);

  // Fetch installer stats
  const { data: stats, isLoading: statsLoading } = useQuery<InstallerStats>({
    queryKey: [`/api/installer/${installerProfile?.id}/stats`],
    enabled: !!installerProfile?.id,
  });

  // Fetch available leads
  const { data: requests = [], isLoading: requestsLoading } = useQuery<ClientRequest[]>({
    queryKey: ['/api/installers'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch installer's active bookings
  const { data: activeBookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: [`/api/installer/bookings`],
    enabled: !!installerProfile?.id,
    refetchInterval: 30000,
  });

  // Handle logout
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      window.location.href = '/installer-login';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
              </div>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h1 className="text-xl font-bold text-red-600 mb-2">Authentication Required</h1>
              <p className="text-gray-600 mb-4">Please log in to access your installer dashboard.</p>
              <Button onClick={() => window.location.href = '/installer-login'}>
                Go to Login
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  const installerId = installerProfile?.id;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {installerProfile?.businessName || installerProfile?.name}
            </h1>
            <p className="text-gray-600 mt-1">Manage your installation jobs and grow your business</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">This Month</p>
                    <p className="text-2xl font-bold">{stats.monthlyJobs}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Euro className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Earnings</p>
                    <p className="text-2xl font-bold">€{stats.earnings}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  <div>
                    <p className="text-sm text-gray-600">Rating</p>
                    <p className="text-2xl font-bold">{stats.rating}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Zap className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="text-sm text-gray-600">Active Leads</p>
                    <p className="text-2xl font-bold">{stats.activeRequests}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="jobs">Active Jobs</TabsTrigger>
            <TabsTrigger value="leads">Available Leads</TabsTrigger>
            <TabsTrigger value="wallet">Wallet</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Dashboard Overview</CardTitle>
                <CardDescription>Your installer dashboard is working correctly</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                      <div>
                        <h3 className="font-semibold text-green-800">Dashboard Active</h3>
                        <p className="text-sm text-green-600">Your installer dashboard is now working properly</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">Active Jobs</h4>
                      <p className="text-2xl font-bold text-blue-600">{activeBookings.length}</p>
                      <p className="text-sm text-gray-600">Jobs requiring attention</p>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">Available Leads</h4>
                      <p className="text-2xl font-bold text-green-600">{requests.length}</p>
                      <p className="text-sm text-gray-600">New opportunities</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="jobs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Wrench className="w-5 h-5" />
                  <span>Active Jobs ({activeBookings.length})</span>
                </CardTitle>
                <CardDescription>Manage your current installations</CardDescription>
              </CardHeader>
              <CardContent>
                {bookingsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-pulse space-y-4">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                    </div>
                  </div>
                ) : activeBookings.length > 0 ? (
                  <div className="space-y-4">
                    {activeBookings.map((booking: any) => (
                      <div key={booking.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">{booking.customerName || booking.contactName}</h3>
                          <Badge>{booking.status}</Badge>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4" />
                            <span>{booking.address}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Tv className="w-4 h-4" />
                            <span>{booking.tvSize}" {booking.serviceType}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Euro className="w-4 h-4" />
                            <span>€{booking.estimatedTotal}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Wrench className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p>No active jobs</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="leads" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5" />
                  <span>Available Leads ({requests.length})</span>
                </CardTitle>
                <CardDescription>Browse and purchase new leads</CardDescription>
              </CardHeader>
              <CardContent>
                {requestsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-pulse space-y-4">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                    </div>
                  </div>
                ) : requests.length > 0 ? (
                  <div className="space-y-4">
                    {requests.map((request) => (
                      <div key={request.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">{request.address}</h3>
                          <Badge variant={request.status === 'urgent' ? 'destructive' : 'default'}>
                            {request.status}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <Tv className="w-4 h-4" />
                            <span>{request.tvSize}" {request.serviceType}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Euro className="w-4 h-4" />
                            <span>Lead Fee: €{request.leadFee}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <DollarSign className="w-4 h-4" />
                            <span>Potential Earnings: €{request.estimatedEarnings}</span>
                          </div>
                        </div>
                        <div className="mt-3">
                          <Button 
                            size="sm" 
                            onClick={() => setSelectedRequest(request)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <MapPin className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p>No leads available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="wallet" className="space-y-6">
            {installerProfile?.id && (
              <InstallerWalletDashboard installerId={installerProfile.id} />
            )}
          </TabsContent>
          
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Profile Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Business Name</label>
                      <p className="text-gray-900">{installerProfile?.businessName || 'Not set'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Email</label>
                      <p className="text-gray-900">{installerProfile?.email || 'Not set'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Phone</label>
                      <p className="text-gray-900">{installerProfile?.phone || 'Not set'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Service Area</label>
                      <p className="text-gray-900">{installerProfile?.serviceArea || 'Not set'}</p>
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <Button variant="outline" size="sm">
                      <Settings className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Selected Request Details Modal */}
        {selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Lead Details</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSelectedRequest(null)}
                  >
                    ×
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Address</label>
                    <p className="text-gray-900">{selectedRequest.address}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Service</label>
                    <p className="text-gray-900">{selectedRequest.tvSize}" {selectedRequest.serviceType}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Lead Fee</label>
                    <p className="text-green-600 font-semibold">€{selectedRequest.leadFee}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Potential Earnings</label>
                    <p className="text-green-600 font-semibold">€{selectedRequest.estimatedEarnings}</p>
                  </div>
                </div>
                
                {selectedRequest.notes && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Customer Notes</label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded">{selectedRequest.notes}</p>
                  </div>
                )}
                
                <div className="flex gap-3 pt-4">
                  <Button className="flex-1">
                    Purchase Lead - €{selectedRequest.leadFee}
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedRequest(null)}>
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
}