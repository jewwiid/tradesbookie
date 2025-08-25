import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, Clock, MessageSquare, Send, CalendarDays, Heart, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { TIME_SLOTS } from '@/lib/constants';

interface BookingDetails {
  id: number;
  customerName?: string;
  address?: string;
  preferredDate?: string;
  preferredTime?: string;
  status?: string;
}

interface ScheduleProposalFormProps {
  bookingId: number;
  installerId: number;
  customerName?: string;
  customerAddress?: string;
  onProposalSent?: () => void;
  isReschedule?: boolean;
}

export default function ScheduleProposalForm({
  bookingId,
  installerId,
  customerName = 'Customer',
  customerAddress,
  onProposalSent,
  isReschedule = false
}: ScheduleProposalFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [proposedDate, setProposedDate] = useState('');
  const [proposedTimeSlot, setProposedTimeSlot] = useState('');
  const [proposedStartTime, setProposedStartTime] = useState('');
  const [proposedEndTime, setProposedEndTime] = useState('');
  const [proposalMessage, setProposalMessage] = useState('');
  const { toast } = useToast();

  // Fetch booking details to get customer preferences
  const { data: bookingDetails } = useQuery<BookingDetails>({
    queryKey: [`/api/bookings/${bookingId}`],
    queryFn: async () => {
      const response = await fetch(`/api/bookings/${bookingId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    }
  });

  // Check for existing pending proposals from this installer
  const { data: negotiations = [], isLoading, error } = useQuery<any[]>({
    queryKey: ['/api/bookings', bookingId, 'schedule-negotiations'],
    queryFn: async () => {
      const response = await fetch(`/api/bookings/${bookingId}/schedule-negotiations`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    refetchInterval: isOpen ? false : 30000 // Only refresh when dialog is closed, and less frequently
  });

  // Check if THIS SPECIFIC installer has a pending proposal (allow multiple installers to send proposals)
  const hasPendingProposal = Array.isArray(negotiations) && negotiations.some((negotiation: any) => 
    negotiation.proposedBy === 'installer' && 
    negotiation.status === 'pending' &&
    negotiation.installerId === installerId
  );

  // Check if there's already an accepted schedule (for re-scheduling)
  const hasAcceptedSchedule = Array.isArray(negotiations) && negotiations.some((negotiation: any) => 
    negotiation.status === 'accepted' || negotiation.status === 'accept'
  );

  // Check if there are other pending installer proposals (for display purposes)
  const otherPendingProposals = Array.isArray(negotiations) ? negotiations.filter((negotiation: any) => 
    negotiation.proposedBy === 'installer' && 
    negotiation.status === 'pending' &&
    negotiation.installerId !== installerId
  ) : [];


  // Send schedule proposal
  const proposalMutation = useMutation({
    mutationFn: async (proposalData: any) => {
      const response = await apiRequest('POST', '/api/schedule-negotiations', proposalData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Schedule Proposal Sent!',
        description: `Your installation schedule proposal has been sent to ${customerName}.`
      });
      // Reset form first, then close dialog
      resetForm();
      setIsOpen(false);
      if (onProposalSent) {
        onProposalSent();
      }
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/bookings', bookingId, 'schedule-negotiations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/installer', installerId, 'schedule-negotiations'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to send schedule proposal. Please try again.',
        variant: 'destructive'
      });
    }
  });

  const resetForm = () => {
    setProposedDate('');
    setProposedTimeSlot('');
    setProposedStartTime('');
    setProposedEndTime('');
    setProposalMessage('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!proposedDate || !proposedTimeSlot) {
      toast({
        title: 'Missing Information',
        description: 'Please select a date and time slot.',
        variant: 'destructive'
      });
      return;
    }

    const proposalData = {
      bookingId,
      installerId,
      proposedDate: new Date(proposedDate).toISOString(),
      proposedTimeSlot,
      proposedStartTime: proposedStartTime || undefined,
      proposedEndTime: proposedEndTime || undefined,
      proposedBy: 'installer',
      proposalMessage: proposalMessage.trim() || undefined
    };

    proposalMutation.mutate(proposalData);
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  // Use specific time slots with optional custom time range
  const timeSlots = [
    ...TIME_SLOTS, // Import specific time slots from constants
    { value: 'specific-time', label: 'Custom Time Range' }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          size="sm" 
          className="bg-blue-600 hover:bg-blue-700"
          disabled={hasPendingProposal}
          title={hasPendingProposal ? "Waiting for customer response to your proposal" : 
                 (isReschedule || hasAcceptedSchedule) ? "Propose a new schedule to reschedule the installation" : 
                 otherPendingProposals.length > 0 ? `Send your proposal to compete with ${otherPendingProposals.length} other installer proposal${otherPendingProposals.length > 1 ? 's' : ''}` :
                 "Propose an installation schedule"}
        >
          <CalendarDays className="w-4 h-4 mr-2" />
          {hasPendingProposal ? 'Proposal Pending' : 
           (isReschedule || hasAcceptedSchedule) ? 'Request Reschedule' : 
           otherPendingProposals.length > 0 ? `Propose Schedule (${otherPendingProposals.length + 1} competing)` :
           'Propose Schedule'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>{(isReschedule || hasAcceptedSchedule) ? 'Request Reschedule' : 'Propose Installation Schedule'}</span>
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Competing Proposals Notice */}
          {otherPendingProposals.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                <p className="text-sm font-medium text-amber-800">
                  {otherPendingProposals.length} other installer{otherPendingProposals.length > 1 ? 's have' : ' has'} already sent proposals
                </p>
              </div>
              <p className="text-xs text-amber-700 mt-1">
                Customer will choose between all proposals - make yours competitive!
              </p>
            </div>
          )}

          {/* Customer Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="font-medium text-blue-900 mb-1">{customerName}</h4>
            {customerAddress && (
              <p className="text-sm text-blue-700">{customerAddress}</p>
            )}
          </div>

          {/* Customer Preferred Schedule - Prominent Display */}
          {bookingDetails?.preferredDate && (
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Heart className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-semibold text-green-900 mb-2">Customer's Preferred Schedule</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-green-800">
                        {new Date(bookingDetails.preferredDate).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long', 
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    {bookingDetails.preferredTime && (
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-green-800">
                          {(() => {
                            const slot = TIME_SLOTS.find(s => s.value === bookingDetails.preferredTime);
                            return slot ? slot.label : bookingDetails.preferredTime;
                          })()} 
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="mt-2 p-2 bg-green-100 rounded">
                    <p className="text-xs text-green-700">
                      💡 <strong>Tip:</strong> Matching the customer's preferred schedule increases your chances of getting selected!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* No Preferred Schedule Notice */}
          {!bookingDetails?.preferredDate && bookingDetails && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <p className="text-sm text-amber-800">
                  Customer didn't specify a preferred schedule - propose your best available time!
                </p>
              </div>
            </div>
          )}

          {/* Date Selection */}
          <div className="space-y-2">
            <Label htmlFor="proposed-date">Installation Date *</Label>
            <Input
              id="proposed-date"
              type="date"
              value={proposedDate}
              onChange={(e) => setProposedDate(e.target.value)}
              min={getMinDate()}
              required
              className={bookingDetails?.preferredDate && proposedDate === bookingDetails.preferredDate.split('T')[0] ? 
                'border-green-500 bg-green-50' : ''}
            />
            {bookingDetails?.preferredDate && proposedDate === bookingDetails.preferredDate.split('T')[0] && (
              <p className="text-xs text-green-600 flex items-center space-x-1">
                <Heart className="w-3 h-3" />
                <span>Matches customer's preferred date! 🎯</span>
              </p>
            )}
          </div>

          {/* Time Slot Selection */}
          <div className="space-y-2">
            <Label htmlFor="time-slot">Time Slot *</Label>
            <Select value={proposedTimeSlot} onValueChange={setProposedTimeSlot} required>
              <SelectTrigger className={bookingDetails?.preferredTime && proposedTimeSlot === bookingDetails.preferredTime ? 
                'border-green-500 bg-green-50' : ''}>
                <SelectValue placeholder="Select a time slot" />
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map((slot) => (
                  <SelectItem 
                    key={slot.value} 
                    value={slot.value}
                    className={bookingDetails?.preferredTime === slot.value ? 
                      'bg-green-100 border-l-4 border-green-500' : ''}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>{slot.label}</span>
                      {bookingDetails?.preferredTime === slot.value && (
                        <div className="flex items-center space-x-1 ml-2">
                          <Heart className="w-3 h-3 text-green-600" />
                          <span className="text-xs text-green-600 font-medium">Preferred</span>
                        </div>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {bookingDetails?.preferredTime && proposedTimeSlot === bookingDetails.preferredTime && (
              <p className="text-xs text-green-600 flex items-center space-x-1">
                <Heart className="w-3 h-3" />
                <span>Perfect match with customer's preferred time! ⭐</span>
              </p>
            )}
          </div>

          {/* Specific Time Inputs */}
          {proposedTimeSlot === 'specific-time' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-time">Start Time</Label>
                <Input
                  id="start-time"
                  type="time"
                  value={proposedStartTime}
                  onChange={(e) => setProposedStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-time">End Time</Label>
                <Input
                  id="end-time"
                  type="time"
                  value={proposedEndTime}
                  onChange={(e) => setProposedEndTime(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="proposal-message">Message {isReschedule ? '(Recommended)' : '(Optional)'}</Label>
            <Textarea
              id="proposal-message"
              value={proposalMessage}
              onChange={(e) => setProposalMessage(e.target.value)}
              placeholder={isReschedule 
                ? "Please explain why you need to reschedule the confirmed installation..." 
                : "Add any notes about the proposed schedule, preparation requirements, or special instructions..."}
              rows={3}
            />
          </div>

          {/* Reschedule Warning */}
          {isReschedule && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>⚠️ Reschedule Request:</strong> This will notify the customer that you need to change the confirmed schedule. 
                Please provide a clear explanation for why rescheduling is necessary.
              </p>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={proposalMutation.isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {proposalMutation.isPending ? (
                'Sending...'
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  {isReschedule ? 'Send Reschedule Request' : 'Send Proposal'}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}