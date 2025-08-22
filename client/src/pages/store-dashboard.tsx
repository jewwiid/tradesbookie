import { useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, QrCode, Users, TrendingUp, Calendar, LogOut, Store, Activity, Brain, Search, BarChart3, Zap, MessageSquare, Bot, Package } from "lucide-react";
import { format } from "date-fns";

interface StoreUser {
  id: number;
  email: string;
  storeName: string;
  retailerCode: string;
  storeCode?: string;
}

interface StoreMetrics {
  totalQrScans: number;
  qrScansThisMonth: number;
  totalReferralUses: number;
  referralUsesThisMonth: number;
  totalReferralEarnings: string;
  activeStaffCount: number;
  totalAiInteractions: number;
  aiInteractionsThisMonth: number;
  topAiTool: string;
  avgProcessingTime: number;
}

interface QrScan {
  qrCodeId: string;
  aiTool?: string;
  scannedAt: Date;
  sessionId: string;
}

interface ReferralUse {
  referralCode: string;
  staffName?: string;
  discountAmount: string;
  usedAt: Date;
}

interface AiInteraction {
  aiTool: string;
  interactionType: string;
  productQuery?: string;
  userPrompt?: string;
  recommendedProducts?: any[];
  processingTimeMs?: number;
  createdAt: Date;
  sessionId: string;
}

interface StoreDashboardData {
  storeInfo: {
    storeName: string;
    retailerCode: string;
    storeCode?: string;
  };
  metrics: StoreMetrics;
  recentActivity: {
    qrScans: QrScan[];
    referralUses: ReferralUse[];
    aiInteractions: AiInteraction[];
  };
  analytics: {
    topProductQueries: Array<{
      query: string;
      count: number;
    }>;
    aiToolUsage: Array<{
      aiTool: string;
      count: number;
      avgProcessingTime: number;
      errorRate: number;
    }>;
    popularProducts: Array<{
      productName: string;
      queryCount: number;
      recommendationCount: number;
    }>;
  };
}

export default function StoreDashboard() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/store/:retailerName/dashboard");

  // Check if user is authenticated
  const { data: storeUser, isLoading: userLoading, error: userError } = useQuery({
    queryKey: ["/api/store/me"],
    queryFn: async (): Promise<{ storeUser: StoreUser }> => {
      const response = await apiRequest("GET", "/api/store/me");
      if (!response.ok) {
        if (response.status === 401) {
          // Redirect to login if not authenticated
          const retailerName = params?.retailerName || 'store';
          setLocation(`/store/${retailerName}`);
          throw new Error("Authentication required");
        }
        throw new Error("Failed to fetch user info");
      }
      return response.json();
    },
    retry: false
  });

  // Fetch dashboard data
  const { data: dashboardData, isLoading: dashboardLoading, error: dashboardError } = useQuery({
    queryKey: ["/api/store/dashboard"],
    queryFn: async (): Promise<StoreDashboardData> => {
      const response = await apiRequest("GET", "/api/store/dashboard");
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data");
      }
      return response.json();
    },
    enabled: !!storeUser // Only fetch dashboard data if user is authenticated
  });

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/store/logout");
      const retailerName = params?.retailerName || 'store';
      setLocation(`/store/${retailerName}`);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading store dashboard...</p>
        </div>
      </div>
    );
  }

  if (userError || !storeUser) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertDescription>
            Please log in to access your store dashboard.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <Store className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {storeUser.storeUser.storeName}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Store Dashboard • {storeUser.storeUser.email}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {dashboardLoading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading dashboard data...</p>
          </div>
        ) : dashboardError ? (
          <Alert className="mb-6">
            <AlertDescription>
              Error loading dashboard data. Please try refreshing the page.
            </AlertDescription>
          </Alert>
        ) : dashboardData ? (
          <div className="space-y-6">
            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total QR Scans</CardTitle>
                  <QrCode className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData.metrics.totalQrScans}</div>
                  <p className="text-xs text-muted-foreground">
                    {dashboardData.metrics.qrScansThisMonth} this month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">AI Interactions</CardTitle>
                  <Brain className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData.metrics.totalAiInteractions}</div>
                  <p className="text-xs text-muted-foreground">
                    {dashboardData.metrics.aiInteractionsThisMonth} this month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Referral Uses</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData.metrics.totalReferralUses}</div>
                  <p className="text-xs text-muted-foreground">
                    {dashboardData.metrics.referralUsesThisMonth} this month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Top AI Tool</CardTitle>
                  <Zap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData.metrics.topAiTool}</div>
                  <p className="text-xs text-muted-foreground">
                    Avg: {dashboardData.metrics.avgProcessingTime}ms
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Secondary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Referral Earnings</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">€{dashboardData.metrics.totalReferralEarnings}</div>
                  <p className="text-xs text-muted-foreground">
                    Total earnings from referrals
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Staff</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData.metrics.activeStaffCount}</div>
                  <p className="text-xs text-muted-foreground">
                    Staff with referral codes
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Processing Speed</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData.metrics.avgProcessingTime}ms</div>
                  <p className="text-xs text-muted-foreground">
                    Average AI response time
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent QR Scans */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <QrCode className="h-5 w-5 mr-2" />
                    Recent QR Scans
                  </CardTitle>
                  <CardDescription>Latest AI tool access via QR codes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dashboardData.recentActivity.qrScans.length > 0 ? (
                      dashboardData.recentActivity.qrScans.map((scan, index) => (
                        <div key={index} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                                <QrCode className="w-4 h-4 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-semibold text-sm">{scan.aiTool || 'AI Tool Access'}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Session: {scan.sessionId?.substring(0, 8)}</p>
                              </div>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                              {format(new Date(scan.scannedAt), "MMM d, h:mm a")}
                            </span>
                          </div>
                          
                          {/* User Question */}
                          {scan.userPrompt && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border-l-4 border-blue-400">
                              <div className="flex items-start gap-2">
                                <MessageSquare className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">Customer Asked:</p>
                                  <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                                    {scan.userPrompt}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* AI Response */}
                          {scan.aiResponse && (
                            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border-l-4 border-green-400">
                              <div className="flex items-start gap-2">
                                <Bot className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-green-700 dark:text-green-300 mb-1">AI Responded:</p>
                                  <p className="text-sm text-green-800 dark:text-green-200 leading-relaxed">
                                    {scan.aiResponse.length > 200 
                                      ? `${scan.aiResponse.substring(0, 200)}...` 
                                      : scan.aiResponse}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Product Query */}
                          {scan.productQuery && (
                            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border-l-4 border-purple-400">
                              <div className="flex items-start gap-2">
                                <Package className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 mb-1">Product Searched:</p>
                                  <p className="text-sm text-purple-800 dark:text-purple-200 font-medium">{scan.productQuery}</p>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Technical Details */}
                          <div className="flex items-center justify-between pt-1 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
                              <span>QR: {scan.qrCodeId}</span>
                              {scan.interactionType && (
                                <span className="capitalize">{scan.interactionType}</span>
                              )}
                              {scan.processingTimeMs && (
                                <span>{scan.processingTimeMs}ms</span>
                              )}
                            </div>
                            {scan.errorOccurred && (
                              <span className="text-xs text-red-500 font-medium">Error</span>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                        No QR scans recorded yet
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recent AI Interactions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Brain className="h-5 w-5 mr-2" />
                    Recent AI Interactions
                  </CardTitle>
                  <CardDescription>Latest customer questions and AI responses</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dashboardData.recentActivity.qrScans.filter(scan => scan.userPrompt || scan.aiResponse).length > 0 ? (
                      dashboardData.recentActivity.qrScans
                        .filter(scan => scan.userPrompt || scan.aiResponse)
                        .slice(0, 5)
                        .map((interaction, index) => (
                        <div key={index} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Brain className="w-4 h-4 text-purple-600" />
                              <Badge variant="outline" className="text-xs">{interaction.aiTool}</Badge>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {format(new Date(interaction.scannedAt), "MMM d, h:mm a")}
                            </span>
                          </div>
                          
                          {/* Customer Question */}
                          {interaction.userPrompt && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                              <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">Customer Asked:</p>
                              <p className="text-sm text-blue-800 dark:text-blue-200">
                                {interaction.userPrompt.length > 100 
                                  ? `${interaction.userPrompt.substring(0, 100)}...` 
                                  : interaction.userPrompt}
                              </p>
                            </div>
                          )}

                          {/* AI Response Summary */}
                          {interaction.aiResponse && (
                            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                              <p className="text-xs font-medium text-green-700 dark:text-green-300 mb-1">AI Responded:</p>
                              <p className="text-sm text-green-800 dark:text-green-200">
                                {interaction.aiResponse.length > 120 
                                  ? `${interaction.aiResponse.substring(0, 120)}...` 
                                  : interaction.aiResponse}
                              </p>
                            </div>
                          )}

                          {/* Processing Time */}
                          {interaction.processingTimeMs && (
                            <div className="flex justify-end">
                              <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                Processed in {interaction.processingTimeMs}ms
                              </span>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                        No AI interactions recorded yet
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Referral Uses */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Recent Referrals
                  </CardTitle>
                  <CardDescription>Latest staff referral code usage</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dashboardData.recentActivity.referralUses.length > 0 ? (
                      dashboardData.recentActivity.referralUses.map((referral, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium">{referral.staffName || 'Staff Member'}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Code: {referral.referralCode}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge variant="secondary">€{referral.discountAmount}</Badge>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {format(new Date(referral.usedAt), "MMM d, h:mm a")}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                        No referral uses recorded yet
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* AI Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Top Product Queries */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Search className="h-5 w-5 mr-2" />
                    Top Product Queries
                  </CardTitle>
                  <CardDescription>Most searched products by customers</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(() => {
                      // Extract product queries from customer questions in QR scan data
                      const productQueries = dashboardData.recentActivity.qrScans
                        .filter(scan => scan.userPrompt)
                        .flatMap(scan => {
                          const prompt = scan.userPrompt.toLowerCase();
                          const queries: string[] = [];
                          
                          // Extract TV size queries
                          const sizeMatches = prompt.match(/(\d{2,3})["\s]*inch|(\d{2,3})["\s]*tv|(\d{2,3})"|\b(32|40|43|50|55|65|75|85)\b/g);
                          if (sizeMatches) {
                            sizeMatches.forEach(match => {
                              const size = match.replace(/[^0-9]/g, '');
                              if (parseInt(size) >= 32) {
                                queries.push(`${size}" TV`);
                              }
                            });
                          }
                          
                          // Extract brand queries
                          const brandPatterns = [
                            /samsung/g, /lg/g, /sony/g, /tcl/g, /hisense/g, /philips/g, /panasonic/g
                          ];
                          brandPatterns.forEach(pattern => {
                            if (pattern.test(prompt)) {
                              const brand = pattern.source.charAt(0).toUpperCase() + pattern.source.slice(1);
                              queries.push(`${brand} TV`);
                            }
                          });
                          
                          // Extract feature queries
                          const featurePatterns = [
                            /smart\s*tv/g, /4k/g, /oled/g, /qled/g, /led/g, /uhd/g
                          ];
                          featurePatterns.forEach(pattern => {
                            const matches = prompt.match(pattern);
                            if (matches) {
                              matches.forEach(match => {
                                queries.push(match.toUpperCase());
                              });
                            }
                          });
                          
                          // Extract price queries
                          const priceMatches = prompt.match(/under\s*[€$]?(\d+)|below\s*[€$]?(\d+)|budget.*[€$]?(\d+)/g);
                          if (priceMatches) {
                            priceMatches.forEach(match => {
                              queries.push(`Budget ${match}`);
                            });
                          }
                          
                          return queries;
                        })
                        .reduce((acc, query) => {
                          const normalized = query.toLowerCase();
                          acc[normalized] = (acc[normalized] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>);
                      
                      const topQueries = Object.entries(productQueries)
                        .sort(([,a], [,b]) => b - a)
                        .slice(0, 5)
                        .map(([query, count]) => ({
                          query: query.split(' ').map(word => 
                            word.charAt(0).toUpperCase() + word.slice(1)
                          ).join(' '),
                          count
                        }));
                      
                      return topQueries.length > 0 ? (
                        topQueries.map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                            <span className="text-sm font-medium truncate flex-1">
                              {item.query}
                            </span>
                            <Badge variant="secondary">{item.count}</Badge>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                          No product queries recorded yet
                        </p>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>

              {/* AI Tool Usage */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    AI Tool Usage
                  </CardTitle>
                  <CardDescription>Performance and usage statistics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(() => {
                      // Extract AI tool usage from QR scan data
                      const toolUsage = dashboardData.recentActivity.qrScans.reduce((acc, scan) => {
                        const tool = scan.aiTool || 'Unknown';
                        if (!acc[tool]) {
                          acc[tool] = { count: 0, totalProcessingTime: 0, errors: 0 };
                        }
                        acc[tool].count++;
                        if (scan.processingTimeMs) {
                          acc[tool].totalProcessingTime += scan.processingTimeMs;
                        }
                        if (scan.errorOccurred) {
                          acc[tool].errors++;
                        }
                        return acc;
                      }, {} as Record<string, { count: number; totalProcessingTime: number; errors: number }>);
                      
                      const sortedTools = Object.entries(toolUsage)
                        .sort(([,a], [,b]) => b.count - a.count)
                        .slice(0, 5);
                      
                      return sortedTools.length > 0 ? (
                        sortedTools.map(([tool, stats], index) => (
                          <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-sm">{tool}</span>
                              <Badge variant="outline">{stats.count} uses</Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400">
                              <span>Avg: {stats.count > 0 ? Math.round(stats.totalProcessingTime / stats.count) : 0}ms</span>
                              <span>Success: {stats.count > 0 ? Math.round(((stats.count - stats.errors) / stats.count) * 100) : 100}%</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                          No AI tool usage recorded yet
                        </p>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>

              {/* Popular Products */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Popular Products
                  </CardTitle>
                  <CardDescription>Most queried and recommended items</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(() => {
                      // Extract popular products from AI responses
                      const productMentions = dashboardData.recentActivity.qrScans
                        .filter(scan => scan.aiResponse)
                        .flatMap(scan => {
                          const response = scan.aiResponse.toLowerCase();
                          const products: string[] = [];
                          
                          // Common TV brands and models mentioned in responses
                          const tvPatterns = [
                            /samsung[\s\w]*(?:qled|oled|neo|crystal|uhd|4k|smart)[\s\w]*/g,
                            /lg[\s\w]*(?:oled|nanocell|uhd|4k|smart)[\s\w]*/g,
                            /sony[\s\w]*(?:bravia|oled|led|4k|smart)[\s\w]*/g,
                            /tcl[\s\w]*(?:qled|roku|google|android)[\s\w]*/g,
                            /hisense[\s\w]*(?:uled|roku|vidaa)[\s\w]*/g,
                            /(\d{2}["-]?\s?inch|55["-]?|65["-]?|75["-]?|85["-]?)\s?[\w\s]*tv/g
                          ];
                          
                          tvPatterns.forEach(pattern => {
                            const matches = response.match(pattern);
                            if (matches) {
                              matches.forEach(match => {
                                const cleaned = match.replace(/\s+/g, ' ').trim();
                                if (cleaned.length > 3) {
                                  products.push(cleaned);
                                }
                              });
                            }
                          });
                          
                          return products;
                        })
                        .reduce((acc, product) => {
                          const normalized = product.toLowerCase();
                          acc[normalized] = (acc[normalized] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>);
                      
                      const popularProducts = Object.entries(productMentions)
                        .sort(([,a], [,b]) => b - a)
                        .slice(0, 5)
                        .map(([product, count]) => ({
                          productName: product.split(' ').map(word => 
                            word.charAt(0).toUpperCase() + word.slice(1)
                          ).join(' '),
                          mentions: count
                        }));
                      
                      return popularProducts.length > 0 ? (
                        popularProducts.map((product, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                            <span className="text-sm font-medium truncate flex-1">
                              {product.productName}
                            </span>
                            <Badge variant="secondary">{product.mentions}</Badge>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                          No popular products recorded yet
                        </p>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Store Info */}
            <Card>
              <CardHeader>
                <CardTitle>Store Information</CardTitle>
                <CardDescription>Your store details and analytics summary</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Store Name</p>
                    <p className="text-lg font-semibold">{dashboardData.storeInfo.storeName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Retailer</p>
                    <p className="text-lg font-semibold">{dashboardData.storeInfo.retailerCode}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Store Code</p>
                    <p className="text-lg font-semibold">{dashboardData.storeInfo.storeCode || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    </div>
  );
}