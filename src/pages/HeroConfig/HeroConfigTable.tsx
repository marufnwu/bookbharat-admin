import React from 'react';
import { Edit, Trash2, Eye, CheckCircle, Image as ImageIcon, Video, Star, Award } from 'lucide-react';
import { HeroConfig } from '../../types/hero';
import { LoadingSpinner } from '../../components';

interface HeroConfigTableProps {
  configs: HeroConfig[];
  isLoading: boolean;
  activeConfig?: HeroConfig;
  setActiveMutation: any;
  onEdit: (config: HeroConfig) => void;
  onDelete: (config: HeroConfig) => void;
  onPreview: (config: HeroConfig) => void;
}

const HeroConfigTable: React.FC<HeroConfigTableProps> = ({
  configs,
  isLoading,
  activeConfig,
  setActiveMutation,
  onEdit,
  onDelete,
  onPreview,
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (configs.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Hero Configurations</h3>
        <p className="text-gray-600 mb-6">Get started by creating your first hero configuration</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Variant
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Title
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Media
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {configs.map((config) => (
            <tr key={config.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-900">{config.variant}</span>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900">{config.title}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    config.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {config.is_active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  {config.backgroundImage && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                      <ImageIcon className="h-3 w-3" />
                      Image
                    </span>
                  )}
                  {config.videoUrl && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                      <Video className="h-3 w-3" />
                      Video
                    </span>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onPreview(config)}
                    className="p-1 text-purple-600 hover:bg-purple-50 rounded"
                    title="Preview"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onEdit(config)}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                    title="Edit"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setActiveMutation.mutate(config.variant)}
                    className={`p-1 ${
                      config.is_active
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-green-600 hover:bg-green-50'
                    } rounded disabled:opacity-50`}
                    title={config.is_active ? 'Already Active' : 'Set as Active'}
                    disabled={config.is_active || setActiveMutation.isPending}
                  >
                    {setActiveMutation.isPending && !config.is_active ? (
                      <div className="animate-spin h-4 w-4 border-2 border-green-600 border-t-transparent rounded-full"></div>
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() => onDelete(config)}
                    className={`p-1 ${
                      config.is_active
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-red-600 hover:bg-red-50'
                    } rounded`}
                    title={config.is_active ? 'Cannot delete active config' : 'Delete'}
                    disabled={config.is_active}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default HeroConfigTable;

