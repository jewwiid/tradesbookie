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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import QRCode from "@/components/QRCode";

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
  const [selectedInstaller, setSelectedInstaller] = useState<Installer | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

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

  const handleViewInstaller = (installer: Installer) => {
    setSelectedInstaller(installer);
    setShowViewDialog(true);
  };

  const handleEditInstaller = (installer: Installer) => {
    setSelectedInstaller(installer);
    setShowEditDialog(true);
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Installer Details</DialogTitle>
            <DialogDescription>
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Installer</DialogTitle>
            <DialogDescription>
              Update installer information and settings
            </DialogDescription>
          </DialogHeader>
          {selectedInstaller && (
            <div className="space-y-4">
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
                <Button onClick={() => {
                  toast({ title: "Installer updated", description: "Changes saved successfully" });
                  setShowEditDialog(false);
                }}>
                  Save Changes
                </Button>
              </div>
            </div>
          )}
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
  const [editStatus, setEditStatus] = useState("");

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

  const handleViewBooking = (booking: any) => {
    setSelectedBooking(booking);
    setIsViewDialogOpen(true);
  };

  const handleEditBooking = (booking: any) => {
    setSelectedBooking(booking);
    setEditStatus(booking.status);
    setIsEditDialogOpen(true);
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
      </Card>

      {/* View Booking Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
            <DialogDescription>
              View complete booking information
            </DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">QR Code</label>
                  <div className="mt-2">
                    <QRCode 
                      value={`${window.location.origin}/qr-tracking/${selectedBooking.qrCode}`}
                      size={120}
                      className="mb-2"
                    />
                    <p className="font-mono text-xs text-gray-500">{selectedBooking.qrCode}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Badge className={getStatusColor(selectedBooking.status)}>
                    {selectedBooking.status}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium">Service Type</label>
                  <p>{selectedBooking.serviceType}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">TV Size</label>
                  <p>{selectedBooking.tvSize}"</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Total Price</label>
                  <p>€{selectedBooking.totalPrice}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">App Fee</label>
                  <p>€{selectedBooking.appFee}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Address</label>
                <p>{selectedBooking.address}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Customer</label>
                <p>{selectedBooking.customerName || 'Guest User'}</p>
                <p className="text-sm text-gray-500">{selectedBooking.customerEmail}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Created</label>
                <p>{selectedBooking.createdAt ? new Date(selectedBooking.createdAt).toLocaleString() : 'N/A'}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Booking Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Booking Status</DialogTitle>
            <DialogDescription>
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
    </>
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

// Solar Enquiry Management Component for OHK Energy leads
function SolarEnquiryManagement() {
  const { data: solarEnquiries, isLoading } = useQuery<SolarEnquiry[]>({
    queryKey: ["/api/solar-enquiries"],
    retry: false,
  });

  const [selectedEnquiry, setSelectedEnquiry] = useState<SolarEnquiry | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiRequest("PATCH", `/api/solar-enquiries/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/solar-enquiries"] });
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'contacted':
        return 'bg-yellow-100 text-yellow-800';
      case 'qualified':
        return 'bg-green-100 text-green-800';
      case 'converted':
        return 'bg-emerald-100 text-emerald-800';
      case 'not_interested':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
                  <Select
                    value={enquiry.status}
                    onValueChange={(value) => updateStatusMutation.mutate({ id: enquiry.id, status: value })}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="qualified">Qualified</SelectItem>
                      <SelectItem value="converted">Converted</SelectItem>
                      <SelectItem value="not_interested">Not Interested</SelectItem>
                    </SelectContent>
                  </Select>
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
                      <Select
                        value={enquiry.status}
                        onValueChange={(value) => updateStatusMutation.mutate({ id: enquiry.id, status: value })}
                      >
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="contacted">Contacted</SelectItem>
                          <SelectItem value="qualified">Qualified</SelectItem>
                          <SelectItem value="converted">Converted</SelectItem>
                          <SelectItem value="not_interested">Not Interested</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(enquiry.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
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
    </div>
  );
}

// Referral Management Component
function ReferralManagement() {
  const [referralReward, setReferralReward] = useState(25);
  const [referralDiscount, setReferralDiscount] = useState(10);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const { data: referralStats } = useQuery({
    queryKey: ['/api/referrals/stats'],
    queryFn: () => fetch('/api/referrals/stats').then(r => r.json())
  });

  const { data: referralCodes } = useQuery({
    queryKey: ['/api/referrals/codes'],
    queryFn: () => fetch('/api/referrals/codes').then(r => r.json())
  });

  const updateReferralSettings = useMutation({
    mutationFn: async (settings: { reward: number; discount: number }) => {
      const response = await apiRequest('/api/referrals/settings', {
        method: 'PUT',
        body: settings
      });
      return response;
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
      reward: referralReward,
      discount: referralDiscount
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="referralReward">Referral Reward Amount (€)</Label>
              <Input
                id="referralReward"
                type="number"
                value={referralReward}
                onChange={(e) => setReferralReward(Number(e.target.value))}
                min="5"
                max="100"
                step="5"
              />
              <p className="text-sm text-gray-500">
                Amount paid to referrer when referral makes first booking
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="referralDiscount">Customer Discount (%)</Label>
              <Input
                id="referralDiscount"
                type="number"
                value={referralDiscount}
                onChange={(e) => setReferralDiscount(Number(e.target.value))}
                min="5"
                max="25"
                step="5"
              />
              <p className="text-sm text-gray-500">
                Discount given to new customers using referral codes
              </p>
            </div>
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
          <CardTitle className="flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Active Referral Codes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Referral Code</TableHead>
                  <TableHead>Referrer</TableHead>
                  <TableHead>Uses</TableHead>
                  <TableHead>Earnings</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {referralCodes?.map((code: any) => (
                  <TableRow key={code.id}>
                    <TableCell className="font-mono">{code.code}</TableCell>
                    <TableCell>{code.referrerName || 'Unknown'}</TableCell>
                    <TableCell>{code.totalReferrals}</TableCell>
                    <TableCell>€{code.totalEarnings}</TableCell>
                    <TableCell>
                      {new Date(code.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={code.isActive ? "default" : "secondary"}>
                        {code.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
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

  // Move all hooks to the top before any conditional returns
  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ['/api/admin/stats'],
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
              <span>Installers</span>
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
            <TabsTrigger value="solar" className="flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-2 p-2 md:p-3 text-xs md:text-sm">
              <Activity className="w-4 h-4 md:w-4 md:h-4" />
              <span className="hidden sm:inline">OHK Energy</span>
              <span className="sm:hidden">Solar</span>
            </TabsTrigger>
            <TabsTrigger value="fees" className="flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-2 p-2 md:p-3 text-xs md:text-sm">
              <Percent className="w-4 h-4 md:w-4 md:h-4" />
              <span>Fees</span>
            </TabsTrigger>
            <TabsTrigger value="referrals" className="flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-2 p-2 md:p-3 text-xs md:text-sm">
              <Users className="w-4 h-4 md:w-4 md:h-4" />
              <span>Referrals</span>
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

          <TabsContent value="solar" className="space-y-6">
            <SolarEnquiryManagement />
          </TabsContent>

          <TabsContent value="fees" className="space-y-6">
            <FeeManagement />
          </TabsContent>

          <TabsContent value="referrals" className="space-y-6">
            <ReferralManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}