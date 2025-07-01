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
  Timer
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

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

interface AvailableLead {
  id: number;
  address: string;
  serviceType: string;
  estimatedTotal: string;
  leadFee: number;
  estimatedEarnings: number;
  profitMargin: number;
  tvSize: string;
  wallType: string;
  mountType: string;
  createdAt: string;
}

interface InstallerWalletDashboardProps {
  installerId: number;
}

export default function InstallerWalletDashboard({ installerId }: InstallerWalletDashboardProps) {
  const [creditAmount, setCreditAmount] = useState('50');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch wallet data
  const { data: walletData, isLoading: walletLoading } = useQuery<WalletData>({
    queryKey: [`/api/installer/${installerId}/wallet`],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch available leads
  const { data: availableLeads = [], isLoading: leadsLoading } = useQuery<AvailableLead[]>({
    queryKey: [`/api/installer/${installerId}/available-leads`],
    refetchInterval: 30000,
  });

  // Add credits mutation
  const addCreditsMutation = useMutation({
    mutationFn: async (amount: number) => {
      return apiRequest(`/api/installer/${installerId}/wallet/add-credits`, {
        method: 'POST',
        body: JSON.stringify({ amount }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/installer/${installerId}/wallet`] });
      toast({
        title: "Credits Added",
        description: `€${creditAmount} has been added to your wallet`,
      });
      setCreditAmount('50');
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add credits",
        variant: "destructive",
      });
    },
  });

  // Purchase lead mutation
  const purchaseLeadMutation = useMutation({
    mutationFn: async ({ bookingId, leadFee }: { bookingId: number; leadFee: number }) => {
      return apiRequest(`/api/installer/${installerId}/purchase-lead`, {
        method: 'POST',
        body: JSON.stringify({ bookingId, leadFee }),
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/installer/${installerId}/wallet`] });
      queryClient.invalidateQueries({ queryKey: [`/api/installer/${installerId}/available-leads`] });
      toast({
        title: "Lead Purchased!",
        description: "You can now contact the customer directly",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Purchase Failed",
        description: error.message || "Insufficient balance or error occurred",
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

  const handlePurchaseLead = (lead: AvailableLead) => {
    if (parseFloat(walletData?.wallet.balance || '0') < lead.leadFee) {
      toast({
        title: "Insufficient Balance",
        description: `You need €${lead.leadFee} to purchase this lead`,
        variant: "destructive",
      });
      return;
    }

    purchaseLeadMutation.mutate({
      bookingId: lead.id,
      leadFee: lead.leadFee,
    });
  };

  const formatCurrency = (amount: string | number) => {
    return `€${parseFloat(amount.toString()).toFixed(2)}`;
  };

  const getServiceTypeDisplay = (serviceType: string) => {
    const types: Record<string, string> = {
      'table-top-small': 'Table Mount (Small)',
      'table-top-large': 'Table Mount (Large)',
      'bronze': 'Bronze Wall Mount',
      'silver': 'Silver Wall Mount',
      'silver-large': 'Silver Wall Mount (Large)',
      'gold': 'Gold Premium Install',
      'gold-large': 'Gold Premium (Large)',
    };
    return types[serviceType] || serviceType;
  };

  const getProfitMarginColor = (margin: number) => {
    if (margin >= 85) return 'text-green-600';
    if (margin >= 80) return 'text-yellow-600';
    return 'text-red-600';
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

      <Tabs defaultValue="leads" className="space-y-4">
        <TabsList>
          <TabsTrigger value="leads">Available Leads ({availableLeads.length})</TabsTrigger>
          <TabsTrigger value="wallet">Wallet Management</TabsTrigger>
          <TabsTrigger value="transactions">Transaction History</TabsTrigger>
        </TabsList>

        <TabsContent value="leads" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Available Installation Requests</CardTitle>
              <CardDescription>
                Purchase lead access to contact customers directly. You pay upfront, customer pays you directly.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {leadsLoading ? (
                <div className="text-center py-4">Loading available leads...</div>
              ) : availableLeads.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>No leads available at the moment</p>
                  <p className="text-sm">Check back soon for new installation requests</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {availableLeads.map((lead) => (
                    <Card key={lead.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">{getServiceTypeDisplay(lead.serviceType)}</Badge>
                              <Badge variant="secondary">{lead.tvSize}" TV</Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-gray-500">Location</p>
                                <p className="font-medium flex items-center">
                                  <MapPin className="w-3 h-3 mr-1" />
                                  {lead.address.split(',').slice(-2).join(', ')}
                                </p>
                              </div>
                              
                              <div>
                                <p className="text-gray-500">Customer Estimate</p>
                                <p className="font-medium text-green-600">
                                  {formatCurrency(lead.estimatedTotal)}
                                </p>
                              </div>
                              
                              <div>
                                <p className="text-gray-500">Your Profit</p>
                                <p className="font-medium text-blue-600">
                                  {formatCurrency(lead.estimatedEarnings)}
                                </p>
                              </div>
                              
                              <div>
                                <p className="text-gray-500">Profit Margin</p>
                                <p className={`font-medium ${getProfitMarginColor(lead.profitMargin)}`}>
                                  {lead.profitMargin.toFixed(1)}%
                                </p>
                              </div>
                            </div>

                            <div className="mt-3 text-xs text-gray-500 flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              Requested {new Date(lead.createdAt).toLocaleDateString()}
                            </div>
                          </div>

                          <div className="text-right ml-4">
                            <div className="mb-2">
                              <p className="text-sm text-gray-500">Lead Fee</p>
                              <p className="text-xl font-bold text-red-600">
                                {formatCurrency(lead.leadFee)}
                              </p>
                            </div>
                            
                            <Button
                              onClick={() => handlePurchaseLead(lead)}
                              disabled={purchaseLeadMutation.isPending || parseFloat(walletData?.wallet.balance || '0') < lead.leadFee}
                              className="w-full"
                            >
                              {purchaseLeadMutation.isPending ? (
                                <>
                                  <Timer className="w-4 h-4 mr-2 animate-spin" />
                                  Processing...
                                </>
                              ) : (
                                <>
                                  <Euro className="w-4 h-4 mr-2" />
                                  Purchase Lead
                                </>
                              )}
                            </Button>
                            
                            {parseFloat(walletData?.wallet.balance || '0') < lead.leadFee && (
                              <p className="text-xs text-red-500 mt-1">Insufficient balance</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wallet" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add Credits</CardTitle>
              <CardDescription>
                Top up your wallet to purchase lead access. Credits never expire.
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
                    min="10"
                    max="500"
                  />
                </div>
                <Button
                  onClick={handleAddCredits}
                  disabled={addCreditsMutation.isPending || !creditAmount || parseFloat(creditAmount) < 10}
                >
                  {addCreditsMutation.isPending ? (
                    <>
                      <Timer className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add €{creditAmount}
                    </>
                  )}
                </Button>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                {['50', '100', '200'].map((amount) => (
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
    </div>
  );
}