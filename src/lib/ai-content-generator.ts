// AI Content Generator Service
// Extends existing Groq API integration for application-specific content generation

import type {
  GenerationContext,
  JobAnalysis,
  Recommendation,
  Improvement,
  CoverLetterContent,
  JobDetails,
  Tone,
  ProfileData,
} from '../types/application-helper';

// ============================================================================
// Constants
// ============================================================================

const AI_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 2;

// Check if Groq API is available
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const HAS_GROQ_API = Boolean(GROQ_API_KEY);

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Call Groq API with timeout and retry logic
 */
async function callGroqAPI(
  prompt: string,
  systemPrompt: string,
  retries = MAX_RETRIES
): Promise<string> {
  if (!HAS_GROQ_API) {
    throw new Error('Groq API not configured');
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT);

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  } catch (error) {
    if (retries > 0 && error instanceof Error && error.name !== 'AbortError') {
      // Retry on non-timeout errors
      await new Promise(resolve => setTimeout(resolve, 1000));
      return callGroqAPI(prompt, systemPrompt, retries - 1);
    }
    throw error;
  }
}

/**
 * Format profile data for AI context
 */
function formatProfileContext(profile: ProfileData): string {
  const parts: string[] = [];

  if (profile.personal) {
    parts.push(`Name: ${profile.personal.fullName}`);
  }

  if (profile.education && profile.education.length > 0) {
    parts.push('\nEducation:');
    profile.education.forEach(edu => {
      parts.push(`- ${edu.degree} in ${edu.fieldOfStudy} from ${edu.schoolName}`);
    });
  }

  if (profile.experience && profile.experience.length > 0) {
    parts.push('\nExperience:');
    profile.experience.forEach(exp => {
      parts.push(`- ${exp.role} at ${exp.organizationName}`);
    });
  }

  if (profile.skills && profile.skills.length > 0) {
    parts.push(`\nSkills: ${profile.skills.join(', ')}`);
  }

  if (profile.achievements && profile.achievements.length > 0) {
    parts.push('\nAchievements:');
    profile.achievements.forEach(ach => {
      parts.push(`- ${ach}`);
    });
  }

  return parts.join('\n');
}

// ============================================================================
// Resume Section Generation
// ============================================================================

/**
 * Generate content for a resume section
 */
export async function generateResumeSection(
  sectionType: string,
  context: GenerationContext
): Promise<string> {
  const systemPrompt = `You are a career counselor helping young people (ages 12-18) create professional resumes. 
Use clear, age-appropriate language at a grades 8-12 reading level. 
Be encouraging and supportive while maintaining professionalism.`;

  const profileContext = formatProfileContext(context.profile);

  let prompt = '';

  switch (sectionType) {
    case 'summary':
      prompt = `Create a brief professional summary (2-3 sentences) for a resume based on this profile:

${profileContext}

${context.targetRole ? `Target role: ${context.targetRole}` : ''}
${context.jobDescription ? `Job description: ${context.jobDescription}` : ''}

Write a compelling summary that highlights key strengths and career goals.`;
      break;

    case 'experience':
      prompt = `Suggest 3-4 strong bullet points describing responsibilities and achievements for this experience:

Role: ${context.existingContent || 'Internship'}

Profile context:
${profileContext}

Use action verbs and quantify achievements where possible. Keep language appropriate for a young professional.`;
      break;

    case 'skills':
      prompt = `Based on this profile and target role, suggest 8-10 relevant skills to highlight:

${profileContext}

${context.targetRole ? `Target role: ${context.targetRole}` : ''}
${context.jobDescription ? `Job requirements: ${context.jobDescription}` : ''}

List skills that match the role and are appropriate for a young professional.`;
      break;

    default:
      throw new Error(`Unsupported section type: ${sectionType}`);
  }

  try {
    const content = await callGroqAPI(prompt, systemPrompt);
    return content;
  } catch (error) {
    console.error('AI generation failed, using template:', error);
    return generateTemplateSectionContent(sectionType, context);
  }
}

/**
 * Template-based fallback for resume sections
 */
function generateTemplateSectionContent(
  sectionType: string,
  context: GenerationContext
): string {
  switch (sectionType) {
    case 'summary':
      return `Motivated student with strong ${context.profile.skills?.[0] || 'technical'} skills seeking opportunities to apply my knowledge and grow professionally.`;

    case 'experience':
      return `• Collaborated with team members on projects\n• Developed skills in problem-solving and communication\n• Contributed to successful completion of tasks`;

    case 'skills':
      return context.profile.skills?.slice(0, 8).join(', ') || 'Communication, Teamwork, Problem-solving';

    default:
      return 'Content will be generated here...';
  }
}

// ============================================================================
// Cover Letter Generation
// ============================================================================

/**
 * Generate a complete cover letter
 */
export async function generateCoverLetter(
  jobDetails: JobDetails,
  tone: Tone,
  context: GenerationContext
): Promise<CoverLetterContent> {
  const systemPrompt = `You are a career counselor helping young people (ages 12-18) write professional cover letters.
Use ${tone} tone while maintaining age-appropriate language (grades 8-12 reading level).
Be encouraging and help them present their best selves professionally.`;

  const profileContext = formatProfileContext(context.profile);

  const prompt = `Write a cover letter for this job application:

Job Title: ${jobDetails.title}
Company: ${jobDetails.company}
Job Description: ${jobDetails.description}

Applicant Profile:
${profileContext}

Tone: ${tone}

Write a complete cover letter with:
1. Opening paragraph expressing interest
2. 2-3 body paragraphs highlighting relevant skills and experiences
3. Closing paragraph with call to action

Format as JSON with keys: opening, body (array of paragraphs), closing`;

  try {
    const content = await callGroqAPI(prompt, systemPrompt);

    // Try to parse as JSON
    try {
      const parsed = JSON.parse(content);
      if (parsed.opening && parsed.body && parsed.closing) {
        return {
          opening: parsed.opening,
          body: Array.isArray(parsed.body) ? parsed.body : [parsed.body],
          closing: parsed.closing,
        };
      }
    } catch {
      // If not JSON, parse as plain text
      const paragraphs = content.split('\n\n').filter(p => p.trim());
      return {
        opening: paragraphs[0] || '',
        body: paragraphs.slice(1, -1),
        closing: paragraphs[paragraphs.length - 1] || '',
      };
    }

    return generateTemplateCoverLetter(jobDetails, tone, context);
  } catch (error) {
    console.error('AI generation failed, using template:', error);
    return generateTemplateCoverLetter(jobDetails, tone, context);
  }
}

/**
 * Template-based fallback for cover letters
 */
function generateTemplateCoverLetter(
  jobDetails: JobDetails,
  tone: Tone,
  context: GenerationContext
): CoverLetterContent {
  const name = context.profile.personal?.fullName || 'Your Name';

  const openings = {
    professional: `I am writing to express my strong interest in the ${jobDetails.title} position at ${jobDetails.company}.`,
    enthusiastic: `I am thrilled to apply for the ${jobDetails.title} position at ${jobDetails.company}!`,
    formal: `I am writing to formally apply for the ${jobDetails.title} position at ${jobDetails.company}.`,
  };

  const body = [
    `As a motivated student with experience in ${context.profile.skills?.[0] || 'various areas'}, I believe I would be a great fit for this role. My background includes ${context.profile.education?.[0]?.fieldOfStudy || 'relevant coursework'} and hands-on experience through ${context.profile.experience?.[0]?.role || 'various projects'}.`,
    `I am particularly drawn to ${jobDetails.company} because of your commitment to excellence and innovation. I am eager to contribute my skills and learn from your experienced team.`,
  ];

  const closings = {
    professional: `Thank you for considering my application. I look forward to the opportunity to discuss how I can contribute to ${jobDetails.company}.`,
    enthusiastic: `I would love the opportunity to discuss how my skills and enthusiasm can benefit ${jobDetails.company}. Thank you for your consideration!`,
    formal: `I appreciate your time and consideration. I look forward to the possibility of discussing this opportunity further.`,
  };

  return {
    opening: openings[tone],
    body,
    closing: closings[tone],
  };
}

// ============================================================================
// Form Response Generation
// ============================================================================

/**
 * Generate response to an application form question
 */
export async function generateFormResponse(
  question: string,
  context: GenerationContext
): Promise<string> {
  const systemPrompt = `You are a career counselor helping job applicants answer application form questions.
Write a specific, personalized answer to the EXACT question asked.
Use the applicant's profile to make the answer personal and relevant.
Keep the response to 2-4 sentences. Be direct and professional.
IMPORTANT: Every question needs a DIFFERENT, UNIQUE answer tailored to that specific question.`;

  const profileContext = formatProfileContext(context.profile);

  const prompt = `Answer this specific application question using the applicant's profile:

QUESTION: "${question}"

Applicant Profile:
${profileContext}

${context.jobDescription ? `Job Context: ${context.jobDescription}` : ''}

Write a direct, specific answer to THIS question only. Do not give a generic response.`;

  try {
    const response = await callGroqAPI(prompt, systemPrompt);
    return response;
  } catch (error) {
    console.error('AI generation failed, using template:', error);
    return generateTemplateFormResponse(question, context);
  }
}

/**
 * Template-based fallback for form responses — unique answer per question type
 */
function generateTemplateFormResponse(question: string, context: GenerationContext): string {
  const lowerQuestion = question.toLowerCase();
  const field = context.profile.education?.[0]?.fieldOfStudy || 'my field';
  const skills = context.profile.skills?.slice(0, 3).join(', ') || 'problem-solving, communication, and teamwork';
  const role = context.profile.experience?.[0]?.role || 'previous projects';
  const org = context.profile.experience?.[0]?.organizationName || 'my organization';

  if (lowerQuestion.includes('why') && (lowerQuestion.includes('position') || lowerQuestion.includes('role') || lowerQuestion.includes('job'))) {
    return `I am interested in this position because it aligns perfectly with my background in ${field} and my passion for making a real impact. This role offers the opportunity to apply my skills in ${skills} in a meaningful way.`;
  }

  if (lowerQuestion.includes('why') && lowerQuestion.includes('compan')) {
    return `I admire this company's reputation and commitment to excellence in the industry. I believe my background in ${field} would allow me to contribute meaningfully to your team's goals.`;
  }

  if (lowerQuestion.includes('strength')) {
    return `My greatest strengths are ${skills}. I demonstrated these during my time as ${role} at ${org}, where I consistently delivered results under pressure.`;
  }

  if (lowerQuestion.includes('weakness')) {
    return `I sometimes take on too much at once because I'm eager to contribute. I've been working on this by prioritizing tasks and communicating proactively with my team when workloads are heavy.`;
  }

  if (lowerQuestion.includes('tell') && lowerQuestion.includes('yourself')) {
    return `I am a dedicated ${field} student/professional with hands-on experience as ${role}. I am passionate about continuous learning and bringing practical solutions to real-world challenges.`;
  }

  if (lowerQuestion.includes('experience')) {
    return `I have gained valuable experience through my role as ${role} at ${org}, where I developed skills in ${skills}. This experience taught me how to work effectively in a professional environment.`;
  }

  if (lowerQuestion.includes('5 year') || lowerQuestion.includes('five year') || lowerQuestion.includes('future') || lowerQuestion.includes('goal')) {
    return `In five years, I see myself as a skilled professional in ${field}, having grown through hands-on experience and continuous learning. I aim to take on increasing responsibility and contribute to meaningful projects in this field.`;
  }

  if (lowerQuestion.includes('challenge') || lowerQuestion.includes('difficult') || lowerQuestion.includes('overcome')) {
    return `One challenge I overcame was managing multiple deadlines during my time as ${role}. I created a structured schedule, communicated clearly with my team, and successfully delivered all tasks on time.`;
  }

  if (lowerQuestion.includes('hire') || lowerQuestion.includes('fit') || lowerQuestion.includes('suited')) {
    return `You should hire me because I bring a strong foundation in ${field}, practical experience from ${role}, and a genuine commitment to contributing to your team's success. I am a fast learner who takes initiative.`;
  }

  if (lowerQuestion.includes('salary') || lowerQuestion.includes('pay') || lowerQuestion.includes('compensation')) {
    return `I am open to a competitive salary that reflects the responsibilities of the role and industry standards. I am more focused on finding the right opportunity to grow and contribute than on a specific number.`;
  }

  if (lowerQuestion.includes('team') || lowerQuestion.includes('independent') || lowerQuestion.includes('alone')) {
    return `I enjoy both working independently and collaborating in a team. During my time as ${role}, I worked on solo projects that required self-discipline as well as team projects that required clear communication and coordination.`;
  }

  if (lowerQuestion.includes('stress') || lowerQuestion.includes('pressure')) {
    return `I handle stress by breaking large tasks into smaller steps and focusing on what I can control. During busy periods as ${role}, I used this approach to stay calm and productive even under tight deadlines.`;
  }

  if (lowerQuestion.includes('achievement') || lowerQuestion.includes('proud') || lowerQuestion.includes('accomplish')) {
    return `My greatest achievement was ${context.profile.achievements?.[0] || `successfully completing my role as ${role} and delivering measurable results for my team`}. This experience showed me what I am capable of when I stay focused and committed.`;
  }

  // Generic fallback — at least make it specific to the question
  return `Regarding "${question.slice(0, 60)}..." — based on my background in ${field} and experience as ${role}, I am well-prepared to address this aspect of the role. I look forward to discussing this further in an interview.`;
}

// ============================================================================
// Job Description Analysis
// ============================================================================

/**
 * Analyze a job description and provide recommendations
 */
export async function analyzeJobDescription(
  jobDescription: string,
  profile: ProfileData
): Promise<JobAnalysis> {
  const systemPrompt = `You are a career counselor helping young people (ages 12-18) understand job requirements.
Analyze job descriptions and provide clear, actionable recommendations.`;

  const profileContext = formatProfileContext(profile);

  const prompt = `Analyze this job description and compare it to the applicant's profile:

Job Description:
${jobDescription}

Applicant Profile:
${profileContext}

Provide analysis as JSON with:
- keyRequirements: array of main job requirements
- requiredSkills: array of skills mentioned in job description
- matchingSkills: array of applicant's skills that match
- missingSkills: array of required skills the applicant doesn't have
- recommendations: array of objects with {type, content, reason, priority}`;

  try {
    const response = await callGroqAPI(prompt, systemPrompt);

    // Try to parse as JSON
    try {
      const parsed = JSON.parse(response);
      return {
        keyRequirements: parsed.keyRequirements || [],
        requiredSkills: parsed.requiredSkills || [],
        matchingSkills: parsed.matchingSkills || [],
        missingSkills: parsed.missingSkills || [],
        recommendations: parsed.recommendations || [],
      };
    } catch {
      // Fallback to template analysis
      return generateTemplateJobAnalysis(jobDescription, profile);
    }
  } catch (error) {
    console.error('AI analysis failed, using template:', error);
    return generateTemplateJobAnalysis(jobDescription, profile);
  }
}

/**
 * Template-based fallback for job analysis
 */
function generateTemplateJobAnalysis(
  jobDescription: string,
  profile: ProfileData
): JobAnalysis {
  // Simple keyword matching
  const commonSkills = [
    'communication',
    'teamwork',
    'problem-solving',
    'leadership',
    'organization',
    'time management',
  ];

  const jobLower = jobDescription.toLowerCase();
  const requiredSkills = commonSkills.filter(skill => jobLower.includes(skill));

  const profileSkills = profile.skills?.map(s => s.toLowerCase()) || [];
  const matchingSkills = requiredSkills.filter(skill =>
    profileSkills.some(ps => ps.includes(skill) || skill.includes(ps))
  );

  const missingSkills = requiredSkills.filter(skill => !matchingSkills.includes(skill));

  const recommendations: Recommendation[] = [];

  if (matchingSkills.length > 0) {
    recommendations.push({
      type: 'skill',
      content: `Highlight your ${matchingSkills[0]} skills`,
      reason: 'This skill is mentioned in the job description and matches your profile',
      priority: 'high',
    });
  }

  if (profile.experience && profile.experience.length > 0) {
    recommendations.push({
      type: 'experience',
      content: `Emphasize your experience as ${profile.experience[0].role}`,
      reason: 'Relevant work experience strengthens your application',
      priority: 'high',
    });
  }

  return {
    keyRequirements: requiredSkills,
    requiredSkills,
    matchingSkills,
    missingSkills,
    recommendations,
  };
}

// ============================================================================
// Content Improvement Suggestions
// ============================================================================

/**
 * Suggest improvements for resume or cover letter content
 */
export async function suggestImprovements(
  content: string,
  type: 'resume' | 'coverLetter'
): Promise<Improvement[]> {
  const improvements: Improvement[] = [];

  // Basic checks (can be enhanced with AI)

  // Check for weak language
  const weakWords = ['very', 'really', 'just', 'maybe', 'probably', 'somewhat'];
  weakWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = content.match(regex);
    if (matches) {
      improvements.push({
        type: 'weak-language',
        location: { section: 'content', position: 0 },
        message: `Avoid weak words like "${word}"`,
        suggestion: `Remove or replace "${word}" with stronger, more confident language`,
      });
    }
  });

  // Check for passive voice indicators
  const passiveIndicators = ['was', 'were', 'been', 'being'];
  passiveIndicators.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = content.match(regex);
    if (matches && matches.length > 3) {
      improvements.push({
        type: 'weak-language',
        location: { section: 'content', position: 0 },
        message: 'Consider using more active voice',
        suggestion: 'Replace passive constructions with active verbs (e.g., "I led" instead of "I was leading")',
      });
    }
  });

  // Check length
  if (type === 'coverLetter' && content.length > 2000) {
    improvements.push({
      type: 'missing-info',
      location: { section: 'content', position: 0 },
      message: 'Cover letter is too long',
      suggestion: 'Keep cover letters under 400 words for better readability',
    });
  }

  return improvements;
}

// ============================================================================
// Export default
// ============================================================================

export default {
  generateResumeSection,
  generateCoverLetter,
  generateFormResponse,
  analyzeJobDescription,
  suggestImprovements,
};












