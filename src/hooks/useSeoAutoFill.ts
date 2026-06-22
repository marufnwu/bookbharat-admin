import { useMemo } from 'react';

interface SeoAutoFillResult {
  autoFillSeo: (data: {
    name?: string;
    author?: string;
    category?: string;
    language?: string;
    format?: string;
    short_description?: string;
  }) => {
    focus_keyword: string;
    meta_title: string;
    meta_description: string;
    meta_keywords: string;
  };
}

export function useSeoAutoFill(): SeoAutoFillResult {
  const autoFillSeo = useMemo(() => {
    return (data: {
      name?: string;
      author?: string;
      category?: string;
      language?: string;
      format?: string;
      short_description?: string;
    }) => {
      const name = data.name?.trim() || '';
      const author = data.author?.trim() || '';
      const category = data.category?.trim() || '';
      const language = data.language?.trim() || 'English';
      const format = data.format?.trim() || '';
      const shortDesc = data.short_description?.trim() || '';

      // Focus keyword: extract core title + category
      let focusKeyword = name;
      if (category && !name.toLowerCase().includes(category.toLowerCase())) {
        focusKeyword = `${name} ${category}`;
      }

      // Meta title: "Name by Author | Category | BookBharat" (max 60)
      let metaTitle = '';
      if (name && author && category) {
        metaTitle = `${name} by ${author} | ${category} | BookBharat`;
      } else if (name && author) {
        metaTitle = `${name} by ${author} | BookBharat`;
      } else if (name) {
        metaTitle = `${name} | BookBharat`;
      }
      if (metaTitle.length > 60) {
        metaTitle = metaTitle.substring(0, 57) + '...';
      }

      // Meta description: "Buy Name by Author. First sentence. Available in Format at BookBharat." (max 160)
      let metaDescription = '';
      const firstSentence = shortDesc.split('.')[0]?.trim() || '';
      if (name && author) {
        metaDescription = `Buy ${name} by ${author}.`;
        if (firstSentence) {
          metaDescription += ` ${firstSentence}.`;
        }
        metaDescription += ` Available${format ? ` in ${format}` : ''} at BookBharat.`;
      } else if (name) {
        metaDescription = `Buy ${name}.`;
        if (firstSentence) {
          metaDescription += ` ${firstSentence}.`;
        }
        metaDescription += ` Available${format ? ` in ${format}` : ''} at BookBharat.`;
      }
      if (metaDescription.length > 160) {
        metaDescription = metaDescription.substring(0, 157) + '...';
      }

      // Meta keywords
      const keywords: string[] = [];
      if (name) keywords.push(name);
      if (author) keywords.push(author);
      if (category) keywords.push(category);
      keywords.push(`${language} book`);
      if (format) keywords.push(format);
      keywords.push('BookBharat');
      const metaKeywords = keywords.join(', ');

      return {
        focus_keyword: focusKeyword,
        meta_title: metaTitle,
        meta_description: metaDescription,
        meta_keywords: metaKeywords,
      };
    };
  }, []);

  return { autoFillSeo };
}
