import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles } from "lucide-react";

interface AIPreviewProps {
  beforeImage?: string;
  afterImage?: string;
  isLoading?: boolean;
}

export default function AIPreview({ beforeImage, afterImage, isLoading }: AIPreviewProps) {
  const [showAfter, setShowAfter] = useState(false);

  if (!beforeImage && !isLoading) {
    return null;
  }

  return (
    <Card className="bg-muted/50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <Sparkles className="w-5 h-5 mr-2 text-primary" />
            AI Preview
          </span>
          {(beforeImage || afterImage) && !isLoading && (
            <div className="flex bg-white rounded-lg p-1">
              <Button
                variant={!showAfter ? "default" : "ghost"}
                size="sm"
                onClick={() => setShowAfter(false)}
                className="text-xs"
              >
                Before
              </Button>
              <Button
                variant={showAfter ? "default" : "ghost"}
                size="sm"
                onClick={() => setShowAfter(true)}
                className="text-xs"
                disabled={!afterImage}
              >
                After
              </Button>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {isLoading ? (
            <div className="w-full h-64 bg-muted rounded-xl flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Generating AI preview...</p>
              </div>
            </div>
          ) : (
            <>
              {!showAfter && beforeImage && (
                <img
                  src={`data:image/jpeg;base64,${beforeImage}`}
                  alt="Room before TV installation"
                  className="w-full h-64 object-cover rounded-xl"
                />
              )}
              {showAfter && afterImage && (
                <div className="relative">
                  <img
                    src={afterImage}
                    alt="Room with mounted TV preview"
                    className="w-full h-64 object-cover rounded-xl"
                  />
                  <div className="absolute top-4 right-4 bg-success text-white text-xs px-2 py-1 rounded-full flex items-center">
                    <Sparkles className="w-3 h-3 mr-1" />
                    AI Generated
                  </div>
                </div>
              )}
              {!afterImage && !isLoading && (
                <div className="w-full h-64 bg-muted rounded-xl flex items-center justify-center">
                  <p className="text-muted-foreground">AI preview will appear here</p>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
