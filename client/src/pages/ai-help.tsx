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
  question1: string;
  question2: string;
  question3: string;
}

interface CategoryQuestion {
  id: string;
  question: string;
  options: Array<{
    value: string;
    label: string;
  }>;
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
    question1: '',
    question2: '',
    question3: ''
  });
  const [productComparison, setProductComparison] = useState<ElectronicProductComparison | null>(null);
  const [currentStep, setCurrentStep] = useState(0); // 0: models, 1: category, 2: questions

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

  const productCategories = [
    { value: 'headphones', label: 'Headphones' },
    { value: 'soundbars', label: 'Soundbars' },
    { value: 'televisions', label: 'Televisions' },
    { value: 'robot-vacuums', label: 'Robot Vacuums' },
    { value: 'washing-machines', label: 'Washing Machines' },
    { value: 'refrigerators', label: 'Refrigerators' },
    { value: 'dishwashers', label: 'Dishwashers' },
    { value: 'microwaves', label: 'Microwaves' },
    { value: 'electric-kettles', label: 'Electric Kettles' },
    { value: 'toasters', label: 'Toasters' },
    { value: 'coffee-makers', label: 'Coffee Makers' }
  ];

  const categoryQuestions: Record<string, CategoryQuestion[]> = {
    'headphones': [
      {
        id: 'question1',
        question: 'Preferred headphone type?',
        options: [
          { value: 'in-ear', label: 'In-ear' },
          { value: 'on-ear', label: 'On-ear' },
          { value: 'over-ear', label: 'Over-ear' }
        ]
      },
      {
        id: 'question2',
        question: 'Main use-case?',
        options: [
          { value: 'commuting', label: 'Commuting/travel' },
          { value: 'workouts', label: 'Workouts' },
          { value: 'home', label: 'Home/office' },
          { value: 'versatile', label: 'Versatile use' }
        ]
      },
      {
        id: 'question3',
        question: 'Important features?',
        options: [
          { value: 'wireless', label: 'Wireless connectivity' },
          { value: 'noise-cancel', label: 'Active noise cancellation' },
          { value: 'battery', label: 'Long battery life' },
          { value: 'comfort', label: 'Lightweight & comfort' }
        ]
      }
    ],
    'soundbars': [
      {
        id: 'question1',
        question: 'Desired audio channels?',
        options: [
          { value: '2.1-3.1', label: '2.1/3.1' },
          { value: '5.1', label: '5.1' },
          { value: 'atmos', label: 'Atmos/DTS:X' }
        ]
      },
      {
        id: 'question2',
        question: 'Connection preference?',
        options: [
          { value: 'wireless', label: 'Wireless (Bluetooth/Wi-Fi)' },
          { value: 'hdmi', label: 'HDMI/ARC' },
          { value: 'optical', label: 'Optical/AUX' }
        ]
      },
      {
        id: 'question3',
        question: 'Aesthetic & size considerations?',
        options: [
          { value: 'slim', label: 'Slim/low-profile' },
          { value: 'matches-tv', label: 'Matches TV width' },
          { value: 'no-preference', label: 'No preference' }
        ]
      }
    ],
    'televisions': [
      {
        id: 'question1',
        question: 'What matters most in picture quality?',
        options: [
          { value: 'resolution', label: 'Resolution (e.g., 4K/8K)' },
          { value: 'hdr', label: 'HDR' },
          { value: 'color', label: 'Colour accuracy' },
          { value: 'not-sure', label: 'Not sure' }
        ]
      },
      {
        id: 'question2',
        question: 'Ideal screen size?',
        options: [
          { value: 'small', label: '<50 inch' },
          { value: 'medium', label: '55–65 inch' },
          { value: 'large', label: '≥65 inch' }
        ]
      },
      {
        id: 'question3',
        question: 'Smart-TV needs?',
        options: [
          { value: 'advanced', label: 'Advanced apps & voice control' },
          { value: 'basic', label: 'Basic smart features' },
          { value: 'none', label: 'No smart features' }
        ]
      }
    ],
    'robot-vacuums': [
      {
        id: 'question1',
        question: 'Flooring & cleaning needs?',
        options: [
          { value: 'hard-floors', label: 'Mostly hard floors' },
          { value: 'carpet', label: 'Mainly carpet' },
          { value: 'mixed', label: 'Mixed floors' },
          { value: 'vacuum-mop', label: 'Vacuum-mop combo' }
        ]
      },
      {
        id: 'question2',
        question: 'Navigation preference?',
        options: [
          { value: 'random', label: 'Random navigation' },
          { value: 'smart', label: 'Smart mapping' },
          { value: 'lidar', label: 'LiDAR/advanced sensors' }
        ]
      },
      {
        id: 'question3',
        question: 'Maintenance & features?',
        options: [
          { value: 'self-empty', label: 'Self-emptying bin' },
          { value: 'tangle-free', label: 'Tangle-free roller' },
          { value: 'quiet', label: 'Quiet operation' },
          { value: 'none', label: 'None' }
        ]
      }
    ],
    'washing-machines': [
      {
        id: 'question1',
        question: 'Preferred loading style?',
        options: [
          { value: 'front', label: 'Front load' },
          { value: 'top-agitator', label: 'Top load (agitator)' },
          { value: 'top-impeller', label: 'Top load (impeller)' }
        ]
      },
      {
        id: 'question2',
        question: 'Household size/load size?',
        options: [
          { value: 'small', label: 'Small (1–2 people)' },
          { value: 'medium', label: 'Medium (3–4 people)' },
          { value: 'large', label: 'Large (5+ people or bulky items)' }
        ]
      },
      {
        id: 'question3',
        question: 'Efficiency priorities?',
        options: [
          { value: 'high', label: 'High energy & water efficiency' },
          { value: 'balanced', label: 'Balanced efficiency & price' },
          { value: 'not-important', label: 'Efficiency not important' }
        ]
      }
    ],
    'refrigerators': [
      {
        id: 'question1',
        question: 'Household size/storage needs?',
        options: [
          { value: 'small', label: '16–18 cu ft' },
          { value: 'medium', label: '18–20 cu ft' },
          { value: 'large', label: '>20 cu ft' }
        ]
      },
      {
        id: 'question2',
        question: 'Ice maker & dispenser?',
        options: [
          { value: 'must-have', label: 'Must have' },
          { value: 'nice-to-have', label: 'Nice to have' },
          { value: 'no-thanks', label: 'No thanks' }
        ]
      },
      {
        id: 'question3',
        question: 'Energy efficiency preferences?',
        options: [
          { value: 'energy-star', label: 'ENERGY STAR & energy saver' },
          { value: 'standard', label: 'Standard efficiency' },
          { value: 'unsure', label: 'Unsure' }
        ]
      }
    ],
    'dishwashers': [
      {
        id: 'question1',
        question: 'Installation preference?',
        options: [
          { value: 'built-in', label: 'Built-in' },
          { value: 'portable', label: 'Portable/countertop' },
          { value: 'drawer', label: 'Drawer' }
        ]
      },
      {
        id: 'question2',
        question: 'Noise & capacity?',
        options: [
          { value: 'quiet-large', label: 'Quiet & large capacity' },
          { value: 'standard', label: 'Standard noise' },
          { value: 'basic', label: 'Basic capacity/noise not important' }
        ]
      },
      {
        id: 'question3',
        question: 'Preferred features?',
        options: [
          { value: 'adjustable', label: 'Adjustable racks & soil sensor' },
          { value: 'drying', label: 'Advanced drying methods' },
          { value: 'top-control', label: 'Top-control panel' },
          { value: 'no-special', label: 'No special features' }
        ]
      }
    ],
    'microwaves': [
      {
        id: 'question1',
        question: 'Installation type?',
        options: [
          { value: 'countertop', label: 'Countertop' },
          { value: 'over-range', label: 'Over-the-range (with ventilation)' },
          { value: 'built-in', label: 'Built-in' }
        ]
      },
      {
        id: 'question2',
        question: 'Capacity & power?',
        options: [
          { value: 'compact', label: 'Compact (≤1 cu ft, ~700 W)' },
          { value: 'mid-size', label: 'Mid-size (~1–1.5 cu ft, ~1,000 W)' },
          { value: 'large', label: 'Large (>1.5 cu ft, ≥1,200 W)' }
        ]
      },
      {
        id: 'question3',
        question: 'Desired features?',
        options: [
          { value: 'sensor', label: 'Sensor/automatic cooking' },
          { value: 'convection', label: 'Convection or multi-purpose' },
          { value: 'child-lock', label: 'Child lock & turntable off' },
          { value: 'no-special', label: 'No special features' }
        ]
      }
    ],
    'electric-kettles': [
      {
        id: 'question1',
        question: 'Capacity needed?',
        options: [
          { value: 'small', label: 'Small (<1 L)' },
          { value: 'medium', label: 'Medium (1–1.5 L)' },
          { value: 'large', label: 'Large (>1.5 L)' }
        ]
      },
      {
        id: 'question2',
        question: 'Preferred features?',
        options: [
          { value: 'temp-control', label: 'Temperature control & water level indicator' },
          { value: 'basic', label: 'Basic on-off with auto-shutoff' },
          { value: 'swivel', label: '360° swivel base & insulated handle' },
          { value: 'none', label: 'None' }
        ]
      },
      {
        id: 'question3',
        question: 'Material preference?',
        options: [
          { value: 'steel', label: 'Stainless steel' },
          { value: 'glass', label: 'Glass' },
          { value: 'any', label: 'Any (BPA-free)' }
        ]
      }
    ],
    'toasters': [
      {
        id: 'question1',
        question: 'How many slots?',
        options: [
          { value: '2-slice', label: '2-slice' },
          { value: '4-slice', label: '4-slice' }
        ]
      },
      {
        id: 'question2',
        question: 'Desired functions?',
        options: [
          { value: 'basic', label: 'Basic toasting' },
          { value: 'defrost', label: 'Defrost & reheat' },
          { value: 'adjustable', label: 'Adjustable browning & cancel button' }
        ]
      },
      {
        id: 'question3',
        question: 'Design & cleaning preferences?',
        options: [
          { value: 'matches-decor', label: 'Matches kitchen décor' },
          { value: 'removable-tray', label: 'Removable crumb tray' },
          { value: 'high-wattage', label: 'High-wattage (fast)' },
          { value: 'no-preference', label: 'No preference' }
        ]
      }
    ],
    'coffee-makers': [
      {
        id: 'question1',
        question: 'Preferred brewing method?',
        options: [
          { value: 'drip', label: 'Drip coffee maker' },
          { value: 'single-serve', label: 'Single-serve pod machine' },
          { value: 'manual', label: 'Manual (French press/pour-over)' },
          { value: 'hybrid', label: 'Hybrid coffee & espresso' }
        ]
      },
      {
        id: 'question2',
        question: 'Typical brew size?',
        options: [
          { value: 'single', label: 'Single cup' },
          { value: 'small', label: '2–4 cups' },
          { value: 'large', label: '10+ cups' }
        ]
      },
      {
        id: 'question3',
        question: 'Important features?',
        options: [
          { value: 'programmable', label: 'Programmable timer & auto-shutoff' },
          { value: 'custom', label: 'Custom brew strength or temperature' },
          { value: 'grinder', label: 'Built-in grinder or milk frother' },
          { value: 'basic', label: 'Basic machine' }
        ]
      }
    ]
  };

  const handleQuestionnaireAnswer = (questionId: string, value: string) => {
    setQuestionnaire(prev => ({ ...prev, [questionId]: value }));
  };

  const handleNextStep = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceedFromModels = product1.trim() && product2.trim();
  const canProceedFromCategory = productCategory.trim();
  const canProceedFromQuestions = questionnaire.question1 && questionnaire.question2 && questionnaire.question3;
  
  const getCurrentQuestions = () => {
    return categoryQuestions[productCategory] || [];
  };

  const handleElectronicsCompare = () => {
    if (canProceedFromModels && canProceedFromCategory && canProceedFromQuestions) {
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
    setQuestionnaire({ question1: '', question2: '', question3: '' });
    setProductComparison(null);
    setCurrentStep(0);
  };

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
                  {/* Model Number Disclaimer */}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-amber-800 text-center">
                      <strong>Tip:</strong> The model number or product code can be found underneath the price on the ticket shown in store.
                    </p>
                  </div>
                  
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
                  {/* Progress Bar */}
                  <div className="mb-6">
                    <div className="flex justify-between text-sm text-gray-500 mb-2">
                      <span className={currentStep >= 0 ? 'text-purple-600 font-medium' : ''}>Models</span>
                      <span className={currentStep >= 1 ? 'text-purple-600 font-medium' : ''}>Category</span>
                      <span className={currentStep >= 2 ? 'text-purple-600 font-medium' : ''}>Questions</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${((currentStep + 1) / 3) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Step 1: Model Numbers */}
                  {currentStep === 0 && (
                    <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                      <h3 className="text-lg font-bold text-blue-900 mb-4 text-center">
                        Step 1: Enter Product Model Numbers
                      </h3>
                      <p className="text-blue-700 text-center mb-4">
                        Enter the exact model numbers or product codes you want to compare
                      </p>
                      
                      {/* Model Number Disclaimer */}
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
                        <p className="text-sm text-amber-800 text-center">
                          <strong>Tip:</strong> The model number or product code can be found underneath the price on the ticket shown in store.
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            First Product Model/Code
                          </label>
                          <Input
                            placeholder="e.g., WH-1000XM5, QN55Q60TAFXZA"
                            value={product1}
                            onChange={(e) => setProduct1(e.target.value)}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Second Product Model/Code
                          </label>
                          <Input
                            placeholder="e.g., OLED55C1PUB, AirPods Pro"
                            value={product2}
                            onChange={(e) => setProduct2(e.target.value)}
                            className="w-full"
                          />
                        </div>
                      </div>

                      <div className="text-center">
                        <Button
                          onClick={handleNextStep}
                          disabled={!canProceedFromModels}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          Next: Select Category
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Product Category */}
                  {currentStep === 1 && (
                    <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                      <h3 className="text-lg font-bold text-green-900 mb-4 text-center">
                        Step 2: Select Product Category
                      </h3>
                      <p className="text-green-700 text-center mb-6">
                        Choose the category that best matches your products
                      </p>
                      
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Product Category
                        </label>
                        <select
                          value={productCategory}
                          onChange={(e) => setProductCategory(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="">Select a category...</option>
                          {productCategories.map((category) => (
                            <option key={category.value} value={category.value}>
                              {category.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-3">
                        <Button
                          onClick={handlePrevStep}
                          variant="outline"
                          className="w-full"
                        >
                          Previous
                        </Button>
                        <Button
                          onClick={handleNextStep}
                          disabled={!canProceedFromCategory}
                          className="w-full bg-purple-600 hover:bg-purple-700"
                        >
                          Next: Answer Questions
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Category-Specific Questions */}
                  {currentStep === 2 && productCategory && (
                    <div className="bg-orange-50 p-3 sm:p-6 rounded-lg border border-orange-200">
                      <h3 className="text-lg font-bold text-orange-900 mb-4 text-center">
                        Step 3: Answer Category Questions
                      </h3>
                      <p className="text-orange-700 text-center mb-6 text-sm sm:text-base">
                        Help us understand your specific needs for {productCategories.find(c => c.value === productCategory)?.label}
                      </p>
                      
                      <div className="space-y-4 sm:space-y-6">
                        {getCurrentQuestions().map((question, index) => (
                          <Card key={question.id} className="overflow-hidden">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-sm sm:text-base">
                                Question {index + 1}: {question.question}
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <div className="grid grid-cols-1 gap-3">
                                {question.options.map((option) => (
                                  <div
                                    key={option.value}
                                    className={`p-3 border-2 rounded-lg cursor-pointer transition-all text-sm sm:text-base ${
                                      questionnaire[question.id as keyof QuestionnaireAnswers] === option.value
                                        ? 'border-purple-500 bg-purple-50'
                                        : 'border-gray-300 hover:border-purple-300'
                                    }`}
                                    onClick={() => handleQuestionnaireAnswer(question.id, option.value)}
                                  >
                                    <div className="flex items-center">
                                      <div className={`w-4 h-4 rounded-full border-2 mr-3 flex-shrink-0 ${
                                        questionnaire[question.id as keyof QuestionnaireAnswers] === option.value
                                          ? 'border-purple-500 bg-purple-500'
                                          : 'border-gray-300'
                                      }`}>
                                        {questionnaire[question.id as keyof QuestionnaireAnswers] === option.value && (
                                          <div className="w-full h-full rounded-full bg-white scale-50"></div>
                                        )}
                                      </div>
                                      <span className="font-medium break-words">{option.label}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      <div className="mt-6 space-y-3">
                        <Button
                          onClick={handlePrevStep}
                          variant="outline"
                          className="w-full"
                        >
                          Previous
                        </Button>
                        <Button
                          onClick={handleElectronicsCompare}
                          disabled={!canProceedFromQuestions || compareElectronics.isPending}
                          className="w-full bg-purple-600 hover:bg-purple-700"
                        >
                          {compareElectronics.isPending ? (
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                              <span className="text-sm sm:text-base">Analyzing Products</span>
                              <span className="animate-pulse text-sm sm:text-base">...</span>
                            </div>
                          ) : (
                            <span className="text-sm sm:text-base">Compare Products with AI Analysis</span>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Reset Button - Always Available */}
                  <div className="text-center">
                    <Button
                      onClick={resetElectronicsComparison}
                      variant="outline"
                      className="text-gray-600 hover:text-gray-800"
                    >
                      Reset & Start Over
                    </Button>
                  </div>
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