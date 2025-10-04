import React from 'react';
import { User } from 'lucide-react';
import { optimizeCloudinaryUrl } from '../../utils/cloudinaryUtils';

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  name?: string;
}

const Avatar: React.FC<AvatarProps> = ({ src, alt = 'Avatar', size = 'md', name = '' }) => {
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  // Map size to pixel dimensions for Cloudinary optimization
  const sizePixels = {
    xs: 24,
    sm: 32,
    md: 48,
    lg: 64,
    xl: 96,
  };

  const getInitials = (name) => {
    if (!name) return '';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  // Optimize Cloudinary URL based on avatar size
  const optimizedSrc = src ? optimizeCloudinaryUrl(src, {
    width: sizePixels[size],
    height: sizePixels[size],
    crop: 'fill',
    quality: 'auto',
    format: 'auto',
  }) : null;

  const initials = getInitials(name);

  if (optimizedSrc) {
    return (
      <img
        src={optimizedSrc}
        alt={alt}
        className={`${sizeClasses[size]} rounded-full object-cover border-2 border-gray-200`}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          const nextSibling = target.nextSibling as HTMLElement;
          target.style.display = 'none';
          if (nextSibling) {
            nextSibling.style.display = 'flex';
          }
        }}
      />
    );
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center border-2 border-gray-200`}>
      {initials ? (
        <span className="text-white font-semibold text-sm">
          {initials}
        </span>
      ) : (
        <User className={`${iconSizes[size]} text-white`} />
      )}
    </div>
  );
};

export default Avatar;
