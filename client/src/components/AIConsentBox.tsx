import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Link } from 'wouter';
import { Shield, Info } from 'lucide-react';

interface AIConsentBoxProps {
  onConsentChange: (hasConsent: boolean) => void;
  className?: string;
}

export default function AIConsentBox({ onConsentChange, className = "" }: AIConsentBoxProps) {
  const [isChecked, setIsChecked] = useState(false);

  const handleConsentChange = (checked: boolean) => {
    setIsChecked(checked);
    onConsentChange(checked);
  };

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start space-x-3">
        <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <Checkbox
              id="ai-consent"
              checked={isChecked}
              onCheckedChange={handleConsentChange}
              className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
            />
            <label 
              htmlFor="ai-consent" 
              className="text-sm font-medium text-blue-900 cursor-pointer"
            >
              I consent to using AI assistance for product recommendations
            </label>
          </div>
          
          <div className="text-xs text-blue-700 space-y-1">
            <p className="flex items-start">
              <Info className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
              <span>
                This AI tool uses OpenAI and Perplexity services to analyze your preferences and provide personalized product recommendations. 
                No personal data is stored, and the AI has no malicious capabilities.
              </span>
            </p>
            <p className="ml-4">
              <Link href="/ai-privacy-policy" className="text-blue-600 hover:text-blue-800 underline">
                Learn more about our AI tools and data usage
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}