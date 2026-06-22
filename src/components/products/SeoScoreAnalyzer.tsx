import React from 'react';
import { computeSeoScore, getSeoScoreColor, getSeoScoreLabel } from '../../utils/seoScore';

interface SeoScoreAnalyzerProps {
  formData: any;
  images?: any[];
  existingImages?: any[];
  imageAltTexts?: string[];
}

const SeoScoreAnalyzer: React.FC<SeoScoreAnalyzerProps> = ({
  formData,
  images = [],
  existingImages = [],
  imageAltTexts = [],
}) => {
  const { score } = computeSeoScore({
    ...formData,
    images,
    existingImages,
    imageAltTexts,
  });

  const color = getSeoScoreColor(score);
  const label = getSeoScoreLabel(score);

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex items-center gap-6 p-4 bg-white border border-gray-200 rounded-xl">
      <div className="relative w-32 h-32 flex-shrink-0">
        <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="10"
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold" style={{ color }}>
            {score}
          </span>
          <span className="text-xs text-gray-500">/100</span>
        </div>
      </div>

      <div className="flex-1">
        <h3 className="text-lg font-semibold text-gray-900">
          SEO Score: <span style={{ color }}>{label}</span>
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          {score >= 80
            ? 'Your product SEO is well optimized for search engines.'
            : score >= 60
            ? 'Good foundation. Fix the remaining issues below for maximum visibility.'
            : score >= 40
            ? 'Several SEO issues need attention. Follow the checklist to improve.'
            : 'Significant SEO improvements needed. Start with the high-priority items below.'}
        </p>
      </div>
    </div>
  );
};

export default SeoScoreAnalyzer;
