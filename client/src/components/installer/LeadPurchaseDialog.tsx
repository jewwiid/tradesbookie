import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  MapPin, 
  Euro, 
  Gift, 
  Wallet, 
  CreditCard, 
  CheckCircle, 
  AlertCircle,
  Clock,
  Calendar,
  Heart,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface Lead {
  id: number;
  customerName: string;
  address: string;
  tvSize: string;
  serviceType: string;
  estimatedPrice: string;
  difficulty: string;
  urgency: string;
  distance?: string;
  earnings?: string;
  leadFee?: number;
}

interface BookingDetails {
  id: number;
  customerName?: string;
  address?: string;
  preferredDate?: string;
  preferredTime?: string;
  status?: string;
}

interface VoucherEligibility {
  eligible: boolean;
  reason: string;
  voucherAmount?: number;
}

interface WalletData {
  wallet: {
    balance: string;
  };
}

interface LeadPurchaseDialogProps {
  lead: Lead | null;
  installerId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPurchaseSuccess?: () => void;
}

export default function LeadPurchaseDialog({ 
  lead, 
  installerId, 
  open, 
  onOpenChange,
  onPurchaseSuccess 
}: LeadPurchaseDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch voucher eligibility
  const { data: voucherEligibility } = useQuery<VoucherEligibility>({
    queryKey: [`/api/installers/${installerId}/first-lead-eligibility`],
    enabled: !!installerId && open,
  });

  // Fetch wallet data
  const { data: walletData } = useQuery<WalletData>({
    queryKey: [`/api/installer/${installerId}/wallet`],
    enabled: !!installerId && open,
  });

  // Fetch booking details to get customer preferences
  const { data: bookingDetails } = useQuery<BookingDetails>({
    queryKey: [`/api/bookings/${lead?.id}`],
    enabled: !!lead?.id && open,
    queryFn: async () => {
      const response = await fetch(`/api/bookings/${lead!.id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    }
  });

  // Purchase lead mutation
  const purchaseLeadMutation = useMutation({
    mutationFn: async () => {
      if (!lead) throw new Error('No lead selected');
      
      // If voucher is available, use it first
      if (voucherEligibility?.eligible && voucherEligibility.voucherAmount) {
        // Use voucher for the purchase
        const voucherResponse = await apiRequest('POST', `/api/installers/${installerId}/use-first-lead-voucher`, {
          bookingId: lead.id,
          originalLeadFee: lead.leadFee || 0
        });
        
        const voucherData = await voucherResponse.json();
        if (voucherData.success) {
          // Complete the lead assignment after voucher application
          const purchaseResponse = await apiRequest('POST', `/api/installer/${installerId}/purchase-lead/${lead.id}`);
          return await purchaseResponse.json();
        }
      }
      
      // Regular wallet-based purchase
      const response = await apiRequest('POST', `/api/installer/${installerId}/purchase-lead/${lead.id}`);
      return await response.json();
    },
    onSuccess: (responseData) => {
      queryClient.invalidateQueries({ queryKey: [`/api/installer/${installerId}/wallet`] });
      queryClient.invalidateQueries({ queryKey: [`/api/installer/${installerId}/available-leads`] });
      queryClient.invalidateQueries({ queryKey: [`/api/installer/${installerId}/past-leads`] });
      queryClient.invalidateQueries({ queryKey: [`/api/installers/${installerId}/first-lead-eligibility`] });
      
      const wasVoucherUsed = voucherEligibility?.eligible && voucherEligibility.voucherAmount;
      
      toast({
        title: "Lead Purchased Successfully!",
        description: wasVoucherUsed 
          ? "Your first lead voucher was applied - this lead fee was covered! Customer details are now available."
          : responseData.message || "Customer contact details are now available in your purchased leads.",
      });
      
      onOpenChange(false);
      onPurchaseSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Purchase Failed",
        description: error.message || "Failed to purchase lead. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (!lead) return null;

  const leadFee = lead.leadFee || 0;
  const walletBalance = parseFloat(walletData?.wallet.balance || '0');
  const hasVoucher = voucherEligibility?.eligible && voucherEligibility.voucherAmount;
  const voucherAmount = voucherEligibility?.voucherAmount || 0;
  const finalCost = hasVoucher ? Math.max(0, leadFee - voucherAmount) : leadFee;
  const canAfford = walletBalance >= finalCost;

  const handlePurchase = () => {
    setIsProcessing(true);
    purchaseLeadMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5" />
            <span>Purchase Lead Access</span>
          </DialogTitle>
          <DialogDescription>
            Review the details and complete your lead purchase
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Lead Details */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{lead.customerName}</span>
                  <Badge variant="outline">{lead.tvSize}</Badge>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <MapPin className="w-3 h-3" />
                  <span>{lead.address}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Service: {lead.serviceType}</span>
                  <span className="font-medium">Est. €{lead.estimatedPrice}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Preferred Schedule */}
          {bookingDetails?.preferredDate && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <Heart className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-green-900 mb-2">Customer's Preferred Schedule</h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-green-800">
                          {new Date(bookingDetails.preferredDate).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long', 
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      {bookingDetails.preferredTime && (
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-green-600" />
                          <span className="font-medium text-green-800">
                            {(() => {
                              const timeSlots = [
                                { value: '9:00', label: '9:00 AM - 11:00 AM' },
                                { value: '11:00', label: '11:00 AM - 1:00 PM' },
                                { value: '13:00', label: '1:00 PM - 3:00 PM' },
                                { value: '15:00', label: '3:00 PM - 5:00 PM' },
                                { value: '17:00', label: '5:00 PM - 7:00 PM' }
                              ];
                              const slot = timeSlots.find(s => s.value === bookingDetails.preferredTime);
                              return slot ? slot.label : bookingDetails.preferredTime;
                            })()} 
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 p-2 bg-green-100 rounded">
                      <p className="text-xs text-green-700">
                        💡 <strong>Customer insight:</strong> This customer has specific time preferences. Matching their schedule will improve your chances of being selected!
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* No Preferred Schedule Notice */}
          {!bookingDetails?.preferredDate && bookingDetails && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-3">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <p className="text-sm text-amber-800">
                    Customer didn't specify a preferred schedule - you can propose any convenient time!
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Voucher Application */}
          {hasVoucher && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Gift className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-green-800">First Lead Voucher Applied</span>
                  <Badge variant="default" className="bg-green-600">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Auto-Applied
                  </Badge>
                </div>
                <p className="text-sm text-green-700">
                  Your voucher will cover {voucherAmount} Credits of this lead fee, making this your free first lead!
                </p>
              </CardContent>
            </Card>
          )}

          {/* Pricing Breakdown */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Cost</span>
                  <span>{leadFee} Credits</span>
                </div>
                
                {hasVoucher && (
                  <>
                    <div className="flex items-center justify-between text-green-600">
                      <span>Voucher Discount</span>
                      <span>-{voucherAmount} Credits</span>
                    </div>
                    <Separator />
                  </>
                )}
                
                <div className="flex items-center justify-between font-medium text-lg">
                  <span>Total Cost</span>
                  <span className={finalCost === 0 ? "text-green-600" : ""}>
                    {finalCost === 0 ? "FREE" : `${finalCost} Credits`}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Wallet Status */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Wallet className="w-4 h-4" />
                  <span>Tradesbook Credits</span>
                </div>
                <span className="font-medium">{walletBalance} Credits</span>
              </div>
              
              {!canAfford && !hasVoucher && (
                <div className="mt-2 flex items-center space-x-2 text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">Insufficient balance - add credits to continue</span>
                </div>
              )}
            </CardContent>
          </Card>

          {hasVoucher && finalCost === 0 && (
            <div className="bg-green-100 border border-green-200 rounded-lg p-3">
              <div className="flex items-center space-x-2 text-green-800">
                <Gift className="w-5 h-5" />
                <div>
                  <p className="font-medium">Welcome to tradesbook.ie!</p>
                  <p className="text-sm">This lead is completely free with your first lead voucher. Get started building your business!</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handlePurchase}
            disabled={(!canAfford && !hasVoucher) || purchaseLeadMutation.isPending}
            className={finalCost === 0 ? "bg-green-600 hover:bg-green-700" : ""}
          >
            {purchaseLeadMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : finalCost === 0 ? (
              <>
                <Gift className="w-4 h-4 mr-2" />
                Get Free Lead
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                Purchase for {finalCost} Credits
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}