import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, CheckCircle, XCircle, Clock, Euro, TrendingUp, Users, AlertCircle } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface RefundRequest {
  id: number;
  installerId: number;
  bookingId: number;
  originalLeadFee: string;
  refundReason: string;
  refundAmount: string;
  installerNotes?: string;
  status: 'pending' | 'approved' | 'denied' | 'processed';
  requestedDate: string;
  automaticApproval: boolean;
}

interface QualityMetrics {
  totalBookings: number;
  verifiedBookings: number;
  highRiskBookings: number;
  averageQualityScore: number;
  refundRate: number;
  fraudDetections: number;
}

export default function FraudPreventionDashboard() {
  const { toast } = useToast();
  const [selectedRefund, setSelectedRefund] = useState<RefundRequest | null>(null);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

  // Fetch refund requests
  const { data: refundRequests = [], isLoading: refundsLoading } = useQuery({
    queryKey: ['/api/admin/fraud-prevention/refund-requests'],
  });

  // Fetch real quality metrics
  const { data: qualityMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['/api/admin/fraud-prevention/quality-metrics'],
    queryFn: async () => {
      const response = await fetch('/api/admin/fraud-prevention/quality-metrics');
      if (!response.ok) throw new Error('Failed to fetch quality metrics');
      return response.json();
    }
  });

  // Fetch anti-manipulation data
  const { data: antiManipulationData } = useQuery({
    queryKey: ['/api/admin/fraud-prevention/anti-manipulation'],
  });

  // Fetch customer verification data
  const { data: customerVerificationData } = useQuery({
    queryKey: ['/api/admin/fraud-prevention/customer-verification'],
  });

  // Fetch risk distribution data
  const { data: riskDistributionData } = useQuery({
    queryKey: ['/api/admin/fraud-prevention/risk-distribution'],
  });

  const realQualityMetrics: QualityMetrics = qualityMetrics || {
    totalBookings: 0,
    verifiedBookings: 0,
    highRiskBookings: 0,
    averageQualityScore: 0,
    refundRate: 0,
    fraudDetections: 0
  };

  // Approve refund mutation
  const approveRefundMutation = useMutation({
    mutationFn: async ({ refundId, notes }: { refundId: number; notes?: string }) => {
      return apiRequest('POST', `/api/admin/fraud-prevention/approve-refund/${refundId}`, { adminNotes: notes });
    },
    onSuccess: () => {
      toast({
        title: "Refund Approved",
        description: "Installer credit has been added to their wallet.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/fraud-prevention/refund-requests'] });
      setShowRefundDialog(false);
      setSelectedRefund(null);
      setAdminNotes('');
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to approve refund",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleApproveRefund = (refund: RefundRequest) => {
    setSelectedRefund(refund);
    setShowRefundDialog(true);
  };

  const confirmApproval = () => {
    if (selectedRefund) {
      approveRefundMutation.mutate({
        refundId: selectedRefund.id,
        notes: adminNotes
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'denied': return 'bg-red-100 text-red-800';
      case 'processed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getReasonIcon = (reason: string) => {
    switch (reason) {
      case 'customer_unresponsive': return <Clock className="w-4 h-4" />;
      case 'fake_booking': return <AlertTriangle className="w-4 h-4" />;
      case 'customer_ghosted': return <XCircle className="w-4 h-4" />;
      case 'technical_issue': return <AlertCircle className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const formatReason = (reason: string) => {
    return reason.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Shield className="h-8 w-8 text-blue-600" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Fraud Prevention</h2>
          <p className="text-gray-600">Protect installers and maintain platform integrity</p>
        </div>
      </div>

      {/* Quality Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Platform Trust Score</p>
                <p className="text-2xl font-bold text-green-600">{realQualityMetrics.averageQualityScore}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {realQualityMetrics.verifiedBookings} of {realQualityMetrics.totalBookings} bookings verified
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Refund Rate</p>
                <p className="text-2xl font-bold text-yellow-600">{realQualityMetrics.refundRate}%</p>
              </div>
              <Euro className="h-8 w-8 text-yellow-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Within industry standard (&lt; 15%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">High Risk Bookings</p>
                <p className="text-2xl font-bold text-red-600">{realQualityMetrics.highRiskBookings}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Require manual review
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="refunds" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="refunds">Lead Refunds</TabsTrigger>
          <TabsTrigger value="quality">Quality Tracking</TabsTrigger>
          <TabsTrigger value="prevention">Anti-Manipulation</TabsTrigger>
        </TabsList>

        {/* Lead Refunds Tab */}
        <TabsContent value="refunds">
          <Card>
            <CardHeader>
              <CardTitle>Lead Refund Requests</CardTitle>
              <p className="text-sm text-gray-600">
                Review and approve refund requests from installers
              </p>
            </CardHeader>
            <CardContent>
              {refundsLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse bg-gray-200 h-16 rounded"></div>
                  ))}
                </div>
              ) : refundRequests.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-600">No pending refund requests</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {refundRequests.map((refund: RefundRequest) => (
                    <div key={refund.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getReasonIcon(refund.refundReason)}
                          <div>
                            <p className="font-medium">Booking #{refund.bookingId}</p>
                            <p className="text-sm text-gray-600">
                              Installer ID: {refund.installerId}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge className={getStatusColor(refund.status)}>
                            {refund.status}
                          </Badge>
                          {refund.automaticApproval && (
                            <Badge variant="outline" className="text-blue-600">
                              Auto-Eligible
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Reason</p>
                          <p className="font-medium">{formatReason(refund.refundReason)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Original Fee</p>
                          <p className="font-medium">€{refund.originalLeadFee}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Refund Amount</p>
                          <p className="font-medium text-green-600">€{refund.refundAmount}</p>
                        </div>
                      </div>

                      {refund.installerNotes && (
                        <div>
                          <p className="text-sm text-gray-600">Installer Notes</p>
                          <p className="text-sm bg-gray-50 p-2 rounded">{refund.installerNotes}</p>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2">
                        <p className="text-xs text-gray-500">
                          Requested: {new Date(refund.requestedDate).toLocaleDateString()}
                        </p>
                        {refund.status === 'pending' && (
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleApproveRefund(refund)}
                            >
                              Review & Approve
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quality Tracking Tab */}
        <TabsContent value="quality">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Verification Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Phone Verified</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: `${customerVerificationData?.phoneVerified?.percentage || 0}%` }}></div>
                      </div>
                      <span className="text-sm text-gray-600">{customerVerificationData?.phoneVerified?.percentage || 0}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Email Verified</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: `${customerVerificationData?.emailVerified?.percentage || 0}%` }}></div>
                      </div>
                      <span className="text-sm text-gray-600">{customerVerificationData?.emailVerified?.percentage || 0}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Identity Verified</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${customerVerificationData?.identityVerified?.percentage || 0}%` }}></div>
                      </div>
                      <span className="text-sm text-gray-600">{customerVerificationData?.identityVerified?.percentage || 0}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Risk Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded"></div>
                      <span>Low Risk</span>
                    </div>
                    <span className="font-medium">{riskDistributionData?.lowRisk?.percentage || 0}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                      <span>Medium Risk</span>
                    </div>
                    <span className="font-medium">{riskDistributionData?.mediumRisk?.percentage || 0}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded"></div>
                      <span>High Risk</span>
                    </div>
                    <span className="font-medium">{riskDistributionData?.highRisk?.percentage || 0}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Anti-Manipulation Tab */}
        <TabsContent value="prevention">
          <div className="space-y-6">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Anti-manipulation systems are actively monitoring for suspicious patterns including:
                rapid cancellations, price discrepancies, QR code sharing, and off-platform negotiations.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{antiManipulationData?.rapidCancellations || 0}</p>
                  <p className="text-sm text-gray-600">Rapid Cancellations</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <TrendingUp className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{antiManipulationData?.priceDiscrepancies || 0}</p>
                  <p className="text-sm text-gray-600">Price Discrepancies</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Users className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{antiManipulationData?.qrCodeSharing || 0}</p>
                  <p className="text-sm text-gray-600">QR Code Sharing</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{antiManipulationData?.flaggedForReview || 0}</p>
                  <p className="text-sm text-gray-600">Flagged for Review</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Refund Approval Dialog */}
      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Approve Refund Request</DialogTitle>
            <DialogDescription>
              Review and approve this refund request from installer #{selectedRefund?.installerId}
            </DialogDescription>
          </DialogHeader>
          
          {selectedRefund && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Booking:</span>
                  <span className="font-medium">#{selectedRefund.bookingId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Reason:</span>
                  <span className="font-medium">{formatReason(selectedRefund.refundReason)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Refund Amount:</span>
                  <span className="font-medium text-green-600">€{selectedRefund.refundAmount}</span>
                </div>
                {selectedRefund.automaticApproval && (
                  <Badge variant="outline" className="text-blue-600">
                    Auto-Eligible
                  </Badge>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Admin Notes (Optional)</label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add any notes about this approval..."
                  className="mt-1"
                />
              </div>

              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowRefundDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={confirmApproval}
                  disabled={approveRefundMutation.isPending}
                >
                  {approveRefundMutation.isPending ? 'Processing...' : 'Approve Refund'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}