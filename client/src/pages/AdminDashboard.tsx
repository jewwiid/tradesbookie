import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Settings, Home, Calendar, TrendingUp, Euro, Percent } from "lucide-react";
import { formatPrice, formatDate } from "@/lib/utils";
import { useLocation } from "wouter";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ["/api/admin/stats"],
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ["/api/admin/bookings"],
  });

  const { data: serviceTiers = [] } = useQuery({
    queryKey: ["/api/service-tiers"],
  });

  const updateFeeMutation = useMutation({
    mutationFn: async ({ tierId, feePercentage }: { tierId: number; feePercentage: number }) => {
      const response = await apiRequest('PATCH', `/api/admin/service-tiers/${tierId}/fee`, {
        feePercentage
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-tiers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Fee updated successfully",
        description: "The fee structure has been updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleFeeUpdate = (tierId: number, feePercentage: string) => {
    const fee = parseFloat(feePercentage);
    if (isNaN(fee) || fee < 0 || fee > 100) {
      toast({
        title: "Invalid fee percentage",
        description: "Please enter a valid percentage between 0 and 100.",
        variant: "destructive",
      });
      return;
    }
    updateFeeMutation.mutate({ tierId, feePercentage: fee });
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      confirmed: 'bg-blue-100 text-blue-800',
      assigned: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-orange-100 text-orange-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Settings className="h-8 w-8 text-primary mr-3" />
              <span className="text-xl font-bold text-gray-900">Admin Dashboard</span>
            </div>
            <Button variant="ghost" onClick={() => setLocation('/')}>
              <Home className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Bookings</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
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
                    <p className="text-sm text-gray-600">This Month</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.monthlyBookings}</p>
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
                    <p className="text-sm text-gray-600">Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">{formatPrice(stats.revenue)}</p>
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
                    <p className="text-sm text-gray-600">App Fees</p>
                    <p className="text-2xl font-bold text-gray-900">{formatPrice(stats.appFees)}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <Percent className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Fee Management */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Fee Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {serviceTiers.map((tier) => (
                    <div key={tier.id}>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">
                        {tier.name}
                      </Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          defaultValue={tier.feePercentage}
                          className="flex-1"
                          onBlur={(e) => {
                            if (e.target.value !== tier.feePercentage) {
                              handleFeeUpdate(tier.id, e.target.value);
                            }
                          }}
                        />
                        <span className="text-sm text-gray-600">%</span>
                      </div>
                    </div>
                  ))}
                </div>
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
                        <th className="text-left py-3 text-sm font-medium text-gray-600">Fee</th>
                        <th className="text-left py-3 text-sm font-medium text-gray-600">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {bookings.slice(0, 10).map((booking) => (
                        <tr key={booking.id}>
                          <td className="py-4 text-sm">{booking.user?.name || 'Unknown'}</td>
                          <td className="py-4 text-sm">
                            {booking.serviceTier?.name} ({booking.tvSize}")
                          </td>
                          <td className="py-4 text-sm">
                            {booking.scheduledDate ? formatDate(booking.scheduledDate) : 'Not scheduled'}
                          </td>
                          <td className="py-4 text-sm font-medium">{formatPrice(booking.totalPrice)}</td>
                          <td className="py-4 text-sm font-medium text-primary">{formatPrice(booking.appFee)}</td>
                          <td className="py-4">
                            <Badge className={getStatusBadge(booking.status)}>
                              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                            </Badge>
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
