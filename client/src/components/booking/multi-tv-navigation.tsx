import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Tv, CheckCircle2, Circle } from "lucide-react";
import { BookingData, TVInstallation } from "@/lib/booking-utils";

interface MultiTVNavigationProps {
  bookingData: BookingData;
  updateBookingData: (data: Partial<BookingData>) => void;
  currentStep: number;
}

export default function MultiTVNavigation({ 
  bookingData, 
  updateBookingData, 
  currentStep 
}: MultiTVNavigationProps) {
  if (bookingData.tvQuantity <= 1) return null;

  const handleTvSwitch = (index: number) => {
    updateBookingData({ currentTvIndex: index });
  };

  const isCurrentTvComplete = (tv: TVInstallation) => {
    return tv.tvSize && tv.serviceType && tv.wallType && tv.mountType;
  };

  const canNavigateToNextTv = () => {
    const currentTv = bookingData.tvInstallations[bookingData.currentTvIndex];
    return currentTv && isCurrentTvComplete(currentTv);
  };

  const navigateToNextTv = () => {
    const nextIndex = Math.min(bookingData.currentTvIndex + 1, bookingData.tvInstallations.length - 1);
    updateBookingData({ currentTvIndex: nextIndex });
  };

  const navigateToPrevTv = () => {
    const prevIndex = Math.max(0, bookingData.currentTvIndex - 1);
    updateBookingData({ currentTvIndex: prevIndex });
  };

  // Only show navigation during TV configuration steps (2-6)
  if (currentStep < 2 || currentStep > 6) return null;

  return (
    <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
            <Tv className="w-4 h-4" />
            Configure TV {bookingData.currentTvIndex + 1} of {bookingData.tvQuantity}
          </h3>
          <Badge variant="outline" className="bg-white">
            {bookingData.tvInstallations.filter(isCurrentTvComplete).length} of {bookingData.tvQuantity} complete
          </Badge>
        </div>

        {/* TV Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mb-4">
          {bookingData.tvInstallations.map((tv, index) => (
            <Button
              key={tv.id}
              variant={index === bookingData.currentTvIndex ? "default" : "outline"}
              size="sm"
              onClick={() => handleTvSwitch(index)}
              className="h-auto p-3 justify-start"
            >
              <div className="flex items-center gap-2 w-full">
                <div className="flex-shrink-0">
                  {isCurrentTvComplete(tv) ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <Circle className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium">{tv.location || `TV ${index + 1}`}</div>
                  <div className="text-xs text-muted-foreground">
                    {tv.tvSize ? `${tv.tvSize}" TV` : "Not configured"}
                  </div>
                </div>
              </div>
            </Button>
          ))}
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={navigateToPrevTv}
            disabled={bookingData.currentTvIndex === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous TV
          </Button>
          
          <div className="text-sm text-muted-foreground">
            {bookingData.tvInstallations[bookingData.currentTvIndex]?.location || `TV ${bookingData.currentTvIndex + 1}`}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={navigateToNextTv}
            disabled={bookingData.currentTvIndex === bookingData.tvInstallations.length - 1}
          >
            Next TV
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {/* Progress Indicator */}
        <div className="mt-4 flex justify-center">
          <div className="flex gap-2">
            {bookingData.tvInstallations.map((tv, index) => (
              <div
                key={tv.id}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === bookingData.currentTvIndex
                    ? 'bg-primary'
                    : isCurrentTvComplete(tv)
                    ? 'bg-green-500'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}