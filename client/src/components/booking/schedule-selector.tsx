import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Info } from "lucide-react";
import { BookingData } from "@/lib/booking-utils";

interface ScheduleSelectorProps {
  bookingData: BookingData;
  updateBookingData: (data: Partial<BookingData>) => void;
}

const TIME_SLOTS = [
  { value: "09:00", label: "9:00 AM - 11:00 AM" },
  { value: "11:00", label: "11:00 AM - 1:00 PM" },
  { value: "13:00", label: "1:00 PM - 3:00 PM" },
  { value: "15:00", label: "3:00 PM - 5:00 PM" },
  { value: "17:00", label: "5:00 PM - 7:00 PM" }
];

export default function ScheduleSelector({ bookingData, updateBookingData }: ScheduleSelectorProps) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const handleDateChange = (date: string) => {
    updateBookingData({ preferredDate: date });
  };

  const handleTimeChange = (time: string) => {
    updateBookingData({ preferredTime: time });
  };

  return (
    <div className="text-center">
      <div className="step-indicator">
        <Calendar className="w-8 h-8 text-white" />
      </div>
      
      <h2 className="text-3xl font-bold text-foreground mb-4">Schedule Your Installation</h2>
      <p className="text-lg text-muted-foreground mb-8">
        Choose your preferred date and time
      </p>

      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <div>
          <Label htmlFor="date" className="block text-sm font-medium text-foreground mb-2">
            Preferred Date
          </Label>
          <Input
            id="date"
            type="date"
            min={minDate}
            value={bookingData.preferredDate || ''}
            onChange={(e) => handleDateChange(e.target.value)}
            className="w-full"
          />
        </div>
        <div>
          <Label htmlFor="time" className="block text-sm font-medium text-foreground mb-2">
            Preferred Time
          </Label>
          <Select value={bookingData.preferredTime || ''} onValueChange={handleTimeChange}>
            <SelectTrigger className="w-full">
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

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start">
            <Info className="w-5 h-5 text-primary mr-3 mt-1 flex-shrink-0" />
            <div className="text-left">
              <h3 className="font-semibold text-foreground mb-2">Installation Notes</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Installation typically takes 1-2 hours</li>
                <li>• Please ensure someone is home during the scheduled time</li>
                <li>• We'll call 30 minutes before arrival</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
