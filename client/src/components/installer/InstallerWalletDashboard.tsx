import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Wallet, 
  CreditCard, 
  TrendingUp, 
  MapPin, 
  Clock, 
  Euro,
  Plus,
  Eye,
  AlertCircle,
  CheckCircle,
  Timer,
  Crown,
  Calendar,
  Shield,
  Zap,
  Star
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import VipSubscriptionModal from './VipSubscriptionModal';

interface WalletData {
  wallet: {
    balance: string;
    totalSpent: string;
    totalEarned: string;
  };
  transactions: Array<{
    id: number;
    type: string;
    amount: string;
    description: string;
    status: string;
    createdAt: string;
  }>;
}



interface InstallerWalletDashboardProps {
  installerId: number;
}

export default function InstallerWalletDashboard({ installerId }: InstallerWalletDashboardProps) {
  const [creditAmount, setCreditAmount] = useState('35');
  const [showVipModal, setShowVipModal] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch wallet data
  const { data: walletData, isLoading: walletLoading } = useQuery<WalletData>({
    queryKey: [`/api/installer/${installerId}/wallet`],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch installer profile for VIP status
  const { data: installerProfile } = useQuery({
    queryKey: ['/api/installers/profile'],
    select: (data: any) => {
      // If user is admin, find the installer by ID, otherwise use the profile directly
      if (data?.role === 'admin') {
        return data?.installers?.find((installer: any) => installer.id === installerId);
      }
      return data;
    }
  });

  // Calculate days left in subscription cycle
  const calculateDaysLeft = (subscriptionPeriodEnd: string | null) => {
    if (!subscriptionPeriodEnd) return null;
    const endDate = new Date(subscriptionPeriodEnd);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const daysLeft = calculateDaysLeft(installerProfile?.subscriptionCurrentPeriodEnd);



  // Add credits mutation (demo account only)
  const addCreditsMutation = useMutation({
    mutationFn: async (amount: number) => {
      if (installerId === 2) {
        // Demo account - use simulation endpoint
        return apiRequest('POST', `/api/installer/${installerId}/wallet/add-credits-demo`, { amount });
      } else {
        // Real installer - redirect to Stripe checkout
        const currentUrl = window.location.origin;
        window.location.href = `/credit-checkout?installerId=${installerId}&amount=${amount}`;
        return Promise.resolve({ success: true });
      }
    },
    onSuccess: (response) => {
      if (installerId === 2) {
        queryClient.invalidateQueries({ queryKey: [`/api/installer/${installerId}/wallet`] });
        toast({
          title: "Demo Credits Added",
          description: response.message || `€${creditAmount} has been added to your wallet`,
        });
        setCreditAmount('35');
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add credits",
        variant: "destructive",
      });
    },
  });



  const handleAddCredits = () => {
    const amount = parseFloat(creditAmount);
    if (amount > 0) {
      addCreditsMutation.mutate(amount);
    }
  };



  const formatCurrency = (amount: string | number) => {
    return `€${parseFloat(amount.toString()).toFixed(2)}`;
  };



  if (walletLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Wallet Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(walletData?.wallet.balance || '0')}
            </div>
            <p className="text-xs text-muted-foreground">Available for lead purchases</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(walletData?.wallet.totalSpent || '0')}
            </div>
            <p className="text-xs text-muted-foreground">On lead purchases</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(walletData?.wallet.totalEarned || '0')}
            </div>
            <p className="text-xs text-muted-foreground">From completed jobs</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="wallet" className="space-y-4">
        <TabsList>
          <TabsTrigger value="wallet">Wallet Management</TabsTrigger>
          <TabsTrigger value="vip">VIP Subscription</TabsTrigger>
          <TabsTrigger value="transactions">Transaction History</TabsTrigger>
        </TabsList>



        <TabsContent value="wallet" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add Credits</CardTitle>
              <CardDescription>
                {installerId === 2 
                  ? "Demo Account: Simulate adding credits to test lead purchasing functionality. No real payment required."
                  : "Top up your wallet to purchase lead access. Credits never expire."
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    type="number"
                    placeholder="Amount"
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(e.target.value)}
                    min="5"
                    max="500"
                  />
                </div>
                <Button
                  onClick={handleAddCredits}
                  disabled={addCreditsMutation.isPending || !creditAmount || parseFloat(creditAmount) < 5}
                >
                  {addCreditsMutation.isPending ? (
                    <>
                      <Timer className="w-4 h-4 mr-2 animate-spin" />
                      {installerId === 2 ? "Processing..." : "Redirecting..."}
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      {installerId === 2 ? `Add €${creditAmount}` : `Pay €${creditAmount}`}
                    </>
                  )}
                </Button>
              </div>
              
              <div className="grid grid-cols-4 gap-2">
                {['5', '15', '35', '100'].map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    onClick={() => setCreditAmount(amount)}
                    className="text-sm"
                  >
                    €{amount}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vip" className="space-y-4">
          {/* VIP Status Overview */}
          <Card className={installerProfile?.isVip ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className={`w-5 h-5 ${installerProfile?.isVip ? 'text-yellow-600' : 'text-gray-400'}`} />
                VIP Membership Status
              </CardTitle>
              <CardDescription>
                {installerProfile?.isVip 
                  ? 'You are enjoying all VIP benefits' 
                  : 'Upgrade to VIP for exclusive benefits and lead fee exemption'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${installerProfile?.isVip ? 'bg-yellow-100' : 'bg-gray-100'}`}>
                    <Crown className={`w-5 h-5 ${installerProfile?.isVip ? 'text-yellow-600' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <p className="font-medium">
                      {installerProfile?.isVip ? 'VIP Active' : 'Standard Member'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {installerProfile?.isVip 
                        ? (installerProfile.subscriptionStatus === 'active' ? 'Active subscription' : 'VIP status active')
                        : 'Pay per lead'
                      }
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {installerProfile?.isVip ? (
                    <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                      VIP
                    </Badge>
                  ) : (
                    <Button 
                      onClick={() => setShowVipModal(true)}
                      className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
                    >
                      <Crown className="w-4 h-4 mr-2" />
                      Upgrade to VIP
                    </Button>
                  )}
                </div>
              </div>

              {/* Billing Cycle Information */}
              {installerProfile?.isVip && daysLeft !== null && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-blue-500" />
                        <span className="font-medium text-sm">Billing Cycle</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-600">{daysLeft}</p>
                      <p className="text-xs text-gray-500">days remaining</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Euro className="w-4 h-4 text-green-500" />
                        <span className="font-medium text-sm">Monthly Rate</span>
                      </div>
                      <p className="text-2xl font-bold text-green-600">€50</p>
                      <p className="text-xs text-gray-500">per month</p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* VIP Benefits */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    VIP Benefits
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full mt-1 ${installerProfile?.isVip ? 'bg-green-100' : 'bg-gray-100'}`}>
                        <Shield className={`w-4 h-4 ${installerProfile?.isVip ? 'text-green-600' : 'text-gray-400'}`} />
                      </div>
                      <div>
                        <p className="font-medium">No Lead Fees</p>
                        <p className="text-sm text-gray-600">Save €12-35 per lead purchase</p>
                        {installerProfile?.isVip && (
                          <Badge variant="secondary" className="mt-1 text-xs bg-green-100 text-green-800">Active</Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full mt-1 ${installerProfile?.isVip ? 'bg-blue-100' : 'bg-gray-100'}`}>
                        <Zap className={`w-4 h-4 ${installerProfile?.isVip ? 'text-blue-600' : 'text-gray-400'}`} />
                      </div>
                      <div>
                        <p className="font-medium">Priority Support</p>
                        <p className="text-sm text-gray-600">24/7 dedicated VIP support</p>
                        {installerProfile?.isVip && (
                          <Badge variant="secondary" className="mt-1 text-xs bg-blue-100 text-blue-800">Available</Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full mt-1 ${installerProfile?.isVip ? 'bg-purple-100' : 'bg-gray-100'}`}>
                        <Eye className={`w-4 h-4 ${installerProfile?.isVip ? 'text-purple-600' : 'text-gray-400'}`} />
                      </div>
                      <div>
                        <p className="font-medium">Early Lead Access</p>
                        <p className="text-sm text-gray-600">See new leads before others</p>
                        {installerProfile?.isVip && (
                          <Badge variant="secondary" className="mt-1 text-xs bg-purple-100 text-purple-800">Active</Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full mt-1 ${installerProfile?.isVip ? 'bg-orange-100' : 'bg-gray-100'}`}>
                        <TrendingUp className={`w-4 h-4 ${installerProfile?.isVip ? 'text-orange-600' : 'text-gray-400'}`} />
                      </div>
                      <div>
                        <p className="font-medium">Enhanced Profile</p>
                        <p className="text-sm text-gray-600">VIP badge and priority listing</p>
                        {installerProfile?.isVip && (
                          <Badge variant="secondary" className="mt-1 text-xs bg-orange-100 text-orange-800">Active</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Subscription Management */}
              {installerProfile?.isVip ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Subscription Management</CardTitle>
                    <CardDescription>Manage your VIP subscription settings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">Next billing date</p>
                        <p className="text-sm text-gray-600">
                          {installerProfile.subscriptionCurrentPeriodEnd 
                            ? new Date(installerProfile.subscriptionCurrentPeriodEnd).toLocaleDateString('en-IE', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })
                            : 'Not available'
                          }
                        </p>
                      </div>
                      <Badge variant="outline">€50.00</Badge>
                    </div>
                    
                    <div className="pt-4 border-t">
                      <p className="text-sm text-gray-600 mb-3">
                        Your VIP subscription will automatically renew. You can manage your subscription in your Stripe customer portal.
                      </p>
                      <Button variant="outline" className="w-full">
                        <CreditCard className="w-4 h-4 mr-2" />
                        Manage Subscription
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-2 border-dashed border-yellow-300 bg-yellow-50">
                  <CardContent className="p-6 text-center">
                    <Crown className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Unlock VIP Benefits</h3>
                    <p className="text-gray-600 mb-4">
                      For just €50/month, eliminate lead fees and access exclusive VIP features
                    </p>
                    <Button 
                      onClick={() => setShowVipModal(true)}
                      className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
                    >
                      <Crown className="w-4 h-4 mr-2" />
                      Subscribe to VIP
                    </Button>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>Your recent wallet activity</CardDescription>
            </CardHeader>
            <CardContent>
              {walletData?.transactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>No transactions yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {walletData?.transactions.map((transaction) => (
                    <div key={transaction.id} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(transaction.createdAt).toLocaleDateString()} • {transaction.type.replace('_', ' ')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${parseFloat(transaction.amount) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {parseFloat(transaction.amount) > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                        </p>
                        <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'}>
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* VIP Subscription Modal */}
      <VipSubscriptionModal
        open={showVipModal}
        onOpenChange={setShowVipModal}
        installerId={installerId}
      />
    </div>
  );
}