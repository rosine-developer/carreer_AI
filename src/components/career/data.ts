import { Message, JobCard, OnboardingData, PreferenceTag, OpportunitySource } from "./types";
import { generateAIResponse as generateLocalAI, initializeAI } from "../../lib/ai-service";
import { searchJobs, extractJobQuery, type RealJob } from "../../lib/job-search";

// Initialize AI on module load
initializeAI().catch(console.error);

export const INITIAL_MESSAGE: Message = {
  id: "welcome",
  role: "ai",
  content:
    "Welcome to CareerMind AI, your intelligent career coach. I'm here to help you discover your ideal career path, find real opportunities, and craft compelling applications.\n\nLet's start by learning about your background. Please fill in the form below:",
  timestamp: new Date(),
  isOnboarding: true,
};

export const CAREER_RESPONSES: Record<string, string> = {
  default:
    "I've analyzed your background and preferences. Based on your profile, I'm identifying the most relevant career opportunities that align with your skills and interests.",
  software:
    "Your background in software/technology opens up exciting opportunities in engineering, product development, and data science. The tech sector is actively hiring — let me surface some strong matches for you.",
  business:
    "Business and management skills are highly versatile. I'm seeing strong demand for roles in strategy, operations, and product management that would suit your profile well.",
  design:
    "Design thinking combined with technical skills is a rare and powerful combination. I'm finding several UX, product design, and creative director positions that match your interests.",
  science:
    "Research-oriented backgrounds translate well into data science, biotech, and academic industry roles. Let me pull up some positions where your analytical skills shine.",
};

export const SAMPLE_JOB_CARDS: JobCard[] = [
  {
    id: "job-1",
    title: "Senior Product Manager",
    company: "Stripe",
    location: "San Francisco, CA",
    salary: "$165K – $210K",
    matchScore: 94,
    remote: true,
    type: "Full-time",
    description:
      "Lead product strategy for Stripe's developer platform. Work cross-functionally with engineering, design, and go-to-market teams.",
    tags: ["Product Strategy", "API", "FinTech", "Remote"],
  },
  {
    id: "job-2",
    title: "UX Research Lead",
    company: "Figma",
    location: "New York, NY",
    salary: "$140K – $180K",
    matchScore: 88,
    remote: true,
    type: "Full-time",
    description:
      "Own the research function for Figma's core product. Drive mixed-methods research to shape product direction.",
    tags: ["UX Research", "Design", "Remote", "Creative"],
  },
  {
    id: "job-3",
    title: "Data Scientist",
    company: "Anthropic",
    location: "Remote",
    salary: "$180K – $240K",
    matchScore: 82,
    remote: true,
    type: "Full-time",
    description:
      "Apply statistical modeling and ML techniques to advance AI safety research at Anthropic.",
    tags: ["Machine Learning", "Python", "AI Safety", "Research"],
  },
  {
    id: "job-4",
    title: "Engineering Manager",
    company: "Linear",
    location: "Remote",
    salary: "$200K – $260K",
    matchScore: 79,
    remote: true,
    type: "Full-time",
    description:
      "Lead a high-performing engineering team building Linear's next-generation project management tools.",
    tags: ["Engineering", "Leadership", "Remote", "B2B SaaS"],
  },
];

// Job database organized by field/industry
const JOB_DATABASE: Record<string, JobCard[]> = {
  accounting: [
    { id: "acc-1", title: "Junior Accountant", company: "Deloitte", location: "New York, NY", salary: "$55K – $75K", matchScore: 95, remote: false, type: "Full-time", description: "Assist with financial reporting, reconciliations, and month-end close processes for Fortune 500 clients.", tags: ["Accounting", "Excel", "Financial Reporting", "Entry Level"] },
    { id: "acc-2", title: "Accounts Payable Specialist", company: "PwC", location: "Chicago, IL", salary: "$45K – $60K", matchScore: 92, remote: true, type: "Full-time", description: "Process vendor invoices, manage payment schedules, and maintain accurate financial records.", tags: ["Accounts Payable", "QuickBooks", "Remote", "Finance"] },
    { id: "acc-3", title: "Bookkeeper", company: "KPMG", location: "Remote", salary: "$40K – $55K", matchScore: 90, remote: true, type: "Full-time", description: "Maintain accurate books, prepare financial statements, and support audit processes.", tags: ["Bookkeeping", "Accounting", "Remote", "Entry Level"] },
    { id: "acc-4", title: "Tax Associate", company: "Ernst & Young", location: "Dallas, TX", salary: "$60K – $80K", matchScore: 87, remote: false, type: "Full-time", description: "Prepare individual and corporate tax returns, research tax issues, and support senior tax professionals.", tags: ["Tax", "CPA", "Finance", "Accounting"] },
    { id: "acc-5", title: "Accounting Intern", company: "Grant Thornton", location: "Remote", salary: "$18 – $25/hr", matchScore: 98, remote: true, type: "Internship", description: "Support accounting team with data entry, reconciliations, and financial analysis projects.", tags: ["Internship", "Accounting", "Remote", "Entry Level"] },
    { id: "acc-6", title: "Financial Analyst", company: "JPMorgan Chase", location: "New York, NY", salary: "$70K – $95K", matchScore: 85, remote: false, type: "Full-time", description: "Analyze financial data, prepare reports, and support budgeting and forecasting processes.", tags: ["Financial Analysis", "Excel", "Finance", "Accounting"] },
  ],
  finance: [
    { id: "fin-1", title: "Financial Analyst", company: "Goldman Sachs", location: "New York, NY", salary: "$80K – $110K", matchScore: 94, remote: false, type: "Full-time", description: "Analyze investment opportunities, build financial models, and support deal execution.", tags: ["Finance", "Excel", "Modeling", "Investment"] },
    { id: "fin-2", title: "Investment Banking Analyst", company: "Morgan Stanley", location: "New York, NY", salary: "$100K – $130K", matchScore: 88, remote: false, type: "Full-time", description: "Support M&A transactions, IPOs, and capital markets activities for corporate clients.", tags: ["Investment Banking", "M&A", "Finance", "Analyst"] },
    { id: "fin-3", title: "Finance Intern", company: "BlackRock", location: "Remote", salary: "$20 – $30/hr", matchScore: 96, remote: true, type: "Internship", description: "Assist with portfolio analysis, financial modeling, and investment research projects.", tags: ["Internship", "Finance", "Remote", "Entry Level"] },
  ],
  technology: [
    { id: "tech-1", title: "Junior Software Developer", company: "Google", location: "Remote", salary: "$90K – $120K", matchScore: 93, remote: true, type: "Full-time", description: "Build and maintain web applications using modern frameworks and best practices.", tags: ["Software", "JavaScript", "Remote", "Entry Level"] },
    { id: "tech-2", title: "IT Support Specialist", company: "Microsoft", location: "Seattle, WA", salary: "$55K – $75K", matchScore: 89, remote: false, type: "Full-time", description: "Provide technical support, troubleshoot issues, and maintain IT infrastructure.", tags: ["IT Support", "Technical", "Microsoft", "Entry Level"] },
    { id: "tech-3", title: "Software Engineering Intern", company: "Meta", location: "Remote", salary: "$45 – $60/hr", matchScore: 97, remote: true, type: "Internship", description: "Work on real products used by billions of people. Build features, fix bugs, and learn from senior engineers.", tags: ["Internship", "Software", "Remote", "Engineering"] },
  ],
  marketing: [
    { id: "mkt-1", title: "Marketing Coordinator", company: "HubSpot", location: "Remote", salary: "$45K – $60K", matchScore: 92, remote: true, type: "Full-time", description: "Support marketing campaigns, manage social media, and analyze campaign performance.", tags: ["Marketing", "Social Media", "Remote", "Entry Level"] },
    { id: "mkt-2", title: "Digital Marketing Intern", company: "Shopify", location: "Remote", salary: "$18 – $22/hr", matchScore: 96, remote: true, type: "Internship", description: "Assist with SEO, content creation, email campaigns, and digital advertising.", tags: ["Internship", "Digital Marketing", "Remote", "Entry Level"] },
  ],
  healthcare: [
    { id: "hlt-1", title: "Medical Billing Specialist", company: "UnitedHealth Group", location: "Remote", salary: "$40K – $55K", matchScore: 91, remote: true, type: "Full-time", description: "Process medical claims, verify insurance, and ensure accurate billing for healthcare services.", tags: ["Medical Billing", "Healthcare", "Remote", "Entry Level"] },
    { id: "hlt-2", title: "Healthcare Administrator Intern", company: "Mayo Clinic", location: "Rochester, MN", salary: "$16 – $20/hr", matchScore: 94, remote: false, type: "Internship", description: "Support hospital operations, patient scheduling, and administrative processes.", tags: ["Internship", "Healthcare", "Administration", "Entry Level"] },
  ],
  education: [
    { id: "edu-1", title: "Teaching Assistant", company: "Coursera", location: "Remote", salary: "$35K – $50K", matchScore: 90, remote: true, type: "Full-time", description: "Support online learners, grade assignments, and facilitate discussion forums.", tags: ["Education", "Remote", "Teaching", "Entry Level"] },
    { id: "edu-2", title: "Curriculum Developer Intern", company: "Khan Academy", location: "Remote", salary: "$18 – $24/hr", matchScore: 95, remote: true, type: "Internship", description: "Help create educational content, lesson plans, and assessments for K-12 students.", tags: ["Internship", "Education", "Remote", "Curriculum"] },
  ],
  business: [
    { id: "biz-1", title: "Business Analyst", company: "McKinsey", location: "New York, NY", salary: "$75K – $100K", matchScore: 93, remote: false, type: "Full-time", description: "Analyze business processes, identify improvements, and support strategic decision-making.", tags: ["Business Analysis", "Strategy", "Consulting", "Entry Level"] },
    { id: "biz-2", title: "Operations Coordinator", company: "Amazon", location: "Remote", salary: "$50K – $70K", matchScore: 89, remote: true, type: "Full-time", description: "Coordinate business operations, manage workflows, and support process improvement initiatives.", tags: ["Operations", "Business", "Remote", "Coordinator"] },
    { id: "biz-3", title: "Business Development Intern", company: "Salesforce", location: "Remote", salary: "$20 – $28/hr", matchScore: 96, remote: true, type: "Internship", description: "Support sales and business development activities, research prospects, and assist with client outreach.", tags: ["Internship", "Business Development", "Remote", "Sales"] },
  ],
};

/**
 * Generate job cards based on user's field/interests
 */
function generateJobCards(userMessage: string, conversationContext: string, onboardingData?: OnboardingData | null): JobCard[] {
  const lower = (userMessage + " " + conversationContext).toLowerCase();

  // Detect field from message and conversation history
  if (lower.includes("account") || lower.includes("bookkeep") || lower.includes("cpa") || lower.includes("audit")) {
    return JOB_DATABASE.accounting;
  }
  if (lower.includes("financ") || lower.includes("investment") || lower.includes("banking") || lower.includes("stock")) {
    return JOB_DATABASE.finance;
  }
  if (lower.includes("software") || lower.includes("coding") || lower.includes("programming") || lower.includes("developer") || lower.includes("tech") || lower.includes("computer science")) {
    return JOB_DATABASE.technology;
  }
  if (lower.includes("market") || lower.includes("advertis") || lower.includes("brand") || lower.includes("social media")) {
    return JOB_DATABASE.marketing;
  }
  if (lower.includes("health") || lower.includes("medical") || lower.includes("nurs") || lower.includes("hospital") || lower.includes("clinic")) {
    return JOB_DATABASE.healthcare;
  }
  if (lower.includes("teach") || lower.includes("educat") || lower.includes("school") || lower.includes("tutor")) {
    return JOB_DATABASE.education;
  }
  if (lower.includes("business") || lower.includes("management") || lower.includes("mba") || lower.includes("operations")) {
    return JOB_DATABASE.business;
  }

  // Use onboarding data if available
  if (onboardingData) {
    const field = onboardingData.fieldOfStudy.toLowerCase();
    if (field.includes("account")) return JOB_DATABASE.accounting;
    if (field.includes("financ")) return JOB_DATABASE.finance;
    if (field.includes("computer") || field.includes("software") || field.includes("tech")) return JOB_DATABASE.technology;
    if (field.includes("market")) return JOB_DATABASE.marketing;
    if (field.includes("health") || field.includes("medical")) return JOB_DATABASE.healthcare;
    if (field.includes("educat")) return JOB_DATABASE.education;
    if (field.includes("business") || field.includes("management")) return JOB_DATABASE.business;
  }

  // Default fallback
  return SAMPLE_JOB_CARDS;
}

export const OPPORTUNITY_SOURCES: OpportunitySource[] = [
  {
    platform: "LinkedIn",
    logo: "LI",
    url: "https://linkedin.com/jobs",
    jobCount: 4823,
    bookmarked: false,
  },
  {
    platform: "Indeed",
    logo: "IN",
    url: "https://indeed.com",
    jobCount: 2156,
    bookmarked: false,
  },
  {
    platform: "Wellfound",
    logo: "WF",
    url: "https://wellfound.com/jobs",
    jobCount: 892,
    bookmarked: false,
  },
  {
    platform: "Greenhouse",
    logo: "GH",
    url: "https://greenhouse.io",
    jobCount: 347,
    bookmarked: false,
  },
  {
    platform: "Lever",
    logo: "LV",
    url: "https://jobs.lever.co",
    jobCount: 221,
    bookmarked: false,
  },
];

export const DEFAULT_PREFERENCE_TAGS: PreferenceTag[] = [
  { id: "t1", label: "Remote Work", weight: 2, category: "positive" },
  { id: "t2", label: "Leadership", weight: 1, category: "positive" },
  { id: "t3", label: "Creative", weight: 1, category: "positive" },
  { id: "t4", label: "High Growth", weight: 2, category: "positive" },
  { id: "t5", label: "Work-Life Balance", weight: 1, category: "positive" },
];

// This function now calls a real AI API to generate dynamic responses
export async function generateAIResponse(
  userMessage: string,
  conversationHistory: Message[],
  onboardingData?: OnboardingData | null,
  tags?: PreferenceTag[]
): Promise<{ content: string; jobCards?: JobCard[] }> {
  const lower = userMessage.toLowerCase();

  // Check if user is asking for jobs — NOT for advice/tips/help
  const isAskingForAdvice =
    lower.includes("advice") ||
    lower.includes("tip") ||
    lower.includes("how to") ||
    lower.includes("what should") ||
    lower.includes("help me") ||
    lower.includes("guide") ||
    lower.includes("suggest") ||
    lower.includes("prepare") ||
    lower.includes("improve") ||
    lower.includes("what is") ||
    lower.includes("explain") ||
    lower.includes("tell me");

  const isAskingForJobs = (text: string) => {
    const t = text.toLowerCase();
    return t.includes("job") || t.includes("opport") || t.includes("role") || t.includes("position") ||
      t.includes("show me") || t.includes("find") || t.includes("search") || t.includes("work") ||
      t.includes("hire") || t.includes("employ") || t.includes("intern") || t.includes("vacancy") ||
      t.includes("opening");
  };

  const lastUserMsg = conversationHistory.filter(m => m.role === 'user').pop();
  const previousMessageText = lastUserMsg ? lastUserMsg.content : '';

  const isProfileSubmission = lower.includes("i have a") && lower.includes("in") && lower.includes("my top interests are:");

  const includeJobs =
    (!isAskingForAdvice && isAskingForJobs(userMessage)) ||
    (isProfileSubmission && !isAskingForAdvice && isAskingForJobs(previousMessageText));

  // Don't show jobs if user hasn't provided profile info yet
  const profileKeywords = ['electrician', 'accountant', 'engineer', 'nurse', 'teacher', 
    'student', 'degree', 'field', 'major', 'studied', 'i study', 'i am a', "i'm a", 
    'i have a', 'pharmacy', 'medical', 'software', 'marketing', 'business', 'finance',
    'law', 'design', 'architect', 'chef', 'mechanic', 'plumber', 'welder', 'doctor',
    'dentist', 'psycholog', 'social work', 'journalism', 'computer science', 'biology',
    'chemistry', 'physics', 'math', 'economics', 'management', 'hr', 'logistics'];

  const allMessages = [...conversationHistory, { role: 'user', content: userMessage }];
  
  const hasProfile = (onboardingData !== null && onboardingData !== undefined) ||
    allMessages.some(m => m.role === 'user' && 
      profileKeywords.some(kw => m.content.toLowerCase().includes(kw))
    );

  const shouldShowJobs = includeJobs && hasProfile && !isAskingForAdvice;

  try {
    const conversationContext = conversationHistory
      .slice(-10)
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n');

    let jobCards: JobCard[] | undefined = undefined;
    
    // Fetch jobs first if needed (sequential to avoid Groq rate limits)
    if (shouldShowJobs) {
      jobCards = await fetchRealJobs(userMessage, conversationContext, onboardingData);
    }

    const actuallyShowingJobs = jobCards !== undefined && jobCards.length > 0;
    const systemPrompt = buildSystemPrompt(onboardingData, tags, actuallyShowingJobs);

    // Then get AI response
    const response = await callAIAPI(systemPrompt, conversationContext, userMessage);
    
    return { content: response, jobCards };
  } catch (error) {
    console.error('AI API Error:', error);
    return {
      content: "I'm having trouble connecting right now, but I'm here to help with your career journey. Could you tell me more about what you're looking for?",
    };
  }
}

/** Fetch real jobs from the internet and convert to JobCard format */
async function fetchRealJobs(
  userMessage: string,
  conversationContext: string,
  onboardingData?: OnboardingData | null
): Promise<JobCard[] | undefined> {
  try {
    const fullContext = conversationContext + (onboardingData
      ? ` ${onboardingData.fieldOfStudy} ${onboardingData.interests.join(' ')}`
      : '');

    const { query, isInternship } = extractJobQuery(userMessage, fullContext);
    if (!query) return undefined;

    const realJobs = await searchJobs(query, {
      internship: isInternship,
      context: fullContext,
    });
    
    if (realJobs.length === 0) return undefined;

    return realJobs.map((job): JobCard => ({
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      salary: job.salary,
      matchScore: job.matchScore,
      remote: job.remote,
      type: job.type,
      description: job.description,
      tags: job.tags,
      applyUrl: job.applyUrl,
    }));
  } catch (err) {
    console.error('Job search failed:', err);
    return undefined;
  }
}

function buildSystemPrompt(onboardingData?: OnboardingData | null, tags?: PreferenceTag[], shouldShowJobs: boolean = false): string {
  const hasProfile = onboardingData !== null && onboardingData !== undefined;

  let prompt = `You are CareerMind AI, a friendly career coach built into a job search app.

CRITICAL RULES:
- Keep ALL responses to 1-3 short sentences maximum
${shouldShowJobs ? `
- THE APP IS CURRENTLY DISPLAYING REAL JOB CARDS BELOW YOUR MESSAGE.
- NEVER list job titles, companies, or job openings in your text.
- NEVER write "Apply Now" links in text.
- Since jobs are being shown, just say something like: "Here are some matches for you. Click Apply Now on any card to apply directly."
` : `
- THE APP IS NOT DISPLAYING ANY JOB CARDS.
- DO NOT say "Here are some matches for you" or pretend to show jobs.
- NEVER say you cannot provide links.
`}
- NEVER use emojis, bullet points, or numbered lists of jobs
- If the user asks for career advice, tips, or guidance — give them actual advice in text.
${!hasProfile ? `- IMPORTANT: The user has NOT completed their profile yet. If they ask for jobs, advice, or guidance, respond ONLY with: "To give you the best advice and find the right jobs, I need to know your background first. Please fill in the profile form above." Do not give any advice or pretend to show jobs until they complete the profile.` : `- User has completed their profile: ${onboardingData!.degree} in ${onboardingData!.fieldOfStudy}. Interests: ${onboardingData!.interests.join(', ')}.
- When they ask for career advice, first ask: "What kind of advice are you looking for? For example: interview tips, resume help, salary negotiation, career growth, or something else?"
- Then give specific advice based on their field and what they asked for.`}

Always be brief.`;

  return prompt;
}

async function callAIAPI(systemPrompt: string, conversationContext: string, userMessage: string): Promise<string> {
  const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
  
  if (GROQ_API_KEY) {
    try {
      // Build messages array with full conversation history
      const messages: { role: string; content: string }[] = [
        { role: 'system', content: systemPrompt },
      ];

      // Add conversation history so AI remembers context
      if (conversationContext) {
        const lines = conversationContext.split('\n').filter(Boolean);
        for (const line of lines) {
          if (line.startsWith('User: ')) {
            messages.push({ role: 'user', content: line.replace('User: ', '') });
          } else if (line.startsWith('Assistant: ')) {
            messages.push({ role: 'assistant', content: line.replace('Assistant: ', '') });
          }
        }
      }

      // Add current message
      messages.push({ role: 'user', content: userMessage });

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages,
          temperature: 0.7,
          max_tokens: 400,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.choices[0].message.content;
      } else {
        const error = await response.json();
        console.error('❌ Groq API error:', error);
      }
    } catch (error) {
      console.error('❌ Groq API failed:', error);
    }
  }

  // Fallback to rule-based system
  return generateIntelligentResponse(userMessage, conversationContext, systemPrompt);
}

// Advanced response generator that mimics AI behavior
function generateIntelligentResponse(userMessage: string, conversationContext: string, systemPrompt: string): string {
  const lower = userMessage.toLowerCase().trim();
  
  // Check if user has completed onboarding (has profile info)
  const hasProfile = conversationContext.includes('Degree:') || conversationContext.includes('interests');
  const hasCompletedOnboarding = conversationContext.includes('I have a') && conversationContext.includes('in');
  
  // Greetings - respond naturally!
  if (lower === 'hi' || lower === 'hello' || lower === 'hey' || lower === 'hi there' || lower === 'hello there') {
    const greetings = [
      "Hi there! I'm CareerMind AI, your career coach. I'm here to help you find great job opportunities and guide your career journey. What brings you here today?",
      "Hello! Great to meet you! I can help you explore career paths, find job opportunities, and prepare applications. What would you like to work on?",
      "Hey! Welcome! I'm here to help with your career goals - whether that's finding the perfect job, getting career advice, or crafting applications. What can I help you with?",
      "Hi! Nice to chat with you! I specialize in career guidance and job matching. Tell me, what are you looking for in your career right now?",
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }
  
  // How are you / casual conversation
  if (lower.includes('how are you') || lower.includes('how r u') || lower === 'how are you?' || lower === 'hows it going' || lower === 'whats up') {
    const responses = [
      "I'm doing great, thanks for asking! I'm excited to help you with your career journey. What can I do for you today?",
      "I'm wonderful! Ready to help you find amazing career opportunities. What brings you here?",
      "I'm doing well! More importantly, how can I help YOU today? Looking for jobs, career advice, or something else?",
      "I'm great, thank you! I'm here and ready to help with your career goals. What would you like to explore?",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  // Simple acknowledgments
  if (lower === 'ok' || lower === 'okay' || lower === 'sure' || lower === 'yes' || lower === 'yeah' || lower === 'yep') {
    const responses = [
      "Great! So what would you like to explore? I can help you find jobs, give career advice, or discuss different career paths.",
      "Awesome! What aspect of your career would you like to focus on today?",
      "Perfect! Tell me what you're interested in - job searching, career planning, or something else?",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  // Thanks
  if (lower.includes('thank') || lower.includes('thanks')) {
    return "You're welcome! I'm here anytime you need career guidance or job search help. Is there anything else you'd like to know?";
  }
  
  // Goodbye
  if (lower === 'bye' || lower === 'goodbye' || lower === 'see you' || lower === 'later') {
    return "Goodbye! Feel free to come back anytime you need career advice or want to explore job opportunities. Good luck with your career journey! 👋";
  }
  
  // JOB REQUESTS - Ask for profile info first if they don't have it!
  if (lower.includes('job') || lower.includes('work') || lower.includes('position') || lower.includes('role') || lower.includes('career') || lower.includes('opportunity') || lower.includes('employ') || lower.includes('hire')) {
    if (!hasCompletedOnboarding) {
      return "I'd love to help you find the perfect job! But first, I need to learn about you so I can match you with the right opportunities.\n\nCould you tell me:\n1. **What's your education level?** (High School, Bachelor's, Master's, etc.)\n2. **What field did you study?** (Accounting, Business, Engineering, etc.)\n3. **What are your interests?** (Finance, Technology, Healthcare, etc.)\n\nThis will help me find jobs that are perfect for YOU!";
    } else {
      return `Perfect! Based on your profile, I'm finding job opportunities that match your background and interests. Let me show you some positions that would be a great fit for you!`;
    }
  }
  
  // Question detection
  if (lower.includes('?') || lower.startsWith('what') || lower.startsWith('how') || lower.startsWith('why') || lower.startsWith('can you') || lower.startsWith('could you') || lower.startsWith('would you')) {
    if (lower.includes('salary') || lower.includes('pay') || lower.includes('earn') || lower.includes('money')) {
      if (!hasCompletedOnboarding) {
        return "I can help you understand salary expectations! But first, tell me about your education and field of study so I can give you accurate salary information for your level.";
      }
      return `Salary is definitely an important consideration! Given your education and interests, compensation varies based on industry, location, and experience. I can show you roles with transparent salary ranges. Are you looking for positions in a specific salary bracket?`;
    }
    if (lower.includes('help') || lower.includes('start') || lower.includes('do')) {
      return `I'm here to help you navigate your career journey! I can assist with finding job opportunities that match your profile, providing career advice, helping you understand different industries, or crafting strong applications. ${!hasCompletedOnboarding ? 'First, let me learn about your background so I can give you personalized help!' : 'What would be most helpful for you right now?'}`;
    }
    if (lower.includes('who are you') || lower.includes('what are you')) {
      return "I'm CareerMind AI, your intelligent career coach! I help people like you discover career paths, find job opportunities, and prepare strong applications. I learn about your interests and preferences to match you with the best opportunities. How can I help you today?";
    }
    return `That's a thoughtful question! ${hasProfile ? 'Considering your background, ' : ''}The best approach depends on your specific goals. Could you tell me a bit more about what you're hoping to achieve? That way I can give you more tailored guidance.`;
  }
  
  // Statement responses - show understanding and ask follow-up
  if (lower.includes('want') || lower.includes('need') || lower.includes('looking for') || lower.includes('find')) {
    if (lower.includes('remote') || lower.includes('work from home') || lower.includes('wfh')) {
      if (!hasCompletedOnboarding) {
        return "Remote work is a great choice! Before I show you remote opportunities, tell me about your education and interests so I can find remote jobs that match YOUR skills!";
      }
      return `Remote work is a great choice! The flexibility it offers can really improve work-life balance. I can filter opportunities to match your background with remote-friendly positions across various industries. Are you interested in fully remote roles, or would hybrid options work too?`;
    }
    if (lower.includes('help')) {
      return `I'm here to help! I can assist with job searching, career advice, understanding different industries, or preparing applications. ${!hasCompletedOnboarding ? 'First, tell me about your education and interests so I can give you personalized guidance!' : 'What specific area would you like to focus on?'}`;
    }
    return `I hear you! ${hasProfile ? 'Given what I know about your background, ' : ''}I can definitely help with that. ${!hasCompletedOnboarding ? 'But first, tell me about your education level, field of study, and interests so I can help you better!' : 'Tell me more about what\'s most important to you - is it the type of work, the company culture, growth opportunities, or something else?'}`;
  }
  
  // Preferences and interests
  if (lower.includes('like') || lower.includes('enjoy') || lower.includes('interested') || lower.includes('love') || lower.includes('passion')) {
    return `That's great to know! Understanding what you enjoy is key to finding the right career fit. ${hasProfile ? 'This adds another dimension to your profile. ' : ''}The more I learn about your interests and preferences, the better I can match you with opportunities where you'll thrive. ${!hasCompletedOnboarding ? 'Tell me more about your education and field of study too!' : 'Would you like to see some roles that align with these interests?'}`;
  }
  
  // Negative preferences
  if (lower.includes('don\'t') || lower.includes('hate') || lower.includes('dislike') || lower.includes('avoid') || lower.includes('not interested')) {
    return `Thanks for sharing that - knowing what you want to avoid is just as important as knowing what you want! I'll keep that in mind when recommending opportunities. ${hasProfile ? 'This helps me filter out roles that wouldn\'t be a good fit. ' : ''}Is there anything else you'd like me to know about your preferences?`;
  }
  
  // Skills and experience
  if (lower.includes('skill') || lower.includes('experience') || lower.includes('good at') || lower.includes('know how') || lower.includes('expert')) {
    return `Your skills and experience are valuable assets! ${hasProfile ? 'Combined with your educational background, ' : ''}This gives you a strong foundation for various career paths. I can help you find roles where these skills are in high demand. Would you like to explore opportunities that leverage what you already know, or are you interested in roles that would help you develop new skills?`;
  }
  
  // Very short responses (1-2 words) - be more conversational
  if (userMessage.split(' ').length <= 2 && userMessage.length < 15) {
    const shortResponses = [
      `I'm here to help with your career! What would you like to know about - finding jobs, career advice, or preparing applications?`,
      `Tell me more! What are you interested in exploring? I can help with job searching, career planning, or answering questions about different career paths.`,
      `I'd love to help you! Are you looking for job opportunities, career guidance, or something specific about your career journey?`,
      `Let's chat about your career goals! What brings you here today - job hunting, career advice, or just exploring options?`,
    ];
    return shortResponses[Math.floor(Math.random() * shortResponses.length)];
  }
  
  // Default conversational responses
  const responses = [
    `I appreciate you sharing that with me! ${hasProfile ? 'It adds valuable context to your profile. ' : ''}Every detail helps me understand what you're looking for in your career. ${!hasCompletedOnboarding ? 'Tell me about your education and interests so I can help you better!' : 'Is there a specific aspect of your job search you\'d like to focus on?'}`,
    `That's really helpful to know! ${hasProfile ? 'I\'m building a comprehensive picture of your career goals. ' : ''}The more we discuss your preferences and goals, the better I can guide you. ${!hasCompletedOnboarding ? 'What\'s your educational background and what are you interested in?' : 'Would you like me to show you some job opportunities that might be a good fit?'}`,
    `Thanks for that insight! ${hasProfile ? 'Your profile is becoming more detailed, which helps me make better recommendations. ' : ''}I'm here to support your career journey in whatever way is most helpful. What would you like to explore next?`,
    `I understand! ${hasProfile ? 'Considering your background and what you\'ve told me, ' : ''}There are definitely paths forward that could work well for you. ${!hasCompletedOnboarding ? 'First, tell me about your education and interests!' : 'Would you like to see some specific job matches, or would you prefer to discuss career strategies first?'}`,
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}

export function generateOnboardingResponse(data: OnboardingData): {
  content: string;
  jobCards?: JobCard[];
} {
  return {
    content: `Profile saved. Here are job matches for **${data.fieldOfStudy}** based on your background:`,
    jobCards: undefined, // will be populated by fetchRealJobs below
  };
}

// Called right after onboarding to fetch real jobs
export async function fetchJobsAfterOnboarding(data: OnboardingData): Promise<JobCard[]> {
  try {
    const { query, isInternship } = extractJobQuery(data.fieldOfStudy, data.interests.join(' '));
    const realJobs = await searchJobs(query, { internship: isInternship, context: data.fieldOfStudy });
    return realJobs.map((job): JobCard => ({
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      salary: job.salary,
      matchScore: job.matchScore,
      remote: job.remote,
      type: job.type,
      description: job.description,
      tags: job.tags,
      applyUrl: job.applyUrl,
    }));
  } catch {
    return [];
  }
}

export function generateCoverLetter(job: JobCard, onboardingData?: OnboardingData | null): string {
  const name = "[Your Name]";
  const field = onboardingData?.fieldOfStudy || "your field";
  const degree = onboardingData?.degree || "Bachelor's";

  return `Dear Hiring Team at ${job.company},

I am writing to express my strong interest in the ${job.title} position at ${job.company}. With a ${degree} in ${field} and a deep passion for ${job.tags.slice(0, 2).join(" and ")}, I am confident in my ability to make a meaningful contribution to your team.

Throughout my academic and professional journey, I have developed a comprehensive skill set that aligns closely with the requirements of this role. My experience has equipped me with the analytical rigor and collaborative mindset needed to thrive in a fast-paced, innovation-driven environment like ${job.company}.

What excites me most about this opportunity is ${job.company}'s commitment to building products that genuinely make a difference. The work being done on ${job.description.split(".")[0].toLowerCase()} resonates deeply with my professional aspirations and personal values.

I am particularly drawn to the collaborative culture at ${job.company}, where cross-functional teamwork and intellectual curiosity are celebrated. I am eager to bring my unique perspective and drive to your organization.

I welcome the opportunity to discuss how my background, skills, and enthusiasm can contribute to the continued success of ${job.company}. Thank you for your consideration.

Warm regards,
${name}`;
}






