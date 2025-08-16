import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Store, Users, MapPin, FileText, Settings } from "lucide-react";
import { Link } from "wouter";

const storeApplicationSchema = z.object({
  storeName: z.string().min(2, "Store name must be at least 2 characters"),
  businessName: z.string().min(2, "Business name must be at least 2 characters"),
  websiteUrl: z.string().url("Please enter a valid website URL").optional().or(z.literal("")),
  contactName: z.string().min(2, "Contact name must be at least 2 characters"),
  contactEmail: z.string().email("Please enter a valid email address"),
  contactPhone: z.string().min(10, "Please enter a valid phone number"),
  contactPosition: z.string().min(2, "Please enter your position"),
  businessRegistrationNumber: z.string().optional(),
  vatNumber: z.string().optional(),
  yearsInBusiness: z.string().min(1, "Please specify years in business"),
  numberOfLocations: z.string().min(1, "Please specify number of locations"),
  primaryProducts: z.string().min(10, "Please describe your primary products"),
  headOfficeAddress: z.string().min(10, "Please enter your head office address"),
  serviceAreas: z.string().min(2, "Please specify your service areas"),
  monthlyInvoiceVolume: z.string().min(1, "Please select monthly invoice volume"),
  installationServicesOffered: z.boolean().default(false),
  currentInstallationPartners: z.string().optional(),
  reasonForJoining: z.string().min(20, "Please explain why you want to join (minimum 20 characters)"),
  invoiceFormat: z.string().min(5, "Please describe your invoice format"),
  sampleInvoiceNumber: z.string().min(3, "Please provide a sample invoice number"),
  posSystemUsed: z.string().min(2, "Please specify your POS system"),
  canProvideInvoiceData: z.boolean().default(false),
  referralSource: z.string().optional(),
  submittedViaInvoice: z.string().optional(),
});

type StoreApplicationForm = z.infer<typeof storeApplicationSchema>;

export default function StorePartnerSignup() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get the invoice number from URL params if redirected from failed login
  const urlParams = new URLSearchParams(window.location.search);
  const triggeringInvoice = urlParams.get('invoice');

  const form = useForm<StoreApplicationForm>({
    resolver: zodResolver(storeApplicationSchema),
    defaultValues: {
      storeName: "",
      businessName: "",
      websiteUrl: "",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
      contactPosition: "",
      businessRegistrationNumber: "",
      vatNumber: "",
      yearsInBusiness: "",
      numberOfLocations: "",
      primaryProducts: "",
      headOfficeAddress: "",
      serviceAreas: "",
      monthlyInvoiceVolume: "",
      installationServicesOffered: false,
      currentInstallationPartners: "",
      reasonForJoining: "",
      invoiceFormat: "",
      sampleInvoiceNumber: triggeringInvoice || "",
      posSystemUsed: "",
      canProvideInvoiceData: false,
      referralSource: "",
      submittedViaInvoice: triggeringInvoice || "",
    },
  });

  const submitApplication = useMutation({
    mutationFn: (data: StoreApplicationForm) =>
      apiRequest("POST", "/api/store-partner/apply", data),
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: "Application submitted successfully!",
        description: "We'll review your application and contact you within 2-3 business days.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error submitting application",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: StoreApplicationForm) => {
    submitApplication.mutate(data);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Store className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-800">Application Submitted Successfully!</CardTitle>
              <CardDescription className="text-lg">
                Thank you for your interest in becoming a tradesbook.ie partner store.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-left">
                <h3 className="font-semibold text-green-800 mb-2">What happens next?</h3>
                <ul className="space-y-2 text-green-700">
                  <li>• Our team will review your application within 2-3 business days</li>
                  <li>• We'll contact you to discuss integration details and requirements</li>
                  <li>• Upon approval, we'll set up your store's invoice authentication system</li>
                  <li>• Your customers will be able to use their invoices to access our services</li>
                </ul>
              </div>
              <div className="flex gap-4 justify-center">
                <Link href="/customer-login">
                  <Button variant="outline">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Login
                  </Button>
                </Link>
                <Link href="/">
                  <Button>
                    Go to Homepage
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <Store className="mx-auto w-16 h-16 text-blue-600 mb-4" />
          <h1 className="text-3xl font-bold text-gray-900">Become a Partner Store</h1>
          <p className="mt-2 text-lg text-gray-600">
            Join tradesbook.ie and offer your customers premium installation services
          </p>
          {triggeringInvoice && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3 max-w-md mx-auto">
              <p className="text-blue-800 text-sm">
                We noticed you tried to use invoice <strong>{triggeringInvoice}</strong>. 
                Complete this form to add your store to our platform!
              </p>
            </div>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Store Partnership Application</CardTitle>
            <CardDescription>
              Help us understand your business so we can provide the best integration experience.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                
                {/* Basic Store Information */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 border-b pb-2">
                    <Store className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold">Store Information</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="storeName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Store/Brand Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Harvey Norman" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="businessName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Legal Business Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Harvey Norman Holdings Ltd" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="websiteUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://www.yourstore.ie" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="businessRegistrationNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Registration Number</FormLabel>
                          <FormControl>
                            <Input placeholder="Optional" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="vatNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>VAT Number</FormLabel>
                          <FormControl>
                            <Input placeholder="Optional" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 border-b pb-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold">Contact Information</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="contactName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Person *</FormLabel>
                          <FormControl>
                            <Input placeholder="John Smith" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="contactPosition"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Position/Title *</FormLabel>
                          <FormControl>
                            <Input placeholder="Store Manager" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="contactEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address *</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="contact@yourstore.ie" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="contactPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number *</FormLabel>
                          <FormControl>
                            <Input placeholder="+353 1 234 5678" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Business Details */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 border-b pb-2">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold">Business Details</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="yearsInBusiness"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Years in Business *</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select years" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="less-than-1">Less than 1 year</SelectItem>
                                <SelectItem value="1-2">1-2 years</SelectItem>
                                <SelectItem value="3-5">3-5 years</SelectItem>
                                <SelectItem value="6-10">6-10 years</SelectItem>
                                <SelectItem value="11-20">11-20 years</SelectItem>
                                <SelectItem value="more-than-20">More than 20 years</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="numberOfLocations"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number of Locations *</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select locations" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">1 location</SelectItem>
                                <SelectItem value="2-5">2-5 locations</SelectItem>
                                <SelectItem value="6-10">6-10 locations</SelectItem>
                                <SelectItem value="11-20">11-20 locations</SelectItem>
                                <SelectItem value="more-than-20">More than 20 locations</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="primaryProducts"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Products/Services *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="TVs, Home Electronics, Kitchen Appliances, Installation Services, etc."
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="headOfficeAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Head Office Address *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Full address including county and Eircode"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="serviceAreas"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service Areas *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Dublin, Cork, Galway, Nationwide, etc."
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Partnership Interest */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 border-b pb-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold">Partnership Interest</h3>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="monthlyInvoiceVolume"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estimated Monthly Invoice Volume *</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select volume range" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="less-than-50">Less than 50 invoices</SelectItem>
                              <SelectItem value="50-200">50-200 invoices</SelectItem>
                              <SelectItem value="200-500">200-500 invoices</SelectItem>
                              <SelectItem value="500-1000">500-1000 invoices</SelectItem>
                              <SelectItem value="more-than-1000">More than 1000 invoices</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="installationServicesOffered"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            We currently offer installation services to our customers
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="currentInstallationPartners"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Installation Partners</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="None, or list current partners"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="reasonForJoining"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Why do you want to join tradesbook.ie? *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Tell us about your interest in our platform and how it would benefit your customers..."
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Technical Requirements */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 border-b pb-2">
                    <Settings className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold">Technical Information</h3>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="invoiceFormat"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Invoice Number Format *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., INV-2024-00123, ST-DUB-456789"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sampleInvoiceNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sample Invoice Number *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Provide a real example from your system"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="posSystemUsed"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>POS/Billing System Used *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., SAP, Oracle, Sage, Square, Custom system"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="canProvideInvoiceData"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            We can provide customer invoice data securely for verification purposes
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="referralSource"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>How did you hear about tradesbook.ie?</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Google, referral, customer request, etc."
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex gap-4 pt-6">
                  <Link href="/customer-login">
                    <Button type="button" variant="outline">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Login
                    </Button>
                  </Link>
                  <Button 
                    type="submit" 
                    disabled={submitApplication.isPending}
                    className="flex-1"
                  >
                    {submitApplication.isPending ? "Submitting..." : "Submit Application"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}