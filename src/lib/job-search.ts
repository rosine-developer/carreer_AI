// Job Search Service
// Uses Groq AI to generate relevant job suggestions + links to real job boards

export interface RealJob {
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
  applyUrl: string;
  logo?: string;
  postedAt?: string;
}

// ============================================================================
// AI-powered job generation using Groq
// ============================================================================

async function generateJobsWithAI(
  query: string,
  isInternship: boolean,
  conversationContext: string
): Promise<RealJob[]> {
  const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
  if (!GROQ_API_KEY) return [];

  const jobType = isInternship ? 'internship' : 'job';
  const applyUrl = `https://www.indeed.com/jobs?q=${encodeURIComponent(query + (isInternship ? ' internship' : ''))}`;

  const prompt = `Generate 5 realistic ${jobType} listings for: "${query}".

Context: ${conversationContext.slice(0, 200)}

Return ONLY a valid JSON array, no markdown, no explanation:
[
  {
    "title": "Specific Job Title",
    "company": "Real Company Name",
    "location": "City, Country",
    "salary": "$X – $Y/hr or $XK – $YK",
    "type": "${isInternship ? 'Internship' : 'Full-time'}",
    "remote": false,
    "description": "2 sentence specific description of this exact role.",
    "tags": ["skill1", "skill2", "skill3"],
    "applyUrl": "${applyUrl}"
  }
]

Rules:
- ALL 5 jobs must be for "${query}" ONLY — do not mix in unrelated fields
- Use real company names that actually hire for this role
- Make salary realistic for this specific field
- Description must be specific to ${query}, not generic`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) return [];

    const data = await response.json();
    const text = data.choices[0]?.message?.content || '';

    // Extract JSON array from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const jobs = JSON.parse(jsonMatch[0]);

    return jobs.map((job: any, index: number): RealJob => ({
      id: `ai-job-${Date.now()}-${index}`,
      title: job.title || 'Unknown Title',
      company: job.company || 'Unknown Company',
      location: job.location || 'Various Locations',
      salary: job.salary || 'Competitive',
      matchScore: Math.max(75, 95 - index * 5),
      remote: job.remote || false,
      type: job.type || (isInternship ? 'Internship' : 'Full-time'),
      description: job.description || '',
      tags: Array.isArray(job.tags) ? job.tags.slice(0, 4) : [],
      applyUrl: job.applyUrl || applyUrl,
    }));
  } catch (err) {
    console.warn('AI job generation failed:', err);
    return [];
  }
}

// ============================================================================
// Main search function
// ============================================================================

export async function searchJobs(
  query: string,
  options: { internship?: boolean; context?: string } = {}
): Promise<RealJob[]> {
  return generateJobsWithAI(
    query,
    options.internship || false,
    options.context || ''
  );
}

// ============================================================================
// Extract job search query — current message takes priority over history
// ============================================================================

export function extractJobQuery(
  userMessage: string,
  conversationContext: string
): { query: string; isInternship: boolean } {
  const messageLower = userMessage.toLowerCase();
  const combined = (userMessage + ' ' + conversationContext).toLowerCase();

  const isInternship =
    combined.includes('intern') ||
    combined.includes('internship') ||
    combined.includes('work experience') ||
    combined.includes('placement') ||
    combined.includes('apprentice');

  const fieldKeywords: Record<string, string> = {
    pharmacist: 'pharmacist pharmacy',
    pharmacy: 'pharmacist pharmacy',
    pharmaceutical: 'pharmaceutical pharmacist',
    electrician: 'electrician',
    electrical: 'electrician electrical',
    plumber: 'plumber plumbing',
    plumbing: 'plumber plumbing',
    carpenter: 'carpenter carpentry',
    carpentry: 'carpenter carpentry',
    welder: 'welder welding',
    welding: 'welder welding',
    mechanic: 'mechanic automotive',
    automotive: 'automotive mechanic',
    construction: 'construction worker',
    hvac: 'HVAC technician',
    accounting: 'accountant accounting',
    accountant: 'accountant accounting',
    finance: 'finance analyst',
    financial: 'financial analyst',
    software: 'software developer',
    developer: 'software developer',
    programmer: 'software developer',
    coding: 'software developer',
    marketing: 'marketing coordinator',
    design: 'graphic designer',
    designer: 'graphic designer',
    nursing: 'nurse nursing',
    nurse: 'nurse nursing',
    medical: 'medical assistant',
    healthcare: 'healthcare assistant',
    doctor: 'physician doctor',
    physician: 'physician doctor',
    dentist: 'dentist dental',
    dental: 'dentist dental',
    teaching: 'teacher education',
    teacher: 'teacher education',
    education: 'teacher education',
    business: 'business analyst',
    management: 'management trainee',
    engineering: 'engineer',
    mechanical: 'mechanical engineer',
    civil: 'civil engineer',
    chemical: 'chemical engineer',
    data: 'data analyst',
    hr: 'human resources',
    law: 'paralegal legal',
    legal: 'paralegal legal',
    journalism: 'journalist media',
    architecture: 'architect architectural',
    psychology: 'psychology counselor',
    chef: 'chef culinary',
    culinary: 'chef culinary',
    hospitality: 'hospitality hotel',
    logistics: 'logistics supply chain',
  };

  // Check CURRENT MESSAGE first — highest priority
  let query = '';
  for (const [keyword, searchTerm] of Object.entries(fieldKeywords)) {
    if (messageLower.includes(keyword)) {
      query = searchTerm;
      break;
    }
  }

  // Only check conversation history if current message had no match
  if (!query) {
    for (const [keyword, searchTerm] of Object.entries(fieldKeywords)) {
      if (combined.includes(keyword)) {
        query = searchTerm;
        break;
      }
    }
  }

  // Fallback: clean up the user message
  if (!query) {
    query = userMessage
      .replace(/\b(i'm|i am|i need|i want|looking for|search|find|help|please|show|me|a|an|the|job|work|internship|position|role|opportunity|career|opportunities)\b/gi, '')
      .trim()
      .slice(0, 60);
  }

  return { query: query || 'entry level', isInternship };
}


