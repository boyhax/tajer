import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import { useLanguage } from '../../contexts';
import { uploadImage } from '../../lib/storage';

interface ImageUploadProps {
  onUpload: (url: string) => void;
  currentUrl?: string;
  path: string;
  label: string;
}

export const ImageUpload = ({ 
  onUpload, 
  currentUrl, 
  path, 
  label 
}: ImageUploadProps) => {
  const { t } = useLanguage();
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileName = `${Date.now()}_${file.name}`;
      const url = await uploadImage(file, `${path}/${fileName}`);
      onUpload(url);
    } catch (error: any) {
      console.error('Upload error:', error);
      let errorMessage = 'Failed to upload image';
      if (error.code === 'storage/unauthorized') {
        errorMessage = 'Unauthorized: Please check your Firebase Storage rules.';
      } else if (error.code === 'storage/canceled') {
        errorMessage = 'Upload canceled.';
      } else if (error.message?.includes('not found')) {
        errorMessage = 'Firebase Storage bucket not found. Please enable it in the Firebase Console.';
      }
      // Instead of alert, we'll just log it and maybe show it in the UI
      console.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold uppercase text-gray-400 ml-2">{t({ en: label, ar: label })}</label>
      <div className="flex items-center gap-4">
        {currentUrl && (
          <div className="w-16 h-16 rounded-xl overflow-hidden border border-gray-100 shadow-sm">
            <img src={currentUrl || undefined} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
        )}
        <label className={`flex-1 cursor-pointer p-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 hover:border-black transition-all flex items-center justify-center gap-2 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
          <Upload className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-bold text-gray-500">
            {uploading ? t({ en: 'Uploading...', ar: 'جاري الرفع...' }) : t({ en: 'Choose Image', ar: 'اختر صورة' })}
          </span>
          <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        </label>
      </div>
    </div>
  );
};
