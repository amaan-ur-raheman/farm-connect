/**
 * Utility for Cloudinary image optimization and transformation.
 */

interface OptimizeOptions {
  width?: number;
  height?: number;
  quality?: number | 'auto';
  format?: 'auto' | 'webp' | 'png' | 'jpg';
  crop?: 'fill' | 'fit' | 'scale' | 'thumb';
}

/**
 * Transforms a Cloudinary URL to include optimization parameters.
 * If the URL is not a Cloudinary URL, it returns the original URL.
 */
export const optimizeImage = (url: string | null | undefined, options: OptimizeOptions = {}): string => {
  if (!url) return '';
  
  // Only process Cloudinary URLs
  if (!url.includes('res.cloudinary.com')) {
    return url;
  }

  const {
    width,
    height,
    quality = 'auto',
    format = 'auto',
    crop = 'fill'
  } = options;

  const parts = url.split('/upload/');
  if (parts.length !== 2) return url;

  const transformations = [];
  
  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);
  if (crop) transformations.push(`c_${crop}`);
  if (quality) transformations.push(`q_${quality}`);
  if (format) transformations.push(`f_${format}`);

  const transformationString = transformations.join(',');
  
  return `${parts[0]}/upload/${transformationString}/${parts[1]}`;
};

/**
 * Preset for thumbnail optimization
 */
export const getThumbnail = (url: string | null | undefined) => 
  optimizeImage(url, { width: 200, height: 200, crop: 'thumb', quality: 'auto' });

/**
 * Preset for card image optimization
 */
export const getCardImage = (url: string | null | undefined) => 
  optimizeImage(url, { width: 600, height: 450, crop: 'fill', quality: 'auto' });

/**
 * Preset for full-screen preview optimization
 */
export const getFullImage = (url: string | null | undefined) => 
  optimizeImage(url, { width: 1200, quality: 80 });
