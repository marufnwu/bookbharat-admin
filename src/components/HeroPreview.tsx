import React from 'react';
import { ArrowRight, BookOpen, Star, Users, TrendingUp, Award, Truck, Shield, CheckCircle, Gift } from 'lucide-react';
import { getFullImageUrl } from '../utils/imageUrl';

// Icon mapping (subset of frontend icons)
const iconMap: Record<string, React.ComponentType<any>> = {
  'book': BookOpen,
  'star': Star,
  'users': Users,
  'trending': TrendingUp,
  'award': Award,
  'truck': Truck,
  'shield': Shield,
};

interface HeroPreviewProps {
  config: {
    variant: string;
    title: string;
    subtitle: string | null;
    primaryCta: { text: string; href: string } | null;
    secondaryCta: { text: string; href: string } | null;
    backgroundImage: string | null;
    stats?: Array<{ label: string; value: string; icon: string }> | null;
    features?: Array<{ title: string; description: string; icon: string }> | null;
    discountBadge?: { text: string; color: string } | null;
    trustBadges?: string[] | null;
  };
  viewMode?: 'desktop' | 'mobile';
}

const HeroPreview: React.FC<HeroPreviewProps> = ({ config, viewMode = 'desktop' }) => {
  const getIconComponent = (iconName?: string) => {
    if (!iconName) return BookOpen;
    return iconMap[iconName] || BookOpen;
  };

  const containerWidth = viewMode === 'mobile' ? 'max-w-[375px]' : 'max-w-full';

  // Minimal Product Variant
  if (config.variant === 'minimal-product') {
    return (
      <div className={`${containerWidth} mx-auto`}>
        <section className="relative overflow-hidden bg-white py-8">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-white"></div>
          <div className="relative max-w-7xl mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-6 items-center">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 bg-blue-50 rounded-full px-3 py-1 text-xs font-medium text-blue-700">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  <span>Premium Books</span>
                </div>
                <h1 className="text-3xl font-bold text-gray-900">{config.title}</h1>
                <p className="text-base text-gray-600">{config.subtitle}</p>
                <div className="flex gap-2">
                  {config.primaryCta && (
                    <button className="bg-gray-900 hover:bg-gray-800 text-white px-5 py-2 text-sm rounded-lg flex items-center gap-2">
                      {config.primaryCta.text}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                  {config.secondaryCta && (
                    <button className="border border-gray-300 px-5 py-2 text-sm rounded-lg">
                      {config.secondaryCta.text}
                    </button>
                  )}
                </div>
                {config.trustBadges && config.trustBadges.length > 0 && (
                  <div className="flex flex-wrap gap-3 pt-3 border-t">
                    {config.trustBadges.slice(0, 3).map((badge, index) => (
                      <div key={index} className="flex items-center gap-1.5 text-xs text-gray-600">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>{badge}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="aspect-square bg-gray-100 rounded-xl flex items-center justify-center">
                <BookOpen className="h-24 w-24 text-gray-300" />
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // Interactive Promotional Variant
  if (config.variant === 'interactive-promotional') {
    return (
      <div className={`${containerWidth} mx-auto`}>
        <section className="relative overflow-hidden bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-12 min-h-[400px] flex items-center">
          <div className="absolute top-8 left-8 w-32 h-32 bg-blue-400/10 rounded-full blur-xl"></div>
          <div className="absolute bottom-8 right-8 w-40 h-40 bg-purple-400/10 rounded-full blur-xl"></div>
          
          <div className="relative max-w-7xl mx-auto px-4 text-center">
            <h1 className="text-4xl font-bold mb-4 text-white">{config.title}</h1>
            <p className="text-lg text-white/90 mb-6 max-w-2xl mx-auto">{config.subtitle}</p>
            
            <div className="flex gap-2 justify-center">
              {config.primaryCta && (
                <button className="bg-yellow-400 text-gray-900 hover:bg-yellow-300 px-5 py-2 text-sm font-semibold rounded-lg flex items-center gap-2">
                  {config.primaryCta.text}
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
              {config.secondaryCta && (
                <button className="border border-white text-white hover:bg-white/10 px-5 py-2 text-sm rounded-lg">
                  {config.secondaryCta.text}
                </button>
              )}
            </div>
          </div>
        </section>
      </div>
    );
  }

  // Modern Variant
  if (config.variant === 'modern') {
    return (
      <div className={`${containerWidth} mx-auto`}>
        <section className="relative overflow-hidden py-12">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"></div>
          {config.backgroundImage && (
            <div className="absolute inset-0">
              <img src={getFullImageUrl(config.backgroundImage) || ''} alt="Background" className="w-full h-full object-cover opacity-30" />
            </div>
          )}
          
          <div className="relative max-w-7xl mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-white/20 rounded-full px-6 py-3 mb-8">
              <span className="text-white/90 text-sm font-medium">Featured Collection 2024</span>
            </div>

            <h1 className="text-5xl font-bold text-white mb-6">{config.title}</h1>
            <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">{config.subtitle}</p>
            
            <div className="flex gap-4 justify-center">
              {config.primaryCta && (
                <button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 text-lg rounded-lg flex items-center gap-2">
                  {config.primaryCta.text}
                  <ArrowRight className="h-5 w-5" />
                </button>
              )}
            </div>

            {config.stats && config.stats.length > 0 && (
              <div className="grid grid-cols-3 gap-8 mt-16 pt-12 border-t border-white/10">
                {config.stats.slice(0, 3).map((stat, index) => {
                  const Icon = getIconComponent(stat.icon);
                  return (
                    <div key={index} className="text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-full mb-4">
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="text-4xl font-bold text-white mb-2">{stat.value}</div>
                      <div className="text-white/60 text-sm uppercase tracking-wider">{stat.label}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    );
  }

  // Default/Fallback Preview
  return (
    <div className={`${containerWidth} mx-auto`}>
      <section className="relative bg-gradient-to-br from-blue-50 to-purple-50 py-12">
        {config.backgroundImage && (
          <div className="absolute inset-0">
            <img src={getFullImageUrl(config.backgroundImage) || ''} alt="Background" className="w-full h-full object-cover opacity-50" />
            <div className="absolute inset-0 bg-black/40"></div>
          </div>
        )}
        
        <div className="relative max-w-7xl mx-auto px-4 text-center">
          {config.discountBadge && (
            <div className={`inline-block px-4 py-2 rounded-lg font-bold text-sm mb-4 bg-${config.discountBadge.color}-500 text-white`}>
              {config.discountBadge.text}
            </div>
          )}
          
          <h1 className={`text-4xl font-bold mb-4 ${config.backgroundImage ? 'text-white' : 'text-gray-900'}`}>
            {config.title}
          </h1>
          
          <p className={`text-lg mb-6 max-w-2xl mx-auto ${config.backgroundImage ? 'text-white/90' : 'text-gray-600'}`}>
            {config.subtitle}
          </p>
          
          <div className="flex gap-2 justify-center">
            {config.primaryCta && (
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2">
                {config.primaryCta.text}
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
            {config.secondaryCta && (
              <button className="border border-gray-300 hover:bg-gray-50 px-6 py-3 rounded-lg">
                {config.secondaryCta.text}
              </button>
            )}
          </div>

          {config.features && config.features.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mt-12">
              {config.features.slice(0, 3).map((feature, index) => {
                const Icon = getIconComponent(feature.icon);
                return (
                  <div key={index} className="bg-white/90 backdrop-blur-sm rounded-lg p-4">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-sm mb-1">{feature.title}</h3>
                    <p className="text-xs text-gray-600">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          )}

          {config.stats && config.stats.length > 0 && (
            <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-gray-300">
              {config.stats.slice(0, 3).map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                  <div className="text-sm text-gray-500 uppercase">{stat.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default HeroPreview;

