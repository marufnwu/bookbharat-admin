import React from 'react';
import { HelpCircle } from 'lucide-react';

interface SeoFieldHelpProps {
  field: 'focus_keyword' | 'meta_title' | 'meta_description' | 'meta_keywords' | 'canonical_url' | 'slug';
}

const HELP_CONTENT: Record<string, { what: string; why: string; best: string }> = {
  focus_keyword: {
    what: 'The single most important search term this book should rank for on Google.',
    why: 'Everything in your SEO — title, description, slug, content — should revolve around this one keyword.',
    best: 'Think like a customer: what would they type into Google to find this book? Use "bangla novel" not "novel bangla book buy online cheap".',
  },
  meta_title: {
    what: 'The title Google shows in search results (the blue clickable link).',
    why: 'Google shows ~60 characters. A good title with your keyword can increase click-through by 30%.',
    best: 'Keep under 60 characters. Put your main keyword first. Format: "Book Name by Author | BookBharat"',
  },
  meta_description: {
    what: 'The snippet Google shows below your title in search results.',
    why: 'Google shows ~150-160 characters. This is your elevator pitch to convince searchers to click.',
    best: '150-160 characters. Include your keyword naturally. Write in active voice. End with a call to action.',
  },
  meta_keywords: {
    what: 'Comma-separated keywords that help with on-site search and provide context.',
    why: 'While Google largely ignores meta keywords, they help with your site\'s internal search and other search engines.',
    best: 'Include: book name, author, category, language, format. Example: "the alchemist, paulo coelho, novel, english book, paperback"',
  },
  canonical_url: {
    what: 'A URL override that tells Google this page is a copy of another page.',
    why: 'Prevents duplicate content penalties when the same product appears at multiple URLs.',
    best: 'Leave blank for most products. Only use if you have duplicate pages pointing to the same content.',
  },
  slug: {
    what: 'The URL path for this product page (e.g., bookbharat.com/products/the-alchemist).',
    why: 'Google uses the URL slug to understand page content. Keywords in URLs boost rankings.',
    best: 'Keep it short, lowercase, and hyphenated. Include your focus keyword. Example: "pather-panchali-bengali-novel"',
  },
};

const SeoFieldHelp: React.FC<SeoFieldHelpProps> = ({ field }) => {
  const content = HELP_CONTENT[field];
  if (!content) return null;

  return (
    <div className="relative inline-flex items-center group ml-1">
      <HelpCircle className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help" />
      <div className="absolute z-50 w-72 p-3 text-xs text-white bg-gray-800 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none bottom-full left-1/2 -translate-x-1/2 mb-2">
        <div className="space-y-2">
          <p><span className="font-semibold text-gray-300">What:</span> {content.what}</p>
          <p><span className="font-semibold text-gray-300">Why:</span> {content.why}</p>
          <p><span className="font-semibold text-gray-300">Best practice:</span> {content.best}</p>
        </div>
        <div className="absolute w-2 h-2 bg-gray-800 transform rotate-45 bottom-[-4px] left-1/2 -translate-x-1/2" />
      </div>
    </div>
  );
};

export default SeoFieldHelp;
