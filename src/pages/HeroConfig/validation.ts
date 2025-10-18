/**
 * Hero Configuration Validation Functions
 */

export const validateField = (name: string, value: any): string | null => {
  switch (name) {
    case 'variant':
      if (!value || value.trim() === '') return 'Variant is required';
      if (value.length > 100) return 'Variant must be 100 characters or less';
      if (!/^[a-z0-9-]+$/.test(value)) {
        return 'Variant must contain only lowercase letters, numbers, and hyphens';
      }
      return null;

    case 'title':
      if (!value || value.trim() === '') return 'Title is required';
      if (value.length > 255) return 'Title must be 255 characters or less';
      return null;

    case 'subtitle':
      if (value && value.length > 500) return 'Subtitle must be 500 characters or less';
      return null;

    case 'primaryCta_text':
    case 'secondaryCta_text':
      if (value && value.length > 100) return 'Button text must be 100 characters or less';
      return null;

    case 'primaryCta_href':
    case 'secondaryCta_href':
      if (value && !value.startsWith('/') && !value.startsWith('http')) {
        return 'URL must start with / or http';
      }
      if (value && value.length > 255) return 'URL must be 255 characters or less';
      return null;

    case 'backgroundImage':
    case 'videoUrl':
      if (value && !value.startsWith('/') && !value.startsWith('http')) {
        return 'URL must start with / or http';
      }
      if (value && value.length > 500) return 'URL must be 500 characters or less';
      return null;

    default:
      return null;
  }
};

export const validateForm = (formData: any): Record<string, string> => {
  const errors: Record<string, string> = {};

  const variantError = validateField('variant', formData.variant);
  const titleError = validateField('title', formData.title);

  if (variantError) errors.variant = variantError;
  if (titleError) errors.title = titleError;

  return errors;
};

