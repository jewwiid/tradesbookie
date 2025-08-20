import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, Clock, MessageSquare, Send, CalendarDays } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { TIME_SLOTS } from '@/lib/constants';

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

  // Check if installer has a pending proposal
  const hasPendingProposal = Array.isArray(negotiations) && negotiations.some((negotiation: any) => 
    negotiation.proposedBy === 'installer' && 
    negotiation.status === 'pending' &&
    negotiation.installerId === installerId
  );

  // Check if there's already an accepted schedule (for re-scheduling)
  const hasAcceptedSchedule = Array.isArray(negotiations) && negotiations.some((negotiation: any) => 
    negotiation.status === 'accepted' || negotiation.status === 'accept'
  );


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
                 (isReschedule || hasAcceptedSchedule) ? "Propose a new schedule to reschedule the installation" : "Propose an installation schedule"}
        >
          <CalendarDays className="w-4 h-4 mr-2" />
          {hasPendingProposal ? 'Proposal Pending' : 
           (isReschedule || hasAcceptedSchedule) ? 'Request Reschedule' : 'Propose Schedule'}
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
          {/* Customer Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="font-medium text-blue-900 mb-1">{customerName}</h4>
            {customerAddress && (
              <p className="text-sm text-blue-700">{customerAddress}</p>
            )}
          </div>

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
            />
          </div>

          {/* Time Slot Selection */}
          <div className="space-y-2">
            <Label htmlFor="time-slot">Time Slot *</Label>
            <Select value={proposedTimeSlot} onValueChange={setProposedTimeSlot} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a time slot" />
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map((slot) => (
                  <SelectItem key={slot.value} value={slot.value}>
                    {slot.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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