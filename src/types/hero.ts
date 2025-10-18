/**
 * Hero Configuration Types
 */

export interface HeroConfig {
  id: number;
  variant: string;
  title: string;
  subtitle: string | null;
  primaryCta: { text: string; href: string } | null;
  secondaryCta: { text: string; href: string } | null;
  discountBadge: { text: string; color: string } | null;
  trustBadges: string[] | null;
  backgroundImage: string | null;
  testimonials: Array<{ text: string; author: string; rating: number }> | null;
  campaignData: { title: string; offer: string; countdown: string } | null;
  categories: Array<{ id: string; name: string; image: string; href: string }> | null;
  features: Array<{ title: string; description: string; icon: string }> | null;
  stats: Array<{ label: string; value: string; icon: string }> | null;
  featuredProducts: any[] | null;
  videoUrl: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface HeroFormData {
  variant: string;
  title: string;
  subtitle: string;
  primaryCta_text: string;
  primaryCta_href: string;
  secondaryCta_text: string;
  secondaryCta_href: string;
  backgroundImage: string;
  videoUrl: string;
  is_active: boolean;
  stats: Array<{ label: string; value: string; icon: string }>;
  features: Array<{ title: string; description: string; icon: string }>;
  testimonials: Array<{ text: string; author: string; rating: number }>;
  featuredProducts: number[];
  categories: Array<{ id: string; name: string; image: string; href: string }>;
}

export type HeroFormTab = 'basic' | 'content' | 'advanced';

export interface ValidationErrors {
  [key: string]: string;
}

