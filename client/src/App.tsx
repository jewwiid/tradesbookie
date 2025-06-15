import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedBooking } from "@/components/ProtectedBooking";
import Home from "@/pages/Home";
import BookingFlow from "@/pages/booking-flow";
import CustomerDashboard from "@/pages/customer-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import InstallerDashboard from "@/pages/installer-dashboard";
import InstallerRegistration from "@/pages/installer-registration";
import InstallerLogin from "@/pages/installer-login";
import QRTracking from "@/pages/qr-tracking";
import TVRecommendation from "@/pages/tv-recommendation";
import Checkout from "@/pages/checkout";
import BookingSuccess from "@/pages/booking-success";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      {/* Public routes - accessible without authentication */}
      <Route path="/" component={Home} />
      <Route path="/tv-recommendation" component={TVRecommendation} />
      <Route path="/track/:qrCode" component={QRTracking} />
      
      {/* Protected routes - limited guest access then authentication required */}
      <Route path="/booking">
        <ProtectedBooking>
          <BookingFlow />
        </ProtectedBooking>
      </Route>
      <Route path="/customer/:qrCode?" component={CustomerDashboard} />
      <Route path="/installer-registration" component={InstallerRegistration} />
      <Route path="/installer-login" component={InstallerLogin} />
      <Route path="/installer-dashboard/:id?" component={InstallerDashboard} />
      <Route path="/admin-dashboard" component={AdminDashboard} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/booking-success" component={BookingSuccess} />
      
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
