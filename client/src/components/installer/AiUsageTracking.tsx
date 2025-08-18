import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Zap, 
  Calendar, 
  Clock, 
  TrendingUp, 
  Brain, 
  FileText, 
  Search, 
  MessageSquare,
  Monitor,
  Gift
} from "lucide-react";
import { format } from "date-fns";

interface CreditUsage {
  feature: string;
  freeCount: number;
  paidCount: number;
}

interface CreditSummary {
  totalCredits: number;
  usageByFeature: CreditUsage[];
  freeUsageLimit: number;
}

const AI_FEATURE_NAMES: Record<string, string> = {
  'tv-preview': 'TV Preview',
  'product-care': 'Product Care Analysis', 
  'faq': 'AI Help Chat',
  'product-info': 'Product Information',
  'email-template': 'Email Templates',
  'tv-comparison': 'TV Comparisons'
};

const AI_FEATURE_ICONS: Record<string, any> = {
  'tv-preview': Monitor,
  'product-care': FileText,
  'faq': MessageSquare,
  'product-info': Search,
  'email-template': FileText,
  'tv-comparison': TrendingUp
};

export default function AiUsageTracking() {
  const { data: creditSummary, refetch } = useQuery<CreditSummary>({
    queryKey: ['/api/ai/usage-summary'],
    staleTime: 30000, // Refetch every 30 seconds
    retry: false,
  });

  if (!creditSummary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="w-5 h-5" />
            <span>AI Tools Usage</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500">Loading AI usage data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalCredits = creditSummary?.totalCredits || 0;
  const freeLimit = creditSummary?.freeUsageLimit || 3;
  const usageData = creditSummary?.usageByFeature || [];

  // Calculate total usage
  const totalFreeUsed = usageData.reduce((sum, usage) => sum + usage.freeCount, 0);
  const totalPaidUsed = usageData.reduce((sum, usage) => sum + usage.paidCount, 0);
  const totalUsage = totalFreeUsed + totalPaidUsed;

  return (
    <div className="space-y-6">
      {/* Credits Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-800">Available Credits</p>
                <p className="text-2xl font-bold text-yellow-900">{totalCredits}</p>
              </div>
              <Zap className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">Free Requests Used</p>
                <p className="text-2xl font-bold text-green-900">{totalFreeUsed}</p>
              </div>
              <Gift className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">Total AI Requests</p>
                <p className="text-2xl font-bold text-blue-900">{totalUsage}</p>
              </div>
              <Brain className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Usage Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>AI Tools Usage by Feature</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {usageData.length > 0 ? (
            <div className="space-y-4">
              {usageData.map((usage) => {
                const featureName = AI_FEATURE_NAMES[usage.feature] || usage.feature;
                const IconComponent = AI_FEATURE_ICONS[usage.feature] || Brain;
                const totalFeatureUsage = usage.freeCount + usage.paidCount;
                const freePercentage = totalFeatureUsage > 0 ? (usage.freeCount / totalFeatureUsage) * 100 : 0;

                return (
                  <div key={usage.feature} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <IconComponent className="w-5 h-5 text-blue-600" />
                        <span className="font-medium">{featureName}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          {usage.freeCount} free
                        </Badge>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {usage.paidCount} paid
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Free usage ({freeLimit} limit per feature per day)</span>
                        <span>{usage.freeCount}/{freeLimit}</span>
                      </div>
                      <Progress 
                        value={(usage.freeCount / freeLimit) * 100} 
                        className="h-2"
                      />
                    </div>

                    {usage.paidCount > 0 && (
                      <div className="mt-2 text-sm text-gray-600">
                        <span>Credits used for additional requests: {usage.paidCount}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Brain className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 mb-2">No AI tool usage yet</p>
              <p className="text-sm text-gray-400">
                Start using AI tools to analyze products, get recommendations, and more!
              </p>
              <div className="mt-4">
                <Button variant="outline" onClick={() => refetch()}>
                  <Clock className="w-4 h-4 mr-2" />
                  Refresh Usage Data
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Free Usage Information */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Gift className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">Free Daily AI Requests</h4>
              <p className="text-sm text-blue-800">
                You get <strong>{freeLimit} free AI requests per feature per day</strong> (resets every 24 hours). 
                After using your free requests, additional requests cost 1 credit each.
              </p>
              <p className="text-xs text-blue-700 mt-2">
                Use AI tools to help customers with product information, care analysis, and recommendations!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}