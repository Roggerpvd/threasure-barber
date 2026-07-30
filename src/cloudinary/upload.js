import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import imageCompression from 'browser-image-compression';
import { CLOUDINARY, cldUrl, cldVideoUrl } from './config';

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const isVideo = (file) => file.type.startsWith('video/');

const compressImage = async (file) => {
  return await imageCompression(file, {
    maxSizeMB: 0.7,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: 'image/jpeg',
    initialQuality: 0.85,
  });
};

const uploadToCloudinary = (file, onProgress) => {
  return new Promise((resolve, reject) => {
    const isVid = isVideo(file);
    const endpoint = isVid
      ? `https://api.cloudinary.com/v1_1/${CLOUDINARY.cloudName}/video/upload`
      : `https://api.cloudinary.com/v1_1/${CLOUDINARY.cloudName}/image/upload`;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY.uploadPreset);
    formData.append('folder', CLOUDINARY.folder);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', endpoint);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress?.(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch (e) {
          reject(new Error('Respuesta inválida del servidor'));
        }
      } else {
        try {
          const err = JSON.parse(xhr.responseText);
          reject(new Error(err.error?.message || 'Error al subir'));
        } catch {
          reject(new Error(`Error ${xhr.status}: ${xhr.statusText}`));
        }
      }
    };

    xhr.onerror = () => reject(new Error('Error de red. Verifica tu conexión.'));
    xhr.ontimeout = () => reject(new Error('Tiempo agotado. Archivo muy grande.'));
    xhr.timeout = 5 * 60 * 1000;
    xhr.send(formData);
  });
};

export const uploadCorte = async (file, metadata, onProgress) => {
  try {
    let fileToUpload = file;

    if (!isVideo(file)) {
      fileToUpload = await compressImage(file);
    } else {
      const MAX_VIDEO_SIZE = 100 * 1024 * 1024;
      if (file.size > MAX_VIDEO_SIZE) {
        throw new Error(
          `El video pesa ${formatBytes(file.size)}. Máximo 100MB. ` +
          `Graba en 720p o recorta a 30 segundos.`
        );
      }
    }

    onProgress?.(5);
    const result = await uploadToCloudinary(fileToUpload, (p) => {
      onProgress?.(5 + Math.round(p * 0.9));
    });
    onProgress?.(98);

    const docRef = await addDoc(collection(db, 'cortes'), {
      title: metadata.title || 'Sin título',
      description: metadata.description || '',
      category: metadata.category || 'corte',
      type: isVideo(file) ? 'video' : 'photo',
      publicId: result.public_id,
      url: result.secure_url,
      width: result.width,
      height: result.height,
      size: result.bytes,
      originalSize: file.size,
      duration: result.duration || null,
      format: result.format,
      createdAt: serverTimestamp(),
    });

    onProgress?.(100);
    return { id: docRef.id, publicId: result.public_id, url: result.secure_url };
  } catch (error) {
    console.error('Error subiendo:', error);
    throw error;
  }
};

export const getCortes = async () => {
  const q = query(collection(db, 'cortes'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const deleteCorte = async (corte) => {
  await deleteDoc(doc(db, 'cortes', corte.id));
};

export const getThumbnail = (corte) => {
  if (corte.type === 'video') {
    return cldVideoUrl(corte.publicId, 'w_500,h_500,c_fill,q_auto,so_1');
  }
  return cldUrl(corte.publicId, 'w_500,h_500,c_fill,q_auto,f_auto');
};

export const getFull = (corte) => {
  if (corte.type === 'video') {
    return cldVideoUrl(corte.publicId, 'q_auto');
  }
  return cldUrl(corte.publicId, 'q_auto,f_auto');
};

export { formatBytes };