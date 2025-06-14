import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Bolt, 
  Home, 
  Hammer, 
  Euro, 
  Star,
  MapPin,
  Clock,
  CheckCircle,
  Calendar,
  Camera,
  Phone,
  User,
  Loader2
} from "lucide-react";

interface InstallerStats {
  monthlyJobs: number;
  earnings: number;
  rating: number;
}

interface JobAssignment {
  id: number;
  bookingId: number;
  status: string;
  assignedDate: string;
  acceptedDate?: string;
  completedDate?: string;
  booking?: {
    qrCode: string;
    tvSize: string;
    serviceType: string;
    wallType: string;
    mountType: string;
    address: string;
    totalPrice: string;
    installerEarnings: string;
    preferredDate?: string;
    preferredTime?: string;
    roomPhotoUrl?: string;
    aiPreviewUrl?: string;
    customerNotes?: string;
    contact?: {
      name: string;
      phone: string;
    };
  };
}

function JobCard({ job, onStatusChange }: { 
  job: JobAssignment; 
  onStatusChange: (jobId: number, status: string) => void;
}) {
  const getStatusInfo = (status: string) => {
    switch (status) {
      case "assigned":
        return { color: "bg-warning", text: "New Assignment" };
      case "accepted":
        return { color: "bg-blue-500", text: "Accepted" };
      case "completed":
        return { color: "bg-success", text: "Completed" };
      case "declined":
        return { color: "bg-destructive", text: "Declined" };
      default:
        return { color: "bg-muted", text: "Unknown" };
    }
  };

  const statusInfo = getStatusInfo(job.status);
  const booking = job.booking;

  if (!booking) {
    return (
      <Card className="border-destructive/20">
        <CardContent className="p-6 text-center">
          <p className="text-destructive">Booking information not available</p>
        </CardContent>
      </Card>
    );
  }

  const isNew = job.status === "assigned";
  const isAccepted = job.status === "accepted";
  const isCompleted = job.status === "completed";

  return (
    <Card className={`${isNew ? 'border-warning/50 bg-warning/5' : ''} ${isAccepted ? 'border-blue-200 bg-blue-50' : ''}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-lg font-semibold text-foreground">
                {booking.contact?.name || 'Customer'}
              </h3>
              <Badge className={`${statusInfo.color} text-white`}>
                {statusInfo.text}
              </Badge>
            </div>
            <p className="text-muted-foreground mb-2">
              {booking.serviceType} - {booking.tvSize}" TV
            </p>
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 mr-1" />
              {booking.address}
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-success">
              €{parseFloat(booking.installerEarnings).toFixed(2)}
            </p>
            {booking.preferredDate && (
              <p className="text-sm text-muted-foreground">
                {new Date(booking.preferredDate).toLocaleDateString()}
                {booking.preferredTime && (
                  <span className="block">
                    {booking.preferredTime === "09:00" && "9:00 AM - 11:00 AM"}
                    {booking.preferredTime === "11:00" && "11:00 AM - 1:00 PM"}
                    {booking.preferredTime === "13:00" && "1:00 PM - 3:00 PM"}
                    {booking.preferredTime === "15:00" && "3:00 PM - 5:00 PM"}
                    {booking.preferredTime === "17:00" && "5:00 PM - 7:00 PM"}
                  </span>
                )}
              </p>
            )}
          </div>
        </div>

        {/* Job Details */}
        <div className="grid md:grid-cols-2 gap-4 mb-4 text-sm">
          <div>
            <span className="text-muted-foreground">Wall Type:</span>
            <span className="ml-2 font-medium">{booking.wallType}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Mount Type:</span>
            <span className="ml-2 font-medium">{booking.mountType}</span>
          </div>
        </div>

        {/* Customer Photos */}
        {(booking.roomPhotoUrl || booking.aiPreviewUrl) && (
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            {booking.roomPhotoUrl && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Customer Photo</p>
                <img 
                  src={booking.roomPhotoUrl}
                  alt="Customer room photo" 
                  className="w-full h-32 object-cover rounded-lg border"
                />
              </div>
            )}
            {booking.aiPreviewUrl && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">AI Preview</p>
                <div className="relative">
                  <img 
                    src={booking.aiPreviewUrl}
                    alt="AI preview of TV installation" 
                    className="w-full h-32 object-cover rounded-lg border"
                  />
                  <Badge className="absolute top-2 right-2 bg-success text-white text-xs">
                    <Camera className="w-3 h-3 mr-1" />
                    AI Generated
                  </Badge>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Customer Notes */}
        {booking.customerNotes && (
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-2">Customer Notes</p>
            <p className="text-sm text-foreground bg-muted/50 p-3 rounded-lg">
              {booking.customerNotes}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {booking.contact?.phone && (
              <Button variant="outline" size="sm">
                <Phone className="w-4 h-4 mr-1" />
                Call Customer
              </Button>
            )}
            <Button variant="outline" size="sm">
              <MapPin className="w-4 h-4 mr-1" />
              View Route
            </Button>
          </div>
          
          <div className="space-x-2">
            {isNew && (
              <>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onStatusChange(job.id, 'declined')}
                >
                  Decline
                </Button>
                <Button 
                  size="sm"
                  onClick={() => onStatusChange(job.id, 'accepted')}
                  className="bg-success hover:bg-success/90"
                >
                  Accept Job
                </Button>
              </>
            )}
            {isAccepted && (
              <Button 
                size="sm"
                onClick={() => onStatusChange(job.id, 'completed')}
                className="gradient-bg"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Mark Complete
              </Button>
            )}
            {isCompleted && (
              <Badge className="bg-success text-white">
                <CheckCircle className="w-3 h-3 mr-1" />
                Completed
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function InstallerDashboard() {
  const [, setLocation] = useLocation();
  const { id } = useParams();
  const [activeFilter, setActiveFilter] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const installerId = parseInt(id || "1");

  const { data: jobs = [], isLoading: jobsLoading } = useQuery<JobAssignment[]>({
    queryKey: [`/api/installers/${installerId}/jobs`]
  });

  const updateJobMutation = useMutation({
    mutationFn: async ({ jobId, status }: { jobId: number; status: string }) => {
      await apiRequest('PATCH', `/api/jobs/${jobId}/status`, { status });
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: [`/api/installers/${installerId}/jobs`] });
      toast({
        title: "Job Updated",
        description: `Job status changed to ${status}.`
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleStatusChange = (jobId: number, status: string) => {
    updateJobMutation.mutate({ jobId, status });
  };

  const filteredJobs = jobs.filter(job => {
    if (activeFilter === "all") return true;
    return job.status === activeFilter;
  });

  // Calculate stats
  const monthlyJobs = jobs.filter(job => {
    const jobDate = new Date(job.assignedDate);
    const now = new Date();
    return jobDate.getMonth() === now.getMonth() && jobDate.getFullYear() === now.getFullYear();
  }).length;

  const earnings = jobs
    .filter(job => job.status === "completed")
    .reduce((sum, job) => sum + parseFloat(job.booking?.installerEarnings || "0"), 0);

  const filterButtons = [
    { key: "all", label: "All", count: jobs.length },
    { key: "assigned", label: "New", count: jobs.filter(j => j.status === "assigned").length },
    { key: "accepted", label: "Accepted", count: jobs.filter(j => j.status === "accepted").length },
    { key: "completed", label: "Completed", count: jobs.filter(j => j.status === "completed").length }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Bolt className="w-6 h-6 text-primary mr-3" />
              <span className="text-xl font-bold text-foreground">Installer Dashboard</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => setLocation("/")} size="sm">
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-foreground">Installer #{installerId}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Jobs This Month</p>
                  <p className="text-2xl font-bold text-foreground">{monthlyJobs}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Hammer className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Earnings</p>
                  <p className="text-2xl font-bold text-foreground">€{earnings.toFixed(2)}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Euro className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Rating</p>
                  <p className="text-2xl font-bold text-foreground">4.9</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Star className="w-6 h-6 text-yellow-600" />
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
                {filterButtons.map((filter) => (
                  <Button
                    key={filter.key}
                    variant={activeFilter === filter.key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveFilter(filter.key)}
                  >
                    {filter.label} ({filter.count})
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {jobsLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
                  <p className="text-muted-foreground">Loading jobs...</p>
                </div>
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {activeFilter === "all" ? "No Jobs Available" : `No ${activeFilter} Jobs`}
                </h3>
                <p className="text-muted-foreground">
                  {activeFilter === "all" 
                    ? "New job assignments will appear here when available."
                    : `You don't have any ${activeFilter} jobs at the moment.`
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
