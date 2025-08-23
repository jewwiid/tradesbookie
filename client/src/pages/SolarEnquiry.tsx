import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { Bolt, Home, Euro, CheckCircle, ArrowLeft, Phone, Mail, MapPin, Sun, TrendingDown, Shield, DollarSign, Leaf, Clock, Award, Zap } from "lucide-react";

const solarEnquirySchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  address: z.string().min(5, "Please enter your full address"),
  county: z.string().min(1, "Please select your county"),
  propertyType: z.string().min(1, "Please select your property type"),
  roofType: z.string().min(1, "Please select your roof type"),
  electricityBill: z.string().min(1, "Please select your monthly electricity bill range"),
  timeframe: z.string().min(1, "Please select your preferred timeframe"),
  grants: z.boolean().default(false),
  storeName: z.string().optional(),
  storeLocation: z.string().optional(),
  additionalInfo: z.string().optional(),
});

type SolarEnquiryForm = z.infer<typeof solarEnquirySchema>;

const counties = [
  "Antrim", "Armagh", "Carlow", "Cavan", "Clare", "Cork", "Derry", "Donegal", "Down", "Dublin", "Fermanagh", "Galway", "Kerry", "Kildare", "Kilkenny", "Laois", "Leitrim", "Limerick", "Longford", "Louth", "Mayo", "Meath", "Monaghan", "Offaly", "Roscommon", "Sligo", "Tipperary", "Tyrone", "Waterford", "Westmeath", "Wexford", "Wicklow"
];

const storeNames = [
  "Harvey Norman",
  "Currys",
  "DID Electrical", 
  "Power City",
  "Argos",
  "Expert",
  "RTV"
];

const storeLocations = [
  "Blanchardstown",
  "Carrickmines", 
  "Cork",
  "Dublin",
  "Galway",
  "Limerick",
  "Waterford",
  "Athlone",
  "Castlebar",
  "Drogheda",
  "Fonthill",
  "Kinsale Road",
  "Little Island",
  "Naas",
  "Rathfarnham",
  "Sligo",
  "Swords",
  "Tallaght",
  "Tralee",
  "Kilkenny"
];

export default function SolarEnquiry() {
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<SolarEnquiryForm>({
    resolver: zodResolver(solarEnquirySchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      county: "",
      propertyType: "",
      roofType: "",
      electricityBill: "",
      timeframe: "",
      grants: false,
      storeName: "",
      storeLocation: "",
      additionalInfo: "",
    },
  });

  const submitEnquiry = useMutation({
    mutationFn: async (data: SolarEnquiryForm) => {
      return apiRequest("POST", "/api/solar-enquiries", data);
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: "Enquiry Submitted Successfully",
        description: "We'll contact you within 24 hours with your free solar consultation.",
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

  const onSubmit = (data: SolarEnquiryForm) => {
    submitEnquiry.mutate(data);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="text-center">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Thank You!</h1>
            <p className="text-xl text-gray-600 mb-8">
              Your solar enquiry has been submitted successfully. An OHK Energy specialist will contact you within 24 hours.
            </p>
            
            <div className="bg-white rounded-lg p-6 shadow-lg mb-8 max-w-md mx-auto">
              <h3 className="font-semibold text-gray-900 mb-4">What happens next?</h3>
              <div className="space-y-3 text-left">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-600">Free consultation call within 24 hours</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-600">Home survey and system design</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-600">Custom quote with SEAI grant details</span>
                </div>
              </div>
            </div>

            <Link href="/">
              <Button size="lg" className="bg-primary text-white hover:bg-blue-600">
                Return to Homepage
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Button variant="ghost" className="text-primary hover:text-blue-600">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Homepage
              </Button>
            </Link>
            <div className="flex items-center">
              <Bolt className="w-6 h-6 text-yellow-600 mr-2" />
              <span className="text-lg font-semibold text-gray-900">Solar Installation Enquiry</span>
            </div>
          </div>
        </div>
      </div>

      {/* Why Solar Energy Section */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Why Should You Look Into Solar Energy?
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Solar panels are becoming a smart choice for Irish homeowners. With high energy costs, government grants, and Ireland's push for sustainability, now is the perfect time to consider solar for your home.
          </p>
        </div>

        {/* Key Benefits Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="text-center">
            <CardContent className="pt-6">
              <TrendingDown className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Cut Bills by 50%</h3>
              <p className="text-sm text-gray-600">A typical 4kW system can save ~€1,500/year</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <Clock className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Fast Payback</h3>
              <p className="text-sm text-gray-600">Most systems pay for themselves in 5–7 years</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <Euro className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Government Grants</h3>
              <p className="text-sm text-gray-600">Up to €1,800 grants plus 0% VAT</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <Home className="h-12 w-12 text-purple-500 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Boost Home Value</h3>
              <p className="text-sm text-gray-600">Properties with solar can sell for up to 4% more</p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Benefits */}
        <Card className="mb-16">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Key Benefits of Solar Energy in Ireland</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <strong>Earn from the grid</strong> – get 15–25c per kWh for surplus energy (up to €400/year tax-free)
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <strong>Works in Irish weather</strong> – panels generate power even on cloudy days
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <strong>Low maintenance, long life</strong> – 25+ year lifespan with minimal upkeep
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <strong>Reduce carbon footprint</strong> – a 4kW system offsets the same CO₂ as 2.4 acres of forest annually
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <strong>Proven track record</strong> – over 120,000 homes in Ireland already have solar panels
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <strong>Similar to Germany's success</strong> – Ireland gets ~1,100 kWh/m² of solar energy per year
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats Table */}
        <Card className="mb-16">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Quick Stats for Ireland</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-yellow-50">
                    <th className="border border-gray-200 p-3 text-left font-semibold">Factor</th>
                    <th className="border border-gray-200 p-3 text-left font-semibold">Typical Value (Residential)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-200 p-3">Average system size</td>
                    <td className="border border-gray-200 p-3">4 kW (~10 panels)</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-200 p-3">Annual generation (Dublin)</td>
                    <td className="border border-gray-200 p-3">~3,900 kWh</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 p-3">Annual household consumption</td>
                    <td className="border border-gray-200 p-3">~4,200 kWh</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-200 p-3">Annual bill savings</td>
                    <td className="border border-gray-200 p-3 font-semibold text-green-600">€1,500 – €1,700</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 p-3">SEAI grant</td>
                    <td className="border border-gray-200 p-3 font-semibold text-blue-600">Up to €1,800</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-200 p-3">Export earnings</td>
                    <td className="border border-gray-200 p-3">Up to €400/year (tax-free)</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 p-3">Payback period</td>
                    <td className="border border-gray-200 p-3 font-semibold text-orange-600">5–7 years</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-200 p-3">Panel lifespan</td>
                    <td className="border border-gray-200 p-3">25–30+ years</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <Card className="mb-16">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Do solar panels work on cloudy days in Ireland?</h4>
                <p className="text-gray-600">Yes. Panels generate electricity from daylight, not just direct sunlight, so they still produce power on overcast days.</p>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">How much can I save?</h4>
                <p className="text-gray-600">On average, homeowners cut 50% off annual electricity bills. A typical 4kW system saves ~€1,500/year.</p>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">What's the payback time?</h4>
                <p className="text-gray-600">Most systems pay back in 5–7 years thanks to grants and high energy prices.</p>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Are there grants or supports available?</h4>
                <p className="text-gray-600">Yes. SEAI provides up to €1,800, and all installations benefit from 0% VAT. You'll also earn credits for exported energy under the Clean Export Guarantee.</p>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Do panels need much maintenance?</h4>
                <p className="text-gray-600">No. With no moving parts, panels need only occasional cleaning and a check every few years. They come with 25-year warranties.</p>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Is now the right time?</h4>
                <p className="text-gray-600">Yes. Grants and zero VAT are in place now, but may taper down. High energy prices mean every year you wait costs you savings.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Get Your Free Solar Quote</CardTitle>
                <CardDescription>
                  Complete this form to receive a personalized solar consultation from OHK Energy specialists.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Personal Information */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Smith" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="john@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input placeholder="087 123 4567" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Property Information */}
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Property Address</FormLabel>
                          <FormControl>
                            <Input placeholder="123 Main Street, Dublin" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="county"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>County</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select your county" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
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

                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="propertyType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Property Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select property type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="detached-house">Detached House</SelectItem>
                                <SelectItem value="semi-detached">Semi-Detached House</SelectItem>
                                <SelectItem value="terraced-house">Terraced House</SelectItem>
                                <SelectItem value="bungalow">Bungalow</SelectItem>
                                <SelectItem value="apartment">Apartment</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="roofType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Roof Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select roof type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="slate">Slate</SelectItem>
                                <SelectItem value="tile">Tile</SelectItem>
                                <SelectItem value="metal">Metal</SelectItem>
                                <SelectItem value="flat">Flat Roof</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                                <SelectItem value="not-sure">Not Sure</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="electricityBill"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Monthly Electricity Bill</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select bill range" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="under-100">Under €100</SelectItem>
                                <SelectItem value="100-150">€100 - €150</SelectItem>
                                <SelectItem value="150-200">€150 - €200</SelectItem>
                                <SelectItem value="200-300">€200 - €300</SelectItem>
                                <SelectItem value="over-300">Over €300</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="timeframe"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Installation Timeframe</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select timeframe" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="asap">As soon as possible</SelectItem>
                                <SelectItem value="3-months">Within 3 months</SelectItem>
                                <SelectItem value="6-months">Within 6 months</SelectItem>
                                <SelectItem value="12-months">Within 12 months</SelectItem>
                                <SelectItem value="exploring">Just exploring options</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Store Information */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="storeName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Store Name (Optional)</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select store if applicable" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {storeNames.map((store) => (
                                  <SelectItem key={store} value={store}>
                                    {store}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="storeLocation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Store Location (Optional)</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select store location if applicable" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {storeLocations.map((location) => (
                                  <SelectItem key={location} value={location}>
                                    {location}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="grants"
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
                              I'm interested in information about SEAI grants (up to €2,400 available)
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="additionalInfo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional Information (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Any specific requirements or questions about your solar installation..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white"
                      disabled={submitEnquiry.isPending}
                    >
                      {submitEnquiry.isPending ? "Submitting..." : "Get Free Solar Quote"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Info Sidebar */}
          <div className="space-y-6">
            <Card className="bg-gradient-to-br from-yellow-100 to-orange-100 border-yellow-200">
              <CardHeader>
                <CardTitle className="text-lg">Why Choose OHK Energy?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start">
                  <Award className="w-5 h-5 text-green-600 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Specialist in Residential Solar PV</h4>
                    <p className="text-sm text-gray-600">For Irish homes with proven track record</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Shield className="w-5 h-5 text-green-600 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">SEAI-Registered Installers</h4>
                    <p className="text-sm text-gray-600">Ensuring eligibility for all grants</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Zap className="w-5 h-5 text-green-600 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Custom System Design</h4>
                    <p className="text-sm text-gray-600">Tailored to your roof and household usage</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">End-to-End Service</h4>
                    <p className="text-sm text-gray-600">From consultation to installation and aftercare</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">25-Year Warranty</h4>
                    <p className="text-sm text-gray-600">Comprehensive system protection</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center">
                  <Phone className="w-4 h-4 text-gray-500 mr-3" />
                  <span className="text-sm text-gray-600">1800 123 456</span>
                </div>
                <div className="flex items-center">
                  <Mail className="w-4 h-4 text-gray-500 mr-3" />
                  <span className="text-sm text-gray-600">info@ohkenergy.com</span>
                </div>
                <div className="flex items-start">
                  <MapPin className="w-4 h-4 text-gray-500 mr-3 mt-1" />
                  <span className="text-sm text-gray-600">Serving all of Ireland</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="text-center">
                  <Badge className="bg-green-600 text-white mb-2">SEAI Grant Available</Badge>
                  <div className="text-2xl font-bold text-green-700">Up to €2,400</div>
                  <div className="text-sm text-green-600">Government grant support</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}