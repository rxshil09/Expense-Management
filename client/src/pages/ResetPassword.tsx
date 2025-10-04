import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowLeft, Lock } from 'lucide-react';

import { resetPasswordSchema } from '../schemas/authSchemas';
import { authService } from '../services/authService';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import PasswordInput from '../components/ui/PasswordInput';
import PasswordStrength from '../components/ui/PasswordStrength';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<any>({
    resolver: yupResolver(resetPasswordSchema),
  });

  const password = watch('password');

  const resetPasswordMutation = useMutation({
    mutationFn: ({ token, password }: { token: string; password: string }) => authService.resetPassword(token, password),
    onSuccess: (data) => {
      toast.success(data.message || 'Password reset successful!');
      navigate('/login', { 
        state: { 
          message: 'Your password has been reset successfully. Please log in with your new password.' 
        }
      });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to reset password';
      toast.error(message);
    },
  });

  const onSubmit = (data: any) => {
    if (!token) {
      toast.error('Invalid reset token');
      return;
    }
    resetPasswordMutation.mutate({ token, password: data.password });
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Invalid Reset Link
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              This password reset link is invalid or has expired.
            </p>
            <div className="mt-6">
              <Link
                to="/forgot-password"
                className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-500"
              >
                Request a new reset link
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Reset your password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your new password below
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <PasswordInput
                {...register('password')}
                placeholder="New password"
                error={errors.password?.message as string}
              />
            </div>

            {password && <PasswordStrength password={password} />}

            <div>
              <PasswordInput
                {...register('confirmPassword')}
                placeholder="Confirm new password"
                error={errors.confirmPassword?.message as string}
              />
            </div>
          </div>

          <div>
            <Button
              type="submit"
              disabled={resetPasswordMutation.isPending}
              className="w-full"
            >
              {resetPasswordMutation.isPending ? (
                <LoadingSpinner size="sm" />
              ) : (
                'Reset Password'
              )}
            </Button>
          </div>

          <div className="text-center">
            <Link
              to="/login"
              className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-500"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
