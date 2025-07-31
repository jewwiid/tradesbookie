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
  Trash2
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
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const statusUpdateSchema = z.object({
  status: z.string().min(1, "Status is required"),
  adminNotes: z.string().optional(),
  assignedTo: z.string().optional(),
});

function TvSetupManagement() {
  const [selectedBooking, setSelectedBooking] = useState<TvSetupBooking | null>(null);
  const [showCredentialsDialog, setShowCredentialsDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Forms
  const credentialsForm = useForm<z.infer<typeof credentialsSchema>>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: {
      username: "",
      password: "",
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

  // Queries
  const { data: bookings = [], isLoading } = useQuery({
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
    credentialsForm.setValue("username", booking.appUsername || "");
    credentialsForm.setValue("password", booking.appPassword || "");
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
                    <TableHead>Payment</TableHead>
                    <TableHead>Setup Status</TableHead>
                    <TableHead>Credentials</TableHead>
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
                          {getPaymentBadge(booking.paymentStatus)}
                          <div className="text-sm font-medium">€{booking.paymentAmount}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {getStatusBadge(booking.setupStatus)}
                          {booking.assignedTo && (
                            <div className="text-sm text-gray-500">Assigned: {booking.assignedTo}</div>
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
                      <div><Label className="font-medium">Assigned To:</Label> {selectedBooking.assignedTo}</div>
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
            <form onSubmit={credentialsForm.handleSubmit(onCredentialsSubmit)} className="space-y-4">
              <FormField
                control={credentialsForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter username for streaming apps" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={credentialsForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter password for streaming apps" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                    <FormLabel>Assigned To (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter technician name" {...field} />
                    </FormControl>
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
    </div>
  );
}

export default TvSetupManagement;