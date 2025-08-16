import React, { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
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
  AlertTriangle,
  AlertCircle,
  Plus,
  Target,
  Mail,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Ban,
  Camera,
  EyeOff,
  Upload,
  Image as ImageIcon,
  Tv,
  BookOpen,
  CheckCircle,
  Zap,
  MailCheck,
  UserCog,
  Filter
} from "lucide-react";
import EmailTemplateManagement from "@/components/admin/EmailTemplateManagement";
import ResourcesManagement from "@/components/ResourcesManagement";
import IrelandMap from "@/components/IrelandMap";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import QRCode from "@/components/QRCode";
import TradesPersonOnboarding from "@/components/admin/TradesPersonOnboarding";
import PricingManagement from "@/components/admin/PricingManagement";
import WallMountPricingManagement from "@/components/admin/WallMountPricingManagement";
import FraudPreventionDashboard from "@/components/FraudPreventionDashboard";
import TvSetupManagement from "@/components/admin/TvSetupManagement";
import DownloadableGuidesManagement from "@/components/admin/DownloadableGuidesManagement";
import VideoTutorialsManagement from "@/components/admin/VideoTutorialsManagement";
import StoreManagement from "@/components/admin/StoreManagement";
import AiToolsManagement from "@/components/admin/AiToolsManagement";

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
  totalSolarEnquiries: number;
  newSolarEnquiries: number;
  convertedSolarLeads: number;
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
  registrationMethod?: string;
  role?: string;
  emailVerified?: boolean;
}

interface ServiceType {
  id: number;
  key: string;
  name: string;
  description: string;
  iconName: string;
  colorScheme: string;
  isActive: boolean;
  setupTimeMinutes: number;
}

interface InstallerServiceAssignment {
  id: number;
  installerId: number;
  serviceTypeId: number;
  assignedAt: string;
  assignedBy: string;
  isActive: boolean;
  serviceType: ServiceType;
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
  isPubliclyVisible?: boolean;
  profileImageUrl?: string;
  createdAt: string;
  completedJobs: number;
  rating: number;
  totalEarnings: number;
  // Approval system fields
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  adminScore?: number;
  adminComments?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  // Service assignments
  services?: InstallerServiceAssignment[];
}

interface SolarEnquiry {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  county: string;
  propertyType: string;
  roofType: string;
  electricityBill: string;
  timeframe: string;
  grants: boolean;
  additionalInfo?: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
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

interface TvSetupBooking {
  id: number;
  fullName: string;
  email: string;
  mobile: string;
  tvBrand: string;
  tvModel: string;
  tvOs: string;
  yearOfPurchase: number;
  streamingApps: string[];
  preferredSetupDate?: string;
  additionalNotes?: string;
  stripePaymentIntentId?: string;
  paymentStatus: string;
  paymentAmount: string;
  setupStatus: string;
  setupMethod?: string;
  assignedTo?: string;
  completedAt?: string;
  adminNotes?: string;
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
    { label: "Solar Enquiries", value: stats.totalSolarEnquiries || 0, icon: Activity, color: "text-orange-600" },
    { label: "New Solar Leads", value: stats.newSolarEnquiries || 0, icon: Star, color: "text-yellow-600" },
    { label: "Successful Payments", value: stats.successfulPayments || 0, icon: UserCheck, color: "text-green-600" },
    { label: "Total Paid", value: `€${stats.totalPaidAmount || 0}`, icon: Euro, color: "text-emerald-600" },
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
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editUserData, setEditUserData] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest("DELETE", `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      toast({ title: "User deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: () => {
      toast({ title: "Failed to delete user", variant: "destructive" });
    },
  });

  const sendVerificationEmailMutation = useMutation({
    mutationFn: async (email: string) => {
      return await apiRequest("POST", "/api/auth/send-verification", { email });
    },
    onSuccess: () => {
      toast({ 
        title: "Verification email sent", 
        description: "The user will receive a new verification email shortly." 
      });
    },
    onError: () => {
      toast({ 
        title: "Failed to send verification email", 
        description: "Please try again or contact support.",
        variant: "destructive" 
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (data: { userId: string; firstName: string; lastName: string; email: string }) => {
      return await apiRequest("PATCH", `/api/admin/users/${data.userId}`, {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email
      });
    },
    onSuccess: () => {
      toast({ 
        title: "User profile updated successfully", 
        description: "The user's profile information has been saved." 
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setShowEditDialog(false);
    },
    onError: () => {
      toast({ 
        title: "Failed to update user profile", 
        description: "Please try again or contact support.",
        variant: "destructive" 
      });
    },
  });

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setShowUserDialog(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditUserData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || ''
    });
    setShowEditDialog(true);
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
  };

  const handleSendVerificationEmail = (user: User) => {
    sendVerificationEmailMutation.mutate(user.email);
  };

  const handleBanUserFromUsers = (user: User) => {
    // Navigate to banned users tab and trigger ban dialog
    const banEvent = new CustomEvent('openBanDialog', { detail: user });
    window.dispatchEvent(banEvent);
  };

  const confirmDeleteUser = () => {
    if (selectedUser) {
      deleteUserMutation.mutate(selectedUser.id);
      setShowDeleteDialog(false);
      setSelectedUser(null);
    }
  };

  const handleSubmitEdit = () => {
    if (selectedUser) {
      updateUserMutation.mutate({
        userId: selectedUser.id,
        firstName: editUserData.firstName,
        lastName: editUserData.lastName,
        email: editUserData.email
      });
    }
  };

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
    <>
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
                <TableHead>Email Status</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Registration Type</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Lead Requests</TableHead>
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
                        {user.firstName ? `${user.firstName} ${user.lastName}` : user.email.split('@')[0]}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={user.emailVerified ? 'default' : 'secondary'}
                    >
                      {user.emailVerified ? 'Verified' : 'Unverified'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={user.role === 'admin' ? 'destructive' : 'default'}
                    >
                      {user.role === 'admin' ? 'Admin' : 'Customer'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        user.registrationMethod === 'oauth' ? 'default' :
                        user.registrationMethod === 'invoice' ? 'secondary' :
                        user.registrationMethod === 'guest' ? 'outline' : 
                        user.registrationMethod === 'manual' ? 'outline' : 'default'
                      }
                    >
                      {user.registrationMethod === 'oauth' ? 'OAuth' :
                       user.registrationMethod === 'invoice' ? 'Invoice' :
                       user.registrationMethod === 'guest' ? 'Guest' :
                       user.registrationMethod === 'manual' ? 'Manual' : 'OAuth'}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>{user.bookingCount}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewUser(user)}
                        title="View user details"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditUser(user)}
                        title="Edit user profile"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      {!user.emailVerified && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleSendVerificationEmail(user)}
                          disabled={sendVerificationEmailMutation.isPending}
                        >
                          {sendVerificationEmailMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleBanUserFromUsers(user)}
                        disabled={user.role === 'admin'}
                        title={user.role === 'admin' ? "Cannot ban admin users" : "Ban user"}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Ban className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteUser(user)}
                        disabled={deleteUserMutation.isPending || user.role === 'admin'}
                        title={user.role === 'admin' ? "Cannot delete admin users" : "Delete user"}
                      >
                        {deleteUserMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* User Details Dialog */}
      {selectedUser && (
        <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
          <DialogContent className="max-w-md" aria-describedby="user-dialog-description">
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
              <DialogDescription id="user-dialog-description">
                View user information and activity
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-sm text-gray-500">Name</h4>
                <p className="text-sm">
                  {selectedUser.firstName ? 
                    `${selectedUser.firstName} ${selectedUser.lastName}` : 
                    selectedUser.email.split('@')[0]
                  }
                </p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-gray-500">Email</h4>
                <p className="text-sm">{selectedUser.email}</p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-gray-500">Role</h4>
                <p className="text-sm capitalize">{selectedUser.role || 'customer'}</p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-gray-500">Registration Type</h4>
                <p className="text-sm">
                  {selectedUser.registrationMethod === 'oauth' ? 'OAuth' :
                   selectedUser.registrationMethod === 'invoice' ? 'Invoice' :
                   selectedUser.registrationMethod === 'guest' ? 'Guest' :
                   selectedUser.registrationMethod === 'manual' ? 'Manual' : 'OAuth'}
                </p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-gray-500">Joined</h4>
                <p className="text-sm">{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-gray-500">Lead Requests</h4>
                <p className="text-sm">{selectedUser.bookingCount}</p>
              </div>
              {selectedUser.lastLogin && (
                <div>
                  <h4 className="font-medium text-sm text-gray-500">Last Login</h4>
                  <p className="text-sm">{new Date(selectedUser.lastLogin).toLocaleDateString()}</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowUserDialog(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* User Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md" aria-describedby="edit-user-description">
          <DialogHeader>
            <DialogTitle>Edit User Profile</DialogTitle>
            <DialogDescription id="edit-user-description">
              Update user information for customer support purposes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={editUserData.firstName}
                onChange={(e) => setEditUserData(prev => ({ ...prev, firstName: e.target.value }))}
                placeholder="Enter first name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={editUserData.lastName}
                onChange={(e) => setEditUserData(prev => ({ ...prev, lastName: e.target.value }))}
                placeholder="Enter last name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={editUserData.email}
                onChange={(e) => setEditUserData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email address"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitEdit}
              disabled={updateUserMutation.isPending}
            >
              {updateUserMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Deletion Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md" aria-describedby="delete-user-description">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription id="delete-user-description">
              Are you sure you want to permanently delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="py-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-medium text-red-800 mb-2">User to be deleted:</h4>
                <div className="text-sm text-red-700">
                  <p><strong>Name:</strong> {selectedUser.firstName ? `${selectedUser.firstName} ${selectedUser.lastName}` : selectedUser.email.split('@')[0]}</p>
                  <p><strong>Email:</strong> {selectedUser.email}</p>
                  <p><strong>Role:</strong> {selectedUser.role === 'admin' ? 'Admin' : 'Customer'}</p>
                  <p><strong>Registration Type:</strong> {
                    selectedUser.registrationMethod === 'oauth' ? 'OAuth' :
                    selectedUser.registrationMethod === 'invoice' ? 'Invoice' :
                    selectedUser.registrationMethod === 'guest' ? 'Guest' :
                    selectedUser.registrationMethod === 'manual' ? 'Manual' : 'OAuth'
                  }</p>
                  <p><strong>Lead Requests:</strong> {selectedUser.bookingCount || 0}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteUser}
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? "Deleting..." : "Delete Permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Installer Approval Form Component
const approvalFormSchema = z.object({
  score: z.array(z.number()).min(1, "Score is required"),
  comments: z.string().optional(),
});

interface InstallerApprovalFormProps {
  installer: any;
  onApprove: (score: number, comments: string) => void;
  onReject: (comments: string) => void;
  onCancel: () => void;
  isLoading: boolean;
}

function InstallerApprovalForm({ installer, onApprove, onReject, onCancel, isLoading }: InstallerApprovalFormProps) {
  const form = useForm<z.infer<typeof approvalFormSchema>>({
    resolver: zodResolver(approvalFormSchema),
    defaultValues: {
      score: [7],
      comments: "",
    },
  });

  const handleApprove = (values: z.infer<typeof approvalFormSchema>) => {
    onApprove(values.score[0], values.comments || "");
  };

  const handleReject = () => {
    const comments = form.getValues("comments");
    onReject(comments || "");
  };

  return (
    <div className="space-y-6">
      {/* Installer Summary Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold text-xl text-gray-900 mb-2">{installer.businessName}</h3>
            <p className="text-blue-700 font-medium">{installer.contactName}</p>
            <p className="text-sm text-gray-600 mt-1">
              Applied on {new Date(installer.createdAt || '').toLocaleDateString()}
            </p>
          </div>
          <div className="text-right">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              installer.approvalStatus === 'approved' ? 'bg-green-100 text-green-800' :
              installer.approvalStatus === 'rejected' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {installer.approvalStatus?.charAt(0).toUpperCase() + installer.approvalStatus?.slice(1) || 'Pending'}
            </span>
            {installer.profileCompleted && (
              <div className="text-green-600 text-xs mt-1 flex items-center gap-1">
                <UserCheck className="w-3 h-3" />
                Profile Complete
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Basic Information */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h4 className="font-semibold text-gray-900 flex items-center gap-2">
            <UserCheck className="w-4 h-4" />
            Basic Information
          </h4>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Contact Name:</span>
              <p className="text-gray-900">{installer.contactName || "Not provided"}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Email:</span>
              <p className="text-gray-900">{installer.email}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Phone:</span>
              <p className="text-gray-900">{installer.phone || "Not provided"}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Business Address:</span>
              <p className="text-gray-900">{installer.address || "Not provided"}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Primary Service Area:</span>
              <p className="text-gray-900">{installer.serviceArea || "Not specified"}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Insurance Status:</span>
              <div className="flex items-center gap-2 mt-1">
                {installer.insurance ? (
                  <div>
                    <Badge variant="default" className="bg-green-100 text-green-800 border-green-200 text-xs">
                      ✓ Insured
                    </Badge>
                    <p className="text-xs text-gray-600 mt-1">{installer.insurance}</p>
                  </div>
                ) : (
                  <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200 text-xs">
                    ⚠ Uninsured
                  </Badge>
                )}
              </div>
            </div>
            <div>
              <span className="font-medium text-gray-700">Years of Experience:</span>
              <p className="text-gray-900">{installer.yearsExperience ? `${installer.yearsExperience} years` : "Not specified"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Profile Information */}
      {installer.profileCompleted && (
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Enhanced Profile Information
            </h4>
          </div>
          <div className="p-6 space-y-4">
            {/* Expertise and Specialties */}
            <div>
              <span className="font-medium text-gray-700">Technical Expertise:</span>
              <div className="mt-2">
                {installer.expertise && Array.isArray(installer.expertise) && installer.expertise.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {installer.expertise.map((skill: string, index: number) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No specialties specified</p>
                )}
              </div>
            </div>

            {/* Professional Bio */}
            {installer.bio && (
              <div>
                <span className="font-medium text-gray-700">Professional Bio:</span>
                <p className="text-gray-900 mt-1 text-sm leading-relaxed">{installer.bio}</p>
              </div>
            )}

            {/* Account Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Account Status:</span>
                <p className={`mt-1 ${installer.isActive ? 'text-green-600' : 'text-red-600'}`}>
                  {installer.isActive ? 'Active' : 'Inactive'}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Profile Image:</span>
                <p className="text-gray-900 mt-1">
                  {installer.profileImageUrl ? 'Uploaded' : 'Not provided'}
                </p>
              </div>
            </div>

            {/* Previous Review Information */}
            {installer.adminScore && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h5 className="font-medium text-amber-800 mb-2">Previous Review</h5>
                <div className="text-sm text-amber-700">
                  <p>Score: {installer.adminScore}/10</p>
                  {installer.adminComments && <p className="mt-1">Comments: {installer.adminComments}</p>}
                  {installer.reviewedBy && installer.reviewedAt && (
                    <p className="mt-1">
                      Reviewed by {installer.reviewedBy} on {new Date(installer.reviewedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Profile Completion Status */}
      {!installer.profileCompleted && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-yellow-800">
            <AlertTriangle className="w-4 h-4" />
            <span className="font-medium">Incomplete Profile</span>
          </div>
          <p className="text-yellow-700 text-sm mt-1">
            This installer has not completed their enhanced profile setup. Basic information only is available for review.
          </p>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleApprove)} className="space-y-6">
          {/* Admin Score */}
          <FormField
            control={form.control}
            name="score"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-semibold">
                  Quality Score (1-10): {field.value[0]}/10
                </FormLabel>
                <FormControl>
                  <div className="px-4 py-2">
                    <Slider
                      min={1}
                      max={10}
                      step={1}
                      value={field.value}
                      onValueChange={field.onChange}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Poor (1)</span>
                      <span>Average (5)</span>
                      <span>Excellent (10)</span>
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Admin Comments */}
          <FormField
            control={form.control}
            name="comments"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Review Comments</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Add notes about this installer's application, qualifications, or any concerns..."
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isLoading ? "Processing..." : "Approve Installer"}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleReject}
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : "Reject Application"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

// Installer Management Component
function InstallerManagement({ installerServiceAssignments = [], serviceTypes = [] }: { 
  installerServiceAssignments?: InstallerServiceAssignment[];
  serviceTypes?: ServiceType[];
}) {
  const [selectedInstaller, setSelectedInstaller] = useState<Installer | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { data: installers, isLoading } = useQuery<Installer[]>({
    queryKey: ["/api/admin/installers"],
    retry: false,
  });

  // Create a helper function to get services for an installer
  const getInstallerServices = (installerId: number) => {
    return installerServiceAssignments.filter(assignment => 
      assignment.installerId === installerId && assignment.isActive
    );
  };

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Image upload mutation
  const uploadImageMutation = useMutation({
    mutationFn: async ({ installerId, imageFile }: { installerId: number; imageFile: File }) => {
      console.log(`🔄 Starting image upload for installer ${installerId}`, {
        fileName: imageFile.name,
        fileSize: imageFile.size,
        fileType: imageFile.type
      });
      
      const formData = new FormData();
      formData.append('profileImage', imageFile);
      
      console.log(`📤 Sending request to /api/admin/installers/${installerId}/image`);
      
      const response = await fetch(`/api/admin/installers/${installerId}/image`, {
        method: 'POST',
        body: formData,
        credentials: 'include', // Include cookies for authentication
      });
      
      console.log(`📥 Response received:`, {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Upload failed:`, {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
        throw new Error(`Failed to upload image: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`✅ Upload successful:`, data);
      return data;
    },
    onSuccess: (data) => {
      console.log("Image upload successful:", data);
      toast({ title: "Image uploaded successfully" });
      // Invalidate queries to refresh installer data
      queryClient.invalidateQueries({ queryKey: ["/api/admin/installers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/installers"] });
      // Update the selected installer with new image URL if available
      if (selectedInstaller && data.profileImageUrl) {
        setSelectedInstaller({
          ...selectedInstaller,
          profileImageUrl: data.profileImageUrl
        });
      }
      setSelectedImage(null);
      setPreviewUrl(null);
      setUploadingImage(false);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to upload image", description: error.message, variant: "destructive" });
      setUploadingImage(false);
    },
  });

  // Handle image selection
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (2MB limit)
      if (file.size > 2 * 1024 * 1024) {
        toast({ title: "File too large", description: "Please select an image smaller than 2MB", variant: "destructive" });
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({ title: "Invalid file type", description: "Please select an image file", variant: "destructive" });
        return;
      }
      
      setSelectedImage(file);
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  // Handle image upload
  const handleImageUpload = () => {
    console.log("🔄 handleImageUpload called");
    console.log("📁 Selected Image:", selectedImage);
    console.log("👤 Selected Installer:", selectedInstaller);
    
    if (selectedImage && selectedInstaller) {
      console.log("✅ Both image and installer selected, starting upload");
      setUploadingImage(true);
      uploadImageMutation.mutate({ installerId: selectedInstaller.id, imageFile: selectedImage });
    } else {
      console.log("❌ Missing requirements:", {
        hasImage: !!selectedImage,
        hasInstaller: !!selectedInstaller
      });
    }
  };

  // Clear image selection
  const clearImageSelection = () => {
    setSelectedImage(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

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

  const togglePublicVisibilityMutation = useMutation({
    mutationFn: async ({ installerId, isPubliclyVisible }: { installerId: number; isPubliclyVisible: boolean }) => {
      await apiRequest(`/api/admin/installers/${installerId}/visibility`, "PATCH", { isPubliclyVisible });
    },
    onSuccess: () => {
      toast({ title: "Public visibility updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/installers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/installers"] }); // Update public installer list
    },
    onError: () => {
      toast({ title: "Failed to update visibility", variant: "destructive" });
    },
  });

  const toggleVipStatusMutation = useMutation({
    mutationFn: async ({ installerId, isVip, vipNotes }: { installerId: number; isVip: boolean; vipNotes?: string }) => {
      await apiRequest(`/api/admin/installers/${installerId}/vip`, "PATCH", { isVip, vipNotes });
    },
    onSuccess: (_, { isVip }) => {
      toast({ 
        title: `Installer ${isVip ? 'granted' : 'removed'} VIP status successfully`,
        description: isVip ? "Installer will now get leads for free" : "Installer will pay standard lead fees"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/installers"] });
    },
    onError: () => {
      toast({ title: "Failed to update installer VIP status", variant: "destructive" });
    },
  });

  const approveInstallerMutation = useMutation({
    mutationFn: async ({ installerId, score, comments }: { installerId: number; score: number; comments: string }) => {
      await apiRequest("PATCH", `/api/admin/installers/${installerId}/approve`, { 
        approvalStatus: 'approved', 
        adminScore: score, 
        adminComments: comments 
      });
    },
    onSuccess: () => {
      toast({ title: "Installer approved successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/installers"] });
      setShowApprovalDialog(false);
    },
    onError: () => {
      toast({ title: "Failed to approve installer", variant: "destructive" });
    },
  });

  const rejectInstallerMutation = useMutation({
    mutationFn: async ({ installerId, comments }: { installerId: number; comments: string }) => {
      await apiRequest("PATCH", `/api/admin/installers/${installerId}/reject`, { 
        approvalStatus: 'rejected', 
        adminComments: comments 
      });
    },
    onSuccess: () => {
      toast({ title: "Installer rejected" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/installers"] });
      setShowApprovalDialog(false);
    },
    onError: () => {
      toast({ title: "Failed to reject installer", variant: "destructive" });
    },
  });

  const deleteInstallerMutation = useMutation({
    mutationFn: async (installerId: number) => {
      const response = await apiRequest("DELETE", `/api/admin/installers/${installerId}`);
      return response;
    },
    onSuccess: () => {
      toast({ title: "Installer deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/installers"] });
      setShowDeleteDialog(false);
    },
    onError: (error: any) => {
      console.error("Delete installer error:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to delete installer";
      toast({ 
        title: "Failed to delete installer", 
        description: errorMessage,
        variant: "destructive" 
      });
    },
  });

  const updateInstallerProfileMutation = useMutation({
    mutationFn: async ({ installerId, profileData }: { installerId: number; profileData: any }) => {
      const response = await apiRequest("PATCH", `/api/admin/installers/${installerId}/profile`, profileData);
      return response;
    },
    onSuccess: () => {
      toast({ title: "Installer updated", description: "Profile changes saved successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/installers"] });
      setShowEditDialog(false);
    },
    onError: (error: any) => {
      console.error("Update installer error:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to update installer";
      toast({ 
        title: "Failed to update installer", 
        description: errorMessage,
        variant: "destructive" 
      });
    },
  });

  const handleViewInstaller = (installer: Installer) => {
    setSelectedInstaller(installer);
    setShowViewDialog(true);
  };

  const handleEditInstaller = (installer: Installer) => {
    setSelectedInstaller(installer);
    setShowEditDialog(true);
  };

  const handleApprovalReview = (installer: Installer) => {
    setSelectedInstaller(installer);
    setShowApprovalDialog(true);
  };

  const handleDeleteInstaller = (installer: Installer) => {
    setSelectedInstaller(installer);
    setShowDeleteDialog(true);
  };

  const handleSaveInstallerProfile = () => {
    if (!selectedInstaller) return;
    
    // Collect form data
    const formData = new FormData();
    const businessName = (document.getElementById('businessName') as HTMLInputElement)?.value;
    const contactName = (document.getElementById('contactName') as HTMLInputElement)?.value;
    const email = (document.getElementById('email') as HTMLInputElement)?.value;
    const phone = (document.getElementById('phone') as HTMLInputElement)?.value;
    const serviceArea = (document.getElementById('serviceArea') as HTMLInputElement)?.value;
    const address = (document.getElementById('address') as HTMLInputElement)?.value;
    
    const profileData = {
      businessName,
      contactName,
      email,
      phone,
      serviceArea,
      address
    };
    
    updateInstallerProfileMutation.mutate({
      installerId: selectedInstaller.id,
      profileData
    });
  };

  // Filter installers based on approval status
  const filteredInstallers = installers?.filter(installer => {
    if (filterStatus === 'all') return true;
    return installer.approvalStatus === filterStatus;
  }) || [];

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
        <div className="flex items-center space-x-4 mt-4">
          <Label htmlFor="status-filter">Filter by Status:</Label>
          <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Installers</SelectItem>
              <SelectItem value="pending">Pending Approval</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Business</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Area</TableHead>
              <TableHead>Services</TableHead>
              <TableHead>Jobs</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Earnings</TableHead>
              <TableHead>Approval</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Visibility</TableHead>
              <TableHead>VIP Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInstallers?.map((installer) => (
              <TableRow key={installer.id}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={installer.profileImageUrl || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                        {installer.businessName.charAt(0)}{installer.contactName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{installer.businessName}</div>
                      <div className="text-sm text-gray-500">{installer.contactName}</div>
                    </div>
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
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {getInstallerServices(installer.id).length > 0 ? (
                      getInstallerServices(installer.id).map((assignment) => (
                        <Badge 
                          key={assignment.id}
                          variant="outline" 
                          className="text-xs px-2 py-1 bg-blue-50 text-blue-700 border-blue-200"
                        >
                          {assignment.serviceType.name}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-gray-500">No services assigned</span>
                    )}
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
                  <div className="flex flex-col space-y-1">
                    <Badge variant={
                      installer.approvalStatus === 'approved' ? "default" : 
                      installer.approvalStatus === 'rejected' ? "destructive" : 
                      "secondary"
                    }>
                      {installer.approvalStatus === 'approved' ? "Approved" : 
                       installer.approvalStatus === 'rejected' ? "Rejected" : 
                       "Pending"}
                    </Badge>
                    {installer.adminScore && (
                      <div className="text-xs text-gray-500">
                        Score: {installer.adminScore}/10
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={installer.isActive ? "default" : "secondary"}>
                    {installer.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Badge variant={installer.isPubliclyVisible !== false ? "default" : "secondary"}>
                      {installer.isPubliclyVisible !== false ? "Public" : "Hidden"}
                    </Badge>
                    <Switch 
                      checked={installer.isPubliclyVisible !== false}
                      onCheckedChange={(checked) => 
                        togglePublicVisibilityMutation.mutate({
                          installerId: installer.id,
                          isPubliclyVisible: checked
                        })
                      }
                      title={installer.isPubliclyVisible !== false ? "Hide from public view" : "Show in public view"}
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={installer.isVip ? "default" : "outline"} 
                      className={installer.isVip ? "bg-purple-600 text-white" : ""}
                    >
                      {installer.isVip ? "VIP" : "Standard"}
                    </Badge>
                    <Switch 
                      checked={installer.isVip || false}
                      onCheckedChange={(checked) => 
                        toggleVipStatusMutation.mutate({
                          installerId: installer.id,
                          isVip: checked,
                          vipNotes: checked ? "VIP status granted by admin" : undefined
                        })
                      }
                      title={installer.isVip ? "Remove VIP status" : "Grant VIP status (free leads)"}
                      className={installer.isVip ? "data-[state=checked]:bg-purple-600" : ""}
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    {installer.approvalStatus === 'pending' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleApprovalReview(installer)}
                        title="Review approval request"
                        className="bg-yellow-50 border-yellow-200 hover:bg-yellow-100"
                      >
                        <Target className="w-4 h-4 text-yellow-600" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleInstallerStatusMutation.mutate({
                        installerId: installer.id,
                        isActive: !installer.isActive
                      })}
                      title={installer.isActive ? "Deactivate installer" : "Activate installer"}
                    >
                      {installer.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewInstaller(installer)}
                      title="View installer details"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteInstaller(installer)}
                      title="Delete installer permanently"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditInstaller(installer)}
                      title="Edit installer"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      {/* View Installer Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl" aria-describedby="installer-view-description">
          <DialogHeader>
            <DialogTitle>Installer Details</DialogTitle>
            <DialogDescription id="installer-view-description">
              View complete installer information and statistics
            </DialogDescription>
          </DialogHeader>
          {selectedInstaller && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Business Name</Label>
                  <p className="text-sm">{selectedInstaller.businessName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Contact Name</Label>
                  <p className="text-sm">{selectedInstaller.contactName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Email</Label>
                  <p className="text-sm">{selectedInstaller.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Phone</Label>
                  <p className="text-sm">{selectedInstaller.phone}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Service Area</Label>
                  <p className="text-sm">{selectedInstaller.serviceArea || 'Not specified'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Status</Label>
                  <Badge variant={selectedInstaller.isActive ? "default" : "secondary"}>
                    {selectedInstaller.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Public Visibility</Label>
                  <Badge variant={selectedInstaller.isPubliclyVisible !== false ? "default" : "secondary"}>
                    {selectedInstaller.isPubliclyVisible !== false ? "Public" : "Hidden"}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <Label className="text-sm font-medium text-gray-600">Completed Jobs</Label>
                  <p className="text-2xl font-bold text-blue-600">{selectedInstaller.completedJobs}</p>
                </div>
                <div className="text-center">
                  <Label className="text-sm font-medium text-gray-600">Rating</Label>
                  <div className="flex items-center justify-center">
                    <Star className="w-5 h-5 text-yellow-500 mr-1" />
                    <p className="text-2xl font-bold text-yellow-600">{selectedInstaller.rating.toFixed(1)}</p>
                  </div>
                </div>
                <div className="text-center">
                  <Label className="text-sm font-medium text-gray-600">Total Earnings</Label>
                  <p className="text-2xl font-bold text-green-600">€{selectedInstaller.totalEarnings}</p>
                </div>
              </div>

              {selectedInstaller.address && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Address</Label>
                  <p className="text-sm">{selectedInstaller.address}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Installer Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl" aria-describedby="installer-edit-description">
          <DialogHeader>
            <DialogTitle>Edit Installer</DialogTitle>
            <DialogDescription id="installer-edit-description">
              Update installer information and settings
            </DialogDescription>
          </DialogHeader>
          {selectedInstaller && (
            <div className="space-y-4">
              {/* Profile Image Upload Section */}
              <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                <div className="flex items-center space-x-2">
                  <ImageIcon className="w-5 h-5 text-gray-600" />
                  <Label className="text-sm font-medium">Profile Image</Label>
                </div>
                
                <div className="flex items-center space-x-4">
                  {/* Current Image Display */}
                  <div className="flex-shrink-0">
                    <Avatar className="w-20 h-20" key={selectedInstaller.profileImageUrl || 'no-image'}>
                      <AvatarImage 
                        src={selectedInstaller.profileImageUrl || ''} 
                        alt={selectedInstaller.businessName}
                        onError={(e) => {
                          console.log("Avatar image failed to load:", selectedInstaller.profileImageUrl);
                        }}
                      />
                      <AvatarFallback className="bg-gray-200 text-gray-600">
                        {selectedInstaller.businessName?.charAt(0) || 'I'}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  
                  {/* Image Upload Controls */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                        id="imageUpload"
                      />
                      <Label htmlFor="imageUpload" className="cursor-pointer">
                        <Button variant="outline" size="sm" asChild>
                          <span>
                            <Upload className="w-4 h-4 mr-2" />
                            Select Image
                          </span>
                        </Button>
                      </Label>
                      
                      {selectedImage && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={clearImageSelection}
                          className="text-red-600 hover:text-red-700"
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                    
                    {/* Image Preview */}
                    {previewUrl && (
                      <div className="flex items-center space-x-2">
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="w-16 h-16 object-cover rounded-lg border"
                        />
                        <Button
                          onClick={() => {
                            console.log("🎯 Upload button clicked!");
                            handleImageUpload();
                          }}
                          disabled={uploadingImage}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {uploadingImage ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4 mr-2" />
                          )}
                          {uploadingImage ? 'Uploading...' : 'Upload'}
                        </Button>
                      </div>
                    )}
                    
                    <p className="text-xs text-gray-500">
                      Select a profile image for this installer (max 2MB, JPG/PNG)
                    </p>
                  </div>
                </div>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input 
                    id="businessName" 
                    defaultValue={selectedInstaller.businessName}
                    placeholder="Business name"
                  />
                </div>
                <div>
                  <Label htmlFor="contactName">Contact Name</Label>
                  <Input 
                    id="contactName" 
                    defaultValue={selectedInstaller.contactName}
                    placeholder="Contact person"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email"
                    defaultValue={selectedInstaller.email}
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input 
                    id="phone" 
                    defaultValue={selectedInstaller.phone}
                    placeholder="Phone number"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="serviceArea">Service Area</Label>
                  <Input 
                    id="serviceArea" 
                    defaultValue={selectedInstaller.serviceArea || ''}
                    placeholder="Service coverage area"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input 
                    id="address" 
                    defaultValue={selectedInstaller.address || ''}
                    placeholder="Business address"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveInstallerProfile}
                  disabled={updateInstallerProfileMutation.isPending}
                >
                  {updateInstallerProfileMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approval Review Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-hidden flex flex-col" aria-describedby="installer-approval-description">
          <DialogHeader>
            <DialogTitle>Review Installer Application</DialogTitle>
            <DialogDescription id="installer-approval-description">
              Score and approve or reject this installer's application
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto min-h-0">
            {selectedInstaller && (
              <InstallerApprovalForm 
                installer={selectedInstaller} 
                onApprove={(score, comments) => {
                  approveInstallerMutation.mutate({ 
                    installerId: selectedInstaller.id, 
                    score, 
                    comments 
                  });
                }}
                onReject={(comments) => {
                  rejectInstallerMutation.mutate({ 
                    installerId: selectedInstaller.id, 
                    comments 
                  });
                }}
                onCancel={() => setShowApprovalDialog(false)}
                isLoading={approveInstallerMutation.isPending || rejectInstallerMutation.isPending}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent aria-describedby="delete-installer-description">
          <DialogHeader>
            <DialogTitle>Delete Installer</DialogTitle>
            <DialogDescription id="delete-installer-description">
              Are you sure you want to permanently delete this installer? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedInstaller && (
            <div className="py-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-medium text-red-800 mb-2">Installer to be deleted:</h4>
                <div className="text-sm text-red-700">
                  <p><strong>Business:</strong> {selectedInstaller.businessName}</p>
                  <p><strong>Contact:</strong> {selectedInstaller.contactName}</p>
                  <p><strong>Email:</strong> {selectedInstaller.email}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => selectedInstaller && deleteInstallerMutation.mutate(selectedInstaller.id)}
              disabled={deleteInstallerMutation.isPending}
            >
              {deleteInstallerMutation.isPending ? "Deleting..." : "Delete Permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// Booking Management Component
function BookingManagement() {
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [forceDelete, setForceDelete] = useState(false);
  const [deletionInfo, setDeletionInfo] = useState<any>(null);
  const [editStatus, setEditStatus] = useState("");
  const [bookingPermissions, setBookingPermissions] = useState<any>({});

  const { data: bookings, isLoading } = useQuery<Booking[]>({
    queryKey: ["/api/admin/bookings"],
    retry: false,
    refetchInterval: 30000, // Auto-refresh every 30 seconds for real-time sync
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateBookingStatusMutation = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: number; status: string }) => {
      await apiRequest("PATCH", `/api/admin/bookings/${bookingId}/status`, { status });
    },
    onSuccess: () => {
      toast({ title: "Booking status updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/status-sync"] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to update booking status", 
        description: error.message || "Status update failed",
        variant: "destructive" 
      });
    },
  });

  const deleteBookingMutation = useMutation({
    mutationFn: async ({ bookingId, force }: { bookingId: number, force: boolean }) => {
      const url = force ? `/api/admin/bookings/${bookingId}?force=true` : `/api/admin/bookings/${bookingId}`;
      return await apiRequest("DELETE", url);
    },
    onSuccess: (data: any) => {
      toast({ 
        title: "Booking deleted successfully", 
        description: `Booking ${data.qrCode} and all associated data removed${data.wasForceDelete ? ' (Force deleted)' : ''}`,
        variant: "default"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bookings"] });
      setIsDeleteDialogOpen(false);
      setSelectedBooking(null);
      setForceDelete(false);
      setDeletionInfo(null);
    },
    onError: (error: any) => {
      console.log('Delete error response:', error);
      // Handle the special case where force delete is available
      if (error.message && error.message.includes('Use force=true parameter to override')) {
        try {
          // Try to parse error response for additional info
          const errorData = JSON.parse(error.message.split('400: ')[1] || '{}');
          setDeletionInfo(errorData);
          toast({
            title: "Booking is in active state",
            description: "You can force delete this booking if needed. Please review the details carefully.",
            variant: "destructive"
          });
        } catch {
          setDeletionInfo({ canForceDelete: true });
          toast({
            title: "Booking is in active state",
            description: "You can force delete this booking if needed.",
            variant: "destructive"
          });
        }
        return; // Don't close dialog, allow user to choose force delete
      }
      
      toast({ 
        title: "Failed to delete booking", 
        description: error.message || "Deletion failed",
        variant: "destructive" 
      });
    },
  });

  const updateDemoFlagMutation = useMutation({
    mutationFn: async ({ bookingId, isDemo }: { bookingId: number; isDemo: boolean }) => {
      await apiRequest("PATCH", `/api/admin/bookings/${bookingId}/demo-flag`, { isDemo });
    },
    onSuccess: () => {
      toast({ title: "Demo flag updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bookings"] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to update demo flag", 
        description: error.message || "Update failed",
        variant: "destructive" 
      });
    },
  });

  // Fetch booking permissions when selecting a booking
  const { data: assignmentStatus } = useQuery({
    queryKey: ["/api/admin/bookings", selectedBooking?.id, "assignment-status"],
    queryFn: () => apiRequest("GET", `/api/admin/bookings/${selectedBooking.id}/assignment-status`),
    enabled: !!selectedBooking,
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

  const handleViewBooking = (booking: any) => {
    setSelectedBooking(booking);
    setIsViewDialogOpen(true);
  };

  const handleEditBooking = (booking: any) => {
    setSelectedBooking(booking);
    setEditStatus(booking.status);
    setIsEditDialogOpen(true);
  };

  const handleDeleteBooking = (booking: any) => {
    setSelectedBooking(booking);
    setIsDeleteDialogOpen(true);
  };

  const handleStatusUpdate = () => {
    if (selectedBooking) {
      updateBookingStatusMutation.mutate({
        bookingId: selectedBooking.id,
        status: editStatus
      });
      setIsEditDialogOpen(false);
    }
  };

  const confirmDeleteBooking = () => {
    if (selectedBooking) {
      deleteBookingMutation.mutate({
        bookingId: selectedBooking.id,
        force: forceDelete
      });
    }
  };

  const resetDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setForceDelete(false);
    setDeletionInfo(null);
    setSelectedBooking(null);
  };

  const canModifyBooking = (booking: any) => {
    return !booking.installerId || ['open', 'pending', 'confirmed'].includes(booking.status);
  };

  const canDeleteBooking = (booking: any) => {
    return !booking.installerId && !['installer_accepted', 'in_progress', 'completed'].includes(booking.status);
  };

  return (
    <>
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
                <TableHead>Demo</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings?.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <QRCode 
                        value={`${window.location.origin}/qr-tracking/${booking.qrCode}`}
                        size={40}
                        className="flex-shrink-0"
                      />
                      <span className="font-mono text-xs text-gray-500">{booking.qrCode}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{booking.contactName || booking.customerName || 'Guest User'}</div>
                      <div className="text-sm text-gray-500">{booking.contactEmail || booking.customerEmail || 'No email provided'}</div>
                      {booking.contactPhone && (
                        <div className="text-xs text-gray-400">{booking.contactPhone}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      {booking.tvInstallations && booking.tvInstallations.length > 1 ? (
                        <>
                          <div className="font-medium">{booking.tvInstallations.length} TVs</div>
                          <div className="text-sm text-gray-500">
                            {booking.tvInstallations.map((tv: any, index: number) => (
                              <div key={index} className="text-xs">
                                {tv.location}: {tv.tvSize}" {tv.serviceType.replace('-', ' ')}
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="font-medium capitalize">{booking.serviceType.replace('-', ' ')}</div>
                          <div className="text-sm text-gray-500">{booking.tvSize}" TV</div>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">€{typeof booking.totalPrice === 'number' ? booking.totalPrice.toFixed(2) : booking.totalPrice}</div>
                      <div className="text-sm text-gray-500">Lead Fee: €{typeof booking.leadFee === 'number' ? booking.leadFee.toFixed(2) : booking.leadFee}</div>
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
                    <div className="flex items-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateDemoFlagMutation.mutate({ 
                          bookingId: booking.id, 
                          isDemo: !booking.isDemo 
                        })}
                        disabled={updateDemoFlagMutation.isPending}
                        className={`rounded-full ${
                          booking.isDemo 
                            ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {booking.isDemo ? 'Demo' : 'Live'}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewBooking(booking)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditBooking(booking)}
                        disabled={!canModifyBooking(booking)}
                        title={!canModifyBooking(booking) ? "Cannot edit - booking assigned to installer" : "Edit booking status"}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleDeleteBooking(booking)}
                        title="Delete booking and all associated data"
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

      {/* View Booking Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="booking-view-description">
          <DialogHeader>
            <DialogTitle>Comprehensive Booking Details</DialogTitle>
            <DialogDescription id="booking-view-description">
              Complete booking information for administrative oversight
            </DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-6">
              {/* Basic Information Section */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3">Basic Information</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">QR Code</label>
                    <div className="mt-2">
                      <QRCode 
                        value={`${window.location.origin}/qr-tracking/${selectedBooking.qrCode}`}
                        size={80}
                        className="mb-2"
                      />
                      <p className="font-mono text-xs text-gray-500">{selectedBooking.qrCode}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <div className="mt-2">
                      <Badge className={getStatusColor(selectedBooking.status)}>
                        {selectedBooking.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Service Details</label>
                    {selectedBooking.tvInstallations && selectedBooking.tvInstallations.length > 1 ? (
                      <div className="mt-1">
                        <p className="font-medium">{selectedBooking.tvInstallations.length} TV Installation</p>
                        <p className="text-sm text-gray-500">Multi-TV booking</p>
                      </div>
                    ) : (
                      <div className="mt-1">
                        <p className="font-medium capitalize">{selectedBooking.serviceType.replace('-', ' ')}</p>
                        <p className="text-sm text-gray-500">TV Size: {selectedBooking.tvSize}"</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Multi-TV Installation Details */}
              {selectedBooking.tvInstallations && selectedBooking.tvInstallations.length > 0 && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-3">TV Installation Details</h3>
                  <div className="space-y-4">
                    {selectedBooking.tvInstallations.map((tv: any, index: number) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">TV {index + 1}: {tv.location || `Unknown Location`}</h4>
                          <div className="text-right">
                            <div className="font-bold text-green-600">€{tv.estimatedTotal?.toFixed(2) || '0.00'}</div>
                            <div className="text-xs text-gray-500">Service Cost</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-3 text-sm">
                          <div>
                            <label className="text-xs text-gray-600">TV Size</label>
                            <p className="font-medium">{tv.tvSize}"</p>
                          </div>
                          <div>
                            <label className="text-xs text-gray-600">Service Type</label>
                            <p className="font-medium capitalize">{tv.serviceType.replace('-', ' ')}</p>
                          </div>
                          <div>
                            <label className="text-xs text-gray-600">Mount Type</label>
                            <p className="font-medium capitalize">{tv.mountType}</p>
                          </div>
                          <div>
                            <label className="text-xs text-gray-600">Wall Type</label>
                            <p className="font-medium capitalize">{tv.wallType}</p>
                          </div>
                        </div>
                        {tv.addons && tv.addons.length > 0 && (
                          <div className="mt-3">
                            <label className="text-xs text-gray-600">Add-ons</label>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {tv.addons.map((addon: any, addonIndex: number) => (
                                <Badge key={addonIndex} variant="secondary" className="text-xs">
                                  {addon.name} (+€{addon.price})
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Customer Information Section */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3">Customer Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Customer Name</label>
                    <p className="mt-1">{selectedBooking.contactName || selectedBooking.customerName || 'Guest User'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email</label>
                    <p className="mt-1">{selectedBooking.contactEmail || selectedBooking.customerEmail || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Phone</label>
                    <p className="mt-1">{selectedBooking.contactPhone || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Registration Method</label>
                    <p className="mt-1 capitalize">{selectedBooking.registrationMethod || 'Standard'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">User ID</label>
                    <p className="mt-1">{selectedBooking.userId || 'Guest booking'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Invoice Number</label>
                    <p className="mt-1">{selectedBooking.invoiceNumber || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3">Installation Address</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Full Address</label>
                    <p className="mt-1">{selectedBooking.address || 'No address provided'}</p>
                  </div>
                </div>
              </div>

              {/* Service Details Section */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3">Service Specifications</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Wall Type</label>
                    <p className="mt-1 capitalize">{selectedBooking.wallType || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Mount Type</label>
                    <p className="mt-1 capitalize">{selectedBooking.mountType || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Wall Mount Option</label>
                    <p className="mt-1">{selectedBooking.wallMountOption || 'None'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Needs Wall Mount</label>
                    <p className="mt-1">{selectedBooking.needsWallMount ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Soundbar Installation</label>
                    <p className="mt-1">{selectedBooking.soundBarInstallation ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Installation Difficulty</label>
                    <p className="mt-1 capitalize">{selectedBooking.installationDifficulty || 'Standard'}</p>
                  </div>
                </div>
              </div>

              {/* Add-ons Information */}
              {selectedBooking.addons && selectedBooking.addons.length > 0 && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-3">Selected Add-ons</h3>
                  <div className="space-y-2">
                    {selectedBooking.addons.map((addon: any, index: number) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="font-medium">{addon.name}</span>
                        <span className="text-green-600">+€{addon.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pricing Information */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3">Pricing Details</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Base Service Price:</span>
                      <span className="font-medium">€{selectedBooking.estimatedPrice || '0.00'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Add-ons Price:</span>
                      <span className="font-medium">€{selectedBooking.estimatedAddonsPrice || '0.00'}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-medium text-gray-900">Total Customer Price:</span>
                      <span className="font-bold text-lg text-green-600">
                        €{typeof selectedBooking.totalPrice === 'number' ? selectedBooking.totalPrice.toFixed(2) : selectedBooking.totalPrice}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Lead Fee (Platform):</span>
                      <span className="font-medium text-blue-600">
                        €{typeof selectedBooking.leadFee === 'number' ? selectedBooking.leadFee.toFixed(2) : selectedBooking.leadFee}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Installer Earnings:</span>
                      <span className="font-medium text-green-600">
                        €{(
                          (typeof selectedBooking.totalPrice === 'number' ? selectedBooking.totalPrice : parseFloat(selectedBooking.totalPrice || '0')) -
                          (typeof selectedBooking.leadFee === 'number' ? selectedBooking.leadFee : parseFloat(selectedBooking.leadFee || '0'))
                        ).toFixed(2)}
                      </span>
                    </div>
                    {selectedBooking.referralDiscount && parseFloat(selectedBooking.referralDiscount) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Referral Discount:</span>
                        <span className="font-medium text-orange-600">-€{selectedBooking.referralDiscount}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Scheduling Information */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3">Scheduling Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Preferred Date</label>
                    <p className="mt-1">
                      {selectedBooking.preferredDate ? 
                        new Date(selectedBooking.preferredDate).toLocaleDateString('en-IE', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : 'TBD'
                      }
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Preferred Time</label>
                    <p className="mt-1">{selectedBooking.preferredTime || 'TBD'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Scheduled Date</label>
                    <p className="mt-1">
                      {selectedBooking.scheduledDate ? 
                        new Date(selectedBooking.scheduledDate).toLocaleDateString('en-IE') : 'Not scheduled'
                      }
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Time Slot</label>
                    <p className="mt-1">{selectedBooking.timeSlot || 'Flexible'}</p>
                  </div>
                </div>
              </div>

              {/* Installer Information Section */}
              {selectedBooking.installerId && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-3">Assigned Installer</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Installer ID</label>
                      <p className="mt-1">#{selectedBooking.installerId}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Lead Status</label>
                      <p className="mt-1">
                        {selectedBooking.leadPurchased ? 
                          <Badge className="bg-green-100 text-green-800">Lead Purchased</Badge> : 
                          <Badge className="bg-yellow-100 text-yellow-800">Lead Available</Badge>
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* System Information Section */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3">System Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Created</label>
                    <p className="mt-1">{selectedBooking.createdAt ? new Date(selectedBooking.createdAt).toLocaleString() : 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Last Updated</label>
                    <p className="mt-1">{selectedBooking.updatedAt ? new Date(selectedBooking.updatedAt).toLocaleString() : 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">User ID</label>
                    <p className="mt-1">{selectedBooking.userId || 'Guest'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Payment Status</label>
                    <p className="mt-1">{selectedBooking.paymentStatus || 'Direct Payment'}</p>
                  </div>
                </div>
              </div>

              {/* Room Photos and Analysis Section */}
              {(selectedBooking.roomAnalysis || selectedBooking.roomPhotoUrl || selectedBooking.roomPhotoCompressedUrl) && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-3">Room Photos & AI Analysis</h3>
                  
                  {/* Photo Storage Consent Status */}
                  <div className="mb-4">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      selectedBooking.photoStorageConsent 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {selectedBooking.photoStorageConsent ? (
                        <>
                          <Camera className="w-4 h-4 mr-2" />
                          Photos stored with consent
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-4 h-4 mr-2" />
                          No photo storage consent
                        </>
                      )}
                    </div>
                  </div>

                  {/* Room Photos Display */}
                  {selectedBooking.photoStorageConsent && (selectedBooking.roomPhotoUrl || selectedBooking.roomPhotoCompressedUrl) && (
                    <div className="mb-4">
                      <h4 className="font-medium text-sm text-gray-700 mb-2">Room Photos</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedBooking.roomPhotoUrl && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Original Photo</p>
                            <img 
                              src={selectedBooking.roomPhotoUrl}
                              alt="Original room photo" 
                              className="w-full h-48 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => window.open(selectedBooking.roomPhotoUrl, '_blank')}
                            />
                          </div>
                        )}
                        {selectedBooking.roomPhotoCompressedUrl && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Compressed Photo (for bandwidth efficiency)</p>
                            <img 
                              src={selectedBooking.roomPhotoCompressedUrl}
                              alt="Compressed room photo" 
                              className="w-full h-48 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => window.open(selectedBooking.roomPhotoCompressedUrl, '_blank')}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* AI Room Analysis */}
                  {selectedBooking.roomAnalysis && (
                    <div className="bg-gray-50 p-3 rounded space-y-3">
                      <h4 className="font-medium text-sm text-gray-700">AI Room Analysis</h4>
                      {(() => {
                        try {
                          const analysis = typeof selectedBooking.roomAnalysis === 'string' 
                            ? JSON.parse(selectedBooking.roomAnalysis) 
                            : selectedBooking.roomAnalysis;
                          
                          return (
                            <div className="space-y-3">
                              {analysis.recommendations && (
                                <div>
                                  <h5 className="font-medium text-xs text-gray-600 mb-1">Recommendations</h5>
                                  <ul className="text-sm space-y-1">
                                    {analysis.recommendations.map((rec: string, index: number) => (
                                      <li key={index} className="flex items-start">
                                        <span className="text-green-600 mr-2">•</span>
                                        <span>{rec}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              
                              {analysis.warnings && (
                                <div>
                                  <h5 className="font-medium text-xs text-gray-600 mb-1">Warnings</h5>
                                  <ul className="text-sm space-y-1">
                                    {analysis.warnings.map((warning: string, index: number) => (
                                      <li key={index} className="flex items-start">
                                        <span className="text-amber-600 mr-2">⚠</span>
                                        <span>{warning}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              
                              {analysis.difficultyAssessment && (
                                <div>
                                  <h5 className="font-medium text-xs text-gray-600 mb-1">Difficulty Assessment</h5>
                                  <div className="text-sm bg-white p-2 rounded border">
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <span className="text-gray-600">Level:</span>
                                        <span className={`ml-2 px-2 py-1 rounded text-xs ${
                                          analysis.difficultyAssessment.level === 'easy' ? 'bg-green-100 text-green-800' :
                                          analysis.difficultyAssessment.level === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                                          analysis.difficultyAssessment.level === 'difficult' ? 'bg-orange-100 text-orange-800' :
                                          'bg-red-100 text-red-800'
                                        }`}>
                                          {analysis.difficultyAssessment.level}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-gray-600">Time:</span>
                                        <span className="ml-2">{analysis.difficultyAssessment.estimatedTime}</span>
                                      </div>
                                      {analysis.difficultyAssessment.factors && (
                                        <div className="col-span-2">
                                          <span className="text-gray-600">Factors:</span>
                                          <span className="ml-2">{analysis.difficultyAssessment.factors.join(', ')}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {analysis.confidence && (
                                <div>
                                  <h5 className="font-medium text-xs text-gray-600 mb-1">Analysis Confidence</h5>
                                  <div className="text-sm">
                                    <span className={`px-2 py-1 rounded text-xs ${
                                      analysis.confidence === 'high' ? 'bg-green-100 text-green-800' :
                                      analysis.confidence === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-red-100 text-red-800'
                                    }`}>
                                      {analysis.confidence} confidence
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        } catch (error) {
                          // Fallback for non-JSON room analysis
                          return <p className="text-sm">{selectedBooking.roomAnalysis}</p>;
                        }
                      })()}
                    </div>
                  )}
                </div>
              )}

              {/* Additional Notes Section */}
              {selectedBooking.notes && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-3">Additional Notes</h3>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm">{selectedBooking.notes}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Booking Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent aria-describedby="booking-edit-description">
          <DialogHeader>
            <DialogTitle>Edit Booking Status</DialogTitle>
            <DialogDescription id="booking-edit-description">
              Update the status of this booking
            </DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Current Status</label>
                <Badge className={getStatusColor(selectedBooking.status)}>
                  {selectedBooking.status}
                </Badge>
              </div>
              <div>
                <label className="text-sm font-medium">New Status</label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="installer_accepted">Installer Accepted</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleStatusUpdate}
                  disabled={updateBookingStatusMutation.isPending}
                >
                  {updateBookingStatusMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Status'
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Booking Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent aria-describedby="booking-delete-description">
          <DialogHeader>
            <DialogTitle>Delete Booking</DialogTitle>
            <DialogDescription id="booking-delete-description">
              Are you sure you want to permanently delete this booking? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-red-800">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-medium">Warning: Complete Data Deletion</span>
                </div>
                <p className="text-sm text-red-700 mt-2">
                  This will permanently remove booking {selectedBooking.qrCode} and <strong>ALL associated data</strong> from the database including:
                </p>
                <ul className="text-sm text-red-700 mt-2 ml-4 list-disc space-y-1">
                  <li>All job assignments and purchased leads</li>
                  <li>Customer reviews and ratings</li>
                  <li>Schedule negotiations</li>
                  <li>Wallet transactions and refunds</li>
                  <li>Photos (room photos, completion photos, AI previews)</li>
                  <li>Notifications and system messages</li>
                  <li>Fraud prevention reports</li>
                  <li>Referral usage records</li>
                </ul>
                <p className="text-sm text-red-700 mt-2">
                  The customer will be notified via email about the cancellation.
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium mb-2">Booking Details:</h4>
                <div className="text-sm space-y-1">
                  <p><strong>Customer:</strong> {selectedBooking.contactName}</p>
                  <p><strong>Email:</strong> {selectedBooking.contactEmail}</p>
                  <p><strong>Service:</strong> {selectedBooking.serviceType}</p>
                  <p><strong>Status:</strong> {selectedBooking.status}</p>
                  <p><strong>QR Code:</strong> {selectedBooking.qrCode}</p>
                  {selectedBooking.installerId && (
                    <p><strong>Assigned Installer:</strong> ID #{selectedBooking.installerId}</p>
                  )}
                </div>
              </div>

              {deletionInfo && deletionInfo.canForceDelete && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-orange-800">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="font-medium">Active Booking - Force Delete Available</span>
                  </div>
                  <p className="text-sm text-orange-700 mt-2">
                    This booking is currently <strong>{deletionInfo.currentStatus || 'active'}</strong> and {deletionInfo.assignedInstaller ? 'assigned to an installer' : 'in progress'}.
                    You can force delete it, but this may impact the customer and installer experience.
                  </p>
                  <div className="mt-3 flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="forceDelete"
                      checked={forceDelete}
                      onChange={(e) => setForceDelete(e.target.checked)}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <label htmlFor="forceDelete" className="text-sm font-medium text-orange-800">
                      I understand the risks and want to force delete this booking
                    </label>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={resetDeleteDialog}>
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={confirmDeleteBooking}
                  disabled={deleteBookingMutation.isPending || (deletionInfo && deletionInfo.canForceDelete && !forceDelete)}
                >
                  {deleteBookingMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {forceDelete ? 'Force Deleting...' : 'Deleting...'}
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      {forceDelete ? 'Force Delete Booking' : 'Delete Booking'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// Banned Users Management Component
function BannedUsersManagement() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [banReason, setBanReason] = useState("");
  const [banType, setBanType] = useState<"user" | "installer">("user");
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [showUnbanDialog, setShowUnbanDialog] = useState(false);
  const queryClient = useQueryClient();

  // Listen for ban dialog triggers from other components
  React.useEffect(() => {
    const handleOpenBanDialog = (event: any) => {
      const user = event.detail;
      if (user) {
        setSelectedUser(user);
        setBanType(user.role === 'installer' ? 'installer' : 'user');
        setShowBanDialog(true);
      }
    };

    window.addEventListener('openBanDialog', handleOpenBanDialog);
    return () => window.removeEventListener('openBanDialog', handleOpenBanDialog);
  }, []);

  // Fetch banned users
  const { data: bannedUsers = [], isLoading: bannedUsersLoading } = useQuery({
    queryKey: ['/api/admin/banned-users'],
    queryFn: () => fetch('/api/admin/banned-users', {
      credentials: 'include'  // Use session cookies for authentication
    }).then(r => r.json())
  });

  // Ban user mutation
  const banMutation = useMutation({
    mutationFn: async (data: { email: string; banType: string; reason: string }) => {
      const response = await fetch('/api/admin/banned-users', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to ban user');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/banned-users'] });
      setShowBanDialog(false);
      setBanReason("");
      setSelectedUser(null);
    }
  });

  // Unban user mutation
  const unbanMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/banned-users/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to unban user');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/banned-users'] });
      setShowUnbanDialog(false);
      setSelectedUser(null);
    }
  });

  const handleBanUser = (user: any) => {
    setSelectedUser(user);
    setBanType(user.role === 'installer' ? 'installer' : 'user');
    setShowBanDialog(true);
  };

  const handleUnbanUser = (bannedUser: any) => {
    setSelectedUser(bannedUser);
    setShowUnbanDialog(true);
  };

  const submitBan = () => {
    if (!selectedUser || !banReason.trim()) return;
    
    banMutation.mutate({
      email: selectedUser.email,
      banType,
      reason: banReason.trim()
    });
  };

  const submitUnban = () => {
    if (!selectedUser) return;
    unbanMutation.mutate(selectedUser.id);
  };

  if (bannedUsersLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span>Loading banned users...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Banned Users Management</h2>
          <p className="text-gray-600">Manage banned users and installers on the platform</p>
        </div>
      </div>

      {/* Banned Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Ban className="w-5 h-5 mr-2 text-red-600" />
            Banned Users ({bannedUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bannedUsers.length === 0 ? (
            <div className="text-center py-8">
              <Ban className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No banned users found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bannedUsers.map((bannedUser: any) => (
                <div key={bannedUser.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{bannedUser.email}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          bannedUser.banType === 'installer' 
                            ? 'bg-orange-100 text-orange-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {bannedUser.banType === 'installer' ? 'Installer' : 'Customer'}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          bannedUser.isActive 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {bannedUser.isActive ? 'Active Ban' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        <strong>Reason:</strong> {bannedUser.reason}
                      </p>
                      <p className="text-xs text-gray-500">
                        Banned on {new Date(bannedUser.bannedAt).toLocaleDateString()} by Admin ID: {bannedUser.bannedBy}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      {bannedUser.isActive && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUnbanUser(bannedUser)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <UserCheck className="w-4 h-4 mr-1" />
                          Unban
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ban User Dialog */}
      <Dialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban User</DialogTitle>
            <DialogDescription>
              You are about to ban {selectedUser?.email}. This action will prevent them from accessing the platform.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="ban-type">Ban Type</Label>
              <Select value={banType} onValueChange={(value: "user" | "installer") => setBanType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Customer</SelectItem>
                  <SelectItem value="installer">Installer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="ban-reason">Reason for Ban</Label>
              <Textarea
                id="ban-reason"
                placeholder="Enter reason for banning this user..."
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowBanDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={submitBan}
              disabled={!banReason.trim() || banMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {banMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Banning...
                </>
              ) : (
                <>
                  <Ban className="w-4 h-4 mr-2" />
                  Ban User
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Unban User Dialog */}
      <Dialog open={showUnbanDialog} onOpenChange={setShowUnbanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unban User</DialogTitle>
            <DialogDescription>
              Are you sure you want to unban {selectedUser?.email}? They will regain access to the platform.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowUnbanDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={submitUnban}
              disabled={unbanMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {unbanMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Unbanning...
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4 mr-2" />
                  Unban User
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Platform Insights Component
function SystemMetrics() {
  const { data: insights } = useQuery({
    queryKey: ['/api/admin/platform-insights'],
    queryFn: () => fetch('/api/admin/platform-insights').then(r => r.json())
  });

  const { data: serviceTiers } = useQuery({
    queryKey: ['/api/service-tiers'],
    queryFn: () => fetch('/api/service-tiers').then(r => r.json())
  });

  // Fetch geocoded installation data for map display
  const { data: geocodedInstallations, isLoading: mapLoading } = useQuery({
    queryKey: ['/api/installations/geocoded'],
    retry: false,
  });

  // Use real data from API instead of simulated values
  const totalLeadRevenue = insights?.monthlyLeadRevenue || 0;
  const averageLeadValue = insights?.averageLeadValue || 0;
  const leadConversionRate = insights?.leadConversionRate?.toFixed(1) || "0.0";
  const installerRetentionRate = insights?.installerRetentionRate?.toFixed(1) || "0.0";

  const insightCards = [
    { 
      label: "Monthly Lead Revenue", 
      value: `€${totalLeadRevenue.toFixed(0)}`, 
      icon: Euro, 
      color: "text-green-600",
      description: "Platform revenue from lead fees"
    },
    { 
      label: "Avg Lead Value", 
      value: `€${averageLeadValue.toFixed(0)}`, 
      icon: Target, 
      color: "text-blue-600",
      description: "Average lead fee across all services"
    },
    { 
      label: "Lead Conversion Rate", 
      value: `${leadConversionRate}%`, 
      icon: TrendingUp, 
      color: "text-purple-600",
      description: "Requests that become active jobs"
    },
    { 
      label: "Installer Retention", 
      value: `${installerRetentionRate}%`, 
      icon: Users, 
      color: "text-orange-600",
      description: "Installers active month-over-month"
    },
  ];

  return (
    <div className="space-y-6">
      {/* Key Platform Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {insightCards.map((card, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                </div>
                <card.icon className={`h-6 w-6 ${card.color}`} />
              </div>
              <p className="text-xs text-gray-500">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Revenue Breakdown by Service Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {serviceTiers?.map((tier: any) => {
              const serviceData = insights?.serviceBreakdown?.[tier.key];
              const monthlyLeads = serviceData?.count || 0;
              const monthlyRevenue = serviceData?.revenue || 0;
              
              return (
                <div key={tier.id} className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{tier.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      €{tier.leadFee} × {monthlyLeads} leads this month
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">€{monthlyRevenue}</div>
                    <div className="text-xs text-muted-foreground">
                      {monthlyLeads > 0 ? 'Actual Revenue' : 'No Leads Yet'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Addon Revenue */}
          {insights?.addonRevenue > 0 && (
            <div className="mt-4 p-4 border rounded-lg bg-blue-50">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium">Addon Services Revenue</h4>
                  <p className="text-sm text-muted-foreground">
                    Cable concealment, soundbar mounting, additional devices
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-600">€{insights.addonRevenue}</div>
                  <div className="text-xs text-muted-foreground">This Month</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Platform Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Platform Health Indicators
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600 mb-2">80-91%</div>
              <div className="text-sm font-medium text-gray-600">Installer Margins</div>
              <div className="text-xs text-gray-500">High profitability attracts quality installers</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-2">€12-€35</div>
              <div className="text-sm font-medium text-gray-600">Lead Fee Range</div>
              <div className="text-xs text-gray-500">Competitive pricing for marketplace access</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600 mb-2">
                €{insights?.annualRevenueProjection ? Math.round(insights.annualRevenueProjection / 1000) : 0}K
              </div>
              <div className="text-sm font-medium text-gray-600">Annual Revenue Est.</div>
              <div className="text-xs text-gray-500">Based on current monthly trends</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Installation Coverage Map */}
      <div className="col-span-full">
        <IrelandMap 
          installations={geocodedInstallations || []} 
          isLoading={mapLoading}
          showLegend={true}
          height="500px"
        />
      </div>
    </div>
  );
}

// Lead Fee Management Component - Tracks installer payments to platform
function PaymentManagement() {
  const { data: leadPayments, isLoading } = useQuery({
    queryKey: ["/api/admin/lead-payments"],
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

  const transactions = leadPayments?.transactions || [];
  
  // Platform revenue includes both credit purchases and lead fees from verified installers
  const creditPurchases = transactions.filter((t: any) => t.status === 'completed' && t.type === 'credit_purchase');
  const leadFeePaid = transactions.filter((t: any) => t.status === 'completed' && t.type === 'lead_fee');
  const pendingPayments = transactions.filter((t: any) => t.status === 'pending' && (t.type === 'lead_fee' || t.type === 'credit_purchase'));
  const failedPayments = transactions.filter((t: any) => t.status === 'failed' && (t.type === 'lead_fee' || t.type === 'credit_purchase'));

  // Calculate total platform revenue (credit purchases + lead fees)
  const totalCreditRevenue = creditPurchases.reduce((sum: number, t: any) => sum + Math.abs(parseFloat(t.amount || '0')), 0);
  const totalLeadFeeRevenue = leadFeePaid.reduce((sum: number, t: any) => sum + Math.abs(parseFloat(t.amount || '0')), 0);
  const totalPlatformRevenue = totalCreditRevenue + totalLeadFeeRevenue;

  return (
    <div className="space-y-6">
      {/* Platform Revenue Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Credit Purchases</p>
                <p className="text-lg sm:text-2xl font-bold text-green-600">{creditPurchases.length}</p>
              </div>
              <UserCheck className="h-5 w-5 sm:h-8 sm:w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Lead Fees Paid</p>
                <p className="text-lg sm:text-2xl font-bold text-purple-600">{leadFeePaid.length}</p>
              </div>
              <Clock className="h-5 w-5 sm:h-8 sm:w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Failed Payments</p>
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
                <p className="text-xs sm:text-sm font-medium text-gray-600">Platform Revenue</p>
                <p className="text-lg sm:text-2xl font-bold text-emerald-600">€{totalPlatformRevenue.toFixed(2)}</p>
              </div>
              <Euro className="h-5 w-5 sm:h-8 sm:w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lead Fee Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="w-5 h-5 mr-2" />
            Lead Fee Transactions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2 sm:p-6">
          {/* Mobile Card View */}
          <div className="block md:hidden space-y-3">
            {transactions.map((transaction: any) => (
              <div key={transaction.id} className="bg-gray-50 p-3 rounded-lg border">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-medium">#{transaction.id}</span>
                  <Badge 
                    variant={
                      transaction.status === 'completed' ? 'default' :
                      transaction.status === 'pending' ? 'secondary' :
                      'destructive'
                    }
                  >
                    {transaction.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Amount:</span>
                    <div className="font-medium">€{Math.abs(parseFloat(transaction.amount || '0')).toFixed(2)}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Date:</span>
                    <div className="font-medium">
                      {transaction.createdAt ? new Date(transaction.createdAt).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">Installer:</span>
                    <div className="font-medium">{transaction.installerName || `Installer #${transaction.installerId}`}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Installer</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction: any) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">#{transaction.id}</TableCell>
                    <TableCell>€{Math.abs(parseFloat(transaction.amount || '0')).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          transaction.status === 'completed' ? 'default' :
                          transaction.status === 'pending' ? 'secondary' :
                          'destructive'
                        }
                      >
                        {transaction.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {transaction.createdAt ? new Date(transaction.createdAt).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell>{transaction.installerName || `Installer #${transaction.installerId}`}</TableCell>
                    <TableCell className="text-sm text-gray-600">{transaction.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {transactions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No lead fee transactions found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Solar Enquiry Management Component for OHK Energy leads
function SolarEnquiryManagement() {
  const { data: solarEnquiries, isLoading } = useQuery<SolarEnquiry[]>({
    queryKey: ["/api/solar-enquiries"],
    retry: false,
  });

  const [selectedEnquiry, setSelectedEnquiry] = useState<SolarEnquiry | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showEditStatus, setShowEditStatus] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingEnquiry, setEditingEnquiry] = useState<SolarEnquiry | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const availableStatuses = [
    { value: 'new', label: 'New', color: 'bg-blue-100 text-blue-800' },
    { value: 'contacted', label: 'Contacted', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'qualified', label: 'Qualified', color: 'bg-green-100 text-green-800' },
    { value: 'site_survey', label: 'Site Survey Scheduled', color: 'bg-purple-100 text-purple-800' },
    { value: 'quoted', label: 'Quote Provided', color: 'bg-indigo-100 text-indigo-800' },
    { value: 'converted', label: 'Converted/Sale', color: 'bg-emerald-100 text-emerald-800' },
    { value: 'not_interested', label: 'Not Interested', color: 'bg-red-100 text-red-800' },
    { value: 'lost', label: 'Lost to Competitor', color: 'bg-gray-100 text-gray-800' },
    { value: 'follow_up', label: 'Follow Up Required', color: 'bg-orange-100 text-orange-800' }
  ];

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiRequest("PATCH", `/api/solar-enquiries/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/solar-enquiries"] });
      setShowEditStatus(false);
      setEditingEnquiry(null);
      toast({
        title: "Status Updated",
        description: "Solar enquiry status has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update enquiry status.",
        variant: "destructive",
      });
    },
  });

  const deleteEnquiryMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/solar-enquiries/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/solar-enquiries"] });
      setShowDeleteConfirm(false);
      setEditingEnquiry(null);
      toast({
        title: "Lead Deleted",
        description: "Solar enquiry has been permanently deleted from the database.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete enquiry.",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    const statusObj = availableStatuses.find(s => s.value === status);
    return statusObj ? statusObj.color : 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p>Loading OHK Energy leads...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const enquiriesByStatus = {
    new: solarEnquiries?.filter(e => e.status === 'new') || [],
    contacted: solarEnquiries?.filter(e => e.status === 'contacted') || [],
    qualified: solarEnquiries?.filter(e => e.status === 'qualified') || [],
    converted: solarEnquiries?.filter(e => e.status === 'converted') || [],
    not_interested: solarEnquiries?.filter(e => e.status === 'not_interested') || [],
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{enquiriesByStatus.new.length}</div>
              <div className="text-sm text-blue-700">New Leads</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{enquiriesByStatus.contacted.length}</div>
              <div className="text-sm text-yellow-700">Contacted</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{enquiriesByStatus.qualified.length}</div>
              <div className="text-sm text-green-700">Qualified</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">{enquiriesByStatus.converted.length}</div>
              <div className="text-sm text-emerald-700">Converted</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{solarEnquiries?.length || 0}</div>
              <div className="text-sm text-gray-700">Total Leads</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enquiries Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            OHK Energy Solar Leads
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Mobile Card View */}
          <div className="block md:hidden space-y-3">
            {solarEnquiries?.map((enquiry) => (
              <div key={enquiry.id} className="bg-gray-50 p-4 rounded-lg border">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-medium">{enquiry.firstName} {enquiry.lastName}</h3>
                    <p className="text-sm text-gray-600">{enquiry.email}</p>
                  </div>
                  <Badge className={getStatusColor(enquiry.status)}>
                    {enquiry.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                  <div>
                    <span className="text-gray-500">Location:</span>
                    <div className="font-medium">{enquiry.county}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Property:</span>
                    <div className="font-medium">{enquiry.propertyType}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Bill Range:</span>
                    <div className="font-medium">{enquiry.electricityBill}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Timeframe:</span>
                    <div className="font-medium">{enquiry.timeframe}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedEnquiry(enquiry);
                      setShowDetails(true);
                    }}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingEnquiry(enquiry);
                      setNewStatus(enquiry.status);
                      setShowEditStatus(true);
                    }}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit Status
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => {
                      setEditingEnquiry(enquiry);
                      setShowDeleteConfirm(true);
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Property Details</TableHead>
                  <TableHead>Bill Range</TableHead>
                  <TableHead>Timeframe</TableHead>
                  <TableHead>SEAI Grants</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {solarEnquiries?.map((enquiry) => (
                  <TableRow key={enquiry.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{enquiry.firstName} {enquiry.lastName}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{enquiry.email}</div>
                        <div className="text-gray-500">{enquiry.phone}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{enquiry.county}</div>
                        <div className="text-gray-500 max-w-32 truncate">{enquiry.address}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{enquiry.propertyType}</div>
                        <div className="text-gray-500">{enquiry.roofType}</div>
                      </div>
                    </TableCell>
                    <TableCell>{enquiry.electricityBill}</TableCell>
                    <TableCell>{enquiry.timeframe}</TableCell>
                    <TableCell>
                      <Badge variant={enquiry.grants ? "default" : "secondary"}>
                        {enquiry.grants ? "Yes" : "No"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(enquiry.status)}>
                        {availableStatuses.find(s => s.value === enquiry.status)?.label || enquiry.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(enquiry.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedEnquiry(enquiry);
                            setShowDetails(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingEnquiry(enquiry);
                            setNewStatus(enquiry.status);
                            setShowEditStatus(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => {
                            setEditingEnquiry(enquiry);
                            setShowDeleteConfirm(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {(!solarEnquiries || solarEnquiries.length === 0) && (
            <div className="text-center py-8 text-gray-500">
              No solar enquiries found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enquiry Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Solar Enquiry Details</DialogTitle>
            <DialogDescription>
              Complete enquiry information for OHK Energy partnership
            </DialogDescription>
          </DialogHeader>
          {selectedEnquiry && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Customer Name</label>
                  <p>{selectedEnquiry.firstName} {selectedEnquiry.lastName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Badge className={getStatusColor(selectedEnquiry.status)}>
                    {selectedEnquiry.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <p>{selectedEnquiry.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <p>{selectedEnquiry.phone}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium">Address</label>
                  <p>{selectedEnquiry.address}, {selectedEnquiry.county}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Property Type</label>
                  <p>{selectedEnquiry.propertyType}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Roof Type</label>
                  <p>{selectedEnquiry.roofType}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Monthly Electricity Bill</label>
                  <p>{selectedEnquiry.electricityBill}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Installation Timeframe</label>
                  <p>{selectedEnquiry.timeframe}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">SEAI Grants Interest</label>
                  <p>{selectedEnquiry.grants ? 'Yes - Interested in grants' : 'No - Not interested in grants'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Enquiry Date</label>
                  <p>{new Date(selectedEnquiry.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              {selectedEnquiry.additionalInfo && (
                <div>
                  <label className="text-sm font-medium">Additional Information</label>
                  <p className="text-sm bg-gray-50 p-3 rounded-lg">{selectedEnquiry.additionalInfo}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Status Edit Dialog */}
      <Dialog open={showEditStatus} onOpenChange={setShowEditStatus}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Lead Status</DialogTitle>
            <DialogDescription>
              Update the status of this solar enquiry to track the lead progression
            </DialogDescription>
          </DialogHeader>
          {editingEnquiry && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Customer</label>
                <p className="font-medium">{editingEnquiry.firstName} {editingEnquiry.lastName}</p>
                <p className="text-sm text-gray-600">{editingEnquiry.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Current Status</label>
                <Badge className={getStatusColor(editingEnquiry.status)}>
                  {availableStatuses.find(s => s.value === editingEnquiry.status)?.label || editingEnquiry.status.replace('_', ' ')}
                </Badge>
              </div>
              <div>
                <label className="text-sm font-medium">New Status</label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select new status" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStatuses.map(status => (
                      <SelectItem key={status.value} value={status.value}>
                        <div className="flex items-center space-x-2">
                          <Badge className={status.color} variant="outline">
                            {status.label}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowEditStatus(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (newStatus && editingEnquiry) {
                      updateStatusMutation.mutate({ id: editingEnquiry.id, status: newStatus });
                    }
                  }}
                  disabled={!newStatus || updateStatusMutation.isPending}
                >
                  {updateStatusMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Status'
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Solar Lead</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The lead will be permanently removed from the database.
            </DialogDescription>
          </DialogHeader>
          {editingEnquiry && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-red-800">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-medium">Warning: Permanent Deletion</span>
                </div>
                <p className="text-red-700 text-sm mt-2">
                  You are about to permanently delete this solar enquiry. This action cannot be undone and all data will be lost.
                </p>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">Lead to be deleted:</h4>
                <div className="text-sm space-y-1">
                  <p><span className="font-medium">Customer:</span> {editingEnquiry.firstName} {editingEnquiry.lastName}</p>
                  <p><span className="font-medium">Email:</span> {editingEnquiry.email}</p>
                  <p><span className="font-medium">Status:</span> {availableStatuses.find(s => s.value === editingEnquiry.status)?.label || editingEnquiry.status.replace('_', ' ')}</p>
                  <p><span className="font-medium">Created:</span> {new Date(editingEnquiry.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (editingEnquiry) {
                      deleteEnquiryMutation.mutate(editingEnquiry.id);
                    }
                  }}
                  disabled={deleteEnquiryMutation.isPending}
                >
                  {deleteEnquiryMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Permanently
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Referral Management Component
function ReferralManagement() {
  const [referralReward, setReferralReward] = useState(25);
  const [globalDiscountPercentage, setGlobalDiscountPercentage] = useState(10);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editingCode, setEditingCode] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: referralStats } = useQuery({
    queryKey: ['/api/referrals/stats'],
    queryFn: () => fetch('/api/referrals/stats').then(r => r.json())
  });

  const { data: referralCodes, error: referralCodesError } = useQuery({
    queryKey: ['/api/referrals/codes'],
    queryFn: async () => {
      const response = await fetch('/api/referrals/codes');
      if (!response.ok) {
        throw new Error('Failed to fetch referral codes');
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    retry: 1
  });

  const { data: referralSettings } = useQuery({
    queryKey: ['/api/referrals/settings'],
    queryFn: () => fetch('/api/referrals/settings').then(r => r.json())
  });

  // Update local state when settings are loaded
  React.useEffect(() => {
    if (referralSettings) {
      setReferralReward(referralSettings.referralReward);
      setGlobalDiscountPercentage(referralSettings.globalDiscountPercentage);
    }
  }, [referralSettings]);

  // Fetch detailed referral usage for earnings tracking
  const { data: referralUsage } = useQuery({
    queryKey: ['/api/referrals/usage'],
    queryFn: () => fetch('/api/referrals/usage').then(r => r.json())
  });

  // Create referral code mutation
  const createReferralCodeMutation = useMutation({
    mutationFn: async (data: ReferralCodeFormData) => {
      const response = await fetch('/api/referrals/codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create referral code');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/referrals/codes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/referrals/stats'] });
      setShowCreateDialog(false);
      toast({ title: "Referral code created successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error creating referral code", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });

  // Update referral code mutation
  const updateReferralCodeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ReferralCodeFormData }) => {
      const response = await fetch(`/api/referrals/codes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: data.code,
          discountPercentage: data.discountPercentage,
          isActive: data.isActive,
          referralType: data.referralType,
          salesStaffName: data.salesStaffName,
          salesStaffStore: data.salesStaffStore
        })
      });
      if (!response.ok) throw new Error('Failed to update referral code');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/referrals/codes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/referrals/stats'] });
      setShowEditDialog(false);
      setEditingCode(null);
      toast({ title: "Referral code updated successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error updating referral code", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });

  // Delete referral code mutation
  const deleteReferralCodeMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/referrals/codes/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete referral code');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/referrals/codes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/referrals/stats'] });
      toast({ title: "Referral code deleted successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error deleting referral code", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });

  const updateReferralSettings = useMutation({
    mutationFn: async (settings: { globalDiscountPercentage: number }) => {
      const response = await apiRequest('PUT', '/api/referrals/settings', settings);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Referral settings updated successfully"
      });
      setIsUpdating(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update referral settings",
        variant: "destructive"
      });
      setIsUpdating(false);
    }
  });







  const handleUpdateSettings = () => {
    setIsUpdating(true);
    updateReferralSettings.mutate({
      globalDiscountPercentage: globalDiscountPercentage
    });
  };

  return (
    <div className="space-y-6">
      {/* Referral Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Referrals</p>
                <p className="text-2xl font-bold text-gray-900">
                  {referralStats?.totalReferrals || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Euro className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rewards Paid</p>
                <p className="text-2xl font-bold text-gray-900">
                  €{referralStats?.totalRewardsPaid || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Percent className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Codes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {referralStats?.activeCodes || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {referralStats?.conversionRate || 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referral Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Referral Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="globalDiscountPercentage">Global Discount Percentage (%)</Label>
            <Input
              id="globalDiscountPercentage"
              type="number"
              value={globalDiscountPercentage}
              onChange={(e) => setGlobalDiscountPercentage(Number(e.target.value))}
              min="5"
              max="25"
              step="1"
            />
            <p className="text-sm text-gray-500">
              Unified discount percentage applied to all referral codes
            </p>
          </div>

          <Button 
            onClick={handleUpdateSettings}
            disabled={isUpdating}
            className="w-full md:w-auto"
          >
            {isUpdating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Update Settings
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Active Referral Codes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Active Referral Codes
            </CardTitle>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Code
                </Button>
              </DialogTrigger>
              <DialogContent aria-describedby="create-referral-description">
                <DialogHeader>
                  <DialogTitle>Create New Referral Code</DialogTitle>
                  <DialogDescription id="create-referral-description">
                    Create a new referral code for tracking client earnings and discounts.
                  </DialogDescription>
                </DialogHeader>
                <ReferralCodeForm
                  onSubmit={(data) => createReferralCodeMutation.mutate(data)}
                  onCancel={() => setShowCreateDialog(false)}
                  isLoading={createReferralCodeMutation.isPending}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Referral Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Referrer</TableHead>
                  <TableHead>Discount %</TableHead>
                  <TableHead>Uses</TableHead>
                  <TableHead>Earnings</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {referralCodesError ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-red-500">
                      Failed to load referral codes. Please refresh the page.
                    </TableCell>
                  </TableRow>
                ) : (referralCodes || []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-gray-500">
                      No referral codes found
                    </TableCell>
                  </TableRow>
                ) : (referralCodes || []).map((code: any) => (
                  <TableRow key={code.id}>
                    <TableCell className="font-mono">{code.referralCode}</TableCell>
                    <TableCell>
                      <Badge variant={code.referralType === 'sales_staff' ? 'outline' : 'default'}>
                        {code.referralType === 'sales_staff' ? 'Staff' : 'Customer'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {code.referralType === 'sales_staff' 
                        ? `${code.salesStaffName} (${code.salesStaffStore})`
                        : (code.referrerName || 'Customer')
                      }
                    </TableCell>
                    <TableCell>{globalDiscountPercentage}%</TableCell>
                    <TableCell>{code.totalReferrals}</TableCell>
                    <TableCell>€{parseFloat(code.totalEarnings || "0").toFixed(2)}</TableCell>
                    <TableCell>
                      {new Date(code.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={code.isActive ? "default" : "secondary"}>
                        {code.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingCode(code);
                            setShowEditDialog(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this referral code?')) {
                              deleteReferralCodeMutation.mutate(code.id);
                            }
                          }}
                          disabled={deleteReferralCodeMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {/* Usage Tracking Section */}
            {referralUsage && referralUsage.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">Recent Referral Usage</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code Used</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Booking ID</TableHead>
                      <TableHead>Discount Applied</TableHead>
                      <TableHead>Reward Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {referralUsage.slice(0, 10).map((usage: any) => (
                      <TableRow key={usage.id}>
                        <TableCell className="font-mono">{usage.referralCode || 'N/A'}</TableCell>
                        <TableCell>{usage.customerName || usage.customerEmail || 'Guest'}</TableCell>
                        <TableCell>#{usage.tvSetupBookingId || usage.bookingId || 'N/A'}</TableCell>
                        <TableCell>€{parseFloat(usage.discountAmount || "0").toFixed(2)}</TableCell>
                        <TableCell>€{parseFloat(usage.rewardAmount || "0").toFixed(2)}</TableCell>
                        <TableCell>
                          {new Date(usage.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={usage.status === 'completed' ? 'default' : 'secondary'}>
                            {usage.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent aria-describedby="edit-referral-description">
          <DialogHeader>
            <DialogTitle>Edit Referral Code</DialogTitle>
            <DialogDescription id="edit-referral-description">
              Modify referral code settings and track earnings accurately.
            </DialogDescription>
          </DialogHeader>
          {editingCode && (
            <ReferralCodeForm
              code={editingCode}
              onSubmit={(data) => updateReferralCodeMutation.mutate({ id: editingCode.id, data })}
              onCancel={() => {
                setShowEditDialog(false);
                setEditingCode(null);
              }}
              isLoading={updateReferralCodeMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Lead Fee Transactions Management Component with Pagination
function TransactionManagement() {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTransactions, setSelectedTransactions] = useState<number[]>([]);
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [bulkDeleteDays, setBulkDeleteDays] = useState<number>(30);
  
  const { data: leadPayments, isLoading, refetch } = useQuery({
    queryKey: ["/api/admin/lead-payments", currentPage],
    queryFn: () => fetch(`/api/admin/lead-payments?page=${currentPage}&limit=25`).then(r => r.json()),
    retry: false,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteTransactionMutation = useMutation({
    mutationFn: async (transactionId: number) => {
      const response = await fetch(`/api/admin/lead-payments/${transactionId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete transaction');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Transaction Deleted",
        description: "Transaction has been permanently removed from the database.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/lead-payments"] });
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (data: { transactionIds?: number[]; olderThanDays?: number }) => {
      const response = await fetch('/api/admin/lead-payments/bulk', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to bulk delete transactions');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Bulk Delete Successful",
        description: `Successfully deleted ${data.deletedCount} transaction(s).`,
      });
      setSelectedTransactions([]);
      setShowBulkDelete(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/lead-payments"] });
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Bulk Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDeleteTransaction = (transactionId: number) => {
    if (confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) {
      deleteTransactionMutation.mutate(transactionId);
    }
  };

  const handleBulkDeleteSelected = () => {
    if (selectedTransactions.length === 0) {
      toast({
        title: "No Transactions Selected",
        description: "Please select transactions to delete.",
        variant: "destructive",
      });
      return;
    }
    
    if (confirm(`Are you sure you want to delete ${selectedTransactions.length} selected transaction(s)? This action cannot be undone.`)) {
      bulkDeleteMutation.mutate({ transactionIds: selectedTransactions });
    }
  };

  const handleBulkDeleteByDate = () => {
    if (confirm(`Are you sure you want to delete all transactions older than ${bulkDeleteDays} days? This action cannot be undone.`)) {
      bulkDeleteMutation.mutate({ olderThanDays: bulkDeleteDays });
    }
  };

  const toggleTransactionSelection = (transactionId: number) => {
    setSelectedTransactions(prev =>
      prev.includes(transactionId)
        ? prev.filter(id => id !== transactionId)
        : [...prev, transactionId]
    );
  };

  const toggleSelectAll = () => {
    const allTransactionIds = transactions.map((t: any) => t.id);
    setSelectedTransactions(prev =>
      prev.length === allTransactionIds.length ? [] : allTransactionIds
    );
  };

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

  const transactions = leadPayments?.transactions || [];
  const pagination = leadPayments?.pagination || {};
  
  // Platform revenue includes both credit purchases and lead fees from verified installers
  const creditPurchases = transactions.filter((t: any) => t.status === 'completed' && t.type === 'credit_purchase');
  const leadFeePaid = transactions.filter((t: any) => t.status === 'completed' && t.type === 'lead_fee');
  const pendingPayments = transactions.filter((t: any) => t.status === 'pending' && (t.type === 'lead_fee' || t.type === 'credit_purchase'));
  const failedPayments = transactions.filter((t: any) => t.status === 'failed' && (t.type === 'lead_fee' || t.type === 'credit_purchase'));

  // Calculate total platform revenue (credit purchases + lead fees)
  const totalCreditRevenue = creditPurchases.reduce((sum: number, t: any) => sum + Math.abs(parseFloat(t.amount || '0')), 0);
  const totalLeadFeeRevenue = leadFeePaid.reduce((sum: number, t: any) => sum + Math.abs(parseFloat(t.amount || '0')), 0);
  const totalPlatformRevenue = totalCreditRevenue + totalLeadFeeRevenue;

  return (
    <div className="space-y-6">
      {/* Platform Revenue Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Credit Purchases</p>
                <p className="text-lg sm:text-2xl font-bold text-green-600">{creditPurchases.length}</p>
              </div>
              <UserCheck className="h-5 w-5 sm:h-8 sm:w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Lead Fees Paid</p>
                <p className="text-lg sm:text-2xl font-bold text-purple-600">{leadFeePaid.length}</p>
              </div>
              <Clock className="h-5 w-5 sm:h-8 sm:w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Failed Payments</p>
                <p className="text-lg sm:text-2xl font-bold text-red-600">{failedPayments.length}</p>
              </div>
              <XCircle className="h-5 w-5 sm:h-8 sm:w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Platform Revenue</p>
                <p className="text-lg sm:text-2xl font-bold text-blue-600">€{totalPlatformRevenue.toFixed(2)}</p>
              </div>
              <DollarSign className="h-5 w-5 sm:h-8 sm:w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Management Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Lead Fee Transactions
            </CardTitle>
            <div className="flex gap-2">
              {selectedTransactions.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDeleteSelected}
                  disabled={bulkDeleteMutation.isPending}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete Selected ({selectedTransactions.length})
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBulkDelete(!showBulkDelete)}
              >
                <Settings className="w-4 h-4 mr-1" />
                Bulk Actions
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-2 sm:p-6">
          {/* Bulk Delete Controls */}
          {showBulkDelete && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-medium text-yellow-900 mb-3">Database Cleanup</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-yellow-800 mb-2">
                    Delete transactions older than:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={bulkDeleteDays}
                      onChange={(e) => setBulkDeleteDays(parseInt(e.target.value))}
                      className="border rounded px-3 py-1 w-20"
                      min="1"
                    />
                    <span className="text-sm text-yellow-700 self-center">days</span>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleBulkDeleteByDate}
                      disabled={bulkDeleteMutation.isPending}
                    >
                      Delete Old Records
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-yellow-700">
                  <p>⚠️ This will permanently delete old transaction records to keep database clean.</p>
                  <p>Use carefully - this action cannot be undone.</p>
                </div>
              </div>
            </div>
          )}

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedTransactions.length === transactions.length && transactions.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded"
                    />
                  </TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Installer</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-16">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction: any) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedTransactions.includes(transaction.id)}
                        onChange={() => toggleTransactionSelection(transaction.id)}
                        className="rounded"
                      />
                    </TableCell>
                    <TableCell className="font-mono text-sm">#{transaction.id}</TableCell>
                    <TableCell className="text-sm">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-sm">
                      {transaction.installerName || `Installer #${transaction.installerId}`}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          transaction.type === 'lead_fee' ? 'secondary' :
                          transaction.type === 'credit_purchase' ? 'default' :
                          'outline'
                        }
                      >
                        {transaction.type?.replace('_', ' ') || 'Unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell className={`font-medium ${
                      parseFloat(transaction.amount || '0') < 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      €{Math.abs(parseFloat(transaction.amount || '0')).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          transaction.status === 'completed' ? 'default' :
                          transaction.status === 'pending' ? 'secondary' :
                          'destructive'
                        }
                      >
                        {transaction.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{transaction.description}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTransaction(transaction.id)}
                        disabled={deleteTransactionMutation.isPending}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="block md:hidden space-y-3">
            {transactions.map((transaction: any) => (
              <div key={transaction.id} className="bg-gray-50 p-3 rounded-lg border">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedTransactions.includes(transaction.id)}
                      onChange={() => toggleTransactionSelection(transaction.id)}
                      className="rounded"
                    />
                    <span className="text-sm font-medium">#{transaction.id}</span>
                  </div>
                  <div className="flex gap-1">
                    <Badge 
                      variant={
                        transaction.status === 'completed' ? 'default' :
                        transaction.status === 'pending' ? 'secondary' :
                        'destructive'
                      }
                    >
                      {transaction.status}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTransaction(transaction.id)}
                      disabled={deleteTransactionMutation.isPending}
                      className="text-red-600 hover:text-red-700 h-6 w-6 p-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Amount:</span>
                    <div className={`font-medium ${
                      parseFloat(transaction.amount || '0') < 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      €{Math.abs(parseFloat(transaction.amount || '0')).toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Date:</span>
                    <div className="font-medium">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-xs">
                  <span className="text-gray-500">Installer:</span>
                  <div className="font-medium">{transaction.installerName || `Installer #${transaction.installerId}`}</div>
                </div>
                <div className="mt-1 text-xs text-gray-600">{transaction.description}</div>
              </div>
            ))}
          </div>
          
          {transactions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No lead fee transactions found
            </div>
          )}

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing page {pagination.currentPage} of {pagination.totalPages} 
                ({pagination.totalTransactions} total transactions)
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={pagination.currentPage <= 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                  disabled={pagination.currentPage >= pagination.totalPages}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Lead Pricing Management Component  
function FeeManagement() {
  const { data: serviceTiers } = useQuery({
    queryKey: ['/api/service-tiers'],
    queryFn: () => fetch('/api/service-tiers').then(r => r.json())
  });

  const { toast } = useToast();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <DollarSign className="w-5 h-5 mr-2" />
          Lead Pricing Management
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Manage lead fees charged to installers and customer pricing estimates
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-3">Current Lead Generation Model</h4>
          <div className="space-y-2 text-sm text-blue-800">
            <div className="flex justify-between items-center">
              <span>Revenue Source:</span>
              <span className="font-medium">Fixed Lead Fees</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Customer Payment:</span>
              <span className="font-medium">Direct to Installer</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Payment Methods:</span>
              <span className="font-medium">Cash • Card • Bank Transfer</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {serviceTiers?.map((tier: any) => (
            <div key={tier.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h5 className="font-medium">{tier.name}</h5>
                  <p className="text-xs text-muted-foreground">{tier.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600">€{tier.leadFee}</div>
                  <div className="text-xs text-muted-foreground">Lead Fee</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Customer Estimate</div>
                  <div className="font-medium">€{tier.customerPrice}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Installer Margin</div>
                  <div className="font-medium text-green-600">
                    {Math.round(((tier.customerPrice - tier.leadFee) / tier.customerPrice) * 100)}%
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Addon Services Section */}
        <div className="border-t pt-6">
          <h4 className="font-medium text-gray-900 mb-4">Addon Services Lead Fees</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">Cable Concealment</span>
                <span className="text-sm text-green-600 font-medium">€5</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Customer Price: €35 | Installer Margin: 86%
              </div>
            </div>
            <div className="border rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">Soundbar Mounting</span>
                <span className="text-sm text-green-600 font-medium">€7</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Customer Price: €45 | Installer Margin: 84%
              </div>
            </div>
            <div className="border rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">Additional Devices</span>
                <span className="text-sm text-green-600 font-medium">€3</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Customer Price: €25 | Installer Margin: 88%
              </div>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h4 className="font-medium text-amber-900 mb-2">Lead Fee Benefits</h4>
          <ul className="text-sm text-amber-800 space-y-1">
            <li>• Predictable platform revenue vs. variable commissions</li>
            <li>• Installers keep 80-91% of customer payment (base + addons)</li>
            <li>• No payment processing fees for platform</li>
            <li>• Simplified pricing structure for all services</li>
            <li>• Additional addon revenue streams with minimal fees</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

// Referral Code Form Schema
const referralCodeSchema = z.object({
  code: z.string().min(3, "Code must be at least 3 characters").max(20, "Code must be at most 20 characters"),
  referralType: z.enum(["customer", "sales_staff"]),
  discountPercentage: z.number().min(0, "Discount must be positive").max(100, "Discount cannot exceed 100%"),
  salesStaffName: z.string().optional(),
  salesStaffStore: z.string().optional(),
  isActive: z.boolean().default(true)
});

type ReferralCodeFormData = z.infer<typeof referralCodeSchema>;

interface ReferralCodeFormProps {
  code?: any;
  onSubmit: (data: ReferralCodeFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

function ReferralCodeForm({ code, onSubmit, onCancel, isLoading }: ReferralCodeFormProps) {
  const form = useForm<ReferralCodeFormData>({
    resolver: zodResolver(referralCodeSchema),
    defaultValues: {
      code: code?.referralCode || code?.code || "",
      referralType: code?.referralType || "customer", 
      discountPercentage: parseFloat(code?.discountPercentage || "10"),
      salesStaffName: code?.salesStaffName || "",
      salesStaffStore: code?.salesStaffStore || "",
      isActive: code?.isActive ?? true
    }
  });

  // Reset form when code prop changes (for editing)
  React.useEffect(() => {
    if (code) {
      form.reset({
        code: code?.referralCode || code?.code || "",
        referralType: code?.referralType || "customer",
        discountPercentage: parseFloat(code?.discountPercentage || "10"),
        salesStaffName: code?.salesStaffName || "",
        salesStaffStore: code?.salesStaffStore || "",
        isActive: code?.isActive ?? true
      });
    }
  }, [code, form]);

  const referralType = form.watch("referralType");
  const salesStaffName = form.watch("salesStaffName");
  const salesStaffStore = form.watch("salesStaffStore");

  // Generic store code generation function
  const generateStoreCode = (storeName: string): string => {
    // Create a 3-letter code from the store name
    const cleanName = storeName.replace(/[^a-zA-Z\s]/g, '').trim();
    const words = cleanName.split(/\s+/);
    
    if (words.length === 1) {
      // Single word: take first 3 letters
      return words[0].substring(0, 3).toUpperCase();
    } else {
      // Multiple words: take first letter of each word, pad if needed
      const initials = words.map(word => word.charAt(0)).join('').substring(0, 3);
      return initials.padEnd(3, words[0].charAt(1) || 'X').toUpperCase();
    }
  };

  // Auto-generate codes based on type
  React.useEffect(() => {
    if (referralType === 'sales_staff' && salesStaffName && salesStaffStore && !code) {
      const storeCode = generateStoreCode(salesStaffStore);
      const nameCode = salesStaffName.replace(/[^a-zA-Z]/g, '').substring(0, 4).toUpperCase();
      const generatedCode = `RT${storeCode}${nameCode}`; // RT = Retail Trade
      form.setValue('code', generatedCode);
    } else if (referralType === 'customer' && !code) {
      // Generate customer referral code
      const timestamp = Date.now().toString(36).toUpperCase();
      const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase();
      const generatedCode = `TB${timestamp.slice(-4)}${randomChars}`;
      form.setValue('code', generatedCode);
    }
  }, [referralType, salesStaffName, salesStaffStore, code, form]);

  const handleSubmit = (data: ReferralCodeFormData) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Referral Code</FormLabel>
              <FormControl>
                <Input placeholder="Enter referral code" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="referralType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select referral type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="customer">Customer Referral</SelectItem>
                  <SelectItem value="sales_staff">Harvey Norman Staff</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {referralType === "sales_staff" && (
          <>
            <FormField
              control={form.control}
              name="salesStaffName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sales Staff Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter staff member name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="salesStaffStore"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Store Location</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Harvey Norman store" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Blanchardstown">Blanchardstown (BLA)</SelectItem>
                      <SelectItem value="Carrickmines">Carrickmines (CKM)</SelectItem>
                      <SelectItem value="Cork">Cork (CRK)</SelectItem>
                      <SelectItem value="Castlebar">Castlebar (CAS)</SelectItem>
                      <SelectItem value="Drogheda">Drogheda (DRO)</SelectItem>
                      <SelectItem value="Fonthill">Fonthill (FON)</SelectItem>
                      <SelectItem value="Galway">Galway (GAL)</SelectItem>
                      <SelectItem value="Kinsale Road">Kinsale Road (KIN)</SelectItem>
                      <SelectItem value="Limerick">Limerick (LIM)</SelectItem>
                      <SelectItem value="Little Island">Little Island (LIT)</SelectItem>
                      <SelectItem value="Naas">Naas (NAA)</SelectItem>
                      <SelectItem value="Rathfarnham">Rathfarnham (RAT)</SelectItem>
                      <SelectItem value="Sligo">Sligo (SLI)</SelectItem>
                      <SelectItem value="Swords">Swords (SWO)</SelectItem>
                      <SelectItem value="Tallaght">Tallaght (TAL)</SelectItem>
                      <SelectItem value="Tralee">Tralee (TRA)</SelectItem>
                      <SelectItem value="Waterford">Waterford (WAT)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        <FormField
          control={form.control}
          name="discountPercentage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Discount Percentage</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  min="0" 
                  max="100" 
                  step="0.1"
                  placeholder="10.0" 
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Active Status</FormLabel>
                <div className="text-sm text-muted-foreground">
                  Enable or disable this referral code
                </div>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {code ? "Updating..." : "Creating..."}
              </>
            ) : (
              code ? "Update Code" : "Create Code"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

// REMOVED: CustomerResourcesManagement Component - consolidated into ResourcesManagement

// Email Preferences Management Component
function EmailPreferencesManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [bulkEmailSubject, setBulkEmailSubject] = useState('');
  const [bulkEmailMessage, setBulkEmailMessage] = useState('');
  const [sendingBulkEmail, setSendingBulkEmail] = useState(false);
  const [showBulkEmailDialog, setShowBulkEmailDialog] = useState(false);
  const [emailType, setEmailType] = useState<'general' | 'booking' | 'marketing'>('general');

  // Fetch users with their email preferences
  const { data: usersWithPreferences = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['/api/admin/users-preferences'],
    queryFn: async () => {
      const response = await fetch('/api/admin/users-preferences', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    }
  });

  // Fetch email preference statistics
  const { data: preferenceStats, isLoading: loadingStats } = useQuery({
    queryKey: ['/api/admin/email-preference-stats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/email-preference-stats', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    }
  });

  // Update user preferences mutation
  const updateUserPreferencesMutation = useMutation({
    mutationFn: async ({ userId, preferences }: { userId: string, preferences: any }) => {
      const response = await apiRequest(`/api/admin/users/${userId}/preferences`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences)
      });
      return response;
    },
    onSuccess: () => {
      toast({ title: "User preferences updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users-preferences'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/email-preference-stats'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update preferences",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Send bulk email mutation
  const sendBulkEmailMutation = useMutation({
    mutationFn: async ({ recipientIds, subject, message, emailType }: { 
      recipientIds: string[], subject: string, message: string, emailType: string 
    }) => {
      const response = await apiRequest('POST', '/api/admin/send-bulk-email', {
        recipientIds, subject, message, emailType
      });
      return response;
    },
    onSuccess: (data) => {
      toast({ 
        title: `Bulk email sent successfully`, 
        description: `${data.sentCount} emails sent, ${data.skippedCount} skipped due to preferences`
      });
      setShowBulkEmailDialog(false);
      setBulkEmailSubject('');
      setBulkEmailMessage('');
      setSelectedUsers([]);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send bulk email",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Filter users based on selected criteria
  const filteredUsers = usersWithPreferences.filter((user: any) => {
    const matchesSearch = searchQuery === '' || 
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    switch (selectedFilter) {
      case 'email-notifications-enabled':
        return user.emailNotifications === true;
      case 'email-notifications-disabled':
        return user.emailNotifications === false;
      case 'booking-updates-enabled':
        return user.bookingUpdates === true;
      case 'booking-updates-disabled':
        return user.bookingUpdates === false;
      case 'marketing-enabled':
        return user.marketingEmails === true;
      case 'marketing-disabled':
        return user.marketingEmails === false;
      case 'all-opted-out':
        return !user.emailNotifications && !user.bookingUpdates && !user.marketingEmails;
      case 'verified-only':
        return user.emailVerified === true;
      case 'unverified-only':
        return user.emailVerified === false;
      default:
        return true;
    }
  });

  const handleToggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id));
    }
  };

  const handleSendBulkEmail = () => {
    if (selectedUsers.length === 0) {
      toast({
        title: "No users selected",
        description: "Please select at least one user to send the email to",
        variant: "destructive"
      });
      return;
    }

    sendBulkEmailMutation.mutate({
      recipientIds: selectedUsers,
      subject: bulkEmailSubject,
      message: bulkEmailMessage,
      emailType
    });
  };

  if (loadingUsers || loadingStats) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Loading email preferences...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MailCheck className="w-5 h-5 mr-2" />
            Email Preference Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {preferenceStats?.emailNotifications?.enabled || 0}
              </div>
              <div className="text-sm text-green-700">Email Notifications On</div>
            </div>
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {preferenceStats?.bookingUpdates?.enabled || 0}
              </div>
              <div className="text-sm text-blue-700">Booking Updates On</div>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {preferenceStats?.marketingEmails?.enabled || 0}
              </div>
              <div className="text-sm text-purple-700">Marketing Emails On</div>
            </div>
            <div className="text-center p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {preferenceStats?.allOptedOut || 0}
              </div>
              <div className="text-sm text-red-700">All Opted Out</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filter & Search Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex-1">
              <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter users..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="verified-only">Email Verified Only</SelectItem>
                  <SelectItem value="unverified-only">Email Unverified Only</SelectItem>
                  <SelectItem value="email-notifications-enabled">Email Notifications: ON</SelectItem>
                  <SelectItem value="email-notifications-disabled">Email Notifications: OFF</SelectItem>
                  <SelectItem value="booking-updates-enabled">Booking Updates: ON</SelectItem>
                  <SelectItem value="booking-updates-disabled">Booking Updates: OFF</SelectItem>
                  <SelectItem value="marketing-enabled">Marketing Emails: ON</SelectItem>
                  <SelectItem value="marketing-disabled">Marketing Emails: OFF</SelectItem>
                  <SelectItem value="all-opted-out">All Communications: OFF</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Bulk Actions */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
              >
                {selectedUsers.length === filteredUsers.length ? 'Deselect All' : 'Select All'}
              </Button>
              {selectedUsers.length > 0 && (
                <span className="text-sm text-gray-600">
                  {selectedUsers.length} users selected
                </span>
              )}
            </div>
            <Button
              onClick={() => setShowBulkEmailDialog(true)}
              disabled={selectedUsers.length === 0}
              className="flex items-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>Send Bulk Email</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <UserCog className="w-5 h-5 mr-2" />
              User Email Preferences ({filteredUsers.length})
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Select</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Email Status</TableHead>
                  <TableHead>General</TableHead>
                  <TableHead>Booking</TableHead>
                  <TableHead>Marketing</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user: any) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => handleToggleUserSelection(user.id)}
                        className="rounded border-gray-300"
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {user.firstName && user.lastName 
                            ? `${user.firstName} ${user.lastName}`
                            : user.email
                          }
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.emailVerified ? "default" : "secondary"}>
                        {user.emailVerified ? "Verified" : "Unverified"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={user.emailNotifications ?? true}
                        onCheckedChange={(checked) => {
                          updateUserPreferencesMutation.mutate({
                            userId: user.id,
                            preferences: { emailNotifications: checked }
                          });
                        }}
                        disabled={updateUserPreferencesMutation.isPending}
                      />
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={user.bookingUpdates ?? true}
                        onCheckedChange={(checked) => {
                          updateUserPreferencesMutation.mutate({
                            userId: user.id,
                            preferences: { bookingUpdates: checked }
                          });
                        }}
                        disabled={updateUserPreferencesMutation.isPending}
                      />
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={user.marketingEmails ?? false}
                        onCheckedChange={(checked) => {
                          updateUserPreferencesMutation.mutate({
                            userId: user.id,
                            preferences: { marketingEmails: checked }
                          });
                        }}
                        disabled={updateUserPreferencesMutation.isPending}
                      />
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedUsers([user.id]);
                          setEmailType('general');
                          setShowBulkEmailDialog(true);
                        }}
                      >
                        <Mail className="w-4 h-4 mr-1" />
                        Email
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Email Dialog */}
      <Dialog open={showBulkEmailDialog} onOpenChange={setShowBulkEmailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Send Bulk Email</DialogTitle>
            <DialogDescription>
              Send an email to {selectedUsers.length} selected user(s). 
              The system will respect individual user preferences and skip users who have opted out.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Email Type</Label>
              <Select value={emailType} onValueChange={(value: any) => setEmailType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General Notifications</SelectItem>
                  <SelectItem value="booking">Booking Updates</SelectItem>
                  <SelectItem value="marketing">Marketing/Promotional</SelectItem>
                </SelectContent>
              </Select>
              <div className="text-xs text-gray-500 mt-1">
                Users who have opted out of this email type will not receive the message
              </div>
            </div>
            <div>
              <Label>Subject</Label>
              <Input
                placeholder="Enter email subject..."
                value={bulkEmailSubject}
                onChange={(e) => setBulkEmailSubject(e.target.value)}
              />
            </div>
            <div>
              <Label>Message</Label>
              <Textarea
                placeholder="Enter your email message..."
                value={bulkEmailMessage}
                onChange={(e) => setBulkEmailMessage(e.target.value)}
                rows={6}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setShowBulkEmailDialog(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSendBulkEmail}
                disabled={!bulkEmailSubject || !bulkEmailMessage || sendBulkEmailMutation.isPending}
              >
                {sendBulkEmailMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Send Email
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Platform Settings Management Component
function PlatformSettingsManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedSetting, setSelectedSetting] = useState<any>(null);

  // Fetch platform settings
  const { data: settings = [], isLoading } = useQuery({
    queryKey: ['/api/admin/platform-settings'],
    queryFn: () => fetch('/api/admin/platform-settings', {
      credentials: 'include'
    }).then(r => r.json())
  });

  // Fetch first lead vouchers
  const { data: vouchers = [], isLoading: vouchersLoading } = useQuery({
    queryKey: ['/api/admin/first-lead-vouchers'],
    queryFn: () => fetch('/api/admin/first-lead-vouchers', {
      credentials: 'include'
    }).then(r => r.json())
  });

  // Create setting mutation
  const createSettingMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/admin/platform-settings', data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/platform-settings'] });
      setShowCreateDialog(false);
      toast({
        title: "Setting Created",
        description: "Platform setting has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create setting",
        variant: "destructive",
      });
    }
  });

  // Update setting mutation
  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, ...data }: any) => {
      const response = await apiRequest('PATCH', `/api/admin/platform-settings/${key}`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/platform-settings'] });
      setShowEditDialog(false);
      setSelectedSetting(null);
      toast({
        title: "Setting Updated",
        description: "Platform setting has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update setting",
        variant: "destructive",
      });
    }
  });

  // Create voucher mutation
  const createVoucherMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/admin/first-lead-vouchers', data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/first-lead-vouchers'] });
      toast({
        title: "Voucher Created",
        description: "First lead voucher has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create voucher",
        variant: "destructive",
      });
    }
  });

  const handleToggleFirstLeadVouchers = async () => {
    const voucherSetting = settings.find(s => s.key === 'first_lead_voucher_enabled');
    const freeLeadsPromotion = settings.find(s => s.key === 'free_leads_promotion_enabled');
    const newValue = voucherSetting?.value === 'true' ? 'false' : 'true';
    
    // Check if Free Leads Promotion is running - can't enable both at same time
    if (newValue === 'true' && freeLeadsPromotion?.value === 'true') {
      toast({
        title: "Cannot Enable Both Promotions",
        description: "Free Leads Promotion is currently active. Please pause it first before enabling First Lead Vouchers.",
        variant: "destructive",
      });
      return;
    }
    
    if (voucherSetting) {
      // Update existing setting
      updateSettingMutation.mutate({
        key: 'first_lead_voucher_enabled',
        value: newValue,
        description: 'Enable or disable first lead voucher system',
        category: 'vouchers'
      });
    } else {
      // Create new setting
      createSettingMutation.mutate({
        key: 'first_lead_voucher_enabled',
        value: newValue,
        description: 'Enable or disable first lead voucher system',
        category: 'vouchers'
      });
    }
  };

  const handleToggleFreeLeadsPromotion = async () => {
    const freeLeadsPromotion = settings.find(s => s.key === 'free_leads_promotion_enabled');
    const voucherSetting = settings.find(s => s.key === 'first_lead_voucher_enabled');
    const newValue = freeLeadsPromotion?.value === 'true' ? 'false' : 'true';
    
    // Check if First Lead Voucher System is running - can't enable both at same time
    if (newValue === 'true' && voucherSetting?.value === 'true') {
      toast({
        title: "Cannot Enable Both Promotions",
        description: "First Lead Voucher System is currently active. Please disable it first before starting Free Leads Promotion.",
        variant: "destructive",
      });
      return;
    }
    
    if (freeLeadsPromotion) {
      // Update existing setting
      updateSettingMutation.mutate({
        key: 'free_leads_promotion_enabled',
        value: newValue,
        description: 'Enable or disable free leads promotion for all installers',
        category: 'promotions'
      });
    } else {
      // Create new setting
      createSettingMutation.mutate({
        key: 'free_leads_promotion_enabled',
        value: newValue,
        description: 'Enable or disable free leads promotion for all installers',
        category: 'promotions'
      });
    }
  };

  const isVoucherSystemEnabled = settings.find(s => s.key === 'first_lead_voucher_enabled')?.value === 'true';
  const isFreeLeadsPromotionEnabled = settings.find(s => s.key === 'free_leads_promotion_enabled')?.value === 'true';

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span>Loading platform settings...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Platform Settings</h2>
          <p className="text-gray-600">Manage platform configuration, promotions, and installer benefits</p>
        </div>
      </div>

      {/* Free Leads Promotion System */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-orange-600" />
            <span>Free Leads Promotion</span>
            {isFreeLeadsPromotionEnabled && (
              <Badge variant="default" className="bg-orange-600">
                ACTIVE
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg bg-orange-50 dark:bg-orange-950/20">
            <div>
              <h3 className="font-medium">Enable Free Leads for All Installers</h3>
              <p className="text-sm text-gray-600">
                When active, all installers get leads for free (no lead fees charged)
              </p>
              <p className="text-xs text-orange-600 mt-1">
                ⚠️ Cannot run simultaneously with First Lead Voucher System
              </p>
            </div>
            <Button
              onClick={handleToggleFreeLeadsPromotion}
              variant={isFreeLeadsPromotionEnabled ? "default" : "outline"}
              disabled={updateSettingMutation.isPending || createSettingMutation.isPending}
              className={isFreeLeadsPromotionEnabled ? "bg-orange-600 hover:bg-orange-700" : ""}
            >
              {updateSettingMutation.isPending || createSettingMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {isFreeLeadsPromotionEnabled ? "ACTIVE - Click to Pause" : "Start Promotion"}
            </Button>
          </div>
          
          {isFreeLeadsPromotionEnabled && (
            <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-800 dark:text-green-200">
                  Free Leads Promotion is currently active
                </span>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                All installers are receiving leads without paying lead fees
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* First Lead Voucher System */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5" />
            <span>First Lead Voucher System</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium">Enable First Lead Vouchers</h3>
              <p className="text-sm text-gray-600">
                Allow new installers to get their first lead for free to encourage platform adoption
              </p>
            </div>
            <Button
              onClick={handleToggleFirstLeadVouchers}
              variant={isVoucherSystemEnabled ? "default" : "outline"}
              disabled={updateSettingMutation.isPending || createSettingMutation.isPending}
            >
              {updateSettingMutation.isPending || createSettingMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {isVoucherSystemEnabled ? "Enabled" : "Disabled"}
            </Button>
          </div>

          {isVoucherSystemEnabled && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium">Eligible Installers</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {vouchers.filter(v => v.isEligible && !v.isUsed).length}
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <UserCheck className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium">Vouchers Used</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {vouchers.filter(v => v.isUsed).length}
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Euro className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium">Total Value</span>
                    </div>
                    <p className="text-2xl font-bold">
                      €{vouchers.reduce((sum, v) => sum + (v.voucherAmount || 0), 0)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {vouchersLoading ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : vouchers.length > 0 ? (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Installer</TableHead>
                        <TableHead>Voucher Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Used</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vouchers.map((voucher) => (
                        <TableRow key={voucher.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">Installer #{voucher.installerId}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              €{voucher.voucherAmount || 0}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={voucher.isUsed ? "secondary" : voucher.isEligible ? "default" : "destructive"}
                            >
                              {voucher.isUsed ? "Used" : voucher.isEligible ? "Eligible" : "Ineligible"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {voucher.createdAt ? new Date(voucher.createdAt).toLocaleDateString() : 'N/A'}
                          </TableCell>
                          <TableCell>
                            {voucher.usedAt ? new Date(voucher.usedAt).toLocaleDateString() : 'Not used'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center p-8 text-gray-500">
                  <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No vouchers created yet</p>
                  <p className="text-sm">Vouchers are automatically created when new installers register</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Other Platform Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>General Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {settings.length > 0 ? (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Key</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {settings.map((setting) => (
                    <TableRow key={setting.key}>
                      <TableCell>
                        <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                          {setting.key}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {setting.value}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {setting.category || 'general'}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {setting.description || 'No description'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedSetting(setting);
                            setShowEditDialog(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center p-8 text-gray-500">
              <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No platform settings configured yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Setting Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md" aria-describedby="edit-setting-description">
          <DialogHeader>
            <DialogTitle>Edit Platform Setting</DialogTitle>
            <DialogDescription id="edit-setting-description">
              Update the value and configuration for this platform setting.
            </DialogDescription>
          </DialogHeader>
          {selectedSetting && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="settingKey">Key</Label>
                <Input
                  id="settingKey"
                  value={selectedSetting.key}
                  disabled
                  className="bg-gray-100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="settingValue">Value</Label>
                <Input
                  id="settingValue"
                  value={selectedSetting.value}
                  onChange={(e) => setSelectedSetting(prev => ({ ...prev, value: e.target.value }))}
                  placeholder="Enter setting value"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="settingCategory">Category</Label>
                <Input
                  id="settingCategory"
                  value={selectedSetting.category || ''}
                  onChange={(e) => setSelectedSetting(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="Enter category (optional)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="settingDescription">Description</Label>
                <Input
                  id="settingDescription"
                  value={selectedSetting.description || ''}
                  onChange={(e) => setSelectedSetting(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter description (optional)"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <Button variant="outline" onClick={() => {
                  setShowEditDialog(false);
                  setSelectedSetting(null);
                }}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    updateSettingMutation.mutate({
                      key: selectedSetting.key,
                      value: selectedSetting.value,
                      category: selectedSetting.category,
                      description: selectedSetting.description
                    });
                  }}
                  disabled={updateSettingMutation.isPending}
                >
                  {updateSettingMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  // Move all hooks to the top before any conditional returns
  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ['/api/admin/stats'],
    retry: false,
  });

  // Fetch installer service assignments for the installers tab
  const { data: installerServiceAssignments = [] } = useQuery<InstallerServiceAssignment[]>({
    queryKey: ['/api/installer-service-assignments'],
    retry: false,
  });

  // Fetch all service types for the admin interface
  const { data: serviceTypes = [] } = useQuery<ServiceType[]>({
    queryKey: ['/api/service-types/active'],
    retry: false,
  });

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
          <TabsList className="flex flex-wrap w-full gap-1 h-auto p-1 justify-start">
            <TabsTrigger value="overview" className="flex items-center space-x-2 px-3 py-2 text-sm whitespace-nowrap">
              <BarChart3 className="w-4 h-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center space-x-2 px-3 py-2 text-sm whitespace-nowrap">
              <Users className="w-4 h-4" />
              <span>Users</span>
            </TabsTrigger>
            <TabsTrigger value="onboarding" className="flex items-center space-x-2 px-3 py-2 text-sm whitespace-nowrap">
              <UserCheck className="w-4 h-4" />
              <span>Onboarding</span>
            </TabsTrigger>
            <TabsTrigger value="installers" className="flex items-center space-x-2 px-3 py-2 text-sm whitespace-nowrap">
              <Shield className="w-4 h-4" />
              <span>Installers</span>
            </TabsTrigger>
            <TabsTrigger value="bookings" className="flex items-center space-x-2 px-3 py-2 text-sm whitespace-nowrap">
              <Calendar className="w-4 h-4" />
              <span>Bookings</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center space-x-2 px-3 py-2 text-sm whitespace-nowrap">
              <DollarSign className="w-4 h-4" />
              <span>Payments</span>
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center space-x-2 px-3 py-2 text-sm whitespace-nowrap">
              <TrendingUp className="w-4 h-4" />
              <span>Platform Insights</span>
            </TabsTrigger>
            <TabsTrigger value="solar" className="flex items-center space-x-2 px-3 py-2 text-sm whitespace-nowrap">
              <Activity className="w-4 h-4" />
              <span>OHK Energy</span>
            </TabsTrigger>
            <TabsTrigger value="fees" className="flex items-center space-x-2 px-3 py-2 text-sm whitespace-nowrap">
              <Percent className="w-4 h-4" />
              <span>Fees</span>
            </TabsTrigger>
            <TabsTrigger value="referrals" className="flex items-center space-x-2 px-3 py-2 text-sm whitespace-nowrap">
              <Users className="w-4 h-4" />
              <span>Referrals</span>
            </TabsTrigger>
            <TabsTrigger value="pricing" className="flex items-center space-x-2 px-3 py-2 text-sm whitespace-nowrap">
              <Euro className="w-4 h-4" />
              <span>Pricing</span>
            </TabsTrigger>
            <TabsTrigger value="emails" className="flex items-center space-x-2 px-3 py-2 text-sm whitespace-nowrap">
              <Mail className="w-4 h-4" />
              <span>Email Templates</span>
            </TabsTrigger>
            <TabsTrigger value="email-preferences" className="flex items-center space-x-2 px-3 py-2 text-sm whitespace-nowrap">
              <MailCheck className="w-4 h-4" />
              <span>Email Preferences</span>
            </TabsTrigger>
            <TabsTrigger value="resources" className="flex items-center space-x-2 px-3 py-2 text-sm whitespace-nowrap">
              <BookOpen className="w-4 h-4" />
              <span>Resource Management</span>
            </TabsTrigger>
            <TabsTrigger value="ai-tools" className="flex items-center space-x-2 px-3 py-2 text-sm whitespace-nowrap">
              <Zap className="w-4 h-4" />
              <span>AI Tools</span>
            </TabsTrigger>
            <TabsTrigger value="fraud-prevention" className="flex items-center space-x-2 px-3 py-2 text-sm whitespace-nowrap">
              <Shield className="w-4 h-4" />
              <span>Fraud Prevention</span>
            </TabsTrigger>
            <TabsTrigger value="banned" className="flex items-center space-x-2 px-3 py-2 text-sm whitespace-nowrap">
              <Ban className="w-4 h-4" />
              <span>Banned Users</span>
            </TabsTrigger>
            <TabsTrigger value="tv-setup" className="flex items-center space-x-2 px-3 py-2 text-sm whitespace-nowrap">
              <Tv className="w-4 h-4" />
              <span>TV Setup Bookings</span>
            </TabsTrigger>
            <TabsTrigger value="downloadable-guides" className="flex items-center space-x-2 px-3 py-2 text-sm whitespace-nowrap">
              <Upload className="w-4 h-4" />
              <span>Downloadable Guides</span>
            </TabsTrigger>
            <TabsTrigger value="video-tutorials" className="flex items-center space-x-2 px-3 py-2 text-sm whitespace-nowrap">
              <Camera className="w-4 h-4" />
              <span>Video Tutorials</span>
            </TabsTrigger>
            <TabsTrigger value="stores" className="flex items-center space-x-2 px-3 py-2 text-sm whitespace-nowrap">
              <MapPin className="w-4 h-4" />
              <span>Stores</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2 px-3 py-2 text-sm whitespace-nowrap">
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <DashboardOverview stats={stats} />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <UserManagement />
          </TabsContent>

          <TabsContent value="onboarding" className="space-y-6">
            <TradesPersonOnboarding />
          </TabsContent>

          <TabsContent value="installers" className="space-y-6">
            <InstallerManagement 
              installerServiceAssignments={installerServiceAssignments}
              serviceTypes={serviceTypes}
            />
          </TabsContent>

          <TabsContent value="bookings" className="space-y-6">
            <BookingManagement />
          </TabsContent>

          <TabsContent value="payments" className="space-y-6">
            <TransactionManagement />
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <SystemMetrics />
          </TabsContent>

          <TabsContent value="solar" className="space-y-6">
            <SolarEnquiryManagement />
          </TabsContent>

          <TabsContent value="fees" className="space-y-6">
            <FeeManagement />
          </TabsContent>

          <TabsContent value="referrals" className="space-y-6">
            <ReferralManagement />
          </TabsContent>

          <TabsContent value="pricing" className="space-y-6">
            <PricingManagement />
            <WallMountPricingManagement />
          </TabsContent>

          <TabsContent value="emails" className="space-y-6">
            <EmailTemplateManagement />
          </TabsContent>

          <TabsContent value="email-preferences" className="space-y-6">
            <EmailPreferencesManagement />
          </TabsContent>

          <TabsContent value="resources" className="space-y-6">
            <div className="space-y-6">
              {/* Unified Resource Management Header */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BookOpen className="w-5 h-5 mr-2" />
                    Unified Resource Management
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Manage all customer resources including guides, tutorials, warranties, and TV setup help in one place. 
                    Create resources with external links, upload downloadable content, and manage both CRUD operations and link functionality.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Badge variant="outline" className="text-xs">
                      External Links
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      CRUD Operations
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Content Management
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Brand Specific
                    </Badge>
                  </div>
                </CardHeader>
              </Card>
              
              {/* Unified Resource Management Component */}
              <ResourcesManagement />
            </div>
          </TabsContent>

          <TabsContent value="ai-tools" className="space-y-6">
            <AiToolsManagement />
          </TabsContent>

          <TabsContent value="fraud-prevention" className="space-y-6">
            <FraudPreventionDashboard />
          </TabsContent>

          <TabsContent value="banned" className="space-y-6">
            <BannedUsersManagement />
          </TabsContent>

          <TabsContent value="tv-setup" className="space-y-6">
            <TvSetupManagement />
          </TabsContent>

          <TabsContent value="downloadable-guides" className="space-y-6">
            <DownloadableGuidesManagement />
          </TabsContent>

          <TabsContent value="video-tutorials" className="space-y-6">
            <VideoTutorialsManagement />
          </TabsContent>

          <TabsContent value="stores" className="space-y-6">
            <StoreManagement />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <PlatformSettingsManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}