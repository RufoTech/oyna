/**
 * Formats an image URL to be absolute.
 * Supports legacy Cloudinary URLs (starting with http) 
 * and new VPS storage paths (starting with /uploads).
 * 
 * @param {string} url - The image URL or path from the database
 * @returns {string} - The absolute URL to be used in <img> tags
 */
export const formatImageUrl = (url) => {
  if (!url) return 'https://placehold.co/600x400/png?text=No+Image';
  
  // If it's already an absolute URL (Cloudinary or previous absolute saves)
  if (url.startsWith('http')) {
    return url;
  }
  
  // If it's a relative path starting with /uploads
  if (url.startsWith('/uploads')) {
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    return `${apiBase}${url}`;
  }
  
  // Fallback for any other relative paths
  if (url.startsWith('/')) {
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    return `${apiBase}${url}`;
  }

  return url;
};
