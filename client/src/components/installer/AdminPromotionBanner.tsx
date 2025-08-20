import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Gift, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Zap,
  Star
} from 'lucide-react';

interface AdminPromotionBannerProps {
  installerId: number;
}

interface AdminPromotionStatus {
  isActive: boolean;
  title: string;
  description: string;
  message?: string;
}

export default function AdminPromotionBanner({ installerId }: AdminPromotionBannerProps) {
  // Fetch admin promotion status
  const { data: promotionStatus, isLoading } = useQuery<AdminPromotionStatus>({
    queryKey: [`/api/installers/${installerId}/admin-promotion-status`],
    enabled: !!installerId, // Only query if installerId is defined
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Don't render anything if installerId is not available
  if (!installerId) {
    return null;
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-gray-200 animate-pulse" />
            <span className="text-sm text-gray-500">Checking promotion status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!promotionStatus?.isActive) {
    // Don't show anything if promotion is not active
    return null;
  }

  return (
    <Card className="border-blue-200 bg-blue-50 mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-blue-800 text-base sm:text-lg">
          <Star className="w-5 h-5 flex-shrink-0" />
          <span className="leading-tight">{promotionStatus.title}</span>
        </CardTitle>
        <CardDescription className="text-blue-700 text-sm leading-relaxed mt-2">
          {promotionStatus.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Badges section - stack on mobile */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="default" className="bg-blue-600">
              <Zap className="w-3 h-3 mr-1" />
              No Lead Fees
            </Badge>
            <Badge variant="outline" className="border-blue-600 text-blue-700">
              <CheckCircle className="w-3 h-3 mr-1" />
              Active Now
            </Badge>
          </div>
          
          {/* Message text */}
          {promotionStatus.message && (
            <p className="text-sm text-blue-700 font-medium">
              {promotionStatus.message}
            </p>
          )}
          
          {/* Auto-apply status */}
          <div className="flex items-center space-x-1 text-blue-600">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">Automatically applied to all leads</span>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-blue-100 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs sm:text-sm text-blue-700">
              <p className="font-medium mb-1">How it works:</p>
              <p className="leading-relaxed">All lead fees are currently waived as part of our special promotion. You can purchase leads without any fees during this promotion period!</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}