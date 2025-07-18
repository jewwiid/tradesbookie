import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tv } from "lucide-react";
import { BookingData } from "@/lib/booking-utils";

interface TVSizeSelectorProps {
  bookingData: BookingData;
  updateBookingData: (data: Partial<BookingData>) => void;
  updateTvInstallation?: (index: number, tvData: Partial<any>) => void;
}

const TV_SIZES = [
  { size: "32", label: "32\"", category: "Small" },
  { size: "43", label: "43\"", category: "Medium" },
  { size: "55", label: "55\"", category: "Large" },
  { size: "65", label: "65\"", category: "X-Large" },
  { size: "75", label: "75\"", category: "XX-Large" },
  { size: "85", label: "85\"", category: "Premium" }
];

export default function TVSizeSelector({ bookingData, updateBookingData, updateTvInstallation }: TVSizeSelectorProps) {
  const isMultiTV = bookingData.tvQuantity > 1;
  const currentTv = isMultiTV ? bookingData.tvInstallations[bookingData.currentTvIndex] : null;
  const [selectedSize, setSelectedSize] = useState(
    isMultiTV ? (currentTv?.tvSize || "") : bookingData.tvSize
  );

  const handleSizeSelect = (size: string) => {
    setSelectedSize(size);
    
    if (isMultiTV && updateTvInstallation) {
      // Update specific TV installation
      updateTvInstallation(bookingData.currentTvIndex, { tvSize: size });
    } else {
      // Update legacy single TV booking
      updateBookingData({ tvSize: size });
    }
  };

  return (
    <div className="text-center">
      <div className="step-indicator">
        <Tv className="w-8 h-8 text-white" />
      </div>
      
      <h2 className="text-3xl font-bold text-foreground mb-4">
        {isMultiTV ? `What's the Size of ${currentTv?.location || `TV ${bookingData.currentTvIndex + 1}`}?` : "What's Your TV Size?"}
      </h2>
      <p className="text-lg text-muted-foreground mb-8">
        {isMultiTV ? `Select the size for ${currentTv?.location || `TV ${bookingData.currentTvIndex + 1}`}` : "Select your TV size to see the accurate preview"}
      </p>

      {/* Preview Placeholder - AI generation happens at final step */}
      {bookingData.roomPhotoBase64 && (
        <div className="mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
            <div className="relative">
              <img
                src={`data:image/jpeg;base64,${bookingData.roomPhotoBase64}`}
                alt="Your room"
                className="w-full h-64 object-cover rounded-xl"
              />
              <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-black/70 rounded-lg p-3 text-white text-center">
                  <p className="text-sm">AI preview will be generated at the final booking step</p>
                </div>
              </div>
            </div>
          </div>
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
