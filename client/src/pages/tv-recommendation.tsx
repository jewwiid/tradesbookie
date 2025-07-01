import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tv, Zap, Eye, Gamepad2, DollarSign, ArrowLeft, ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useMutation } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import HarveyNormanBooking from '@/components/HarveyNormanBooking';
import Navigation from '@/components/navigation';

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
  currentModels?: any[];
  marketAnalysis?: string;
  pricingTrends?: string;
  bestDeals?: string[];
  realTimeData?: boolean;
}

interface ProductImageDisplayProps {
  brand: string;
  model: string;
  tvType: string;
  priceRange: string;
}

function ProductImageDisplay({ brand, model, tvType, priceRange }: ProductImageDisplayProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const generateImage = async () => {
    try {
      setImageLoading(true);
      const response = await apiRequest("POST", "/api/generate-product-image", {
        brand,
        model,
        tvType
      });
      
      if (response.ok) {
        const data = await response.json();
        setImageUrl(data.imageUrl);
        setImageError(false);
      } else {
        setImageError(true);
      }
    } catch (error) {
      console.error('Product image generation failed:', error);
      setImageError(true);
    } finally {
      setImageLoading(false);
    }
  };

  useEffect(() => {
    generateImage();
  }, [brand, model, tvType]);

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-sm p-6">
      <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center mb-4 overflow-hidden">
        {imageLoading ? (
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-500">Generating product image...</p>
          </div>
        ) : imageError || !imageUrl ? (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-2 bg-gray-300 rounded-lg flex items-center justify-center">
              <Tv className="w-8 h-8 text-gray-500" />
            </div>
            <p className="text-sm text-gray-600">{model}</p>
            <p className="text-xs text-gray-500">{tvType}</p>
          </div>
        ) : (
          <img 
            src={imageUrl} 
            alt={`${brand} ${model} ${tvType}`}
            className="w-full h-full object-contain rounded-lg"
            onError={() => setImageError(true)}
          />
        )}
      </div>
      <div className="text-center space-y-2">
        <h4 className="font-semibold text-gray-800">{brand} {model}</h4>
        <p className="text-sm text-gray-600">{tvType}</p>
        <Badge variant="outline" className="text-green-600 border-green-600 text-lg px-4 py-2">
          {priceRange}
        </Badge>
      </div>
    </div>
  );
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
  const [showContactForm, setShowContactForm] = useState(false);
  const [showHarveyNormanBooking, setShowHarveyNormanBooking] = useState(false);
  const [contactInfo, setContactInfo] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
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

  const contactMutation = useMutation<any, Error, any>({
    mutationFn: async (contactData: any) => {
      const response = await fetch('/api/tv-recommendation/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactData)
      });
      if (!response.ok) throw new Error('Failed to send contact request');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Request Sent!",
        description: "A salesperson will contact you within 24 hours with TV recommendations.",
      });
      setShowContactForm(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to send contact request. Please try again.",
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
    setShowContactForm(false);
    setContactInfo({ name: '', email: '', phone: '', message: '' });
  };

  const handleContactSalesperson = () => {
    // Pre-fill the message with user preferences and recommendation
    const prefilledMessage = `Hi! I completed the TV recommendation quiz and received a recommendation for ${recommendation?.type} (${recommendation?.model}). 

My preferences were:
- Primary usage: ${answers.usage}
- Budget range: ${answers.budget}
- Room environment: ${answers.room}
- Gaming importance: ${answers.gaming}
- Priority feature: ${answers.features}

I'm interested in learning more about this TV and discussing purchase options. Please contact me to discuss further.`;

    setContactInfo(prev => ({ ...prev, message: prefilledMessage }));
    setShowContactForm(true);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactInfo.name || !contactInfo.email) {
      toast({
        title: "Required Fields",
        description: "Please fill in your name and email address.",
        variant: "destructive",
      });
      return;
    }

    contactMutation.mutate({
      ...contactInfo,
      recommendation: recommendation,
      preferences: answers
    });
  };

  const currentQuestion = questions[currentStep];
  const isAnswered = answers[currentQuestion?.id];
  const progress = ((currentStep + 1) / questions.length) * 100;

  if (showHarveyNormanBooking) {
    return (
      <HarveyNormanBooking 
        recommendation={recommendation} 
        preferences={answers}
        onClose={() => setShowHarveyNormanBooking(false)}
      />
    );
  }

  if (showContactForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Contact Our TV Experts</h1>
            <p className="text-gray-600">Get personalized assistance with your TV selection</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Contact TV Expert</CardTitle>
              <CardDescription>
                We'll connect you with a TV expert who can help you find the perfect model and arrange purchase.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleContactSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={contactInfo.name}
                      onChange={(e) => setContactInfo(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Your full name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={contactInfo.email}
                      onChange={(e) => setContactInfo(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="your.email@example.com"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={contactInfo.phone}
                    onChange={(e) => setContactInfo(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+353 XX XXX XXXX"
                  />
                </div>

                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={contactInfo.message}
                    onChange={(e) => setContactInfo(prev => ({ ...prev, message: e.target.value }))}
                    rows={8}
                    placeholder="Tell us about your requirements..."
                  />
                </div>

                <div className="flex gap-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowContactForm(false)}
                    className="flex-1"
                  >
                    Back to Recommendation
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={contactMutation.isPending}
                    className="flex-1"
                  >
                    {contactMutation.isPending ? "Sending..." : "Send Request"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
                {recommendation.realTimeData && (
                  <Badge variant="outline" className="ml-3 text-green-600 border-green-600">
                    Live Market Data
                  </Badge>
                )}
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

              {/* Current TV Models Available */}
              {recommendation.currentModels && recommendation.currentModels.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Alternative TV Models Available
                  </h3>
                  <div className="grid gap-4">
                    {recommendation.currentModels.map((tv, index) => (
                      <Card key={index} className="border-2 border-blue-200 bg-blue-50/30">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="text-lg font-bold text-gray-900">{tv.model}</h4>
                              <p className="text-blue-600 font-medium">{tv.brand}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold text-green-600">{tv.price}</p>
                              <p className="text-sm text-orange-600 font-medium">Subject to availability</p>
                            </div>
                          </div>

                          {tv.keyFeatures && tv.keyFeatures.length > 0 && (
                            <div className="mb-3">
                              <div className="flex flex-wrap gap-1">
                                {tv.keyFeatures.map((feature, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {feature}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="grid md:grid-cols-2 gap-3 mb-3">
                            {tv.pros && tv.pros.length > 0 && (
                              <div>
                                <h6 className="text-xs font-medium text-gray-600 mb-1">ADVANTAGES</h6>
                                <ul className="text-xs space-y-1">
                                  {tv.pros.slice(0, 3).map((pro, idx) => (
                                    <li key={idx} className="flex items-start">
                                      <span className="text-green-500 mr-1">✓</span>
                                      <span className="text-gray-700">{pro}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {tv.cons && tv.cons.length > 0 && (
                              <div>
                                <h6 className="text-xs font-medium text-gray-600 mb-1">CONSIDERATIONS</h6>
                                <ul className="text-xs space-y-1">
                                  {tv.cons.slice(0, 3).map((con, idx) => (
                                    <li key={idx} className="flex items-start">
                                      <span className="text-amber-500 mr-1">⚠</span>
                                      <span className="text-gray-700">{con}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>

                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              {tv.expertRating && (
                                <Badge variant="secondary" className="text-xs">
                                  {tv.expertRating} Expert Rating
                                </Badge>
                              )}
                            </div>
                            {tv.retailers && tv.retailers.length > 0 && (
                              <div className="text-xs text-gray-600">
                                Available at: {tv.retailers.slice(0, 2).join(", ")}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}


            </CardContent>
          </Card>



          {/* Harvey Norman Guarantee Section */}
          <Card className="mb-6 border-orange-300 bg-gradient-to-r from-orange-100 to-red-100">
            <CardContent className="p-6 text-center">
              <div className="mb-4">
                <h3 className="text-2xl font-bold text-orange-800 mb-2">🏆 Harvey Norman Price Guarantee</h3>
                <p className="text-orange-700 font-medium">
                  Book an in-store consultation and we guarantee you'll save money
                </p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-lg p-4 border border-orange-200">
                  <div className="text-orange-600 text-3xl mb-2">💰</div>
                  <h4 className="font-semibold text-gray-800">Best Price Match</h4>
                  <p className="text-sm text-gray-600">We'll beat any competitor's price by €10</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-orange-200">
                  <div className="text-orange-600 text-3xl mb-2">🎯</div>
                  <h4 className="font-semibold text-gray-800">Expert Guidance</h4>
                  <p className="text-sm text-gray-600">Personal consultation with TV specialists</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-orange-200">
                  <div className="text-orange-600 text-3xl mb-2">📦</div>
                  <h4 className="font-semibold text-gray-800">Installation Bundle</h4>
                  <p className="text-sm text-gray-600">Professional setup + mounting service</p>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border-2 border-orange-300 mb-4">
                <p className="text-lg font-bold text-orange-800 mb-2">
                  Exclusive Offer: Save up to €200 + Free Installation Quote
                </p>
                <p className="text-sm text-gray-700">
                  Valid when you book through tradesbook.ie and mention this recommendation
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="text-center space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <Button 
                onClick={() => setShowHarveyNormanBooking(true)} 
                size="lg"
                className="bg-orange-600 hover:bg-orange-700 text-white h-16 text-lg font-semibold"
              >
                <div className="text-center">
                  <div>🏆 Book Harvey Norman Consultation</div>
                  <div className="text-sm opacity-90">Guaranteed Best Price + €200 Savings</div>
                </div>
              </Button>
              <Button 
                onClick={() => window.location.href = '/booking'}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white h-16 text-lg font-semibold"
              >
                <div className="text-center">
                  <div>📺 Book TV Installation</div>
                  <div className="text-sm opacity-90">Professional Setup Service</div>
                </div>
              </Button>
            </div>
            
            <div className="flex justify-center gap-4">
              <Button onClick={handleRestart} variant="outline" size="lg">
                Get Another Recommendation
              </Button>
            </div>
            
            <p className="text-sm text-gray-500 max-w-2xl mx-auto">
              tradesbook.ie is Harvey Norman's official installation partner. 
              All consultations include expert TV selection, price matching, and professional installation quotes.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <Navigation />
      <div className="max-w-2xl mx-auto p-4">
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
                <div 
                  key={option.value} 
                  className={`flex items-start space-x-3 p-4 rounded-lg border transition-colors cursor-pointer ${
                    answers[currentQuestion.id] === option.value 
                      ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200' 
                      : 'hover:bg-gray-50 border-gray-200'
                  }`}
                  onClick={() => handleAnswerChange(currentQuestion.id, option.value)}
                >
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