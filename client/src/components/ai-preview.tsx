import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles } from "lucide-react";
import beforeImage from "@assets/1_1754160490051.png";
import afterImage from "@assets/2_1754160490051.png";

interface AIPreviewProps {
  beforeImage?: string;
  afterImage?: string;
  isLoading?: boolean;
  className?: string;
}

export default function AIPreview({ isLoading, className }: AIPreviewProps) {
  const [showAfter, setShowAfter] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggle = async (newState: boolean) => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setShowAfter(newState);
    
    // Animation duration
    setTimeout(() => {
      setIsAnimating(false);
    }, 500);
  };

  return (
    <Card className={`bg-muted/50 ${className || ''}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <Sparkles className="w-5 h-5 mr-2 text-primary" />
            AI Preview
          </span>
          {!isLoading && (
            <div className="flex bg-white rounded-lg p-1">
              <Button
                variant={!showAfter ? "default" : "ghost"}
                size="sm"
                onClick={() => handleToggle(false)}
                className="text-xs"
                disabled={isAnimating}
              >
                Before
              </Button>
              <Button
                variant={showAfter ? "default" : "ghost"}
                size="sm"
                onClick={() => handleToggle(true)}
                className="text-xs"
                disabled={isAnimating}
              >
                After
              </Button>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative overflow-hidden rounded-xl">
          {isLoading ? (
            <div className="w-full h-64 bg-muted rounded-xl flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Generating AI preview...</p>
              </div>
            </div>
          ) : (
            <div className="relative w-full h-64">
              {/* Before Image */}
              <img
                src={beforeImage}
                alt="Room before TV installation"
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-in-out ${
                  showAfter ? 'opacity-0' : 'opacity-100'
                }`}
              />
              
              {/* After Image */}
              <img
                src={afterImage}
                alt="Room with mounted TV and furniture setup"
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-in-out ${
                  showAfter ? 'opacity-100' : 'opacity-0'
                }`}
              />
              
              {/* AI Generated Badge - appears only in after state */}
              <div 
                className={`absolute top-4 right-4 bg-green-500 text-white text-xs px-3 py-1.5 rounded-full flex items-center transition-all duration-500 ease-in-out ${
                  showAfter ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
                }`}
              >
                <Sparkles className="w-3 h-3 mr-1" />
                AI Preview Active
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
