import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Calendar, Info } from 'lucide-react';
import { useBookingStore } from '@/lib/booking-store';
import { TIME_SLOTS } from '@/lib/constants';

interface ScheduleProps {
  onNext: () => void;
  onBack: () => void;
}

export default function Schedule({ onNext, onBack }: ScheduleProps) {
  const { data, updateData } = useBookingStore();

  const handleDateChange = (date: string) => {
    updateData({ date });
  };

  const handleTimeChange = (time: string) => {
    updateData({ time });
  };

  // Get tomorrow's date as minimum
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const isFormValid = data.date && data.time;

  return (
    <Card className="typeform-card">
      <CardContent>
        <div className="text-center mb-8">
          <div className="w-20 h-20 typeform-gradient rounded-full flex items-center justify-center mx-auto mb-6">
            <Calendar className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Schedule Your Installation</h2>
          <p className="text-lg text-gray-600">Choose your preferred date and time</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div>
            <Label htmlFor="preferredDate" className="text-sm font-medium text-gray-700 mb-2">
              Preferred Date
            </Label>
            <Input
              id="preferredDate"
              type="date"
              min={minDate}
              value={data.date || ''}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <Label htmlFor="preferredTime" className="text-sm font-medium text-gray-700 mb-2">
              Preferred Time
            </Label>
            <Select value={data.time || ''} onValueChange={handleTimeChange}>
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

        <Card className="bg-blue-50 border-blue-200 mb-8">
          <CardContent className="p-6">
            <div className="flex items-start">
              <Info className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Installation Notes</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Installation typically takes 1-2 hours</li>
                  <li>• Please ensure someone is home during the scheduled time</li>
                  <li>• We'll call 30 minutes before arrival</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button variant="ghost" onClick={onBack} className="flex items-center">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button 
            onClick={onNext} 
            disabled={!isFormValid}
            className="btn-primary"
          >
            Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
