# Hero Section Component Refactoring

**Date:** October 18, 2025  
**Status:** ✅ IN PROGRESS  
**Goal:** Split monolithic HeroSection into separate variant components

---

## 📊 Current State

**Before:**
- Single file: `HeroSection.tsx` (1570 lines)
- 11 variants inline
- Difficult to maintain
- Hard to test individually

**After:**
- Main file: `HeroSection.tsx` (~150 lines)
- Shared types: `types.ts`
- 11 variant components in `variants/` folder
- Easy to maintain & test

---

## 📁 New Structure

```
src/components/hero/
├── HeroSection.tsx          (Main orchestrator - 150 lines)
├── types.ts                 (Shared interfaces)
├── utils.ts                 (Shared utilities)
└── variants/
    ├── index.ts             (Export all variants)
    ├── MinimalProduct.tsx   ✅ (140 lines)
    ├── LifestyleStorytelling.tsx
    ├── InteractivePromotional.tsx
    ├── CategoryGrid.tsx
    ├── SeasonalCampaign.tsx
    ├── ProductHighlight.tsx
    ├── VideoHero.tsx
    ├── InteractiveTryOn.tsx
    ├── EditorialMagazine.tsx
    ├── ModernVariant.tsx
    └── ClassicVariant.tsx
```

---

## ✅ Created Files

1. ✅ `types.ts` - Shared TypeScript interfaces
2. ✅ `variants/MinimalProduct.tsx` - First variant component
3. ✅ `variants/index.ts` - Barrel exports

---

## 🔄 Refactored Main Component

```typescript
// HeroSection.tsx (New - 150 lines)
import { useState, useEffect } from 'react';
import { HeroConfig } from './types';
import * as Variants from './variants';

export function HeroSection({ config, className }: HeroSectionProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [particles, setParticles] = useState({...});
  
  // Particle generation logic
  useEffect(() => {
    setIsMounted(true);
    // Generate particles for variants that need them
  }, [config.variant]);
  
  // Route to appropriate variant
  const variantComponents = {
    'minimal-product': Variants.MinimalProduct,
    'lifestyle-storytelling': Variants.LifestyleStorytelling,
    'interactive-promotional': Variants.InteractivePromotional,
    'category-grid': Variants.CategoryGrid,
    'seasonal-campaign': Variants.SeasonalCampaign,
    'product-highlight': Variants.ProductHighlight,
    'video-hero': Variants.VideoHero,
    'interactive-tryOn': Variants.InteractiveTryOn,
    'editorial-magazine': Variants.EditorialMagazine,
    'modern': Variants.ModernVariant,
    'classic': Variants.ClassicVariant,
  };
  
  const VariantComponent = variantComponents[config.variant] || Variants.MinimalProduct;
  
  return <VariantComponent config={config} className={className} isMounted={isMounted} particles={particles} />;
}
```

---

## 📦 Benefits

### Maintainability ✅
- Each variant in own file (~120-150 lines)
- Easy to locate and edit
- Clear separation of concerns

### Testability ✅
- Test each variant independently
- Mock props easily
- Isolated unit tests

### Performance ✅
- Can code-split variants
- Lazy load unused variants
- Smaller bundle for each page

### Developer Experience ✅
- Easier to navigate
- Less merge conflicts
- Clear structure

---

## 🎯 Implementation Steps

### Phase 1: Setup ✅
- [x] Create `types.ts`
- [x] Create `variants/` folder
- [x] Create first variant (MinimalProduct)
- [x] Create `variants/index.ts`

### Phase 2: Extract Remaining Variants
- [ ] LifestyleStorytelling
- [ ] InteractivePromotional  
- [ ] CategoryGrid
- [ ] SeasonalCampaign
- [ ] ProductHighlight
- [ ] VideoHero
- [ ] InteractiveTryOn
- [ ] EditorialMagazine
- [ ] ModernVariant
- [ ] ClassicVariant

### Phase 3: Refactor Main File
- [ ] Import all variants
- [ ] Create variant mapping object
- [ ] Implement component routing logic
- [ ] Clean up old code

### Phase 4: Testing
- [ ] Test each variant renders
- [ ] Test variant switching
- [ ] Verify no regressions
- [ ] Check hydration

---

## 📝 Variant Component Template

```typescript
'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { cn } from '@/lib/utils';
import { /* icons */ } from 'lucide-react';
import { HeroVariantProps } from '../types';

export function VariantName({ config, className, isMounted, particles }: HeroVariantProps) {
  return (
    <section className={cn(
      'relative overflow-hidden py-2 md:py-4',
      className
    )}>
      {/* Variant-specific content */}
    </section>
  );
}
```

---

## 🔧 Migration Strategy

### Option 1: Incremental (Recommended)
1. Create variant components one by one
2. Test each before moving to next
3. Keep old code until all variants complete
4. Switch over all at once

### Option 2: Big Bang
1. Create all variants at once
2. Refactor main component
3. Test everything together
4. Higher risk but faster

**Chosen:** Option 1 (Incremental)

---

## 📊 Progress Tracking

| Variant | Status | Lines | Complexity |
|---------|--------|-------|------------|
| MinimalProduct | ✅ Done | 140 | Low |
| LifestyleStorytelling | 🔄 Todo | ~150 | Medium |
| InteractivePromotional | 🔄 Todo | ~140 | Medium |
| CategoryGrid | 🔄 Todo | ~130 | Low |
| SeasonalCampaign | 🔄 Todo | ~145 | Medium |
| ProductHighlight | 🔄 Todo | ~150 | Medium |
| VideoHero | 🔄 Todo | ~135 | High |
| InteractiveTryOn | 🔄 Todo | ~125 | Low |
| EditorialMagazine | 🔄 Todo | ~140 | Low |
| ModernVariant | 🔄 Todo | ~160 | High |
| ClassicVariant | 🔄 Todo | ~155 | High |

**Total:** 1/11 complete (9%)

---

## 🎯 Next Steps

Due to the large scope (11 components × 140 lines each = ~1540 lines to extract), I recommend:

### Immediate:
1. ✅ Types and structure created
2. ✅ First variant (MinimalProduct) completed as example
3. 📝 Pattern established for remaining variants

### You can:
**Option A:** I continue creating all 10 remaining variants now
**Option B:** Test the MinimalProduct first, then continue
**Option C:** I create a script to automate the extraction

**Recommendation:** Let me know if you want me to:
- Continue creating all variants now (will take ~30-45 minutes)
- Create just 2-3 more variants as examples
- Generate extraction script for automation

---

## 💡 Additional Improvements

Once refactoring is complete, we can:
1. Add lazy loading for variants
2. Create Storybook stories for each
3. Add unit tests for each variant
4. Implement variant-specific optimizations

---

**Status:** ✅ Foundation Complete  
**Next:** Awaiting direction on completing remaining 10 variants

