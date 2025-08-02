import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Tv, 
  Mail, 
  Key, 
  Eye, 
  Edit, 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertTriangle,
  Settings,
  Send,
  User,
  Phone,
  Calendar,
  FileText,
  Euro,
  Loader2,
  Trash2,
  CreditCard,
  Target
} from "lucide-react";
import { format } from "date-fns";

interface TvSetupBooking {
  id: number;
  name: string;
  email: string;
  mobile: string;
  tvBrand: string;
  tvModel: string;
  isSmartTv: string;
  tvOs?: string;
  yearOfPurchase: number;
  streamingApps: string[];
  preferredSetupDate?: string;
  additionalNotes?: string;
  paymentStatus: string;
  paymentAmount: string;
  setupStatus: string;
  setupMethod?: string;
  assignedTo?: string;
  
  // Referral system integration
  referralCode?: string;
  referralCodeId?: number;
  salesStaffName?: string;
  salesStaffStore?: string;
  
  // MAC Address fields
  macAddress?: string;
  macAddressProvided: boolean;
  macAddressProvidedAt?: string;
  
  // IPTV Payment and setup workflow
  credentialsPaymentRequired: boolean;
  credentialsPaymentAmount?: number;
  credentialsPaymentStatus: string;
  credentialsPaidAt?: string;
  
  // IPTV Credentials - matching the screenshot format
  serverHostname?: string;
  serverUsername?: string;
  serverPassword?: string;
  m3uUrl?: string;
  numberOfDevices?: number;
  credentialsType?: string; // 'iptv' or 'm3u_url'
  
  // Legacy fields for backward compatibility
  appUsername?: string;
  appPassword?: string;
  
  credentialsProvided: boolean;
  credentialsEmailSent: boolean;
  credentialsSentAt?: string;
  confirmationEmailSent: boolean;
  adminNotificationSent: boolean;
  adminNotes?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

const credentialsSchema = z.object({
  credentialsType: z.enum(["iptv", "m3u_url"], {
    required_error: "Please select credentials type",
  }),
  
  // IPTV Login Details
  serverHostname: z.string().optional(),
  serverUsername: z.string().optional(), 
  serverPassword: z.string().optional(),
  numberOfDevices: z.number().min(1).max(10).optional().default(1),
  
  // M3U URL
  m3uUrl: z.string().optional(),
}).refine((data) => {
  if (data.credentialsType === "iptv") {
    return data.serverHostname && data.serverUsername && data.serverPassword;
  }
  if (data.credentialsType === "m3u_url") {
    return data.m3uUrl;
  }
  return false;
}, {
  message: "Please provide all required fields for the selected credentials type",
  path: ["credentialsType"],
});

const statusUpdateSchema = z.object({
  status: z.string().min(1, "Status is required"),
  adminNotes: z.string().optional(),
  assignedTo: z.string().optional(),
});

const referralUpdateSchema = z.object({
  referralCode: z.string().optional(),
  referralCodeId: z.number().optional(),
  salesStaffName: z.string().optional(),
  salesStaffStore: z.string().optional(),
});

function TvSetupManagement() {
  const [selectedBooking, setSelectedBooking] = useState<TvSetupBooking | null>(null);
  const [showCredentialsDialog, setShowCredentialsDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showReferralDialog, setShowReferralDialog] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Forms
  const credentialsForm = useForm<z.infer<typeof credentialsSchema>>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: {
      credentialsType: "iptv" as const,
      serverHostname: "",
      serverUsername: "",
      serverPassword: "",
      numberOfDevices: 1,
      m3uUrl: "",
    },
  });

  const statusForm = useForm<z.infer<typeof statusUpdateSchema>>({
    resolver: zodResolver(statusUpdateSchema),
    defaultValues: {
      status: "",
      adminNotes: "",
      assignedTo: "",
    },
  });

  const referralForm = useForm<z.infer<typeof referralUpdateSchema>>({
    resolver: zodResolver(referralUpdateSchema),
    defaultValues: {
      referralCode: "",
      salesStaffName: "",
      salesStaffStore: "",
    },
  });

  // Queries
  const { data: bookings = [], isLoading } = useQuery<TvSetupBooking[]>({
    queryKey: ["/api/admin/tv-setup-bookings"],
    retry: false,
  });

  // Mutations
  const updateCredentialsMutation = useMutation({
    mutationFn: async ({ bookingId, credentials }: { bookingId: number; credentials: z.infer<typeof credentialsSchema> }) => {
      await apiRequest("POST", `/api/admin/tv-setup-booking/${bookingId}/credentials`, credentials);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tv-setup-bookings"] });
      toast({
        title: "Success",
        description: "Credentials updated successfully",
      });
      setShowCredentialsDialog(false);
      credentialsForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update credentials",
        variant: "destructive",
      });
    },
  });

  const sendCredentialsEmailMutation = useMutation({
    mutationFn: async (bookingId: number) => {
      await apiRequest("POST", `/api/admin/tv-setup-booking/${bookingId}/send-credentials`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tv-setup-bookings"] });
      toast({
        title: "Success",
        description: "Credentials email sent successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send credentials email",
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: number; status: z.infer<typeof statusUpdateSchema> }) => {
      await apiRequest("POST", `/api/admin/tv-setup-booking/${bookingId}/status`, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tv-setup-bookings"] });
      toast({
        title: "Success",
        description: "Status updated successfully",
      });
      setShowStatusDialog(false);
      statusForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    },
  });

  const updateReferralMutation = useMutation({
    mutationFn: async ({ bookingId, referral }: { bookingId: number; referral: z.infer<typeof referralUpdateSchema> }) => {
      await apiRequest("POST", `/api/admin/tv-setup-booking/${bookingId}/referral`, referral);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tv-setup-bookings"] });
      toast({
        title: "Success",
        description: "Referral information updated successfully",
      });
      setShowReferralDialog(false);
      referralForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update referral",
        variant: "destructive",
      });
    },
  });

  const sendPaymentLinkMutation = useMutation({
    mutationFn: async (bookingId: number) => {
      await apiRequest("POST", `/api/tv-setup-booking/${bookingId}/send-payment`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tv-setup-bookings"] });
      toast({
        title: "Success",
        description: "Payment link created and will be sent to customer",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create payment link",
        variant: "destructive",
      });
    },
  });

  const markCredentialsPaidMutation = useMutation({
    mutationFn: async (bookingId: number) => {
      await apiRequest("POST", `/api/admin/tv-setup-booking/${bookingId}/mark-credentials-paid`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tv-setup-bookings"] });
      toast({
        title: "Success",
        description: "IPTV credentials payment marked as received",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to mark payment as received",
        variant: "destructive",
      });
    },
  });

  const completeSetupMutation = useMutation({
    mutationFn: async (bookingId: number) => {
      await apiRequest("POST", `/api/admin/tv-setup-bookings/${bookingId}/complete`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tv-setup-bookings"] });
      toast({
        title: "Success",
        description: "TV setup marked as completed and customer notified",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to complete setup",
        variant: "destructive",
      });
    },
  });

  const deleteBookingMutation = useMutation({
    mutationFn: async (bookingId: number) => {
      await apiRequest("DELETE", `/api/admin/tv-setup-booking/${bookingId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tv-setup-bookings"] });
      toast({
        title: "Success",
        description: "TV setup booking deleted successfully",
      });
      setShowDeleteDialog(false);
      setSelectedBooking(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete booking",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "outline",
      scheduled: "secondary",
      in_progress: "default",
      completed: "default",
      cancelled: "destructive",
    };
    
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      scheduled: "bg-blue-100 text-blue-800",
      in_progress: "bg-orange-100 text-orange-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };

    return (
      <Badge variant={variants[status] || "outline"} className={colors[status]}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getPaymentBadge = (status: string) => {
    return status === 'paid' ? (
      <Badge className="bg-green-100 text-green-800">PAID</Badge>
    ) : (
      <Badge variant="outline" className="bg-yellow-100 text-yellow-800">PENDING</Badge>
    );
  };

  const openCredentialsDialog = (booking: TvSetupBooking) => {
    setSelectedBooking(booking);
    // Set form values based on existing credentials
    credentialsForm.setValue("credentialsType", (booking.credentialsType as "iptv" | "m3u_url") || "iptv");
    credentialsForm.setValue("serverHostname", booking.serverHostname || "");
    credentialsForm.setValue("serverUsername", booking.serverUsername || "");
    credentialsForm.setValue("serverPassword", booking.serverPassword || "");
    credentialsForm.setValue("numberOfDevices", booking.numberOfDevices || 1);
    credentialsForm.setValue("m3uUrl", booking.m3uUrl || "");
    setShowCredentialsDialog(true);
  };

  const openStatusDialog = (booking: TvSetupBooking) => {
    setSelectedBooking(booking);
    statusForm.setValue("status", booking.setupStatus);
    statusForm.setValue("adminNotes", booking.adminNotes || "");
    statusForm.setValue("assignedTo", booking.assignedTo || "");
    setShowStatusDialog(true);
  };

  const openDetailsDialog = (booking: TvSetupBooking) => {
    setSelectedBooking(booking);
    setShowDetailsDialog(true);
  };

  const openDeleteDialog = (booking: TvSetupBooking) => {
    setSelectedBooking(booking);
    setShowDeleteDialog(true);
  };

  const openReferralDialog = (booking: TvSetupBooking) => {
    setSelectedBooking(booking);
    referralForm.setValue("referralCode", booking.referralCode || "");
    referralForm.setValue("salesStaffName", booking.salesStaffName || "");
    referralForm.setValue("salesStaffStore", booking.salesStaffStore || "");
    setShowReferralDialog(true);
  };

  const handleDeleteBooking = () => {
    if (!selectedBooking) return;
    deleteBookingMutation.mutate(selectedBooking.id);
  };

  const onCredentialsSubmit = (values: z.infer<typeof credentialsSchema>) => {
    if (!selectedBooking) return;
    updateCredentialsMutation.mutate({
      bookingId: selectedBooking.id,
      credentials: values,
    });
  };

  const onStatusSubmit = (values: z.infer<typeof statusUpdateSchema>) => {
    if (!selectedBooking) return;
    updateStatusMutation.mutate({
      bookingId: selectedBooking.id,
      status: values,
    });
  };

  const onReferralSubmit = (values: z.infer<typeof referralUpdateSchema>) => {
    if (!selectedBooking) return;
    updateReferralMutation.mutate({
      bookingId: selectedBooking.id,
      referral: values,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Tv className="h-5 w-5" />
            <span>TV Setup Service Management</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Tv className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No TV setup bookings found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Booking ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>TV Details</TableHead>
                    <TableHead>MAC Address</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Setup Status</TableHead>
                    <TableHead>Credentials</TableHead>
                    <TableHead>Referral</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking: TvSetupBooking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-mono">#{booking.id}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{booking.name}</div>
                          <div className="text-sm text-gray-500">{booking.email}</div>
                          <div className="text-sm text-gray-500">{booking.mobile}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{booking.tvBrand} {booking.tvModel}</div>
                          <div className="text-sm text-gray-500">
                            {booking.isSmartTv === 'yes' ? `Smart TV (${booking.tvOs})` : 'Not Smart TV'}
                          </div>
                          <div className="text-sm text-gray-500">Year: {booking.yearOfPurchase}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {booking.macAddressProvided ? (
                            <div>
                              <Badge className="bg-green-100 text-green-800 mb-1">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                PROVIDED
                              </Badge>
                              <div className="text-sm font-mono text-gray-700">{booking.macAddress}</div>
                              {booking.macAddressProvidedAt && (
                                <div className="text-xs text-gray-500">
                                  {format(new Date(booking.macAddressProvidedAt), "MMM dd, HH:mm")}
                                </div>
                              )}
                            </div>
                          ) : (
                            <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                              <Clock className="h-3 w-3 mr-1" />
                              REQUIRED
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              {getPaymentBadge(booking.paymentStatus)}
                              <span className="text-sm font-medium">€{booking.paymentAmount}</span>
                            </div>
                            {booking.credentialsPaymentRequired && (
                              <div className="flex items-center gap-2">
                                <Badge 
                                  className={
                                    booking.credentialsPaymentStatus === 'paid' 
                                      ? "bg-green-100 text-green-800" 
                                      : "bg-orange-100 text-orange-800"
                                  }
                                >
                                  {booking.credentialsPaymentStatus === 'paid' ? 'IPTV PAID' : 'IPTV DUE'}
                                </Badge>
                                <span className="text-xs font-medium">€{booking.credentialsPaymentAmount || 50}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {getStatusBadge(booking.setupStatus)}
                          {booking.assignedTo && (
                            <div className="text-xs text-gray-500 font-mono">
                              <div className="text-gray-700 font-normal">Stored in:</div>
                              {booking.assignedTo}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {booking.credentialsProvided ? (
                            <Badge className="bg-green-100 text-green-800">
                              <Key className="h-3 w-3 mr-1" />
                              PROVIDED
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-red-100 text-red-800">
                              <XCircle className="h-3 w-3 mr-1" />
                              PENDING
                            </Badge>
                          )}
                          {booking.credentialsEmailSent && (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                              <Mail className="h-3 w-3 mr-1" />
                              SENT
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {booking.referralCode ? (
                            <div>
                              <Badge variant="secondary" className="bg-purple-100 text-purple-800 mb-1">
                                <Target className="h-3 w-3 mr-1" />
                                {booking.referralCode}
                              </Badge>
                              {booking.salesStaffName && (
                                <div className="text-xs text-gray-500">
                                  {booking.salesStaffName}
                                </div>
                              )}
                              {booking.salesStaffStore && (
                                <div className="text-xs text-gray-400">
                                  {booking.salesStaffStore}
                                </div>
                              )}
                            </div>
                          ) : (
                            <Badge variant="outline" className="bg-gray-100 text-gray-500">
                              No Referral
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {format(new Date(booking.createdAt), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDetailsDialog(booking)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openCredentialsDialog(booking)}
                          >
                            <Key className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openStatusDialog(booking)}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openReferralDialog(booking)}
                            title="Edit Referral"
                          >
                            <Target className="h-4 w-4" />
                          </Button>
                          {booking.credentialsProvided && !booking.credentialsEmailSent && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => sendCredentialsEmailMutation.mutate(booking.id)}
                              disabled={sendCredentialsEmailMutation.isPending}
                            >
                              {sendCredentialsEmailMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Send className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                          {booking.credentialsProvided && booking.credentialsPaymentRequired && booking.credentialsPaymentStatus !== 'paid' && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => sendPaymentLinkMutation.mutate(booking.id)}
                              disabled={sendPaymentLinkMutation.isPending}
                              className="bg-green-600 hover:bg-green-700"
                              title="Send IPTV Payment Link"
                            >
                              {sendPaymentLinkMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CreditCard className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                          {booking.macAddressProvided && booking.credentialsProvided && booking.credentialsPaymentStatus !== 'paid' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => markCredentialsPaidMutation.mutate(booking.id)}
                              disabled={markCredentialsPaidMutation.isPending}
                              className="bg-blue-50 hover:bg-blue-100 border-blue-200"
                              title="Mark IPTV Payment as Received"
                            >
                              {markCredentialsPaidMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                          {booking.credentialsPaymentStatus === 'paid' && booking.setupStatus !== 'completed' && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => completeSetupMutation.mutate(booking.id)}
                              disabled={completeSetupMutation.isPending}
                              className="bg-green-600 hover:bg-green-700"
                              title="Mark Setup as Completed"
                            >
                              {completeSetupMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => openDeleteDialog(booking)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Booking Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>TV Setup Booking Details</DialogTitle>
            <DialogDescription>
              Complete details for booking #{selectedBooking?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>Customer Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div><Label className="font-medium">Name:</Label> {selectedBooking.name}</div>
                    <div><Label className="font-medium">Email:</Label> {selectedBooking.email}</div>
                    <div><Label className="font-medium">Mobile:</Label> {selectedBooking.mobile}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center space-x-2">
                      <Tv className="h-4 w-4" />
                      <span>TV Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div><Label className="font-medium">Brand:</Label> {selectedBooking.tvBrand}</div>
                    <div><Label className="font-medium">Model:</Label> {selectedBooking.tvModel}</div>
                    <div><Label className="font-medium">Smart TV:</Label> {selectedBooking.isSmartTv}</div>
                    {selectedBooking.tvOs && (
                      <div><Label className="font-medium">OS:</Label> {selectedBooking.tvOs}</div>
                    )}
                    <div><Label className="font-medium">Year:</Label> {selectedBooking.yearOfPurchase}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center space-x-2">
                      <Euro className="h-4 w-4" />
                      <span>Payment & Status</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div><Label className="font-medium">Payment:</Label> {getPaymentBadge(selectedBooking.paymentStatus)}</div>
                    <div><Label className="font-medium">Amount:</Label> €{selectedBooking.paymentAmount}</div>
                    <div><Label className="font-medium">Setup Status:</Label> {getStatusBadge(selectedBooking.setupStatus)}</div>
                    {selectedBooking.assignedTo && (
                      <div>
                        <Label className="font-medium">Credentials Storage Email:</Label> 
                        <span className="font-mono text-sm ml-2">{selectedBooking.assignedTo}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center space-x-2">
                      <Key className="h-4 w-4" />
                      <span>Credentials Status</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="font-medium">Provided:</Label>{" "}
                      {selectedBooking.credentialsProvided ? (
                        <Badge className="bg-green-100 text-green-800">Yes</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-100 text-red-800">No</Badge>
                      )}
                    </div>
                    <div>
                      <Label className="font-medium">Email Sent:</Label>{" "}
                      {selectedBooking.credentialsEmailSent ? (
                        <Badge className="bg-green-100 text-green-800">Yes</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-100 text-red-800">No</Badge>
                      )}
                    </div>
                    {selectedBooking.credentialsSentAt && (
                      <div>
                        <Label className="font-medium">Sent At:</Label>{" "}
                        {format(new Date(selectedBooking.credentialsSentAt), "MMM dd, yyyy HH:mm")}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Recommended Apps for Setup</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">Based on the TV details, recommend these apps:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedBooking.isSmartTv === 'yes' ? (
                        <>
                          <Badge variant="outline" className="bg-green-50 text-green-700">FreeView+ (if available)</Badge>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">SaorView Player</Badge>
                          <Badge variant="outline" className="bg-purple-50 text-purple-700">Tivimate</Badge>
                          <Badge variant="outline" className="bg-orange-50 text-orange-700">Smart STB</Badge>
                        </>
                      ) : (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700">External streaming device required</Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      Verify compatibility with {selectedBooking.tvBrand} {selectedBooking.tvModel} ({selectedBooking.yearOfPurchase})
                      {selectedBooking.tvOs && ` running ${selectedBooking.tvOs}`}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {selectedBooking.additionalNotes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Additional Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{selectedBooking.additionalNotes}</p>
                  </CardContent>
                </Card>
              )}

              {selectedBooking.adminNotes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Admin Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{selectedBooking.adminNotes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Credentials Management Dialog */}
      <Dialog open={showCredentialsDialog} onOpenChange={setShowCredentialsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Login Credentials</DialogTitle>
            <DialogDescription>
              Set up streaming app login credentials for booking #{selectedBooking?.id}
            </DialogDescription>
          </DialogHeader>
          <Form {...credentialsForm}>
            <form onSubmit={credentialsForm.handleSubmit(onCredentialsSubmit)} className="space-y-6">
              {/* Credentials Type Selector */}
              <FormField
                control={credentialsForm.control}
                name="credentialsType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Credentials Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select credentials type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="iptv">IPTV Login Details</SelectItem>
                        <SelectItem value="m3u_url">M3U URL</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* IPTV Login Details Section */}
              {credentialsForm.watch("credentialsType") === "iptv" && (
                <div className="space-y-4 border rounded-lg p-4 bg-blue-50">
                  <h3 className="font-semibold text-lg text-blue-900 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    IPTV LOGIN DETAILS
                    <Badge className="bg-green-100 text-green-800 text-xs">RECOMMENDED</Badge>
                  </h3>

                  <FormField
                    control={credentialsForm.control}
                    name="serverHostname"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">SERVER HOSTNAME</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="http://536429.solanaflix.com:8080/" 
                            {...field} 
                            className="font-mono text-sm"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={credentialsForm.control}
                    name="serverUsername"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">SERVER USERNAME</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="TV-10105389" 
                            {...field} 
                            className="font-mono text-sm"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={credentialsForm.control}
                    name="serverPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">SERVER PASSWORD</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="530090324041" 
                            {...field} 
                            className="font-mono text-sm"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={credentialsForm.control}
                    name="numberOfDevices"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">
                          NUMBER OF DEVICES
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1" 
                            max="10" 
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                            value={field.value || 1}
                            className="w-20"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* M3U URL Section */}
              {credentialsForm.watch("credentialsType") === "m3u_url" && (
                <div className="space-y-4 border rounded-lg p-4 bg-yellow-50">
                  <h3 className="font-semibold text-lg text-yellow-900 flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    M3U URL
                    <Badge className="bg-yellow-100 text-yellow-800 text-xs">NOT RECOMMENDED</Badge>
                  </h3>
                  
                  <div className="flex gap-2 mb-4">
                    <Button
                      type="button"
                      size="sm"
                      className="bg-green-500 hover:bg-green-600 text-white"
                    >
                      MPEGTS
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="text-gray-600"
                    >
                      HLS
                    </Button>
                  </div>

                  <FormField
                    control={credentialsForm.control}
                    name="m3uUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea 
                            placeholder="http://536429.solanaflix.com/get.php?username=TV-10105389&password=530090324041&type=m3u_plus" 
                            {...field} 
                            className="font-mono text-sm resize-none"
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowCredentialsDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateCredentialsMutation.isPending}>
                  {updateCredentialsMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Key className="h-4 w-4 mr-2" />
                  )}
                  Save Credentials
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Booking Status</DialogTitle>
            <DialogDescription>
              Update the status and details for booking #{selectedBooking?.id}
            </DialogDescription>
          </DialogHeader>
          <Form {...statusForm}>
            <form onSubmit={statusForm.handleSubmit(onStatusSubmit)} className="space-y-4">
              <FormField
                control={statusForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Setup Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={statusForm.control}
                name="assignedTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Credentials Storage Email</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g. tvsetup1tradesbook@fastmail.com" 
                        {...field} 
                        type="email"
                      />
                    </FormControl>
                    <p className="text-xs text-gray-500 mt-1">
                      Email address where this client's login credentials are stored
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={statusForm.control}
                name="adminNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Admin Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Add any admin notes..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowStatusDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateStatusMutation.isPending}>
                  {updateStatusMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Settings className="h-4 w-4 mr-2" />
                  )}
                  Update Status
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent aria-describedby="delete-booking-description">
          <DialogHeader>
            <DialogTitle>Delete TV Setup Booking</DialogTitle>
            <DialogDescription id="delete-booking-description">
              Are you sure you want to permanently delete this TV setup booking? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className="py-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-medium text-red-800 mb-2">Booking to be deleted:</h4>
                <div className="text-sm text-red-700 space-y-1">
                  <p><strong>ID:</strong> #{selectedBooking.id}</p>
                  <p><strong>Customer:</strong> {selectedBooking.name}</p>
                  <p><strong>Email:</strong> {selectedBooking.email}</p>
                  <p><strong>TV:</strong> {selectedBooking.tvBrand} {selectedBooking.tvModel}</p>
                  <p><strong>Status:</strong> {selectedBooking.setupStatus}</p>
                  <p><strong>Payment:</strong> €{selectedBooking.paymentAmount} ({selectedBooking.paymentStatus})</p>
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
              onClick={handleDeleteBooking}
              disabled={deleteBookingMutation.isPending}
            >
              {deleteBookingMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Permanently
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Referral Update Dialog */}
      <Dialog open={showReferralDialog} onOpenChange={setShowReferralDialog}>
        <DialogContent className="max-w-md" aria-describedby="referral-update-description">
          <DialogHeader>
            <DialogTitle>Update Referral Information</DialogTitle>
            <DialogDescription id="referral-update-description">
              Manually link or update referral information for this TV setup booking.
            </DialogDescription>
          </DialogHeader>
          <Form {...referralForm}>
            <form onSubmit={referralForm.handleSubmit(onReferralSubmit)} className="space-y-4">
              <FormField
                control={referralForm.control}
                name="referralCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Referral Code</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter referral code" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={referralForm.control}
                name="salesStaffName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sales Staff Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter sales staff name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={referralForm.control}
                name="salesStaffStore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sales Staff Store</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select store" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="CKM">Carrickmines</SelectItem>
                          <SelectItem value="CRK">Cork</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowReferralDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateReferralMutation.isPending}
                >
                  {updateReferralMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Target className="h-4 w-4 mr-2" />
                      Update Referral
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default TvSetupManagement;