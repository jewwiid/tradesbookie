import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { 
  QrCode, 
  Clock, 
  CheckCircle, 
  Wrench, 
  Home, 
  Calendar,
  MapPin,
  Phone,
  Camera,
  Star,
  Loader2
} from "lucide-react";
import Navigation from "@/components/navigation";

interface BookingDetails {
  id: number;
  qrCode: string;
  status: string;
  tvSize: string;
  serviceType: string;
  wallType: string;
  mountType: string;
  address: string;
  estimatedTotal: string;
  estimatedPrice: string;
  scheduledDate?: string;
  scheduledTime?: string;
  roomPhotoUrl?: string;
  aiPreviewUrl?: string;
  customerNotes?: string;
  createdAt: string;
  contact?: {
    name: string;
    phone: string;
  };
  installer?: {
    id: number;
    name: string;
    phone: string;
    businessName: string;
  };
  jobAssignment?: {
    status: string;
    assignedDate: string;
    acceptedDate?: string;
    completedDate?: string;
  };
}

const statusSteps = [
  { key: "pending", label: "Booking Received", icon: Clock, color: "bg-blue-500" },
  { key: "assigned", label: "Installer Assigned", icon: Wrench, color: "bg-purple-500" },
  { key: "confirmed", label: "Installer Confirmed", icon: CheckCircle, color: "bg-blue-500" },
  { key: "in_progress", label: "Installation in Progress", icon: Home, color: "bg-orange-500" },
  { key: "completed", label: "Installation Complete", icon: Star, color: "bg-emerald-500" }
];

export default function QRTracking() {
  const { qrCode } = useParams();

  const { data: booking, isLoading, error } = useQuery<BookingDetails>({
    queryKey: [`/api/bookings/qr/${qrCode}`],
    enabled: !!qrCode,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center py-8">
            <QrCode className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold mb-2">Error Loading Booking</h2>
            <p className="text-gray-600">
              There was an error loading the booking details. Please try again.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center py-8">
            <QrCode className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold mb-2">Booking Not Found</h2>
            <p className="text-gray-600">
              The QR code you scanned doesn't match any active bookings. Please check the code and try again.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getCurrentStepIndex = () => {
    // Priority: Use jobAssignment status for installer-specific steps, otherwise use booking status
    let currentStatus = booking.status;
    
    // If there's a job assignment, check its status for installer confirmation
    if (booking.jobAssignment) {
      if (booking.jobAssignment.status === 'accepted' && booking.status === 'assigned') {
        currentStatus = 'confirmed'; // Installer has confirmed
      } else if (booking.jobAssignment.status === 'completed') {
        currentStatus = 'completed';
      }
    }
    
    // Map statuses to step indices
    const statusMapping: { [key: string]: number } = {
      'open': 0,        // Booking received
      'pending': 0,     // Booking received
      'assigned': 1,    // Installer assigned
      'confirmed': 2,   // Installer confirmed
      'in_progress': 3, // Installation in progress
      'completed': 4    // Installation complete
    };
    
    return statusMapping[currentStatus] ?? 0; // Default to first step if status not found
  };

  const getProgressMessage = (stepIndex: number, currentStepIndex: number) => {
    if (stepIndex !== currentStepIndex) return null;
    
    const status = booking.jobAssignment?.status || booking.status;
    const hasInstaller = booking.installer;
    
    switch (stepIndex) {
      case 0: // Booking Received
        return "Your booking has been received and is being processed";
      case 1: // Installer Assigned
        return hasInstaller ? "An installer has been assigned to your booking" : "Looking for available installers in your area";
      case 2: // Installer Confirmed
        return "Your installer has confirmed and will contact you soon";
      case 3: // Installation in Progress
        return "Installation work is currently in progress";
      case 4: // Installation Complete
        return "Your installation has been completed successfully";
      default:
        return null;
    }
  };

  const currentStepIndex = getCurrentStepIndex();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <QrCode className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Installation Progress
          </h1>
          <p className="text-gray-600">
            Track your TV installation in real-time
          </p>
        </div>

        {/* Progress Timeline */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Installation Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {statusSteps.map((step, index) => {
                const isCompleted = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;
                const IconComponent = step.icon;

                return (
                  <div key={step.key} className="flex items-center mb-6 last:mb-0">
                    {/* Timeline line */}
                    {index < statusSteps.length - 1 && (
                      <div 
                        className={`absolute left-6 top-12 w-0.5 h-12 ${
                          isCompleted ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                        style={{ marginTop: '0.5rem' }}
                      />
                    )}
                    
                    {/* Status icon */}
                    <div className={`
                      w-12 h-12 rounded-full flex items-center justify-center z-10 mr-4
                      ${isCompleted 
                        ? 'bg-green-500 text-white' 
                        : isCurrent 
                          ? 'bg-primary text-white animate-pulse' 
                          : 'bg-gray-300 text-gray-500'
                      }
                    `}>
                      <IconComponent className="w-6 h-6" />
                    </div>

                    {/* Status details */}
                    <div className="flex-1">
                      <h3 className={`font-semibold ${isCurrent ? 'text-primary' : 'text-gray-900'}`}>
                        {step.label}
                      </h3>
                      {isCurrent && (
                        <p className="text-sm text-gray-600 mt-1">
                          {getProgressMessage(index, currentStepIndex)}
                        </p>
                      )}
                    </div>

                    {/* Status badge */}
                    {isCurrent && (
                      <Badge variant="default" className="bg-primary">
                        Current
                      </Badge>
                    )}
                    {isCompleted && index < currentStepIndex && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Complete
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Booking Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Booking Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Service Type</label>
                <p className="text-gray-900">{booking.serviceType}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">TV Size</label>
                <p className="text-gray-900">{booking.tvSize}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Wall Type</label>
                <p className="text-gray-900">{booking.wallType}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Mount Type</label>
                <p className="text-gray-900">{booking.mountType}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Total Price</label>
                <p className="text-gray-900 font-semibold">€{booking.estimatedTotal}</p>
              </div>
              {booking.scheduledDate && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Scheduled Date</label>
                  <p className="text-gray-900">{booking.scheduledDate} {booking.scheduledTime}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Location & Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Location & Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Installation Address</label>
                <p className="text-gray-900">{booking.address}</p>
              </div>
              {booking.contact && (
                <>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Customer Name</label>
                    <p className="text-gray-900">{booking.contact.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone Number</label>
                    <p className="text-gray-900 flex items-center">
                      <Phone className="w-4 h-4 mr-2" />
                      {booking.contact.phone}
                    </p>
                  </div>
                </>
              )}
              {booking.installer && (
                <div className="border-t pt-4">
                  <label className="text-sm font-medium text-gray-500">Assigned Installer</label>
                  <p className="text-gray-900 font-semibold">{booking.installer.name}</p>
                  <p className="text-gray-600">{booking.installer.businessName}</p>
                  <p className="text-gray-600 flex items-center mt-1">
                    <Phone className="w-4 h-4 mr-2" />
                    {booking.installer.phone}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Room Photos */}
        {(booking.roomPhotoUrl || booking.aiPreviewUrl) && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Camera className="w-5 h-5 mr-2" />
                Room Photos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {booking.roomPhotoUrl && (
                  <div>
                    <h4 className="font-medium mb-2">Original Room Photo</h4>
                    <img 
                      src={booking.roomPhotoUrl} 
                      alt="Room photo" 
                      className="w-full h-48 object-cover rounded-lg border"
                    />
                  </div>
                )}
                {booking.aiPreviewUrl && (
                  <div>
                    <h4 className="font-medium mb-2">AI Installation Preview</h4>
                    <img 
                      src={booking.aiPreviewUrl} 
                      alt="AI preview" 
                      className="w-full h-48 object-cover rounded-lg border"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Customer Notes */}
        {booking.customerNotes && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Special Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{booking.customerNotes}</p>
            </CardContent>
          </Card>
        )}

        {/* Auto-refresh indicator */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <Clock className="w-4 h-4 inline mr-1" />
          Status updates automatically every 30 seconds
        </div>
        </div>
      </div>
    </div>
  );
}