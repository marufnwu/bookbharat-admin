import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/axios';
import toast from 'react-hot-toast';
import {
  Upload,
  X,
  Trash2,
  Search,
  Filter,
  Grid3X3,
  List,
  Image as ImageIcon,
  File,
  Video,
  FileText,
  Copy,
  Check,
  Download,
  FolderOpen,
  Calendar,
  HardDrive,
  Eye,
  Plus,
} from 'lucide-react';

interface MediaFile {
  id: number;
  filename: string;
  original_filename: string;
  url: string;
  full_url: string;
  mime_type: string;
  file_size: number;
  size_formatted: string;
  width?: number;
  height?: number;
  folder: string;
  type: 'image' | 'video' | 'document' | 'file';
  created_at: string;
  uploader?: {
    id: number;
    name: string;
    email: string;
  };
}

export default function MediaLibrary() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFiles, setSelectedFiles] = useState<number[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterFolder, setFilterFolder] = useState('');
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();

  // Fetch media files
  const { data: mediaData, isLoading } = useQuery({
    queryKey: ['media-library', searchQuery, filterType, filterFolder],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (filterType && filterType !== 'all') params.append('type', filterType);
      if (filterFolder) params.append('folder', filterFolder);
      params.append('per_page', '50');
      
      const response = await api.get(`/media-library?${params.toString()}`);
      return response.data;
    },
  });

  // Fetch folders
  const { data: foldersData } = useQuery({
    queryKey: ['media-folders'],
    queryFn: async () => {
      const response = await api.get('/media-library/folders');
      return response.data;
    },
  });

  // Fetch stats
  const { data: statsData } = useQuery({
    queryKey: ['media-stats'],
    queryFn: async () => {
      const response = await api.get('/media-library/stats');
      return response.data;
    },
  });

  const media: MediaFile[] = mediaData?.data || [];
  const folders: string[] = foldersData?.data || [];
  const stats = statsData?.data || {};

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files[]', file);
      });
      formData.append('folder', filterFolder || 'media');

      const response = await api.post('/media-library/upload-multiple', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Files uploaded successfully');
      queryClient.invalidateQueries({ queryKey: ['media-library'] });
      queryClient.invalidateQueries({ queryKey: ['media-stats'] });
      setShowUploadModal(false);
      setUploadFiles([]);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to upload files');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      if (ids.length === 1) {
        await api.delete(`/media-library/${ids[0]}`);
      } else {
        await api.post('/media-library/bulk-delete', { ids });
      }
    },
    onSuccess: () => {
      toast.success('File(s) deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['media-library'] });
      queryClient.invalidateQueries({ queryKey: ['media-stats'] });
      setSelectedFiles([]);
      setSelectedFile(null);
    },
    onError: () => {
      toast.error('Failed to delete file(s)');
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setUploadFiles(filesArray);
      setShowUploadModal(true);
    }
  };

  const handleUpload = () => {
    if (uploadFiles.length > 0) {
      uploadMutation.mutate(uploadFiles);
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      deleteMutation.mutate([id]);
    }
  };

  const handleBulkDelete = () => {
    if (selectedFiles.length === 0) return;
    if (window.confirm(`Delete ${selectedFiles.length} selected file(s)?`)) {
      deleteMutation.mutate(selectedFiles);
    }
  };

  const handleCopyUrl = (url: string, id: number) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success('URL copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleSelectFile = (id: number) => {
    setSelectedFiles((prev) =>
      prev.includes(id) ? prev.filter((fileId) => fileId !== id) : [...prev, id]
    );
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return ImageIcon;
      case 'video':
        return Video;
      case 'document':
        return FileText;
      default:
        return File;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Media Library</h1>
          <p className="text-gray-600 mt-1">Manage your images, videos, and files</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Upload className="h-4 w-4" />
            Upload Files
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,.pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Files</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_files || 0}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <File className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Images</p>
              <p className="text-2xl font-bold text-gray-900">{stats.by_type?.images || 0}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <ImageIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Videos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.by_type?.videos || 0}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Video className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Size</p>
              <p className="text-lg font-bold text-gray-900">{stats.total_size_formatted || '0 B'}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <HardDrive className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Actions Bar */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Types</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
            <option value="document">Documents</option>
          </select>

          {/* Folder Filter */}
          <select
            value={filterFolder}
            onChange={(e) => setFilterFolder(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Folders</option>
            {folders.map((folder) => (
              <option key={folder} value={folder}>
                {folder}
              </option>
            ))}
          </select>

          {/* View Mode */}
          <div className="flex items-center gap-1 border border-gray-300 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${
                viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
              }`}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${
                viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          {/* Bulk Actions */}
          {selectedFiles.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4" />
              Delete ({selectedFiles.length})
            </button>
          )}
        </div>
      </div>

      {/* Media Grid/List */}
      <div className="bg-white rounded-lg shadow">
        {media.length === 0 ? (
          <div className="text-center py-12">
            <ImageIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No files found</p>
            <p className="text-sm text-gray-400 mt-1">Upload files to get started</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 p-4">
            {media.map((file) => {
              const Icon = getFileIcon(file.type);
              return (
                <div
                  key={file.id}
                  className={`relative group border-2 rounded-lg overflow-hidden cursor-pointer hover:border-blue-500 transition-all ${
                    selectedFiles.includes(file.id) ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
                  }`}
                  onClick={() => setSelectedFile(file)}
                >
                  {/* Checkbox */}
                  <div
                    className="absolute top-2 left-2 z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelectFile(file.id);
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedFiles.includes(file.id)}
                      onChange={() => {}}
                      className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                  </div>

                  {/* Preview */}
                  <div className="aspect-square bg-gray-100 flex items-center justify-center">
                    {file.type === 'image' ? (
                      <img
                        src={file.url}
                        alt={file.original_filename}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Icon className="h-12 w-12 text-gray-400" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-2 bg-white">
                    <p className="text-xs font-medium text-gray-900 truncate">{file.original_filename}</p>
                    <p className="text-xs text-gray-500">{file.size_formatted}</p>
                  </div>

                  {/* Actions (on hover) */}
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyUrl(file.url, file.id);
                      }}
                      className="p-2 bg-white rounded-lg hover:bg-gray-100"
                      title="Copy URL"
                    >
                      {copiedId === file.id ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4 text-gray-700" />
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(file.id);
                      }}
                      className="p-2 bg-white rounded-lg hover:bg-gray-100"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="divide-y">
            {media.map((file) => {
              const Icon = getFileIcon(file.type);
              return (
                <div
                  key={file.id}
                  className={`flex items-center gap-4 p-4 hover:bg-gray-50 ${
                    selectedFiles.includes(file.id) ? 'bg-blue-50' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedFiles.includes(file.id)}
                    onChange={() => toggleSelectFile(file.id)}
                    className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  
                  {/* Preview */}
                  <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                    {file.type === 'image' ? (
                      <img
                        src={file.url}
                        alt={file.original_filename}
                        className="w-full h-full object-cover rounded"
                      />
                    ) : (
                      <Icon className="h-8 w-8 text-gray-400" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{file.original_filename}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                      <span>{file.size_formatted}</span>
                      {file.width && file.height && (
                        <span>{file.width} × {file.height}</span>
                      )}
                      <span>{file.folder}</span>
                      <span>{new Date(file.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyUrl(file.url, file.id)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                      title="Copy URL"
                    >
                      {copiedId === file.id ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => setSelectedFile(file)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(file.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Upload Files</h3>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadFiles([]);
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* File List */}
              <div className="border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                {uploadFiles.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No files selected</p>
                ) : (
                  <div className="space-y-2">
                    {uploadFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <File className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span className="text-sm text-gray-900 truncate">{file.name}</span>
                          <span className="text-xs text-gray-500 flex-shrink-0">
                            {(file.size / 1024).toFixed(1)} KB
                          </span>
                        </div>
                        <button
                          onClick={() =>
                            setUploadFiles((prev) => prev.filter((_, i) => i !== index))
                          }
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between gap-4">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <Plus className="h-4 w-4" />
                  Add More Files
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setShowUploadModal(false);
                      setUploadFiles([]);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={uploadFiles.length === 0 || uploadMutation.isPending}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {uploadMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Upload {uploadFiles.length} File(s)
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* File Details Modal */}
      {selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">File Details</h3>
              <button
                onClick={() => setSelectedFile(null)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Preview */}
              <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                {selectedFile.type === 'image' ? (
                  <img
                    src={selectedFile.url}
                    alt={selectedFile.original_filename}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  getFileIcon(selectedFile.type)({
                    className: 'h-24 w-24 text-gray-400',
                  } as any)
                )}
              </div>

              {/* Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Filename</p>
                  <p className="font-medium text-gray-900">{selectedFile.original_filename}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Size</p>
                  <p className="font-medium text-gray-900">{selectedFile.size_formatted}</p>
                </div>
                {selectedFile.width && selectedFile.height && (
                  <div>
                    <p className="text-sm text-gray-600">Dimensions</p>
                    <p className="font-medium text-gray-900">
                      {selectedFile.width} × {selectedFile.height}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">Type</p>
                  <p className="font-medium text-gray-900">{selectedFile.mime_type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Folder</p>
                  <p className="font-medium text-gray-900">{selectedFile.folder}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Uploaded</p>
                  <p className="font-medium text-gray-900">
                    {new Date(selectedFile.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* URL */}
              <div>
                <p className="text-sm text-gray-600 mb-2">URL</p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={selectedFile.url}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                  />
                  <button
                    onClick={() => handleCopyUrl(selectedFile.url, selectedFile.id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    {copiedId === selectedFile.id ? (
                      <>
                        <Check className="h-4 w-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t">
                <a
                  href={selectedFile.url}
                  download
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <Download className="h-4 w-4" />
                  Download
                </a>
                <button
                  onClick={() => {
                    handleDelete(selectedFile.id);
                    setSelectedFile(null);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete File
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

