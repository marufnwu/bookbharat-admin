import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { api } from '../api/axios';
import toast from 'react-hot-toast';
import { getFullImageUrl, getBackendUrl } from '../utils/imageUrl';

interface ImageUploaderProps {
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  accept?: string;
  maxSizeMB?: number;
  className?: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  value,
  onChange,
  label = 'Image',
  accept = 'image/jpeg,image/jpg,image/png,image/webp',
  maxSizeMB = 5,
  className = '',
}) => {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const validateFile = (file: File): string | null => {
    // Check file type
    const acceptedTypes = accept.split(',').map(t => t.trim());
    const fileType = file.type;
    const isValidType = acceptedTypes.some(type => {
      if (type.includes('*')) {
        const baseType = type.split('/')[0];
        return fileType.startsWith(baseType);
      }
      return fileType === type;
    });

    if (!isValidType) {
      return `Invalid file type. Accepted types: ${accept}`;
    }

    // Check file size
    if (file.size > maxSizeBytes) {
      return `File size must be less than ${maxSizeMB}MB`;
    }

    return null;
  };

  const uploadFile = async (file: File) => {
    const error = validateFile(file);
    if (error) {
      toast.error(error);
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'image');

      const response = await api.post('/media-library/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success && response.data.data?.url) {
        onChange(response.data.data.url);
        toast.success('Image uploaded successfully');
      } else {
        throw new Error('Upload failed');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  const handleRemove = () => {
    onChange(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      {value ? (
        // Preview Mode
        <div className="relative">
          <div className="relative border-2 border-gray-300 rounded-lg overflow-hidden">
            <img
              src={getFullImageUrl(value) || ''}
              alt="Uploaded image"
              className="w-full h-48 object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23f3f4f6" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af"%3EBroken Image%3C/text%3E%3C/svg%3E';
              }}
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-opacity flex items-center justify-center opacity-0 hover:opacity-100">
              <button
                type="button"
                onClick={handleRemove}
                className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors"
                title="Remove image"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500 truncate" title={value}>
            {value.startsWith('http') ? value : `${getBackendUrl()}${value}`}
          </div>
        </div>
      ) : (
        // Upload Mode
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-lg p-6 transition-colors
            ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
            ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          onClick={() => !uploading && inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleFileInput}
            className="hidden"
            disabled={uploading}
          />

          <div className="text-center">
            {uploading ? (
              <div className="flex flex-col items-center">
                <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-3" />
                <p className="text-sm text-gray-600">Uploading...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="p-3 bg-gray-100 rounded-full mb-3">
                  <Upload className="h-8 w-8 text-gray-600" />
                </div>
                <p className="text-sm font-medium text-gray-700 mb-1">
                  Drop image here or click to browse
                </p>
                <p className="text-xs text-gray-500">
                  {accept.split(',').map(t => t.split('/')[1]).join(', ').toUpperCase()} (Max {maxSizeMB}MB)
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;

