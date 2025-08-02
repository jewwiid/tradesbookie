import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/navigation";
import Footer from "@/components/Footer";
import { Calendar, Clock, MessageCircle, Phone, Mail, Video, ArrowLeft, CheckCircle } from "lucide-react";

interface ConsultationData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  consultationType: string;
  preferredDate: string;
  preferredTime: string;
  preferredContactMethod: string;
  subject: string;
  message: string;
  urgency: string;
  existingCustomer: boolean;
}

const CONSULTATION_TYPES = [
  { value: "technical-support", label: "Technical Support", icon: "🔧" },
  { value: "tv-recommendation", label: "TV Recommendation", icon: "📺" },
  { value: "installation-planning", label: "Installation Planning", icon: "🏠" },
  { value: "general-inquiry", label: "General Inquiry", icon: "💬" },
];

const URGENCY_LEVELS = [
  { value: "low", label: "Low - Within a week", color: "text-green-600" },
  { value: "normal", label: "Normal - Within 2-3 days", color: "text-blue-600" },
  { value: "high", label: "High - Within 24 hours", color: "text-orange-600" },
  { value: "urgent", label: "Urgent - Same day", color: "text-red-600" },
];

export default function ConsultationBooking() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const [formData, setFormData] = useState<ConsultationData>({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    consultationType: "",
    preferredDate: "",
    preferredTime: "",
    preferredContactMethod: "",
    subject: "",
    message: "",
    urgency: "normal",
    existingCustomer: false,
  });

  const bookConsultationMutation = useMutation({
    mutationFn: async (data: ConsultationData) => {
      const response = await apiRequest("POST", "/api/consultations", data);
      return await response.json();
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: "Consultation Request Submitted",
        description: "We'll contact you within 24 hours to schedule your consultation.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Please try again or contact support directly.",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: keyof ConsultationData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.customerName || !formData.customerEmail || !formData.customerPhone || 
        !formData.consultationType || !formData.preferredContactMethod || 
        !formData.subject || !formData.message) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    bookConsultationMutation.mutate(formData);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-2xl mx-auto px-4 py-12">
          <Card className="text-center">
            <CardContent className="pt-8 pb-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Consultation Request Submitted!
              </h1>
              <p className="text-gray-600 mb-6">
                Thank you for your consultation request. Our support team has received your information 
                and will contact you within 24 hours to schedule your {" "}
                {CONSULTATION_TYPES.find(t => t.value === formData.consultationType)?.label.toLowerCase()} consultation.
              </p>
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
                <ul className="text-sm text-blue-800 space-y-1 text-left">
                  <li>• We'll review your consultation request</li>
                  <li>• A support specialist will contact you via {formData.preferredContactMethod}</li>
                  <li>• We'll schedule a time that works for you</li>
                  <li>• Prepare any questions or information you'd like to discuss</li>
                </ul>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  onClick={() => setLocation("/")}
                  variant="outline"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
                <Button 
                  onClick={() => setLocation("/ai-help")}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Try AI Assistant
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => setLocation("/ai-help")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to AI Help
          </Button>
          
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Book a Consultation
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Schedule a personal consultation with our experts. We'll help you with technical support, 
              TV recommendations, installation planning, or any other questions you may have.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-blue-600" />
              Consultation Request Form
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customerName">Full Name *</Label>
                    <Input
                      id="customerName"
                      value={formData.customerName}
                      onChange={(e) => handleInputChange("customerName", e.target.value)}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerEmail">Email Address *</Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      value={formData.customerEmail}
                      onChange={(e) => handleInputChange("customerEmail", e.target.value)}
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerPhone">Phone Number *</Label>
                    <Input
                      id="customerPhone"
                      type="tel"
                      value={formData.customerPhone}
                      onChange={(e) => handleInputChange("customerPhone", e.target.value)}
                      placeholder="Enter your phone number"
                      required
                    />
                  </div>
                  <div className="flex items-center space-x-3 pt-6">
                    <Checkbox
                      id="existingCustomer"
                      checked={formData.existingCustomer}
                      onCheckedChange={(checked) => handleInputChange("existingCustomer", checked as boolean)}
                    />
                    <Label htmlFor="existingCustomer" className="text-sm">
                      I'm an existing customer
                    </Label>
                  </div>
                </div>
              </div>

              {/* Consultation Type */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Consultation Type *</h3>
                <RadioGroup
                  value={formData.consultationType}
                  onValueChange={(value) => handleInputChange("consultationType", value)}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  {CONSULTATION_TYPES.map((type) => (
                    <div key={type.value} className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-gray-50">
                      <RadioGroupItem value={type.value} id={type.value} />
                      <Label htmlFor={type.value} className="flex items-center gap-2 cursor-pointer">
                        <span className="text-lg">{type.icon}</span>
                        {type.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Preferred Contact Method */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Preferred Contact Method *</h3>
                <RadioGroup
                  value={formData.preferredContactMethod}
                  onValueChange={(value) => handleInputChange("preferredContactMethod", value)}
                  className="flex flex-wrap gap-4"
                >
                  <div className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-gray-50">
                    <RadioGroupItem value="phone" id="phone" />
                    <Label htmlFor="phone" className="flex items-center gap-2 cursor-pointer">
                      <Phone className="w-4 h-4" />
                      Phone Call
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-gray-50">
                    <RadioGroupItem value="email" id="email" />
                    <Label htmlFor="email" className="flex items-center gap-2 cursor-pointer">
                      <Mail className="w-4 h-4" />
                      Email
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-gray-50">
                    <RadioGroupItem value="video-call" id="video-call" />
                    <Label htmlFor="video-call" className="flex items-center gap-2 cursor-pointer">
                      <Video className="w-4 h-4" />
                      Video Call
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Scheduling Preferences */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Scheduling Preferences</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="preferredDate">Preferred Date</Label>
                    <Input
                      id="preferredDate"
                      type="date"
                      value={formData.preferredDate}
                      onChange={(e) => handleInputChange("preferredDate", e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <Label htmlFor="preferredTime">Preferred Time</Label>
                    <Select value={formData.preferredTime} onValueChange={(value) => handleInputChange("preferredTime", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select preferred time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="morning">Morning (9:00 AM - 12:00 PM)</SelectItem>
                        <SelectItem value="afternoon">Afternoon (12:00 PM - 5:00 PM)</SelectItem>
                        <SelectItem value="evening">Evening (5:00 PM - 8:00 PM)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Subject and Message */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Consultation Details</h3>
                <div>
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => handleInputChange("subject", e.target.value)}
                    placeholder="Brief description of what you need help with"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="message">Detailed Message *</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => handleInputChange("message", e.target.value)}
                    placeholder="Please provide as much detail as possible about your question or the help you need..."
                    rows={5}
                    required
                  />
                </div>
              </div>

              {/* Urgency Level */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Urgency Level</h3>
                <RadioGroup
                  value={formData.urgency}
                  onValueChange={(value) => handleInputChange("urgency", value)}
                  className="space-y-2"
                >
                  {URGENCY_LEVELS.map((level) => (
                    <div key={level.value} className="flex items-center space-x-3 border rounded-lg p-3 hover:bg-gray-50">
                      <RadioGroupItem value={level.value} id={level.value} />
                      <Label htmlFor={level.value} className={`cursor-pointer ${level.color}`}>
                        {level.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  disabled={bookConsultationMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 px-8 py-3"
                >
                  {bookConsultationMutation.isPending ? "Submitting..." : "Submit Consultation Request"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">What to Expect</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Response Time:</strong> We typically respond within 2-4 hours during business hours.
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Scheduling:</strong> Consultations are available Monday-Friday, 9 AM - 8 PM.
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MessageCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Free Service:</strong> All consultations are completely free with no obligation.
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Expert Help:</strong> You'll speak directly with our experienced technicians.
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}