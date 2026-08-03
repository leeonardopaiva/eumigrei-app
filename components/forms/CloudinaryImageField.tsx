'use client';

import React, { useRef, useState } from 'react';
import { ImagePlus, Link2, LoaderCircle } from 'lucide-react';
import { cloudinaryConfig, getCloudinaryFolderPath, isCloudinaryEnabled, type CloudinaryFolder } from '@/lib/cloudinary';
import { normalizeUrlFieldValue } from '@/lib/forms/validation';
import { isValidHttpUrl } from '@/lib/url';
import FieldErrorMessage from './FieldErrorMessage';

type CloudinaryUploadResponse = {
  secure_url?: string;
  error?: {
    message?: string;
  };
};

type CloudinaryImageFieldProps = {
  value: string;
  onChange: (value: string) => void;
  folder: CloudinaryFolder;
  placeholder?: string;
  hint?: string;
  disabled?: boolean;
  error?: string | null;
  onClearError?: () => void;
};

const CloudinaryImageField: React.FC<CloudinaryImageFieldProps> = ({
  value,
  onChange,
  folder,
  placeholder = 'Link da imagem',
  hint,
  disabled = false,
  error,
  onClearError,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleInputChange = (nextValue: string) => {
    onClearError?.();
    onChange(nextValue);
  };

  const handleBlur = () => {
    const normalized = normalizeUrlFieldValue(value);

    if (normalized !== value) {
      onChange(normalized);
    }
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
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div className="space-y-2">
          <div className="relative">
            <Link2 className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              value={value}
              onChange={(event) => handleInputChange(event.target.value)}
              onBlur={handleBlur}
              placeholder={placeholder}
              aria-invalid={Boolean(error)}
              disabled={disabled}
              className="w-full rounded-full border border-input px-11 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-200 disabled:opacity-60"
            />
          </div>
          <FieldErrorMessage message={error} />
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={!isCloudinaryEnabled || disabled || uploading}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {uploading ? <LoaderCircle size={16} className="animate-spin" /> : <ImagePlus size={16} />}
          {uploading ? 'Enviando...' : 'Upload'}
        </button>
      </div>
      <FieldErrorMessage message={uploadError} />
      <p className="px-1 text-xs text-slate-500">
        {hint ||
          (isCloudinaryEnabled
            ? 'Envie pela Cloudinary ou cole uma URL publica.'
            : 'Cole uma URL publica. Para habilitar upload, configure Cloudinary no ambiente.')}
      </p>
      {value && isValidHttpUrl(value) ? (
        <div className="overflow-hidden rounded-3xl border border-slate-100 bg-slate-50">
          <img src={value} alt="Preview da imagem" className="h-40 w-full object-cover" />
        </div>
      ) : null}
    </div>
  );
};

export default CloudinaryImageField;
