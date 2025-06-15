import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Home from "@/pages/Home";
import BookingFlow from "@/pages/booking-flow";
import CustomerDashboard from "@/pages/customer-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import InstallerDashboard from "@/pages/installer-dashboard";
import InstallerRegistration from "@/pages/installer-registration";
import InstallerLogin from "@/pages/installer-login";
import QRTracking from "@/pages/qr-tracking";
import TVRecommendation from "@/pages/tv-recommendation";
import Login from "@/pages/login";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/booking" component={BookingFlow} />
      <Route path="/tv-recommendation" component={TVRecommendation} />
      <Route path="/customer/:qrCode?" component={CustomerDashboard} />
      <Route path="/installer-registration" component={InstallerRegistration} />
      <Route path="/installer-login" component={InstallerLogin} />
      <Route path="/login" component={Login} />
      <Route path="/installer-dashboard/:id?" component={InstallerDashboard} />
      <Route path="/track/:qrCode" component={QRTracking} />
      <Route path="/admin">
        <ProtectedRoute requireAdmin={true}>
          <AdminDashboard />
        </ProtectedRoute>
      </Route>
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
