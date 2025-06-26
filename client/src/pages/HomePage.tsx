import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ServiceTierCard from "@/components/ServiceTierCard";
import { Tv, Camera, Calendar, Wrench, CheckCircle, Sparkles, Bolt, Sun, Home, Euro, Phone } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";

const solarQuickFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  county: z.string().min(1, "Please select your county"),
  electricityBill: z.string().min(1, "Please select your monthly electricity bill range"),
});

type SolarQuickForm = z.infer<typeof solarQuickFormSchema>;

const counties = [
  "Antrim", "Armagh", "Carlow", "Cavan", "Clare", "Cork", "Derry", "Donegal", "Down", "Dublin", 
  "Fermanagh", "Galway", "Kerry", "Kildare", "Kilkenny", "Laois", "Leitrim", "Limerick", 
  "Longford", "Louth", "Mayo", "Meath", "Monaghan", "Offaly", "Roscommon", "Sligo", 
  "Tipperary", "Tyrone", "Waterford", "Westmeath", "Wexford", "Wicklow"
];

export default function HomePage() {
  const { toast } = useToast();
  const [solarSubmitted, setSolarSubmitted] = useState(false);
  
  const { data: serviceTiers = [] } = useQuery({
    queryKey: ["/api/service-tiers"],
  });

  const { data: initResult } = useQuery({
    queryKey: ["/api/init"],
  });

  const solarForm = useForm<SolarQuickForm>({
    resolver: zodResolver(solarQuickFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      county: "",
      electricityBill: "",
    },
  });

  const submitSolarEnquiry = useMutation({
    mutationFn: async (data: SolarQuickForm) => {
      const [firstName, ...lastNameParts] = data.name.split(' ');
      const lastName = lastNameParts.join(' ') || firstName;
      
      return apiRequest("POST", "/api/solar-enquiries", {
        firstName,
        lastName,
        email: data.email,
        phone: data.phone,
        address: `${data.county}, Ireland`,
        county: data.county,
        propertyType: "House",
        roofType: "Pitched",
        electricityBill: data.electricityBill,
        timeframe: "3-6 months",
        grants: true,
        additionalInfo: "Quick enquiry from homepage",
      });
    },
    onSuccess: () => {
      setSolarSubmitted(true);
      toast({
        title: "Solar Enquiry Submitted",
        description: "We'll contact you within 24 hours with your free consultation.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Please try again or contact us directly.",
        variant: "destructive",
      });
    },
  });

  const onSolarSubmit = (data: SolarQuickForm) => {
    submitSolarEnquiry.mutate(data);
  };

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Tv className="h-8 w-8 text-primary mr-3" />
              <span className="text-xl font-bold text-gray-900">tradesbook.ie</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#how-it-works" className="text-gray-700 hover:text-primary transition-colors">How it Works</a>
              <a href="#pricing" className="text-gray-700 hover:text-primary transition-colors">Pricing</a>
              <Link href="/admin">
                <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white">
                  Admin
                </Button>
              </Link>
              <Link href="/customer">
                <Button className="bg-primary text-white hover:bg-blue-600">
                  Customer Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
                See Your TV on the Wall{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                  Before You Book
                </span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Upload a photo of your room and our AI will show you exactly how your new TV will look mounted on your wall. Professional installation guaranteed.
              </p>
              <Link href="/booking">
                <Button size="lg" className="inline-flex items-center bg-gradient-to-r from-primary to-secondary text-white px-8 py-4 rounded-2xl text-lg font-semibold hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300">
                  <Sparkles className="w-6 h-6 mr-3" />
                  Start AI Preview
                </Button>
              </Link>
              <div className="mt-8 flex items-center justify-center lg:justify-start space-x-6 text-sm text-gray-500">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  AI Room Preview
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  Professional Install
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  Instant Booking
                </div>
              </div>
            </div>
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
                alt="Modern living room with mounted TV" 
                className="rounded-3xl shadow-2xl w-full" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-3xl"></div>
              <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-800">AI Preview Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Service Tiers Section */}
      <section id="pricing" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Choose Your Installation Service</h2>
            <p className="text-xl text-gray-600">Professional TV mounting and installation services with transparent pricing</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {serviceTiers.map((tier, index) => (
              <ServiceTierCard
                key={tier.id}
                tier={tier}
                isPopular={tier.name.includes('Silver') && !tier.name.includes('85')}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Solar Panel Installation Section - OHK Energy */}
      <section className="py-16 bg-gradient-to-br from-yellow-50 to-orange-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center mr-4">
                  <Bolt className="w-6 h-6 text-white" />
                </div>
                <Badge className="bg-orange-600 text-white">New Partnership</Badge>
              </div>
              
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Solar Panel Installation
              </h2>
              <p className="text-xl text-gray-600 mb-6">
                Power your home with clean energy. Partner with OHK Energy for professional solar installations across Ireland.
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Residential Solar Solutions</h4>
                    <p className="text-gray-600 text-sm">Custom solar panel systems designed for Irish homes</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">SEAI Grant Support</h4>
                    <p className="text-gray-600 text-sm">Up to €2,400 grant assistance available</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Expert Installation</h4>
                    <p className="text-gray-600 text-sm">Certified installers with 10+ years experience</p>
                  </div>
                </div>
              </div>
              
              <Link href="/solar-enquiry">
                <Button size="lg" className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white">
                  Get Free Solar Quote
                </Button>
              </Link>
            </div>
            
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-yellow-200">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bolt className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">OHK Energy Partnership</h3>
                  <p className="text-gray-600">Ireland's trusted solar installation experts</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-yellow-600">15+</div>
                    <div className="text-sm text-gray-600">Years Experience</div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-orange-600">2000+</div>
                    <div className="text-sm text-gray-600">Homes Powered</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-600">€2,400</div>
                    <div className="text-sm text-gray-600">Max Grant</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-600">25yr</div>
                    <div className="text-sm text-gray-600">Warranty</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 bg-gradient-to-br from-purple-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Simple 3-step process to get your TV professionally mounted</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
                <Camera className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">1. Upload & Preview</h3>
              <p className="text-gray-600">Take a photo of your room and let our AI show you how your TV will look mounted on the wall</p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">2. Book & Schedule</h3>
              <p className="text-gray-600">Choose your service tier, select your preferred date and time, and complete your booking</p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Wrench className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">3. Professional Install</h3>
              <p className="text-gray-600">Our certified installer arrives on time and mounts your TV exactly as previewed</p>
            </div>
          </div>
        </div>
      </section>

      {/* Solar Panel Section */}
      <section className="py-16 bg-gradient-to-br from-yellow-50 to-orange-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center mb-6">
                <Sun className="h-12 w-12 text-yellow-500 mr-4" />
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  OHK Energy Partnership
                </Badge>
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                Save on Your Electricity Bills with
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-orange-500">
                  {" "}Solar Power
                </span>
              </h2>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Get a free solar consultation and discover how much you could save with solar panels. SEAI grants available up to €2,400 per home.
              </p>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  <span className="text-sm text-gray-700">Free Consultation</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  <span className="text-sm text-gray-700">SEAI Grant Support</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  <span className="text-sm text-gray-700">Professional Install</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  <span className="text-sm text-gray-700">25 Year Warranty</span>
                </div>
              </div>
            </div>

            <Card className="bg-white/90 backdrop-blur-sm shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bolt className="h-5 w-5 text-yellow-500" />
                  Get Your Free Solar Quote
                </CardTitle>
                <CardDescription>
                  Fill out this quick form and we'll contact you within 24 hours
                </CardDescription>
              </CardHeader>
              <CardContent>
                {solarSubmitted ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Thank You!</h3>
                    <p className="text-gray-600">
                      We'll contact you within 24 hours with your free solar consultation.
                    </p>
                  </div>
                ) : (
                  <Form {...solarForm}>
                    <form onSubmit={solarForm.handleSubmit(onSolarSubmit)} className="space-y-4">
                      <FormField
                        control={solarForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your full name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={solarForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="your@email.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={solarForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone</FormLabel>
                              <FormControl>
                                <Input placeholder="Your phone number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={solarForm.control}
                          name="county"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>County</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select county" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="max-h-48">
                                  {counties.map((county) => (
                                    <SelectItem key={county} value={county}>
                                      {county}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={solarForm.control}
                          name="electricityBill"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Monthly Electricity Bill</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select range" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Under €100">Under €100</SelectItem>
                                  <SelectItem value="€100-€150">€100-€150</SelectItem>
                                  <SelectItem value="€150-€200">€150-€200</SelectItem>
                                  <SelectItem value="€200-€300">€200-€300</SelectItem>
                                  <SelectItem value="Over €300">Over €300</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                        disabled={submitSolarEnquiry.isPending}
                      >
                        {submitSolarEnquiry.isPending ? (
                          <>
                            <Sun className="h-4 w-4 mr-2 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Sun className="h-4 w-4 mr-2" />
                            Get Free Solar Quote
                          </>
                        )}
                      </Button>

                      <p className="text-xs text-gray-500 text-center">
                        Free consultation • No obligation • SEAI approved installer
                      </p>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
