import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { loadStripe } from "@stripe/stripe-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon, Tv, Wifi, Settings, CheckCircle, Star, Clock, Shield, Users, BookOpen, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import tvSetupImage from "@assets/IMG_1807_1753964075870.jpeg";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { tvSetupBookingFormSchema, type TvSetupBookingForm } from "@shared/schema";
import Navigation from "@/components/navigation";
import Footer from "@/components/Footer";

if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const TV_BRAND_OPTIONS = [
  { value: "samsung", label: "Samsung" },
  { value: "lg", label: "LG" },
  { value: "sony", label: "Sony" },
  { value: "panasonic", label: "Panasonic" },
  { value: "philips", label: "Philips" },
  { value: "tcl", label: "TCL" },
  { value: "hisense", label: "Hisense" },
  { value: "sharp", label: "Sharp" },
  { value: "toshiba", label: "Toshiba" },
  { value: "vestel", label: "Vestel" },
  { value: "other", label: "Other" },
];

const TV_OS_OPTIONS = [
  { value: "android-tv", label: "Android TV" },
  { value: "webos", label: "WebOS (LG)" },
  { value: "tizen", label: "Tizen (Samsung)" },
  { value: "roku", label: "Roku TV" },
  { value: "fire-tv", label: "Fire TV" },
  { value: "other", label: "Other" },
];



export default function TvSetupAssist() {
  const { toast } = useToast();
  const [preferredDate, setPreferredDate] = useState<Date>();
  const [isSmartTv, setIsSmartTv] = useState<string>("");

  const form = useForm<TvSetupBookingForm>({
    resolver: zodResolver(tvSetupBookingFormSchema),
    defaultValues: {
      name: "",
      email: "",
      mobile: "",
      tvBrand: "",
      tvModel: "",
      isSmartTv: "",
      tvOs: "",
      yearOfPurchase: new Date().getFullYear(),
      streamingApps: [],
      additionalNotes: "",
    },
  });

  const createBookingMutation = useMutation({
    mutationFn: async (data: TvSetupBookingForm) => {
      const response = await apiRequest("POST", "/api/tv-setup-booking", {
        ...data,
        preferredSetupDate: preferredDate,
        streamingApps: [], // Admin will recommend suitable apps
      });
      return response.json();
    },
    onSuccess: (data) => {
      // Redirect to confirmation page
      window.location.href = `/tv-setup-confirmation?booking_id=${data.bookingId}`;
    },
    onError: (error: any) => {
      toast({
        title: "Booking Error",
        description: error.message || "Unable to create booking. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TvSetupBookingForm) => {
    createBookingMutation.mutate({
      ...data,
      streamingApps: [], // Admin will recommend suitable apps
      preferredSetupDate: preferredDate,
    });
  };



  const scrollToForm = () => {
    document.getElementById('booking-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Navigation />
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <img 
                src={tvSetupImage} 
                alt="Professional TV setup assistance - Smart TV configuration and app installation" 
                className="max-w-md w-full h-auto rounded-2xl shadow-2xl border-4 border-white/20"
              />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Stream More with{" "}
              <span className="text-yellow-300">FreeView+ Setup Help</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
              Unlock free-to-air and bonus channels on your smart TV with our professional remote assistance
            </p>
            <Button 
              onClick={scrollToForm}
              size="lg" 
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-8 py-4 text-lg"
            >
              Get Started - €100 One-Time Fee
            </Button>
          </div>
        </div>
      </div>

      {/* What's Included Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What's Included in Your TV Setup
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Professional guidance to help you access all available free-to-air and bonus channels
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Settings className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Smart TV Compatibility Check</h3>
                <p className="text-gray-600">
                  We'll verify your TV can run SaorView-compatible apps and guide you through setup
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Wifi className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">App Configuration</h3>
                <p className="text-gray-600">
                  Step-by-step help installing and configuring FreeView+ type streaming apps
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Remote or In-Person</h3>
                <p className="text-gray-600">
                  Choose remote screen sharing assistance or in-person setup visit
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-yellow-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">One-Time Payment</h3>
                <p className="text-gray-600">
                  €100 one-time fee with no ongoing subscriptions or hidden costs
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Why Choose Professional Setup?
              </h2>
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-4 mt-1">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Save Hours of Frustration</h3>
                    <p className="text-gray-600">
                      Skip the trial-and-error process of finding and configuring the right apps for your specific TV model
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-4 mt-1">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Safe & Secure Setup</h3>
                    <p className="text-gray-600">
                      Professional guidance ensures you're using legitimate apps and services safely
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-4 mt-1">
                    <Star className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Maximize Your Channels</h3>
                    <p className="text-gray-600">
                      Get access to all available free-to-air and bonus channels your TV can support
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-4 mt-1">
                    <Clock className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Quick Setup Process</h3>
                    <p className="text-gray-600">
                      Most setups completed within 30-60 minutes with expert guidance
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-lg">
              <div className="text-center mb-6">
                <img 
                  src={tvSetupImage} 
                  alt="TV Setup Assistance - Professional smart TV configuration" 
                  className="mx-auto rounded-lg shadow-md mb-4 max-w-sm w-full h-auto"
                />
                <h3 className="text-2xl font-bold">What You'll Get</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="font-medium">Compatibility Assessment</span>
                  <Badge variant="secondary">Included</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="font-medium">App Installation Help</span>
                  <Badge variant="secondary">Included</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="font-medium">Login & Configuration</span>
                  <Badge variant="secondary">Included</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="font-medium">Live Demo & Training</span>
                  <Badge variant="secondary">Included</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border-2 border-green-200">
                  <span className="font-bold text-green-800">Total Price</span>
                  <Badge className="bg-green-600">€100 One-Time</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Self-Help vs Professional Help Section */}
      <div className="py-20 bg-blue-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Choose Your Setup Experience
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Try our free self-help resources first, or jump straight to professional assistance
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Self-Help Option */}
            <Card className="hover:shadow-lg transition-shadow border-2 hover:border-blue-200">
              <CardHeader>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-3 bg-green-100 rounded-full">
                    <BookOpen className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Try Self-Help First</CardTitle>
                    <Badge variant="secondary" className="bg-green-100 text-green-700">FREE</Badge>
                  </div>
                </div>
                <CardDescription className="text-base">
                  Access our comprehensive guides, troubleshooting tips, and step-by-step tutorials
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span>Setup guides for RTÉ Player, TG4, Virgin Media</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span>Common troubleshooting solutions</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span>TV compatibility checker</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span>Video tutorials and downloadable guides</span>
                  </li>
                </ul>
                <Link href="/customer-resources">
                  <Button variant="outline" className="w-full border-green-300 text-green-700 hover:bg-green-50">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Explore Free Resources
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Professional Help Option */}
            <Card className="hover:shadow-lg transition-shadow border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardHeader>
                <div className="flex items-center space-x-3 mb-4">
                  <img 
                    src={tvSetupImage} 
                    alt="Professional TV setup service" 
                    className="w-16 h-16 rounded-lg object-cover shadow-md"
                  />
                  <div>
                    <CardTitle className="text-xl">Professional Setup</CardTitle>
                    <Badge className="bg-blue-600">€100 One-Time</Badge>
                  </div>
                </div>
                <CardDescription className="text-base">
                  Get personalized assistance from our TV setup experts for a guaranteed working solution
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-blue-500 mr-3" />
                    <span>Smart TV compatibility assessment</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-blue-500 mr-3" />
                    <span>Remote or in-person setup assistance</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-blue-500 mr-3" />
                    <span>Account configuration and login setup</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-blue-500 mr-3" />
                    <span>Live demo and walkthrough training</span>
                  </li>
                </ul>
                <Button 
                  onClick={scrollToForm}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Book Professional Setup
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Booking Form */}
      <div id="booking-form" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Book Your TV Setup Assistance
            </h2>
            <p className="text-xl text-gray-600">
              Fill out the form below and proceed to secure payment
            </p>
          </div>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tv className="w-6 h-6" />
                Setup Information
              </CardTitle>
              <CardDescription>
                Tell us about your TV and what you need help with
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Personal Information */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      {...form.register("name")}
                      placeholder="Your name"
                    />
                    {form.formState.errors.name && (
                      <p className="text-sm text-red-600 mt-1">
                        {form.formState.errors.name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      {...form.register("email")}
                      placeholder="your.email@example.com"
                    />
                    {form.formState.errors.email && (
                      <p className="text-sm text-red-600 mt-1">
                        {form.formState.errors.email.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="mobile">Mobile Number *</Label>
                  <Input
                    id="mobile"
                    {...form.register("mobile")}
                    placeholder="087 123 4567"
                  />
                  {form.formState.errors.mobile && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.mobile.message}
                    </p>
                  )}
                </div>

                {/* TV Information */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="tvBrand">TV Brand *</Label>
                    <Select onValueChange={(value) => form.setValue("tvBrand", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your TV brand" />
                      </SelectTrigger>
                      <SelectContent>
                        {TV_BRAND_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.tvBrand && (
                      <p className="text-sm text-red-600 mt-1">
                        {form.formState.errors.tvBrand.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="tvModel">TV Model *</Label>
                    <Input
                      id="tvModel"
                      {...form.register("tvModel")}
                      placeholder="Model number or series"
                    />
                    {form.formState.errors.tvModel && (
                      <p className="text-sm text-red-600 mt-1">
                        {form.formState.errors.tvModel.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Smart TV Check */}
                <div>
                  <Label>Is this a Smart TV? *</Label>
                  <div className="flex gap-4 mt-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="smart-tv-yes"
                        checked={isSmartTv === "yes"}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setIsSmartTv("yes");
                            form.setValue("isSmartTv", "yes");
                          }
                        }}
                      />
                      <Label htmlFor="smart-tv-yes">Yes, it's a Smart TV</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="smart-tv-no"
                        checked={isSmartTv === "no"}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setIsSmartTv("no");
                            form.setValue("isSmartTv", "no");
                            form.setValue("tvOs", "");
                          }
                        }}
                      />
                      <Label htmlFor="smart-tv-no">No, it's not a Smart TV</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="smart-tv-unknown"
                        checked={isSmartTv === "unknown"}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setIsSmartTv("unknown");
                            form.setValue("isSmartTv", "unknown");
                            form.setValue("tvOs", "");
                          }
                        }}
                      />
                      <Label htmlFor="smart-tv-unknown">Don't know</Label>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Conditional TV OS Dropdown */}
                  {isSmartTv === "yes" && (
                    <div>
                      <Label htmlFor="tvOs">TV Operating System *</Label>
                      <Select onValueChange={(value) => form.setValue("tvOs", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your TV's OS" />
                        </SelectTrigger>
                        <SelectContent>
                          {TV_OS_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.formState.errors.tvOs && (
                        <p className="text-sm text-red-600 mt-1">
                          {form.formState.errors.tvOs.message}
                        </p>
                      )}
                    </div>
                  )}

                  <div>
                    <Label htmlFor="yearOfPurchase">Year of Purchase *</Label>
                    <Input
                      id="yearOfPurchase"
                      type="number"
                      min="2015"
                      max={new Date().getFullYear()}
                      {...form.register("yearOfPurchase", { valueAsNumber: true })}
                    />
                    {form.formState.errors.yearOfPurchase && (
                      <p className="text-sm text-red-600 mt-1">
                        {form.formState.errors.yearOfPurchase.message}
                      </p>
                    )}
                  </div>
                </div>



                {/* Preferred Date */}
                <div>
                  <Label>Preferred Setup Date (Optional)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !preferredDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {preferredDate ? format(preferredDate, "PPP") : "Select a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={preferredDate}
                        onSelect={setPreferredDate}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Additional Notes */}
                <div>
                  <Label htmlFor="additionalNotes">Additional Notes (Optional)</Label>
                  <Textarea
                    id="additionalNotes"
                    {...form.register("additionalNotes")}
                    placeholder="Any specific requirements or questions..."
                    rows={3}
                  />
                </div>

                {/* Submit Button */}
                <div className="flex justify-center pt-6">
                  <Button
                    type="submit"
                    size="lg"
                    disabled={createBookingMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700 px-8 py-4 text-lg"
                  >
                    {createBookingMutation.isPending ? (
                      "Processing..."
                    ) : (
                      "Book TV Setup"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}