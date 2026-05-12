export interface Message {
  id: string;
  role: "ai" | "user";
  content: string;
  timestamp: Date;
  jobCards?: JobCard[];
  isOnboarding?: boolean;
  onboardingData?: OnboardingData;
}

export interface JobCard {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  matchScore: number;
  remote: boolean;
  type: string;
  description: string;
  tags: string[];
  applyUrl?: string;
  logo?: string;
}

export interface OnboardingData {
  degree: string;
  fieldOfStudy: string;
  interests: string[];
}

export interface PreferenceTag {
  id: string;
  label: string;
  weight: number; // 1-3
  category: "positive" | "negative" | "neutral";
}

export interface OpportunitySource {
  platform: string;
  logo: string;
  url: string;
  jobCount: number;
  bookmarked?: boolean;
}






