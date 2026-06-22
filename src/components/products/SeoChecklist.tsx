import React from 'react';
import { Check, X, AlertTriangle } from 'lucide-react';
import { computeSeoScore } from '../../utils/seoScore';

interface SeoChecklistProps {
  formData: any;
  images?: any[];
  existingImages?: any[];
  imageAltTexts?: string[];
  format?: string;
}

const FORMAT_TIPS: Record<string, string> = {
  Paperback: 'For Paperback books, mention page count and binding type in your description. Include "paperback edition" naturally.',
  Hardcover: 'Emphasize "hardcover edition" and premium quality in your description for better SEO.',
  Ebook: 'Mention "digital edition", "PDF", "Kindle" in your description. Include file format details.',
  Audiobook: 'Mention "audiobook", "narrated by", and duration in your description for audio search.',
};

const SeoChecklist: React.FC<SeoChecklistProps> = ({
  formData,
  images = [],
  existingImages = [],
  imageAltTexts = [],
  format,
}) => {
  const { score, checks } = computeSeoScore({
    ...formData,
    images,
    existingImages,
    imageAltTexts,
  });

  const passedCount = checks.filter((c) => c.passed).length;
  const totalCount = checks.length;
  const formatTip = format ? FORMAT_TIPS[format] : null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-900">
          SEO Checklist ({passedCount}/{totalCount} passed)
        </h4>
      </div>

      <div className="space-y-1">
        {checks.map((check) => (
          <div
            key={check.id}
            className={`flex items-start gap-2 px-3 py-2 rounded-lg text-sm ${
              check.passed ? 'bg-green-50' : 'bg-red-50'
            }`}
          >
            {check.passed ? (
              <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            ) : (
              <X className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className={`font-medium ${check.passed ? 'text-green-800' : 'text-red-800'}`}>
                {check.label}
              </p>
              {!check.passed && check.hint && (
                <p className="text-xs text-red-600 mt-0.5">{check.hint}</p>
              )}
              {!check.passed && check.why && (
                <p className="text-xs text-gray-500 mt-0.5 italic">{check.why}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {formatTip && (
        <div className="flex items-start gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm">
          <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <p className="text-blue-800">
            <span className="font-medium">Format tip:</span> {formatTip}
          </p>
        </div>
      )}
    </div>
  );
};

export default SeoChecklist;
