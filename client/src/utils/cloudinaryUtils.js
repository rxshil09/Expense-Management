// Cloudinary utility functions for client-side URL optimization

/**
 * Optimizes a Cloudinary image URL with transformations
 * @param {string} url - Original Cloudinary URL
 * @param {object} options - Transformation options
 * @returns {string} - Optimized Cloudinary URL
 */
export const optimizeCloudinaryUrl = (url, options = {}) => {
  if (!url || !url.includes('cloudinary.com')) {
    return url; // Return original URL if it's not a Cloudinary URL
  }

  const {
    width = 400,
    height = 400,
    crop = 'fill',
    quality = 'auto',
    format = 'auto',
  } = options;

  try {
    // Parse the URL to extract parts
    const urlParts = url.split('/');
    const uploadIndex = urlParts.findIndex(part => part === 'upload');
    
    if (uploadIndex === -1) return url;

    // Build transformation string
    const transformations = [
      `w_${width}`,
      `h_${height}`,
      `c_${crop}`,
      `q_${quality}`,
      `f_${format}`
    ].join(',');

    // Insert transformations after 'upload'
    urlParts.splice(uploadIndex + 1, 0, transformations);
    
    return urlParts.join('/');
  } catch (error) {
    console.error('Error optimizing Cloudinary URL:', error);
    return url; // Return original URL on error
  }
};

/**
 * Generates a thumbnail version of a Cloudinary image
 * @param {string} url - Original Cloudinary URL
 * @param {number} size - Thumbnail size (default: 150)
 * @returns {string} - Thumbnail URL
 */
export const getCloudinaryThumbnail = (url, size = 150) => {
  return optimizeCloudinaryUrl(url, {
    width: size,
    height: size,
    crop: 'fill',
    quality: 'auto',
    format: 'auto',
  });
};

/**
 * Generates different sizes of a Cloudinary image for responsive use
 * @param {string} url - Original Cloudinary URL
 * @returns {object} - Object with different sized URLs
 */
export const getCloudinaryResponsiveUrls = (url) => {
  return {
    thumbnail: getCloudinaryThumbnail(url, 150),
    small: optimizeCloudinaryUrl(url, { width: 300, height: 300 }),
    medium: optimizeCloudinaryUrl(url, { width: 500, height: 500 }),
    large: optimizeCloudinaryUrl(url, { width: 800, height: 800 }),
    original: url,
  };
};
