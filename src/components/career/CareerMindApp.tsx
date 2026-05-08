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
  // Logged-in users get their own storage key; guests share a temporary one
  const storageKey = user ? `careerMind_conversations_${user.id}` : 'careerMind_conversations_guest';

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
    setApplyJob(job);
    setModalOpen(true);
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
      <div className="h-screen w-screen overflow-hidden flex flex-col">
        {/* Simple header for tracker */}
        <header
          className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{
            background: "#0a0a0a",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, rgba(255,138,0,0.2), rgba(255,87,34,0.15))",
                border: "1px solid rgba(255,138,0,0.35)",
                boxShadow: "0 0 16px rgba(255,138,0,0.2)",
              }}
            >
              <span
                className="text-xs font-black"
                style={{ color: "#FF8A00", fontFamily: "Syne, sans-serif" }}
              >
                CM
              </span>
            </div>
            <div>
              <span
                className="text-base font-extrabold tracking-tight"
                style={{ color: "rgba(255,255,255,0.95)", fontFamily: "Syne, sans-serif" }}
              >
                CareerMind
              </span>
              <span
                className="text-base font-extrabold tracking-tight ml-1"
                style={{ color: "#FF8A00", fontFamily: "Syne, sans-serif" }}
              >
                AI
              </span>
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setTrackerViewOpen(false)}
            className="px-4 py-2 rounded-lg text-sm"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.7)",
            }}
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
      {/* ── LEFT SIDEBAR ── */}
      <aside
        className="flex flex-col shrink-0 h-full"
        style={{ width: "220px", borderRight: "1px solid #F0F0F0", background: "#FAFAFA" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 py-4" style={{ borderBottom: "1px solid #F0F0F0" }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#FF8A00" }}>
            <span className="text-xs font-black text-white" style={{ fontFamily: "Syne, sans-serif" }}>CM</span>
          </div>
          <span className="text-sm font-bold" style={{ color: "#111", fontFamily: "Syne, sans-serif" }}>
            CareerMind <span style={{ color: "#FF8A00" }}>AI</span>
          </span>
        </div>

        {/* New Chat */}
        <div className="px-3 pt-3 pb-2">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleNewConversation}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: "#FF8A00", color: "#FFFFFF" }}
            onMouseEnter={e => { e.currentTarget.style.background = "#E67A00"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#FF8A00"; }}
          >
            <Plus size={15} />
            New Chat
          </motion.button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto py-2">
          {[
            { label: "Track Applications", action: () => setTrackerViewOpen(true), icon: "📋" },
            { label: "Manage Profile", action: () => setProfileModalOpen(true), icon: "👤" },
            { label: "Build Resume", action: () => setResumeModalOpen(true), icon: "📄" },
            { label: "Cover Letter", action: () => setCoverLetterModalOpen(true), icon: "✉️" },
            { label: "Form Helper", action: () => setFormHelperModalOpen(true), icon: "📝" },
          ].map((item) => (
            <motion.button
              key={item.label}
              whileTap={{ scale: 0.97 }}
              onClick={item.action}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-left transition-all"
              style={{ color: "#444", background: "transparent" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#F0F0F0"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </motion.button>
          ))}

          {/* Conversation history for logged-in users */}
          {user && conversations.length > 0 && (
            <div className="pt-3">
              <p className="text-xs font-semibold px-3 pb-2" style={{ color: "#BBB", letterSpacing: "0.05em" }}>RECENT</p>
              {conversations.slice(0, 8).map(c => (
                <motion.button
                  key={c.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleSelectConversation(c.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-left transition-all"
                  style={{
                    color: c.id === currentConversationId ? "#FF8A00" : "#666",
                    background: c.id === currentConversationId ? "#FFF3E0" : "transparent",
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

        {/* Bottom: Auth */}
        <div className="px-3 py-3" style={{ borderTop: "1px solid #F0F0F0" }}>
          {!authLoading && (
            user ? (
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: "#0095FF", color: "#FFFFFF" }}
                  title={user.email ?? ''}
                >
                  {(user.user_metadata?.full_name?.[0] ?? user.email?.[0] ?? '?').toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate" style={{ color: "#333" }}>
                    {user.user_metadata?.full_name || user.email?.split('@')[0]}
                  </p>
                  <p className="text-xs truncate" style={{ color: "#AAA" }}>{user.email}</p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={signOut}
                  className="p-1.5 rounded-lg shrink-0"
                  title="Log out"
                  style={{ color: "#BBB" }}
                  onMouseEnter={e => { e.currentTarget.style.color = "#EF4444"; }}
                  onMouseLeave={e => { e.currentTarget.style.color = "#BBB"; }}
                >
                  <LogOut size={14} />
                </motion.button>
              </div>
            ) : (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={openLogin}
                className="w-full px-3 py-2.5 rounded-xl text-sm font-medium"
                style={{ background: "#0095FF", color: "#FFFFFF" }}
                onMouseEnter={e => { e.currentTarget.style.background = "#007ACC"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#0095FF"; }}
              >
                Log in to save chats
              </motion.button>
            )
          )}
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* "Sign in to save" banner */}
        <AnimatePresence>
          {!user && !authLoading && showSaveBanner && messages.length > 1 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="shrink-0 flex items-center justify-between px-5 py-2"
              style={{ background: '#FFF8F0', borderBottom: '1px solid #FFE0B2' }}
            >
              <p className="text-xs" style={{ color: '#888' }}>
                Create a free account to save your conversations
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={openRegister}
                  className="px-3 py-1 rounded-lg text-xs font-medium"
                  style={{ background: '#FF8A00', color: '#FFFFFF' }}
                >
                  Sign up free
                </button>
                <button onClick={() => setShowSaveBanner(false)} style={{ color: '#BBB', fontSize: '12px' }}>✕</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat area */}
        <div
          ref={chatContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto"
          style={{ scrollbarWidth: "thin", scrollbarColor: "#E5E5E5 transparent" }}
        >
          {messages.length === 1 && !onboardingDone ? (
            <div className="h-full flex flex-col items-center justify-center px-6 max-w-2xl mx-auto w-full">
              {/* Title */}
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2" style={{ color: "#111", fontFamily: "Syne, sans-serif" }}>
                  Welcome to <span style={{ color: "#FF8A00" }}>CareerMind</span> <span style={{ color: "#0095FF" }}>AI</span>
                </h1>
                <p className="text-sm" style={{ color: "#888" }}>
                  Your intelligent career coach. Let's discover your ideal career path.
                </p>
              </div>

              {/* Input bar — ABOVE cards */}
              <div className="w-full mb-4">
                <div
                  className="flex items-center gap-3 rounded-2xl px-4 py-3 transition-all"
                  style={{ background: "#FFFFFF", border: "2px solid #D0D0D0", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}
                  onFocusCapture={e => {
                    e.currentTarget.style.border = "2px solid #FF8A00";
                    e.currentTarget.style.boxShadow = "0 2px 16px rgba(255,138,0,0.12)";
                  }}
                  onBlurCapture={e => {
                    if (!e.currentTarget.contains(e.relatedTarget)) {
                      e.currentTarget.style.border = "2px solid #D0D0D0";
                      e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.08)";
                    }
                  }}
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                    placeholder="Message CareerMind AI..."
                    className="flex-1 bg-transparent outline-none"
                    style={{ color: "#111", fontFamily: "Manrope, sans-serif", fontSize: "0.9rem", fontWeight: 500 }}
                  />
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={sendMessage}
                    disabled={!input.trim() || isTyping}
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all"
                    style={{
                      background: input.trim() ? "#FF8A00" : "#F0F0F0",
                      color: input.trim() ? "#FFFFFF" : "#CCC",
                    }}
                  >
                    <Send size={15} />
                  </motion.button>
                </div>
              </div>

              {/* Suggestion cards — BELOW input */}
              <div className="grid grid-cols-2 gap-2 w-full">
                {["Find job opportunities", "Get career advice", "Prepare applications", "Explore career paths"].map((text, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}
                    onClick={() => setInput(text)}
                    className="p-3 rounded-xl text-left text-sm font-medium"
                    style={{ background: "#F5F5F5", border: "1px solid #E0E0E0", color: "#111" }}
                    whileHover={{ background: "#EFEFEF" }}
                  >
                    {text}
                  </motion.button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto px-5 py-6">
              {messages.map((msg) => (
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
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="flex justify-start mb-4"
                  >
                    <div className="px-4 py-3 rounded-xl" style={{ background: "#F5F5F5", border: "1px solid #EBEBEB" }}>
                      <div className="flex items-center gap-1">
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: "#FF8A00" }}
                            animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* Scroll button */}
        <AnimatePresence>
          {showScrollBtn && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={scrollToBottom}
              className="absolute bottom-24 right-6 p-2 rounded-full z-20"
              style={{ background: "#FF8A00", color: "#FFFFFF", boxShadow: "0 2px 8px rgba(255,138,0,0.3)" }}
            >
              <ChevronDown size={16} />
            </motion.button>
          )}
        </AnimatePresence>

        {/* ── INPUT BAR — only shown when chatting ── */}
        {(messages.length > 1 || onboardingDone) && (
        <div className="shrink-0 px-5 py-3" style={{ borderTop: "1px solid #F0F0F0", background: "#FFFFFF" }}>
          <div
            className="flex items-center gap-3 rounded-2xl px-4 py-3 transition-all"
            style={{ background: "#FFFFFF", border: "2px solid #D0D0D0", boxShadow: "0 -2px 12px rgba(0,0,0,0.06)" }}
            onFocusCapture={e => {
              e.currentTarget.style.border = "2px solid #FF8A00";
              e.currentTarget.style.boxShadow = "0 -2px 16px rgba(255,138,0,0.12)";
            }}
            onBlurCapture={e => {
              if (!e.currentTarget.contains(e.relatedTarget)) {
                e.currentTarget.style.border = "2px solid #D0D0D0";
                e.currentTarget.style.boxShadow = "0 -2px 12px rgba(0,0,0,0.06)";
              }
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder="Message CareerMind AI..."
              className="flex-1 bg-transparent outline-none"
              style={{ color: "#111", fontFamily: "Manrope, sans-serif", fontSize: "0.9rem", fontWeight: 500 }}
            />
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={sendMessage}
              disabled={!input.trim() || isTyping}
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all"
              style={{
                background: input.trim() ? "#FF8A00" : "#F0F0F0",
                color: input.trim() ? "#FFFFFF" : "#CCC",
              }}
            >
              <Send size={15} />
            </motion.button>
          </div>
        </div>
        )}
      </div>

      {/* Conversation History Sidebar (overlay for mobile) */}
      <ConversationHistory
        conversations={conversations.map(c => ({
          id: c.id,
          title: c.title,
          timestamp: c.timestamp,
          messageCount: c.messages.length,
        }))}
        currentConversationId={currentConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
      />

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

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultMode={authModalMode}
      />

    </div>
  );
}
