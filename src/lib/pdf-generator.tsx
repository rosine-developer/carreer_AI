// PDF Generator Service
// Uses @react-pdf/renderer for client-side PDF generation with ATS compatibility

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  pdf,
} from '@react-pdf/renderer';
import type {
  ResumeState,
  CoverLetterState,
  ATSValidationResult,
  ColorScheme,
  FontPairing,
} from '../types/application-helper';
import { getColorSchemeById, getFontPairingById } from './resume-templates';

// ============================================================================
// Constants
// ============================================================================

const MAX_RESUME_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_COVER_LETTER_SIZE = 1 * 1024 * 1024; // 1MB
const MAX_COMBINED_SIZE = 5 * 1024 * 1024; // 5MB

// ============================================================================
// Styles
// ============================================================================

const createStyles = (colorScheme: ColorScheme, fontPairing: FontPairing) =>
  StyleSheet.create({
    page: {
      padding: 40,
      fontFamily: fontPairing.body,
      fontSize: 11,
      lineHeight: 1.5,
      color: colorScheme.text,
      backgroundColor: colorScheme.background,
    },
    header: {
      marginBottom: 20,
    },
    name: {
      fontSize: 24,
      fontFamily: fontPairing.heading,
      fontWeight: 'bold',
      color: colorScheme.primary,
      marginBottom: 8,
    },
    contactInfo: {
      fontSize: 10,
      color: colorScheme.text,
      marginBottom: 4,
    },
    section: {
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 14,
      fontFamily: fontPairing.heading,
      fontWeight: 'bold',
      color: colorScheme.primary,
      marginBottom: 8,
      paddingBottom: 4,
      borderBottomWidth: 2,
      borderBottomColor: colorScheme.primary,
    },
    text: {
      fontSize: 11,
      marginBottom: 4,
      color: colorScheme.text,
    },
    bulletPoint: {
      fontSize: 11,
      marginBottom: 4,
      marginLeft: 12,
      color: colorScheme.text,
    },
    skillsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    skillTag: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      backgroundColor: `${colorScheme.primary}15`,
      borderRadius: 4,
      fontSize: 10,
      color: colorScheme.primary,
    },
    entryHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    entryTitle: {
      fontSize: 12,
      fontWeight: 'bold',
      color: colorScheme.text,
    },
    entrySubtitle: {
      fontSize: 10,
      color: colorScheme.secondary,
      marginBottom: 4,
    },
    entryDate: {
      fontSize: 10,
      color: colorScheme.secondary,
    },
  });

// ============================================================================
// Resume PDF Generation
// ============================================================================

/**
 * Generate Resume PDF Document
 */
function createResumePDFDocument(resume: ResumeState) {
  const colorScheme = getColorSchemeById(resume.colorScheme) || {
    id: 'blue',
    name: 'Professional Blue',
    primary: '#0095FF',
    secondary: '#0077CC',
    text: '#1F2937',
    background: '#FFFFFF',
  };

  const fontPairing = getFontPairingById(resume.fontPairing) || {
    id: 'professional',
    name: 'Professional',
    heading: 'Helvetica-Bold',
    body: 'Helvetica',
  };

  const styles = createStyles(colorScheme, fontPairing);

  // Sort sections by order and filter visible ones
  const visibleSections = resume.sections
    .filter(s => s.visible)
    .sort((a, b) => a.order - b.order);

  const pageProps = { size: 'A4' as const, style: styles.page };

  return (
    <Document>
      <Page {...pageProps}>
        {visibleSections.map(section => {
          switch (section.type) {
            case 'personal':
              return (
                <View key={section.id} style={styles.header}>
                  <Text style={styles.name}>{section.content.fullName || 'Your Name'}</Text>
                  {section.content.email && (
                    <Text style={styles.contactInfo}>{section.content.email}</Text>
                  )}
                  {section.content.phone && (
                    <Text style={styles.contactInfo}>{section.content.phone}</Text>
                  )}
                  {section.content.location && (
                    <Text style={styles.contactInfo}>{section.content.location}</Text>
                  )}
                  {section.content.linkedIn && (
                    <Text style={styles.contactInfo}>{section.content.linkedIn}</Text>
                  )}
                  {section.content.portfolio && (
                    <Text style={styles.contactInfo}>{section.content.portfolio}</Text>
                  )}
                </View>
              );

            case 'education':
              return (
                <View key={section.id} style={styles.section}>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                  {Array.isArray(section.content) &&
                    section.content.map((edu: any, idx: number) => (
                      <View key={idx} style={{ marginBottom: 8 }}>
                        <View style={styles.entryHeader}>
                          <View>
                            <Text style={styles.entryTitle}>{edu.schoolName}</Text>
                            <Text style={styles.entrySubtitle}>
                              {edu.degree} in {edu.fieldOfStudy}
                            </Text>
                          </View>
                          <Text style={styles.entryDate}>
                            {edu.startDate} - {edu.current ? 'Present' : edu.endDate}
                          </Text>
                        </View>
                        {edu.achievements && edu.achievements.length > 0 && (
                          <View>
                            {edu.achievements.map((achievement: string, i: number) => (
                              <Text key={i} style={styles.bulletPoint}>
                                • {achievement}
                              </Text>
                            ))}
                          </View>
                        )}
                      </View>
                    ))}
                </View>
              );

            case 'experience':
              return (
                <View key={section.id} style={styles.section}>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                  {Array.isArray(section.content) &&
                    section.content.map((exp: any, idx: number) => (
                      <View key={idx} style={{ marginBottom: 8 }}>
                        <View style={styles.entryHeader}>
                          <View>
                            <Text style={styles.entryTitle}>{exp.role}</Text>
                            <Text style={styles.entrySubtitle}>{exp.organizationName}</Text>
                          </View>
                          <Text style={styles.entryDate}>
                            {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                          </Text>
                        </View>
                        {exp.responsibilities && exp.responsibilities.length > 0 && (
                          <View>
                            {exp.responsibilities.map((resp: string, i: number) => (
                              <Text key={i} style={styles.bulletPoint}>
                                • {resp}
                              </Text>
                            ))}
                          </View>
                        )}
                      </View>
                    ))}
                </View>
              );

            case 'skills':
              return (
                <View key={section.id} style={styles.section}>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                  <View style={styles.skillsContainer}>
                    {Array.isArray(section.content) &&
                      section.content.map((skill: string, idx: number) => (
                        <Text key={idx} style={styles.skillTag}>
                          {skill}
                        </Text>
                      ))}
                  </View>
                </View>
              );

            case 'achievements':
              return (
                <View key={section.id} style={styles.section}>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                  {Array.isArray(section.content) &&
                    section.content.map((achievement: string, idx: number) => (
                      <Text key={idx} style={styles.bulletPoint}>
                        • {achievement}
                      </Text>
                    ))}
                </View>
              );

            default:
              return null;
          }
        })}
      </Page>
    </Document>
  );
}

/**
 * Generate Resume PDF as Blob
 */
export async function generateResumePDF(resume: ResumeState): Promise<Blob> {
  try {
    const startTime = Date.now();

    // Create PDF document
    const doc = createResumePDFDocument(resume);

    // Generate blob
    const blob = await pdf(doc).toBlob();

    // Check file size
    if (blob.size > MAX_RESUME_SIZE) {
      throw new Error(
        `PDF file size (${(blob.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (2MB). Please reduce content.`
      );
    }

    // Check generation time (should be < 5 seconds)
    const duration = Date.now() - startTime;
    if (duration > 5000) {
      console.warn(`PDF generation took ${duration}ms, which exceeds the 5-second target.`);
    }

    return blob;
  } catch (error) {
    console.error('Failed to generate resume PDF:', error);
    throw new Error(
      error instanceof Error ? error.message : 'PDF generation failed. Please try again.'
    );
  }
}

// ============================================================================
// Cover Letter PDF Generation
// ============================================================================

/**
 * Generate Cover Letter PDF Document
 */
function createCoverLetterPDFDocument(coverLetter: CoverLetterState) {
  const colorScheme = {
    id: 'blue',
    name: 'Professional Blue',
    primary: '#0095FF',
    secondary: '#0077CC',
    text: '#1F2937',
    background: '#FFFFFF',
  };

  const fontPairing = {
    id: 'professional',
    name: 'Professional',
    heading: 'Helvetica-Bold',
    body: 'Helvetica',
  };

  const styles = createStyles(colorScheme, fontPairing);

  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const pageProps = { size: 'A4' as const, style: styles.page };

  return (
    <Document>
      <Page {...pageProps}>
        {/* Date */}
        <Text style={{ ...styles.text, marginBottom: 20 }}>{today}</Text>

        {/* Company Address */}
        <View style={{ marginBottom: 20 }}>
          <Text style={styles.text}>{coverLetter.companyName}</Text>
        </View>

        {/* Salutation */}
        <Text style={{ ...styles.text, marginBottom: 16 }}>
          Dear Hiring Manager,
        </Text>

        {/* Opening */}
        <Text style={{ ...styles.text, marginBottom: 12 }}>
          {coverLetter.content.opening}
        </Text>

        {/* Body Paragraphs */}
        {coverLetter.content.body.map((paragraph, idx) => (
          <Text key={idx} style={{ ...styles.text, marginBottom: 12 }}>
            {paragraph}
          </Text>
        ))}

        {/* Closing */}
        <Text style={{ ...styles.text, marginBottom: 20 }}>
          {coverLetter.content.closing}
        </Text>

        {/* Signature */}
        <View>
          <Text style={styles.text}>Sincerely,</Text>
          <Text style={{ ...styles.text, marginTop: 20 }}>
            [Your Name]
          </Text>
        </View>
      </Page>
    </Document>
  );
}

/**
 * Generate Cover Letter PDF as Blob
 */
export async function generateCoverLetterPDF(coverLetter: CoverLetterState): Promise<Blob> {
  try {
    const startTime = Date.now();

    // Create PDF document
    const doc = createCoverLetterPDFDocument(coverLetter);

    // Generate blob
    const blob = await pdf(doc).toBlob();

    // Check file size
    if (blob.size > MAX_COVER_LETTER_SIZE) {
      throw new Error(
        `PDF file size (${(blob.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (1MB). Please reduce content.`
      );
    }

    // Check generation time (should be < 3 seconds)
    const duration = Date.now() - startTime;
    if (duration > 3000) {
      console.warn(`PDF generation took ${duration}ms, which exceeds the 3-second target.`);
    }

    return blob;
  } catch (error) {
    console.error('Failed to generate cover letter PDF:', error);
    throw new Error(
      error instanceof Error ? error.message : 'PDF generation failed. Please try again.'
    );
  }
}

// ============================================================================
// Combined PDF Generation
// ============================================================================

interface DocumentToExport {
  type: 'resume' | 'coverLetter';
  data: ResumeState | CoverLetterState;
}

/**
 * Generate Combined PDF with multiple documents
 */
export async function generateCombinedPDF(documents: DocumentToExport[]): Promise<Blob> {
  try {
    const startTime = Date.now();

    // Generate individual PDFs
    const blobs = await Promise.all(
      documents.map(doc => {
        if (doc.type === 'resume') {
          return generateResumePDF(doc.data as ResumeState);
        } else {
          return generateCoverLetterPDF(doc.data as CoverLetterState);
        }
      })
    );

    // For now, we'll just return the first document
    // TODO: Implement proper PDF merging
    const combinedBlob = blobs[0];

    // Check file size
    if (combinedBlob.size > MAX_COMBINED_SIZE) {
      throw new Error(
        `Combined PDF file size (${(combinedBlob.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (5MB). Please reduce content.`
      );
    }

    // Check generation time (should be < 5 seconds)
    const duration = Date.now() - startTime;
    if (duration > 5000) {
      console.warn(`Combined PDF generation took ${duration}ms, which exceeds the 5-second target.`);
    }

    return combinedBlob;
  } catch (error) {
    console.error('Failed to generate combined PDF:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Combined PDF generation failed. Please try again.'
    );
  }
}

// ============================================================================
// ATS Compatibility Validation
// ============================================================================

/**
 * Validate ATS compatibility of a document
 */
export function validateATSCompatibility(document: any): ATSValidationResult {
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // Check for ATS-friendly formatting
  let isCompatible = true;

  // Check 1: Ensure standard fonts are used
  if (document.fontPairing && !['professional', 'modern'].includes(document.fontPairing)) {
    warnings.push('Non-standard font detected. ATS systems prefer Arial, Calibri, or Times New Roman.');
    isCompatible = false;
  }

  // Check 2: Ensure single-column layout (our templates are already single-column)
  // This is enforced by design, so no check needed

  // Check 3: Check for required sections
  if (document.sections) {
    const hasPersonal = document.sections.some((s: any) => s.type === 'personal' && s.visible);
    const hasExperience = document.sections.some((s: any) => s.type === 'experience' && s.visible);

    if (!hasPersonal) {
      warnings.push('Missing personal information section.');
      suggestions.push('Add a personal information section with your name and contact details.');
      isCompatible = false;
    }

    if (!hasExperience) {
      suggestions.push('Consider adding an experience or education section to strengthen your resume.');
    }
  }

  // Check 4: Ensure text is selectable (enforced by @react-pdf/renderer)
  // This is guaranteed by our implementation

  // Check 5: File size check
  // This is handled in the generation functions

  return {
    isCompatible,
    warnings,
    suggestions,
  };
}

// ============================================================================
// Export default
// ============================================================================

export default {
  generateResumePDF,
  generateCoverLetterPDF,
  generateCombinedPDF,
  validateATSCompatibility,
};


