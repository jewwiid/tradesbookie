import Navigation from "@/components/navigation";
import Footer from "@/components/Footer";
import AIHelpWidget from "@/components/AIHelpWidget";
import { MessageCircle, Zap, Clock, CheckCircle, ArrowRightLeft, DollarSign } from "lucide-react";
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface TVComparison {
  winner: string;
  verdict: string;
  model1_name: string;
  model1_rating: number;
  model1_review: string;
  model2_name: string;
  model2_rating: number;
  model2_review: string;
  key_differences: string[];
}

interface ElectronicProductComparison {
  winner: string;
  verdict: string;
  model1_name: string;
  model1_rating: number;
  model1_review: string;
  model2_name: string;
  model2_rating: number;
  model2_review: string;
  key_differences: string[];
  personalized_recommendation: string;
  budget_consideration: string;
}

interface QuestionnaireAnswers {
  usage: string;
  experience: string;
  priorities: string;
}

export default function AIHelpPage() {
  const [activeTab, setActiveTab] = useState('chat');
  const [model1, setModel1] = useState('');
  const [model2, setModel2] = useState('');
  const [comparison, setComparison] = useState<TVComparison | null>(null);
  
  // Electronic Product Comparison State
  const [product1, setProduct1] = useState('');
  const [product2, setProduct2] = useState('');
  const [productCategory, setProductCategory] = useState('');
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireAnswers>({
    usage: '',
    experience: '',
    priorities: ''
  });
  const [productComparison, setProductComparison] = useState<ElectronicProductComparison | null>(null);
  const [questionnaireStep, setQuestionnaireStep] = useState(0);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const compareModels = useMutation({
    mutationFn: async ({ model1, model2 }: { model1: string; model2: string }) => {
      const response = await fetch('/api/ai/compare-tvs', {
        method: 'POST',
        body: JSON.stringify({ model1, model2 }),
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Comparison failed');
      return response.json();
    },
    onSuccess: (data: TVComparison) => {
      setComparison(data);
    }
  });

  const compareElectronics = useMutation({
    mutationFn: async ({ product1, product2, productCategory, questionnaire }: { 
      product1: string; 
      product2: string; 
      productCategory: string;
      questionnaire: QuestionnaireAnswers;
    }) => {
      const response = await fetch('/api/ai/compare-electronics', {
        method: 'POST',
        body: JSON.stringify({ product1, product2, productCategory, questionnaire }),
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Electronic product comparison failed');
      return response.json();
    },
    onSuccess: (data: ElectronicProductComparison) => {
      setProductComparison(data);
    }
  });

  const handleCompare = () => {
    if (model1.trim() && model2.trim()) {
      compareModels.mutate({ model1: model1.trim(), model2: model2.trim() });
    }
  };

  const questionnaireQuestions = [
    {
      id: 'usage',
      question: 'What will you primarily use this product for?',
      options: [
        { value: 'work', label: 'Work & Productivity', description: 'Professional tasks, business use' },
        { value: 'entertainment', label: 'Entertainment & Media', description: 'Gaming, streaming, multimedia' },
        { value: 'creativity', label: 'Creative Work', description: 'Design, editing, content creation' },
        { value: 'daily', label: 'Daily Personal Use', description: 'Communication, web browsing, general use' }
      ]
    },
    {
      id: 'experience', 
      question: 'How would you describe your technical experience?',
      options: [
        { value: 'beginner', label: 'Beginner', description: 'Prefer simple, easy-to-use products' },
        { value: 'intermediate', label: 'Intermediate', description: 'Comfortable with most tech features' },
        { value: 'advanced', label: 'Advanced', description: 'Enjoy advanced features and customization' },
        { value: 'expert', label: 'Expert', description: 'Want maximum control and technical specs' }
      ]
    },
    {
      id: 'priorities',
      question: 'What matters most to you when choosing a product?',
      options: [
        { value: 'price', label: 'Best Value for Money', description: 'Budget-conscious, cost-effective choice' },
        { value: 'performance', label: 'Maximum Performance', description: 'Speed, power, and capabilities' },
        { value: 'reliability', label: 'Reliability & Support', description: 'Dependable, good warranty, support' },
        { value: 'features', label: 'Latest Features', description: 'Cutting-edge technology and innovations' }
      ]
    }
  ];

  const handleQuestionnaireAnswer = (questionId: string, value: string) => {
    setQuestionnaire(prev => ({ ...prev, [questionId]: value }));
  };

  const handleQuestionnaireNext = () => {
    if (questionnaireStep < questionnaireQuestions.length - 1) {
      setQuestionnaireStep(questionnaireStep + 1);
    }
  };

  const handleQuestionnairePrev = () => {
    if (questionnaireStep > 0) {
      setQuestionnaireStep(questionnaireStep - 1);
    }
  };

  const handleElectronicsCompare = () => {
    if (product1.trim() && product2.trim() && productCategory.trim() && 
        questionnaire.usage && questionnaire.experience && questionnaire.priorities) {
      compareElectronics.mutate({ 
        product1: product1.trim(), 
        product2: product2.trim(), 
        productCategory: productCategory.trim(),
        questionnaire 
      });
    }
  };

  const resetElectronicsComparison = () => {
    setProduct1('');
    setProduct2('');
    setProductCategory('');
    setQuestionnaire({ usage: '', experience: '', priorities: '' });
    setProductComparison(null);
    setQuestionnaireStep(0);
  };

  const isQuestionnaireComplete = questionnaire.usage && questionnaire.experience && questionnaire.priorities;
  const currentQuestion = questionnaireQuestions[questionnaireStep];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navigation />
      
      <div className="flex-1 flex flex-col max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12 w-full">
        {/* Header Section */}
        <div className="text-center mb-6 sm:mb-8 flex-shrink-0">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <MessageCircle className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
            AI Help Assistant
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto mb-4 sm:mb-6 px-4">
            Get instant answers to your questions about TV installation, electronics setup, streaming services, and more. 
            Our AI assistant is available 24/7 with expert knowledge to help you quickly.
          </p>
          
          {/* Feature Benefits */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 max-w-4xl mx-auto mb-6 sm:mb-8 px-4">
            <div className="flex items-center justify-center text-gray-600">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 mr-2 flex-shrink-0" />
              <span className="font-medium text-sm">Instant Responses</span>
            </div>
            <div className="flex items-center justify-center text-gray-600">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-2 flex-shrink-0" />
              <span className="font-medium text-sm">Available 24/7</span>
            </div>
            <div className="flex items-center justify-center text-gray-600">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500 mr-2 flex-shrink-0" />
              <span className="font-medium text-sm">Expert Knowledge</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-6 sm:mb-8 px-4">
          <div className="bg-white rounded-lg p-1 shadow-sm border flex flex-row">
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-3 sm:px-4 py-2 rounded-md font-medium text-xs sm:text-sm transition-colors flex items-center whitespace-nowrap ${
                activeTab === 'chat'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <MessageCircle className="w-4 h-4 mr-1 sm:mr-2 flex-shrink-0" />
              <span className="hidden sm:inline">AI Chat Assistant</span>
              <span className="sm:hidden">AI Chat</span>
            </button>
            <button
              onClick={() => setActiveTab('compare')}
              className={`px-3 sm:px-4 py-2 rounded-md font-medium text-xs sm:text-sm transition-colors flex items-center whitespace-nowrap ${
                activeTab === 'compare'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ArrowRightLeft className="w-4 h-4 mr-1 sm:mr-2 flex-shrink-0" />
              <span className="hidden sm:inline">TV Model Comparison</span>
              <span className="sm:hidden">Compare TVs</span>
            </button>
          </div>
        </div>

        {/* Content Area - Conditional Rendering */}
        <div className="flex-1 max-w-4xl mx-auto px-2 sm:px-4 w-full min-h-0">
          {activeTab === 'chat' ? (
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-3 sm:p-6 h-full flex flex-col">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 text-center px-2 flex-shrink-0">
                Ask me anything about TV installation & electronics
              </h2>
              <div className="flex-1 min-h-0">
                <AIHelpWidget />
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-3 sm:p-6 h-full flex flex-col">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 text-center px-2 flex-shrink-0">
                Compare TV Models with AI Analysis
              </h2>
              <div className="flex-1 overflow-y-auto">
                {/* TV Model Input Section */}
                <div className="mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First TV Model
                      </label>
                      <Input
                        placeholder="e.g., Samsung QN55Q60TAFXZA"
                        value={model1}
                        onChange={(e) => setModel1(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Second TV Model
                      </label>
                      <Input
                        placeholder="e.g., LG OLED55C1PUB"
                        value={model2}
                        onChange={(e) => setModel2(e.target.value)}
                        className="w-full"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleCompare}
                    disabled={!model1.trim() || !model2.trim() || compareModels.isPending}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {compareModels.isPending ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Analyzing
                        <span className="animate-pulse">...</span>
                      </div>
                    ) : (
                      'Compare TVs'
                    )}
                  </Button>
                </div>

                {/* Comparison Results */}
                {comparison && (
                  <div className="space-y-4">
                    {/* Winner Badge */}
                    {comparison.winner && (
                      <div className="text-center">
                        <Badge className="bg-green-100 text-green-800 px-4 py-2 text-base">
                          🏆 Winner: {comparison.winner}
                        </Badge>
                      </div>
                    )}

                    {/* Verdict */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <ArrowRightLeft className="w-5 h-5 mr-2" />
                          AI Verdict
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-700 leading-relaxed">{comparison.verdict}</p>
                      </CardContent>
                    </Card>

                    {/* Individual Reviews */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">{comparison.model1_name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="mb-3">
                            <div className="flex items-center mb-2">
                              <span className="text-sm font-medium text-gray-600">Rating:</span>
                              <div className="ml-2 flex">
                                {[...Array(5)].map((_, i) => (
                                  <span
                                    key={i}
                                    className={`text-lg ${
                                      i < comparison.model1_rating ? 'text-yellow-400' : 'text-gray-300'
                                    }`}
                                  >
                                    ★
                                  </span>
                                ))}
                              </div>
                              <span className="ml-2 text-sm text-gray-600">
                                {comparison.model1_rating}/5
                              </span>
                            </div>
                          </div>
                          <p className="text-gray-700 text-sm leading-relaxed">{comparison.model1_review}</p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">{comparison.model2_name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="mb-3">
                            <div className="flex items-center mb-2">
                              <span className="text-sm font-medium text-gray-600">Rating:</span>
                              <div className="ml-2 flex">
                                {[...Array(5)].map((_, i) => (
                                  <span
                                    key={i}
                                    className={`text-lg ${
                                      i < comparison.model2_rating ? 'text-yellow-400' : 'text-gray-300'
                                    }`}
                                  >
                                    ★
                                  </span>
                                ))}
                              </div>
                              <span className="ml-2 text-sm text-gray-600">
                                {comparison.model2_rating}/5
                              </span>
                            </div>
                          </div>
                          <p className="text-gray-700 text-sm leading-relaxed">{comparison.model2_review}</p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Key Differences */}
                    {comparison.key_differences && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Key Differences</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {comparison.key_differences.map((diff: string, index: number) => (
                              <li key={index} className="flex items-start">
                                <span className="text-blue-500 mr-2 flex-shrink-0">•</span>
                                <span className="text-gray-700 text-sm">{diff}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}

                    {/* Book Consultation Button */}
                    <div className="text-center mt-6 pt-4 border-t border-gray-200">
                      <p className="text-gray-600 mb-3 text-sm">
                        Need personalized advice about these TV models?
                      </p>
                      <Button
                        onClick={() => {
                          const tvDetails = `${comparison.model1_name} vs ${comparison.model2_name} - Winner: ${comparison.winner}`;
                          window.location.href = `/consultation-booking?tv=${encodeURIComponent(tvDetails)}`;
                        }}
                        className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2"
                      >
                        Book TV Consultation
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Electronic Product Comparison Section */}
        <div className="max-w-4xl mx-auto mt-8 px-4">
          <div className="bg-white rounded-xl shadow-xl border">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-t-xl">
              <h2 className="text-2xl font-bold text-center flex items-center justify-center">
                <ArrowRightLeft className="w-6 h-6 mr-2" />
                Electronic Product Comparison Tool
              </h2>
              <p className="text-center mt-2 text-purple-100">
                Compare any electronic products with personalized AI analysis based on your needs
              </p>
            </div>
            
            <div className="p-6 space-y-6">
              {!productComparison ? (
                <>
                  {/* Questionnaire Section */}
                  <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                    <h3 className="text-lg font-bold text-blue-900 mb-4 text-center">
                      Step {questionnaireStep + 1} of {questionnaireQuestions.length}: Tell us about your needs
                    </h3>
                    
                    <div className="mb-4">
                      <div className="w-full bg-blue-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${((questionnaireStep + 1) / questionnaireQuestions.length) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-center">{currentQuestion.question}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {currentQuestion.options.map((option) => (
                            <div
                              key={option.value}
                              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                questionnaire[currentQuestion.id as keyof QuestionnaireAnswers] === option.value
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-300 hover:border-blue-300'
                              }`}
                              onClick={() => handleQuestionnaireAnswer(currentQuestion.id, option.value)}
                            >
                              <div className="flex items-center mb-2">
                                <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                                  questionnaire[currentQuestion.id as keyof QuestionnaireAnswers] === option.value
                                    ? 'border-blue-500 bg-blue-500'
                                    : 'border-gray-300'
                                }`}>
                                  {questionnaire[currentQuestion.id as keyof QuestionnaireAnswers] === option.value && (
                                    <div className="w-full h-full rounded-full bg-white scale-50"></div>
                                  )}
                                </div>
                                <span className="font-medium">{option.label}</span>
                              </div>
                              <p className="text-sm text-gray-600 ml-7">{option.description}</p>
                            </div>
                          ))}
                        </div>

                        <div className="flex justify-between mt-6">
                          <Button
                            onClick={handleQuestionnairePrev}
                            disabled={questionnaireStep === 0}
                            variant="outline"
                          >
                            Previous
                          </Button>
                          <Button
                            onClick={handleQuestionnaireNext}
                            disabled={!questionnaire[currentQuestion.id as keyof QuestionnaireAnswers] || questionnaireStep === questionnaireQuestions.length - 1}
                          >
                            Next
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Product Input Section - Only show if questionnaire is complete */}
                  {isQuestionnaireComplete && (
                    <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                      <h3 className="text-lg font-bold text-green-900 mb-4 text-center">
                        Great! Now enter the products you want to compare
                      </h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Product Category
                          </label>
                          <Input
                            placeholder="e.g., Laptops, Smartphones, Headphones, Tablets"
                            value={productCategory}
                            onChange={(e) => setProductCategory(e.target.value)}
                            className="w-full"
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              First Product
                            </label>
                            <Input
                              placeholder="e.g., MacBook Pro M3, iPhone 15 Pro"
                              value={product1}
                              onChange={(e) => setProduct1(e.target.value)}
                              className="w-full"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Second Product
                            </label>
                            <Input
                              placeholder="e.g., Dell XPS 15, Samsung Galaxy S24"
                              value={product2}
                              onChange={(e) => setProduct2(e.target.value)}
                              className="w-full"
                            />
                          </div>
                        </div>

                        <div className="text-center space-y-3">
                          <Button
                            onClick={handleElectronicsCompare}
                            disabled={!product1.trim() || !product2.trim() || !productCategory.trim() || compareElectronics.isPending}
                            className="w-full bg-purple-600 hover:bg-purple-700"
                            size="lg"
                          >
                            {compareElectronics.isPending ? (
                              <div className="flex items-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                                Analyzing Products
                                <span className="animate-pulse">...</span>
                              </div>
                            ) : (
                              'Compare Products with AI Analysis'
                            )}
                          </Button>
                          
                          <Button
                            onClick={resetElectronicsComparison}
                            variant="outline"
                            className="w-full"
                          >
                            Reset & Start Over
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* Comparison Results */
                <div className="space-y-6">
                  <div className="text-center">
                    <Button
                      onClick={resetElectronicsComparison}
                      variant="outline"
                      className="mb-4"
                    >
                      Compare Different Products
                    </Button>
                  </div>

                  {/* Winner Badge */}
                  {productComparison.winner && (
                    <div className="text-center">
                      <Badge className="bg-green-100 text-green-800 px-4 py-2 text-base">
                        🏆 Winner: {productComparison.winner}
                      </Badge>
                    </div>
                  )}

                  {/* Personalized Recommendation */}
                  <Card className="border-purple-300 bg-purple-50">
                    <CardHeader>
                      <CardTitle className="flex items-center text-purple-800">
                        <Zap className="w-5 h-5 mr-2" />
                        Personalized for You
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-purple-700 leading-relaxed font-medium">{productComparison.personalized_recommendation}</p>
                    </CardContent>
                  </Card>

                  {/* AI Verdict */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <ArrowRightLeft className="w-5 h-5 mr-2" />
                        AI Verdict
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 leading-relaxed">{productComparison.verdict}</p>
                    </CardContent>
                  </Card>

                  {/* Budget Consideration */}
                  <Card className="border-orange-300 bg-orange-50">
                    <CardHeader>
                      <CardTitle className="flex items-center text-orange-800">
                        <DollarSign className="w-5 h-5 mr-2" />
                        Budget Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-orange-700 leading-relaxed">{productComparison.budget_consideration}</p>
                    </CardContent>
                  </Card>

                  {/* Individual Reviews */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">{productComparison.model1_name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="mb-3">
                          <div className="flex items-center mb-2">
                            <span className="text-sm font-medium text-gray-600">Rating:</span>
                            <div className="ml-2 flex">
                              {[...Array(5)].map((_, i) => (
                                <span
                                  key={i}
                                  className={`text-lg ${
                                    i < productComparison.model1_rating ? 'text-yellow-400' : 'text-gray-300'
                                  }`}
                                >
                                  ★
                                </span>
                              ))}
                            </div>
                            <span className="ml-2 text-sm text-gray-600">
                              {productComparison.model1_rating}/5
                            </span>
                          </div>
                        </div>
                        <p className="text-gray-700 text-sm leading-relaxed">{productComparison.model1_review}</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">{productComparison.model2_name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="mb-3">
                          <div className="flex items-center mb-2">
                            <span className="text-sm font-medium text-gray-600">Rating:</span>
                            <div className="ml-2 flex">
                              {[...Array(5)].map((_, i) => (
                                <span
                                  key={i}
                                  className={`text-lg ${
                                    i < productComparison.model2_rating ? 'text-yellow-400' : 'text-gray-300'
                                  }`}
                                >
                                  ★
                                </span>
                              ))}
                            </div>
                            <span className="ml-2 text-sm text-gray-600">
                              {productComparison.model2_rating}/5
                            </span>
                          </div>
                        </div>
                        <p className="text-gray-700 text-sm leading-relaxed">{productComparison.model2_review}</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Key Differences */}
                  {productComparison.key_differences && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Key Differences</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {productComparison.key_differences.map((diff: string, index: number) => (
                            <li key={index} className="flex items-start">
                              <span className="text-purple-500 mr-2 flex-shrink-0">•</span>
                              <span className="text-gray-700 text-sm">{diff}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Need More Help - Moved Outside Flex Container */}
        <div className="max-w-4xl mx-auto mt-6 text-center px-4 pb-8">
          <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-4 sm:p-6 border border-orange-200">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">
              Need More Help?
            </h3>
            <p className="text-gray-600 mb-3 sm:mb-4 text-sm">
              If our AI assistant can't solve your issue, our professional installation services 
              provide hands-on help to get everything working perfectly.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
              <a
                href="/consultation-booking"
                className="inline-flex items-center justify-center px-4 py-2 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors text-sm"
              >
                Book Consultation
              </a>
              <a
                href="mailto:support@tradesbook.ie"
                className="inline-flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors text-sm sm:text-base"
              >
                Contact Support
              </a>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}