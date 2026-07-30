export const CLOUDINARY = {
  cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
  uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
  folder: 'threasure/cortes',
};

export const cldUrl = (publicId, transformations = '') => {
  if (!publicId) return '';
  if (transformations) {
    return `https://res.cloudinary.com/${CLOUDINARY.cloudName}/image/upload/${transformations}/${publicId}`;
  }
  return `https://res.cloudinary.com/${CLOUDINARY.cloudName}/image/upload/${publicId}`;
};

export const cldVideoUrl = (publicId, transformations = '') => {
  if (!publicId) return '';
  if (transformations) {
    return `https://res.cloudinary.com/${CLOUDINARY.cloudName}/video/upload/${transformations}/${publicId}`;
  }
  return `https://res.cloudinary.com/${CLOUDINARY.cloudName}/video/upload/${publicId}`;
};