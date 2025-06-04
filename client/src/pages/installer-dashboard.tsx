import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/navigation";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Wrench, 
  Euro, 
  Star, 
  Home,
  MapPin,
  Clock,
  CheckCircle2
} from "lucide-react";
import { useLocation } from "wouter";

// Mock installer ID - in real app this would come from authentication
const INSTALLER_ID = 1;

interface InstallerStats {
  monthlyJobs: number;
  earnings: number;
  rating: number;
}

export default function InstallerDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState('all');

  // Mock stats - in real app these would come from API
  const installerStats: InstallerStats = {
    monthlyJobs: 18,
    earnings: 2850,
    rating: 4.9
  };

  const { data: bookings, isLoading } = useQuery({
    queryKey: [`/api/installer/${INSTALLER_ID}/bookings`],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: number; status: string }) => {
      await apiRequest('PUT', `/api/bookings/${bookingId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/installer/${INSTALLER_ID}/bookings`] });
      toast({
        title: "Success",
        description: "Job status updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update job status",
        variant: "destructive",
      });
    },
  });

  const acceptJob = (bookingId: number) => {
    updateStatusMutation.mutate({ bookingId, status: 'assigned' });
  };

  const completeJob = (bookingId: number) => {
    updateStatusMutation.mutate({ bookingId, status: 'completed' });
  };

  const viewRoute = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/${encodedAddress}`, '_blank');
  };

  const filterButtons = [
    { key: 'all', label: 'All' },
    { key: 'confirmed', label: 'New' },
    { key: 'assigned', label: 'Accepted' },
    { key: 'completed', label: 'Completed' },
  ];

  const filteredBookings = bookings?.filter((booking: any) => 
    filterStatus === 'all' || booking.status === filterStatus
  ) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'assigned': return 'bg-yellow-100 text-yellow-800';
      case 'in-progress': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed': return 'New';
      case 'assigned': return 'Accepted';
      case 'in-progress': return 'In Progress';
      case 'completed': return 'Completed';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getTimeSlotText = (timeSlot: string) => {
    const timeSlots: Record<string, string> = {
      '09:00': '9:00 AM - 11:00 AM',
      '11:00': '11:00 AM - 1:00 PM',
      '13:00': '1:00 PM - 3:00 PM',
      '15:00': '3:00 PM - 5:00 PM',
      '17:00': '5:00 PM - 7:00 PM'
    };
    return timeSlots[timeSlot] || timeSlot;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Wrench className="text-2xl text-primary mr-3" />
              <span className="text-xl font-bold text-gray-900">Installer Dashboard</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => setLocation('/')}>
                <Home className="h-4 w-4" />
              </Button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">T</span>
                </div>
                <span className="text-sm font-medium text-gray-700">Tom Mitchell</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Jobs This Month</p>
                  <p className="text-2xl font-bold text-gray-900">{installerStats.monthlyJobs}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Wrench className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Earnings</p>
                  <p className="text-2xl font-bold text-gray-900">€{installerStats.earnings}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Euro className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Rating</p>
                  <p className="text-2xl font-bold text-gray-900">{installerStats.rating}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Star className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Job Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Assigned Jobs</CardTitle>
              <div className="flex space-x-2">
                {filterButtons.map((button) => (
                  <Button
                    key={button.key}
                    variant={filterStatus === button.key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterStatus(button.key)}
                  >
                    {button.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredBookings.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No jobs found for the selected filter.
                </div>
              ) : (
                filteredBookings.map((booking: any) => (
                  <Card key={booking.id} className={`border-2 transition-all duration-200 ${
                    booking.status === 'assigned' ? 'border-green-200 bg-green-50' : 
                    booking.status === 'completed' ? 'border-gray-200 opacity-75' : 
                    'border-gray-200 hover:shadow-md'
                  }`}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{booking.customerName}</h3>
                            <Badge className={getStatusColor(booking.status)}>
                              {getStatusLabel(booking.status)}
                            </Badge>
                          </div>
                          <p className="text-gray-600 mb-2">{booking.serviceType} - {booking.tvSize}" TV</p>
                          <p className="text-sm text-gray-500 flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {booking.address}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">
                            €{(Number(booking.totalPrice) * (100 - Number(booking.appFeeRate)) / 100).toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-500 flex items-center justify-end">
                            <Clock className="h-4 w-4 mr-1" />
                            {formatDate(booking.scheduledDate)}
                          </p>
                          <p className="text-sm text-gray-500">{getTimeSlotText(booking.timeSlot)}</p>
                        </div>
                      </div>

                      {booking.customerNotes && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-600 mb-2">Customer Notes</p>
                          <p className="text-sm text-gray-700 bg-white p-3 rounded-lg border">
                            {booking.customerNotes}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => viewRoute(booking.address)}
                        >
                          <MapPin className="h-4 w-4 mr-1" />
                          View Route
                        </Button>
                        <div className="space-x-2">
                          {booking.status === 'confirmed' && (
                            <Button 
                              size="sm"
                              onClick={() => acceptJob(booking.id)}
                              disabled={updateStatusMutation.isPending}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Accept Job
                            </Button>
                          )}
                          {booking.status === 'assigned' && (
                            <Button 
                              size="sm"
                              onClick={() => completeJob(booking.id)}
                              disabled={updateStatusMutation.isPending}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Mark Complete
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
