// Resume Template System
// Defines resume templates with color schemes and font pairings

import type { ResumeTemplate, ColorScheme, FontPairing } from '../types/application-helper';

// ============================================================================
// Color Schemes
// ============================================================================

export const colorSchemes: ColorScheme[] = [
  {
    id: 'blue',
    name: 'Professional Blue',
    primary: '#0095FF',
    secondary: '#0077CC',
    text: '#1F2937',
    background: '#FFFFFF',
  },
  {
    id: 'orange',
    name: 'Energetic Orange',
    primary: '#FF8A00',
    secondary: '#E67700',
    text: '#1F2937',
    background: '#FFFFFF',
  },
  {
    id: 'neutral',
    name: 'Classic Neutral',
    primary: '#374151',
    secondary: '#6B7280',
    text: '#1F2937',
    background: '#FFFFFF',
  },
];

// ============================================================================
// Font Pairings
// ============================================================================

export const fontPairings: FontPairing[] = [
  {
    id: 'professional',
    name: 'Professional',
    heading: 'Arial',
    body: 'Arial',
  },
  {
    id: 'modern',
    name: 'Modern',
    heading: 'Calibri',
    body: 'Calibri',
  },
];

// ============================================================================
// Resume Templates
// ============================================================================

export const resumeTemplates: ResumeTemplate[] = [
  {
    id: 'modern',
    name: 'Modern',
    description: 'Clean and contemporary design perfect for tech and creative roles',
    preview: '/templates/modern-preview.png',
    colorSchemes,
    fontPairings,
  },
  {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional format ideal for corporate and professional positions',
    preview: '/templates/classic-preview.png',
    colorSchemes,
    fontPairings,
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Simple and elegant layout that highlights your content',
    preview: '/templates/minimal-preview.png',
    colorSchemes,
    fontPairings,
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get template by ID
 */
export function getTemplateById(id: string): ResumeTemplate | undefined {
  return resumeTemplates.find(template => template.id === id);
}

/**
 * Get color scheme by ID
 */
export function getColorSchemeById(id: string): ColorScheme | undefined {
  return colorSchemes.find(scheme => scheme.id === id);
}

/**
 * Get font pairing by ID
 */
export function getFontPairingById(id: string): FontPairing | undefined {
  return fontPairings.find(pairing => pairing.id === id);
}

/**
 * Get default template configuration
 */
export function getDefaultTemplateConfig() {
  return {
    template: 'modern',
    colorScheme: 'blue',
    fontPairing: 'professional',
  };
}

// ============================================================================
// Default Resume Sections
// ============================================================================

export const defaultResumeSections = [
  {
    id: 'personal',
    type: 'personal' as const,
    title: 'Personal Information',
    content: {},
    order: 0,
    visible: true,
  },
  {
    id: 'education',
    type: 'education' as const,
    title: 'Education',
    content: [],
    order: 1,
    visible: true,
  },
  {
    id: 'experience',
    type: 'experience' as const,
    title: 'Experience',
    content: [],
    order: 2,
    visible: true,
  },
  {
    id: 'skills',
    type: 'skills' as const,
    title: 'Skills',
    content: [],
    order: 3,
    visible: true,
  },
  {
    id: 'achievements',
    type: 'achievements' as const,
    title: 'Achievements',
    content: [],
    order: 4,
    visible: true,
  },
];

/**
 * Create initial resume state
 */
export function createInitialResumeState(profileData?: any) {
  const config = getDefaultTemplateConfig();
  
  return {
    template: config.template as 'modern' | 'classic' | 'minimal',
    colorScheme: config.colorScheme as 'blue' | 'orange' | 'neutral',
    fontPairing: config.fontPairing as 'professional' | 'modern',
    sections: defaultResumeSections.map(section => ({
      ...section,
      content: populateSectionFromProfile(section.type, profileData),
    })),
    metadata: {
      draftId: '',
      lastSaved: new Date(),
      name: 'Untitled Resume',
    },
  };
}

/**
 * Populate section content from profile data
 */
function populateSectionFromProfile(sectionType: string, profileData?: any) {
  if (!profileData) return {};

  switch (sectionType) {
    case 'personal':
      return profileData.personal || {};
    case 'education':
      return profileData.education || [];
    case 'experience':
      return profileData.experience || [];
    case 'skills':
      return profileData.skills || [];
    case 'achievements':
      return profileData.achievements || [];
    default:
      return {};
  }
}

// ============================================================================
// Export default
// ============================================================================

export default {
  templates: resumeTemplates,
  colorSchemes,
  fontPairings,
  getTemplateById,
  getColorSchemeById,
  getFontPairingById,
  getDefaultTemplateConfig,
  createInitialResumeState,
  defaultResumeSections,
};
