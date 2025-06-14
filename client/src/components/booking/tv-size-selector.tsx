import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tv } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AIPreview from "@/components/ai-preview";
import { BookingData } from "@/lib/booking-utils";

interface TVSizeSelectorProps {
  bookingData: BookingData;
  updateBookingData: (data: Partial<BookingData>) => void;
}

const TV_SIZES = [
  { size: "32", label: "32\"", category: "Small" },
  { size: "43", label: "43\"", category: "Medium" },
  { size: "55", label: "55\"", category: "Large" },
  { size: "65", label: "65\"", category: "X-Large" },
  { size: "75", label: "75\"", category: "XX-Large" },
  { size: "85", label: "85\"", category: "Premium" }
];

export default function TVSizeSelector({ bookingData, updateBookingData }: TVSizeSelectorProps) {
  const [selectedSize, setSelectedSize] = useState(bookingData.tvSize);
  const { toast } = useToast();

  const aiPreviewMutation = useMutation({
    mutationFn: async ({ imageBase64, tvSize, mountType }: { imageBase64: string, tvSize: string, mountType?: string }) => {
      const response = await apiRequest('POST', '/api/generate-ai-preview', {
        imageBase64,
        tvSize,
        mountType: mountType || 'fixed'
      });
      return response.json();
    },
    onSuccess: (data) => {
      updateBookingData({ aiPreviewUrl: data.imageUrl });
      toast({
        title: "AI Preview Generated!",
        description: "See how your TV will look on the wall."
      });
    },
    onError: (error) => {
      toast({
        title: "Preview Generation Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleSizeSelect = (size: string) => {
    setSelectedSize(size);
    updateBookingData({ tvSize: size });

    // Generate AI preview if room photo is available
    if (bookingData.roomPhotoBase64) {
      aiPreviewMutation.mutate({
        imageBase64: bookingData.roomPhotoBase64,
        tvSize: size,
        mountType: bookingData.mountType || 'fixed'
      });
    }
  };

  return (
    <div className="text-center">
      <div className="step-indicator">
        <Tv className="w-8 h-8 text-white" />
      </div>
      
      <h2 className="text-3xl font-bold text-foreground mb-4">What's Your TV Size?</h2>
      <p className="text-lg text-muted-foreground mb-8">
        Select your TV size to see the accurate preview
      </p>

      {/* AI Preview Section */}
      {bookingData.roomPhotoBase64 && (
        <div className="mb-8">
          <AIPreview
            beforeImage={bookingData.roomPhotoBase64}
            afterImage={bookingData.aiPreviewUrl}
            isLoading={aiPreviewMutation.isPending}
          />
        </div>
      )}

      {/* TV Size Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {TV_SIZES.map((tv) => (
          <Card
            key={tv.size}
            className={`service-tile cursor-pointer ${
              selectedSize === tv.size ? 'selected' : ''
            }`}
            onClick={() => handleSizeSelect(tv.size)}
          >
            <CardContent className="p-6 text-center">
              <Tv className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <div className="text-lg font-semibold text-foreground">{tv.label}</div>
              <div className="text-sm text-muted-foreground">{tv.category}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
