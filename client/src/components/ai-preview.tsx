import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Eye, EyeOff, Loader2 } from 'lucide-react';

interface AIPreviewProps {
  originalImageUrl?: string;
  previewImageUrl?: string;
  isGenerating?: boolean;
  onGeneratePreview?: () => void;
  className?: string;
}

export default function AIPreview({
  originalImageUrl,
  previewImageUrl,
  isGenerating = false,
  onGeneratePreview,
  className,
}: AIPreviewProps) {
  const [showAfter, setShowAfter] = useState(false);

  if (!originalImageUrl && !previewImageUrl) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          AI Room Preview
        </CardTitle>
        <CardDescription>
          See how your TV will look mounted in your room
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Toggle Controls */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex bg-muted rounded-lg p-1">
            <Button
              variant={!showAfter ? "default" : "ghost"}
              size="sm"
              onClick={() => setShowAfter(false)}
              className="rounded-md"
            >
              <Eye className="w-4 h-4 mr-2" />
              Before
            </Button>
            <Button
              variant={showAfter ? "default" : "ghost"}
              size="sm"
              onClick={() => setShowAfter(true)}
              className="rounded-md"
              disabled={!previewImageUrl && !isGenerating}
            >
              <EyeOff className="w-4 h-4 mr-2" />
              After
            </Button>
          </div>

          {!previewImageUrl && !isGenerating && onGeneratePreview && (
            <Button
              onClick={onGeneratePreview}
              size="sm"
              className="gradient-primary text-white"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Preview
            </Button>
          )}
        </div>

        {/* Image Display */}
        <div className="relative rounded-lg overflow-hidden">
          {!showAfter ? (
            // Before Image
            originalImageUrl && (
              <div className="relative">
                <img
                  src={originalImageUrl}
                  alt="Room before TV installation"
                  className="w-full h-64 object-cover"
                />
                <Badge className="absolute top-4 left-4 bg-gray-900/80 text-white">
                  Original Room
                </Badge>
              </div>
            )
          ) : (
            // After Image or Loading State
            <div className="relative h-64 bg-gray-100 flex items-center justify-center">
              {isGenerating ? (
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    AI is generating your preview...
                  </p>
                </div>
              ) : previewImageUrl ? (
                <>
                  <img
                    src={previewImageUrl}
                    alt="Room with mounted TV preview"
                    className="w-full h-full object-cover"
                  />
                  <Badge className="absolute top-4 right-4 bg-primary/90 text-white">
                    <Sparkles className="w-3 h-3 mr-1" />
                    AI Generated
                  </Badge>
                </>
              ) : (
                <div className="text-center">
                  <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">
                    AI preview not generated yet
                  </p>
                  {onGeneratePreview && (
                    <Button
                      onClick={onGeneratePreview}
                      size="sm"
                      className="gradient-primary text-white"
                    >
                      Generate Preview
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Preview Info */}
        {previewImageUrl && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              ✨ This AI-generated preview shows how your TV will look once professionally mounted. 
              The actual installation will match this visualization.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
