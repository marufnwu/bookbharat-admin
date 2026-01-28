import React, { useState } from 'react';
import { X, Loader2, Sparkles, Check, RotateCcw } from 'lucide-react';
import { aiTasksApi } from '../api/aiTasks';
import toast from 'react-hot-toast';
import type { ProductFieldGenerationInput, ProductFieldGenerationOutput } from '../types/ai';

interface AiFieldGeneratorProps {
  initialData?: Partial<ProductFieldGenerationInput>;
  onApply: (fields: ProductFieldGenerationOutput) => void;
  onClose: () => void;
}

const AiFieldGenerator: React.FC<AiFieldGeneratorProps> = ({
  initialData = {},
  onApply,
  onClose,
}) => {
  const [input, setInput] = useState<ProductFieldGenerationInput>({
    book_name: initialData.book_name || '',
    author: initialData.author || '',
    publisher: initialData.publisher || '',
    language: initialData.language || 'Bengali',
    category_id: initialData.category_id,
    provider_id: initialData.provider_id,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [generatedFields, setGeneratedFields] = useState<ProductFieldGenerationOutput | null>(null);
  const [aiMetadata, setAiMetadata] = useState<{
    provider: string;
    tokens: number;
    cost?: number;
  } | null>(null);
  const [editedFields, setEditedFields] = useState<Set<string>>(new Set());

  const handleGenerate = async () => {
    if (!input.book_name) {
      toast.error('Book name is required');
      return;
    }

    setIsLoading(true);
    try {
      const response = await aiTasksApi.generateProductFields(input);
      
      if (response.success) {
        setGeneratedFields(response.data);
        setAiMetadata({
          provider: response.provider_display_name,
          tokens: response.tokens_used,
          cost: response.estimated_cost || undefined,
        });
        setEditedFields(new Set());
        toast.success('Content generated successfully!');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to generate content');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFieldEdit = (field: keyof ProductFieldGenerationOutput, value: any) => {
    if (!generatedFields) return;
    setGeneratedFields({
      ...generatedFields,
      [field]: value,
    });
    setEditedFields(prev => new Set(prev).add(field));
  };

  const handleApply = () => {
    if (generatedFields) {
      onApply(generatedFields);
      toast.success('AI content applied to product form!');
      onClose();
    }
  };

  const handleRegenerate = () => {
    setGeneratedFields(null);
    setAiMetadata(null);
    setEditedFields(new Set());
    handleGenerate();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">✨ AI Assistant</h2>
              <p className="text-sm text-gray-600">Generate product content using AI</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {!generatedFields ? (
            /* Input Section */
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Book Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={input.book_name}
                  onChange={(e) => setInput({ ...input, book_name: e.target.value })}
                  placeholder="Enter book name..."
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  disabled={isLoading}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
                  <input
                    type="text"
                    value={input.author || ''}
                    onChange={(e) => setInput({ ...input, author: e.target.value })}
                    placeholder="Author name..."
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Publisher</label>
                  <input
                    type="text"
                    value={input.publisher || ''}
                    onChange={(e) => setInput({ ...input, publisher: e.target.value })}
                    placeholder="Publisher name..."
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                  <select
                    value={input.language}
                    onChange={(e) => setInput({ ...input, language: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    disabled={isLoading}
                  >
                    <option value="Bengali">Bengali</option>
                    <option value="Hindi">Hindi</option>
                    <option value="English">English</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ISBN (Optional)</label>
                  <input
                    type="text"
                    value={input.isbn || ''}
                    onChange={(e) => setInput({ ...input, isbn: e.target.value })}
                    placeholder="978-XXXXXXXXXX"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pages (Optional)</label>
                  <input
                    type="number"
                    value={input.pages || ''}
                    onChange={(e) => setInput({ ...input, pages: e.target.value ? parseInt(e.target.value) : undefined })}
                    placeholder="e.g., 250"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    disabled={isLoading}
                    min="1"
                  />
                </div>
              </div>

              {/* Key Themes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Key Themes / Topics (Optional)
                </label>
                <textarea
                  value={input.key_themes || ''}
                  onChange={(e) => setInput({ ...input, key_themes: e.target.value })}
                  placeholder="e.g., Romance, Adventure, Mystery, Historical fiction..."
                  rows={2}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none"
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Help AI understand the book's main themes or subject matter
                </p>
              </div>

              {isLoading && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-3" />
                  <p className="text-indigo-900 font-medium">AI is generating content...</p>
                  <p className="text-sm text-indigo-600 mt-1">This may take 5-15 seconds</p>
                </div>
              )}
            </div>
          ) : (
            /* Preview Section */
            <div className="space-y-4">
              {/* AI Info Badge */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Check className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-green-900">
                    Generated by <strong>{aiMetadata?.provider}</strong>
                  </span>
                </div>
                <div className="flex items-center space-x-4 text-sm text-green-700">
                  <span>{aiMetadata?.tokens} tokens</span>
                  {aiMetadata?.cost && <span>~${aiMetadata.cost.toFixed(4)}</span>}
                </div>
              </div>

              {/* Description */}
              <FieldCard
                title="Description"
                value={generatedFields.description}
                onChange={(v) => handleFieldEdit('description', v)}
                isEdited={editedFields.has('description')}
                multiline
                rows={6}
              />

              {/* Short Description */}
              <FieldCard
                title="Short Description"
                value={generatedFields.short_description}
                onChange={(v) => handleFieldEdit('short_description', v)}
                isEdited={editedFields.has('short_description')}
                multiline
                rows={3}
              />

              {/* Meta Title */}
              <FieldCard
                title="Meta Title"
                value={generatedFields.meta_title}
                onChange={(v) => handleFieldEdit('meta_title', v)}
                isEdited={editedFields.has('meta_title')}
                maxLength={60}
              />

              {/* Meta Description */}
              <FieldCard
                title="Meta Description"
                value={generatedFields.meta_description}
                onChange={(v) => handleFieldEdit('meta_description', v)}
                isEdited={editedFields.has('meta_description')}
                multiline
                rows={2}
                maxLength={160}
              />

              {/* Meta Keywords */}
              <FieldCard
                title="Meta Keywords"
                value={generatedFields.meta_keywords}
                onChange={(v) => handleFieldEdit('meta_keywords', v)}
                isEdited={editedFields.has('meta_keywords')}
              />

              {/* Tags */}
              <div className="border rounded-lg p-4 bg-white">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center">
                    ✨ Tags
                    {editedFields.has('tags') && (
                      <span className="ml-2 text-xs text-orange-600">(Edited)</span>
                    )}
                  </label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {generatedFields.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>

          <div className="flex items-center space-x-3">
            {generatedFields ? (
              <>
                <button
                  onClick={handleRegenerate}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center space-x-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Regenerate</span>
                </button>
                <button
                  onClick={handleApply}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2 font-medium"
                >
                  <Check className="w-5 h-5" />
                  <span>Use It</span>
                </button>
              </>
            ) : (
              <button
                onClick={handleGenerate}
                disabled={isLoading || !input.book_name}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Generate with AI</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Component
interface FieldCardProps {
  title: string;
  value: string;
  onChange: (value: string) => void;
  isEdited: boolean;
  multiline?: boolean;
  rows?: number;
  maxLength?: number;
}

const FieldCard: React.FC<FieldCardProps> = ({
  title,
  value,
  onChange,
  isEdited,
  multiline = false,
  rows = 3,
  maxLength,
}) => {
  const currentLength = value.length;
  const isOverLimit = maxLength && currentLength > maxLength;

  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-gray-700 flex items-center">
          ✨ {title}
          {isEdited && <span className="ml-2 text-xs text-orange-600">(Edited)</span>}
        </label>
        {maxLength && (
          <span className={`text-xs ${isOverLimit ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
            {currentLength}/{maxLength}
            {isOverLimit && ' ⚠️'}
          </span>
        )}
      </div>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 resize-none"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
        />
      )}
    </div>
  );
};

export default AiFieldGenerator;
