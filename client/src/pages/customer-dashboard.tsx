import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  Tv, 
  Home, 
  CheckCircle, 
  Clock, 
  Bolt, 
  MapPin, 
  Calendar,
  Phone,
  Mail,
  QrCode,
  Camera,
  Loader2
} from "lucide-react";
import QRCodeGenerator from "@/components/qr-code-generator";
import QRCodeScanner from "@/components/qr-code-scanner";

interface CustomerLoginProps {
  onLogin: (bookingId: string) => void;
}

function CustomerLogin({ onLogin }: CustomerLoginProps) {
  const [bookingId, setBookingId] = useState("");
  const [email, setEmail] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const { toast } = useToast();

  const handleLogin = () => {
    if (!bookingId || !email) {
      toast({
        title: "Missing Information",
        description: "Please enter both booking ID and email address.",
        variant: "destructive"
      });
      return;
    }
    onLogin(bookingId);
  };

  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Tv className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Customer Access</CardTitle>
          <p className="text-muted-foreground">Enter your booking details or scan your QR code</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="bookingId">Booking ID</Label>
            <Input
              id="bookingId"
              placeholder="BK-2024-001"
              value={bookingId}
              onChange={(e) => setBookingId(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Button onClick={handleLogin} className="w-full gradient-bg">
              Access Dashboard
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => setShowScanner(true)}
              className="w-full"
            >
              <QrCode className="w-4 h-4 mr-2" />
              Scan QR Code
            </Button>
          </div>
        </CardContent>
      </Card>

      {showScanner && (
        <QRCodeScanner
          onScan={(result) => {
            setShowScanner(false);
            onLogin(result);
          }}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}

export default function CustomerDashboard() {
  const [, setLocation] = useLocation();
  const { qrCode } = useParams();
  const [currentBookingId, setCurrentBookingId] = useState(qrCode || "");

  const { data: booking, isLoading, error } = useQuery({
    queryKey: [`/api/bookings/qr/${currentBookingId}`],
    enabled: !!currentBookingId
  });

  if (!currentBookingId) {
    return <CustomerLogin onLogin={setCurrentBookingId} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen hero-gradient flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your booking...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen hero-gradient flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Tv className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Booking Not Found</h2>
            <p className="text-muted-foreground mb-4">
              We couldn't find a booking with the provided details.
            </p>
            <Button onClick={() => setCurrentBookingId("")} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "pending":
        return { icon: Clock, color: "bg-warning", text: "Pending Confirmation" };
      case "confirmed":
        return { icon: CheckCircle, color: "bg-primary", text: "Confirmed" };
      case "assigned":
        return { icon: Bolt, color: "bg-blue-500", text: "Installer Assigned" };
      case "in-progress":
        return { icon: Bolt, color: "bg-orange-500", text: "Installation in Progress" };
      case "completed":
        return { icon: CheckCircle, color: "bg-success", text: "Completed" };
      case "cancelled":
        return { icon: Clock, color: "bg-destructive", text: "Cancelled" };
      default:
        return { icon: Clock, color: "bg-muted", text: "Unknown" };
    }
  };

  const statusInfo = getStatusInfo(booking.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Tv className="w-6 h-6 text-primary mr-3" />
              <span className="text-xl font-bold text-foreground">Customer Dashboard</span>
            </div>
            <Button variant="ghost" onClick={() => setLocation("/")} size="sm">
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* QR Code Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Your Booking QR Code</CardTitle>
            <p className="text-center text-muted-foreground">
              Save this QR code to quickly access your booking details
            </p>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="flex justify-center">
              <QRCodeGenerator 
                text={`https://smarttvmount.app/customer/${booking.qrCode}`}
                size={200}
              />
            </div>
            <p className="text-sm text-muted-foreground font-mono">
              Booking ID: {booking.qrCode}
            </p>
          </CardContent>
        </Card>

        {/* Status Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Booking Status</CardTitle>
              <Badge className={`${statusInfo.color} text-white`}>
                {statusInfo.text}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-success rounded-full flex items-center justify-center mr-4">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-foreground">Booking Confirmed</div>
                  <div className="text-sm text-muted-foreground">
                    Your installation has been scheduled
                  </div>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 ${
                  booking.status === "assigned" || booking.status === "in-progress" || booking.status === "completed" 
                    ? "bg-success" : "bg-warning"
                }`}>
                  <Bolt className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-foreground">Installer Assignment</div>
                  <div className="text-sm text-muted-foreground">
                    {booking.status === "assigned" || booking.status === "in-progress" || booking.status === "completed"
                      ? "Professional installer has been assigned"
                      : "Waiting for installer assignment"
                    }
                  </div>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 ${
                  booking.status === "completed" ? "bg-success" : "bg-muted"
                }`}>
                  <StatusIcon className={`w-4 h-4 ${
                    booking.status === "completed" ? "text-white" : "text-muted-foreground"
                  }`} />
                </div>
                <div>
                  <div className={`font-semibold ${
                    booking.status === "completed" ? "text-foreground" : "text-muted-foreground"
                  }`}>
                    Installation Day
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {booking.status === "completed" 
                      ? "Installation completed successfully"
                      : "We'll arrive at your scheduled time"
                    }
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Installation Details */}
        <Card>
          <CardHeader>
            <CardTitle>Installation Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-foreground mb-3">Service Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">TV Size:</span>
                    <span className="font-medium">{booking.tvSize}"</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Service Type:</span>
                    <span className="font-medium">{booking.serviceType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Wall Type:</span>
                    <span className="font-medium">{booking.wallType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mount Type:</span>
                    <span className="font-medium">{booking.mountType}</span>
                  </div>
                  {booking.addons && booking.addons.length > 0 && (
                    <div>
                      <span className="text-muted-foreground">Add-ons:</span>
                      <ul className="mt-1">
                        {booking.addons.map((addon: any, idx: number) => (
                          <li key={idx} className="text-sm font-medium ml-4">
                            • {addon.name} (+€{addon.price})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-foreground mb-3">Schedule & Contact</h3>
                <div className="space-y-2 text-sm">
                  {booking.preferredDate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date:</span>
                      <span className="font-medium">
                        {new Date(booking.preferredDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {booking.preferredTime && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Time:</span>
                      <span className="font-medium">
                        {booking.preferredTime === "09:00" && "9:00 AM - 11:00 AM"}
                        {booking.preferredTime === "11:00" && "11:00 AM - 1:00 PM"}
                        {booking.preferredTime === "13:00" && "1:00 PM - 3:00 PM"}
                        {booking.preferredTime === "15:00" && "3:00 PM - 5:00 PM"}
                        {booking.preferredTime === "17:00" && "5:00 PM - 7:00 PM"}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Address:</span>
                    <span className="font-medium text-right">{booking.address}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between text-lg">
                    <span className="text-muted-foreground">Total Cost:</span>
                    <span className="font-bold text-primary">€{parseFloat(booking.totalPrice).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Preview Section */}
            {(booking.roomPhotoUrl || booking.aiPreviewUrl) && (
              <>
                <Separator className="my-6" />
                <div>
                  <h3 className="font-semibold text-foreground mb-3">AI Room Preview</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {booking.roomPhotoUrl && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Before</p>
                        <img 
                          src={booking.roomPhotoUrl}
                          alt="Room before TV installation" 
                          className="w-full h-48 object-cover rounded-lg border"
                        />
                      </div>
                    )}
                    {booking.aiPreviewUrl && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">After (AI Preview)</p>
                        <div className="relative">
                          <img 
                            src={booking.aiPreviewUrl}
                            alt="Room with mounted TV preview" 
                            className="w-full h-48 object-cover rounded-lg border"
                          />
                          <Badge className="absolute top-2 right-2 bg-success text-white">
                            <Camera className="w-3 h-3 mr-1" />
                            AI Generated
                          </Badge>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Customer Notes */}
            {booking.customerNotes && (
              <>
                <Separator className="my-6" />
                <div>
                  <h3 className="font-semibold text-foreground mb-3">Special Instructions</h3>
                  <p className="text-muted-foreground bg-muted/50 p-4 rounded-lg">
                    {booking.customerNotes}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Contact Support */}
        <Card>
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="outline" className="flex-1">
                <Phone className="w-4 h-4 mr-2" />
                Call Support
              </Button>
              <Button variant="outline" className="flex-1">
                <Mail className="w-4 h-4 mr-2" />
                Email Support
              </Button>
              <Button variant="outline" className="flex-1">
                <MapPin className="w-4 h-4 mr-2" />
                Track Installer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
