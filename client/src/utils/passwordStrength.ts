export interface PasswordStrengthResult {
  score: number; // 0-4 (0 = very weak, 4 = very strong)
  feedback: string;
  requirements: PasswordRequirement[];
  strength: 'very-weak' | 'weak' | 'fair' | 'good' | 'strong';
}

export interface PasswordRequirement {
  id: string;
  text: string;
  met: boolean;
  required: boolean;
}

export function calculatePasswordStrength(password: string): PasswordStrengthResult {
  const requirements: PasswordRequirement[] = [
    {
      id: 'length',
      text: 'At least 8 characters',
      met: password.length >= 8,
      required: true
    },
    {
      id: 'lowercase',
      text: 'Contains lowercase letter',
      met: /[a-z]/.test(password),
      required: false
    },
    {
      id: 'uppercase',
      text: 'Contains uppercase letter',
      met: /[A-Z]/.test(password),
      required: false
    },
    {
      id: 'number',
      text: 'Contains number',
      met: /\d/.test(password),
      required: false
    },
    {
      id: 'special',
      text: 'Contains special character (!@#$%^&*)',
      met: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      required: false
    }
  ];

  // Calculate score based on requirements met
  let score = 0;
  let strengthLevel: 'very-weak' | 'weak' | 'fair' | 'good' | 'strong' = 'very-weak';
  
  // Must meet minimum length requirement
  if (!requirements[0].met) {
    score = 0;
    strengthLevel = 'very-weak';
  } else {
    // Base score for meeting length requirement
    score = 1;
    
    // Add points for each additional requirement met
    const additionalRequirementsMet = requirements.slice(1).filter(req => req.met).length;
    score += additionalRequirementsMet;
    
    // Determine strength level
    if (score === 1) {
      strengthLevel = 'weak';
    } else if (score === 2) {
      strengthLevel = 'fair';
    } else if (score === 3) {
      strengthLevel = 'good';
    } else if (score >= 4) {
      strengthLevel = 'strong';
    }
  }

  // Generate feedback message
  let feedback = '';
  if (score === 0) {
    feedback = 'Password must be at least 8 characters long';
  } else if (score === 1) {
    feedback = 'Add uppercase, numbers, or special characters to strengthen';
  } else if (score === 2) {
    feedback = 'Good start! Add more character types for better security';
  } else if (score === 3) {
    feedback = 'Strong password! Consider adding more variety';
  } else {
    feedback = 'Excellent! Your password is very strong';
  }

  return {
    score,
    feedback,
    requirements,
    strength: strengthLevel
  };
}

export function getStrengthColor(strength: string): string {
  switch (strength) {
    case 'very-weak':
      return 'bg-red-500';
    case 'weak':
      return 'bg-orange-500';
    case 'fair':
      return 'bg-yellow-500';
    case 'good':
      return 'bg-blue-500';
    case 'strong':
      return 'bg-green-500';
    default:
      return 'bg-gray-300';
  }
}

export function getStrengthTextColor(strength: string): string {
  switch (strength) {
    case 'very-weak':
      return 'text-red-600';
    case 'weak':
      return 'text-orange-600';
    case 'fair':
      return 'text-yellow-600';
    case 'good':
      return 'text-blue-600';
    case 'strong':
      return 'text-green-600';
    default:
      return 'text-gray-600';
  }
}