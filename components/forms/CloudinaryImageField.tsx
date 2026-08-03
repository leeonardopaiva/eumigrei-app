'use client';

import React, { useRef, useState } from 'react';
import { ImagePlus, LoaderCircle, Pencil } from 'lucide-react';
import { cloudinaryConfig, getCloudinaryFolderPath, isCloudinaryEnabled, type CloudinaryFolder } from '@/lib/cloudinary';
import { isValidHttpUrl } from '@/lib/url';
import FieldErrorMessage from './FieldErrorMessage';

type CloudinaryUploadResponse = {
  secure_url?: string;
  error?: {
    message?: string;
  };
};

type CloudinaryImageFieldProps = {
  value?: string;
  imageUrl?: string;
  onChange: (value: string) => void;
  folder: CloudinaryFolder;
  width?: React.CSSProperties['width'];
  height?: React.CSSProperties['height'];
  placeholder?: string;
  hint?: string;
  disabled?: boolean;
  error?: string | null;
  onClearError?: () => void;
};

const CloudinaryImageField: React.FC<CloudinaryImageFieldProps> = ({
  value,
  imageUrl,
  onChange,
  folder,
  width = '100%',
  height = 160,
  hint,
  disabled = false,
  error,
  onClearError,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const currentImageUrl = imageUrl ?? value ?? '';

  const openFilePicker = () => {
    if (!isCloudinaryEnabled || disabled || uploading) {
      return;
    }

    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file || !isCloudinaryEnabled || disabled) {
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', cloudinaryConfig.uploadPreset);
    formData.append('folder', getCloudinaryFolderPath(folder));

    setUploading(true);
    setUploadError(null);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudinaryConfig.cloudName)}/image/upload`,
        {
          method: 'POST',
          body: formData,
        },
      );
      const result = (await response.json()) as CloudinaryUploadResponse;

      if (!response.ok || !result.secure_url) {
        throw new Error(result.error?.message || 'Nao foi possivel enviar a imagem.');
      }

      onClearError?.();
      onChange(result.secure_url);
    } catch (uploadFailure) {
      setUploadError(
        uploadFailure instanceof Error
          ? uploadFailure.message
          : 'Nao foi possivel enviar a imagem.',
      );
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={!isCloudinaryEnabled || disabled || uploading}
      />
      <div className="space-y-2">
        <button
          type="button"
          onClick={openFilePicker}
          disabled={!isCloudinaryEnabled || disabled || uploading}
          aria-label={currentImageUrl ? 'Alterar imagem' : 'Selecionar imagem'}
          aria-busy={uploading}
          style={{ width, height }}
          className="group relative block max-w-full cursor-pointer overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 text-slate-600 outline-none transition focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {currentImageUrl && isValidHttpUrl(currentImageUrl) ? (
            <img
              src={currentImageUrl}
              alt="Imagem atual"
              className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.02] group-active:scale-[1.02]"
            />
          ) : (
            <span className="flex h-full w-full flex-col items-center justify-center gap-2 px-4 text-sm font-bold">
              <ImagePlus size={24} />
              Selecionar imagem
            </span>
          )}

          <span className={`absolute inset-0 flex items-center justify-center transition duration-200 group-hover:bg-slate-950/35 group-active:bg-slate-950/35 group-focus-visible:bg-slate-950/35 ${uploading ? 'bg-slate-950/35' : 'bg-slate-950/0'}`}>
            <span className={`flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-sm font-bold text-slate-800 shadow-lg transition duration-200 group-hover:scale-100 group-hover:opacity-100 group-active:scale-100 group-active:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100 ${uploading ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}>
              {uploading ? <LoaderCircle size={17} className="animate-spin" /> : <Pencil size={17} />}
              {uploading ? 'Enviando...' : currentImageUrl ? 'Alterar imagem' : 'Adicionar imagem'}
            </span>
          </span>
        </button>

        <FieldErrorMessage message={error} />
      </div>
      <FieldErrorMessage message={uploadError} />
      <p className="px-1 text-xs text-slate-500">
        {hint ||
          (isCloudinaryEnabled
            ? 'Clique ou toque na imagem para selecionar um arquivo.'
            : 'Configure o Cloudinary no ambiente para habilitar o upload.')}
      </p>
    </div>
  );
};

export default CloudinaryImageField;
