import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Home from "@/pages/Home";
import BookingFlow from "@/pages/booking-flow";
import CustomerDashboard from "@/pages/customer-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import InstallerDashboard from "@/pages/installer-dashboard";
import InstallerRegistration from "@/pages/installer-registration";
import InstallerLogin from "@/pages/installer-login";
import QRTracking from "@/pages/qr-tracking";
import TVRecommendation from "@/pages/tv-recommendation";
import NotFound from "@/pages/not-found";

function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Welcome to SmartTVMount
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Professional TV installation services with AI-powered room preview
          </p>
        </div>
        <div className="mt-8 space-y-6">
          <a
            href="/api/login"
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Sign in to continue
          </a>
        </div>
      </div>
    </div>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/booking" component={BookingFlow} />
          <Route path="/tv-recommendation" component={TVRecommendation} />
          <Route path="/customer/:qrCode?" component={CustomerDashboard} />
          <Route path="/installer-registration" component={InstallerRegistration} />
          <Route path="/installer-login" component={InstallerLogin} />
          <Route path="/installer-dashboard/:id?" component={InstallerDashboard} />
          <Route path="/track/:qrCode" component={QRTracking} />
          <Route path="/admin" component={AdminDashboard} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
