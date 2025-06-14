import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import BookingFlow from "@/pages/booking-flow";
import CustomerDashboard from "@/pages/customer-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import InstallerDashboard from "@/pages/installer-dashboard";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/booking" component={BookingFlow} />
      <Route path="/customer/:qrCode?" component={CustomerDashboard} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/installer/:id?" component={InstallerDashboard} />
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
