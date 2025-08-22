import { useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, QrCode, Users, TrendingUp, Calendar, LogOut, Store, Activity } from "lucide-react";
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
  };
}

export default function StoreDashboard() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/store/:retailerName/dashboard");

  // Check if user is authenticated
  const { data: storeUser, isLoading: userLoading, error: userError } = useQuery({
    queryKey: ["/api/store/me"],
    queryFn: async (): Promise<{ storeUser: StoreUser }> => {
      const response = await apiRequest("/api/store/me");
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
      const response = await apiRequest("/api/store/dashboard");
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data");
      }
      return response.json();
    },
    enabled: !!storeUser // Only fetch dashboard data if user is authenticated
  });

  const handleLogout = async () => {
    try {
      await apiRequest("/api/store/logout", { method: "POST" });
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
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium">{scan.aiTool || 'AI Tool Access'}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              QR: {scan.qrCodeId}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {format(new Date(scan.scannedAt), "MMM d, h:mm a")}
                            </p>
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