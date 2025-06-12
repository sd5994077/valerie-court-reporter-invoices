// Feature flags for safer production deployments
export const FEATURE_FLAGS = {
  // Validation message improvements
  ENHANCED_VALIDATION_DISPLAY: process.env.NEXT_PUBLIC_ENHANCED_VALIDATION === 'true',
  
  // PDF generation improvements
  IMPROVED_PDF_LAYOUT: process.env.NEXT_PUBLIC_IMPROVED_PDF === 'true',
  
  // Form enhancements
  ADVANCED_FORM_FEATURES: process.env.NEXT_PUBLIC_ADVANCED_FORM === 'true',
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS; 