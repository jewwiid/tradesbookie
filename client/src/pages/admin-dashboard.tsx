import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import {
  Bell,
  Users,
  Calendar,
  Settings,
  LogOut,
  Search,
  Filter,
  Download,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Clock,
  Star,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Target,
  CreditCard,
  MapPin,
  Phone,
  Mail,
  User,
  FileText,
  MessageSquare,
  Video,
  BookOpen,
  Tag,
  Loader2,
  RefreshCw,
  Home,
  Monitor,
  Wrench,
  ShoppingBag,
  DollarSign,
  UserCheck,
  Calendar as CalendarIcon,
  Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { ResourcesManagement } from '@/components/ResourcesManagement';
import { apiRequest } from '@/lib/queryClient';

// Admin Dashboard Main Component
export default function AdminDashboard() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  // Handle logout
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      setLocation('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Error",
        description: "Failed to logout. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/admin" className="flex items-center space-x-2">
                <Monitor className="h-8 w-8 text-blue-600" />
                <span className="text-xl font-bold">Admin Dashboard</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your platform, bookings, and resources
          </p>
        </div>

        {/* Management Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="resources">Customer Resources</TabsTrigger>
            <TabsTrigger value="tv-setup">TV Setup</TabsTrigger>
            <TabsTrigger value="platform-settings">Platform Settings</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <DashboardOverview />
          </TabsContent>

          {/* Bookings Management Tab */}
          <TabsContent value="bookings" className="space-y-6">
            <BookingsManagement />
          </TabsContent>

          {/* Customer Resources Tab */}
          <TabsContent value="resources" className="space-y-6">
            <ResourcesManagement />
          </TabsContent>

          {/* TV Setup Management Tab */}
          <TabsContent value="tv-setup" className="space-y-6">
            <TvSetupManagement />
          </TabsContent>

          {/* Platform Settings Tab */}
          <TabsContent value="platform-settings" className="space-y-6">
            <PlatformSettingsManagement />
          </TabsContent>

          {/* System Tab */}
          <TabsContent value="system" className="space-y-6">
            <SystemManagement />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

// Dashboard Overview Component
function DashboardOverview() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['/api/admin/dashboard-stats'],
    queryFn: () => fetch('/api/admin/dashboard-stats', {
      credentials: 'include'
    }).then(r => r.json())
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const defaultStats = {
    totalBookings: 0,
    activeInstallers: 0,
    totalRevenue: 0,
    pendingBookings: 0
  };

  const currentStats = stats || defaultStats;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                <p className="text-3xl font-bold text-blue-600">{currentStats.totalBookings}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Installers</p>
                <p className="text-3xl font-bold text-green-600">{currentStats.activeInstallers}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-3xl font-bold text-purple-600">€{currentStats.totalRevenue}</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Bookings</p>
                <p className="text-3xl font-bold text-orange-600">{currentStats.pendingBookings}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button className="h-20 flex-col space-y-2">
              <Plus className="h-6 w-6" />
              <span>New Booking</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Users className="h-6 w-6" />
              <span>Manage Installers</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <FileText className="h-6 w-6" />
              <span>Generate Report</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Settings className="h-6 w-6" />
              <span>System Settings</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Bookings Management Component
function BookingsManagement() {
  const { toast } = useToast();

  return (
    <div className="space-y-6">
      <div className="text-center py-8">
        <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-medium">Bookings Management</h3>
        <p className="text-gray-600">Manage customer bookings, schedules, and installer assignments</p>
        <p className="text-sm text-gray-500 mt-2">Bookings interface coming soon...</p>
      </div>
    </div>
  );
}

// TV Setup Management Component
function TvSetupManagement() {
  const { toast } = useToast();

  return (
    <div className="space-y-6">
      <div className="text-center py-8">
        <Monitor className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-medium">TV Setup Management</h3>
        <p className="text-gray-600">Manage TV setup bookings, credentials, and referral codes</p>
        <p className="text-sm text-gray-500 mt-2">TV setup interface coming soon...</p>
      </div>
    </div>
  );
}

// Platform Settings Management Component
function PlatformSettingsManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  return (
    <div className="space-y-6">
      <div className="text-center py-8">
        <Settings className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-medium">Platform Settings</h3>
        <p className="text-gray-600">Configure platform-wide settings and preferences</p>
        <p className="text-sm text-gray-500 mt-2">Management interface coming soon...</p>
      </div>
    </div>
  );
}

// System Management Component
function SystemManagement() {
  return (
    <div className="space-y-6">
      <div className="text-center py-8">
        <Wrench className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-medium">System Management</h3>
        <p className="text-gray-600">System maintenance, logs, and diagnostics</p>
        <p className="text-sm text-gray-500 mt-2">System tools coming soon...</p>
      </div>
    </div>
  );
}