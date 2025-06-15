import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Settings, 
  Home, 
  Calendar, 
  TrendingUp, 
  Euro, 
  Percent,
  Users,
  Loader2,
  Save,
  BarChart3,
  Shield,
  Activity,
  Database,
  Eye,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  MapPin,
  Star,
  Clock,
  DollarSign,
  AlertTriangle
} from "lucide-react";

interface AdminStats {
  totalBookings: number;
  monthlyBookings: number;
  revenue: number;
  appFees: number;
  totalUsers: number;
  totalInstallers: number;
  activeBookings: number;
  completedBookings: number;
  avgBookingValue: number;
  topServiceType: string;
  totalPayments: number;
  successfulPayments: number;
  pendingPayments: number;
  failedPayments: number;
  totalPaidAmount: number;
}

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  createdAt: string;
  lastLogin?: string;
  bookingCount: number;
  totalSpent: number;
}

interface Installer {
  id: number;
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  address?: string;
  serviceArea?: string;
  isActive: boolean;
  createdAt: string;
  completedJobs: number;
  rating: number;
  totalEarnings: number;
}

interface Booking {
  id: number;
  qrCode: string;
  tvSize: string;
  serviceType: string;
  totalPrice: string;
  appFee: string;
  status: string;
  preferredDate?: string;
  address: string;
  userId?: string;
  installerId?: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  createdAt: string;
  paymentIntentId?: string;
  paymentStatus?: string;
  paidAmount?: string;
  paymentDate?: string;
}

interface SystemMetrics {
  uptime: string;
  activeUsers: number;
  dailySignups: number;
  errorRate: number;
  averageResponseTime: number;
}

// Dashboard Overview Component
function DashboardOverview({ stats }: { stats: AdminStats | undefined }) {
  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-6 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const metrics = [
    { label: "Total Bookings", value: stats.totalBookings, icon: Calendar, color: "text-blue-600" },
    { label: "Monthly Bookings", value: stats.monthlyBookings, icon: TrendingUp, color: "text-green-600" },
    { label: "Total Revenue", value: `€${stats.revenue}`, icon: Euro, color: "text-emerald-600" },
    { label: "App Fees", value: `€${stats.appFees}`, icon: DollarSign, color: "text-purple-600" },
    { label: "Successful Payments", value: stats.successfulPayments || 0, icon: UserCheck, color: "text-green-600" },
    { label: "Pending Payments", value: stats.pendingPayments || 0, icon: Clock, color: "text-yellow-600" },
    { label: "Total Paid", value: `€${stats.totalPaidAmount || 0}`, icon: Euro, color: "text-emerald-600" },
    { label: "Failed Payments", value: stats.failedPayments || 0, icon: AlertTriangle, color: "text-red-600" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
      {metrics.map((metric, index) => (
        <Card key={index}>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">{metric.label}</p>
                <p className="text-xl sm:text-3xl font-bold text-gray-900">{metric.value}</p>
              </div>
              <metric.icon className={`h-6 w-6 sm:h-8 sm:w-8 ${metric.color}`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// User Management Component
function UserManagement() {
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    retry: false,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest(`/api/admin/users/${userId}`, "DELETE");
    },
    onSuccess: () => {
      toast({ title: "User deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: () => {
      toast({ title: "Failed to delete user", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="w-5 h-5 mr-2" />
          User Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Bookings</TableHead>
              <TableHead>Total Spent</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    {user.profileImageUrl && (
                      <img 
                        src={user.profileImageUrl} 
                        alt="Profile" 
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                    <span className="font-medium">
                      {user.firstName ? `${user.firstName} ${user.lastName}` : 'Anonymous User'}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>{user.bookingCount}</TableCell>
                <TableCell>€{user.totalSpent}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => deleteUserMutation.mutate(user.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// Installer Management Component
function InstallerManagement() {
  const { data: installers, isLoading } = useQuery<Installer[]>({
    queryKey: ["/api/admin/installers"],
    retry: false,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const toggleInstallerStatusMutation = useMutation({
    mutationFn: async ({ installerId, isActive }: { installerId: number; isActive: boolean }) => {
      await apiRequest(`/api/admin/installers/${installerId}/status`, "PATCH", { isActive });
    },
    onSuccess: () => {
      toast({ title: "Installer status updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/installers"] });
    },
    onError: () => {
      toast({ title: "Failed to update installer status", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Shield className="w-5 h-5 mr-2" />
          Installer Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Business</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Area</TableHead>
              <TableHead>Jobs</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Earnings</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {installers?.map((installer) => (
              <TableRow key={installer.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{installer.businessName}</div>
                    <div className="text-sm text-gray-500">{installer.contactName}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="text-sm">{installer.email}</div>
                    <div className="text-sm text-gray-500">{installer.phone}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                    {installer.serviceArea || 'Not specified'}
                  </div>
                </TableCell>
                <TableCell>{installer.completedJobs}</TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <Star className="w-4 h-4 mr-1 text-yellow-500" />
                    {installer.rating.toFixed(1)}
                  </div>
                </TableCell>
                <TableCell>€{installer.totalEarnings}</TableCell>
                <TableCell>
                  <Badge variant={installer.isActive ? "default" : "secondary"}>
                    {installer.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleInstallerStatusMutation.mutate({
                        installerId: installer.id,
                        isActive: !installer.isActive
                      })}
                    >
                      {installer.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                    </Button>
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// Booking Management Component
function BookingManagement() {
  const { data: bookings, isLoading } = useQuery<Booking[]>({
    queryKey: ["/api/admin/bookings"],
    retry: false,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateBookingStatusMutation = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: number; status: string }) => {
      await apiRequest(`/api/admin/bookings/${bookingId}/status`, "PATCH", { status });
    },
    onSuccess: () => {
      toast({ title: "Booking status updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bookings"] });
    },
    onError: () => {
      toast({ title: "Failed to update booking status", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calendar className="w-5 h-5 mr-2" />
          Booking Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>QR Code</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings?.map((booking) => (
              <TableRow key={booking.id}>
                <TableCell className="font-mono text-sm">{booking.qrCode}</TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{booking.customerName || 'Guest User'}</div>
                    <div className="text-sm text-gray-500">{booking.customerEmail}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{booking.serviceType}</div>
                    <div className="text-sm text-gray-500">{booking.tvSize}"</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">€{booking.totalPrice}</div>
                    <div className="text-sm text-gray-500">Fee: €{booking.appFee}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1 text-gray-400" />
                    {booking.preferredDate ? new Date(booking.preferredDate).toLocaleDateString() : 'TBD'}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(booking.status)}>
                    {booking.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// System Metrics Component
function SystemMetrics() {
  const { data: metrics } = useQuery<SystemMetrics>({
    queryKey: ["/api/admin/system-metrics"],
    retry: false,
  });

  const systemCards = [
    { label: "System Uptime", value: metrics?.uptime || "Loading...", icon: Activity, color: "text-green-600" },
    { label: "Active Users", value: metrics?.activeUsers || 0, icon: Users, color: "text-blue-600" },
    { label: "Daily Signups", value: metrics?.dailySignups || 0, icon: TrendingUp, color: "text-purple-600" },
    { label: "Error Rate", value: `${metrics?.errorRate || 0}%`, icon: AlertTriangle, color: "text-red-600" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {systemCards.map((card, index) => (
        <Card key={index}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
              <card.icon className={`h-6 w-6 ${card.color}`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Payment Management Component
function PaymentManagement() {
  const { data: bookings, isLoading } = useQuery<Booking[]>({
    queryKey: ["/api/admin/bookings"],
    retry: false,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const paymentsWithStatus = bookings?.filter(b => b.paymentIntentId) || [];
  const successfulPayments = paymentsWithStatus.filter(b => b.paymentStatus === 'succeeded');
  const pendingPayments = paymentsWithStatus.filter(b => b.paymentStatus === 'pending' || b.paymentStatus === 'processing');
  const failedPayments = paymentsWithStatus.filter(b => b.paymentStatus === 'failed');

  const totalPaidAmount = successfulPayments.reduce((sum, b) => sum + parseFloat(b.paidAmount || '0'), 0);

  return (
    <div className="space-y-6">
      {/* Payment Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Successful</p>
                <p className="text-lg sm:text-2xl font-bold text-green-600">{successfulPayments.length}</p>
              </div>
              <UserCheck className="h-5 w-5 sm:h-8 sm:w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Pending</p>
                <p className="text-lg sm:text-2xl font-bold text-yellow-600">{pendingPayments.length}</p>
              </div>
              <Clock className="h-5 w-5 sm:h-8 sm:w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Failed</p>
                <p className="text-lg sm:text-2xl font-bold text-red-600">{failedPayments.length}</p>
              </div>
              <AlertTriangle className="h-5 w-5 sm:h-8 sm:w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Collected</p>
                <p className="text-lg sm:text-2xl font-bold text-emerald-600">€{totalPaidAmount.toFixed(2)}</p>
              </div>
              <Euro className="h-5 w-5 sm:h-8 sm:w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="w-5 h-5 mr-2" />
            Payment Transactions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2 sm:p-6">
          {/* Mobile Card View */}
          <div className="block md:hidden space-y-3">
            {paymentsWithStatus.map((booking) => (
              <div key={booking.id} className="bg-gray-50 p-3 rounded-lg border">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-medium">#{booking.id}</span>
                  <Badge 
                    variant={
                      booking.paymentStatus === 'succeeded' ? 'default' :
                      booking.paymentStatus === 'pending' || booking.paymentStatus === 'processing' ? 'secondary' :
                      'destructive'
                    }
                  >
                    {booking.paymentStatus || 'Unknown'}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Amount:</span>
                    <div className="font-medium">€{booking.paidAmount || booking.totalPrice}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Date:</span>
                    <div className="font-medium">
                      {booking.paymentDate ? new Date(booking.paymentDate).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-xs">
                  <span className="text-gray-500">Customer:</span>
                  <div className="font-medium truncate">{booking.customerEmail || 'N/A'}</div>
                </div>
                {booking.paymentIntentId && (
                  <div className="mt-2 text-xs">
                    <span className="text-gray-500">Payment ID:</span>
                    <div className="font-mono text-xs truncate">
                      {booking.paymentIntentId.substring(0, 30)}...
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking ID</TableHead>
                  <TableHead>Payment Intent</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment Date</TableHead>
                  <TableHead>Customer</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentsWithStatus.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">#{booking.id}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {booking.paymentIntentId?.substring(0, 20)}...
                    </TableCell>
                    <TableCell>€{booking.paidAmount || booking.totalPrice}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          booking.paymentStatus === 'succeeded' ? 'default' :
                          booking.paymentStatus === 'pending' || booking.paymentStatus === 'processing' ? 'secondary' :
                          'destructive'
                        }
                      >
                        {booking.paymentStatus || 'Unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {booking.paymentDate ? new Date(booking.paymentDate).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell>{booking.customerEmail || 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {paymentsWithStatus.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No payment transactions found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Fee Management Component  
function FeeManagement() {
  const [feeStructures, setFeeStructures] = useState({
    'table-top-small': 15,
    'table-top-large': 15,
    'bronze': 15,
    'silver': 15,
    'silver-large': 15,
    'gold': 20,
    'platinum': 25
  });

  const { toast } = useToast();

  const handleFeeUpdate = (serviceType: string, newFee: number) => {
    setFeeStructures(prev => ({
      ...prev,
      [serviceType]: newFee
    }));
    toast({ title: "Fee structure updated" });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Percent className="w-5 h-5 mr-2" />
          Fee Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(feeStructures).map(([serviceType, fee]) => (
            <div key={serviceType} className="space-y-2">
              <Label className="text-sm font-medium capitalize">
                {serviceType.replace('-', ' ')} Commission (%)
              </Label>
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  value={fee}
                  onChange={(e) => handleFeeUpdate(serviceType, parseInt(e.target.value))}
                  className="w-20"
                  min="5"
                  max="50"
                />
                <span className="text-sm text-gray-500">%</span>
              </div>
            </div>
          ))}
        </div>
        <Button className="w-full">
          <Save className="w-4 h-4 mr-2" />
          Save Fee Changes
        </Button>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  // Check if user is admin
  const isAdmin = user?.email === 'jude.okun@gmail.com' || 
                  user?.id === '42442296' ||
                  user?.role === 'admin';

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <Shield className="w-5 h-5 mr-2" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              You don't have administrator privileges to access this dashboard.
            </p>
            <Button onClick={() => setLocation("/")} className="w-full">
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ['/api/admin/stats'],
    retry: false,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Shield className="w-6 h-6 text-blue-600 mr-3" />
              <span className="text-xl font-bold text-gray-900">Admin Dashboard</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => setLocation("/")} size="sm">
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
              <div className="flex items-center space-x-2">
                {user?.profileImageUrl && (
                  <img 
                    src={user.profileImageUrl} 
                    alt="Admin" 
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <span className="text-sm font-medium text-gray-700">
                  {user?.firstName || 'Admin'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-1 h-auto p-1">
            <TabsTrigger value="overview" className="flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-2 p-2 md:p-3 text-xs md:text-sm">
              <BarChart3 className="w-4 h-4 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Overview</span>
              <span className="sm:hidden">Stats</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-2 p-2 md:p-3 text-xs md:text-sm">
              <Users className="w-4 h-4 md:w-4 md:h-4" />
              <span>Users</span>
            </TabsTrigger>
            <TabsTrigger value="installers" className="flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-2 p-2 md:p-3 text-xs md:text-sm">
              <Shield className="w-4 h-4 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Installers</span>
              <span className="sm:hidden">Pros</span>
            </TabsTrigger>
            <TabsTrigger value="bookings" className="flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-2 p-2 md:p-3 text-xs md:text-sm">
              <Calendar className="w-4 h-4 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Bookings</span>
              <span className="sm:hidden">Jobs</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-2 p-2 md:p-3 text-xs md:text-sm">
              <DollarSign className="w-4 h-4 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Payments</span>
              <span className="sm:hidden">Pay</span>
            </TabsTrigger>
            <TabsTrigger value="system" className="flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-2 p-2 md:p-3 text-xs md:text-sm">
              <Database className="w-4 h-4 md:w-4 md:h-4" />
              <span className="hidden sm:inline">System</span>
              <span className="sm:hidden">Sys</span>
            </TabsTrigger>
            <TabsTrigger value="fees" className="flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-2 p-2 md:p-3 text-xs md:text-sm">
              <Percent className="w-4 h-4 md:w-4 md:h-4" />
              <span>Fees</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <DashboardOverview stats={stats} />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <UserManagement />
          </TabsContent>

          <TabsContent value="installers" className="space-y-6">
            <InstallerManagement />
          </TabsContent>

          <TabsContent value="bookings" className="space-y-6">
            <BookingManagement />
          </TabsContent>

          <TabsContent value="payments" className="space-y-6">
            <PaymentManagement />
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <SystemMetrics />
          </TabsContent>

          <TabsContent value="fees" className="space-y-6">
            <FeeManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}