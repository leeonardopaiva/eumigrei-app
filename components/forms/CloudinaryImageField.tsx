'use client';

import React, { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { ImagePlus, Link2, LoaderCircle } from 'lucide-react';
import { cloudinaryConfig, getCloudinaryFolderPath, isCloudinaryEnabled, type CloudinaryFolder } from '@/lib/cloudinary';
import { normalizeUrlFieldValue } from '@/lib/forms/validation';
import { isValidHttpUrl } from '@/lib/url';
import FieldErrorMessage from './FieldErrorMessage';

type CloudinaryWidgetResult = {
  event?: string;
  info?: {
    secure_url?: string;
  };
};

type CloudinaryWidget = {
  open: () => void;
  close: () => void;
};

type CloudinaryWindow = Window & {
  cloudinary?: {
    createUploadWidget: (
      options: {
        cloudName: string;
        uploadPreset: string;
        folder: string;
        sources: string[];
        multiple: boolean;
        maxFiles: number;
        resourceType: string;
        clientAllowedFormats: string[];
        singleUploadAutoClose: boolean;
        showAdvancedOptions: boolean;
      },
      callback: (error: unknown, result: CloudinaryWidgetResult) => void,
    ) => CloudinaryWidget;
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
  const widgetRef = useRef<CloudinaryWidget | null>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const cloudinaryWindow = window as CloudinaryWindow;

    if (cloudinaryWindow.cloudinary) {
      setScriptReady(true);
    }
  }, []);

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

  const handleUploadSuccess = (uploadedUrl?: string) => {
    if (!uploadedUrl) {
      return;
    }

    onClearError?.();
    onChange(uploadedUrl);
  };

  const openWidget = () => {
    if (!isCloudinaryEnabled || disabled || !scriptReady || typeof window === 'undefined') {
      return;
    }

    const cloudinaryWindow = window as CloudinaryWindow;

    if (!cloudinaryWindow.cloudinary) {
      return;
    }

    if (!widgetRef.current) {
      widgetRef.current = cloudinaryWindow.cloudinary.createUploadWidget(
        {
          cloudName: cloudinaryConfig.cloudName,
          uploadPreset: cloudinaryConfig.uploadPreset,
          folder: getCloudinaryFolderPath(folder),
          sources: ['local', 'url', 'camera'],
          multiple: false,
          maxFiles: 1,
          resourceType: 'image',
          clientAllowedFormats: ['png', 'jpg', 'jpeg', 'webp'],
          singleUploadAutoClose: true,
          showAdvancedOptions: false,
        },
        (widgetError, result) => {
          if (widgetError) {
            setUploading(false);
            return;
          }

          if (result.event === 'queues-start') {
            setUploading(true);
            return;
          }

          if (result.event === 'success') {
            setUploading(false);
            handleUploadSuccess(result.info?.secure_url);
            widgetRef.current?.close();
            return;
          }

          if (result.event === 'close' || result.event === 'queues-end' || result.event === 'abort') {
            setUploading(false);
          }
        },
      );
    }

    widgetRef.current.open();
  };

  return (
    <div className="space-y-2">
      <Script
        src="https://upload-widget.cloudinary.com/global/all.js"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
        onReady={() => setScriptReady(true)}
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
              className="w-full rounded-2xl border border-slate-200 px-11 py-3 text-sm outline-none focus:ring-2 focus:ring-cyan-200 disabled:opacity-60"
            />
          </div>
          <FieldErrorMessage message={error} />
        </div>
        <button
          type="button"
          onClick={openWidget}
          disabled={!isCloudinaryEnabled || !scriptReady || disabled || uploading}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {uploading ? <LoaderCircle size={16} className="animate-spin" /> : <ImagePlus size={16} />}
          {uploading ? 'Enviando...' : 'Upload'}
        </button>
      </div>
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
