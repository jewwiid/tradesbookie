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

interface ProductInfo {
  name: string;
  brand: string;
  rating: number;
  price: string;
  overview: string;
  pros: string[];
  cons: string[];
  keyFeatures: string[];
  specifications: Record<string, string>;
  expertRecommendation: string;
  valueForMoney: string;
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

interface ProductRecommendation {
  sku: string;
  name: string;
  price: number;
  energyLabel?: string;
  availability: {
    inStock: boolean;
    stores: string[];
    deliveryDays: number;
  };
  url: string;
  image?: string;
  reasons: string[];
  rating?: number;
}

interface RecommendationResponse {
  recommendations: ProductRecommendation[];
  searchSummary: string;
  filters: any;
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
  const [productModel, setProductModel] = useState('');
  const [productInfo, setProductInfo] = useState<ProductInfo | null>(null);
  
  // Electronic Product Comparison State
  const [product1, setProduct1] = useState('');
  const [product2, setProduct2] = useState('');
  const [productCategory, setProductCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireAnswers>({
    question1: '',
    question2: '',
    question3: ''
  });
  const [productComparison, setProductComparison] = useState<ElectronicProductComparison | null>(null);
  const [currentStep, setCurrentStep] = useState(0); // 0: category, 1: models, 2: questions

  // Find My Product State
  const [findProductStep, setFindProductStep] = useState(0); // 0: category, 1: questions, 2: results
  const [selectedCategory, setSelectedCategory] = useState('');
  const [findAnswers, setFindAnswers] = useState<Record<string, string>>({});
  const [maxBudget, setMaxBudget] = useState<number>(1000);
  const [recommendations, setRecommendations] = useState<RecommendationResponse | null>(null);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const getProductInfo = useMutation({
    mutationFn: async ({ model }: { model: string }) => {
      const response = await fetch('/api/ai/product-info', {
        method: 'POST',
        body: JSON.stringify({ model }),
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to get product info');
      return response.json();
    },
    onSuccess: (data: ProductInfo) => {
      setProductInfo(data);
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

  const handleGetProductInfo = () => {
    if (productModel.trim()) {
      getProductInfo.mutate({ model: productModel.trim() });
    }
  };

  const productCategories = [
    { value: 'headphones', label: 'Headphones' },
    { value: 'earphones', label: 'Earphones' },
    { value: 'soundbars', label: 'Soundbars' },
    { value: 'televisions', label: 'Televisions' },
    { value: 'robot-vacuums', label: 'Robot Vacuums' },
    { value: 'washing-machines', label: 'Washing Machines' },
    { value: 'refrigerators', label: 'Refrigerators' },
    { value: 'dishwashers', label: 'Dishwashers' },
    { value: 'microwaves', label: 'Microwaves' },
    { value: 'electric-kettles', label: 'Electric Kettles' },
    { value: 'toasters', label: 'Toasters' },
    { value: 'coffee-makers', label: 'Coffee Makers' },
    { value: 'other', label: 'Other (Custom Category)' }
  ];

  const categoryQuestions: Record<string, CategoryQuestion[]> = {
    'headphones': [
      {
        id: 'question1',
        question: 'Preferred headphone type?',
        options: [
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
          { value: 'versatile', label: 'Versatile use (all-round)' }
        ]
      },
      {
        id: 'question3',
        question: 'Important features?',
        options: [
          { value: 'wireless', label: 'Wireless connectivity (Bluetooth)' },
          { value: 'noise-cancel', label: 'Active noise cancellation' },
          { value: 'battery', label: 'Long battery life' },
          { value: 'comfort', label: 'Lightweight, comfortable design' }
        ]
      }
    ],
    'earphones': [
      {
        id: 'question1',
        question: 'Preferred earphone style?',
        options: [
          { value: 'true-wireless', label: 'True wireless earbuds (completely wireless)' },
          { value: 'wireless-neckband', label: 'Wireless earphones with neckband cable' },
          { value: 'wired', label: 'Wired earphones' }
        ]
      },
      {
        id: 'question2',
        question: 'Main use-case?',
        options: [
          { value: 'commuting', label: 'Commuting/travel' },
          { value: 'workouts', label: 'Workouts' },
          { value: 'home', label: 'Home/office' },
          { value: 'versatile', label: 'Versatile use (all-round)' }
        ]
      },
      {
        id: 'question3',
        question: 'Important features?',
        options: [
          { value: 'noise-cancel', label: 'Active noise cancellation' },
          { value: 'water-resist', label: 'Water/sweat resistance' },
          { value: 'battery', label: 'Long battery life (for wireless)' },
          { value: 'secure-fit', label: 'Secure & comfortable fit' }
        ]
      }
    ],
    'soundbars': [
      {
        id: 'question1',
        question: 'Desired sound experience?',
        options: [
          { value: '2.1-3.1', label: 'Basic 2.1 or 3.1 (enhanced stereo sound)' },
          { value: '5.1', label: 'Surround 5.1 (cinematic surround sound)' },
          { value: 'atmos', label: 'Immersive 3D audio (Dolby Atmos)' }
        ]
      },
      {
        id: 'question2',
        question: 'Connection preference?',
        options: [
          { value: 'wireless', label: 'Wireless (Bluetooth or Wi-Fi)' },
          { value: 'hdmi', label: 'HDMI (ARC)' },
          { value: 'optical', label: 'Optical or AUX cable' }
        ]
      },
      {
        id: 'question3',
        question: 'Aesthetic & size considerations?',
        options: [
          { value: 'slim', label: 'Slim, low-profile design' },
          { value: 'matches-tv', label: 'Soundbar width roughly matches TV' },
          { value: 'no-preference', label: 'No preference' }
        ]
      }
    ],
    'televisions': [
      {
        id: 'question1',
        question: 'What matters most in picture quality?',
        options: [
          { value: 'resolution', label: 'Resolution (e.g. 4K or 8K)' },
          { value: 'hdr', label: 'High Dynamic Range (HDR)' },
          { value: 'color', label: 'Colour accuracy' },
          { value: 'not-sure', label: 'Not sure' }
        ]
      },
      {
        id: 'question2',
        question: 'Ideal screen size?',
        options: [
          { value: 'small', label: 'Under 50 inches' },
          { value: 'medium', label: '55–65 inches' },
          { value: 'large', label: '65 inches or larger' }
        ]
      },
      {
        id: 'question3',
        question: 'Smart TV features?',
        options: [
          { value: 'advanced', label: 'Advanced apps and voice control' },
          { value: 'basic', label: 'Basic built-in smart apps' },
          { value: 'none', label: 'Prefer a non-smart TV' }
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
          { value: 'mixed', label: 'Mixed floor types' },
          { value: 'vacuum-mop', label: 'Vacuum + mop combo capability' }
        ]
      },
      {
        id: 'question2',
        question: 'Navigation preference?',
        options: [
          { value: 'random', label: 'Random/simple navigation' },
          { value: 'smart', label: 'Smart mapping (learns room layout)' },
          { value: 'lidar', label: 'LiDAR or advanced sensors' }
        ]
      },
      {
        id: 'question3',
        question: 'Maintenance & extra features?',
        options: [
          { value: 'self-empty', label: 'Self-emptying dust bin' },
          { value: 'tangle-free', label: 'Tangle-free brush roll' },
          { value: 'quiet', label: 'Quiet operation' },
          { value: 'none', label: 'None of these' }
        ]
      }
    ],
    'washing-machines': [
      {
        id: 'question1',
        question: 'Preferred loading style?',
        options: [
          { value: 'front', label: 'Front load (door on front)' },
          { value: 'top', label: 'Top load (lid on top)' },
          { value: 'no-preference', label: 'No preference' }
        ]
      },
      {
        id: 'question2',
        question: 'Household size / load size?',
        options: [
          { value: 'small', label: 'Small (1–2 people)' },
          { value: 'medium', label: 'Medium (3–4 people)' },
          { value: 'large', label: 'Large (5+ people or bulky loads)' }
        ]
      },
      {
        id: 'question3',
        question: 'Efficiency priorities?',
        options: [
          { value: 'high', label: 'High energy and water efficiency' },
          { value: 'balanced', label: 'Balanced efficiency and price' },
          { value: 'not-important', label: 'Efficiency not a priority' }
        ]
      }
    ],
    'refrigerators': [
      {
        id: 'question1',
        question: 'Household size / capacity needs?',
        options: [
          { value: 'small', label: 'Small (1–2 people, up to ~300 L total)' },
          { value: 'medium', label: 'Medium (3–4 people, ~300–500 L)' },
          { value: 'large', label: 'Large (5+ people or extra storage, 500 L+)' }
        ]
      },
      {
        id: 'question2',
        question: 'Ice maker and water dispenser?',
        options: [
          { value: 'must-have', label: 'Must have' },
          { value: 'nice-to-have', label: 'Nice to have' },
          { value: 'not-needed', label: 'Not needed' }
        ]
      },
      {
        id: 'question3',
        question: 'Energy efficiency preference?',
        options: [
          { value: 'high', label: 'High efficiency (top energy rating)' },
          { value: 'standard', label: 'Standard efficiency' },
          { value: 'unsure', label: 'Unsure / no preference' }
        ]
      }
    ],
    'dishwashers': [
      {
        id: 'question1',
        question: 'Installation type?',
        options: [
          { value: 'built-in', label: 'Built-in (integrated)' },
          { value: 'portable', label: 'Freestanding or countertop (portable)' },
          { value: 'drawer', label: 'Drawer style' }
        ]
      },
      {
        id: 'question2',
        question: 'Noise & capacity preference?',
        options: [
          { value: 'quiet-large', label: 'Extra quiet with large capacity' },
          { value: 'standard', label: 'Standard capacity and noise' },
          { value: 'compact', label: 'Compact size (noise not important)' }
        ]
      },
      {
        id: 'question3',
        question: 'Preferred features?',
        options: [
          { value: 'adjustable', label: 'Adjustable racks and soil sensor' },
          { value: 'drying', label: 'Advanced drying features' },
          { value: 'top-control', label: 'Top-mounted control panel' },
          { value: 'no-special', label: 'No special features' }
        ]
      }
    ],
    'microwaves': [
      {
        id: 'question1',
        question: 'Installation type?',
        options: [
          { value: 'countertop', label: 'Countertop (freestanding)' },
          { value: 'over-range', label: 'Over-the-range (with ventilation hood)' },
          { value: 'built-in', label: 'Built-in (cabinet integrated)' }
        ]
      },
      {
        id: 'question2',
        question: 'Capacity & power?',
        options: [
          { value: 'compact', label: 'Compact (≤ ~25 L, ~700 W)' },
          { value: 'mid-size', label: 'Mid-size (~25–40 L, ~1000 W)' },
          { value: 'large', label: 'Large (>40 L, ≥1200 W)' }
        ]
      },
      {
        id: 'question3',
        question: 'Desired features?',
        options: [
          { value: 'sensor', label: 'Sensor cooking programs' },
          { value: 'convection', label: 'Convection or grill function' },
          { value: 'child-lock', label: 'Child lock or turntable-off option' },
          { value: 'no-special', label: 'No special features' }
        ]
      }
    ],
    'electric-kettles': [
      {
        id: 'question1',
        question: 'Capacity needed?',
        options: [
          { value: 'small', label: 'Small (under 1 L)' },
          { value: 'medium', label: 'Medium (1–1.5 L)' },
          { value: 'large', label: 'Large (over 1.5 L)' }
        ]
      },
      {
        id: 'question2',
        question: 'Preferred features?',
        options: [
          { value: 'temp-control', label: 'Variable temperature control, water level indicator' },
          { value: 'basic', label: 'Basic on/off with auto-shutoff' },
          { value: 'swivel', label: '360° swivel base, cool-touch exterior' },
          { value: 'none', label: 'No special features' }
        ]
      },
      {
        id: 'question3',
        question: 'Material preference?',
        options: [
          { value: 'steel', label: 'Stainless steel' },
          { value: 'glass', label: 'Glass' },
          { value: 'any', label: 'Any (BPA-free plastic)' }
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
          { value: 'basic', label: 'Basic toasting only' },
          { value: 'defrost', label: 'Defrost and reheat modes' },
          { value: 'adjustable', label: 'Adjustable browning control, cancel button' }
        ]
      },
      {
        id: 'question3',
        question: 'Design & cleaning preferences?',
        options: [
          { value: 'stylish', label: 'Stylish design to match kitchen' },
          { value: 'easy-clean', label: 'Easy cleaning (removable crumb tray)' },
          { value: 'high-power', label: 'High-power for faster toasting' },
          { value: 'no-preference', label: 'No preference' }
        ]
      }
    ],
    'coffee-makers': [
      {
        id: 'question1',
        question: 'Preferred brewing method?',
        options: [
          { value: 'drip', label: 'Drip filter coffee maker' },
          { value: 'single-serve', label: 'Single-serve pod/capsule machine' },
          { value: 'manual', label: 'Manual brew (French press or pour-over)' },
          { value: 'hybrid', label: 'Hybrid (coffee + espresso) machine' }
        ]
      },
      {
        id: 'question2',
        question: 'Typical brew size?',
        options: [
          { value: 'single', label: 'Single cup at a time' },
          { value: 'small', label: '2–4 cups (small pot)' },
          { value: 'large', label: '10+ cups (large pot)' }
        ]
      },
      {
        id: 'question3',
        question: 'Important features?',
        options: [
          { value: 'programmable', label: 'Programmable timer and auto-shutoff' },
          { value: 'custom', label: 'Adjustable brew strength or temperature' },
          { value: 'grinder', label: 'Built-in grinder or milk frother' },
          { value: 'basic', label: 'No special features' }
        ]
      }
    ],
    'other': [
      {
        id: 'question1',
        question: 'What is your primary intended use?',
        options: [
          { value: 'daily-use', label: 'Daily use at home' },
          { value: 'professional', label: 'Professional or commercial use' },
          { value: 'occasional', label: 'Occasional or recreational use' },
          { value: 'travel', label: 'Travel or portable use' }
        ]
      },
      {
        id: 'question2',
        question: 'What matters most to you?',
        options: [
          { value: 'performance', label: 'Performance and functionality' },
          { value: 'price', label: 'Price and value for money' },
          { value: 'design', label: 'Design and appearance' },
          { value: 'reliability', label: 'Reliability and durability' }
        ]
      },
      {
        id: 'question3',
        question: 'What is your experience level with this type of product?',
        options: [
          { value: 'beginner', label: 'Beginner - need something simple' },
          { value: 'intermediate', label: 'Intermediate - comfortable with features' },
          { value: 'advanced', label: 'Advanced - want full control and customization' },
          { value: 'expert', label: 'Expert - professional level requirements' }
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

  const canProceedFromCategory = productCategory.trim() && (productCategory !== 'other' || customCategory.trim());
  const canProceedFromModels = product1.trim() && product2.trim();
  const canProceedFromQuestions = questionnaire.question1 && questionnaire.question2 && questionnaire.question3;
  
  const getCurrentQuestions = () => {
    return categoryQuestions[productCategory] || [];
  };

  const handleElectronicsCompare = () => {
    if (canProceedFromCategory && canProceedFromModels && canProceedFromQuestions) {
      const finalCategory = productCategory === 'other' ? customCategory.trim() : productCategory.trim();
      compareElectronics.mutate({ 
        product1: product1.trim(), 
        product2: product2.trim(), 
        productCategory: finalCategory,
        questionnaire 
      });
    }
  };

  // Dynamic placeholders based on category
  const getPlaceholders = () => {
    switch(productCategory) {
      case 'headphones':
        return {
          first: 'e.g., Sony WH-1000XM5, Bose QuietComfort 45',
          second: 'e.g., Audio-Technica ATH-M50x, Sennheiser HD 660S'
        };
      case 'earphones':
        return {
          first: 'e.g., Apple AirPods Pro, Sony WF-1000XM4',
          second: 'e.g., Samsung Galaxy Buds Pro, Jabra Elite 85t'
        };
      case 'soundbars':
        return {
          first: 'e.g., Samsung HW-Q950A, Sonos Arc',
          second: 'e.g., Bose Smart Soundbar 900, JBL Bar 9.1'
        };
      case 'televisions':
        return {
          first: 'e.g., Samsung QN55Q60TAFXZA, LG OLED55C1PUB',
          second: 'e.g., Sony XR55A80J, Hisense 55U8G'
        };
      case 'robot-vacuums':
        return {
          first: 'e.g., iRobot Roomba i7+, Roborock S7',
          second: 'e.g., Shark IQ Robot, Eufy RoboVac 11S'
        };
      case 'washing-machines':
        return {
          first: 'e.g., LG WM3900HWA, Samsung WF45R6300AW',
          second: 'e.g., Whirlpool WTW8127LC, Bosch WAW285H2UC'
        };
      case 'refrigerators':
        return {
          first: 'e.g., Samsung RF23M8070SR, LG LMXS30776S',
          second: 'e.g., Whirlpool WRS325SDHZ, Bosch B36CL80ENS'
        };
      case 'dishwashers':
        return {
          first: 'e.g., Bosch SHPM88Z75N, KitchenAid KDTM404KPS',
          second: 'e.g., Miele G7106SCUSS, GE GDT695SSJSS'
        };
      case 'microwaves':
        return {
          first: 'e.g., Panasonic NN-SN966S, Breville BMO850BSS',
          second: 'e.g., Toshiba EM131A5C-BS, Sharp R-21LCFS'
        };
      case 'electric-kettles':
        return {
          first: 'e.g., Breville BKE820XL, Cuisinart CPK-17P1',
          second: 'e.g., Hamilton Beach 40880, OXO On Barista Brain'
        };
      case 'toasters':
        return {
          first: 'e.g., Breville BTA840XL, KitchenAid KMT4116CU',
          second: 'e.g., Cuisinart CPT-440, Black+Decker TR1278B'
        };
      case 'coffee-makers':
        return {
          first: 'e.g., Breville BES870XL, Cuisinart DCC-3200P1',
          second: 'e.g., Keurig K-Elite, Ninja CM401'
        };
      case 'other':
        return {
          first: `Enter first ${customCategory || 'product'} model...`,
          second: `Enter second ${customCategory || 'product'} model...`
        };
      default:
        return {
          first: 'e.g., WH-1000XM5, QN55Q60TAFXZA',
          second: 'e.g., OLED55C1PUB, AirPods Pro'
        };
    }
  };

  const resetElectronicsComparison = () => {
    setProduct1('');
    setProduct2('');
    setProductCategory('');
    setCustomCategory('');
    setQuestionnaire({ question1: '', question2: '', question3: '' });
    setProductComparison(null);
    setCurrentStep(0);
  };

  // Find My Product functions
  const getRecommendations = useMutation({
    mutationFn: async ({ category, answers, budget }: {
      category: string;
      answers: Record<string, string>;
      budget: number;
    }) => {
      const response = await fetch('/api/ai/recommend', {
        method: 'POST',
        body: JSON.stringify({ category, answers, maxBudgetEUR: budget }),
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Recommendation failed');
      return response.json();
    },
    onSuccess: (data: RecommendationResponse) => {
      setRecommendations(data);
      setFindProductStep(2);
    }
  });

  const resetFindProduct = () => {
    setSelectedCategory('');
    setFindAnswers({});
    setMaxBudget(1000);
    setRecommendations(null);
    setFindProductStep(0);
  };

  const handleFindAnswer = (questionId: string, value: string) => {
    setFindAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  // Question bank for Find My Product
  const findProductQuestions: Record<string, Array<{
    id: string;
    label: string;
    type: 'single' | 'multiple';
    options: Array<{ id: string; label: string; }>;
    mapsTo: string;
  }>> = {
    'soundbar': [
      {
        id: 'room_profile',
        label: 'Where will you use it?',
        type: 'single',
        options: [
          { id: 'small_tv', label: 'Small room / bedroom' },
          { id: 'living_tv', label: 'Living room' },
          { id: 'open_plan', label: 'Open-plan / large space' }
        ],
        mapsTo: 'roomSize'
      },
      {
        id: 'connection_type',
        label: 'How will you connect it?',
        type: 'single',
        options: [
          { id: 'hdmi_arc', label: 'HDMI ARC/eARC (recommended)' },
          { id: 'optical', label: 'Optical cable' },
          { id: 'bluetooth', label: 'Bluetooth wireless' }
        ],
        mapsTo: 'connection'
      },
      {
        id: 'sound_preference',
        label: 'What type of sound do you prefer?',
        type: 'single',
        options: [
          { id: 'dialogue_clear', label: 'Clear dialogue for TV/movies' },
          { id: 'bass_heavy', label: 'Deep bass for music/action' },
          { id: 'balanced', label: 'Balanced sound for everything' }
        ],
        mapsTo: 'soundProfile'
      }
    ],
    'television': [
      {
        id: 'screen_size',
        label: 'What screen size do you prefer?',
        type: 'single',
        options: [
          { id: 'under_50', label: 'Under 50 inches' },
          { id: '50_to_65', label: '50-65 inches' },
          { id: 'over_65', label: 'Over 65 inches' }
        ],
        mapsTo: 'screenSize'
      },
      {
        id: 'primary_use',
        label: 'Primary use for your TV?',
        type: 'single',
        options: [
          { id: 'general_tv', label: 'General TV viewing' },
          { id: 'gaming', label: 'Gaming (PlayStation, Xbox)' },
          { id: 'streaming', label: 'Netflix, Prime Video, etc.' },
          { id: 'sports', label: 'Sports and live events' }
        ],
        mapsTo: 'primaryUse'
      },
      {
        id: 'display_tech',
        label: 'Display technology preference?',
        type: 'single',
        options: [
          { id: 'any', label: 'Best value for my budget' },
          { id: 'oled', label: 'OLED (perfect blacks)' },
          { id: 'qled', label: 'QLED (bright colors)' },
          { id: 'led', label: 'LED (budget friendly)' }
        ],
        mapsTo: 'displayTech'
      }
    ],
    'dishwashers': [
      {
        id: 'installation_type',
        label: 'Installation type needed?',
        type: 'single',
        options: [
          { id: 'built_in', label: 'Built-in (integrated with kitchen)' },
          { id: 'freestanding', label: 'Freestanding' },
          { id: 'slimline', label: 'Slimline (compact width)' }
        ],
        mapsTo: 'installationType'
      },
      {
        id: 'noise_level',
        label: 'How important is quiet operation?',
        type: 'single',
        options: [
          { id: 'very_quiet', label: 'Very important (open plan kitchen)' },
          { id: 'moderate', label: 'Somewhat important' },
          { id: 'not_important', label: 'Not a priority' }
        ],
        mapsTo: 'noiseLevel'
      },
      {
        id: 'features',
        label: 'Most important features?',
        type: 'single',
        options: [
          { id: 'adjustable_racks', label: 'Adjustable racks & cutlery tray' },
          { id: 'enhanced_drying', label: 'Enhanced drying system' },
          { id: 'quick_wash', label: 'Quick wash cycles' },
          { id: 'energy_efficient', label: 'Energy efficient (A+ rating)' }
        ],
        mapsTo: 'preferredFeatures'
      }
    ],
    'washing-machines': [
      {
        id: 'load_capacity',
        label: 'What load capacity do you need?',
        type: 'single',
        options: [
          { id: '6kg', label: '6kg (1-2 people)' },
          { id: '8kg', label: '8kg (3-4 people)' },
          { id: '10kg_plus', label: '10kg+ (large family)' }
        ],
        mapsTo: 'loadCapacity'
      },
      {
        id: 'wash_features',
        label: 'Important washing features?',
        type: 'single',
        options: [
          { id: 'quick_wash', label: 'Quick wash cycles' },
          { id: 'steam', label: 'Steam cleaning' },
          { id: 'allergen', label: 'Anti-allergy programs' },
          { id: 'eco_friendly', label: 'Eco-friendly efficiency' }
        ],
        mapsTo: 'washFeatures'
      },
      {
        id: 'installation',
        label: 'Installation preference?',
        type: 'single',
        options: [
          { id: 'freestanding', label: 'Freestanding' },
          { id: 'integrated', label: 'Integrated (built-in)' },
          { id: 'either', label: 'Either is fine' }
        ],
        mapsTo: 'installation'
      }
    ]
  };

  const canProceedToQuestions = selectedCategory.trim() !== '';
  const getCurrentFindQuestions = () => {
    console.log('Selected category:', selectedCategory);
    console.log('Available question categories:', Object.keys(findProductQuestions));
    const questions = findProductQuestions[selectedCategory] || [];
    console.log('Questions found:', questions.length);
    return questions;
  };
  const canProceedToResults = getCurrentFindQuestions().every(q => findAnswers[q.id]);

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
              <CheckCircle className="w-4 h-4 mr-1 sm:mr-2 flex-shrink-0" />
              <span className="hidden sm:inline">Product Info</span>
              <span className="sm:hidden">Product Info</span>
            </button>
            <button
              onClick={() => setActiveTab('electronics')}
              className={`px-3 sm:px-4 py-2 rounded-md font-medium text-xs sm:text-sm transition-colors flex items-center whitespace-nowrap ${
                activeTab === 'electronics'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <DollarSign className="w-4 h-4 mr-1 sm:mr-2 flex-shrink-0" />
              <span className="hidden sm:inline">Product Comparison Tool</span>
              <span className="sm:hidden">Products</span>
            </button>
            <button
              onClick={() => setActiveTab('find')}
              className={`px-3 sm:px-4 py-2 rounded-md font-medium text-xs sm:text-sm transition-colors flex items-center whitespace-nowrap ${
                activeTab === 'find'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <CheckCircle className="w-4 h-4 mr-1 sm:mr-2 flex-shrink-0" />
              <span className="hidden sm:inline">Find My Product</span>
              <span className="sm:hidden">Find Product</span>
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
          ) : activeTab === 'compare' ? (
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-3 sm:p-6 h-full flex flex-col">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 text-center px-2 flex-shrink-0">
                Get Product Information & Reviews
              </h2>
              <div className="flex-1 overflow-y-auto">
                {/* Product Model Input Section */}
                <div className="mb-6">
                  {/* Model Number Disclaimer */}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-amber-800 text-center">
                      <strong>Tip:</strong> Enter any product model number from TVs, soundbars, or other electronics to get detailed information.
                    </p>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Model or Name
                    </label>
                    <Input
                      placeholder="e.g., Samsung QN55Q60TAFXZA, Sony WH-1000XM5, LG OLED55C1PUB"
                      value={productModel}
                      onChange={(e) => setProductModel(e.target.value)}
                      className="w-full"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && productModel.trim()) {
                          handleGetProductInfo();
                        }
                      }}
                    />
                  </div>
                  <Button
                    onClick={handleGetProductInfo}
                    disabled={!productModel.trim() || getProductInfo.isPending}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {getProductInfo.isPending ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Analyzing
                        <span className="animate-pulse">...</span>
                      </div>
                    ) : (
                      'Get Product Info'
                    )}
                  </Button>
                </div>

                {/* Product Information Results */}
                {productInfo && (
                  <div className="space-y-6">
                    {/* Product Header */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">{productInfo.name}</h3>
                            <p className="text-sm text-gray-600 mt-1">{productInfo.brand}</p>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center">
                              <div className="flex mr-2">
                                {[...Array(5)].map((_, i) => (
                                  <span
                                    key={i}
                                    className={`text-lg ${
                                      i < productInfo.rating ? 'text-yellow-400' : 'text-gray-300'
                                    }`}
                                  >
                                    ★
                                  </span>
                                ))}
                              </div>
                              <span className="text-sm font-medium text-gray-600">
                                {productInfo.rating}/5
                              </span>
                            </div>
                            <p className="text-lg font-bold text-blue-600 mt-1">{productInfo.price}</p>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-700 leading-relaxed">{productInfo.overview}</p>
                      </CardContent>
                    </Card>

                    {/* Pros and Cons */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center text-green-700">
                            <CheckCircle className="w-5 h-5 mr-2" />
                            Pros
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {productInfo.pros.map((pro: string, index: number) => (
                              <li key={index} className="flex items-start">
                                <span className="text-green-500 mr-2 flex-shrink-0">✓</span>
                                <span className="text-gray-700 text-sm">{pro}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center text-red-700">
                            <MessageCircle className="w-5 h-5 mr-2" />
                            Cons
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {productInfo.cons.map((con: string, index: number) => (
                              <li key={index} className="flex items-start">
                                <span className="text-red-500 mr-2 flex-shrink-0">✗</span>
                                <span className="text-gray-700 text-sm">{con}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Key Features */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Key Features</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {productInfo.keyFeatures.map((feature: string, index: number) => (
                            <div key={index} className="flex items-start">
                              <span className="text-blue-500 mr-2 flex-shrink-0">•</span>
                              <span className="text-gray-700 text-sm">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Specifications */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Specifications</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {Object.entries(productInfo.specifications).map(([key, value]) => (
                            <div key={key} className="flex justify-between border-b border-gray-100 pb-2">
                              <span className="text-sm font-medium text-gray-600">{key}:</span>
                              <span className="text-sm text-gray-800">{value}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Expert Recommendation & Value */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-blue-700">Expert Recommendation</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-700 text-sm leading-relaxed">{productInfo.expertRecommendation}</p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-purple-700">Value for Money</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-700 text-sm leading-relaxed">{productInfo.valueForMoney}</p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Book Consultation Button */}
                    <div className="text-center mt-6 pt-4 border-t border-gray-200">
                      <p className="text-gray-600 mb-3 text-sm">
                        Need personalized advice about this product?
                      </p>
                      <Button
                        onClick={() => {
                          const productDetails = `${productInfo.name} - ${productInfo.brand}`;
                          window.location.href = `/consultation-booking?product=${encodeURIComponent(productDetails)}`;
                        }}
                        className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2"
                      >
                        Book Product Consultation
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === 'find' ? (
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-3 sm:p-6 h-full flex flex-col">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 text-center px-2 flex-shrink-0">
                🎯 Find My Perfect Product
              </h2>
              <div className="flex-1 overflow-y-auto">
                {!recommendations ? (
                  <>
                    {/* Step 1: Category Selection */}
                    {findProductStep === 0 && (
                      <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                        <h3 className="text-lg font-bold text-blue-900 mb-4 text-center">
                          Step 1: Choose Product Category
                        </h3>
                        <p className="text-blue-700 text-center mb-6">
                          What type of product are you looking for?
                        </p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
                          {[
                            { id: 'soundbar', label: '🔊 Soundbars', desc: 'Enhance your TV audio' },
                            { id: 'television', label: '📺 Televisions', desc: 'Smart TVs & displays' },
                            { id: 'dishwashers', label: '🍽️ Dishwashers', desc: 'Kitchen appliances' },
                            { id: 'washing-machines', label: '👔 Washing Machines', desc: 'Laundry appliances' },
                            { id: 'headphones', label: '🎧 Headphones', desc: 'Audio equipment' },
                            { id: 'earphones', label: '🎵 Earphones', desc: 'Portable audio' },
                            { id: 'robot-vacuums', label: '🤖 Robot Vacuums', desc: 'Smart cleaning' },
                            { id: 'refrigerators', label: '🧊 Refrigerators', desc: 'Kitchen cooling' },
                            { id: 'microwaves', label: '📱 Microwaves', desc: 'Kitchen heating' },
                            { id: 'electric-kettles', label: '☕ Electric Kettles', desc: 'Hot water & tea' },
                            { id: 'toasters', label: '🍞 Toasters', desc: 'Breakfast appliances' },
                            { id: 'coffee-makers', label: '☕ Coffee Makers', desc: 'Coffee & espresso' },
                            { id: 'other', label: '🔧 Other', desc: 'Custom category' }
                          ].map((category) => (
                            <button
                              key={category.id}
                              onClick={() => setSelectedCategory(category.id)}
                              className={`p-4 rounded-lg border-2 text-left transition-all ${
                                selectedCategory === category.id
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-300 hover:border-blue-300 hover:bg-blue-25'
                              }`}
                            >
                              <div className="text-lg font-semibold mb-1">{category.label}</div>
                              <div className="text-sm text-gray-600">{category.desc}</div>
                            </button>
                          ))}
                        </div>

                        <div className="mb-6">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Maximum Budget (€)
                          </label>
                          <div className="flex items-center space-x-4">
                            <input
                              type="range"
                              min="200"
                              max="3000"
                              step="100"
                              value={maxBudget}
                              onChange={(e) => setMaxBudget(parseInt(e.target.value))}
                              className="flex-1"
                            />
                            <span className="text-lg font-semibold text-blue-600 min-w-[80px]">
                              €{maxBudget}
                            </span>
                          </div>
                        </div>

                        <Button
                          onClick={() => setFindProductStep(1)}
                          disabled={!canProceedToQuestions}
                          className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                          Next: Answer Questions
                        </Button>
                      </div>
                    )}

                    {/* Step 2: Questions */}
                    {findProductStep === 1 && selectedCategory && (
                      <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                        <h3 className="text-lg font-bold text-green-900 mb-4 text-center">
                          Step 2: Tell Us Your Preferences
                        </h3>
                        <p className="text-green-700 text-center mb-6">
                          Help us find the perfect {selectedCategory.replace('-', ' ')} for you
                        </p>
                        
                        <div className="space-y-6">
                          {getCurrentFindQuestions().map((question, index) => (
                            <Card key={question.id}>
                              <CardHeader>
                                <CardTitle className="text-base">
                                  Question {index + 1}: {question.label}
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-3">
                                  {question.options.map((option) => (
                                    <button
                                      key={option.id}
                                      onClick={() => handleFindAnswer(question.id, option.id)}
                                      className={`w-full p-3 text-left rounded-lg border-2 transition-all ${
                                        findAnswers[question.id] === option.id
                                          ? 'border-green-500 bg-green-50'
                                          : 'border-gray-300 hover:border-green-300'
                                      }`}
                                    >
                                      <div className="flex items-center">
                                        <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                                          findAnswers[question.id] === option.id
                                            ? 'border-green-500 bg-green-500'
                                            : 'border-gray-300'
                                        }`}>
                                          {findAnswers[question.id] === option.id && (
                                            <div className="w-full h-full rounded-full bg-white scale-50"></div>
                                          )}
                                        </div>
                                        <span className="font-medium">{option.label}</span>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>

                        <div className="mt-6 space-y-3">
                          <Button
                            onClick={() => setFindProductStep(0)}
                            variant="outline"
                            className="w-full"
                          >
                            Previous
                          </Button>
                          <Button
                            onClick={() => getRecommendations.mutate({ 
                              category: selectedCategory, 
                              answers: findAnswers, 
                              budget: maxBudget 
                            })}
                            disabled={!canProceedToResults || getRecommendations.isPending}
                            className="w-full bg-green-600 hover:bg-green-700"
                          >
                            {getRecommendations.isPending ? (
                              <div className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                                Finding Products...
                              </div>
                            ) : (
                              'Find My Perfect Product'
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="text-center mt-8">
                      <Button
                        onClick={resetFindProduct}
                        variant="outline"
                        className="text-gray-600 hover:text-gray-800"
                      >
                        Reset & Start Over
                      </Button>
                    </div>
                  </>
                ) : (
                  /* Recommendation Results */
                  <div className="space-y-6">
                    <div className="text-center">
                      <Button
                        onClick={resetFindProduct}
                        variant="outline"
                        className="mb-4"
                      >
                        Find Different Product
                      </Button>
                    </div>

                    {/* Search Summary */}
                    <Card className="border-blue-300 bg-blue-50">
                      <CardHeader>
                        <CardTitle className="flex items-center text-blue-800">
                          <CheckCircle className="w-5 h-5 mr-2" />
                          Search Results
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-blue-700 leading-relaxed">{recommendations.searchSummary}</p>
                      </CardContent>
                    </Card>

                    {/* Product Recommendations */}
                    <div className="grid gap-6">
                      {recommendations.recommendations.map((product, index) => (
                        <Card key={product.sku} className={`border-2 ${
                          index === 0 ? 'border-green-300 bg-green-50' : 'border-gray-200'
                        }`}>
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                {index === 0 && (
                                  <Badge className="bg-green-100 text-green-800 mb-2">
                                    🏆 Top Recommendation
                                  </Badge>
                                )}
                                <CardTitle className="text-lg">{product.name}</CardTitle>
                                <div className="flex items-center mt-2">
                                  <span className="text-2xl font-bold text-green-600">€{product.price}</span>
                                  {product.energyLabel && (
                                    <Badge variant="secondary" className="ml-3">
                                      Energy: {product.energyLabel}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              {product.image && (
                                <img 
                                  src={product.image} 
                                  alt={product.name}
                                  className="w-24 h-24 object-cover rounded-lg ml-4"
                                />
                              )}
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              {/* Reasons */}
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-2">Why this matches you:</h4>
                                <ul className="space-y-1">
                                  {product.reasons.map((reason, idx) => (
                                    <li key={idx} className="flex items-start">
                                      <span className="text-green-500 mr-2 flex-shrink-0">•</span>
                                      <span className="text-sm text-gray-700">{reason}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              {/* Rating */}
                              {product.rating && (
                                <div className="flex items-center">
                                  <span className="text-sm font-medium text-gray-600 mr-2">Rating:</span>
                                  <div className="flex">
                                    {[...Array(5)].map((_, i) => (
                                      <span
                                        key={i}
                                        className={`text-lg ${
                                          i < product.rating! ? 'text-yellow-400' : 'text-gray-300'
                                        }`}
                                      >
                                        ★
                                      </span>
                                    ))}
                                  </div>
                                  <span className="ml-2 text-sm text-gray-600">{product.rating}/5</span>
                                </div>
                              )}

                              {/* View Product Button */}
                              <div className="pt-2">
                                <a
                                  href={product.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center justify-center w-full px-4 py-2 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors"
                                >
                                  View on Harvey Norman
                                </a>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-3 sm:p-6 h-full flex flex-col">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 text-center px-2 flex-shrink-0">
                Product Comparison Tool
              </h2>
              <div className="flex-1 overflow-y-auto">
                {/* Electronic Product Comparison Steps */}
              {!productComparison ? (
                <>
                  {/* Progress Bar */}
                  <div className="mb-6">
                    <div className="flex justify-between text-sm text-gray-500 mb-2">
                      <span className={currentStep >= 0 ? 'text-purple-600 font-medium' : ''}>Category</span>
                      <span className={currentStep >= 1 ? 'text-purple-600 font-medium' : ''}>Models</span>
                      <span className={currentStep >= 2 ? 'text-purple-600 font-medium' : ''}>Questions</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${((currentStep + 1) / 3) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Step 1: Product Category */}
                  {currentStep === 0 && (
                    <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                      <h3 className="text-lg font-bold text-blue-900 mb-4 text-center">
                        Step 1: Select Product Category
                      </h3>
                      <p className="text-blue-700 text-center mb-6">
                        Choose the category that best matches the products you want to compare
                      </p>
                      
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Product Category
                        </label>
                        <select
                          value={productCategory}
                          onChange={(e) => setProductCategory(e.target.value)}
                          className="w-full px-4 py-3 bg-white border-2 border-purple-200 rounded-lg font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 hover:border-purple-300 transition-colors appearance-none bg-[url('data:image/svg+xml,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3e%3cpath stroke=%27%236b7280%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27m6 8 4 4 4-4%27/%3e%3c/svg%3e')] bg-[position:right_0.75rem_center] bg-[size:1.5em_1.5em] bg-no-repeat pr-10"
                        >
                          <option value="">Select a category...</option>
                          {productCategories.map((category) => (
                            <option key={category.value} value={category.value}>
                              {category.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Custom Category Input */}
                      {productCategory === 'other' && (
                        <div className="mb-6">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Custom Product Category
                          </label>
                          <Input
                            placeholder="e.g., Gaming Chairs, Air Purifiers, Smart Watches..."
                            value={customCategory}
                            onChange={(e) => setCustomCategory(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-purple-200 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 hover:border-purple-300 transition-colors"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Specify the type of products you want to compare
                          </p>
                        </div>
                      )}

                      <div className="text-center">
                        <Button
                          onClick={handleNextStep}
                          disabled={!canProceedFromCategory}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          Next: Enter Product Models
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Model Numbers */}
                  {currentStep === 1 && (
                    <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                      <h3 className="text-lg font-bold text-green-900 mb-4 text-center">
                        Step 2: Enter Product Model Numbers
                      </h3>
                      <p className="text-green-700 text-center mb-4">
                        Enter the exact model numbers or product codes for {productCategory === 'other' ? customCategory || 'your products' : productCategories.find(c => c.value === productCategory)?.label} you want to compare
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
                            placeholder={getPlaceholders().first}
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
                            placeholder={getPlaceholders().second}
                            value={product2}
                            onChange={(e) => setProduct2(e.target.value)}
                            className="w-full"
                          />
                        </div>
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
                          disabled={!canProceedFromModels}
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
                        Help us understand your specific needs for {productCategory === 'other' ? customCategory || 'your products' : productCategories.find(c => c.value === productCategory)?.label}
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
                  <div className="text-center mt-8">
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
          )}
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
              <Button
                onClick={() => {
                  if (productInfo || productComparison) {
                    window.location.href = "/consultation-booking";
                  }
                }}
                disabled={!productInfo && !productComparison}
                className={`px-4 py-2 font-medium rounded-lg transition-colors text-sm ${
                  productInfo || productComparison
                    ? "bg-orange-600 text-white hover:bg-orange-700"
                    : "bg-gray-400 text-gray-200 cursor-not-allowed"
                }`}
              >
                {productInfo || productComparison ? "Book Consultation" : "Use AI Tools First"}
              </Button>
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