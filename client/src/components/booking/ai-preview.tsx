import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Loader2, Sparkles } from 'lucide-react';

interface AIPreviewProps {
  originalImage: string;
  aiPreview: string | null;
  tvSize: string;
}

export default function AIPreview({ originalImage, aiPreview, tvSize }: AIPreviewProps) {
  const [activeView, setActiveView] = useState<'before' | 'after'>('before');
  const [hasGenerated, setHasGenerated] = useState(false);

  const generatePreviewMutation = useMutation({
    mutationFn: async () => {
      // Convert base64 to blob for the API
      const base64Data = originalImage.split(',')[1];
      const formData = new FormData();
      
      // Create a file from base64
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/jpeg' });
      
      formData.append('roomPhoto', blob, 'room.jpg');
      formData.append('tvSize', tvSize);
      formData.append('mountType', 'tilting');
      formData.append('wallType', 'drywall');
      
      return api.generateTVPlacement(formData);
    },
    onSuccess: (data) => {
      if (data.success && data.previewImageUrl) {
        setHasGenerated(true);
        setActiveView('after');
      }
    },
  });

  useEffect(() => {
    if (tvSize && originalImage && !hasGenerated && !generatePreviewMutation.isPending) {
      generatePreviewMutation.mutate();
    }
  }, [tvSize, originalImage, hasGenerated, generatePreviewMutation]);

  if (!originalImage) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Sparkles className="h-5 w-5 text-primary mr-2" />
            AI Preview
          </h3>
          <div className="flex bg-white rounded-lg p-1 border">
            <Button
              variant={activeView === 'before' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveView('before')}
            >
              Before
            </Button>
            <Button
              variant={activeView === 'after' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveView('after')}
              disabled={generatePreviewMutation.isPending}
            >
              After
            </Button>
          </div>
        </div>
        
        <div className="relative">
          {activeView === 'before' && (
            <img 
              src={originalImage} 
              alt="Room before TV installation" 
              className="w-full h-64 object-cover rounded-xl"
            />
          )}
          
          {activeView === 'after' && (
            <div className="relative">
              {generatePreviewMutation.isPending ? (
                <div className="w-full h-64 bg-gray-100 rounded-xl flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      Generating AI preview...
                    </p>
                  </div>
                </div>
              ) : generatePreviewMutation.data?.success ? (
                <>
                  <img 
                    src={generatePreviewMutation.data.previewImageUrl || "https://images.unsplash.com/photo-1567016432779-094069958ea5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"}
                    alt="Room with mounted TV preview" 
                    className="w-full h-64 object-cover rounded-xl"
                  />
                  <Badge className="absolute top-4 right-4 bg-success">
                    <Sparkles className="h-3 w-3 mr-1" />
                    AI Generated
                  </Badge>
                </>
              ) : (
                <div className="w-full h-64 bg-gray-100 rounded-xl flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">
                      Unable to generate preview
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => generatePreviewMutation.mutate()}
                    >
                      Try Again
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {generatePreviewMutation.data?.description && (
          <p className="text-sm text-gray-600 mt-3">
            {generatePreviewMutation.data.description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
