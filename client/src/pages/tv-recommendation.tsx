import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tv, Zap, Eye, Gamepad2, DollarSign, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useMutation } from '@tanstack/react-query';

interface QuestionData {
  id: string;
  question: string;
  icon: React.ReactNode;
  options: Array<{
    value: string;
    label: string;
    description?: string;
  }>;
}

interface TVRecommendation {
  type: string;
  model: string;
  reasons: string[];
  pros: string[];
  cons: string[];
  priceRange: string;
  bestFor: string[];
}

const questions: QuestionData[] = [
  {
    id: 'usage',
    question: 'What will you primarily use your TV for?',
    icon: <Tv className="w-6 h-6" />,
    options: [
      { value: 'movies', label: 'Movies & TV Shows', description: 'Streaming, cinema experience' },
      { value: 'gaming', label: 'Gaming', description: 'Console and PC gaming' },
      { value: 'sports', label: 'Sports & News', description: 'Live events, fast motion' },
      { value: 'mixed', label: 'Everything', description: 'Balanced usage for all content' }
    ]
  },
  {
    id: 'budget',
    question: 'What\'s your budget range?',
    icon: <DollarSign className="w-6 h-6" />,
    options: [
      { value: 'budget', label: '€400 - €800', description: 'Great value options' },
      { value: 'mid', label: '€800 - €1,500', description: 'Premium features' },
      { value: 'high', label: '€1,500 - €3,000', description: 'High-end performance' },
      { value: 'premium', label: '€3,000+', description: 'Flagship models' }
    ]
  },
  {
    id: 'room',
    question: 'Describe your viewing environment',
    icon: <Eye className="w-6 h-6" />,
    options: [
      { value: 'bright', label: 'Bright Room', description: 'Lots of windows, daytime viewing' },
      { value: 'mixed', label: 'Mixed Lighting', description: 'Some natural light, controlled' },
      { value: 'dark', label: 'Dark Room', description: 'Theater-like, minimal light' },
      { value: 'variable', label: 'Variable', description: 'Changes throughout the day' }
    ]
  },
  {
    id: 'gaming',
    question: 'How important is gaming performance?',
    icon: <Gamepad2 className="w-6 h-6" />,
    options: [
      { value: 'essential', label: 'Essential', description: 'Competitive gaming, low latency' },
      { value: 'important', label: 'Important', description: 'Regular gaming sessions' },
      { value: 'occasional', label: 'Occasional', description: 'Casual gaming sometimes' },
      { value: 'none', label: 'Not Important', description: 'No gaming planned' }
    ]
  },
  {
    id: 'features',
    question: 'Which feature matters most to you?',
    icon: <Zap className="w-6 h-6" />,
    options: [
      { value: 'picture', label: 'Best Picture Quality', description: 'Color accuracy, contrast' },
      { value: 'brightness', label: 'High Brightness', description: 'HDR, bright rooms' },
      { value: 'design', label: 'Premium Design', description: 'Aesthetics, wall mounting' },
      { value: 'smart', label: 'Smart Features', description: 'Apps, connectivity, ease of use' }
    ]
  }
];

export default function TVRecommendation() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [recommendation, setRecommendation] = useState<TVRecommendation | null>(null);
  const { toast } = useToast();

  const recommendationMutation = useMutation<TVRecommendation, Error, Record<string, string>>({
    mutationFn: async (questionnaire: Record<string, string>) => {
      const response = await fetch('/api/tv-recommendation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: questionnaire })
      });
      if (!response.ok) throw new Error('Failed to get recommendation');
      return response.json();
    },
    onSuccess: (data: TVRecommendation) => {
      setRecommendation(data);
      toast({
        title: "Recommendation Ready!",
        description: "Your personalized TV recommendation is complete.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to generate recommendation. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Generate recommendation
      recommendationMutation.mutate(answers);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setAnswers({});
    setRecommendation(null);
  };

  const currentQuestion = questions[currentStep];
  const isAnswered = answers[currentQuestion?.id];
  const progress = ((currentStep + 1) / questions.length) * 100;

  if (recommendation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Your Perfect TV Match</h1>
            <p className="text-gray-600">Based on your preferences, here's our AI recommendation</p>
          </div>

          <Card className="mb-6">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-yellow-500 mr-2" />
                <CardTitle className="text-2xl">{recommendation.type}</CardTitle>
              </div>
              <CardDescription className="text-lg font-medium">{recommendation.model}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Why This TV Is Perfect For You</h3>
                <ul className="space-y-1">
                  {recommendation.reasons.map((reason, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-green-500 mr-2">•</span>
                      <span className="text-gray-700">{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Key Advantages</h3>
                  <ul className="space-y-1">
                    {recommendation.pros.map((pro, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-blue-500 mr-2">✓</span>
                        <span className="text-gray-700 text-sm">{pro}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Considerations</h3>
                  <ul className="space-y-1">
                    {recommendation.cons.map((con, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-amber-500 mr-2">⚠</span>
                        <span className="text-gray-700 text-sm">{con}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <div>
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    {recommendation.priceRange}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recommendation.bestFor.map((feature, index) => (
                    <Badge key={index} variant="secondary">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-center space-y-4">
            <p className="text-gray-600">
              Ready to book your TV installation? Our certified installers can help you set up your new TV perfectly.
            </p>
            <div className="flex justify-center gap-4">
              <Button onClick={handleRestart} variant="outline">
                Get Another Recommendation
              </Button>
              <Button onClick={() => window.location.href = '/booking'}>
                Book Installation
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">TV Recommendation Quiz</h1>
          <p className="text-gray-600">Answer 5 questions to get your perfect TV match</p>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-500">Question {currentStep + 1} of {questions.length}</span>
            <span className="text-sm text-gray-500">{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                {currentQuestion.icon}
              </div>
              <CardTitle className="text-xl">{currentQuestion.question}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={answers[currentQuestion.id] || ''}
              onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
              className="space-y-4"
            >
              {currentQuestion.options.map((option) => (
                <div key={option.value} className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-gray-50 transition-colors">
                  <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor={option.value} className="font-medium cursor-pointer">
                      {option.label}
                    </Label>
                    {option.description && (
                      <p className="text-sm text-gray-500 mt-1">{option.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        <div className="flex justify-between mt-8">
          <Button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous</span>
          </Button>

          <Button
            onClick={handleNext}
            disabled={!isAnswered || recommendationMutation.isPending}
            className="flex items-center space-x-2"
          >
            {recommendationMutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Generating...</span>
              </>
            ) : currentStep === questions.length - 1 ? (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Get Recommendation</span>
              </>
            ) : (
              <>
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}