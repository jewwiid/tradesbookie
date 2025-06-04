import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface BookingStepProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  canGoNext: boolean;
  canGoBack: boolean;
  onNext: () => void;
  onBack: () => void;
  nextLabel?: string;
  className?: string;
}

export default function BookingStep({
  title,
  description,
  icon,
  children,
  canGoNext,
  canGoBack,
  onNext,
  onBack,
  nextLabel = "Continue",
  className
}: BookingStepProps) {
  return (
    <Card className={`max-w-2xl w-full mx-auto shadow-xl ${className}`}>
      <CardContent className="p-8 lg:p-12">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-6 text-white">
            {icon}
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{title}</h2>
          <p className="text-lg text-gray-600">{description}</p>
        </div>

        <div className="mb-8">
          {children}
        </div>

        <div className="flex justify-between">
          {canGoBack ? (
            <Button 
              variant="ghost" 
              onClick={onBack}
              className="flex items-center text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          ) : (
            <div />
          )}
          
          <Button 
            onClick={onNext}
            disabled={!canGoNext}
            className="bg-gradient-to-r from-primary to-secondary text-white px-8 py-3 font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50"
          >
            {nextLabel}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
