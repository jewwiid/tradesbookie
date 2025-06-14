import { useState } from "react";
import { useLocation } from "wouter";
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
  Save
} from "lucide-react";

interface AdminStats {
  totalBookings: number;
  monthlyBookings: number;
  revenue: number;
  appFees: number;
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
  contact?: {
    name: string;
    email: string;
  };
  createdAt: string;
}

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
                        {booking.contact?.name || 'Unknown Customer'}
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
