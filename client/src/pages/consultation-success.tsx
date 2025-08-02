import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Calendar, Phone, Mail, MessageCircle, User, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import Navigation from "@/components/navigation";
import Footer from "@/components/Footer";

// Type for Consultation Booking
interface ConsultationBooking {
  id: number;
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
  status: string;
  createdAt: string;
}

const CONSULTATION_TYPE_LABELS: Record<string, string> = {
  "technical-support": "Technical Support",
  "tv-recommendation": "TV Recommendation", 
  "installation-planning": "Installation Planning",
  "general-inquiry": "General Inquiry"
};

const URGENCY_LABELS: Record<string, { label: string; color: string }> = {
  "low": { label: "Low Priority - Within a week", color: "bg-green-100 text-green-700" },
  "normal": { label: "Normal Priority - Within 2-3 days", color: "bg-blue-100 text-blue-700" },
  "high": { label: "High Priority - Within 24 hours", color: "bg-orange-100 text-orange-700" },
  "urgent": { label: "Urgent - Same day", color: "bg-red-100 text-red-700" }
};

export default function ConsultationSuccess() {
  const [, setLocation] = useLocation();
  const [consultationId, setConsultationId] = useState<string>("");

  useEffect(() => {
    // Get consultation ID from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('consultationId') || urlParams.get('id');
    if (id) {
      setConsultationId(id);
    } else {
      // Redirect to consultation booking page if no ID
      setLocation('/consultation-booking');
    }
  }, [setLocation]);

  const { data: consultation, isLoading } = useQuery<ConsultationBooking>({
    queryKey: ['/api/consultations', consultationId],
    enabled: !!consultationId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <Navigation />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your consultation details...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!consultation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
        <Navigation />
        <div className="flex items-center justify-center py-20">
          <Card className="max-w-md">
            <CardContent className="text-center p-8">
              <h2 className="text-2xl font-bold text-red-600 mb-4">Consultation Not Found</h2>
              <p className="text-gray-600 mb-6">
                We couldn't find your consultation details. Please contact support if you believe this is an error.
              </p>
              <Button onClick={() => setLocation('/consultation-booking')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Booking
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Consultation Booked Successfully!
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Your consultation request has been received and confirmed
          </p>
          <Badge className="bg-green-600 text-white px-4 py-2 text-lg">
            Consultation ID: {consultation.id}
          </Badge>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Consultation Details */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Consultation Details
              </CardTitle>
              <CardDescription>
                Your consultation booking information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Name</p>
                  <p className="font-semibold">{consultation.customerName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="font-semibold">{consultation.customerEmail}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">Phone</p>
                <p className="font-semibold">{consultation.customerPhone}</p>
              </div>

              <div className="border-t pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Consultation Type</p>
                    <p className="font-semibold">{CONSULTATION_TYPE_LABELS[consultation.consultationType] || consultation.consultationType}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Preferred Contact</p>
                    <p className="font-semibold capitalize">{consultation.preferredContactMethod}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Preferred Date</p>
                  <p className="font-semibold">
                    {format(new Date(consultation.preferredDate), "EEEE, MMMM d, yyyy")}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Preferred Time</p>
                  <p className="font-semibold">{consultation.preferredTime}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">Priority Level</p>
                <Badge className={URGENCY_LABELS[consultation.urgency]?.color || "bg-gray-100"}>
                  {URGENCY_LABELS[consultation.urgency]?.label || consultation.urgency}
                </Badge>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">Subject</p>
                <p className="font-semibold">{consultation.subject}</p>
              </div>

              {consultation.message && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Message</p>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{consultation.message}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                What Happens Next?
              </CardTitle>
              <CardDescription>
                We'll be in touch soon to schedule your consultation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 font-semibold">1</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">Confirmation Email</h4>
                    <p className="text-gray-600">
                      You'll receive a confirmation email with all your consultation details within the next few minutes.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 font-semibold">2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">Expert Assignment</h4>
                    <p className="text-gray-600">
                      Our team will review your request and assign the best expert for your consultation type.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 font-semibold">3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">Contact & Scheduling</h4>
                    <p className="text-gray-600">
                      Our expert will contact you via your preferred method to confirm the consultation time.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 font-semibold">4</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">Professional Consultation</h4>
                    <p className="text-gray-600">
                      Receive personalized advice and solutions during your scheduled consultation.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">Need Help?</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-blue-700">
                    <Mail className="w-4 h-4" />
                    <span>support@tradesbook.ie</span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-700">
                    <Phone className="w-4 h-4" />
                    <span>01-XXX-XXXX</span>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-5 h-5 text-green-600" />
                  <h4 className="font-semibold text-green-900">Expected Response Time</h4>
                </div>
                <p className="text-green-700 text-sm">
                  {consultation.urgency === 'urgent' 
                    ? 'Within 2-4 hours during business hours'
                    : consultation.urgency === 'high'
                    ? 'Within 24 hours'
                    : consultation.urgency === 'normal'
                    ? 'Within 2-3 business days'
                    : 'Within 1 week'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-12 space-y-4">
          <Button 
            onClick={() => setLocation('/customer-dashboard')}
            size="lg"
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            View My Consultations
          </Button>
          
          <div>
            <Button 
              onClick={() => setLocation('/')}
              variant="outline"
              size="lg"
            >
              Return to Homepage
            </Button>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}