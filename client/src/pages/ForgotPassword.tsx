import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowLeft, Mail } from 'lucide-react';

import { forgotPasswordSchema } from '../schemas/authSchemas';
import { authService } from '../services/authService';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const ForgotPassword = () => {
  const location = useLocation();
  const [emailSent, setEmailSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  // Get pre-filled email from location state (if coming from login form)
  const preFilledEmail = location.state?.email || '';

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<any>({
    resolver: yupResolver(forgotPasswordSchema),
    defaultValues: {
      email: preFilledEmail
    }
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: authService.forgotPassword,
    onSuccess: (data) => {
      toast.success(data.message || 'Password reset email sent successfully!');
      setEmailSent(true);
      setSentEmail(getValues('email'));
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to send reset email';
      toast.error(message);
    },
  });

  const onSubmit = (data: any) => {
    forgotPasswordMutation.mutate(data.email);
  };

  const handleResendEmail = () => {
    forgotPasswordMutation.mutate(sentEmail);
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-6 sm:space-y-8 p-6 sm:p-8 bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl border border-white/20">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 sm:h-12 sm:w-12 bg-green-100 rounded-full flex items-center justify-center">
              <Mail className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
            </div>
            <h2 className="mt-4 sm:mt-6 text-2xl sm:text-3xl font-bold text-gray-900">
              Check your email
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              We've sent a password reset link to
            </p>
            <p className="font-medium text-indigo-600 text-sm sm:text-base break-all">{sentEmail}</p>
          </div>

          <div className="space-y-4">
            <p className="text-xs sm:text-sm text-gray-600 text-center">
              Didn't receive the email? Check your spam folder or try again.
            </p>
            
            <Button
              onClick={handleResendEmail}
              disabled={forgotPasswordMutation.isPending}
              variant="outline"
              className="w-full py-2.5 sm:py-3 text-sm sm:text-base"
            >
              {forgotPasswordMutation.isPending ? (
                <LoadingSpinner size="sm" />
              ) : (
                'Resend Email'
              )}
            </Button>

            <div className="text-center">
              <Link
                to="/login"
                className="inline-flex items-center text-xs sm:text-sm text-indigo-600 hover:text-indigo-500 transition-colors duration-200"
              >
                <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                Back to login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4 sm:px-6 lg:px-8">
      {/* Back to Login Link */}
      <Link
        to="/signin"
        className="absolute top-4 sm:top-6 left-4 sm:left-6 flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200 z-10"
      >
        <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
        <span className="text-sm sm:text-base">Back to login</span>
      </Link>

      <div className="max-w-md w-full space-y-6 sm:space-y-8 p-6 sm:p-8 bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl border border-white/20 mt-12 sm:mt-0">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-2">
            {preFilledEmail ? 'Set up your password' : 'Forgot your password?'}
          </h2>
          <p className="text-sm sm:text-base text-gray-600 text-center">
            {preFilledEmail 
              ? 'We\'ll send you a link to set up a password for your account.'
              : 'Enter your email address and we\'ll send you a link to reset your password.'
            }
          </p>
          {preFilledEmail && (
            <div className="mt-4 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs sm:text-sm text-blue-800 text-center">
                Setting up a password will allow you to sign in using either your email/password or Google in the future.
              </p>
            </div>
          )}
        </div>

        <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <Input
              {...register('email')}
              type="email"
              placeholder="Enter your email address"
              error={errors.email?.message as string}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 placeholder-gray-500"
            />
          </div>

          <div>
            <Button
              type="submit"
              disabled={forgotPasswordMutation.isPending}
              className="w-full font-semibold py-3 sm:py-3.5 px-4 text-sm sm:text-base rounded-lg sm:rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg"
            >
              {forgotPasswordMutation.isPending ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  <span>Sending...</span>
                </>
              ) : (
                preFilledEmail ? 'Send Password Setup Link' : 'Send Reset Link'
              )}
            </Button>
          </div>

          <div className="text-center">
            <Link
              to="/signin"
              className="inline-flex items-center text-xs sm:text-sm text-indigo-600 hover:text-indigo-500 transition-colors duration-200"
            >
              <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              Back to login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
