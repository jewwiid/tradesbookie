import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { ArrowRight, Sparkles, ShoppingCart, Zap } from 'lucide-react';

interface ProductCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  iconEmoji: string;
  backgroundColor: string;
  textColor: string;
}

interface QuestionStep {
  id: number;
  question: string;
  options: Array<{ value: string; label: string; }>;
  type: 'single' | 'multiple';
}

const TV_QUESTIONS: QuestionStep[] = [
  {
    id: 1,
    question: "What's your budget range?",
    type: 'single',
    options: [
      { value: 'under-500', label: 'Under €500' },
      { value: '500-1000', label: '€500 - €1,000' },
      { value: '1000-2000', label: '€1,000 - €2,000' },
      { value: 'over-2000', label: 'Over €2,000' }
    ]
  },
  {
    id: 2,
    question: "What size TV are you looking for?",
    type: 'single',
    options: [
      { value: '32-43', label: '32" - 43" (Small rooms)' },
      { value: '50-55', label: '50" - 55" (Medium rooms)' },
      { value: '65-75', label: '65" - 75" (Large rooms)' },
      { value: '85+', label: '85"+ (Extra large)' }
    ]
  },
  {
    id: 3,
    question: "What will you primarily use it for?",
    type: 'multiple',
    options: [
      { value: 'streaming', label: 'Netflix, Prime Video, Disney+' },
      { value: 'gaming', label: 'Gaming (PlayStation, Xbox)' },
      { value: 'sports', label: 'Sports & Live TV' },
      { value: 'movies', label: 'Movies & Cinema experience' }
    ]
  },
  {
    id: 4,
    question: "What's your room lighting like?",
    type: 'single',
    options: [
      { value: 'bright', label: 'Bright room with lots of windows' },
      { value: 'medium', label: 'Average lighting' },
      { value: 'dark', label: 'Dark room or dedicated cinema room' }
    ]
  },
  {
    id: 5,
    question: "Any specific features you want?",
    type: 'multiple',
    options: [
      { value: 'smart-tv', label: 'Smart TV features' },
      { value: 'hdr', label: 'HDR (High Dynamic Range)' },
      { value: 'voice-control', label: 'Voice control (Alexa, Google)' },
      { value: 'multiple-hdmi', label: 'Multiple HDMI ports' }
    ]
  }
];

export default function FindProduct() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [flowId, setFlowId] = useState<number | null>(null);
  const [startTime] = useState(Date.now());
  const [isComplete, setIsComplete] = useState(false);

  // Extract category slug and QR code from URL
  const pathMatch = location.match(/^\/find-product\/([^/?]+)/);
  const categorySlug = pathMatch?.[1];
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const qrCodeId = urlParams.get('qr');

  // Track QR code scan on component mount
  const trackScanMutation = useMutation({
    mutationFn: (qrId: string) => apiRequest(`/api/qr-scan/${qrId}`, 'POST'),
    onSuccess: (data) => {
      console.log('QR scan tracked successfully:', data);
    },
    onError: (error) => {
      console.error('Failed to track QR scan:', error);
    }
  });

  // Fetch category data
  const { data: category, isLoading } = useQuery<ProductCategory>({
    queryKey: ['/api/product-categories', categorySlug],
    enabled: !!categorySlug
  });

  // Track choice flow
  const createFlowMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/choice-flow', 'POST', data),
    onSuccess: (flow: any) => {
      setFlowId(flow.id);
    }
  });

  const updateFlowMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest(`/api/choice-flow/${id}/step`, 'PUT', data)
  });

  const completeFlowMutation = useMutation({
    mutationFn: ({ id, timeSpentMinutes }: { id: number; timeSpentMinutes: number }) => 
      apiRequest(`/api/choice-flow/${id}/complete`, 'PUT', { timeSpentMinutes }),
    onSuccess: () => {
      setIsComplete(true);
      toast({
        title: "Recommendations ready!",
        description: "Based on your answers, here are the perfect TVs for you."
      });
    }
  });

  // Track QR scan when component mounts
  useEffect(() => {
    if (qrCodeId) {
      trackScanMutation.mutate(qrCodeId);
    }
  }, [qrCodeId]);

  // Initialize choice flow when category is loaded
  useEffect(() => {
    if (category && !flowId) {
      createFlowMutation.mutate({
        categoryId: category.id,
        flowStartedAt: new Date().toISOString(),
        currentStep: 0,
        questionResponses: {}
      });
    }
  }, [category, flowId]);

  const handleAnswer = (questionId: number, answer: string | string[]) => {
    const newResponses = {
      ...responses,
      [questionId]: answer
    };
    setResponses(newResponses);

    // Update flow step
    if (flowId) {
      updateFlowMutation.mutate({
        id: flowId,
        data: {
          currentStep: currentStep + 1,
          responses: newResponses
        }
      });
    }

    if (currentStep < TV_QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete the flow
      const timeSpent = Math.round((Date.now() - startTime) / 60000);
      if (flowId) {
        completeFlowMutation.mutate({
          id: flowId,
          timeSpentMinutes: timeSpent
        });
      }
    }
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setResponses({});
    setIsComplete(false);
    if (category) {
      createFlowMutation.mutate({
        categoryId: category.id,
        flowStartedAt: new Date().toISOString(),
        currentStep: 0,
        questionResponses: {}
      });
    }
  };

  const handleBookInstallation = () => {
    setLocation('/booking-flow');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Category Not Found</CardTitle>
            <CardDescription>
              The product category you're looking for doesn't exist or has been disabled.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation('/')} className="w-full">
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progress = ((currentStep + 1) / TV_QUESTIONS.length) * 100;
  const currentQuestion = TV_QUESTIONS[currentStep];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">{category.iconEmoji}</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {category.name} Finder
          </h1>
          <p className="text-gray-600">
            {category.description}
          </p>
          <Badge variant="secondary" className="mt-2">
            Powered by Harvey Norman
          </Badge>
        </div>

        {!isComplete ? (
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex justify-between items-center mb-4">
                <CardTitle className="text-lg">
                  Question {currentStep + 1} of {TV_QUESTIONS.length}
                </CardTitle>
                <Badge variant="outline">
                  {Math.round(progress)}% Complete
                </Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {currentQuestion.question}
              </h2>
              
              <div className="grid gap-3">
                {currentQuestion.options.map((option) => (
                  <Button
                    key={option.value}
                    variant="outline"
                    className="justify-start text-left h-auto p-4 hover:border-primary hover:text-primary"
                    onClick={() => handleAnswer(currentQuestion.id, option.value)}
                  >
                    <div className="flex items-center w-full">
                      <span className="flex-1">{option.label}</span>
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </div>
                  </Button>
                ))}
              </div>

              {currentStep > 0 && (
                <Button
                  variant="ghost"
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="w-full"
                >
                  Go Back
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Completion Card */}
            <Card className="shadow-lg border-green-200">
              <CardHeader className="text-center">
                <div className="text-4xl mb-2">🎉</div>
                <CardTitle className="text-2xl text-green-700">
                  Perfect Match Found!
                </CardTitle>
                <CardDescription>
                  Based on your preferences, we've found the ideal TV options from Harvey Norman
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Mock Recommendations */}
            <div className="grid gap-4">
              <Card className="shadow-md border-blue-200">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <Sparkles className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Top Recommendation</CardTitle>
                      <CardDescription>Samsung 55" QLED Smart TV</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Perfect match for your budget and room size. Excellent for streaming and gaming with HDR support.
                  </p>
                  <div className="flex gap-2">
                    <Badge variant="default">In Stock</Badge>
                    <Badge variant="secondary">Free Delivery</Badge>
                    <Badge variant="outline">5 Year Warranty</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-md">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="bg-orange-100 p-2 rounded-full">
                      <Zap className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Professional Installation</CardTitle>
                      <CardDescription>Get it installed by certified experts</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Professional wall mounting, cable management, and setup included. Same-day installation available.
                  </p>
                  <Button onClick={handleBookInstallation} className="w-full">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Book Installation Now
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleRestart} variant="outline" className="flex-1">
                Start Over
              </Button>
              <Button onClick={() => setLocation('/')} className="flex-1">
                Browse More Products
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}