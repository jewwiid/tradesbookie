import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { Zap, CreditCard, AlertTriangle, Gift } from 'lucide-react';

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

interface CreditDisplayProps {
  showDetailed?: boolean;
  onTopUpClick?: () => void;
}

const AI_FEATURE_NAMES: Record<string, string> = {
  'tv-preview': 'TV Preview',
  'product-care': 'Product Care Analysis', 
  'faq': 'AI Help Chat',
  'product-info': 'Product Information',
  'email-template': 'Email Templates',
  'tv-comparison': 'TV Comparisons'
};

export default function CreditDisplay({ showDetailed = false, onTopUpClick }: CreditDisplayProps) {
  const { user, isAuthenticated } = useAuth();
  
  const { data: creditSummary, refetch } = useQuery<CreditSummary>({
    queryKey: ['/api/ai/usage-summary'],
    enabled: isAuthenticated,
    staleTime: 30000, // Refetch every 30 seconds
    retry: false,
  });

  // Refresh credit info periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (isAuthenticated) {
        refetch();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, refetch]);

  if (!isAuthenticated) {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Gift className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-blue-800">
              <strong>3 free AI requests</strong> per feature as guest
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalCredits = creditSummary?.totalCredits || 0;
  const freeLimit = creditSummary?.freeUsageLimit || 3;

  if (!showDetailed) {
    // Compact display
    return (
      <div className="flex items-center justify-center space-x-4">
        <div className="flex items-center space-x-2">
          <Zap className="w-4 h-4 text-yellow-600" />
          <span className="text-sm font-medium">
            {totalCredits} credits
          </span>
        </div>
        {totalCredits < 5 && (
          <Badge variant="destructive" className="text-xs">
            Low credits
          </Badge>
        )}
      </div>
    );
  }

  // Detailed display
  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center space-x-2">
          <Zap className="w-5 h-5 text-yellow-600" />
          <span>AI Credits</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Current Balance */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Available Credits:</span>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold">{totalCredits}</span>
              {totalCredits < 5 && (
                <AlertTriangle className="w-4 h-4 text-orange-500" />
              )}
            </div>
          </div>

          {/* Usage by Feature */}
          {creditSummary?.usageByFeature && creditSummary.usageByFeature.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-800">Feature Usage:</h4>
              {creditSummary.usageByFeature.map((usage) => {
                const featureName = AI_FEATURE_NAMES[usage.feature] || usage.feature;
                const freeRemaining = Math.max(0, freeLimit - usage.freeCount);
                return (
                  <div key={usage.feature} className="flex justify-between text-xs">
                    <span className="text-gray-600">{featureName}:</span>
                    <div className="flex items-center space-x-2">
                      {freeRemaining > 0 ? (
                        <Badge variant="secondary" className="text-xs px-2 py-0">
                          {freeRemaining} free left
                        </Badge>
                      ) : (
                        <span className="text-gray-500">Free quota used</span>
                      )}
                      {usage.paidCount > 0 && (
                        <span className="text-gray-500">
                          ({usage.paidCount} paid)
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Low Credit Warning */}
          {totalCredits < 5 && (
            <div className="bg-orange-100 border border-orange-200 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-800">
                  Low Credits
                </span>
              </div>
              <p className="text-xs text-orange-700 mb-2">
                You're running low on AI credits. Top up to continue using premium features.
              </p>
              {onTopUpClick && (
                <Button
                  size="sm"
                  onClick={onTopUpClick}
                  className="w-full bg-orange-600 hover:bg-orange-700"
                >
                  <CreditCard className="w-3 h-3 mr-2" />
                  Top Up Credits
                </Button>
              )}
            </div>
          )}

          {/* Free Usage Info */}
          <div className="text-xs text-gray-600 bg-white p-2 rounded border">
            <Gift className="w-3 h-3 inline mr-1" />
            Each AI feature includes {freeLimit} free requests, then 1 credit per use.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}