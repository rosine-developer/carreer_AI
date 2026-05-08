// Application Helper System Type Definitions
// Based on design document specifications

// ============================================================================
// Profile Data Types
// ============================================================================

export interface ProfileData {
  personal: PersonalInfo;
  education: EducationEntry[];
  experience: ExperienceEntry[];
  skills: string[];
  achievements: string[];
}

export interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedIn?: string;
  portfolio?: string;
}

export interface EducationEntry {
  id: string;
  schoolName: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  current: boolean;
  achievements: string[];
}

export interface ExperienceEntry {
  id: string;
  organizationName: string;
  role: string;
  startDate: string;
  endDate: string;
  current: boolean;
  responsibilities: string[];
}

// ============================================================================
// Resume Types
// ============================================================================

export interface ResumeState {
  template: 'modern' | 'classic' | 'minimal';
  colorScheme: 'blue' | 'orange' | 'neutral';
  fontPairing: 'professional' | 'modern';
  sections: ResumeSection[];
  metadata: ResumeMetadata;
}

export interface ResumeSection {
  id: string;
  type: 'personal' | 'education' | 'experience' | 'skills' | 'achievements' | 'custom';
  title: string;
  content: any; // Type varies by section
  order: number;
  visible: boolean;
}

export interface ResumeMetadata {
  draftId: string;
  lastSaved: Date;
  name: string;
}

export interface ResumeTemplate {
  id: string;
  name: string;
  description: string;
  preview: string;
  colorSchemes: ColorScheme[];
  fontPairings: FontPairing[];
}

export interface ColorScheme {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  text: string;
  background: string;
}

export interface FontPairing {
  id: string;
  name: string;
  heading: string;
  body: string;
}

// ============================================================================
// Cover Letter Types
// ============================================================================

export interface CoverLetterState {
  jobTitle: string;
  companyName: string;
  jobDescription: string;
  tone: Tone;
  content: CoverLetterContent;
  metadata: CoverLetterMetadata;
}

export interface CoverLetterContent {
  opening: string;
  body: string[]; // Array of paragraphs
  closing: string;
}

export interface CoverLetterMetadata {
  draftId: string;
  lastSaved: Date;
  name: string;
}

export type Tone = 'professional' | 'enthusiastic' | 'formal';

export interface JobDetails {
  title: string;
  company: string;
  description: string;
}

// ============================================================================
// Application Tracker Types
// ============================================================================

export interface Application {
  id: string;
  jobTitle: string;
  companyName: string;
  applicationDate: Date;
  status: ApplicationStatus;
  followUpDate?: Date;
  notes: string;
  attachments: ApplicationAttachments;
}

export interface ApplicationAttachments {
  resumeId?: string;
  coverLetterId?: string;
}

export type ApplicationStatus = 'applied' | 'interview' | 'rejected' | 'accepted';

export interface ApplicationStats {
  total: number;
  byStatus: Record<ApplicationStatus, number>;
  percentages: Record<ApplicationStatus, number>;
  averageResponseTime: number;
  topCompanies: { company: string; count: number }[];
  topRoles: { role: string; count: number }[];
}

// ============================================================================
// Form Helper Types
// ============================================================================

export interface FormQuestion {
  id: string;
  question: string;
  category: QuestionCategory;
  savedResponse: string;
  characterLimit?: number;
  lastModified: Date;
}

export type QuestionCategory = 'motivation' | 'strengths' | 'experience' | 'goals' | 'custom';

export interface FormResponse {
  questionId: string;
  question: string;
  response: string;
  lastModified: Date;
}

// ============================================================================
// Draft Management Types
// ============================================================================

export interface DraftMetadata {
  id: string;
  type: 'resume' | 'coverLetter';
  name: string;
  lastModified: Date;
  preview: string;
}

// ============================================================================
// AI Content Generator Types
// ============================================================================

export interface GenerationContext {
  profile: ProfileData;
  jobDescription?: string;
  targetRole?: string;
  existingContent?: string;
}

export interface JobAnalysis {
  keyRequirements: string[];
  requiredSkills: string[];
  matchingSkills: string[];
  missingSkills: string[];
  recommendations: Recommendation[];
}

export interface Recommendation {
  type: 'skill' | 'experience' | 'achievement';
  content: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

export interface Improvement {
  type: 'spelling' | 'grammar' | 'weak-language' | 'missing-info';
  location: { section: string; position: number };
  message: string;
  suggestion: string;
}

// ============================================================================
// Quality Validation Types
// ============================================================================

export interface QualityScore {
  overall: number; // 1-100
  completeness: number;
  clarity: number;
  professionalism: number;
  issues: QualityIssue[];
  suggestions: string[];
}

export interface QualityIssue {
  type: 'spelling' | 'grammar' | 'weak-language' | 'missing-info';
  location: { section: string; position: number };
  message: string;
  suggestion: string;
}

// ============================================================================
// PDF Generator Types
// ============================================================================

export interface ATSValidationResult {
  isCompatible: boolean;
  warnings: string[];
  suggestions: string[];
}

// ============================================================================
// Component Props Types
// ============================================================================

export interface ResumeBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  job?: any; // JobCard type from existing system
  draftId?: string;
  profileData?: ProfileData;
}

export interface CoverLetterWriterProps {
  isOpen: boolean;
  onClose: () => void;
  job?: any; // JobCard type from existing system
  draftId?: string;
  profileData?: ProfileData;
}

export interface ApplicationFormHelperProps {
  isOpen: boolean;
  onClose: () => void;
  job?: any; // JobCard type from existing system
}

export interface ProfileManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface ApplicationTrackerProps {
  // Standalone view, no props needed
}

// ============================================================================
// Storage Manager Types
// ============================================================================

export interface StorageManager {
  // Profile
  saveProfile(profile: ProfileData): Promise<void>;
  loadProfile(): Promise<ProfileData | null>;

  // Drafts
  saveDraft(type: 'resume' | 'coverLetter', draft: any): Promise<string>;
  loadDraft(id: string): Promise<any | null>;
  listDrafts(type?: 'resume' | 'coverLetter'): Promise<DraftMetadata[]>;
  deleteDraft(id: string): Promise<void>;

  // Applications
  saveApplication(app: Application): Promise<string>;
  loadApplication(id: string): Promise<Application | null>;
  listApplications(): Promise<Application[]>;
  updateApplicationStatus(id: string, status: ApplicationStatus): Promise<void>;
  deleteApplication(id: string): Promise<void>;

  // Form responses
  saveFormResponse(questionId: string, response: string): Promise<void>;
  loadFormResponse(questionId: string): Promise<string | null>;
  listFormResponses(): Promise<FormResponse[]>;
}

// ============================================================================
// AI Content Generator Service Types
// ============================================================================

export interface AIContentGenerator {
  generateResumeSection(
    sectionType: string,
    context: GenerationContext
  ): Promise<string>;

  generateCoverLetter(
    jobDetails: JobDetails,
    tone: Tone,
    context: GenerationContext
  ): Promise<CoverLetterContent>;

  generateFormResponse(
    question: string,
    context: GenerationContext
  ): Promise<string>;

  analyzeJobDescription(
    jobDescription: string,
    profile: ProfileData
  ): Promise<JobAnalysis>;

  suggestImprovements(
    content: string,
    type: 'resume' | 'coverLetter'
  ): Promise<Improvement[]>;
}

// ============================================================================
// PDF Generator Service Types
// ============================================================================

export interface PDFGeneratorService {
  generateResumePDF(resume: ResumeState): Promise<Blob>;
  generateCoverLetterPDF(coverLetter: CoverLetterState): Promise<Blob>;
  generateCombinedPDF(documents: Document[]): Promise<Blob>;
  validateATSCompatibility(document: any): ATSValidationResult;
}
