// Helper function to extract image URL from various formats
export const getImageUrl = (image: any): string => {
  // If it's already a string, return it
  if (typeof image === 'string') {
    return image;
  }
  
  // If it's an object with a url property
  if (image && typeof image === 'object' && image.url) {
    return image.url;
  }
  
  // If it's an object with a uri property
  if (image && typeof image === 'object' && image.uri) {
    return image.uri;
  }
  
  // Default placeholder
  return 'https://via.placeholder.com/300';
};

// Get first image from array
export const getFirstImageUrl = (images: any): string => {
  if (!images || !Array.isArray(images) || images.length === 0) {
    return 'https://via.placeholder.com/300';
  }
  
  return getImageUrl(images[0]);
};

// Process all images in array
export const processImageArray = (images: any): string[] => {
  if (!images || !Array.isArray(images)) {
    return ['https://via.placeholder.com/300'];
  }
  
  return images.map(img => getImageUrl(img));
};