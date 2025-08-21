import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, addDays } from "date-fns";
import { Calendar, Clock, CheckCircle, XCircle, MessageSquare, Send, AlertCircle, ChevronDown, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { TIME_SLOTS } from "@/lib/constants";

interface ScheduleNegotiationProps {
  bookingId: number;
  installerId: number;
  customerName: string;
  isInstaller?: boolean;
  onClose?: () => void;
}

interface ScheduleNegotiation {
  id: number;
  bookingId: number;
  installerId: number;
  proposedDate: string;
  proposedTimeSlot?: string;
  proposedStartTime?: string;
  proposedEndTime?: string;
  proposalMessage?: string;
  proposedBy: 'customer' | 'installer';
  status: 'pending' | 'accepted' | 'declined' | 'counter_proposed';
  responseMessage?: string;
  createdAt: string;
}


export function ScheduleNegotiation({ bookingId, installerId, customerName, isInstaller = true, onClose }: ScheduleNegotiationProps) {
  const [newProposal, setNewProposal] = useState({
    date: "",
    timeSlot: "",
    message: ""
  });
  const [responseMessage, setResponseMessage] = useState("");
  const [isExpanded, setIsExpanded] = useState(true); // New state for expanded/collapsed
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing negotiations
  const { data: negotiations = [], isLoading } = useQuery({
    queryKey: ['/api/bookings', bookingId, 'schedule-negotiations'],
    refetchInterval: 60000 // Refresh every minute instead of every 10 seconds to avoid disrupting user input
  });

  // Fetch active negotiation
  const { data: activeNegotiation } = useQuery({
    queryKey: ['/api/bookings', bookingId, 'active-negotiation']
  });

  // Create new proposal mutation
  const createProposalMutation = useMutation({
    mutationFn: async (proposal: any) => {
      return apiRequest('POST', '/api/schedule-negotiations', {
        bookingId,
        installerId,
        proposedDate: proposal.date,
        proposedTimeSlot: proposal.timeSlot,
        proposalMessage: proposal.message,
        proposedBy: isInstaller ? 'installer' : 'customer',
        status: 'pending'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings', bookingId, 'schedule-negotiations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings', bookingId, 'active-negotiation'] });
      queryClient.invalidateQueries({ queryKey: ['/api/installer', installerId, 'schedule-negotiations'] });
      setNewProposal({ date: "", timeSlot: "", message: "" });
      toast({
        title: "Proposal sent",
        description: isInstaller ? "Your schedule proposal has been sent to the customer." : "Your schedule proposal has been sent to the installer."
      });
      // Close the dialog after successful proposal submission
      if (onClose) {
        onClose();
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send proposal. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Respond to proposal mutation
  const respondMutation = useMutation({
    mutationFn: async ({ negotiationId, status, message }: { negotiationId: number; status: string; message?: string }) => {
      return apiRequest('PATCH', `/api/schedule-negotiations/${negotiationId}`, {
        status,
        responseMessage: message,
        bookingId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings', bookingId, 'schedule-negotiations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings', bookingId, 'active-negotiation'] });
      setResponseMessage("");
      toast({
        title: "Response sent",
        description: "Your response has been sent successfully."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send response. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Delete negotiation mutation
  const deleteNegotiationMutation = useMutation({
    mutationFn: async (negotiationId: number) => {
      return apiRequest('DELETE', `/api/schedule-negotiations/${negotiationId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings', bookingId, 'schedule-negotiations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings', bookingId, 'active-negotiation'] });
      toast({
        title: "Message deleted",
        description: "The schedule message has been deleted successfully."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to delete message. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleCreateProposal = () => {
    if (!newProposal.date) {
      toast({
        title: "Date required",
        description: "Please select a proposed date.",
        variant: "destructive"
      });
      return;
    }

    createProposalMutation.mutate(newProposal);
  };

  const handleAccept = (negotiationId: number) => {
    respondMutation.mutate({
      negotiationId,
      status: 'accepted',
      message: responseMessage
    });
  };

  const handleDecline = (negotiationId: number) => {
    if (!responseMessage.trim()) {
      toast({
        title: "Message required",
        description: "Please provide a reason for declining.",
        variant: "destructive"
      });
      return;
    }

    respondMutation.mutate({
      negotiationId,
      status: 'declined',
      message: responseMessage
    });
  };

  const handleDeleteNegotiation = (negotiationId: number) => {
    if (window.confirm("Are you sure you want to delete this message? This action cannot be undone.")) {
      deleteNegotiationMutation.mutate(negotiationId);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-300">Pending</Badge>;
      case 'accepted':
        return <Badge variant="outline" className="text-green-600 border-green-300">Accepted</Badge>;
      case 'declined':
        return <Badge variant="outline" className="text-red-600 border-red-300">Declined</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getMinDate = () => {
    const tomorrow = addDays(new Date(), 1);
    return format(tomorrow, 'yyyy-MM-dd');
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div 
            className="flex items-center justify-between cursor-pointer hover:bg-gray-50 -mx-6 px-6 py-2 rounded-lg transition-colors"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Schedule Communication
            </CardTitle>
            <ChevronDown className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
          {isExpanded && (
            <CardDescription>
              Coordinate installation timing with {isInstaller ? customerName : "the installer"}
            </CardDescription>
          )}
        </CardHeader>
        {isExpanded && (
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              Loading schedule negotiations...
            </div>
          </CardContent>
        )}
      </Card>
    );
  }

  const negotiationsList = negotiations as ScheduleNegotiation[];
  const pendingNegotiation = negotiationsList.find((n: ScheduleNegotiation) => 
    n.status === 'pending' && n.proposedBy !== (isInstaller ? 'installer' : 'customer')
  );

  const latestNegotiation = negotiationsList[0];
  const isScheduleConfirmed = latestNegotiation?.status === 'accepted';

  return (
    <Card>
      <CardHeader className="pb-2">
        <div 
          className="flex items-center justify-between cursor-pointer hover:bg-gray-50 -mx-6 px-6 py-2 rounded-lg transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Schedule Communication
          </CardTitle>
          <ChevronDown className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
        {isExpanded && (
          <CardDescription>
            Coordinate installation timing with {isInstaller ? customerName : "the installer"}
          </CardDescription>
        )}
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6">
        {isScheduleConfirmed && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-800 font-medium mb-2">
              <CheckCircle className="h-5 w-5" />
              Installation Scheduled
            </div>
            <p className="text-green-700">
              <strong>Date:</strong> {format(new Date(latestNegotiation.proposedDate), 'EEEE, MMMM do, yyyy')}
            </p>
            {latestNegotiation.proposedTimeSlot && (
              <p className="text-green-700">
                <strong>Time:</strong> {latestNegotiation.proposedStartTime && latestNegotiation.proposedEndTime 
                  ? `${latestNegotiation.proposedStartTime} - ${latestNegotiation.proposedEndTime}` 
                  : TIME_SLOTS.find(slot => slot.value === latestNegotiation.proposedTimeSlot)?.label || latestNegotiation.proposedTimeSlot}
              </p>
            )}
          </div>
        )}

        {/* Pending Response Section */}
        {pendingNegotiation && !isScheduleConfirmed && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-800 font-medium mb-3">
              <AlertCircle className="h-5 w-5" />
              Pending Your Response
            </div>
            
            <div className="space-y-2 mb-4">
              <p className="text-blue-700">
                <strong>Proposed Date:</strong> {format(new Date(pendingNegotiation.proposedDate), 'EEEE, MMMM do, yyyy')}
              </p>
              {pendingNegotiation.proposedTimeSlot && (
                <p className="text-blue-700">
                  <strong>Time:</strong> {pendingNegotiation.proposedStartTime && pendingNegotiation.proposedEndTime 
                    ? `${pendingNegotiation.proposedStartTime} - ${pendingNegotiation.proposedEndTime}` 
                    : TIME_SLOTS.find(slot => slot.value === pendingNegotiation.proposedTimeSlot)?.label || pendingNegotiation.proposedTimeSlot}
                </p>
              )}
              {pendingNegotiation.proposalMessage && (
                <div className="text-blue-700">
                  <strong>Message:</strong>
                  <p className="mt-1 italic">"{pendingNegotiation.proposalMessage}"</p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="response-message">Response Message (optional for accept, required for decline)</Label>
                <Textarea
                  id="response-message"
                  placeholder="Add a message with your response..."
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => handleAccept(pendingNegotiation.id)}
                  disabled={respondMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Accept
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDecline(pendingNegotiation.id)}
                  disabled={respondMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <XCircle className="h-4 w-4" />
                  Decline
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* New Proposal Section */}
        {!pendingNegotiation && !isScheduleConfirmed && (
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              {negotiationsList.some((n: any) => n.status === 'accepted') 
                ? 'Propose Re-Schedule' 
                : 'Propose Installation Schedule'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="proposal-date">Proposed Date</Label>
                <Input
                  id="proposal-date"
                  type="date"
                  min={getMinDate()}
                  value={newProposal.date}
                  onChange={(e) => setNewProposal(prev => ({ ...prev, date: e.target.value }))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="proposal-time">Time Preference</Label>
                <Select
                  value={newProposal.timeSlot}
                  onValueChange={(value) => setNewProposal(prev => ({ ...prev, timeSlot: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select time preference" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map((slot) => (
                      <SelectItem key={slot.value} value={slot.value}>
                        {slot.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="proposal-message">Message (optional)</Label>
              <Textarea
                id="proposal-message"
                placeholder="Add any additional details or preferences..."
                value={newProposal.message}
                onChange={(e) => setNewProposal(prev => ({ ...prev, message: e.target.value }))}
                className="mt-1"
              />
            </div>

            <Button
              onClick={handleCreateProposal}
              disabled={createProposalMutation.isPending}
              className="flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              Send Proposal
            </Button>
          </div>
        )}

        {/* Negotiation History */}
        {negotiationsList.length > 0 && (
          <div className="space-y-4">
            <Separator />
            <h3 className="font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Negotiation History
            </h3>

            <div className="space-y-3">
              {negotiationsList.map((negotiation: ScheduleNegotiation, index: number) => {
                const isLatestMessage = index === 0; // First item is most recent (ordered by createdAt DESC)
                
                return (
                  <div
                    key={negotiation.id}
                    className="border rounded-lg p-3 bg-gray-50"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {negotiation.proposedBy === 'installer' ? 'Installer' : 'Customer'}
                        </span>
                        {getStatusBadge(negotiation.status)}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {format(new Date(negotiation.createdAt), 'MMM dd, yyyy')}
                        </span>
                        {!isLatestMessage && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDeleteNegotiation(negotiation.id)}
                            disabled={deleteNegotiationMutation.isPending}
                            title="Delete this message"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>

                  <p className="text-sm text-gray-700 mb-1">
                    <strong>Date:</strong> {format(new Date(negotiation.proposedDate), 'EEEE, MMMM do, yyyy')}
                  </p>

                  {negotiation.proposedTimeSlot && (
                    <p className="text-sm text-gray-700 mb-1">
                      <strong>Time:</strong> {negotiation.proposedStartTime && negotiation.proposedEndTime 
                        ? `${negotiation.proposedStartTime} - ${negotiation.proposedEndTime}` 
                        : TIME_SLOTS.find(slot => slot.value === negotiation.proposedTimeSlot)?.label || negotiation.proposedTimeSlot}
                    </p>
                  )}

                  {negotiation.proposalMessage && (
                    <p className="text-sm text-gray-600 italic mb-1">
                      "{negotiation.proposalMessage}"
                    </p>
                  )}

                  {negotiation.responseMessage && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <p className="text-sm text-gray-600">
                        <strong>Response:</strong> "{negotiation.responseMessage}"
                      </p>
                    </div>
                  )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        </CardContent>
      )}
    </Card>
  );
}