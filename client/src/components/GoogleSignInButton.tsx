import React, { useEffect } from 'react';
import useAuthStore from '../stores/authStore';
import { toast } from 'react-hot-toast';

// Modern Google Sign-In Component using ID Token verification
const GoogleSignInButton = ({ onSuccess, onError, disabled = false }) => {
  const { login } = useAuthStore();

  useEffect(() => {
    // Load Google Identity Services
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogleSignIn;
    document.head.appendChild(script);

    return () => {
      // Cleanup
      document.head.removeChild(script);
    };
  }, []);

  const initializeGoogleSignIn = () => {
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleGoogleSignIn,
        auto_select: false,
        cancel_on_tap_outside: true
      });
    }
  };

  const handleGoogleSignIn = async (response) => {
    try {
      const result = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/google/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          idToken: response.credential
        })
      });

      const data = await result.json();

      if (data.success) {
        // Update auth store
        login(data.user, data.accessToken);
        
        toast.success(data.message || 'Signed in successfully');
        
        if (onSuccess) {
          onSuccess(data);
        }
      } else {
        throw new Error(data.message || 'Google sign-in failed');
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      toast.error(error.message || 'Google sign-in failed');
      
      if (onError) {
        onError(error);
      }
    }
  };

  const handleButtonClick = () => {
    if (window.google) {
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // Fallback to popup
          window.google.accounts.id.renderButton(
            document.getElementById('g_id_signin'),
            {
              theme: 'outline',
              size: 'large',
              width: '100%'
            }
          );
        }
      });
    }
  };

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleButtonClick}
        disabled={disabled}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        <span className="text-sm font-medium">Continue with Google</span>
      </button>
      
      {/* Hidden div for Google button rendering */}
      <div id="g_id_signin" className="hidden"></div>
    </div>
  );
};

export default GoogleSignInButton;
