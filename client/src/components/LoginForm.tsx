import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import useAuthStore from '../stores/authStore';
import Button from './ui/Button';
import LoadingSpinner from './ui/LoadingSpinner';
import PasswordInput from './ui/PasswordInput';
import CustomCheckbox from './ui/CustomCheckbox';

const loginSchema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().required('Password is required'),
  rememberMe: yup.boolean(),
});

const LoginForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuthStore();
  const [showPasswordNotSetMessage, setShowPasswordNotSetMessage] = useState(false);
  const [userEmailForPasswordSetup, setUserEmailForPasswordSetup] = useState('');

  // Show success message if redirected from password reset
  useEffect(() => {
    if (location.state?.message) {
      toast.success(location.state.message);
      // Clear the state to prevent showing the message again
      navigate(location.pathname, { replace: true });
    }

    // Handle OAuth errors
    const urlParams = new URLSearchParams(location.search);
    const error = urlParams.get('error');
    if (error) {
      switch (error) {
        case 'oauth_error':
          toast.error('Google authentication failed');
          break;
        case 'oauth_failed':
          toast.error('Authentication was cancelled or failed');
          break;
        case 'server_error':
          toast.error('Server error during authentication');
          break;
        default:
          toast.error('Authentication failed');
      }
      // Clear the error from URL
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  const { register, handleSubmit, formState: { errors } } = useForm<{
    email: string;
    password: string;
    rememberMe?: boolean;
  }>({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      rememberMe: false,
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string; rememberMe?: boolean }) => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const error = new Error(errorData.message || 'Login failed');
        // Attach the full error data for better debugging
        (error as any).errorData = errorData;
        throw error;
      }

      return response.json();
    },
    onSuccess: (data) => {
      login(data.user, data.accessToken);
      navigate('/dashboard');
    },
    onError: (error: any, variables: { email: string; password: string; rememberMe?: boolean }) => {
      console.error('Login error:', error);
      console.error('Error data:', (error as any).errorData);
      
      // Check if this is a "password not set" error using both message and code
      const errorData = (error as any).errorData;
      if (error.message?.includes('Password not set for this account') || 
          error.message?.includes('Please use Google sign-in or set up a password') ||
          errorData?.code === 'PASSWORD_NOT_SET') {
        setShowPasswordNotSetMessage(true);
        setUserEmailForPasswordSetup(variables.email);
      } else {
        setShowPasswordNotSetMessage(false);
        setUserEmailForPasswordSetup('');
      }
    },
  });

  const onSubmit = (data: { email: string; password: string; rememberMe?: boolean }) => {
    // Reset the password not set message when submitting
    setShowPasswordNotSetMessage(false);
    setUserEmailForPasswordSetup('');
    loginMutation.mutate(data);
  };

  const handleGoogleLogin = () => {
    // Redirect to Google OAuth
    window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/google`;
  };

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

      <div className="max-w-md w-full space-y-6 sm:space-y-8 p-6 sm:p-8 bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl border border-white/20">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Welcome back</h2>
          <p className="text-sm sm:text-base text-gray-600">Sign in to your account to continue</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Email address
              </label>
              <input
                {...register('email')}
                type="email"
                id="email"
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 placeholder-gray-500"
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-red-600">{errors.email.message as string}</p>
              )}
            </div>

            <div>
              <PasswordInput
                {...register('password')}
                id="password"
                label="Password"
                placeholder="Enter your password"
                error={errors.password?.message as string}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <CustomCheckbox
              id="rememberMe"
              label="Remember me for 30 days"
              register={register}
              className="text-xs sm:text-sm"
            />
            <Link to="/forgot-password" className="text-xs sm:text-sm text-blue-600 hover:text-blue-500 transition-colors duration-200 self-start sm:self-auto">
              Forgot password?
            </Link>
          </div>

          {loginMutation.error && (
            <div className="space-y-4">
              {showPasswordNotSetMessage ? (
                <div className="p-4 text-sm bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-start space-x-2">
                    <svg className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1">
                      <h4 className="font-medium text-blue-900 mb-2">No password set for this account</h4>
                      <p className="text-blue-800 mb-3">
                        You previously signed up using Google. Choose one of the options below:
                      </p>
                      <div className="space-y-2">
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Link
                            to="/forgot-password"
                            state={{ email: userEmailForPasswordSetup }}
                            className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200"
                          >
                            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-6 6c-3 0-5.197-1.756-5.197-4C9.803 9.756 12 8 15 8a6 6 0 016 6m-6 0a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            Set up a password
                          </Link>
                          <button
                            type="button"
                            onClick={handleGoogleLogin}
                            className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 border border-blue-300 rounded-lg transition-colors duration-200"
                          >
                            <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            Continue with Google
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 sm:p-4 text-xs sm:text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg sm:rounded-xl">
                  {loginMutation.error.message}
                </div>
              )}
            </div>
          )}

          <Button
            type="submit"
            variant="white"
            className="w-full font-semibold py-3 sm:py-3.5 px-4 text-sm sm:text-base rounded-lg sm:rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg flex items-center justify-center group"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign in</span>
                <svg className="h-4 w-4 sm:h-5 sm:w-5 ml-2 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4m-5-4l4-4m0 0l-4-4m4 4H3" />
                </svg>
              </>
            )}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-xs sm:text-sm">
              <span className="px-3 sm:px-4 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <Button
            type="button"
            variant="white"
            onClick={handleGoogleLogin}
            className="w-full font-medium py-3 sm:py-3.5 px-4 text-sm sm:text-base rounded-lg sm:rounded-xl transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center group"
          >
            <svg className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 group-hover:scale-110 transition-transform duration-200" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Continue with Google</span>
          </Button>
        </form>

        <div className="text-center">
          <p className="text-xs sm:text-sm text-gray-600">
            Don't have an account?{' '}
            <a href="/signup" className="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
