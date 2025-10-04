import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  User, 
  Camera, 
  Edit3, 
  Save, 
  X, 
  Trash2, 
  AlertTriangle,
  ArrowLeft 
} from 'lucide-react';

import { profileSchema, changePasswordSchema, setPasswordSchema, deleteAccountSchema } from '../schemas/authSchemas';
import { authService } from '../services/authService';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import PasswordInput from '../components/ui/PasswordInput';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Avatar from '../components/ui/Avatar';
import ProviderManagement from '../components/ProviderManagement';
import useAuthStore from '../stores/authStore';

const Profile = () => {
  const queryClient = useQueryClient();
  const { user: currentUser, updateUser } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isEditing, setIsEditing] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile form
  const profileForm = useForm<any>({
    resolver: yupResolver(profileSchema),
    defaultValues: {
      name: '',
      bio: '',
      phone: '',
      dateOfBirth: '',
      gender: '',
      location: '',
    },
  });

  // Password form - use dynamic schema based on whether user has password
  const hasPassword = currentUser?.providers?.some(p => p.type === 'password');
  const passwordForm = useForm<any>({
    resolver: yupResolver(hasPassword ? changePasswordSchema : setPasswordSchema),
  });

  // Delete account form
  const deleteForm = useForm<any>({
    resolver: yupResolver(deleteAccountSchema),
  });

  // Get profile data
  const { data: profileData, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: authService.getProfile,
  });

  // Update form when profile data loads
  React.useEffect(() => {
    if (profileData?.user) {
      const user = profileData.user;
      profileForm.reset({
        name: user.name || '',
        bio: user.bio || '',
        phone: user.phone || '',
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
        gender: user.gender || '',
        location: user.location || '',
      });
    }
  }, [profileData, profileForm]);

  // Handle URL parameters for OAuth callback messages
  React.useEffect(() => {
    const linked = searchParams.get('linked');
    const error = searchParams.get('error');

    if (linked === 'google') {
      toast.success('Google account linked successfully!');
      setSearchParams({}); // Clear URL parameters
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    } else if (error) {
      switch (error) {
        case 'oauth_error':
          toast.error('Google OAuth error occurred');
          break;
        case 'oauth_failed':
          toast.error('Google OAuth failed');
          break;
        case 'not_authenticated':
          toast.error('Please log in to link accounts');
          break;
        case 'session_expired':
          toast.error('Session expired. Please log in again');
          break;
        case 'google_already_linked':
          toast.error('This Google account is already linked to another user');
          break;
        case 'link_failed':
          toast.error('Failed to link Google account');
          break;
        default:
          toast.error('An error occurred');
      }
      setSearchParams({}); // Clear URL parameters
    }
  }, [searchParams, setSearchParams, queryClient]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: authService.updateProfile,
    onSuccess: (data) => {
      toast.success(data.message);
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      updateUser(data.user);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    },
  });

  // Upload avatar mutation
  const uploadAvatarMutation = useMutation({
    mutationFn: authService.uploadAvatar,
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      updateUser({ ...currentUser, avatar: data.avatar });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to upload avatar');
    },
  });

  // Delete avatar mutation
  const deleteAvatarMutation = useMutation({
    mutationFn: authService.deleteAvatar,
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      updateUser({ ...currentUser, avatar: null });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete avatar');
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: authService.changePassword,
    onSuccess: (data) => {
      toast.success(data.message);
      setShowChangePassword(false);
      passwordForm.reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to change password');
    },
  });

  // Delete account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: authService.deleteAccount,
    onSuccess: (data) => {
      toast.success(data.message);
      // Logout user
      authService.logout();
      window.location.href = '/';
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete account');
    },
  });

  const handleAvatarUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Only image files are allowed');
        return;
      }
      
      const formData = new FormData();
      formData.append('avatar', file);
      uploadAvatarMutation.mutate(formData);
    }
  };

  const handleProfileSubmit = (data) => {
    updateProfileMutation.mutate(data);
  };

  const handlePasswordSubmit = (data) => {
    changePasswordMutation.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
  };

  const handleDeleteAccount = (data) => {
    deleteAccountMutation.mutate(data.password);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const user = profileData?.user;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Navigation */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors duration-200 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:translate-x-[-2px] transition-transform duration-200" />
              <span className="font-medium hidden sm:inline">Back to Dashboard</span>
              <span className="font-medium sm:hidden">Back</span>
            </Link>
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Profile Settings</h1>
            <div className="w-20"></div> {/* Spacer for balance */}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-4 sm:px-6 py-6 sm:py-8">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              {/* Avatar Section */}
              <div className="relative shrink-0">
                <Avatar
                  src={user?.avatar}
                  alt="Profile Avatar"
                  name={user?.name}
                  size="xl"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadAvatarMutation.isPending}
                  className="absolute -bottom-2 -right-2 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full shadow-lg transition-colors flex items-center justify-center"
                >
                  {uploadAvatarMutation.isPending ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <Camera className="w-4 h-4 flex-shrink-0" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>

              {/* User Info */}
              <div className="text-center sm:text-left text-white flex-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">{user?.name}</h1>
                <p className="text-blue-100 text-sm sm:text-base break-all sm:break-normal">{user?.email}</p>
                <p className="text-blue-200 text-xs sm:text-sm mt-1">
                  Member since {new Date(user?.createdAt).toLocaleDateString()}
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:ml-auto">
                {user?.avatar && (
                  <Button
                    onClick={() => deleteAvatarMutation.mutate()}
                    disabled={deleteAvatarMutation.isPending}
                    variant="outline"
                    size="sm"
                    className="!bg-transparent !text-white !border-white hover:!bg-white hover:!text-blue-600 w-full sm:w-auto flex items-center justify-center gap-2"
                  >
                    {deleteAvatarMutation.isPending ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 flex-shrink-0" />
                        <span className="sm:hidden">Delete Avatar</span>
                      </>
                    )}
                  </Button>
                )}
                <Button
                  onClick={() => setIsEditing(!isEditing)}
                  variant="outline"
                  size="sm"
                  className="!bg-transparent !text-white !border-white hover:!bg-white hover:!text-blue-600 w-full sm:w-auto flex items-center justify-center gap-2"
                >
                  {isEditing ? (
                    <>
                      <X className="w-4 h-4 flex-shrink-0" />
                      <span className="sm:hidden">Cancel</span>
                    </>
                  ) : (
                    <>
                      <Edit3 className="w-4 h-4 flex-shrink-0" />
                      <span className="sm:hidden">Edit Profile</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <div className="p-4 sm:p-6 lg:p-8">
            <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                <div className="sm:col-span-2 lg:col-span-1">
                  <Input
                    {...profileForm.register('name')}
                    label="Full Name"
                    error={profileForm.formState.errors.name?.message as string}
                    disabled={!isEditing}
                  />
                </div>
                
                <div className="sm:col-span-2 lg:col-span-1">
                  <Input
                    {...profileForm.register('phone')}
                    label="Phone Number"
                    error={profileForm.formState.errors.phone?.message as string}
                    disabled={!isEditing}
                  />
                </div>

                <div className="sm:col-span-1 lg:col-span-1">
                  <Input
                    {...profileForm.register('dateOfBirth')}
                    label="Date of Birth"
                    type="date"
                    error={profileForm.formState.errors.dateOfBirth?.message as string}
                    disabled={!isEditing}
                  />
                </div>

                <div className="sm:col-span-1 lg:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender
                  </label>
                  <select
                    {...profileForm.register('gender')}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 bg-white text-gray-900"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  {profileForm.formState.errors.gender && (
                    <p className="mt-1 text-sm text-red-600">
                      {profileForm.formState.errors.gender?.message as string}
                    </p>
                  )}
                </div>

                <div className="sm:col-span-2 lg:col-span-1">
                  <Input
                    {...profileForm.register('location')}
                    label="Location"
                    error={profileForm.formState.errors.location?.message as string}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                <textarea
                  {...profileForm.register('bio')}
                  rows={4}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 resize-none bg-white text-gray-900"
                  placeholder="Tell us about yourself..."
                />
                {profileForm.formState.errors.bio && (
                  <p className="mt-1 text-sm text-red-600">
                    {profileForm.formState.errors.bio?.message as string}
                  </p>
                )}
              </div>

              {isEditing && (
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="flex items-center justify-center gap-2 w-full sm:w-auto"
                  >
                    {updateProfileMutation.isPending ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <Save className="w-4 h-4 flex-shrink-0" />
                    )}
                    <span>Save Changes</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </form>
          </div>

          {/* Security Section */}
          <div className="border-t border-gray-200 p-4 sm:p-6 lg:p-8">
            <h3 className="text-lg lg:text-xl font-medium text-gray-900 mb-4 lg:mb-6">Security</h3>
            
            <div className="space-y-4 lg:space-y-6">
              {/* Dynamic button text based on whether user has password */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Password</h4>
                  <p className="text-sm text-gray-500">
                    {user?.password ? 'Update your password' : 'Set a password for your account'}
                  </p>
                </div>
                <Button
                  onClick={() => setShowChangePassword(!showChangePassword)}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  {user?.password ? 'Change Password' : 'Set Password'}
                </Button>
              </div>

              {showChangePassword && (
                <div className="border border-gray-200 rounded-lg p-4 sm:p-6 bg-gray-50">
                  <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4">
                    {/* Only show current password field if user already has a password */}
                    {currentUser?.providers?.some(p => p.type === 'password') && (
                      <div>
                        <PasswordInput
                          {...passwordForm.register('currentPassword')}
                          label="Current Password"
                          error={passwordForm.formState.errors.currentPassword?.message as string}
                        />
                      </div>
                    )}

                    <div>
                      <PasswordInput
                        {...passwordForm.register('newPassword')}
                        label="New Password"
                        error={passwordForm.formState.errors.newPassword?.message as string}
                      />
                    </div>

                    <div>
                      <PasswordInput
                        {...passwordForm.register('confirmNewPassword')}
                        label="Confirm New Password"
                        error={passwordForm.formState.errors.confirmNewPassword?.message as string}
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        type="submit"
                        disabled={changePasswordMutation.isPending}
                        size="sm"
                        className="w-full sm:w-auto"
                      >
                        {changePasswordMutation.isPending ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          'Update Password'
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowChangePassword(false)}
                        className="w-full sm:w-auto"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {/* Provider Management */}
              <div className="border border-gray-200 rounded-lg p-4 sm:p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Connected Accounts</h4>
                <ProviderManagement />
              </div>

              {/* Danger Zone */}
              <div className="border border-red-200 rounded-lg p-4 sm:p-6 bg-red-50">
                <h4 className="text-lg font-medium text-red-900 mb-4">Danger Zone</h4>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h5 className="text-sm font-medium text-red-900">Delete Account</h5>
                    <p className="text-sm text-red-700">
                      This action cannot be undone. All your data will be permanently deleted.
                    </p>
                  </div>
                  <Button
                    onClick={() => setShowDeleteAccount(!showDeleteAccount)}
                    variant="danger"
                    className="w-full sm:w-auto"
                  >
                    Delete Account
                  </Button>
                </div>

                {showDeleteAccount && (
                  <div className="border border-red-200 rounded-lg p-4 sm:p-6 bg-red-50 mt-4">
                    <p className="text-sm text-red-700 mb-4">
                      This action cannot be undone. Please enter your password to confirm.
                    </p>
                    <form onSubmit={deleteForm.handleSubmit(handleDeleteAccount)} className="space-y-4">
                      <PasswordInput
                        {...deleteForm.register('password')}
                        label="Confirm Password"
                        error={deleteForm.formState.errors.password?.message as string}
                      />
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                          type="submit"
                          disabled={deleteAccountMutation.isPending}
                          variant="danger"
                          className="w-full sm:w-auto"
                        >
                          {deleteAccountMutation.isPending ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            'Confirm Delete'
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowDeleteAccount(false);
                            deleteForm.reset();
                          }}
                          className="w-full sm:w-auto"
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
