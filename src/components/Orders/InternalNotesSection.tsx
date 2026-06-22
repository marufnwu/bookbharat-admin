import React, { useState } from 'react';
import { Lock, Plus, Loader2, User } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '../../utils/toast';
import { orderEnhancementsApi } from '../../api/orderEnhancements';

interface InternalNotesSectionProps {
  orderId: number;
}

const InternalNotesSection: React.FC<InternalNotesSectionProps> = ({ orderId }) => {
  const [newNote, setNewNote] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const queryClient = useQueryClient();

  // Fetch internal notes
  const { data: notesData, isLoading } = useQuery({
    queryKey: ['order-internal-notes', orderId],
    queryFn: () => orderEnhancementsApi.getInternalNotes(orderId),
  });

  const notes = notesData?.notes || [];

  // Add note mutation
  const addNoteMutation = useMutation({
    mutationFn: () => orderEnhancementsApi.addInternalNote(orderId, { note: newNote }),
    onSuccess: () => {
      toast.success('Internal note added');
      setNewNote('');
      setIsAdding(false);
      queryClient.invalidateQueries({ queryKey: ['order-internal-notes', orderId] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add note');
    },
  });

  const handleAddNote = () => {
    if (!newNote.trim()) {
      toast.error('Please enter a note');
      return;
    }
    addNoteMutation.mutate();
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg">
      <div className="p-4 border-b border-yellow-200 flex items-center justify-between">
        <h3 className="font-medium text-sm flex items-center gap-2">
          <Lock className="h-4 w-4 text-yellow-700" />
          Internal Notes (Admin Only)
        </h3>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="text-sm px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            Add Note
          </button>
        )}
      </div>

      <div className="p-4">
        {/* Add Note Form */}
        {isAdding && (
          <div className="mb-4 p-3 bg-white border border-yellow-300 rounded-lg">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add an internal note visible only to admins..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 resize-none text-sm"
              autoFocus
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleAddNote}
                disabled={addNoteMutation.isPending}
                className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50 text-sm flex items-center gap-2"
              >
                {addNoteMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Note'
                )}
              </button>
              <button
                onClick={() => {
                  setIsAdding(false);
                  setNewNote('');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Notes List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-yellow-600" />
          </div>
        ) : notes.length > 0 ? (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {notes.map((note) => (
              <div key={note.id} className="p-3 bg-white border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-yellow-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-gray-900">
                        {note.created_by_name || 
                         (note.adminUser ? `${note.adminUser.first_name} ${note.adminUser.last_name}` : 'Admin')}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(note.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">{note.note}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-yellow-700 text-center py-4">
            No internal notes yet. Click "Add Note" to create one.
          </p>
        )}
      </div>
    </div>
  );
};

export default InternalNotesSection;
