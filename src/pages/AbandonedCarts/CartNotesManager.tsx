import React, { useState } from 'react';
import {
  StickyNote,
  Plus,
  User,
  Mail,
  Phone,
  MessageCircle,
  Edit3,
  Trash2,
  Save,
  X,
  Clock,
  Filter,
  Calendar
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';

interface CartNotesManagerProps {
  cartId: number;
}

interface CartNote {
  id: number;
  type: 'internal' | 'customer_communication' | 'recovery_attempt';
  content: string;
  author?: {
    id: number;
    name: string;
    email: string;
  };
  communicationChannel?: 'email' | 'sms' | 'phone' | 'chat';
  createdAt: string;
  updatedAt?: string;
  metadata?: {
    templateUsed?: string;
    discountOffered?: string;
    customerResponse?: string;
  };
}

interface NewNote {
  type: 'internal' | 'customer_communication' | 'recovery_attempt';
  content: string;
  communicationChannel?: 'email' | 'sms' | 'phone' | 'chat';
  metadata?: {
    templateUsed?: string;
    discountOffered?: string;
  };
}

const CartNotesManager: React.FC<CartNotesManagerProps> = ({ cartId }) => {
  const queryClient = useQueryClient();
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingNote, setEditingNote] = useState<number | null>(null);
  const [filter, setFilter] = useState<'all' | 'internal' | 'customer_communication' | 'recovery_attempt'>('all');
  const [newNote, setNewNote] = useState<NewNote>({
    type: 'internal',
    content: '',
  });

  const {
    data: notes,
    isLoading,
    error
  } = useQuery({
    queryKey: ['cart-notes', cartId],
    queryFn: async () => {
      const response = await fetch(`/api/v1/admin/abandoned-carts/${cartId}/notes`);
      if (!response.ok) {
        throw new Error('Failed to fetch cart notes');
      }
      return response.json() as Promise<{ success: boolean; data: CartNote[] }>;
    },
    select: (result) => result.data,
  });

  const addNoteMutation = useMutation({
    mutationFn: async (noteData: NewNote) => {
      const response = await fetch(`/api/v1/admin/abandoned-carts/${cartId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(noteData),
      });

      if (!response.ok) {
        throw new Error('Failed to add note');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart-notes', cartId] });
      setIsAddingNote(false);
      setNewNote({ type: 'internal', content: '' });
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: async ({ noteId, noteData }: { noteId: number; noteData: Partial<NewNote> }) => {
      const response = await fetch(`/api/v1/admin/abandoned-carts/${cartId}/notes/${noteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(noteData),
      });

      if (!response.ok) {
        throw new Error('Failed to update note');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart-notes', cartId] });
      setEditingNote(null);
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: number) => {
      const response = await fetch(`/api/v1/admin/abandoned-carts/${cartId}/notes/${noteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete note');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart-notes', cartId] });
    },
  });

  const filteredNotes = notes?.filter(note =>
    filter === 'all' || note.type === filter
  ) || [];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'internal':
        return <User className="h-4 w-4" />;
      case 'customer_communication':
        return <MessageCircle className="h-4 w-4" />;
      case 'recovery_attempt':
        return <StickyNote className="h-4 w-4" />;
      default:
        return <StickyNote className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'internal':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'customer_communication':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'recovery_attempt':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getChannelIcon = (channel?: string) => {
    switch (channel) {
      case 'email':
        return <Mail className="h-3 w-3" />;
      case 'sms':
        return <Phone className="h-3 w-3" />;
      case 'phone':
        return <Phone className="h-3 w-3" />;
      case 'chat':
        return <MessageCircle className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const handleAddNote = () => {
    if (newNote.content.trim()) {
      addNoteMutation.mutate(newNote);
    }
  };

  const handleUpdateNote = (noteId: number) => {
    const note = notes?.find(n => n.id === noteId);
    if (note && editingNoteContent.trim()) {
      updateNoteMutation.mutate({
        noteId,
        noteData: {
          content: editingNoteContent,
        }
      });
    }
  };

  const [editingNoteContent, setEditingNoteContent] = useState('');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading notes...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <X className="h-12 w-12 mx-auto mb-4 text-red-500" />
        <p className="text-red-600">Failed to load notes</p>
        <p className="text-gray-500 text-sm mt-1">Please try again later</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <StickyNote className="h-5 w-5 mr-2" />
          Cart Notes & Communication
        </h3>

        <div className="flex items-center space-x-3">
          {/* Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Notes</option>
              <option value="internal">Internal Notes</option>
              <option value="customer_communication">Customer Communication</option>
              <option value="recovery_attempt">Recovery Attempts</option>
            </select>
          </div>

          {/* Add Note Button */}
          <button
            onClick={() => setIsAddingNote(true)}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Note
          </button>
        </div>
      </div>

      {/* Add Note Form */}
      {isAddingNote && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Add New Note</h4>
              <button
                onClick={() => setIsAddingNote(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Note Type
                </label>
                <select
                  value={newNote.type}
                  onChange={(e) => setNewNote({ ...newNote, type: e.target.value as any })}
                  className="w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="internal">Internal Note</option>
                  <option value="customer_communication">Customer Communication</option>
                  <option value="recovery_attempt">Recovery Attempt</option>
                </select>
              </div>

              {(newNote.type === 'customer_communication' || newNote.type === 'recovery_attempt') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Communication Channel
                  </label>
                  <select
                    value={newNote.communicationChannel || ''}
                    onChange={(e) => setNewNote({ ...newNote, communicationChannel: e.target.value as any })}
                    className="w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Channel</option>
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                    <option value="phone">Phone</option>
                    <option value="chat">Chat</option>
                  </select>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Note Content
              </label>
              <textarea
                value={newNote.content}
                onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                rows={3}
                className="w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your note here..."
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setIsAddingNote(false);
                  setNewNote({ type: 'internal', content: '' });
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={handleAddNote}
                disabled={addNoteMutation.isPending}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {addNoteMutation.isPending ? 'Saving...' : 'Save Note'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notes List */}
      {filteredNotes.length === 0 ? (
        <div className="text-center py-12">
          <StickyNote className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">No notes found</p>
          <p className="text-gray-400 text-sm mt-1">
            {filter === 'all'
              ? 'Add your first note to track communication and recovery efforts'
              : `No ${filter} notes found for this cart`
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotes.map((note) => (
            <div key={note.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Note Header */}
                  <div className="flex items-center space-x-3 mb-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getTypeColor(note.type)}`}>
                      {getTypeIcon(note.type)}
                      <span className="ml-1 capitalize">
                        {note.type.replace('_', ' ')}
                      </span>
                    </span>

                    {note.communicationChannel && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs">
                        {getChannelIcon(note.communicationChannel)}
                        <span className="ml-1 capitalize">{note.communicationChannel}</span>
                      </span>
                    )}

                    <span className="text-sm text-gray-500 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
                    </span>

                    {note.author && (
                      <span className="text-sm text-gray-600">
                        by {note.author.name}
                      </span>
                    )}
                  </div>

                  {/* Note Content */}
                  {editingNote === note.id ? (
                    <div className="space-y-3">
                      <textarea
                        value={editingNoteContent}
                        onChange={(e) => setEditingNoteContent(e.target.value)}
                        rows={3}
                        className="w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setEditingNote(null);
                            setEditingNoteContent('');
                          }}
                          className="px-3 py-1 text-sm border border-gray-300 rounded text-gray-600 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleUpdateNote(note.id)}
                          disabled={updateNoteMutation.isPending}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                          {updateNoteMutation.isPending ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-700 whitespace-pre-wrap">{note.content}</p>
                  )}

                  {/* Metadata */}
                  {note.metadata && (
                    <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
                      {note.metadata.templateUsed && (
                        <div className="flex items-center text-xs text-gray-600">
                          <span className="font-medium">Template:</span>
                          <span className="ml-2">{note.metadata.templateUsed}</span>
                        </div>
                      )}
                      {note.metadata.discountOffered && (
                        <div className="flex items-center text-xs text-gray-600">
                          <span className="font-medium">Discount:</span>
                          <span className="ml-2 text-green-600 font-medium">{note.metadata.discountOffered}</span>
                        </div>
                      )}
                      {note.metadata.customerResponse && (
                        <div className="flex items-center text-xs text-gray-600">
                          <span className="font-medium">Customer Response:</span>
                          <span className="ml-2">{note.metadata.customerResponse}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Updated At */}
                  {note.updatedAt && note.updatedAt !== note.createdAt && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <span className="text-xs text-gray-500 italic">
                        Updated {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => {
                      setEditingNote(note.id);
                      setEditingNoteContent(note.content);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                    title="Edit note"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteNoteMutation.mutate(note.id)}
                    className="text-gray-400 hover:text-red-600"
                    title="Delete note"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">Summary</h4>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-blue-600">
              {notes?.filter(n => n.type === 'internal').length || 0}
            </div>
            <div className="text-xs text-gray-600">Internal Notes</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-green-600">
              {notes?.filter(n => n.type === 'customer_communication').length || 0}
            </div>
            <div className="text-xs text-gray-600">Customer Communication</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-yellow-600">
              {notes?.filter(n => n.type === 'recovery_attempt').length || 0}
            </div>
            <div className="text-xs text-gray-600">Recovery Attempts</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartNotesManager;