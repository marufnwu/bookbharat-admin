import React, { useState } from 'react';
import { Sparkles, Loader2, X, Check, ChevronDown, ChevronUp, Copy, Zap } from 'lucide-react';
import { aiTasksApi } from '../../api/aiTasks';
import { toast } from '../../utils/toast';
import { computeSeoScore, getSeoScoreColor, getSeoScoreLabel } from '../../utils/seoScore';
import type { SeoOptimizationOutput } from '../../types/ai';

interface AiSeoSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  formData: Record<string, any>;
  categoryName?: string;
  onApplyField: (field: string, value: any) => void;
  onApplyAll: (suggestions: Record<string, string>) => void;
}

interface FieldSuggestion {
  field: string;
  label: string;
  currentValue: string;
  suggestedValue: string;
  charLimit?: number;
}

const AiSeoSidebar: React.FC<AiSeoSidebarProps> = ({
  isOpen,
  onClose,
  formData,
  categoryName = '',
  onApplyField,
  onApplyAll,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SeoOptimizationOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set());
  const [appliedFields, setAppliedFields] = useState<Set<string>>(new Set());

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    setAppliedFields(new Set());

    try {
      const response = await aiTasksApi.seoOptimize({
        name: formData.name || '',
        description: formData.description || '',
        short_description: formData.short_description || '',
        meta_title: formData.meta_title || '',
        meta_description: formData.meta_description || '',
        meta_keywords: formData.meta_keywords || '',
        focus_keyword: formData.focus_keyword || '',
        slug: formData.slug || '',
        author: formData.author || '',
        category: categoryName,
        language: formData.language || 'English',
        format: formData.format || '',
        isbn: formData.isbn || '',
        mode: 'single',
      });

      if (response.success && response.data) {
        setResults(response.data);
        setExpandedFields(new Set(['focus_keyword', 'meta_title', 'meta_description']));
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate SEO suggestions');
    } finally {
      setIsLoading(false);
    }
  };

  const getSuggestions = (): FieldSuggestion[] => {
    if (!results) return [];
    return [
      {
        field: 'focus_keyword',
        label: 'Focus Keyword',
        currentValue: formData.focus_keyword || '',
        suggestedValue: results.improved_focus_keyword || '',
      },
      {
        field: 'meta_title',
        label: 'Meta Title',
        currentValue: formData.meta_title || '',
        suggestedValue: results.improved_meta_title || '',
        charLimit: 60,
      },
      {
        field: 'meta_description',
        label: 'Meta Description',
        currentValue: formData.meta_description || '',
        suggestedValue: results.improved_meta_description || '',
        charLimit: 160,
      },
      {
        field: 'slug',
        label: 'URL Slug',
        currentValue: formData.slug || '',
        suggestedValue: results.improved_slug || '',
      },
      {
        field: 'meta_keywords',
        label: 'Meta Keywords',
        currentValue: formData.meta_keywords || '',
        suggestedValue: (results.keyword_suggestions || []).join(', '),
      },
      {
        field: 'short_description',
        label: 'Short Description',
        currentValue: formData.short_description || '',
        suggestedValue: results.improved_short_description || '',
      },
      {
        field: 'description',
        label: 'Full Description',
        currentValue: (formData.description || '').replace(/<[^>]*>/g, '').substring(0, 80) + '...',
        suggestedValue: results.improved_description || '',
      },
    ];
  };

  const handleApplyField = (suggestion: FieldSuggestion) => {
    onApplyField(suggestion.field, suggestion.suggestedValue);
    setAppliedFields(prev => new Set(prev).add(suggestion.field));
    toast.success(`${suggestion.label} applied`);
  };

  const handleApplyAll = () => {
    if (!results) return;
    onApplyAll({
      focus_keyword: results.improved_focus_keyword,
      meta_title: results.improved_meta_title,
      meta_description: results.improved_meta_description,
      slug: results.improved_slug,
      meta_keywords: (results.keyword_suggestions || []).join(', '),
      short_description: results.improved_short_description,
      description: results.improved_description,
    });
    setAppliedFields(new Set(['focus_keyword', 'meta_title', 'meta_description', 'slug', 'meta_keywords', 'short_description', 'description']));
    toast.success('All suggestions applied');
  };

  const toggleField = (field: string) => {
    setExpandedFields(prev => {
      const next = new Set(prev);
      if (next.has(field)) next.delete(field);
      else next.add(field);
      return next;
    });
  };

  const suggestions = getSuggestions();
  const currentScore = computeSeoScore(formData).score;
  const expectedScore = results?.expected_score ?? currentScore;
  const currentScoreColor = getSeoScoreColor(currentScore);
  const expectedScoreColor = getSeoScoreColor(expectedScore);
  const scoreDiff = results ? expectedScore - currentScore : 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-[420px] bg-white border-l border-gray-200 shadow-2xl flex flex-col transition-transform">
      {/* Header */}
      <div className="px-5 py-4 border-b bg-gradient-to-r from-purple-50 to-indigo-50 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-purple-600 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">AI SEO Assistant</h2>
            <p className="text-xs text-gray-500">Generate optimized SEO content</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="h-5 w-5 text-gray-400" />
        </button>
      </div>

      {/* Score bar */}
      <div className="px-5 py-3 border-b bg-gray-50 flex-shrink-0">
        <div className="flex items-center gap-3">
          {/* Current score circle */}
          <div className="flex items-center gap-2">
            <div className="relative w-10 h-10 flex-shrink-0">
              <svg className="w-10 h-10 -rotate-90" viewBox="0 0 44 44">
                <circle cx="22" cy="22" r="18" fill="none" stroke="#e5e7eb" strokeWidth="4" />
                <circle
                  cx="22" cy="22" r="18" fill="none" stroke={currentScoreColor} strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 18}
                  strokeDashoffset={2 * Math.PI * 18 * (1 - currentScore / 100)}
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold" style={{ color: currentScoreColor }}>{currentScore}</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500">Current</p>
              <p className="text-xs font-medium" style={{ color: currentScoreColor }}>{getSeoScoreLabel(currentScore)}</p>
            </div>
          </div>

          {/* Arrow and expected score */}
          {results && (
            <>
              <div className="flex flex-col items-center">
                <span className={`text-sm font-bold ${scoreDiff > 0 ? 'text-green-600' : scoreDiff < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                  {scoreDiff > 0 ? `+${scoreDiff}` : scoreDiff}
                </span>
                <svg className={`w-5 h-5 ${scoreDiff > 0 ? 'text-green-500' : scoreDiff < 0 ? 'text-red-500 rotate-180' : 'text-gray-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative w-10 h-10 flex-shrink-0">
                  <svg className="w-10 h-10 -rotate-90" viewBox="0 0 44 44">
                    <circle cx="22" cy="22" r="18" fill="none" stroke="#e5e7eb" strokeWidth="4" />
                    <circle
                      cx="22" cy="22" r="18" fill="none" stroke={expectedScoreColor} strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 18}
                      strokeDashoffset={2 * Math.PI * 18 * (1 - expectedScore / 100)}
                      className="transition-all duration-500"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold" style={{ color: expectedScoreColor }}>{expectedScore}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Expected</p>
                  <p className="text-xs font-medium" style={{ color: expectedScoreColor }}>{getSeoScoreLabel(expectedScore)}</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {!results && !isLoading && !error && (
          <div className="flex flex-col items-center justify-center h-full px-6 text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-purple-500" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">Generate SEO Content</h3>
            <p className="text-sm text-gray-500 mb-6">
              AI will analyze your product and suggest optimized focus keyword, meta title, description, slug, and keywords.
            </p>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={!formData.name?.trim()}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Generate SEO Suggestions
            </button>
            {!formData.name?.trim() && (
              <p className="text-xs text-gray-400 mt-2">Enter a product name first</p>
            )}
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center h-full px-6">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600 mb-4" />
            <p className="text-sm font-medium text-gray-700">Analyzing SEO...</p>
            <p className="text-xs text-gray-400 mt-1">Generating optimized content for all fields</p>
          </div>
        )}

        {error && (
          <div className="p-6">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button
              type="button"
              onClick={handleGenerate}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
            >
              Try Again
            </button>
          </div>
        )}

        {results && (
          <div className="p-4 space-y-3">
            {/* Apply All button */}
            <button
              type="button"
              onClick={handleApplyAll}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all font-medium text-sm"
            >
              <Zap className="h-4 w-4" />
              Apply All Suggestions
            </button>

            {/* Improvement tips */}
            {results.improvement_tips && results.improvement_tips.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs font-semibold text-amber-800 mb-1">Improvement Tips</p>
                <ul className="text-xs text-amber-700 space-y-0.5 list-disc list-inside">
                  {results.improvement_tips.map((tip: string, i: number) => (
                    <li key={i}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Field suggestions */}
            {suggestions.map((suggestion) => {
              const isExpanded = expandedFields.has(suggestion.field);
              const isApplied = appliedFields.has(suggestion.field);
              const hasDiff = suggestion.suggestedValue && suggestion.suggestedValue !== suggestion.currentValue;

              return (
                <div
                  key={suggestion.field}
                  className={`border rounded-lg overflow-hidden transition-colors ${
                    isApplied ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'
                  }`}
                >
                  {/* Field header */}
                  <button
                    type="button"
                    onClick={() => toggleField(suggestion.field)}
                    className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {isApplied ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : hasDiff ? (
                        <div className="w-2 h-2 bg-purple-500 rounded-full" />
                      ) : (
                        <div className="w-2 h-2 bg-gray-300 rounded-full" />
                      )}
                      <span className="text-sm font-medium text-gray-900">{suggestion.label}</span>
                      {suggestion.charLimit && (
                        <span className="text-xs text-gray-400">({suggestion.charLimit} chars)</span>
                      )}
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    )}
                  </button>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-3">
                      {/* Current value */}
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Current</p>
                        <div className="p-2 bg-gray-50 rounded text-sm text-gray-700 min-h-[36px]">
                          {suggestion.currentValue || <span className="text-gray-400 italic">Empty</span>}
                        </div>
                      </div>

                      {/* Suggested value */}
                      {suggestion.suggestedValue && (
                        <div>
                          <p className="text-xs font-medium text-purple-600 mb-1">AI Suggestion</p>
                          <div className="p-2 bg-purple-50 border border-purple-100 rounded text-sm text-gray-800 min-h-[36px]">
                            {suggestion.field === 'meta_keywords' ? (
                              <div className="flex flex-wrap gap-1">
                                {suggestion.suggestedValue.split(',').map((kw: string, i: number) => (
                                  <span key={i} className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full">
                                    {kw.trim()}
                                  </span>
                                ))}
                              </div>
                            ) : suggestion.field === 'description' ? (
                              <div
                                className="prose prose-sm max-w-none text-gray-800"
                                dangerouslySetInnerHTML={{ __html: suggestion.suggestedValue }}
                              />
                            ) : (
                              <p className="whitespace-pre-wrap">{suggestion.suggestedValue}</p>
                            )}
                            {suggestion.charLimit && (
                              <p className={`text-xs mt-1 ${suggestion.suggestedValue.length > suggestion.charLimit ? 'text-red-500' : 'text-gray-400'}`}>
                                {suggestion.suggestedValue.length}/{suggestion.charLimit}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Action buttons */}
                      {suggestion.suggestedValue && hasDiff && (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleApplyField(suggestion)}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                          >
                            <Check className="h-3.5 w-3.5" />
                            Apply
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(suggestion.suggestedValue);
                              toast.success('Copied to clipboard');
                            }}
                            className="flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <Copy className="h-3.5 w-3.5" />
                            Copy
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Keyword suggestions */}
            {results.keyword_suggestions && results.keyword_suggestions.length > 0 && (
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-900 mb-2">Keyword Suggestions</p>
                <div className="flex flex-wrap gap-1.5">
                  {results.keyword_suggestions.map((kw: string, i: number) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-full border border-indigo-100"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      {results && (
        <div className="px-5 py-3 border-t bg-gray-50 flex-shrink-0">
          <button
            type="button"
            onClick={handleGenerate}
            className="w-full px-4 py-2 border border-purple-200 text-purple-700 rounded-lg hover:bg-purple-50 transition-colors text-sm font-medium"
          >
            Regenerate Suggestions
          </button>
        </div>
      )}
    </div>
  );
};

export default AiSeoSidebar;
