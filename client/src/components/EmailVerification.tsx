import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, Shield, RotateCcw } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { authService } from '../services/authService';
import useAuthStore from '../stores/authStore';
import { formatError } from '../utils/errorUtils';
import Button from './ui/Button';
import LoadingSpinner from './ui/LoadingSpinner';

const EmailVerification = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuthStore();

  // Get email from location state or redirect if not available
  const email = location.state?.email;
  const name = location.state?.name;

  useEffect(() => {
    if (!email) {
      navigate('/signup');
      return;
    }

    // Start countdown timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [email, navigate]);

  // Focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const verifyMutation = useMutation({
    mutationFn: (data: { email: string; otp: string; rememberMe: boolean }) => authService.verifyEmail(data),
    onSuccess: (data) => {
      login(data.user, data.accessToken);
      toast.success('Email verified successfully!');
      navigate('/dashboard');
    },
    onError: (error) => {
      toast.error(formatError(error));
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    },
  });

  const resendMutation = useMutation({
    mutationFn: () => authService.resendOTP({ email }),
    onSuccess: () => {
      toast.success('New verification code sent!');
      setTimeLeft(600); // Reset timer
      setOtp(['', '', '', '', '', '']); // Clear current OTP
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    },
    onError: (error) => {
      toast.error(formatError(error));
    },
  });

  const handleInputChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const pastedCode = value.slice(0, 6).split('');
      const newOtp = [...otp];
      pastedCode.forEach((char, i) => {
        if (index + i < 6) {
          newOtp[index + i] = char;
        }
      });
      setOtp(newOtp);
      
      // Focus last filled input or submit if complete
      const lastFilledIndex = Math.min(index + pastedCode.length - 1, 5);
      if (inputRefs.current[lastFilledIndex]) {
        inputRefs.current[lastFilledIndex]?.focus();
      }
      
      // Auto-submit if complete
      if (newOtp.every(digit => digit !== '')) {
        handleSubmit(newOtp);
      }
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Move to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all fields are filled
    if (newOtp.every(digit => digit !== '')) {
      handleSubmit(newOtp);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    
    if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleSubmit = (otpArray: string[] = otp) => {
    const otpString = otpArray.join('');
    if (otpString.length !== 6) {
      toast.error('Please enter the complete 6-digit code');
      return;
    }

    verifyMutation.mutate({
      email,
      otp: otpString,
      rememberMe: location.state?.rememberMe || false,
    });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleResend = () => {
    if (timeLeft > 0) return;
    resendMutation.mutate();
  };

  if (!email) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4 sm:px-6 lg:px-8">
      {/* Back to Home Link */}
      <Link
        to="/"
        className="absolute top-4 sm:top-6 left-4 sm:left-6 flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200 z-10"
      >
        <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
        <span className="text-sm sm:text-base">Back to home</span>
      </Link>

      <div className="max-w-md w-full space-y-6 sm:space-y-8 p-6 sm:p-8 bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl border border-white/20 mt-12 sm:mt-0">
        <div className="text-center">
          <div className="flex justify-center mb-3 sm:mb-4">
            <Shield className="h-10 w-10 sm:h-12 sm:w-12 text-blue-600" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Verify your email</h2>
          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">Enter the 6-digit code sent to your email</p>
        </div>

        <div className="bg-gray-50 rounded-lg sm:rounded-xl p-4 sm:p-6 text-center">
          <p className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">We sent a verification code to</p>
          <p className="text-sm sm:text-base font-semibold text-gray-900">{email}</p>
        </div>

        <div className="space-y-4 sm:space-y-6">
          <div>
            <label className="block text-sm sm:text-base font-medium text-gray-700 mb-3 sm:mb-4">
              Verification Code
            </label>
            <div className="flex gap-2 sm:gap-3 justify-center">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleInputChange(index, e.target.value.replace(/\D/g, ''))}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-10 h-10 sm:w-12 sm:h-12 text-center text-lg sm:text-xl font-bold border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900"
                  disabled={verifyMutation.isPending}
                />
              ))}
            </div>
          </div>

          <div className="text-center">
            <div className="flex justify-center gap-1 mb-3 sm:mb-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    otp[index] ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>

          <Button
            onClick={() => handleSubmit()}
            className="w-full py-3 sm:py-4 text-sm sm:text-base"
            disabled={verifyMutation.isPending || otp.some(digit => !digit)}
          >
            {verifyMutation.isPending ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                <span className="text-sm sm:text-base">Verifying...</span>
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                <span className="text-sm sm:text-base">Verify Email</span>
              </>
            )}
          </Button>

          <div className="text-center space-y-3 sm:space-y-4">
            <p className="text-xs sm:text-sm text-gray-600">
              Didn't receive the code?
            </p>
            
            {timeLeft > 0 ? (
              <p className="text-xs sm:text-sm text-gray-500">
                Resend in {formatTime(timeLeft)}
              </p>
            ) : (
              <button
                onClick={handleResend}
                disabled={resendMutation.isPending}
                className="text-blue-600 hover:text-blue-500 font-medium text-xs sm:text-sm transition-colors duration-200 flex items-center justify-center gap-2"
              >
                {resendMutation.isPending ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span className="text-xs sm:text-sm">Sending...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="text-xs sm:text-sm">Resend Code</span>
                  </>
                )}
              </button>
            )}

            <div className="border-t border-gray-200 pt-3 sm:pt-4">
              <p className="text-xs sm:text-sm text-gray-500 mb-1 sm:mb-2">
                Check your spam folder if you don't see the email
              </p>
              <p className="text-xs sm:text-sm text-gray-500">
                The code will expire in 10 minutes
              </p>
            </div>

            <div className="text-center">
              <span className="text-sm text-gray-600">
                Want to use a different email?{' '}
                <Link
                  to="/signup"
                  className="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200"
                >
                  Sign up again
                </Link>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;
