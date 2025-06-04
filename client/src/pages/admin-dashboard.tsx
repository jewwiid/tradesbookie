import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navigation from "@/components/navigation";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Calendar, 
  TrendingUp, 
  Euro, 
  Percent, 
  Home,
  Settings
} from "lucide-react";
import { useLocation } from "wouter";

interface ServicePricing {
  id: number;
  serviceKey: string;
  serviceName: string;
  basePrice: string;
  appFeeRate: string;
  isActive: boolean;
}

interface BookingStats {
  totalBookings: number;
  monthlyBookings: number;
  totalRevenue: number;
  totalAppFees: number;
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [feeUpdates, setFeeUpdates] = useState<Record<string, string>>({});

  const { data: stats, isLoading: statsLoading } = useQuery<BookingStats>({
    queryKey: ['/api/admin/stats'],
  });

  const { data: servicePricing, isLoading: pricingLoading } = useQuery<ServicePricing[]>({
    queryKey: ['/api/service-pricing'],
  });

  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['/api/admin/bookings'],
  });

  const updateFeeMutation = useMutation({
    mutationFn: async ({ serviceKey, appFeeRate }: { serviceKey: string; appFeeRate: number }) => {
      await apiRequest('PUT', `/api/service-pricing/${serviceKey}`, { appFeeRate });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/service-pricing'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({
        title: "Success",
        description: "Fee structure updated successfully",
      });
      setFeeUpdates({});
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update fee structure",
        variant: "destructive",
      });
    },
  });

  const handleFeeUpdate = (serviceKey: string, value: string) => {
    setFeeUpdates(prev => ({ ...prev, [serviceKey]: value }));
  };

  const saveFeeUpdates = () => {
    Object.entries(feeUpdates).forEach(([serviceKey, rate]) => {
      const numericRate = parseFloat(rate);
      if (!isNaN(numericRate) && numericRate >= 0 && numericRate <= 100) {
        updateFeeMutation.mutate({ serviceKey, appFeeRate: numericRate });
      }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'assigned': return 'bg-yellow-100 text-yellow-800';
      case 'in-progress': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  if (statsLoading || pricingLoading || bookingsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Settings className="text-2xl text-primary mr-3" />
              <span className="text-xl font-bold text-gray-900">Admin Dashboard</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => setLocation('/')}>
                <Home className="h-4 w-4" />
              </Button>
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">A</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Bookings</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalBookings || 0}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">This Month</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.monthlyBookings || 0}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">€{stats?.totalRevenue?.toFixed(2) || '0.00'}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Euro className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">App Fees</p>
                  <p className="text-2xl font-bold text-gray-900">€{stats?.totalAppFees?.toFixed(2) || '0.00'}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Percent className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Fee Management */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Fee Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {servicePricing?.map((service) => (
                    <div key={service.serviceKey}>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">
                        {service.serviceName}
                      </Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={feeUpdates[service.serviceKey] ?? service.appFeeRate}
                          onChange={(e) => handleFeeUpdate(service.serviceKey, e.target.value)}
                          className="flex-1"
                        />
                        <span className="text-sm text-gray-600">%</span>
                      </div>
                    </div>
                  ))}
                </div>

                <Button 
                  className="w-full mt-6" 
                  onClick={saveFeeUpdates}
                  disabled={updateFeeMutation.isPending || Object.keys(feeUpdates).length === 0}
                >
                  {updateFeeMutation.isPending ? 'Updating...' : 'Update Fee Structure'}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Recent Bookings */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Bookings</CardTitle>
                  <Button variant="outline" size="sm">View All</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 text-sm font-medium text-gray-600">Customer</th>
                        <th className="text-left py-3 text-sm font-medium text-gray-600">Service</th>
                        <th className="text-left py-3 text-sm font-medium text-gray-600">Date</th>
                        <th className="text-left py-3 text-sm font-medium text-gray-600">Total</th>
                        <th className="text-left py-3 text-sm font-medium text-gray-600">App Fee</th>
                        <th className="text-left py-3 text-sm font-medium text-gray-600">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {bookings?.slice(0, 10).map((booking: any) => (
                        <tr key={booking.id}>
                          <td className="py-4 text-sm">{booking.customerName}</td>
                          <td className="py-4 text-sm">{booking.serviceType} {booking.tvSize}"</td>
                          <td className="py-4 text-sm">{formatDate(booking.scheduledDate)}</td>
                          <td className="py-4 text-sm font-medium">€{Number(booking.totalPrice).toFixed(2)}</td>
                          <td className="py-4 text-sm font-medium text-primary">€{Number(booking.appFee).toFixed(2)}</td>
                          <td className="py-4">
                            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(booking.status)}`}>
                              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
