import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedBooking } from "@/components/ProtectedBooking";
import Home from "@/pages/Home";
import HowItWorks from "@/pages/how-it-works";
import Pricing from "@/pages/pricing";
import OurInstallers from "@/pages/our-installers";
import BookingFlow from "@/pages/booking-flow";
import CustomerDashboard from "@/pages/customer-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";

import InstallerDashboard from "@/pages/installer-dashboard";
import InstallerRegistration from "@/pages/installer-registration";
import InstallerLogin from "@/pages/installer-login";
import InstallerProfileSetup from "@/pages/installer-profile-setup";
import InstallerPending from "@/pages/installer-pending";
import QRTracking from "@/pages/qr-tracking";
import TVRecommendation from "@/pages/tv-recommendation";
import InstallationTracker from "@/pages/installation-tracker";
import SolarEnquiry from "@/pages/SolarEnquiry";
import Checkout from "@/pages/checkout";
import BookingSuccess from "@/pages/booking-success";
import PrivacyPolicy from "@/pages/privacy-policy";
import TermsOfService from "@/pages/TermsOfService";
import CookiePolicy from "@/pages/CookiePolicy";
import GDPRCompliance from "@/pages/GDPRCompliance";
import NotFound from "@/pages/not-found";
import ReviewPage from "@/pages/review-page";
import ReferralPage from "@/pages/referral-page";
import BookingConfirmation from "@/pages/booking-confirmation";
import VerifyEmail from "@/pages/verify-email";

import DemoLogin from "@/pages/demo-login";
import CreditCheckout from "@/pages/credit-checkout";
import BookingTracker from "@/pages/booking-tracker";
import Resources from "@/pages/resources";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import TvSetupAssist from "@/pages/tv-setup-assist";
import TvSetupConfirmation from "@/pages/tv-setup-confirmation";
import TvSetupPayment from "@/pages/tv-setup-payment";
import TvSetupTracker from "@/pages/tv-setup-tracker";
import CustomerResources from "@/pages/customer-resources";
import AIHelpPage from "@/pages/ai-help";
import ConsultationBooking from "@/pages/consultation-booking";


function Router() {
  return (
    <Switch>
      {/* Public routes - accessible without authentication */}
      <Route path="/" component={Home} />
      <Route path="/how-it-works" component={HowItWorks} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/our-installers" component={OurInstallers} />
      <Route path="/resources" component={Resources} />
      <Route path="/installation-tracker" component={InstallationTracker} />
      <Route path="/booking-tracker" component={BookingTracker} />
      <Route path="/tv-recommendation" component={TVRecommendation} />
      <Route path="/solar-enquiry" component={SolarEnquiry} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/terms-of-service" component={TermsOfService} />
      <Route path="/cookie-policy" component={CookiePolicy} />
      <Route path="/gdpr-compliance" component={GDPRCompliance} />
      <Route path="/track/:qrCode" component={QRTracking} />
      <Route path="/review/:qrCode" component={ReviewPage} />
      <Route path="/refer" component={ReferralPage} />
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/tv-setup-assist" component={TvSetupAssist} />
      <Route path="/tv-setup-confirmation" component={TvSetupConfirmation} />
      <Route path="/tv-setup-payment/:bookingId" component={TvSetupPayment} />
      <Route path="/tv-setup-tracker" component={TvSetupTracker} />
      <Route path="/customer-resources" component={CustomerResources} />
      <Route path="/ai-help" component={AIHelpPage} />
      <Route path="/consultation" component={ConsultationBooking} />

      <Route path="/demo-login" component={DemoLogin} />
      
      {/* Protected routes - limited guest access then authentication required */}
      <Route path="/booking">
        <ProtectedBooking>
          <BookingFlow />
        </ProtectedBooking>
      </Route>
      <Route path="/customer/:qrCode?" component={CustomerDashboard} />
      <Route path="/customer-dashboard" component={CustomerDashboard} />
      <Route path="/installer-registration" component={InstallerRegistration} />
      <Route path="/installer-login" component={InstallerLogin} />
      <Route path="/installer-pending" component={InstallerPending} />
      <Route path="/installer-profile-setup" component={InstallerProfileSetup} />
      <Route path="/installer-dashboard/:id?" component={InstallerDashboard} />
      <Route path="/installer/dashboard/:id?" component={InstallerDashboard} />

      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin-dashboard" component={AdminDashboard} />
      <Route path="/booking-confirmation" component={BookingConfirmation} />
      <Route path="/checkout/:bookingId?" component={Checkout} />
      <Route path="/credit-checkout" component={CreditCheckout} />
      <Route path="/booking-success/:bookingId?" component={BookingSuccess} />
      
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
