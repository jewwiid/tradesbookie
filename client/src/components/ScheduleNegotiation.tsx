import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, Clock, MessageSquare, CheckCircle, XCircle, User, Users, ChevronDown, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { TIME_SLOTS } from '@/lib/constants';

interface ScheduleNegotiation {
  id: number;
  bookingId: number;
  installerId: number;
  proposedDate: string;
  proposedTimeSlot: string;
  proposedStartTime?: string;
  proposedEndTime?: string;
  proposedBy: 'customer' | 'installer';
  status: 'pending' | 'accepted' | 'rejected' | 'counter_proposed';
  proposalMessage?: string;
  responseMessage?: string;
  proposedAt: string;
  respondedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface ScheduleNegotiationProps {
  bookingId: number;
  installerId?: number;
  userType: 'customer' | 'installer';
  installerName?: string;
  customerName?: string;
}

export default function ScheduleNegotiation({ 
  bookingId, 
  installerId, 
  userType, 
  installerName = 'Installer',
  customerName = 'Customer' 
}: ScheduleNegotiationProps) {
  const [responseMessage, setResponseMessage] = useState('');
  const [showResponseDialog, setShowResponseDialog] = useState(false);
  const [selectedNegotiation, setSelectedNegotiation] = useState<ScheduleNegotiation | null>(null);
  const [actionType, setActionType] = useState<'accept' | 'reject'>('accept');
  const [showAll, setShowAll] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const { toast } = useToast();

  // Fetch schedule negotiations for this booking
  const { data: negotiations = [], isLoading, refetch } = useQuery<ScheduleNegotiation[]>({
    queryKey: [`/api/bookings/${bookingId}/schedule-negotiations`],
    enabled: !!bookingId
  });

  // Respond to a negotiation
  const respondMutation = useMutation({
    mutationFn: async ({ negotiationId, status, message }: { 
      negotiationId: number; 
      status: string; 
      message?: string 
    }) => {
      const response = await apiRequest('PATCH', `/api/schedule-negotiations/${negotiationId}`, {
        status,
        responseMessage: message,
        bookingId
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: actionType === 'accept' ? 'Schedule Accepted!' : 'Schedule Declined',
        description: actionType === 'accept' 
          ? 'The installation schedule has been confirmed.'
          : 'The schedule proposal has been declined.'
      });
      setShowResponseDialog(false);
      setResponseMessage('');
      setSelectedNegotiation(null);
      refetch();
      queryClient.invalidateQueries({ queryKey: [`/api/bookings/${bookingId}`] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to respond to schedule proposal.',
        variant: 'destructive'
      });
    }
  });

  // Delete negotiation mutation
  const deleteNegotiationMutation = useMutation({
    mutationFn: async (negotiationId: number) => {
      return apiRequest('DELETE', `/api/schedule-negotiations/${negotiationId}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Message deleted",
        description: "The schedule message has been deleted successfully."
      });
      refetch();
      queryClient.invalidateQueries({ queryKey: [`/api/bookings/${bookingId}`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to delete message. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleDeleteNegotiation = (negotiationId: number) => {
    if (window.confirm("Are you sure you want to delete this message? This action cannot be undone.")) {
      deleteNegotiationMutation.mutate(negotiationId);
    }
  };

  const handleRespond = (negotiation: ScheduleNegotiation, action: 'accept' | 'reject') => {
    setSelectedNegotiation(negotiation);
    setActionType(action);
    setShowResponseDialog(true);
  };

  const submitResponse = () => {
    if (!selectedNegotiation) return;
    
    respondMutation.mutate({
      negotiationId: selectedNegotiation.id,
      status: actionType,
      message: responseMessage.trim() || undefined
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('en-IE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeSlotDisplay = (negotiation: ScheduleNegotiation) => {
    if (negotiation.proposedStartTime && negotiation.proposedEndTime) {
      return `${negotiation.proposedStartTime} - ${negotiation.proposedEndTime}`;
    }
    // Try to find a matching time slot in constants, fallback to raw value
    const timeSlot = TIME_SLOTS.find(slot => slot.value === negotiation.proposedTimeSlot);
    return timeSlot ? timeSlot.label : negotiation.proposedTimeSlot;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'counter_proposed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'accepted': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const canRespond = (negotiation: ScheduleNegotiation) => {
    if (negotiation.status !== 'pending') return false;
    
    // Customers can respond to installer proposals, installers can respond to customer proposals
    return (userType === 'customer' && negotiation.proposedBy === 'installer') ||
           (userType === 'installer' && negotiation.proposedBy === 'customer');
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div 
            className="flex items-center justify-between cursor-pointer hover:bg-gray-50 -mx-6 px-6 py-2 rounded-lg transition-colors"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5" />
              <span>Schedule Communication</span>
            </CardTitle>
            <ChevronDown className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
        </CardHeader>
        {isExpanded && (
          <CardContent className="p-6">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </CardContent>
        )}
      </Card>
    );
  }

  if (negotiations.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div 
            className="flex items-center justify-between cursor-pointer hover:bg-gray-50 -mx-6 px-6 py-2 rounded-lg transition-colors"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5" />
              <span>Schedule Communication</span>
            </CardTitle>
            <ChevronDown className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
        </CardHeader>
        {isExpanded && (
          <CardContent>
            <p className="text-muted-foreground text-center py-8">
              No schedule proposals yet. The installer will contact you to arrange a convenient time.
            </p>
          </CardContent>
        )}
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div 
          className="flex items-center justify-between cursor-pointer hover:bg-gray-50 -mx-6 px-6 py-2 rounded-lg transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5" />
            <span>Schedule Communication</span>
          </CardTitle>
          <ChevronDown className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent>
        <div className="space-y-4">
          {(() => {
            // Group negotiations by installer and sort by date (newest first)
            // Data is already sorted by created_at DESC from the API
            const sortedNegotiations = [...negotiations];
            
            const groupedByInstaller = sortedNegotiations.reduce((acc, negotiation) => {
              const installerKey = negotiation.proposedBy === 'installer' ? 
                ((negotiation as any).installer?.businessName || (negotiation as any).installer?.contactName || installerName)
                : 'You';
              
              if (!acc[installerKey]) {
                acc[installerKey] = [];
              }
              acc[installerKey].push(negotiation);
              return acc;
            }, {} as Record<string, ScheduleNegotiation[]>);

            const totalCount = negotiations.length;

            return (
              <>
                {/* Summary bar */}
                <div className="flex items-center justify-between text-sm text-muted-foreground bg-gray-50 rounded-lg p-3">
                  <span>{totalCount} proposal{totalCount !== 1 ? 's' : ''} from {Object.keys(groupedByInstaller).length} installer{Object.keys(groupedByInstaller).length !== 1 ? 's' : ''}</span>
                  {totalCount > 2 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAll(!showAll)}
                      className="h-6 px-2 text-xs"
                    >
                      {showAll ? 'Show Less' : `Show All ${totalCount}`}
                    </Button>
                  )}
                </div>

                {/* Scrollable proposals container */}
                <div className={`space-y-3 ${showAll ? 'max-h-96 overflow-y-auto' : ''}`}>
                  {Object.entries(groupedByInstaller).map(([installerName, installerNegotiations]) => {
                    const displayNegotiations = showAll ? installerNegotiations : installerNegotiations.slice(0, 2);
                    
                    return (
                      <div key={installerName} className="border rounded-lg overflow-hidden">
                        {/* Installer header */}
                        <div className="bg-gray-50 px-3 py-2 border-b">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {installerName === 'You' ? (
                                <Users className="w-4 h-4 text-green-600" />
                              ) : (
                                <User className="w-4 h-4 text-blue-600" />
                              )}
                              <span className="font-medium text-sm">{installerName}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {installerNegotiations.length} proposal{installerNegotiations.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>

                        {/* Proposals for this installer */}
                        <div className="p-3 space-y-3">
                          {displayNegotiations.map((negotiation, index) => (
                            <div key={negotiation.id} className={`
                              bg-white border border-gray-200 rounded-lg p-3 shadow-sm
                              ${index > 0 ? 'mt-3' : ''}
                            `}>
                              <div className="flex items-start justify-between mb-3">
                                <Badge className={`${getStatusColor(negotiation.status)} text-xs`}>
                                  {getStatusIcon(negotiation.status)}
                                  <span className="ml-1 capitalize">{negotiation.status.replace('_', ' ')}</span>
                                </Badge>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">
                                    {formatTime(negotiation.proposedAt)}
                                  </span>
                                  {(() => {
                                    // Since negotiations are already sorted by created_at DESC from API,
                                    // the first negotiation (index 0) is the most recent
                                    const isLatestMessage = negotiations[0]?.id === negotiation.id;
                                    
                                    return !isLatestMessage && (
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
                                    );
                                  })()}
                                </div>
                              </div>

                              <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                                <div className="flex items-center space-x-2">
                                  <Calendar className="w-4 h-4 text-blue-600" />
                                  <span className="font-medium">{formatDate(negotiation.proposedDate)}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Clock className="w-4 h-4 text-blue-600" />
                                  <span>{getTimeSlotDisplay(negotiation)}</span>
                                </div>
                              </div>

                              {negotiation.proposalMessage && (
                                <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mt-3">
                                  <p className="text-sm text-blue-800">{negotiation.proposalMessage}</p>
                                </div>
                              )}

                              {negotiation.responseMessage && (
                                <div className="bg-green-50 border-l-4 border-green-400 p-3 mt-3">
                                  <p className="text-sm text-green-800">
                                    <strong>Response:</strong> {negotiation.responseMessage}
                                  </p>
                                </div>
                              )}

                              {canRespond(negotiation) && (
                                <div className="flex space-x-2 pt-3 border-t border-gray-100 mt-3">
                                  <Button
                                    size="sm"
                                    onClick={() => handleRespond(negotiation, 'accept')}
                                    className="bg-green-600 hover:bg-green-700 h-8 text-xs flex-1"
                                  >
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Accept
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleRespond(negotiation, 'reject')}
                                    className="border-red-200 text-red-600 hover:bg-red-50 h-8 text-xs flex-1"
                                  >
                                    <XCircle className="w-3 h-3 mr-1" />
                                    Decline
                                  </Button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            );
          })()}
        </div>

        {/* Response Dialog */}
        <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionType === 'accept' ? 'Accept Schedule' : 'Decline Schedule'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {selectedNegotiation && (
                <Alert>
                  <Calendar className="w-4 h-4" />
                  <AlertDescription>
                    <strong>{formatDate(selectedNegotiation.proposedDate)}</strong> at{' '}
                    <strong>{getTimeSlotDisplay(selectedNegotiation)}</strong>
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {actionType === 'accept' ? 'Confirmation message (optional)' : 'Reason for declining (optional)'}
                </label>
                <Textarea
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  placeholder={
                    actionType === 'accept' 
                      ? 'Let them know you\'re looking forward to the installation...'
                      : 'Let them know why this time doesn\'t work...'
                  }
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowResponseDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={submitResponse}
                  disabled={respondMutation.isPending}
                  className={actionType === 'accept' ? 'bg-green-600 hover:bg-green-700' : ''}
                >
                  {respondMutation.isPending ? 'Sending...' : 
                   actionType === 'accept' ? 'Accept Schedule' : 'Decline Schedule'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        </CardContent>
      )}
    </Card>
  );
}