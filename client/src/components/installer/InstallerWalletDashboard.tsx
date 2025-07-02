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



interface InstallerWalletDashboardProps {
  installerId: number;
}

export default function InstallerWalletDashboard({ installerId }: InstallerWalletDashboardProps) {
  const [creditAmount, setCreditAmount] = useState('35');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch wallet data
  const { data: walletData, isLoading: walletLoading } = useQuery<WalletData>({
    queryKey: [`/api/installer/${installerId}/wallet`],
    refetchInterval: 30000, // Refresh every 30 seconds
  });



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
                {['5', '15', '35', '75'].map((amount) => (
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