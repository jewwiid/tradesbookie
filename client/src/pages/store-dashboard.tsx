import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, QrCode, Users, TrendingUp, Calendar, LogOut, Store, Activity, Brain, Search, BarChart3, Zap, MessageSquare, Bot, Package, ChevronLeft, ChevronRight, Filter, Trash2, RefreshCw, Database, AlertTriangle, Monitor, Cpu, Eye } from "lucide-react";
import { format, subDays, startOfDay, endOfDay, isWithinInterval } from "date-fns";

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
  completedReferralEarnings: string; // NEW: Actual earnings from completed installations
  pendingEarnings: string; // NEW: Earnings from bookings not yet completed
  activeStaffCount: number;
  totalAiInteractions: number;
  aiInteractionsThisMonth: number;
  topAiTool: string;
  avgProcessingTime: number;
}

interface StaffMetric {
  staffName: string;
  totalBookings: number;
  completedInstallations: number;
  completionRate: number;
  totalCommissionEarned: number;
}

interface QrScan {
  qrCodeId: string;
  aiTool?: string;
  scannedAt: Date;
  sessionId: string;
  // AI interaction details from joined data
  userPrompt?: string;
  aiResponse?: string;
  productQuery?: string;
  interactionType?: string;
  processingTimeMs?: number;
  recommendedProducts?: any[];
  comparisonResult?: any;
  errorOccurred?: boolean;
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
  staffMetrics: StaffMetric[]; // NEW: Staff performance based on completion rates
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
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | 'week' | 'all'>('today');
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Define AI tools with their display names and icons
  const aiTools = [
    { key: 'ai-chat', name: 'AI Chat Helper', icon: MessageSquare },
    { key: 'product-finder', name: 'Product Finder', icon: Search },
    { key: 'electronics-comparison', name: 'Product Comparison', icon: BarChart3 },
    { key: 'tv-preview', name: 'TV Preview', icon: Monitor }
  ];

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

  // Fetch AI tool details for specific tools
  const useAiToolDetails = (toolName: string) => {
    return useQuery({
      queryKey: ["/api/store/ai-tool", toolName],
      queryFn: async () => {
        const response = await apiRequest("GET", `/api/store/ai-tool/${toolName}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch ${toolName} details`);
        }
        return response.json();
      },
      enabled: !!storeUser && activeTab === toolName
    });
  };

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/store/logout");
      const retailerName = params?.retailerName || 'store';
      setLocation(`/store/${retailerName}`);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Filter function for date ranges
  const filterByDate = (item: { scannedAt?: Date; createdAt?: Date; usedAt?: Date }) => {
    const itemDate = item.scannedAt || item.createdAt || item.usedAt;
    if (!itemDate) return true;

    const today = startOfDay(new Date());
    const yesterday = startOfDay(subDays(new Date(), 1));
    const weekAgo = startOfDay(subDays(new Date(), 7));

    switch (dateFilter) {
      case 'today':
        return isWithinInterval(new Date(itemDate), { start: today, end: endOfDay(new Date()) });
      case 'yesterday':
        return isWithinInterval(new Date(itemDate), { start: yesterday, end: endOfDay(yesterday) });
      case 'week':
        return isWithinInterval(new Date(itemDate), { start: weekAgo, end: endOfDay(new Date()) });
      case 'all':
      default:
        return true;
    }
  };

  // Navigation helpers
  const navigateDate = (direction: 'prev' | 'next') => {
    setSelectedDate(prev => {
      if (direction === 'prev') {
        return subDays(prev, 1);
      } else {
        return subDays(prev, -1); // Add 1 day
      }
    });
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
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview" className="flex items-center space-x-2">
                <Activity className="h-4 w-4" />
                <span>Overview</span>
              </TabsTrigger>
              {aiTools.map((tool) => {
                const IconComponent = tool.icon;
                return (
                  <TabsTrigger key={tool.key} value={tool.key} className="flex items-center space-x-2">
                    <IconComponent className="h-4 w-4" />
                    <span className="hidden sm:inline">{tool.name}</span>
                    <span className="sm:hidden">{tool.key}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Date Filter Controls */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center space-x-4">
                    <Filter className="h-5 w-5 text-gray-500" />
                    <span className="font-medium">Filter by Date:</span>
                    <div className="flex space-x-2">
                      {(['today', 'yesterday', 'week', 'all'] as const).map((filter) => (
                        <Button
                          key={filter}
                          onClick={() => setDateFilter(filter)}
                          variant={dateFilter === filter ? "default" : "outline"}
                          size="sm"
                        >
                          {filter.charAt(0).toUpperCase() + filter.slice(1)}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  {dateFilter !== 'all' && (
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={() => navigateDate('prev')}
                        variant="outline"
                        size="sm"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm font-medium px-3">
                        {format(selectedDate, 'MMM d, yyyy')}
                      </span>
                      <Button
                        onClick={() => navigateDate('next')}
                        variant="outline"
                        size="sm"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

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
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 dark:from-green-950 dark:to-emerald-950 dark:border-green-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Commission Earnings</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">€{dashboardData.metrics.completedReferralEarnings || '0.00'}</div>
                  <p className="text-xs text-muted-foreground mb-2">
                    From completed installations
                  </p>
                  {dashboardData.metrics.pendingEarnings && parseFloat(dashboardData.metrics.pendingEarnings) > 0 && (
                    <div className="text-sm text-amber-600">
                      <span className="font-medium">€{dashboardData.metrics.pendingEarnings}</span> pending completion
                    </div>
                  )}
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

            </div>

            {/* Staff Performance Metrics */}
            {dashboardData.staffMetrics && dashboardData.staffMetrics.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Staff Performance (Installation Completion)
                  </CardTitle>
                  <CardDescription>Commission earned based on successful installations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="max-h-96 overflow-y-auto space-y-4 pr-2">
                    {dashboardData.staffMetrics.map((staff, index) => (
                      <div key={index} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
                              <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <div className="font-medium">{staff.staffName}</div>
                              <div className="text-sm text-muted-foreground">
                                {staff.completedInstallations} of {staff.totalBookings} installations completed
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-green-600">€{staff.totalCommissionEarned.toFixed(2)}</div>
                            <div className="text-sm text-muted-foreground">{staff.completionRate}% success rate</div>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${staff.completionRate}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

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
                  <div className="max-h-96 overflow-y-auto space-y-4 pr-2">
                    {dashboardData.recentActivity.qrScans.filter(filterByDate).length > 0 ? (
                      dashboardData.recentActivity.qrScans.filter(filterByDate).slice(0, 10).map((scan, index) => (
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
                        {dateFilter === 'all' ? 'No QR scans recorded yet' : `No QR scans for ${dateFilter === 'today' ? 'today' : dateFilter === 'yesterday' ? 'yesterday' : 'this week'}`}
                      </p>
                    )}
                    {dashboardData.recentActivity.qrScans.filter(filterByDate).length > 10 && (
                      <div className="text-center pt-2 border-t">
                        <p className="text-xs text-gray-500">Showing latest 10 entries • Scroll for more</p>
                      </div>
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
                  <div className="max-h-96 overflow-y-auto space-y-4 pr-2">
                    {dashboardData.recentActivity.qrScans.filter(scan => (scan.userPrompt || scan.aiResponse) && filterByDate(scan)).length > 0 ? (
                      dashboardData.recentActivity.qrScans
                        .filter(scan => (scan.userPrompt || scan.aiResponse) && filterByDate(scan))
                        .slice(0, 8)
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
                        {dateFilter === 'all' ? 'No AI interactions recorded yet' : `No AI interactions for ${dateFilter === 'today' ? 'today' : dateFilter === 'yesterday' ? 'yesterday' : 'this week'}`}
                      </p>
                    )}
                    {dashboardData.recentActivity.qrScans.filter(scan => (scan.userPrompt || scan.aiResponse) && filterByDate(scan)).length > 8 && (
                      <div className="text-center pt-2 border-t">
                        <p className="text-xs text-gray-500">Showing latest 8 entries • Scroll for more</p>
                      </div>
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
                  <div className="max-h-96 overflow-y-auto space-y-4 pr-2">
                    {dashboardData.recentActivity.referralUses.filter(filterByDate).length > 0 ? (
                      dashboardData.recentActivity.referralUses.filter(filterByDate).slice(0, 10).map((referral, index) => (
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
                  <div className="max-h-80 overflow-y-auto space-y-3 pr-2">
                    {(() => {
                      // Extract product queries from customer questions in QR scan data  
                      const productQueries = dashboardData.recentActivity.qrScans
                        .filter(scan => scan.userPrompt && filterByDate(scan))
                        .flatMap(scan => {
                          const prompt = scan.userPrompt?.toLowerCase() || '';
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
                  <div className="max-h-80 overflow-y-auto space-y-3 pr-2">
                    {(() => {
                      // Extract AI tool usage from QR scan data
                      const toolUsage = dashboardData.recentActivity.qrScans
                        .filter(filterByDate)
                        .reduce((acc, scan) => {
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
                  <div className="max-h-80 overflow-y-auto space-y-3 pr-2">
                    {(() => {
                      // Extract popular products from AI responses
                      const productMentions = dashboardData.recentActivity.qrScans
                        .filter(scan => scan.aiResponse && filterByDate(scan))
                        .flatMap(scan => {
                          const response = scan.aiResponse?.toLowerCase() || '';
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

            {/* Data Management */}
            <Card className="border-orange-200 dark:border-orange-800">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="h-5 w-5 mr-2" />
                  Data Management
                </CardTitle>
                <CardDescription>Clean up historical data to free up database space</CardDescription>
              </CardHeader>
              <CardContent>
                <DataCleanupSection />
              </CardContent>
            </Card>

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
            </TabsContent>

            {/* Individual AI Tool Tabs */}
            {aiTools.map((tool) => (
              <TabsContent key={tool.key} value={tool.key} className="space-y-6">
                <AiToolDetails toolKey={tool.key} toolName={tool.name} />
              </TabsContent>
            ))}
          </Tabs>
        ) : null}
      </div>
    </div>
  );
}

// AI Tool Details Component
function AiToolDetails({ toolKey, toolName }: { toolKey: string; toolName: string }) {
  const { data: toolData, isLoading, error } = useQuery({
    queryKey: ["/api/store/ai-tool", toolKey],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/store/ai-tool/${toolKey}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${toolName} details`);
      }
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p>Loading {toolName} data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Error loading {toolName} data. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }

  if (!toolData || toolData.totalInteractions === 0) {
    return (
      <Alert>
        <AlertDescription>
          No {toolName} interactions found for your store yet.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tool Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Interactions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{toolData.totalInteractions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Processing Time</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{toolData.summaryStats.avgProcessingTime}ms</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((toolData.summaryStats.successfulResponses / toolData.summaryStats.totalPrompts) * 100)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{toolData.summaryStats.errorRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Interactions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Eye className="h-5 w-5 mr-2" />
            Recent {toolName} Interactions
          </CardTitle>
          <CardDescription>
            Latest interactions from your store's QR code scans
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {toolData.interactions.slice(0, 10).map((interaction: any, index: number) => (
              <div key={interaction.id || index} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge variant="secondary">{interaction.aiTool}</Badge>
                      <span className="text-sm text-gray-500">
                        {format(new Date(interaction.createdAt), 'MMM d, yyyy HH:mm')}
                      </span>
                    </div>
                    
                    {interaction.userPrompt && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">Customer Asked:</p>
                        <p className="text-sm bg-blue-50 dark:bg-blue-900/20 p-2 rounded">{interaction.userPrompt}</p>
                      </div>
                    )}

                    {interaction.productQuery && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-purple-600 dark:text-purple-400 mb-1">Product Query:</p>
                        <p className="text-sm bg-purple-50 dark:bg-purple-900/20 p-2 rounded">{interaction.productQuery}</p>
                      </div>
                    )}

                    {interaction.aiResponse && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">AI Response:</p>
                        <p className="text-sm bg-green-50 dark:bg-green-900/20 p-2 rounded max-h-32 overflow-y-auto">
                          {interaction.aiResponse.length > 300 
                            ? `${interaction.aiResponse.substring(0, 300)}...` 
                            : interaction.aiResponse}
                        </p>
                      </div>
                    )}

                    {interaction.recommendedProducts && interaction.recommendedProducts.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-orange-600 dark:text-orange-400 mb-1">Recommended Products:</p>
                        <div className="flex flex-wrap gap-1">
                          {interaction.recommendedProducts.slice(0, 3).map((product: string, idx: number) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {product}
                            </Badge>
                          ))}
                          {interaction.recommendedProducts.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{interaction.recommendedProducts.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="text-right text-sm text-gray-500 space-y-1">
                    {interaction.processingTimeMs && (
                      <div>{interaction.processingTimeMs}ms</div>
                    )}
                    {interaction.modelUsed && (
                      <div className="text-xs">{interaction.modelUsed}</div>
                    )}
                    {interaction.creditsUsed && (
                      <Badge variant="outline" className="text-xs">
                        {interaction.creditsUsed} credits
                      </Badge>
                    )}
                  </div>
                </div>

                {interaction.sessionId && (
                  <div className="text-xs text-gray-400 border-t pt-2">
                    Session: {interaction.sessionId.substring(0, 8)}...
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Data cleanup component
function DataCleanupSection() {
  const [selectedTimeWindow, setSelectedTimeWindow] = useState<string>('');
  const [previewData, setPreviewData] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const timeWindowOptions = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'this_week', label: 'This Week' },
    { value: 'last_week', label: 'Last Week' },
    { value: 'last_30_days', label: 'Last 30 Days' }
  ];

  // Preview deletion mutation
  const previewMutation = useMutation({
    mutationFn: async (timeWindow: string) => {
      const response = await apiRequest('POST', '/api/store/data/preview-delete', { timeWindow });
      if (!response.ok) {
        throw new Error('Failed to preview data deletion');
      }
      return response.json();
    },
    onSuccess: (data) => {
      setPreviewData(data);
      setIsDialogOpen(true);
    },
    onError: (error) => {
      toast({
        title: "Preview Failed",
        description: "Unable to preview data deletion. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Delete data mutation
  const deleteMutation = useMutation({
    mutationFn: async (timeWindow: string) => {
      const response = await apiRequest('DELETE', '/api/store/data/cleanup', { timeWindow, confirm: true });
      if (!response.ok) {
        throw new Error('Failed to delete data');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Data Cleaned Successfully",
        description: `Deleted ${data.totalDeleted} records from ${data.description.toLowerCase()}`,
        variant: "default"
      });
      setIsDialogOpen(false);
      setPreviewData(null);
      setSelectedTimeWindow('');
      // Refresh dashboard data
      queryClient.invalidateQueries({ queryKey: ['/api/store/dashboard'] });
    },
    onError: (error) => {
      toast({
        title: "Cleanup Failed",
        description: "Unable to clean up data. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handlePreview = () => {
    if (!selectedTimeWindow) {
      toast({
        title: "Time Window Required",
        description: "Please select a time window for data cleanup",
        variant: "destructive"
      });
      return;
    }
    previewMutation.mutate(selectedTimeWindow);
  };

  const handleConfirmDelete = () => {
    if (previewData?.timeWindow) {
      deleteMutation.mutate(previewData.timeWindow);
    }
  };

  return (
    <div className="space-y-4">
      <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Data cleanup permanently removes historical records to free up database space. 
          Only completed referral data will be deleted - pending earnings are preserved.
        </AlertDescription>
      </Alert>

      <div className="flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            Select Time Window
          </label>
          <Select value={selectedTimeWindow} onValueChange={setSelectedTimeWindow}>
            <SelectTrigger>
              <SelectValue placeholder="Choose data to clean..." />
            </SelectTrigger>
            <SelectContent>
              {timeWindowOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={handlePreview}
          disabled={!selectedTimeWindow || previewMutation.isPending}
          className="min-w-[120px]"
        >
          {previewMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <Search className="h-4 w-4 mr-2" />
              Preview
            </>
          )}
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Trash2 className="h-5 w-5 mr-2 text-red-500" />
              Confirm Data Cleanup
            </DialogTitle>
            <DialogDescription>
              Review the data that will be permanently deleted from {previewData?.description?.toLowerCase()}.
            </DialogDescription>
          </DialogHeader>

          {previewData && (
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">QR Code Scans</span>
                  <Badge variant="secondary">{previewData.preview.qrScansCount} records</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Completed Referrals</span>
                  <Badge variant="secondary">{previewData.preview.referralsCount} records</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">AI Interactions</span>
                  <Badge variant="secondary">{previewData.preview.aiInteractionsCount} records</Badge>
                </div>
                <div className="border-t pt-3 flex justify-between items-center font-semibold">
                  <span>Total Records</span>
                  <Badge variant="destructive">{previewData.totalRecords} to delete</Badge>
                </div>
              </div>

              {previewData.totalRecords === 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    No data found for the selected time window.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending || previewData?.totalRecords === 0}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Data
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}