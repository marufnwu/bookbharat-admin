import React from 'react';
import { ArrowRight, TrendingUp } from 'lucide-react';
import { computeSeoScore, getSeoScoreColor, getSeoScoreLabel } from '../../utils/seoScore';

interface SeoScoreBarProps {
  formData: any;
  images?: any[];
  existingImages?: any[];
  imageAltTexts?: string[];
  onViewSeo?: () => void;
}

function wordCount(text: string): number {
  return text
    .replace(/<[^>]*>/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
}

const SeoScoreBar: React.FC<SeoScoreBarProps> = ({
  formData,
  images = [],
  existingImages = [],
  imageAltTexts = [],
  onViewSeo,
}) => {
  const { score, checks } = computeSeoScore({
    ...formData,
    images,
    existingImages,
    imageAltTexts,
  });

  const failedCount = checks.filter((c) => !c.passed && c.points > 0).length;
  const color = getSeoScoreColor(score);
  const label = getSeoScoreLabel(score);
  const descWords = wordCount(formData.description || '');

  return (
    <div className="px-4 py-3 bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="flex items-center gap-4">
        {/* Score circle */}
        <div className="relative w-14 h-14 flex-shrink-0">
          <svg className="w-14 h-14 -rotate-90" viewBox="0 0 60 60">
            <circle cx="30" cy="30" r="25" fill="none" stroke="#e5e7eb" strokeWidth="5" />
            <circle
              cx="30" cy="30" r="25" fill="none" stroke={color} strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 25}
              strokeDashoffset={2 * Math.PI * 25 * (1 - score / 100)}
              className="transition-all duration-300"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold leading-none" style={{ color }}>{score}</span>
          </div>
        </div>

        {/* Score info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900">SEO Score</span>
            <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ color, backgroundColor: `${color}15` }}>
              {label}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
            <span>{checks.filter((c) => c.passed).length}/{checks.length} checks passed</span>
            <span>|</span>
            <span>{descWords} desc words</span>
            {failedCount > 0 && (
              <>
                <span>|</span>
                <span className="text-amber-600 font-medium">{failedCount} {failedCount === 1 ? 'issue' : 'issues'}</span>
              </>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="hidden sm:block w-32">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${score}%`, backgroundColor: color }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {failedCount > 0 && (
            <button
              type="button"
              onClick={onViewSeo}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
            >
              <TrendingUp className="h-3.5 w-3.5" />
              Fix {failedCount}
            </button>
          )}
          <button
            type="button"
            onClick={onViewSeo}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
          >
            SEO Tab <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SeoScoreBar;
