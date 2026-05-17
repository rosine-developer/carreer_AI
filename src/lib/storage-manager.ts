// Storage Manager Service
// Handles localStorage operations with auto-save, retry logic, and data validation

import debounce from 'lodash.debounce';
import type {
  ProfileData,
  Application,
  ApplicationStatus,
  DraftMetadata,
  FormResponse,
} from '../types/application-helper';

// ============================================================================
// User-scoped storage keys
// Each user gets their own namespace so data never leaks between accounts
// ============================================================================

function getUserId(userId?: string): string {
  // Use explicitly passed userId first (most reliable)
  if (userId) return userId;

  // Fall back to reading from Supabase session in localStorage
  try {
    const keys = Object.keys(localStorage);
    const authKey = keys.find(k => k.includes('supabase') && k.includes('auth'));
    if (authKey) {
      const session = JSON.parse(localStorage.getItem(authKey) || '{}');
      const uid = session?.user?.id;
      if (uid) return uid;
    }
  } catch {}
  return 'guest';
}

function getStorageKeys(userId?: string) {
  const uid = getUserId(userId);
  return {
    PROFILE: `careermind:${uid}:profile`,
    DRAFTS: `careermind:${uid}:drafts`,
    APPLICATIONS: `careermind:${uid}:applications`,
    FORM_RESPONSES: `careermind:${uid}:form_responses`,
  };
}

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 500; // ms

// Debounce delay for auto-save
const AUTO_SAVE_DELAY = 2000; // 2 seconds

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Safely parse JSON from localStorage
 */
function safeJSONParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.error('Failed to parse JSON from localStorage:', error);
    return fallback;
  }
}

/**
 * Retry a function up to MAX_RETRIES times
 */
async function retryOperation<T>(
  operation: () => Promise<T>,
  retries = MAX_RETRIES
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return retryOperation(operation, retries - 1);
    }
    throw error;
  }
}

/**
 * Validate data before storage
 */
function validateData(data: any): boolean {
  if (data === null || data === undefined) {
    return false;
  }
  // Add more validation as needed
  return true;
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// Profile Operations
// ============================================================================

export async function saveProfile(profile: ProfileData, userId?: string): Promise<void> {
  if (!validateData(profile)) {
    throw new Error('Invalid profile data');
  }

  return retryOperation(async () => {
    try {
      localStorage.setItem(getStorageKeys(userId).PROFILE, JSON.stringify(profile));
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        throw new Error('Storage full. Please delete old drafts.');
      }
      throw new Error('Unable to save profile. Please try again.');
    }
  });
}

export async function loadProfile(userId?: string): Promise<ProfileData | null> {
  try {
    const data = localStorage.getItem(getStorageKeys(userId).PROFILE);
    return safeJSONParse<ProfileData | null>(data, null);
  } catch (error) {
    console.error('Failed to load profile:', error);
    return null;
  }
}

// Debounced version for auto-save
export const saveProfileDebounced = debounce(saveProfile, AUTO_SAVE_DELAY);

// ============================================================================
// Draft Operations
// ============================================================================

interface DraftData {
  [id: string]: {
    type: 'resume' | 'coverLetter';
    name: string;
    lastModified: string;
    preview: string;
    content: any;
  };
}

export async function saveDraft(
  type: 'resume' | 'coverLetter',
  draft: any,
  userId?: string
): Promise<string> {
  if (!validateData(draft)) {
    throw new Error('Invalid draft data');
  }

  return retryOperation(async () => {
    try {
      const drafts = safeJSONParse<DraftData>(
        localStorage.getItem(getStorageKeys(userId).DRAFTS),
        {}
      );

      const draftId = draft.metadata?.draftId || generateId();
      const preview = generatePreview(draft, type);

      drafts[draftId] = {
        type,
        name: draft.metadata?.name || `Untitled ${type}`,
        lastModified: new Date().toISOString(),
        preview,
        content: draft,
      };

      localStorage.setItem(getStorageKeys(userId).DRAFTS, JSON.stringify(drafts));
      return draftId;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        throw new Error('Storage full. Please delete old drafts.');
      }
      throw new Error('Unable to save draft. Your work is preserved in this session.');
    }
  });
}

export async function loadDraft(id: string, userId?: string): Promise<any | null> {
  try {
    const drafts = safeJSONParse<DraftData>(
      localStorage.getItem(getStorageKeys(userId).DRAFTS),
      {}
    );
    return drafts[id]?.content || null;
  } catch (error) {
    console.error('Failed to load draft:', error);
    return null;
  }
}

export async function listDrafts(
  type?: 'resume' | 'coverLetter',
  userId?: string
): Promise<DraftMetadata[]> {
  try {
    const drafts = safeJSONParse<DraftData>(
      localStorage.getItem(getStorageKeys(userId).DRAFTS),
      {}
    );

    return Object.entries(drafts)
      .filter(([_, draft]) => !type || draft.type === type)
      .map(([id, draft]) => ({
        id,
        type: draft.type,
        name: draft.name,
        lastModified: new Date(draft.lastModified),
        preview: draft.preview,
      }))
      .sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
  } catch (error) {
    console.error('Failed to list drafts:', error);
    return [];
  }
}

export async function deleteDraft(id: string, userId?: string): Promise<void> {
  return retryOperation(async () => {
    try {
      const drafts = safeJSONParse<DraftData>(
        localStorage.getItem(getStorageKeys(userId).DRAFTS),
        {}
      );

      delete drafts[id];
      localStorage.setItem(getStorageKeys(userId).DRAFTS, JSON.stringify(drafts));
    } catch (error) {
      throw new Error('Unable to delete draft. Please try again.');
    }
  });
}

// Debounced version for auto-save
export const saveDraftDebounced = debounce(saveDraft, AUTO_SAVE_DELAY);

/**
 * Generate preview text for a draft
 */
function generatePreview(draft: any, type: 'resume' | 'coverLetter'): string {
  if (type === 'resume') {
    const personalSection = draft.sections?.find((s: any) => s.type === 'personal');
    return personalSection?.content?.fullName || 'Untitled Resume';
  } else {
    return `${draft.companyName || 'Untitled'} - ${draft.jobTitle || 'Cover Letter'}`;
  }
}

// ============================================================================
// Application Operations
// ============================================================================

interface ApplicationData {
  [id: string]: Application;
}

export async function saveApplication(app: Application): Promise<string> {
  if (!validateData(app)) {
    throw new Error('Invalid application data');
  }

  return retryOperation(async () => {
    try {
      const applications = safeJSONParse<ApplicationData>(
        localStorage.getItem(getStorageKeys().APPLICATIONS),
        {}
      );

      const appId = app.id || generateId();
      applications[appId] = { ...app, id: appId };

      localStorage.setItem(getStorageKeys().APPLICATIONS, JSON.stringify(applications));
      return appId;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        throw new Error('Storage full. Please delete old applications.');
      }
      throw new Error('Unable to save application. Please try again.');
    }
  });
}

export async function loadApplication(id: string): Promise<Application | null> {
  try {
    const applications = safeJSONParse<ApplicationData>(
      localStorage.getItem(getStorageKeys().APPLICATIONS),
      {}
    );
    const app = applications[id];
    if (!app) return null;

    // Convert date strings back to Date objects
    return {
      ...app,
      applicationDate: new Date(app.applicationDate),
      followUpDate: app.followUpDate ? new Date(app.followUpDate) : undefined,
    };
  } catch (error) {
    console.error('Failed to load application:', error);
    return null;
  }
}

export async function listApplications(): Promise<Application[]> {
  try {
    const applications = safeJSONParse<ApplicationData>(
      localStorage.getItem(getStorageKeys().APPLICATIONS),
      {}
    );

    return Object.values(applications)
      .map(app => ({
        ...app,
        applicationDate: new Date(app.applicationDate),
        followUpDate: app.followUpDate ? new Date(app.followUpDate) : undefined,
      }))
      .sort((a, b) => b.applicationDate.getTime() - a.applicationDate.getTime());
  } catch (error) {
    console.error('Failed to list applications:', error);
    return [];
  }
}

export async function updateApplicationStatus(
  id: string,
  status: ApplicationStatus
): Promise<void> {
  return retryOperation(async () => {
    try {
      const applications = safeJSONParse<ApplicationData>(
        localStorage.getItem(getStorageKeys().APPLICATIONS),
        {}
      );

      if (!applications[id]) {
        throw new Error('Application not found');
      }

      applications[id].status = status;
      localStorage.setItem(getStorageKeys().APPLICATIONS, JSON.stringify(applications));
    } catch (error) {
      throw new Error('Unable to update application status. Please try again.');
    }
  });
}

export async function deleteApplication(id: string): Promise<void> {
  return retryOperation(async () => {
    try {
      const applications = safeJSONParse<ApplicationData>(
        localStorage.getItem(getStorageKeys().APPLICATIONS),
        {}
      );

      delete applications[id];
      localStorage.setItem(getStorageKeys().APPLICATIONS, JSON.stringify(applications));
    } catch (error) {
      throw new Error('Unable to delete application. Please try again.');
    }
  });
}

// ============================================================================
// Form Response Operations
// ============================================================================

interface FormResponseData {
  [questionId: string]: {
    question: string;
    response: string;
    lastModified: string;
  };
}

export async function saveFormResponse(
  questionId: string,
  response: string
): Promise<void> {
  if (!validateData(response)) {
    throw new Error('Invalid response data');
  }

  return retryOperation(async () => {
    try {
      const responses = safeJSONParse<FormResponseData>(
        localStorage.getItem(getStorageKeys().FORM_RESPONSES),
        {}
      );

      responses[questionId] = {
        question: responses[questionId]?.question || '',
        response,
        lastModified: new Date().toISOString(),
      };

      localStorage.setItem(getStorageKeys().FORM_RESPONSES, JSON.stringify(responses));
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        throw new Error('Storage full. Please delete old responses.');
      }
      throw new Error('Unable to save response. Please try again.');
    }
  });
}

export async function loadFormResponse(questionId: string): Promise<string | null> {
  try {
    const responses = safeJSONParse<FormResponseData>(
      localStorage.getItem(getStorageKeys().FORM_RESPONSES),
      {}
    );
    return responses[questionId]?.response || null;
  } catch (error) {
    console.error('Failed to load form response:', error);
    return null;
  }
}

export async function listFormResponses(): Promise<FormResponse[]> {
  try {
    const responses = safeJSONParse<FormResponseData>(
      localStorage.getItem(getStorageKeys().FORM_RESPONSES),
      {}
    );

    return Object.entries(responses).map(([questionId, data]) => ({
      questionId,
      question: data.question,
      response: data.response,
      lastModified: new Date(data.lastModified),
    }));
  } catch (error) {
    console.error('Failed to list form responses:', error);
    return [];
  }
}

// Debounced version for auto-save
export const saveFormResponseDebounced = debounce(saveFormResponse, AUTO_SAVE_DELAY);

// ============================================================================
// Export default storage manager object
// ============================================================================

const storageManager = {
  // Profile
  saveProfile,
  loadProfile,
  saveProfileDebounced,

  // Drafts
  saveDraft,
  loadDraft,
  listDrafts,
  deleteDraft,
  saveDraftDebounced,

  // Applications
  saveApplication,
  loadApplication,
  listApplications,
  updateApplicationStatus,
  deleteApplication,

  // Form responses
  saveFormResponse,
  loadFormResponse,
  listFormResponses,
  saveFormResponseDebounced,
};

export default storageManager;












