import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, RefreshCw } from 'lucide-react';
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
  folder?: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  value,
  onChange,
  label = 'Image',
  accept = 'image/jpeg,image/jpg,image/png,image/webp',
  maxSizeMB = 5,
  className = '',
  folder = 'media',
}) => {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const validateFile = (file: File): string | null => {
    // Check file size first
    if (file.size > maxSizeBytes) {
      return `File size must be less than ${maxSizeMB}MB`;
    }

    // Check file type by MIME type and extension
    const acceptedTypes = accept.split(',').map(t => t.trim());
    const fileType = file.type;
    const fileName = file.name.toLowerCase();
    const fileExtension = fileName.substring(fileName.lastIndexOf('.'));

    // Check MIME type
    const isValidMimeType = acceptedTypes.some(type => {
      if (type.includes('*')) {
        const baseType = type.split('/')[0];
        return fileType.startsWith(baseType);
      }
      return fileType === type;
    });

    // Check file extension as fallback (important for .ico files which may have inconsistent MIME types)
    const acceptedExtensions = [];
    if (accept.includes('image/x-icon') || accept.includes('image/vnd.microsoft.icon')) acceptedExtensions.push('.ico');
    if (accept.includes('image/png')) acceptedExtensions.push('.png');
    if (accept.includes('image/jpeg') || accept.includes('image/jpg')) acceptedExtensions.push('.jpg', '.jpeg');
    if (accept.includes('image/webp')) acceptedExtensions.push('.webp');
    if (accept.includes('image/svg+xml')) acceptedExtensions.push('.svg');

    const isValidExtension = acceptedExtensions.length === 0 || acceptedExtensions.includes(fileExtension);

    if (!isValidMimeType && !isValidExtension) {
      return `Invalid file type. Please select a valid image file.`;
    }

    return null;
  };

  const uploadFile = async (file: File) => {
    console.log('Upload file called:', { fileName: file.name, fileType: file.type, fileSize: file.size });

    const error = validateFile(file);
    if (error) {
      console.error('Validation error:', error);
      toast.error(error);
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      console.log('Uploading to /media-library/upload with folder:', folder);

      const response = await api.post('/media-library/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Upload response:', response.data);

      if (response.data.success && response.data.data?.url) {
        console.log('Upload successful, URL:', response.data.data.url);
        onChange(response.data.data.url);
        toast.success('Image uploaded successfully');
      } else {
        console.error('Upload failed - invalid response structure:', response.data);
        throw new Error('Upload failed - no URL returned');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.message || error.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File input changed, files:', e.target.files);
    const file = e.target.files?.[0];
    if (file) {
      console.log('File selected:', file.name);
      uploadFile(file);
    } else {
      console.log('No file selected');
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

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileInput}
        className="hidden"
        disabled={uploading}
      />

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
            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-opacity flex items-center justify-center gap-2 opacity-0 hover:opacity-100">
              <button
                type="button"
                onClick={() => !uploading && inputRef.current?.click()}
                className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors"
                title="Change image"
                disabled={uploading}
              >
                <RefreshCw className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors"
                title="Remove image"
                disabled={uploading}
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

