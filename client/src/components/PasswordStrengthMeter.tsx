import React from 'react';
import { Check, X } from 'lucide-react';
import { 
  calculatePasswordStrength, 
  getStrengthColor, 
  getStrengthTextColor,
  PasswordStrengthResult 
} from '@/utils/passwordStrength';

interface PasswordStrengthMeterProps {
  password: string;
  showRequirements?: boolean;
  className?: string;
}

export function PasswordStrengthMeter({ 
  password, 
  showRequirements = true,
  className = '' 
}: PasswordStrengthMeterProps) {
  const result = calculatePasswordStrength(password);
  
  if (!password) {
    return null;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Strength Bar */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-xs font-medium text-gray-700">Password Strength</span>
          <span className={`text-xs font-medium capitalize ${getStrengthTextColor(result.strength)}`}>
            {result.strength.replace('-', ' ')}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor(result.strength)}`}
            style={{ width: `${(result.score / 4) * 100}%` }}
          />
        </div>
        <p className={`text-xs ${getStrengthTextColor(result.strength)}`}>
          {result.feedback}
        </p>
      </div>

      {/* Requirements List */}
      {showRequirements && (
        <div className="space-y-1">
          <span className="text-xs font-medium text-gray-700">Requirements:</span>
          <div className="space-y-1">
            {result.requirements.map((req) => (
              <div key={req.id} className="flex items-center space-x-2">
                {req.met ? (
                  <Check className="w-3 h-3 text-green-500" />
                ) : (
                  <X className="w-3 h-3 text-gray-400" />
                )}
                <span className={`text-xs ${req.met ? 'text-green-600' : 'text-gray-500'}`}>
                  {req.text}
                  {req.required && <span className="text-red-500 ml-1">*</span>}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface PasswordMatchIndicatorProps {
  password: string;
  confirmPassword: string;
  showMatch?: boolean;
}

export function PasswordMatchIndicator({ 
  password, 
  confirmPassword, 
  showMatch = true 
}: PasswordMatchIndicatorProps) {
  if (!password || !confirmPassword || !showMatch) {
    return null;
  }

  const isMatch = password === confirmPassword;
  
  return (
    <div className="flex items-center space-x-2 mt-1">
      {isMatch ? (
        <Check className="w-4 h-4 text-green-500" />
      ) : (
        <X className="w-4 h-4 text-red-500" />
      )}
      <span className={`text-xs ${isMatch ? 'text-green-600' : 'text-red-500'}`}>
        {isMatch ? 'Passwords match' : 'Passwords do not match'}
      </span>
    </div>
  );
}