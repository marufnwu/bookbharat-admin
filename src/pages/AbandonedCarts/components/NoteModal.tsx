/**
 * Note Modal Component
 * Modal for adding internal notes to abandoned carts
 */

import React, { useState } from 'react';
import { X, StickyNote, Save } from 'lucide-react';
import type { AddNoteForm, Cart } from '../types';

interface NoteModalProps {
  cart: Cart;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: AddNoteForm) => void;
  isPending: boolean;
}

const NoteModal: React.FC<NoteModalProps> = ({
  cart,
  isOpen,
  onClose,
  onSave,
  isPending,
}) => {
  const [formData, setFormData] = useState<AddNoteForm>({
    notes: '',
    note_type: 'internal',
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setFormData({ ...formData, notes: '' });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <StickyNote className="h-5 w-5 text-yellow-600" />
            Add Note
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Note Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Note Type
            </label>
            <select
              value={formData.note_type}
              onChange={(e) => setFormData({ ...formData, note_type: e.target.value as any })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="internal">Internal Note</option>
              <option value="customer_communication">Customer Communication</option>
              <option value="recovery_attempt">Recovery Attempt Log</option>
            </select>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Note Content
            </label>
            <textarea
              required
              rows={4}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter note details..."
            />
          </div>

          <div className="flex gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isPending ? 'Saving...' : 'Save Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NoteModal;
