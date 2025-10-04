import React from 'react';

interface PasswordStrengthProps {
  password: string;
}

interface PasswordStrengthResult {
  score: number;
  text: string;
  color: string;
}

const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password }) => {
  const getPasswordStrength = (password: string): PasswordStrengthResult => {
    if (!password) return { score: 0, text: '', color: 'gray' };
    
    let score = 0;
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      numbers: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    
    // Calculate score
    if (checks.length) score += 20;
    if (checks.lowercase) score += 20;
    if (checks.uppercase) score += 20;
    if (checks.numbers) score += 20;
    if (checks.special) score += 20;
    
    // Determine strength
    if (score < 40) return { score, text: 'Weak', color: 'red' };
    if (score < 60) return { score, text: 'Fair', color: 'orange' };
    if (score < 80) return { score, text: 'Good', color: 'blue' };
    return { score, text: 'Strong', color: 'green' };
  };

  const strength = getPasswordStrength(password);

  if (!password) return null;

  const getColorClasses = (color) => {
    switch (color) {
      case 'red': return { text: 'text-red-600', bg: 'bg-red-600' };
      case 'orange': return { text: 'text-orange-600', bg: 'bg-orange-600' };
      case 'blue': return { text: 'text-blue-600', bg: 'bg-blue-600' };
      case 'green': return { text: 'text-green-600', bg: 'bg-green-600' };
      default: return { text: 'text-gray-600', bg: 'bg-gray-600' };
    }
  };

  const colorClasses = getColorClasses(strength.color);

  return (
    <div className="mt-2">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>Password strength</span>
        <span className={`font-medium ${colorClasses.text}`}>
          {strength.text}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1">
        <div 
          className={`${colorClasses.bg} h-1 rounded-full transition-all duration-300`}
          style={{ width: `${strength.score}%` }}
        ></div>
      </div>
    </div>
  );
};

export default PasswordStrength;
