import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Settings, Home, Calendar, TrendingUp, Euro, Users, Wallet, Phone } from "lucide-react";
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
                    <p className="text-sm text-gray-600">Lead Requests</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Phone className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Leads This Month</p>
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
                    <p className="text-sm text-gray-600">Lead Fee Revenue</p>
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
                    <p className="text-sm text-gray-600">Avg Lead Fee</p>
                    <p className="text-2xl font-bold text-gray-900">{formatPrice(stats.appFees)}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Lead Fee Management */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Lead Fee Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-blue-900 mb-2">Current Lead Fees</h4>
                    <div className="space-y-2 text-sm text-blue-800">
                      <div className="flex justify-between">
                        <span>Table Mount Small:</span>
                        <span className="font-medium">€12</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Bronze Wall Mount:</span>
                        <span className="font-medium">€20</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Silver Premium:</span>
                        <span className="font-medium">€25</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Gold Premium:</span>
                        <span className="font-medium">€35</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-medium text-green-900 mb-2">Installer Profit Margins</h4>
                    <div className="space-y-2 text-sm text-green-800">
                      <div className="flex justify-between">
                        <span>Table Mount (€60):</span>
                        <span className="font-medium">80% margin</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Bronze (€120):</span>
                        <span className="font-medium">83% margin</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Silver (€180):</span>
                        <span className="font-medium">86% margin</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Gold (€380):</span>
                        <span className="font-medium">91% margin</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Lead Requests */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Lead Requests</CardTitle>
                  <Button variant="outline" size="sm">View All</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 text-sm font-medium text-gray-600">Customer</th>
                        <th className="text-left py-3 text-sm font-medium text-gray-600">Service Type</th>
                        <th className="text-left py-3 text-sm font-medium text-gray-600">Created</th>
                        <th className="text-left py-3 text-sm font-medium text-gray-600">Est. Value</th>
                        <th className="text-left py-3 text-sm font-medium text-gray-600">Lead Fee</th>
                        <th className="text-left py-3 text-sm font-medium text-gray-600">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr>
                        <td className="py-4 text-sm">John Smith</td>
                        <td className="py-4 text-sm">Silver Premium (55")</td>
                        <td className="py-4 text-sm">2 hours ago</td>
                        <td className="py-4 text-sm font-medium">€180</td>
                        <td className="py-4 text-sm font-medium text-primary">€25</td>
                        <td className="py-4">
                          <Badge className="bg-blue-100 text-blue-800">Available</Badge>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-4 text-sm">Mary O'Connor</td>
                        <td className="py-4 text-sm">Bronze Mount (43")</td>
                        <td className="py-4 text-sm">4 hours ago</td>
                        <td className="py-4 text-sm font-medium">€120</td>
                        <td className="py-4 text-sm font-medium text-primary">€20</td>
                        <td className="py-4">
                          <Badge className="bg-yellow-100 text-yellow-800">Assigned</Badge>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-4 text-sm">David Walsh</td>
                        <td className="py-4 text-sm">Gold Premium (75")</td>
                        <td className="py-4 text-sm">6 hours ago</td>
                        <td className="py-4 text-sm font-medium">€380</td>
                        <td className="py-4 text-sm font-medium text-primary">€35</td>
                        <td className="py-4">
                          <Badge className="bg-green-100 text-green-800">Completed</Badge>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-4 text-sm">Lisa Murphy</td>
                        <td className="py-4 text-sm">Table Mount (32")</td>
                        <td className="py-4 text-sm">1 day ago</td>
                        <td className="py-4 text-sm font-medium">€60</td>
                        <td className="py-4 text-sm font-medium text-primary">€12</td>
                        <td className="py-4">
                          <Badge className="bg-green-100 text-green-800">Completed</Badge>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-4 text-sm">Tom Brady</td>
                        <td className="py-4 text-sm">Silver Premium (65")</td>
                        <td className="py-4 text-sm">1 day ago</td>
                        <td className="py-4 text-sm font-medium">€180</td>
                        <td className="py-4 text-sm font-medium text-primary">€25</td>
                        <td className="py-4">
                          <Badge className="bg-orange-100 text-orange-800">In Progress</Badge>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Harvey Norman Sales Staff Referral Management */}
          <div className="lg:col-span-3 mt-8">
            <HarveyNormanReferralManagement />
          </div>
        </div>
      </div>
    </div>
  );
}

function HarveyNormanReferralManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newCode, setNewCode] = useState({
    salesStaffName: '',
    salesStaffStore: '',
    customCode: ''
  });

  const { data: referralCodes = [] } = useQuery({
    queryKey: ["/api/harvey-norman/codes"],
  });

  const createCodeMutation = useMutation({
    mutationFn: async (data: { salesStaffName: string; salesStaffStore: string; customCode?: string }) => {
      const response = await apiRequest('POST', '/api/harvey-norman/create-code', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/harvey-norman/codes"] });
      setNewCode({ salesStaffName: '', salesStaffStore: '', customCode: '' });
      toast({
        title: "Referral Code Created",
        description: "Harvey Norman sales staff code created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Creation Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const deactivateCodeMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('POST', `/api/harvey-norman/deactivate/${id}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/harvey-norman/codes"] });
      toast({
        title: "Code Deactivated",
        description: "Referral code has been deactivated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Deactivation Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleCreateCode = () => {
    if (!newCode.salesStaffName.trim() || !newCode.salesStaffStore.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter sales staff name and store location.",
        variant: "destructive",
      });
      return;
    }
    createCodeMutation.mutate(newCode);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Badge className="mr-3 bg-blue-600">Harvey Norman</Badge>
          Sales Staff Referral Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Create New Code */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Create New Sales Staff Code</h3>
            <div className="space-y-3">
              <div>
                <Label htmlFor="staffName">Sales Staff Name</Label>
                <Input
                  id="staffName"
                  value={newCode.salesStaffName}
                  onChange={(e) => setNewCode(prev => ({ ...prev, salesStaffName: e.target.value }))}
                  placeholder="e.g., John Smith"
                />
              </div>
              <div>
                <Label htmlFor="staffStore">Store Location</Label>
                <Input
                  id="staffStore"
                  value={newCode.salesStaffStore}
                  onChange={(e) => setNewCode(prev => ({ ...prev, salesStaffStore: e.target.value }))}
                  placeholder="e.g., Carrickmines, Santry, etc."
                />
              </div>
              <div>
                <Label htmlFor="customCode">Custom Code (Optional)</Label>
                <Input
                  id="customCode"
                  value={newCode.customCode}
                  onChange={(e) => setNewCode(prev => ({ ...prev, customCode: e.target.value.toUpperCase() }))}
                  placeholder="Leave blank for auto-generation"
                />
              </div>
              <Button 
                onClick={handleCreateCode}
                disabled={createCodeMutation.isPending}
                className="w-full"
              >
                {createCodeMutation.isPending ? 'Creating...' : 'Create Referral Code'}
              </Button>
            </div>
          </div>

          {/* Active Codes */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Active Referral Codes</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {referralCodes.length === 0 ? (
                <p className="text-muted-foreground text-sm">No referral codes created yet.</p>
              ) : (
                referralCodes.map((code: any) => (
                  <div key={code.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-mono text-lg font-bold text-blue-600">{code.referralCode}</div>
                        <div className="text-sm text-muted-foreground">
                          {code.salesStaffName} • {code.salesStaffStore}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          10% customer discount • Created {new Date(code.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={code.isActive ? "default" : "secondary"}>
                          {code.isActive ? "Active" : "Inactive"}
                        </Badge>
                        {code.isActive && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deactivateCodeMutation.mutate(code.id)}
                            disabled={deactivateCodeMutation.isPending}
                          >
                            Deactivate
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Information Panel */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">How Harvey Norman Referrals Work</h4>
          <div className="text-sm text-blue-800 space-y-1">
            <p>• Sales staff provide unique codes to customers for 10% discounts</p>
            <p>• Customers save money, Harvey Norman builds relationships</p>
            <p>• Installers pay the full lead fee plus 10% subsidy when claiming discounted leads</p>
            <p>• Platform revenue remains consistent while supporting retail partnerships</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
