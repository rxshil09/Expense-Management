// User controller
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const cloudinary = require('../config/cloudinary');

// @desc    Get current user profile
// @route   GET /api/users/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        location: user.location,
        role: user.role,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Update profile fields
    user.updateProfile(req.body);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        location: user.location,
        role: user.role,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Upload avatar
// @route   POST /api/users/avatar
// @access  Private
const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Delete old avatar from Cloudinary if exists
    if (user.avatar) {
      try {
        // Extract public_id from the avatar URL
        const publicId = user.avatar.split('/').pop().split('.')[0];
        if (publicId.includes('avatars/')) {
          await cloudinary.uploader.destroy(`avatars/${publicId.split('avatars/')[1]}`);
        } else {
          await cloudinary.uploader.destroy(`avatars/${publicId}`);
        }
      } catch (deleteError) {
        console.error('Error deleting old avatar from Cloudinary:', deleteError);
        // Continue with upload even if deletion fails
      }
    }

    // Update user avatar with Cloudinary URL
    const avatarUrl = req.file.path; // Cloudinary URL
    user.updateAvatar(avatarUrl);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Avatar uploaded successfully',
      avatar: avatarUrl,
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Delete avatar
// @route   DELETE /api/users/avatar
// @access  Private
const deleteAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Delete avatar from Cloudinary if exists
    if (user.avatar) {
      try {
        // Extract public_id from the avatar URL
        const publicId = user.avatar.split('/').pop().split('.')[0];
        if (publicId.includes('avatars/')) {
          await cloudinary.uploader.destroy(`avatars/${publicId.split('avatars/')[1]}`);
        } else {
          await cloudinary.uploader.destroy(`avatars/${publicId}`);
        }
      } catch (deleteError) {
        console.error('Error deleting avatar from Cloudinary:', deleteError);
        // Continue with user update even if Cloudinary deletion fails
      }
    }

    // Remove avatar from user
    user.avatar = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Avatar deleted successfully',
    });
  } catch (error) {
    console.error('Delete avatar error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Change password (or set password for OAuth users)
// @route   PUT /api/users/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    console.log('Change password request:', { 
      userId: req.user._id, 
      hasCurrentPassword: !!currentPassword, 
      hasNewPassword: !!newPassword 
    });

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password is required',
      });
    }

    // Get user with password field
    const user = await User.findById(req.user._id).select('+password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    console.log('User found:', { 
      id: user._id, 
      hasPassword: !!user.password,
      providers: user.providers?.map(p => p.type) || []
    });

    // Check if user has a password
    const hasPasswordProvider = user.providers?.some(p => p.type === 'password');
    const hasExistingPassword = !!user.password;

    if (hasPasswordProvider && hasExistingPassword) {
      // User has a password, current password is required
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is required',
        });
      }

      // Verify current password
      const isCurrentPasswordMatch = await user.matchPassword(currentPassword);
      if (!isCurrentPasswordMatch) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect',
        });
      }
    } else {
      // OAuth-only user setting password for the first time
      // Add password provider if not already present
      if (!hasPasswordProvider) {
        user.providers = user.providers || [];
        user.providers.push({
          type: 'password',
          email: user.primaryEmail,
          linkedAt: new Date()
        });
      }
    }

    // Update password
    user.password = newPassword;
    await user.save();

    console.log('Password changed/set successfully for user:', user._id);

    res.status(200).json({
      success: true,
      message: hasPasswordProvider ? 'Password changed successfully' : 'Password set successfully',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Delete user account
// @route   DELETE /api/users/account
// @access  Private
const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required to delete account',
      });
    }

    // Get user with password field
    const user = await User.findById(req.user._id).select('+password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Verify password
    const isPasswordMatch = await user.matchPassword(password);
    if (!isPasswordMatch) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect password',
      });
    }

    // Delete avatar from Cloudinary if exists
    if (user.avatar) {
      try {
        // Extract public_id from the avatar URL
        const publicId = user.avatar.split('/').pop().split('.')[0];
        if (publicId.includes('avatars/')) {
          await cloudinary.uploader.destroy(`avatars/${publicId.split('avatars/')[1]}`);
        } else {
          await cloudinary.uploader.destroy(`avatars/${publicId}`);
        }
      } catch (deleteError) {
        console.error('Error deleting avatar from Cloudinary:', deleteError);
        // Continue with account deletion even if Cloudinary deletion fails
      }
    }

    // Soft delete the account
    user.deleteAccount();
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  uploadAvatar,
  deleteAvatar,
  changePassword,
  deleteAccount,
};
