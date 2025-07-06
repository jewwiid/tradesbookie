import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Gift, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Euro
} from 'lucide-react';

interface VoucherStatusProps {
  installerId: number;
}

interface VoucherEligibility {
  eligible: boolean;
  reason: string;
  voucherAmount?: number;
}

export default function VoucherStatus({ installerId }: VoucherStatusProps) {
  // Fetch voucher eligibility
  const { data: voucherEligibility, isLoading } = useQuery<VoucherEligibility>({
    queryKey: [`/api/installers/${installerId}/first-lead-eligibility`],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-gray-200 animate-pulse" />
            <span className="text-sm text-gray-500">Checking voucher status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!voucherEligibility?.eligible) {
    // Don't show anything if not eligible or system disabled
    return null;
  }

  return (
    <Card className="border-green-200 bg-green-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-green-800 text-base sm:text-lg">
          <Gift className="w-5 h-5 flex-shrink-0" />
          <span className="leading-tight">First Lead Voucher Available</span>
        </CardTitle>
        <CardDescription className="text-green-700 text-sm leading-relaxed mt-2">
          Get your first lead completely free to get started on our platform
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Badges section - stack on mobile */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="default" className="bg-green-600">
              <Euro className="w-3 h-3 mr-1" />
              {voucherEligibility.voucherAmount || 'Free Lead'}
            </Badge>
            <Badge variant="outline" className="border-green-600 text-green-700">
              <CheckCircle className="w-3 h-3 mr-1" />
              Ready to Use
            </Badge>
          </div>
          
          {/* Reason text */}
          <p className="text-sm text-green-700 font-medium">
            {voucherEligibility.reason}
          </p>
          
          {/* Auto-apply status */}
          <div className="flex items-center space-x-1 text-green-600">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">Auto-applies on purchase</span>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-green-100 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs sm:text-sm text-green-700">
              <p className="font-medium mb-1">How it works:</p>
              <p className="leading-relaxed">Your voucher will automatically be applied when you purchase your first lead, making it completely free. No action required!</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}