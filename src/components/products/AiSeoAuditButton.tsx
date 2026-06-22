import React, { useState } from 'react';
import { Loader2, Sparkles, Check, Zap } from 'lucide-react';
import { aiTasksApi } from '../../api/aiTasks';
import { toast } from '../../utils/toast';
import type { SeoOptimizationOutput } from '../../types/ai';

interface AiSeoAuditButtonProps {
  formData: any;
  onApply: (suggestions: Partial<SeoOptimizationOutput>) => void;
}

const AiSeoAuditButton: React.FC<AiSeoAuditButtonProps> = ({ formData, onApply }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SeoOptimizationOutput | null>(null);

  const handleRunAudit = async () => {
    if (!formData.name?.trim()) {
      toast.error('Please enter a product name first');
      return;
    }

    setIsLoading(true);
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
        category: formData.category || '',
        language: formData.language || 'English',
        format: formData.format || '',
        isbn: formData.isbn || '',
      });

      if (response.success && response.data) {
        setResults(response.data);
        toast.success('SEO analysis complete!');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to run SEO audit');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyAll = () => {
    if (!results) return;
    onApply({
      improved_meta_title: results.improved_meta_title,
      improved_meta_description: results.improved_meta_description,
      improved_focus_keyword: results.improved_focus_keyword,
      improved_slug: results.improved_slug,
    });
    toast.success('All suggestions applied!');
  };

  const handleApplyIndividual = (field: string, value: string) => {
    onApply({ [field]: value } as any);
    toast.success('Applied!');
  };

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={handleRunAudit}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Analyzing SEO...
          </>
        ) : (
          <>
            <Sparkles className="h-5 w-5" />
            Run AI SEO Audit
          </>
        )}
      </button>

      {results && (
        <div className="space-y-3 p-4 bg-purple-50 border border-purple-200 rounded-xl">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-purple-900">AI Suggestions</h4>
            <span className="text-xs text-purple-600">Current score: {results.current_score}/100</span>
          </div>

          {results.improved_focus_keyword && (
            <SuggestionRow
              label="Focus Keyword"
              value={results.improved_focus_keyword}
              onApply={() => handleApplyIndividual('improved_focus_keyword', results.improved_focus_keyword)}
            />
          )}

          {results.improved_meta_title && (
            <SuggestionRow
              label="Meta Title"
              value={results.improved_meta_title}
              onApply={() => handleApplyIndividual('improved_meta_title', results.improved_meta_title)}
            />
          )}

          {results.improved_meta_description && (
            <SuggestionRow
              label="Meta Description"
              value={results.improved_meta_description}
              onApply={() => handleApplyIndividual('improved_meta_description', results.improved_meta_description)}
            />
          )}

          {results.keyword_suggestions?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-purple-800 mb-1">Keyword suggestions:</p>
              <div className="flex flex-wrap gap-1">
                {results.keyword_suggestions.map((kw, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full cursor-pointer hover:bg-purple-200"
                    onClick={() => handleApplyIndividual('keyword', kw)}
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {results.improvement_tips?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-purple-800 mb-1">Improvement tips:</p>
              <ol className="list-decimal list-inside text-xs text-purple-700 space-y-0.5">
                {results.improvement_tips.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ol>
            </div>
          )}

          <button
            type="button"
            onClick={handleApplyAll}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Zap className="h-4 w-4" />
            Apply All Suggestions
          </button>
        </div>
      )}
    </div>
  );
};

const SuggestionRow: React.FC<{
  label: string;
  value: string;
  onApply: () => void;
}> = ({ label, value, onApply }) => (
  <div className="flex items-start gap-2 p-2 bg-white rounded-lg border border-purple-100">
    <div className="flex-1 min-w-0">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="text-sm text-gray-800 truncate">{value}</p>
    </div>
    <button
      type="button"
      onClick={onApply}
      className="flex items-center gap-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors whitespace-nowrap"
    >
      <Check className="h-3 w-3" /> Apply
    </button>
  </div>
);

export default AiSeoAuditButton;
