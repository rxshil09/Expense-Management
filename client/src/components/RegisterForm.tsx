import React from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { User, Mail, ArrowLeft } from "lucide-react";

import { registerSchema } from "../schemas/authSchemas";
import { authService } from "../services/authService";
import useAuthStore from "../stores/authStore";
import Button from "./ui/Button";
import LoadingSpinner from "./ui/LoadingSpinner";
import PasswordStrength from "./ui/PasswordStrength";
import PasswordInput from "./ui/PasswordInput";
import CustomCheckbox from "./ui/CustomCheckbox";
import GoogleSignInButton from "./GoogleSignInButton";
import { formatError } from "../utils/index";

interface FormData {
  name?: string;
  email?: string;
  rememberMe?: boolean;
}

const RegisterForm = () => {
  const [formData, setFormData] = React.useState<FormData>({});
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(registerSchema),
  });

  const password = watch("password");

  const registerMutation = useMutation({
    mutationFn: authService.register,
    onSuccess: (data) => {
      toast.success("Verification code sent to your email!");
      navigate("/verify-email", { 
        state: { 
          email: data.email,
          name: data.name || formData.name,
          rememberMe: formData.rememberMe 
        } 
      });
    },
    onError: (error) => {
      toast.error(formatError(error));
    },
  });

  const onSubmit = (data: any) => {
    setFormData(data); // Store form data for passing to verification
    registerMutation.mutate(data);
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

      <div className="max-w-md w-full space-y-6 sm:space-y-8 p-6 sm:p-8 bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl border border-white/20 mt-12 sm:mt-0">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Create your account</h2>
          <p className="text-sm sm:text-base text-gray-600">Join us to get started</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Full name
              </label>
              <input
                {...register("name")}
                type="text"
                id="name"
                autoComplete="name"
                placeholder="Enter your full name"
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 placeholder-gray-500"
              />
              {errors.name && (
                <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-red-600">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Email address
              </label>
              <input
                {...register("email")}
                type="email"
                id="email"
                autoComplete="email"
                placeholder="Enter your email"
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 placeholder-gray-500"
              />
              {errors.email && (
                <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <PasswordInput
                {...register("password")}
                id="password"
                label="Password"
                placeholder="Enter your password"
                autoComplete="new-password"
                error={errors.password?.message}
              />
              <PasswordStrength password={password} />
            </div>

            <div>
              <PasswordInput
                {...register("confirmPassword")}
                id="confirmPassword"
                label="Confirm password"
                placeholder="Confirm your password"
                autoComplete="new-password"
                error={errors.confirmPassword?.message}
              />
            </div>
          </div>

          {/* Remember me */}
          <div className="flex items-center justify-between">
            <CustomCheckbox
              id="rememberMe"
              label="Remember me for 30 days"
              register={register}
              className="text-xs sm:text-sm"
            />
          </div>

          <CustomCheckbox
            id="terms"
            label={
              <>
                I agree to the{" "}
                <a href="#" className="text-blue-600 hover:text-blue-500">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="text-blue-600 hover:text-blue-500">
                  Privacy Policy
                </a>
              </>
            }
            required
            className="text-xs sm:text-sm"
          />

          <Button
            type="submit"
            className="w-full py-3 sm:py-3.5 px-4 text-sm sm:text-base rounded-lg sm:rounded-xl transition-all duration-200"
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Creating account...
              </>
            ) : (
              "Create account"
            )}
          </Button>
        </form>

        <div className="relative my-4 sm:my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-xs sm:text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        <GoogleSignInButton
          onSuccess={(data) => {
            toast.success("Signed up with Google successfully!");
            setAuth(data.user, data.accessToken);
            navigate("/dashboard");
          }}
          onError={(error) => {
            toast.error("Google signup failed: " + (error.message || "Unknown error"));
          }}
          disabled={registerMutation.isPending}
        />

        <div className="text-center mt-4 sm:mt-6">
          <span className="text-xs sm:text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              to="/signin"
              className="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200"
            >
              Sign in
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;
