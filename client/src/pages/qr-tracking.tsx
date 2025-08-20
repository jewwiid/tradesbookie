import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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
  Loader2,
  Check,
  X,
  MessageSquare
} from "lucide-react";
import Navigation from "@/components/navigation";
import ExpandableQRCode from "@/components/ExpandableQRCode";

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
  // Multi-TV support
  tvInstallations?: Array<{
    tvSize: string;
    serviceType: string;
    location: string;
    mountType?: string;
    needsWallMount?: boolean;
    wallMountOption?: string;
    addons?: any[];
    price?: string;
  }>;
  contact?: {
    name: string;
    phone: string;
  };
  installer?: {
    id: number;
    name: string;
    phone: string;
    businessName: string;
    profileImageUrl?: string;
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
  { key: "confirmed", label: "Schedule Confirmed", icon: CheckCircle, color: "bg-blue-500" },
  { key: "scheduled", label: "Installation Scheduled", icon: Calendar, color: "bg-green-500" },
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

  // Fetch schedule negotiations for this booking
  const { data: scheduleNegotiations = [] } = useQuery({
    queryKey: [`/api/bookings/${booking?.id}/schedule-negotiations`],
    enabled: !!booking?.id,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const queryClient = useQueryClient();

  // Mutation to respond to schedule proposals
  const respondToProposal = useMutation({
    mutationFn: async ({ negotiationId, status, responseMessage }: { 
      negotiationId: number; 
      status: string; 
      responseMessage?: string;
    }) => {
      return apiRequest(`/api/schedule-negotiations/${negotiationId}`, {
        method: 'PATCH',
        body: { status, responseMessage, bookingId: booking?.id }
      });
    },
    onSuccess: () => {
      // Refetch both booking and negotiations data
      queryClient.invalidateQueries({ queryKey: [`/api/bookings/qr/${qrCode}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/bookings/${booking?.id}/schedule-negotiations`] });
    },
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
    
    // Check for schedule negotiations - if accepted, treat as scheduled
    if ((booking as any).scheduleNegotiations?.some((n: any) => n.status === 'accepted')) {
      currentStatus = 'scheduled';
    }
    
    // Map statuses to step indices
    const statusMapping: { [key: string]: number } = {
      'open': 0,        // Booking received
      'pending': 0,     // Booking received
      'assigned': 1,    // Installer assigned
      'confirmed': 2,   // Installer confirmed
      'scheduled': 3,   // Installation scheduled
      'in_progress': 4, // Installation in progress
      'in-progress': 4, // Installation in progress (alternative format)
      'completed': 5    // Installation complete
    };
    
    return statusMapping[currentStatus] ?? 0; // Default to first step if status not found
  };

  const getProgressMessage = (stepIndex: number, currentStepIndex: number) => {
    if (stepIndex !== currentStepIndex) return null;
    
    const status = booking.jobAssignment?.status || booking.status;
    const hasInstaller = booking.installer;
    const hasSchedule = booking.scheduledDate;
    
    // Calculate urgency for messaging
    const getUrgencyLevel = () => {
      if (!hasSchedule || !booking.scheduledDate) return 'standard';
      const scheduled = new Date(booking.scheduledDate);
      const now = new Date();
      const hoursDiff = (scheduled.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      if (hoursDiff <= 24) return 'emergency';
      if (hoursDiff <= 48) return 'urgent';
      return 'standard';
    };
    
    const urgency = getUrgencyLevel();
    const urgencyText = urgency === 'emergency' ? ' (within 24 hours)' : urgency === 'urgent' ? ' (within 48 hours)' : '';
    
    switch (stepIndex) {
      case 0: // Booking Received
        return "Your booking has been received and is being processed";
      case 1: // Installer Assigned
        return hasInstaller ? "An installer has been assigned to your booking" : "Looking for available installers in your area";
      case 2: // Installer Confirmed
        return "Your installer has confirmed and will contact you soon";
      case 3: // Installation Scheduled
        return `Your installation has been scheduled and confirmed${urgencyText}`;
      case 4: // Installation in Progress
        return "Installation work is currently in progress";
      case 5: // Installation Complete
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
                <label className="text-sm font-medium text-gray-500">Booking Reference</label>
                <p className="text-gray-900 font-mono font-semibold flex items-center mb-3">
                  <QrCode className="w-4 h-4 mr-2 text-primary" />
                  {booking.qrCode}
                </p>
                <ExpandableQRCode 
                  qrCode={booking.qrCode}
                  bookingId={booking.id}
                  showInline={true}
                  title="Booking QR Code"
                  description="Use this QR code to verify and track the correct booking completion"
                  size={150}
                />
              </div>
              {booking.tvInstallations && Array.isArray(booking.tvInstallations) && booking.tvInstallations.length > 1 ? (
                <div>
                  <label className="text-sm font-medium text-gray-500">TV Installations</label>
                  <div className="space-y-2 mt-2">
                    {booking.tvInstallations.map((tv: any, index: number) => (
                      <div key={index} className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">
                            {tv.location}: {tv.tvSize}" TV
                          </span>
                          {tv.price && (
                            <span className="text-sm text-gray-600">€{tv.price}</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          <div>Service: {tv.serviceType.replace('-', ' ')}</div>
                          {tv.needsWallMount && (
                            <div>Mount: {tv.wallMountOption || 'Wall Mount Required'}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <>
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
                </>
              )}
              <div>
                <label className="text-sm font-medium text-gray-500">Total Price</label>
                <p className="text-gray-900 font-semibold">€{booking.estimatedTotal}</p>
              </div>
              {booking.scheduledDate && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Scheduled Date</label>
                  <p className="text-gray-900">
                    {new Date(booking.scheduledDate).toLocaleDateString('en-IE', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })} at {booking.scheduledTime}
                  </p>
                </div>
              )}
              
              {/* Display pending schedule proposals */}
              {scheduleNegotiations.filter((n: any) => n.status === 'pending' && n.proposedBy === 'installer').map((proposal: any) => (
                <div key={proposal.id} className="mt-4 p-4 border-2 border-amber-200 bg-amber-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare className="w-5 h-5 text-amber-600" />
                    <label className="text-sm font-medium text-amber-800">New Schedule Proposal</label>
                  </div>
                  <div className="space-y-2 mb-4">
                    <p className="text-amber-900 font-medium">
                      {new Date(proposal.proposedDate).toLocaleDateString('en-IE', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })} at {proposal.proposedTimeSlot}
                    </p>
                    {proposal.proposalMessage && (
                      <p className="text-sm text-amber-700">
                        <strong>Installer's note:</strong> {proposal.proposalMessage}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => respondToProposal.mutate({
                        negotiationId: proposal.id,
                        status: 'accepted',
                        responseMessage: 'Schedule confirmed'
                      })}
                      disabled={respondToProposal.isPending}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Accept Schedule
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => respondToProposal.mutate({
                        negotiationId: proposal.id,
                        status: 'reject',
                        responseMessage: 'Cannot make this time'
                      })}
                      disabled={respondToProposal.isPending}
                      className="border-red-300 text-red-700 hover:bg-red-50"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Decline
                    </Button>
                  </div>
                </div>
              ))}
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
                  <div className="flex items-start space-x-3 mt-2">
                    {booking.installer.profileImageUrl ? (
                      <img 
                        src={booking.installer.profileImageUrl} 
                        alt={`${booking.installer.name} profile`}
                        className="w-12 h-12 rounded-full object-cover border-2 border-primary/20"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                        <span className="text-primary font-semibold text-lg">
                          {booking.installer.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-gray-900 font-semibold">{booking.installer.name}</p>
                      <p className="text-gray-600">{booking.installer.businessName}</p>
                      <p className="text-gray-600 flex items-center mt-1">
                        <Phone className="w-4 h-4 mr-2" />
                        {booking.installer.phone}
                      </p>
                    </div>
                  </div>
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