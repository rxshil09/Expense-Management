// Type definitions for Google One Tap
declare global {
  interface Window {
    google?: any;
  }

  interface ImportMeta {
    env: {
      VITE_GOOGLE_CLIENT_ID: string;
      VITE_API_URL: string;
      [key: string]: any;
    };
  }
}

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Shield, Unlink, Link as LinkIcon, AlertTriangle } from 'lucide-react';
import Button from './ui/Button';
import useAuthStore from '../stores/authStore';

interface Provider {
  type: string;
  linked: boolean;
  linkedAt?: string;
  sub?: string;
  email?: string;
}

interface User {
  providers?: Provider[];
  [key: string]: any;
}

const ProviderManagement: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const [isLinking, setIsLinking] = useState<boolean>(false);
  const [unlinkingProvider, setUnlinkingProvider] = useState<string | null>(null);

  const providers = user?.providers || [];
  const hasGoogle = providers.some(p => p.type === 'google');
  const hasPassword = providers.some(p => p.type === 'password');
  const providerCount = providers.length;

  const handleLinkGoogle = async () => {
    // Prevent linking if Google is already linked
    if (hasGoogle) {
      toast.error('Google account is already linked to this account');
      return;
    }

    setIsLinking(true);
    
    try {
      // Wait for Google Sign-In to load if not available
      const waitForGoogle = () => {
        return new Promise<void>((resolve, reject) => {
          if (window.google) {
            console.log('Google Sign-In already loaded');
            resolve();
            return;
          }
          
          console.log('Waiting for Google Sign-In to load...');
          // Wait up to 5 seconds for Google to load
          let attempts = 0;
          const checkGoogle = () => {
            attempts++;
            if (window.google) {
              console.log('Google Sign-In loaded successfully');
              resolve();
            } else if (attempts >= 50) { // 50 * 100ms = 5 seconds
              reject(new Error('Google Sign-In failed to load. Please refresh the page and try again.'));
            } else {
              setTimeout(checkGoogle, 100);
            }
          };
          checkGoogle();
        });
      };

      await waitForGoogle();

      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: async (response) => {
          try {
            const result = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/providers/link/google`, {
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
              setUser(data.user);
              toast.success('Google account linked successfully');
            } else if (data.code === 'GOOGLE_ACCOUNT_ALREADY_LINKED') {
              toast.error('This Google account is already linked to another user');
            } else if (data.code === 'EMAIL_ALREADY_VERIFIED_ELSEWHERE') {
              toast.error('This email is already verified on another account');
            } else {
              throw new Error(data.message || 'Failed to link Google account');
            }
          } catch (error) {
            console.error('Google linking error:', error);
            toast.error(error.message || 'Failed to link Google account');
          } finally {
            setIsLinking(false);
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
        use_fedcm_for_prompt: false // Disable FedCM to avoid CORS issues
      });

      // Use renderButton instead of prompt to avoid FedCM issues
      const buttonContainer = document.createElement('div');
      buttonContainer.id = 'google-signin-button';
      document.body.appendChild(buttonContainer);

      window.google.accounts.id.renderButton(buttonContainer, {
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        width: 250
      });

      // Trigger click programmatically and clean up
      setTimeout(() => {
        const button = buttonContainer.querySelector('div');
        if (button) {
          button.click();
        }
        // Clean up the temporary button container
        setTimeout(() => {
          if (document.body.contains(buttonContainer)) {
            document.body.removeChild(buttonContainer);
          }
        }, 1000);
      }, 100);
    } catch (error) {
      console.error('Google initialization error:', error);
      toast.error('Failed to initialize Google Sign-In');
      setIsLinking(false);
    }
  };

  const handleUnlinkProvider = async (type: string, sub: string | null = null) => {
    if (providerCount <= 1) {
      toast.error('Cannot unlink the last authentication method. Please add another sign-in method first.');
      return;
    }

    setUnlinkingProvider(type);

    try {
      const url = `${import.meta.env.VITE_API_URL}/api/auth/providers/${type}${sub ? `?sub=${sub}` : ''}`;
      
      const result = await fetch(url, {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await result.json();

      if (data.success) {
        setUser(data.user);
        toast.success(`${type} provider unlinked successfully`);
      } else {
        throw new Error(data.message || 'Failed to unlink provider');
      }
    } catch (error) {
      console.error('Unlink error:', error);
      toast.error(error.message || 'Failed to unlink provider');
    } finally {
      setUnlinkingProvider(null);
    }
  };

  const getProviderIcon = (type: string) => {
    switch (type) {
      case 'google':
        return (
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
        );
      case 'password':
        return <Shield className="w-5 h-5" />;
      case 'email-otp':
        return <Shield className="w-5 h-5" />;
      default:
        return <Shield className="w-5 h-5" />;
    }
  };

  const getProviderLabel = (provider: Provider) => {
    switch (provider.type) {
      case 'google':
        return `Google${provider.email ? ` (${provider.email})` : ''}`;
      case 'password':
        return 'Password';
      case 'email-otp':
        return 'Email Verification';
      default:
        return provider.type;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Connected Accounts
        </h3>
        
        {providerCount <= 1 && (
          <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-amber-800">Security Notice</h4>
                <p className="text-sm text-amber-700 mt-1">
                  You have only one sign-in method. Consider adding another method to ensure you don't lose access to your account.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {/* Connected Providers */}
        {providers.map((provider, index) => (
          <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border border-gray-200 rounded-lg space-y-3 sm:space-y-0">
            <div className="flex items-center gap-3">
              <div className="text-gray-500 shrink-0">
                {getProviderIcon(provider.type)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 text-sm sm:text-base">
                  {getProviderLabel(provider)}
                </p>
                <p className="text-xs sm:text-sm text-gray-500">
                  Connected {new Date(provider.linkedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleUnlinkProvider(provider.type, provider.sub)}
              disabled={providerCount <= 1 || unlinkingProvider === provider.type}
              className="flex items-center justify-center gap-2 text-red-600 border-red-200 hover:bg-red-50 w-full sm:w-auto text-xs sm:text-sm"
            >
              <Unlink className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>{unlinkingProvider === provider.type ? 'Unlinking...' : 'Unlink'}</span>
            </Button>
          </div>
        ))}

        {/* Available Providers to Link */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 text-sm sm:text-base">Add Authentication Method</h4>
          
          {!hasGoogle && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border border-gray-200 rounded-lg space-y-3 sm:space-y-0">
              <div className="flex items-center gap-3">
                <div className="text-gray-400 shrink-0">
                  {getProviderIcon('google')}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 text-sm sm:text-base">Google</p>
                  <p className="text-xs sm:text-sm text-gray-500">
                    Sign in with your Google account
                  </p>
                </div>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Use server-side OAuth redirect for linking
                  window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/google?action=link`;
                }}
                disabled={isLinking}
                className="flex items-center justify-center gap-2 w-full sm:w-auto text-xs sm:text-sm"
              >
                <LinkIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Link Google Account</span>
              </Button>
            </div>
          )}

          {!hasPassword && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border border-gray-200 rounded-lg space-y-3 sm:space-y-0">
              <div className="flex items-center gap-3">
                <div className="text-gray-400 shrink-0">
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 text-sm sm:text-base">Password</p>
                  <p className="text-xs sm:text-sm text-gray-500">
                    Set up a password for your account
                  </p>
                </div>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Navigate to password setup
                  toast('Password setup coming soon', { icon: 'ℹ️' });
                }}
                className="flex items-center justify-center gap-2 w-full sm:w-auto text-xs sm:text-sm"
              >
                <LinkIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Set Password</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProviderManagement;
