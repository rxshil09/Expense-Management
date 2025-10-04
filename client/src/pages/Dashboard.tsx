import React, { useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { LogOut, User, Settings, Shield, Clock, UserCircle } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import useAuthStore from '../stores/authStore';
import { authService } from '../services/authService';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, clearAuth } = useAuthStore();

  // Handle OAuth success
  useEffect(() => {
    const authStatus = searchParams.get('auth');
    if (authStatus === 'success') {
      toast.success('Successfully signed in with Google!');
      // Clear the search params
      setSearchParams({});
      
      // Fetch user data since OAuth uses cookies, not localStorage tokens
      const fetchUserAfterOAuth = async () => {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/me`, {
            credentials: 'include', // Important: include cookies
          });
          const data = await response.json();
          
          if (data.success) {
            // Set user in auth store (OAuth uses cookies, so no token needed in localStorage)
            useAuthStore.getState().setUser(data.user);
          }
        } catch (error) {
          console.error('Error fetching user after OAuth:', error);
        }
      };
      
      fetchUserAfterOAuth();
    }
  }, [searchParams, setSearchParams]);

  // Check if user is remembered (has remember me cookie)
  const isRemembered = document.cookie.includes('rememberMe=true');

  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      clearAuth();
      toast.success('Logged out successfully');
      navigate('/');
    },
    onError: (error) => {
      console.error('Logout error:', error);
      // Clear auth anyway on error
      clearAuth();
      toast.success('Logged out successfully');
      navigate('/');
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 lg:py-6">
            <div className="flex items-center">
              <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 mr-2" />
              <span className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Dashboard</span>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <span className="text-sm sm:text-base text-gray-700 hidden sm:inline">
                Welcome, {user?.name}
              </span>
              <span className="text-sm text-gray-700 sm:hidden">
                {user?.name?.split(' ')[0]}
              </span>
              <Link
                to="/profile"
                className="flex items-center space-x-1 sm:space-x-2 text-gray-600 hover:text-blue-600 transition-colors p-2 sm:p-1 rounded-md hover:bg-gray-100"
              >
                <UserCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden md:block text-sm">Profile</span>
              </Link>
              <Button 
                variant="outline" 
                onClick={handleLogout} 
                disabled={logoutMutation.isPending}
                className="text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
              >
                {logoutMutation.isPending ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Logging out...</span>
                    <span className="sm:hidden">...</span>
                  </>
                ) : (
                  <>
                    <LogOut className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Logout</span>
                    <span className="sm:hidden">Exit</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            Welcome to your Dashboard
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            You have successfully logged in to the authentication boilerplate.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
          <Link to="/profile" className="bg-white rounded-lg shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow group">
            <div className="flex items-center">
              <div className="bg-blue-100 rounded-full p-2 sm:p-3 mr-3 sm:mr-4 group-hover:bg-blue-200 transition-colors">
                <User className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm sm:text-lg font-medium text-gray-900">Profile</h3>
                <p className="text-xs sm:text-sm text-gray-500">Manage your account</p>
              </div>
            </div>
          </Link>

          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="bg-green-100 rounded-full p-2 sm:p-3 mr-3 sm:mr-4">
                <Settings className="h-4 w-4 sm:h-6 sm:w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-sm sm:text-lg font-medium text-gray-900">Settings</h3>
                <p className="text-xs sm:text-sm text-gray-500">Configure preferences</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="bg-purple-100 rounded-full p-2 sm:p-3 mr-3 sm:mr-4">
                <Shield className="h-4 w-4 sm:h-6 sm:w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-sm sm:text-lg font-medium text-gray-900">Security</h3>
                <p className="text-xs sm:text-sm text-gray-500">Manage security settings</p>
              </div>
            </div>
          </div>
        </div>

        {/* User Info Card */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 lg:p-8">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-4 lg:mb-6">
            User Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <p className="text-sm sm:text-base text-gray-900">{user?.name}</p>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <p className="text-sm sm:text-base text-gray-900 break-all sm:break-normal">{user?.email}</p>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <p className="text-sm sm:text-base text-gray-900 capitalize">{user?.role}</p>
            </div>
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Member Since
              </label>
              <p className="text-sm sm:text-base text-gray-900">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div className="sm:col-span-2 lg:col-span-2">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Session Type
              </label>
              <div className="flex items-center flex-wrap gap-2">
                <Clock className="h-4 w-4 text-gray-500 shrink-0" />
                <p className="text-sm sm:text-base text-gray-900">
                  {isRemembered ? 'Extended (30 days)' : 'Standard (7 days)'}
                </p>
                {isRemembered && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    Remembered
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
