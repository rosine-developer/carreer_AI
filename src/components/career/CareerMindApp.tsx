import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Send, Sparkles, ChevronDown, RotateCcw, Menu, Plus, LogOut, UserCircle } from "lucide-react";
import { Message, JobCard, OnboardingData, PreferenceTag } from "./types";
import {
  INITIAL_MESSAGE,
  DEFAULT_PREFERENCE_TAGS,
  generateAIResponse,
  generateOnboardingResponse,
} from "./data";
import BrainPulse from "./BrainPulse";
import ChatMessage from "./ChatMessage";
import PreferenceTagTrainer from "./PreferenceTagTrainer";
import OpportunityDrawer from "./OpportunityDrawer";
import ApplicationBuilderModal from "./ApplicationBuilderModal";
import ConversationHistory from "./ConversationHistory";
import ProfileManagerModal from "./ProfileManagerModal";
import ResumeBuilderModal from "./ResumeBuilderModal";
import CoverLetterWriterModal from "./CoverLetterWriterModal";
import ApplicationFormHelperModal from "./ApplicationFormHelperModal";
import ApplicationTrackerView from "./ApplicationTrackerView";
import AuthModal from "../auth/AuthModal";
import { useAuth } from "../../contexts/AuthContext";
import DiscoveryAnimation from "./DiscoveryAnimation";
import UpgradeModal from "./UpgradeModal";
import { useSubscription } from "../../contexts/SubscriptionContext";

let messageIdCounter = 1;
const newId = () => `msg-${++messageIdCounter}`;

interface SavedConversation {
  id: string;
  title: string;
  timestamp: Date;
  messages: Message[];
  onboardingData: OnboardingData | null;
  onboardingDone: boolean;
  tags: PreferenceTag[];
}

export default function CareerMindApp() {
  const { user, signOut, loading: authLoading } = useAuth();
  const { isPro, openCustomerPortal } = useSubscription();
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState('');

  const requirePro = (featureName: string, action: () => void) => {
    if (isPro) {
      action();
    } else {
      setUpgradeFeature(featureName);
      setUpgradeModalOpen(true);
    }
  };
  // Logged-in users get their own storage key; guests share a temporary one
  const storageKey = user ? `careerMind_conversations_${user.id}` : 'careerMind_conversations_guest';

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showDiscovery, setShowDiscovery] = useState(() => {
    // Show only once per session
    return !sessionStorage.getItem('discovery_shown');
  });
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [showSaveBanner, setShowSaveBanner] = useState(true);

  const openLogin = () => { setAuthModalMode('login'); setAuthModalOpen(true); };
  const openRegister = () => { setAuthModalMode('register'); setAuthModalOpen(true); };

  const [currentConversationId, setCurrentConversationId] = useState<string>("");
  const [conversations, setConversations] = useState<SavedConversation[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [aiLoading, setAiLoading] = useState(true);
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
  const [onboardingDone, setOnboardingDone] = useState(false);
  const [tags, setTags] = useState<PreferenceTag[]>(DEFAULT_PREFERENCE_TAGS);
  const [trainingIntensity, setTrainingIntensity] = useState(2);
  const [selectedJob, setSelectedJob] = useState<JobCard | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [applyJob, setApplyJob] = useState<JobCard | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [resumeModalOpen, setResumeModalOpen] = useState(false);
  const [coverLetterModalOpen, setCoverLetterModalOpen] = useState(false);
  const [formHelperModalOpen, setFormHelperModalOpen] = useState(false);
  const [trackerViewOpen, setTrackerViewOpen] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Generate conversation title from first user message
  const generateTitle = (messages: Message[]): string => {
    const firstUserMsg = messages.find(m => m.role === 'user');
    if (firstUserMsg) {
      return firstUserMsg.content.slice(0, 50) + (firstUserMsg.content.length > 50 ? '...' : '');
    }
    return 'New Conversation';
  };

  // Save current conversation — only for logged-in users
  const saveCurrentConversation = () => {
    if (!user) return; // guests: never save
    if (!currentConversationId || messages.length <= 1) return;

    const conversation: SavedConversation = {
      id: currentConversationId,
      title: generateTitle(messages),
      timestamp: new Date(),
      messages,
      onboardingData,
      onboardingDone,
      tags,
    };

    setConversations(prev => {
      const filtered = prev.filter(c => c.id !== currentConversationId);
      const updated = [conversation, ...filtered];
      localStorage.setItem(storageKey, JSON.stringify(updated));
      return updated;
    });
  };

  // Load conversations on mount only — never reset mid-session
  useEffect(() => {
    try {
      if (user) {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          const withDates = parsed.map((conv: any) => ({
            ...conv,
            timestamp: new Date(conv.timestamp),
            messages: conv.messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
            })),
          }));
          setConversations(withDates);
        }
      }

      // Only start a new conversation if we don't already have one going
      if (messages.length === 0) {
        const newId = `conv-${Date.now()}`;
        setCurrentConversationId(newId);
        setMessages([INITIAL_MESSAGE]);
        setOnboardingData(null);
        setOnboardingDone(false);
        setTags(DEFAULT_PREFERENCE_TAGS);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      if (messages.length === 0) {
        const newId = `conv-${Date.now()}`;
        setCurrentConversationId(newId);
        setMessages([INITIAL_MESSAGE]);
      }
    }
  }, []); // run ONCE on mount only

  // When user logs in, load their saved conversations without resetting chat
  useEffect(() => {
    if (user) {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          const withDates = parsed.map((conv: any) => ({
            ...conv,
            timestamp: new Date(conv.timestamp),
            messages: conv.messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
            })),
          }));
          setConversations(withDates);
        }
      } catch (error) {
        console.error('Error loading conversations after login:', error);
      }
    } else {
      // User logged out — clear conversation list but keep current chat
      setConversations([]);
    }
  }, [user]);

  // Save conversation when messages change — only for logged-in users
  useEffect(() => {
    if (user && currentConversationId && messages.length > 1) {
      saveCurrentConversation();
    }
  }, [messages, onboardingData, onboardingDone, tags]);

  // Create new conversation
  const handleNewConversation = () => {
    saveCurrentConversation();
    const newId = `conv-${Date.now()}`;
    setCurrentConversationId(newId);
    setMessages([INITIAL_MESSAGE]);
    setOnboardingData(null);
    setOnboardingDone(false);
    setTags(DEFAULT_PREFERENCE_TAGS);
    setTrainingIntensity(2);
  };

  // Load a conversation
  const handleSelectConversation = (id: string) => {
    saveCurrentConversation();
    const conv = conversations.find(c => c.id === id);
    if (conv) {
      setCurrentConversationId(conv.id);
      setMessages(conv.messages);
      setOnboardingData(conv.onboardingData);
      setOnboardingDone(conv.onboardingDone);
      setTags(conv.tags || DEFAULT_PREFERENCE_TAGS);
    }
  };

  // Delete a conversation
  const handleDeleteConversation = (id: string) => {
    setConversations(prev => {
      const filtered = prev.filter(c => c.id !== id);
      localStorage.setItem(storageKey, JSON.stringify(filtered));
      
      // If deleting current conversation, create new one
      if (id === currentConversationId) {
        handleNewConversation();
      }
      
      return filtered;
    });
  };

  // Initialize AI
  useEffect(() => {
    import("../../lib/ai-service").then(({ initializeAI }) => {
      initializeAI()
        .then(() => {
          console.log("✅ AI ready!");
          setAiLoading(false);
        })
        .catch(() => {
          console.log("⚠️ AI model not available, using fallback");
          setAiLoading(false);
        });
    });
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 100);
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const addAIMessage = async (content: string, jobCards?: JobCard[]) => {
    setIsTyping(true);
    await new Promise((r) => setTimeout(r, 800 + Math.random() * 600));
    setIsTyping(false);
    setMessages((prev) => [
      ...prev,
      {
        id: newId(),
        role: "ai",
        content,
        timestamp: new Date(),
        jobCards,
      },
    ]);
  };

  const handleOnboardingSubmit = async (data: OnboardingData) => {
    setOnboardingData(data);
    setOnboardingDone(true);

    // Add user "submitted" message
    setMessages((prev) => [
      ...prev,
      {
        id: newId(),
        role: "user",
        content: `I have a ${data.degree} in ${data.fieldOfStudy}. My top interests are: ${data.interests.join(", ")}.`,
        timestamp: new Date(),
      },
    ]);

    const { content, jobCards } = generateOnboardingResponse(data);
    await addAIMessage(content, jobCards);
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;
    setInput("");

    // Add user message
    const userMessage: Message = { 
      id: newId(), 
      role: "user", 
      content: text, 
      timestamp: new Date() 
    };
    setMessages((prev) => [...prev, userMessage]);

    // Pass full conversation history for context (logged-in users only)
    // Guests get no memory — AI only sees the current message
    const historyForAI = user ? [...messages, userMessage] : [userMessage];

    const { content, jobCards } = await generateAIResponse(
      text,
      historyForAI,
      onboardingData,
      tags
    );
    await addAIMessage(content, jobCards);
  };

  const handleTrainAI = () => {
    if (!input.trim()) {
      // Just acknowledge training mode
      const tag: PreferenceTag = {
        id: `tag-${Date.now()}`,
        label: "Training Mode",
        weight: 1,
        category: "positive",
      };
      inputRef.current?.focus();
      return;
    }
    // Add as preference tag
    const tag: PreferenceTag = {
      id: `tag-${Date.now()}`,
      label: input.trim(),
      weight: 1,
      category: "positive",
    };
    setTags((prev) => [...prev, tag]);
    setTrainingIntensity((i) => Math.min(i + 1, 10));
    setInput("");
    addAIMessage(
      `Got it! I've added **"${tag.label}"** to your preference profile. This will influence future job recommendations. Keep training me to get better matches!`
    );
  };

  const handleAddTag = (tag: PreferenceTag) => {
    setTags((prev) => [...prev, tag]);
    setTrainingIntensity((i) => Math.min(i + 1, 10));
  };

  const handleRemoveTag = (id: string) => {
    setTags((prev) => prev.filter((t) => t.id !== id));
    setTrainingIntensity((i) => Math.max(i - 1, 0));
  };

  const handleUpdateWeight = (id: string, weight: number) => {
    setTags((prev) => prev.map((t) => (t.id === id ? { ...t, weight } : t)));
  };

  const handleFindOpportunity = (job: JobCard) => {
    setSelectedJob(job);
    setDrawerOpen(true);
  };

  const handleApply = (job: JobCard) => {
    requirePro('Help Me Apply', () => {
      setApplyJob(job);
      setModalOpen(true);
    });
  };

  const handleBuildResume = (job: JobCard) => {
    // Store job context in localStorage for the resume builder to use
    localStorage.setItem('careermind:resume_job_context', JSON.stringify(job));
    setResumeModalOpen(true);
  };

  const handleWriteCoverLetter = (job: JobCard) => {
    // Store job context in localStorage for the cover letter writer to use
    localStorage.setItem('careermind:coverletter_job_context', JSON.stringify(job));
    setCoverLetterModalOpen(true);
  };

  // If tracker view is open, show it instead of chat
  if (trackerViewOpen) {
    return (
      <div className="h-screen w-screen overflow-hidden flex flex-col" style={{ background: "#FFFFFF" }}>
        {/* Simple header for tracker */}
        <header
          className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ background: "#FFFFFF", borderBottom: "1px solid #F0F0F0" }}
        >
          <div className="flex items-center gap-0">
            <img src="/cm_logo.png" alt="CareerMind AI" style={{ width: "60px", height: "60px", objectFit: "contain", marginRight: "-8px" }} />
            <span className="text-sm font-bold" style={{ color: "#111", fontFamily: "Syne, sans-serif" }}>
              CareerMind <span style={{ color: "#0095FF" }}>AI</span>
            </span>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setTrackerViewOpen(false)}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: "#F5F5F5", border: "1px solid #E5E5E5", color: "#333" }}
          >
            Back to Chat
          </motion.button>
        </header>
        <ApplicationTrackerView />
      </div>
    );
  }

  return (
    <div
      className="h-screen w-screen overflow-hidden flex"
      style={{ background: "#FFFFFF", fontFamily: "Manrope, sans-serif" }}
    >
      {/* ── LEFT SIDEBAR (collapsible) ── */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 220, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col shrink-0 h-full overflow-hidden"
            style={{ background: "#FFFFFF", minWidth: 0 }}
          >
            {/* Logo + sidebar toggle */}
            <div className="flex items-center gap-1 px-4 py-4">
              <img src="/cm_logo.png" alt="CareerMind AI" style={{ width: "60px", height: "60px", objectFit: "contain", marginRight: "-8px" }} />
              <span className="text-sm font-bold whitespace-nowrap flex-1" style={{ color: "#111", fontFamily: "Syne, sans-serif" }}>
                CareerMind <span style={{ color: "#0095FF" }}>AI</span>
              </span>
              {/* Sidebar hide button — moved here */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setSidebarOpen(v => !v)}
                className="p-1.5 rounded-lg transition-all"
                style={{ background: "#F5F5F5", border: "1px solid #E5E5E5", color: "#555" }}
                title="Hide sidebar"
              >
                <Menu size={15} />
              </motion.button>
            </div>

            {/* New Chat */}
            <div className="px-3 pt-3 pb-2">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleNewConversation}
                data-tour="new-chat"
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium"
                style={{ background: "#0095FF", color: "#FFFFFF" }}
                onMouseEnter={e => { e.currentTarget.style.background = "#007ACC"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#0095FF"; }}
              >
                <Plus size={15} />
                New Chat
              </motion.button>
            </div>

            {/* Nav items */}
            <nav className="flex-1 px-3 space-y-1 overflow-y-auto py-2">
              {[
                { label: "Track Applications", action: () => requirePro('Track Applications', () => setTrackerViewOpen(true)), tour: "track-apps" },
                { label: "Manage Profile", action: () => setProfileModalOpen(true), tour: "manage-profile" },
                { label: "Build Resume", action: () => requirePro('Resume Builder', () => setResumeModalOpen(true)), tour: "build-resume" },
                { label: "Cover Letter", action: () => requirePro('Cover Letter Writer', () => setCoverLetterModalOpen(true)), tour: "cover-letter" },
                { label: "Form Helper", action: () => requirePro('Form Helper', () => setFormHelperModalOpen(true)), tour: "form-helper" },
              ].map((item) => (
                <motion.button
                  key={item.label}
                  whileTap={{ scale: 0.97 }}
                  onClick={item.action}
                  data-tour={item.tour}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm text-left transition-all whitespace-nowrap"
                  style={{ color: "#444", background: "transparent" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#F0F0F0"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                >
                  <span>{item.label}</span>
                  {['Track Applications', 'Build Resume', 'Cover Letter', 'Form Helper'].includes(item.label) && !isPro && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold" style={{ background: '#EBF5FF', color: '#0095FF' }}>PRO</span>
                  )}
                </motion.button>
              ))}

              {user && conversations.length > 0 && (
                <div className="pt-3">
                  <p className="text-xs font-bold px-3 pb-2" style={{ color: "#111", letterSpacing: "0.05em" }}>RECENT</p>
                  {conversations.slice(0, 8).map(c => (
                    <motion.button
                      key={c.id}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleSelectConversation(c.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-left transition-all"
                      style={{
                        color: c.id === currentConversationId ? "#0095FF" : "#666",
                        background: c.id === currentConversationId ? "#EBF5FF" : "transparent",
                      }}
                      onMouseEnter={e => { if (c.id !== currentConversationId) e.currentTarget.style.background = "#F0F0F0"; }}
                      onMouseLeave={e => { if (c.id !== currentConversationId) e.currentTarget.style.background = "transparent"; }}
                    >
                      <span className="truncate">{c.title}</span>
                    </motion.button>
                  ))}
                </div>
              )}
            </nav>

            {/* Bottom: Subscription + Auth */}
            <div className="px-3 py-3 space-y-2" style={{ borderTop: "1px solid #F0F0F0" }}>
              {/* Subscription status */}
              {isPro ? (
                <button
                  onClick={openCustomerPortal}
                  className="w-full px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between"
                  style={{ background: '#EBF5FF', color: '#0095FF' }}
                >
                  <span>Pro Plan Active</span>
                  <span style={{ fontSize: '10px' }}>Manage →</span>
                </button>
              ) : (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setUpgradeModalOpen(true)}
                  className="w-full px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                  style={{ background: '#0095FF', color: '#FFFFFF' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#007ACC'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#0095FF'; }}
                >
                  Upgrade to Pro
                </motion.button>
              )}
              {!authLoading && (
                user ? (
                  <div className="flex items-center gap-0">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: "#0095FF", color: "#FFFFFF" }} title={user.email ?? ''}>
                      {(user.user_metadata?.full_name?.[0] ?? user.email?.[0] ?? '?').toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color: "#333" }}>{user.user_metadata?.full_name || user.email?.split('@')[0]}</p>
                      <p className="text-xs truncate" style={{ color: "#AAA" }}>{user.email}</p>
                    </div>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={signOut} className="p-1.5 rounded-lg shrink-0" title="Log out" style={{ color: "#BBB" }} onMouseEnter={e => { e.currentTarget.style.color = "#EF4444"; }} onMouseLeave={e => { e.currentTarget.style.color = "#BBB"; }}>
                      <LogOut size={14} />
                    </motion.button>
                  </div>
                ) : (
                  <motion.button whileTap={{ scale: 0.97 }} onClick={openLogin} className="w-full px-3 py-2.5 rounded-xl text-sm font-medium" style={{ background: "#0095FF", color: "#FFFFFF" }} onMouseEnter={e => { e.currentTarget.style.background = "#007ACC"; }} onMouseLeave={e => { e.currentTarget.style.background = "#0095FF"; }}>
                    Log in to save chats
                  </motion.button>
                )
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── MAIN AREA (career content LEFT + chat RIGHT) ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar — only shown when sidebar is hidden, to show the toggle + logo */}
        {!sidebarOpen && (
          <div className="flex items-center gap-3 px-4 py-3 shrink-0" style={{ background: "#FFFFFF" }}>
            {/* Show sidebar button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setSidebarOpen(v => !v)}
              className="p-2 rounded-lg transition-all"
              style={{ background: "#F5F5F5", border: "1px solid #E5E5E5", color: "#555" }}
              title="Show sidebar"
            >
              <Menu size={16} />
            </motion.button>

            {/* Logo */}
            <div className="flex items-center gap-0">
              <img src="/cm_logo.png" alt="CareerMind AI" style={{ width: "60px", height: "60px", objectFit: "contain", marginRight: "-8px" }} />
              <span className="text-sm font-bold" style={{ color: "#111", fontFamily: "Syne, sans-serif" }}>
                CareerMind <span style={{ color: "#0095FF" }}>AI</span>
              </span>
            </div>

            {/* Auth */}
            <div className="ml-auto flex items-center gap-2">
              {!authLoading && !user && (
                <motion.button whileTap={{ scale: 0.97 }} onClick={openLogin} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: "#0095FF", color: "#FFFFFF" }}>
                  Log in
                </motion.button>
              )}
              {!authLoading && user && (
                <div className="flex items-center gap-0">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "#0095FF", color: "#FFFFFF" }} title={user.email ?? ''}>
                    {(user.user_metadata?.full_name?.[0] ?? user.email?.[0] ?? '?').toUpperCase()}
                  </div>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={signOut} className="p-1.5 rounded-lg" style={{ color: "#BBB" }} onMouseEnter={e => { e.currentTarget.style.color = "#EF4444"; }} onMouseLeave={e => { e.currentTarget.style.color = "#BBB"; }}>
                    <LogOut size={13} />
                  </motion.button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sign in banner */}
        <AnimatePresence>
          {!user && !authLoading && showSaveBanner && messages.length > 1 && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="shrink-0 flex items-center justify-between px-5 py-2" style={{ background: '#EBF5FF', borderBottom: '1px solid #C5E0FF' }}>
              <p className="text-xs" style={{ color: '#555' }}>Create a free account to save your conversations</p>
              <div className="flex items-center gap-0">
                <button onClick={openRegister} className="px-3 py-1 rounded-lg text-xs font-medium" style={{ background: '#0095FF', color: '#FFFFFF' }}>Sign up free</button>
                <button onClick={() => setShowSaveBanner(false)} style={{ color: '#BBB', fontSize: '12px' }}>✕</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── SPLIT: career content LEFT | chat RIGHT ── */}
        <div className="flex-1 flex overflow-hidden">

          {/* LEFT: Career content (job cards, AI responses) */}
          <div
            ref={chatContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto"
            style={{ background: "#FFFFFF", scrollbarWidth: "thin", scrollbarColor: "#E5E5E5 transparent" }}
          >
            {(() => {
              // New chat — always show welcome screen
              if (messages.length === 1) {
                return (
                  <div className="h-full flex flex-col items-center justify-center px-6 max-w-xl mx-auto w-full">
                    <div className="text-center mb-8">
                      <h1 className="text-2xl font-bold mb-2" style={{ color: "#111", fontFamily: "Syne, sans-serif" }}>
                        Welcome to <span style={{ color: "#0095FF" }}>CareerMind AI</span>
                      </h1>
                      <p className="text-sm" style={{ color: "#888" }}>Your intelligent career coach.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {["Find job opportunities", "Get career advice", "Prepare applications", "Explore career paths"].map((text, i) => (
                        <motion.button key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} onClick={() => { setInput(text); inputRef.current?.focus(); }} className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-center" style={{ background: "#F5F5F5", border: "1px solid #E0E0E0", color: "#111" }} whileHover={{ background: "#EFEFEF" }}>
                          {text}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                );
              }
              // Active conversation — left shows only job cards & onboarding forms
              const leftMessages = messages.filter(msg => msg.jobCards || msg.isOnboarding);
              if (leftMessages.length > 0) {
                return (
                  <div className="px-5 py-6">
                    {leftMessages.map((msg) => (
                      <ChatMessage
                        key={msg.id}
                        message={msg}
                        onOnboardingSubmit={!onboardingDone ? handleOnboardingSubmit : undefined}
                        onFindOpportunity={handleFindOpportunity}
                        onApply={handleApply}
                        onBuildResume={handleBuildResume}
                        onWriteCoverLetter={handleWriteCoverLetter}
                      />
                    ))}
                    <AnimatePresence>
                      {isTyping && (
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="flex justify-start mb-4">
                          <div className="px-4 py-2.5 rounded-xl" style={{ background: "#F5F5F5", border: "1px solid #EBEBEB" }}>
                            <span className="text-xs font-medium" style={{ color: "#0095FF" }}>thinking...</span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <div ref={chatEndRef} />
                  </div>
                );
              }
              // Has messages but no job cards yet — keep welcome screen visible
              return (
                <div className="h-full flex flex-col items-center justify-center px-6 max-w-xl mx-auto w-full">
                  <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold mb-2" style={{ color: "#111", fontFamily: "Syne, sans-serif" }}>
                      Welcome to <span style={{ color: "#0095FF" }}>CareerMind AI</span>
                    </h1>
                    <p className="text-sm" style={{ color: "#888" }}>Your intelligent career coach.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {["Find job opportunities", "Get career advice", "Prepare applications", "Explore career paths"].map((text, i) => (
                      <motion.button key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} onClick={() => { setInput(text); inputRef.current?.focus(); }} className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-center" style={{ background: "#F5F5F5", border: "1px solid #E0E0E0", color: "#111" }} whileHover={{ background: "#EFEFEF" }}>
                        {text}
                      </motion.button>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* RIGHT: Chat input panel */}
          <div className="flex flex-col shrink-0" style={{ width: "340px", background: "#F8F9FA" }}>
            <div className="px-4 py-3 shrink-0">
              <p className="text-xs font-bold tracking-widest" style={{ color: "#0095FF" }}>CHAT</p>
            </div>

            {/* Chat history — visible container */}
            <div className="overflow-y-auto px-3 pt-3 pb-2" style={{ scrollbarWidth: "thin" }}>
              <div className="rounded-xl p-3 space-y-3" style={{ background: "#FFFFFF", border: "1px solid #E8E8E8" }}>
                {messages.filter(m => m.role === 'user' || (m.role === 'ai' && !m.jobCards)).map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className="max-w-[88%] px-3 py-2 rounded-xl text-sm"
                      style={{
                        background: msg.role === 'user' ? '#0095FF' : 'transparent',
                        color: msg.role === 'user' ? '#FFFFFF' : '#111',
                        border: 'none',
                      }}
                    >
                      {msg.isOnboarding ? (
                        <span style={{ color: msg.role === 'user' ? '#FFFFFF' : '#000000', fontWeight: 500 }}>
                          {msg.content.split('\n')[0]}
                        </span>
                      ) : msg.content}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="px-3 py-2 rounded-xl text-xs" style={{ background: "#F0F0F0", color: "#0095FF" }}>thinking...</div>
                  </div>
                )}
              </div>
            </div>

            {/* Input box */}
            <div className="px-3 py-3 shrink-0">
              <div
                className="flex items-center gap-2 px-3 py-2.5 transition-all"
                style={{ background: "#FFFFFF", border: "2px solid #C0C0C0", borderRadius: "30px", boxShadow: "0 4px 16px rgba(0,0,0,0.12)" }}
                onFocusCapture={e => { e.currentTarget.style.border = "2px solid #0095FF"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0,149,255,0.18)"; }}
                onBlurCapture={e => { if (!e.currentTarget.contains(e.relatedTarget)) { e.currentTarget.style.border = "2px solid #C0C0C0"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.12)"; } }}
              >
                <input
                  ref={inputRef}
                  data-tour="chat-input"
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  placeholder="Message CareerMind AI..."
                  className="flex-1 bg-transparent outline-none text-sm"
                  style={{ color: "#000000", fontFamily: "Manrope, sans-serif", fontWeight: 500 }}
                />
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={sendMessage}
                  disabled={!input.trim() || isTyping}
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: input.trim() ? "#0095FF" : "#F0F0F0", color: input.trim() ? "#FFFFFF" : "#CCC" }}
                >
                  <Send size={14} />
                </motion.button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Opportunity Drawer */}
      <OpportunityDrawer
        job={selectedJob}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />

      {/* Application Builder Modal */}
      <ApplicationBuilderModal
        job={applyJob}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onboardingData={onboardingData}
      />

      {/* Profile Manager Modal */}
      <ProfileManagerModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />

      {/* Resume Builder Modal */}
      <ResumeBuilderModal
        isOpen={resumeModalOpen}
        onClose={() => setResumeModalOpen(false)}
      />

      {/* Cover Letter Writer Modal */}
      <CoverLetterWriterModal
        isOpen={coverLetterModalOpen}
        onClose={() => setCoverLetterModalOpen(false)}
      />

      {/* Application Form Helper Modal */}
      <ApplicationFormHelperModal
        isOpen={formHelperModalOpen}
        onClose={() => setFormHelperModalOpen(false)}
      />

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        featureName={upgradeFeature}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultMode={authModalMode}
      />

      {/* Discovery Animation — shown once on welcome screen */}
      {showDiscovery && (
        <DiscoveryAnimation
          onDismiss={() => {
            setShowDiscovery(false);
            sessionStorage.setItem('discovery_shown', 'true');
          }}
        />
      )}

    </div>
  );
}












