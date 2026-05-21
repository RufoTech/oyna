import imageCompression from 'browser-image-compression';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const uploadImage = async (file, category = 'misc') => {
  try {
    // Compression settings (max 1MB, 1920x1920)
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      initialQuality: 0.8,
    };
    
    console.log(`Original file size: ${(file.size / 1024 / 1024).toFixed(3)} MB`);

    const compressedFile = await imageCompression(file, options);
    console.log(`Compressed file size: ${(compressedFile.size / 1024 / 1024).toFixed(3)} MB`);

    const formData = new FormData();
    formData.append('file', compressedFile);

    const response = await fetch(`${API_BASE_URL}/upload/${category}`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload to VPS failed');
    }

    const data = await response.json();
    
    // Return full URL for the frontend to display
    return `${API_BASE_URL}${data.url}`;
  } catch (error) {
    console.error('Image compression/upload error:', error);
    throw error;
  }
};

// Keep old name as alias to avoid breaking all components at once
export const uploadImageToCloudinary = uploadImage;
