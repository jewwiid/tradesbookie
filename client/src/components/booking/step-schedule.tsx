import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, Info } from 'lucide-react';
import { useBooking } from '@/lib/booking-context';
import { TIME_SLOTS } from '@/lib/constants';

interface StepScheduleProps {
  onNext: () => void;
  onBack: () => void;
}

export function StepSchedule({ onNext, onBack }: StepScheduleProps) {
  const { state, dispatch } = useBooking();
  const [selectedDate, setSelectedDate] = useState(state.scheduledDate || '');
  const [selectedTime, setSelectedTime] = useState(state.timeSlot || '');

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    if (date && selectedTime) {
      dispatch({ 
        type: 'SET_SCHEDULE', 
        scheduledDate: date, 
        timeSlot: selectedTime 
      });
    }
  };

  const handleTimeChange = (time: string) => {
    setSelectedTime(time);
    if (selectedDate && time) {
      dispatch({ 
        type: 'SET_SCHEDULE', 
        scheduledDate: selectedDate, 
        timeSlot: time 
      });
    }
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const canContinue = selectedDate && selectedTime;

  return (
    <Card className="max-w-2xl mx-auto">
      <CardContent className="p-8 lg:p-12">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Calendar className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Schedule Your Installation</h2>
          <p className="text-lg text-gray-600">Choose your preferred date and time</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div>
            <Label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
              Preferred Date
            </Label>
            <Input
              id="date"
              type="date"
              value={selectedDate}
              min={getMinDate()}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full"
            />
          </div>
          
          <div>
            <Label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-2">
              Preferred Time
            </Label>
            <Select value={selectedTime} onValueChange={handleTimeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select time" />
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

        <div className="bg-blue-50 rounded-2xl p-6 mb-8">
          <div className="flex items-start">
            <Info className="w-5 h-5 text-blue-500 mr-3 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Installation Notes</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Installation typically takes 1-2 hours</li>
                <li>• Please ensure someone is home during the scheduled time</li>
                <li>• We'll call 30 minutes before arrival</li>
                <li>• Free rescheduling available up to 24 hours before</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex justify-between">
          <Button variant="ghost" onClick={onBack}>
            ← Back
          </Button>
          <Button 
            onClick={onNext} 
            disabled={!canContinue}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
          >
            Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
