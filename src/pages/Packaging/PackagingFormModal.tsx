import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button, Input } from '../../components';

interface PackagingOption {
  id?: number;
  name: string;
  code: string;
  price: number;
  description: string;
  icon_url: string;
  video_url: string;
  sort_order: number;
  is_active: boolean;
}

interface PackagingFormModalProps {
  initialData?: PackagingOption | null;
  onClose: () => void;
  onSubmit: (data: PackagingOption) => Promise<void>;
}

export const PackagingFormModal: React.FC<PackagingFormModalProps> = ({ initialData, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<PackagingOption>({
    name: '',
    code: '',
    price: 0,
    description: '',
    icon_url: '',
    video_url: '',
    sort_order: 0,
    is_active: true,
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value,
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.checked }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.code) newErrors.code = 'Code is required';
    if (formData.price < 0) newErrors.price = 'Price cannot be negative';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    setLoading(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {initialData?.id ? 'Edit Packaging Option' : 'New Packaging Option'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <Input
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Gift Wrap"
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Code * (Unique)</label>
              <Input
                name="code"
                value={formData.code}
                onChange={handleChange}
                placeholder="e.g. gift_wrap"
              />
               {errors.code && <p className="text-xs text-red-500 mt-1">{errors.code}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
              <Input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                step="0.01"
              />
              {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price}</p>}
             </div>
             <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
              <Input
                type="number"
                name="sort_order"
                value={formData.sort_order}
                onChange={handleChange}
              />
             </div>
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
             <textarea
                name="description"
                value={formData.description || ''}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                rows={2}
             />
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Icon URL</label>
             <Input
                name="icon_url"
                value={formData.icon_url || ''}
                onChange={handleChange}
                placeholder="https://..."
             />
             {formData.icon_url && (
               <div className="mt-2 text-xs text-gray-500 flex items-center gap-2">
                 Preview: <img src={formData.icon_url} alt="Icon" className="w-8 h-8 object-contain border rounded" />
               </div>
             )}
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Video URL (Embed)</label>
             <Input
                name="video_url"
                value={formData.video_url || ''}
                onChange={handleChange}
                placeholder="https://youtube.com/embed/..."
             />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              name="is_active"
              checked={formData.is_active}
              onChange={handleCheckboxChange}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
              Active
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Option'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
