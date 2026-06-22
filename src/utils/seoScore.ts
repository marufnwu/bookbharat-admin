export interface SeoScoreInput {
  name?: string;
  slug?: string;
  description?: string;
  short_description?: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  focus_keyword?: string;
  images?: any[];
  existingImages?: any[];
  imageAltTexts?: string[];
}

export interface SeoCheckItem {
  id: string;
  label: string;
  passed: boolean;
  points: number;
  hint: string;
  why: string;
  fieldId?: string;
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function wordCount(text: string): number {
  return text
    .replace(/<[^>]*>/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
}

function containsCaseInsensitive(haystack: string, needle: string): boolean {
  if (!haystack || !needle) return false;
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

export function computeSeoScore(input: SeoScoreInput): { score: number; checks: SeoCheckItem[] } {
  const checks: SeoCheckItem[] = [];
  const fk = input.focus_keyword?.trim() || '';
  const name = input.name?.trim() || '';
  const slug = input.slug?.trim() || '';
  const metaTitle = input.meta_title?.trim() || '';
  const metaDesc = input.meta_description?.trim() || '';
  const metaKeywords = input.meta_keywords?.trim() || '';
  const desc = input.description || '';
  const shortDesc = input.short_description?.trim() || '';
  const totalImages = (input.images?.length || 0) + (input.existingImages?.length || 0);
  const altTexts = input.imageAltTexts || [];

  // Focus keyword provided
  checks.push({
    id: 'focus_keyword',
    label: 'Focus keyword provided',
    passed: fk.length > 0,
    points: 8,
    hint: fk ? '' : 'Enter a focus keyword — the #1 search term for this book',
    why: 'A focus keyword anchors your SEO strategy. It tells Google what this page should rank for.',
    fieldId: 'focus_keyword',
  });

  // Meta title exists
  checks.push({
    id: 'meta_title_exists',
    label: 'Meta title exists',
    passed: metaTitle.length > 0,
    points: 6,
    hint: metaTitle ? '' : 'Add a meta title to control what Google shows in search results',
    why: 'Google shows your meta title as the blue clickable link in search results.',
    fieldId: 'meta_title',
  });

  // Meta title length 50-60
  const titleLen = metaTitle.length;
  const titleOptimal = titleLen >= 50 && titleLen <= 60;
  const titleAcceptable = titleLen >= 30 && titleLen <= 65;
  checks.push({
    id: 'meta_title_length',
    label: 'Meta title length (50-60 chars)',
    passed: titleOptimal,
    points: titleOptimal ? 6 : titleAcceptable ? 2 : 0,
    hint: titleOptimal
      ? ''
      : titleLen === 0
      ? ''
      : titleLen < 50
      ? `Add ${50 - titleLen} more characters to reach the optimal range`
      : `Remove ${titleLen - 60} characters — Google will truncate your title`,
    why: 'Google displays ~60 characters. Titles in the 50-60 range get the most clicks.',
    fieldId: 'meta_title',
  });

  // Focus keyword in title
  checks.push({
    id: 'fk_in_title',
    label: 'Focus keyword in meta title',
    passed: fk.length > 0 && containsCaseInsensitive(metaTitle, fk),
    points: 10,
    hint: fk && metaTitle ? `Add "${fk}" to your meta title for better ranking` : '',
    why: 'When your keyword appears in the title, Google sees it as highly relevant to that search.',
    fieldId: 'meta_title',
  });

  // Meta description exists
  checks.push({
    id: 'meta_desc_exists',
    label: 'Meta description exists',
    passed: metaDesc.length > 0,
    points: 6,
    hint: metaDesc ? '' : 'Add a meta description to control your search result snippet',
    why: 'Google shows your meta description below the title in search results. A good one increases clicks.',
    fieldId: 'meta_description',
  });

  // Meta description length 150-160
  const descLen = metaDesc.length;
  const descOptimal = descLen >= 150 && descLen <= 160;
  const descAcceptable = descLen >= 120 && descLen <= 165;
  checks.push({
    id: 'meta_desc_length',
    label: 'Meta description length (150-160 chars)',
    passed: descOptimal,
    points: descOptimal ? 6 : descAcceptable ? 2 : 0,
    hint: descOptimal
      ? ''
      : descLen === 0
      ? ''
      : descLen < 150
      ? `Add ${150 - descLen} more characters to reach the optimal range`
      : `Remove ${descLen - 160} characters — Google will truncate your description`,
    why: 'Google displays ~150-160 characters. This is your chance to convince searchers to click.',
    fieldId: 'meta_description',
  });

  // Focus keyword in description
  checks.push({
    id: 'fk_in_desc',
    label: 'Focus keyword in meta description',
    passed: fk.length > 0 && containsCaseInsensitive(metaDesc, fk),
    points: 8,
    hint: fk && metaDesc ? `Include "${fk}" naturally in your meta description` : '',
    why: 'Google bolds matching keywords in descriptions, making your result stand out.',
    fieldId: 'meta_description',
  });

  // Focus keyword in slug
  checks.push({
    id: 'fk_in_slug',
    label: 'Focus keyword in URL slug',
    passed: fk.length > 0 && slug.includes(slugify(fk)),
    points: 8,
    hint: fk && slug ? `Include "${slugify(fk)}" in your URL slug` : '',
    why: 'Google uses the URL slug to understand page content. Keywords in URLs boost rankings.',
    fieldId: 'slug',
  });

  // Focus keyword in product name
  checks.push({
    id: 'fk_in_name',
    label: 'Focus keyword in product name',
    passed: fk.length > 0 && containsCaseInsensitive(name, fk),
    points: 5,
    hint: fk && name ? `Consider including "${fk}" in your product name` : '',
    why: 'Google considers the product name as a strong relevance signal.',
    fieldId: 'name',
  });

  // Description word count
  const words = wordCount(desc);
  const idealWords = 300;
  const minWords = 150;
  checks.push({
    id: 'desc_words',
    label: words >= idealWords ? `Description length (${idealWords}+ words)` : 'Description length',
    passed: words >= idealWords,
    points: words >= idealWords ? 8 : words >= minWords ? 4 : words >= 50 ? 2 : 0,
    hint:
      words >= idealWords
        ? ''
        : words >= minWords
        ? `Add ${idealWords - words} more words for maximum SEO impact — aim for ${idealWords}+`
        : words >= 50
        ? `Only ${words} words — aim for ${idealWords}+ words for better Google ranking`
        : `Only ${words} words — Google favors comprehensive content. Write ${idealWords}+ words.`,
    why: `Google favors comprehensive content. ${idealWords}+ word descriptions rank significantly better and get more featured snippets.`,
    fieldId: 'description',
  });

  // Short description exists
  checks.push({
    id: 'short_desc',
    label: 'Short description provided',
    passed: shortDesc.length > 0,
    points: 4,
    hint: shortDesc ? '' : 'Add a short description for product previews and search snippets',
    why: 'Short descriptions appear in product listings and help with internal search.',
    fieldId: 'short_description',
  });

  // Slug is SEO-friendly
  const slugPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  checks.push({
    id: 'slug_friendly',
    label: 'URL slug is SEO-friendly',
    passed: slug.length > 0 && slugPattern.test(slug),
    points: 3,
    hint:
      slug.length === 0
        ? ''
        : slugPattern.test(slug)
        ? ''
        : 'Use lowercase letters, numbers, and hyphens only (e.g., "the-alchemist-novel")',
    why: 'Clean URLs are easier for Google to crawl and for users to share.',
    fieldId: 'slug',
  });

  // Product has images
  checks.push({
    id: 'has_images',
    label: 'Product has images',
    passed: totalImages > 0,
    points: 4,
    hint: totalImages > 0 ? '' : 'Upload at least one product image',
    why: 'Images help Google understand your product and appear in Google Image search.',
    fieldId: 'images',
  });

  // All images have alt text
  const allHaveAlt = totalImages > 0 && altTexts.length === totalImages && altTexts.every((t) => t?.trim().length > 0);
  checks.push({
    id: 'alt_text',
    label: 'All images have alt text',
    passed: allHaveAlt,
    points: totalImages === 0 ? 0 : 5,
    hint:
      totalImages === 0
        ? ''
        : allHaveAlt
        ? ''
        : `Add alt text to all ${totalImages} images for Google Image search`,
    why: 'Alt text helps Google understand images and improves accessibility.',
    fieldId: 'images',
  });

  // Meta keywords provided
  checks.push({
    id: 'meta_keywords',
    label: 'Meta keywords provided',
    passed: metaKeywords.length > 0,
    points: 3,
    hint: metaKeywords ? '' : 'Add comma-separated keywords for internal search',
    why: 'Meta keywords help with on-site search and provide context to search engines.',
    fieldId: 'meta_keywords',
  });

  const totalPossible = checks.reduce((sum, c) => sum + c.points, 0);
  const totalEarned = checks.reduce((sum, c) => sum + (c.passed ? c.points : 0), 0);
  const score = totalPossible > 0 ? Math.round((totalEarned / totalPossible) * 100) : 0;

  return { score, checks };
}

export function getSeoScoreColor(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#eab308';
  if (score >= 40) return '#f97316';
  return '#ef4444';
}

export function getSeoScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Needs Work';
  return 'Poor';
}

export function getSeoScoreBg(score: number): string {
  if (score >= 80) return 'bg-green-50 border-green-200';
  if (score >= 60) return 'bg-yellow-50 border-yellow-200';
  if (score >= 40) return 'bg-orange-50 border-orange-200';
  return 'bg-red-50 border-red-200';
}
