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
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-indigo-600" },
    { label: "Active Installers", value: stats.totalInstallers, icon: UserCheck, color: "text-orange-600" },
    { label: "Active Bookings", value: stats.activeBookings, icon: Activity, color: "text-red-600" },
    { label: "Avg Booking Value", value: `€${stats.avgBookingValue}`, icon: BarChart3, color: "text-cyan-600" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => (
        <Card key={index}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{metric.label}</p>
                <p className="text-3xl font-bold text-gray-900">{metric.value}</p>
              </div>
              <metric.icon className={`h-8 w-8 ${metric.color}`} />
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

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest(`/api/admin/users/${userId}`, "DELETE");
    },
    onSuccess: () => {
      toast({ title: "User deleted successfully" });
      // Invalidate and refetch
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

// Fee Management Component  
function FeeManagement() {
  const [feeStructures, setFeeStructures] = useState({
    'table-top-small': 15,
    'table-top-large': 15,
    'bronze': 15,
    'silver': 15,
    'silver-large': 15,
    'gold': 15,
    'gold-large': 15
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateFeesMutation = useMutation({
    mutationFn: async () => {
      const promises = Object.entries(feeStructures).map(([serviceType, feePercentage]) =>
        apiRequest('POST', '/api/admin/fee-structures', {
          installerId: 1, // Default installer for demo
          serviceType,
          feePercentage
        })
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      toast({
        title: "Fee Structure Updated",
        description: "All fee percentages have been saved successfully."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleFeeChange = (serviceType: string, value: string) => {
    const numValue = Math.max(0, Math.min(100, parseFloat(value) || 0));
    setFeeStructures(prev => ({
      ...prev,
      [serviceType]: numValue
    }));
  };

  const getServiceDisplayName = (serviceType: string) => {
    const names: Record<string, string> = {
      'table-top-small': 'Table Top (Small)',
      'table-top-large': 'Table Top (Large)',
      'bronze': 'Bronze Mount',
      'silver': 'Silver Mount',
      'silver-large': 'Silver Mount (Large)',
      'gold': 'Gold Mount',
      'gold-large': 'Gold Mount (Large)'
    };
    return names[serviceType] || serviceType;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Percent className="w-5 h-5 mr-2" />
          Fee Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(feeStructures).map(([serviceType, percentage]) => (
          <div key={serviceType} className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              {getServiceDisplayName(serviceType)}
            </Label>
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                value={percentage}
                onChange={(e) => handleFeeChange(serviceType, e.target.value)}
                className="w-20 text-right"
                min="0"
                max="100"
                step="0.1"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>
        ))}
        
        <Button 
          onClick={() => updateFeesMutation.mutate()}
          disabled={updateFeesMutation.isPending}
          className="w-full mt-6"
        >
          {updateFeesMutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Update Fee Structure
        </Button>
      </CardContent>
    </Card>
  );
}

function BookingsTable({ bookings }: { bookings: Booking[] }) {
  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: "bg-warning text-warning-foreground",
      confirmed: "bg-blue-500 text-white",
      assigned: "bg-blue-600 text-white",
      "in-progress": "bg-orange-500 text-white",
      completed: "bg-success text-white",
      cancelled: "bg-destructive text-destructive-foreground"
    };
    
    return (
      <Badge className={variants[status] || "bg-muted text-muted-foreground"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (bookings.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Bookings Found</h3>
          <p className="text-muted-foreground">
            When customers make bookings, they will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Bookings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>App Fee</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.slice(0, 10).map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {booking.customerName || 'Unknown Customer'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {booking.qrCode}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {booking.serviceType} - {booking.tvSize}"
                    </div>
                  </TableCell>
                  <TableCell>
                    {booking.preferredDate 
                      ? new Date(booking.preferredDate).toLocaleDateString()
                      : new Date(booking.createdAt).toLocaleDateString()
                    }
                  </TableCell>
                  <TableCell className="font-medium">
                    €{parseFloat(booking.totalPrice).toFixed(2)}
                  </TableCell>
                  <TableCell className="font-medium text-primary">
                    €{parseFloat(booking.appFee).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(booking.status)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();

  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ['/api/admin/stats']
  });

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: ['/api/admin/bookings']
  });

  const isLoading = statsLoading || bookingsLoading;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Settings className="w-6 h-6 text-primary mr-3" />
              <span className="text-xl font-bold text-foreground">Admin Dashboard</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => setLocation("/")} size="sm">
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <Users className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Loading dashboard...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Bookings</p>
                      <p className="text-2xl font-bold text-foreground">
                        {stats?.totalBookings || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">This Month</p>
                      <p className="text-2xl font-bold text-foreground">
                        {stats?.monthlyBookings || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Revenue</p>
                      <p className="text-2xl font-bold text-foreground">
                        €{stats?.revenue.toFixed(2) || '0.00'}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                      <Euro className="w-6 h-6 text-yellow-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">App Fees</p>
                      <p className="text-2xl font-bold text-foreground">
                        €{stats?.appFees.toFixed(2) || '0.00'}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <Percent className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <Tabs defaultValue="bookings" className="space-y-6">
              <TabsList>
                <TabsTrigger value="bookings">Bookings</TabsTrigger>
                <TabsTrigger value="fees">Fee Management</TabsTrigger>
              </TabsList>

              <TabsContent value="bookings">
                <BookingsTable bookings={bookings} />
              </TabsContent>

              <TabsContent value="fees">
                <div className="grid lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-1">
                    <FeeManagement />
                  </div>
                  <div className="lg:col-span-2">
                    <Card>
                      <CardHeader>
                        <CardTitle>Fee Structure Overview</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="bg-muted/50 p-4 rounded-lg">
                            <h4 className="font-semibold text-foreground mb-2">How It Works</h4>
                            <ul className="text-sm text-muted-foreground space-y-1">
                              <li>• App fees are calculated as a percentage of the total booking price</li>
                              <li>• Fees are automatically deducted from installer earnings</li>
                              <li>• Different service tiers can have different fee percentages</li>
                              <li>• Changes take effect for new bookings immediately</li>
                            </ul>
                          </div>
                          
                          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <h4 className="font-semibold text-foreground mb-2">Current Performance</h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Average Fee Rate:</span>
                                <div className="font-medium">15%</div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Monthly Fee Income:</span>
                                <div className="font-medium text-primary">
                                  €{stats?.appFees.toFixed(2) || '0.00'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
}
