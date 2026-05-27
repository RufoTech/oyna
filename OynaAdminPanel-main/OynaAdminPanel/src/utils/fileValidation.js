import { toast } from 'react-toastify';

/**
 * Validates an image file's type and size.
 * @param {File} file - The file to validate.
 * @returns {boolean} - True if valid, false otherwise.
 */
export const validateImageFile = (file) => {
  if (!file) {
    toast.error('Fayl seçilməyib.');
    return false;
  }

  // Validate type: must be an image
  if (!file.type || !file.type.startsWith('image/')) {
    toast.error('Yalnız şəkil faylları (JPEG, PNG, WEBP, GIF, SVG) yüklənə bilər.');
    return false;
  }

  // Validate size: max 5MB (5 * 1024 * 1024 bytes)
  const MAX_SIZE_BYTES = 5 * 1024 * 1024;
  if (file.size > MAX_SIZE_BYTES) {
    toast.error('Faylın ölçüsü çox böyükdür. Maksimum 5MB yüklənə bilər.');
    return false;
  }

  return true;
};
