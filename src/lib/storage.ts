import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

export async function uploadImage(file: File, path: string): Promise<string> {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

export const STORAGE_PATHS = {
  AVATARS: 'avatars',
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  TAGS: 'tags',
  STORES: 'stores',
  BANNERS: 'banners',
};
