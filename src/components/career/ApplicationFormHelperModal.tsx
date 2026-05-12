import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Search,
  Sparkles,
  Copy,
  Check,
  Loader2,
  Plus,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import storageManager from '../../lib/storage-manager';
import { generateFormResponse } from '../../lib/ai-content-generator';
import type {
  ApplicationFormHelperProps,
  FormQuestion,
  ProfileData,
} from '../../types/application-helper';

// Common application questions library
const COMMON_QUESTIONS: Omit<FormQuestion, 'id' | 'savedResponse' | 'lastModified'>[] = [
  {
    question: 'Why do you want this position?',
    category: 'motivation',
    characterLimit: 500,
  },
  {
    question: 'What are your greatest strengths?',
    category: 'strengths',
    characterLimit: 300,
  },
  {
    question: 'What are your weaknesses?',
    category: 'strengths',
    characterLimit: 300,
  },
  {
    question: 'Tell us about yourself.',
    category: 'experience',
    characterLimit: 500,
  },
  {
    question: 'Why do you want to work for our company?',
    category: 'motivation',
    characterLimit: 400,
  },
  {
    question: 'What relevant experience do you have?',
    category: 'experience',
    characterLimit: 500,
  },
  {
    question: 'Where do you see yourself in 5 years?',
    category: 'goals',
    characterLimit: 300,
  },
  {
    question: 'What makes you a good fit for this role?',
    category: 'motivation',
    characterLimit: 400,
  },
  {
    question: 'Describe a challenge you overcame.',
    category: 'experience',
    characterLimit: 500,
  },
  {
    question: 'What are your salary expectations?',
    category: 'goals',
    characterLimit: 200,
  },
  {
    question: 'Why should we hire you?',
    category: 'motivation',
    characterLimit: 400,
  },
  {
    question: 'What are your career goals?',
    category: 'goals',
    characterLimit: 400,
  },
  {
    question: 'How do you handle stress and pressure?',
    category: 'strengths',
    characterLimit: 300,
  },
  {
    question: 'What is your greatest achievement?',
    category: 'experience',
    characterLimit: 400,
  },
  {
    question: 'Do you prefer working independently or in a team?',
    category: 'strengths',
    characterLimit: 300,
  },
];

export default function ApplicationFormHelperModal({
  isOpen,
  onClose,
  job,
}: ApplicationFormHelperProps) {
  const [questions, setQuestions] = useState<FormQuestion[]>([]);
  const [customQuestions, setCustomQuestions] = useState<FormQuestion[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<FormQuestion | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [response, setResponse] = useState('');
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newQuestion, setNewQuestion] = useState('');

  // Load data on mount
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      // Load profile
      const profile = await storageManager.loadProfile();
      setProfileData(profile);

      // Load saved responses
      const savedResponses = await storageManager.listFormResponses();

      // Create questions with saved responses
      const questionsWithResponses: FormQuestion[] = COMMON_QUESTIONS.map((q, index) => {
        const saved = savedResponses.find(r => r.question === q.question);
        return {
          id: `q-${index}`,
          ...q,
          savedResponse: saved?.response || '',
          lastModified: saved?.lastModified || new Date(),
        };
      });

      setQuestions(questionsWithResponses);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  // Auto-save response
  useEffect(() => {
    if (selectedQuestion && response !== selectedQuestion.savedResponse) {
      const timer = setTimeout(() => {
        handleSaveResponse();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [response, selectedQuestion]);

  const handleSelectQuestion = (question: FormQuestion) => {
    setSelectedQuestion(question);
    setResponse(question.savedResponse);
  };

  const handleSaveResponse = async () => {
    if (!selectedQuestion) return;

    setSaveStatus('saving');
    try {
      await storageManager.saveFormResponse(selectedQuestion.id, response);

      // Update local state
      setQuestions(prev =>
        prev.map(q =>
          q.id === selectedQuestion.id
            ? { ...q, savedResponse: response, lastModified: new Date() }
            : q
        )
      );

      setSelectedQuestion(prev =>
        prev ? { ...prev, savedResponse: response, lastModified: new Date() } : null
      );

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to save response:', error);
      setSaveStatus('idle');
    }
  };

  const handleAISuggest = async () => {
    if (!selectedQuestion || !profileData) {
      alert('Please ensure your profile is complete before using AI suggestions.');
      return;
    }

    setAiLoading(true);
    try {
      const suggestion = await generateFormResponse(selectedQuestion.question, {
        profile: profileData,
        jobDescription: job?.description,
      });

      setResponse(suggestion);
    } catch (error) {
      console.error('AI suggestion failed:', error);
      alert('AI service unavailable. Please try again later.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleCopyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleAddCustomQuestion = () => {
    if (!newQuestion.trim()) return;

    const customQ: FormQuestion = {
      id: `custom-${Date.now()}`,
      question: newQuestion.trim(),
      category: 'custom',
      savedResponse: '',
      lastModified: new Date(),
    };

    setCustomQuestions(prev => [...prev, customQ]);
    setNewQuestion('');
    handleSelectQuestion(customQ);
  };

  // Filter questions
  const filteredQuestions = [...questions, ...customQuestions].filter(q => {
    const matchesSearch = q.question.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || q.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { id: 'all', label: 'All Questions' },
    { id: 'motivation', label: 'Motivation' },
    { id: 'strengths', label: 'Strengths' },
    { id: 'experience', label: 'Experience' },
    { id: 'goals', label: 'Goals' },
    { id: 'custom', label: 'Custom' },
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed inset-4 md:inset-8 z-50 rounded-2xl overflow-hidden flex flex-col"
            style={{
              background: '#FFFFFF',
              border: '1px solid rgba(0,0,0,0.1)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.3)',
              maxHeight: 'calc(100vh - 64px)',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-4 shrink-0"
              style={{ borderBottom: '1px solid rgba(0,0,0,0.1)', background: '#FFFFFF' }}
            >
              <div className="flex items-center gap-3">
                <div>
                  <h2
                    className="text-base font-bold"
                    style={{ color: '#1F2937', fontFamily: 'Syne, sans-serif' }}
                  >
                    Application Form Helper
                  </h2>
                  <p
                    className="text-xs"
                    style={{ color: '#6B7280', fontFamily: 'Manrope, sans-serif' }}
                  >
                    Get help with common application questions
                  </p>
                </div>
              </div>

              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
              {/* Left: Question List */}
              <div
                className="w-full md:w-96 flex flex-col overflow-hidden shrink-0"
                style={{ borderRight: '1px solid rgba(0,0,0,0.1)', background: '#FFFFFF' }}
              >
                {/* Search and Filter */}
                <div className="p-4 space-y-3 shrink-0">
                  <div className="relative">
                    <Search
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
                      style={{ color: '#6B7280' }}
                    />
                    <Input
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search questions..."
                      className="pl-10 h-9 text-sm"
                      style={{
                        background: "#FFFFFF",
                        border: "1px solid rgba(0,0,0,0.1)",
                        color: "#1F2937",
                      }}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {categories.map(cat => (
                      <Badge
                        key={cat.id}
                        variant={filterCategory === cat.id ? 'default' : 'outline'}
                        className="cursor-pointer text-xs"
                        onClick={() => setFilterCategory(cat.id)}
                        style={{
                          background:
                            filterCategory === cat.id ? '#0095FF' : '#FFFFFF',
                          borderColor:
                            filterCategory === cat.id ? '#0095FF' : 'rgba(0,0,0,0.1)',
                          color: filterCategory === cat.id ? '#FFFFFF' : '#374151',
                        }}
                      >
                        {cat.label}
                      </Badge>
                    ))}
                  </div>

                  {/* Add Custom Question */}
                  <div className="flex gap-2">
                    <Input
                      value={newQuestion}
                      onChange={e => setNewQuestion(e.target.value)}
                      placeholder="Add custom question..."
                      className="h-8 text-xs"
                      onKeyPress={e => e.key === 'Enter' && handleAddCustomQuestion()}
                      style={{
                        background: "#FFFFFF",
                        border: "1px solid rgba(0,0,0,0.1)",
                        color: "#1F2937",
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={handleAddCustomQuestion}
                      className="h-8 px-2 bg-[#0095FF] hover:bg-[#0095FF]/90"
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Question List */}
                <div className="flex-1 overflow-y-auto">
                  {filteredQuestions.map(q => (
                    <button
                      key={q.id}
                      onClick={() => handleSelectQuestion(q)}
                      className="w-full text-left px-4 py-3 transition-colors"
                      style={{
                        background:
                          selectedQuestion?.id === q.id
                            ? 'rgba(0,149,255,1)'
                            : 'transparent',
                        borderBottom: '1px solid rgba(0,0,0,0.05)',
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm mb-1" style={{ color: '#1F2937' }}>{q.question}</p>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className="text-xs"
                              style={{
                                borderColor: 'rgba(0,0,0,0.1)',
                                color: '#6B7280',
                              }}
                            >
                              {q.category}
                            </Badge>
                            {q.savedResponse && (
                              <span className="text-xs text-green-600">✓ Saved</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Right: Response Editor */}
              <div className="flex-1 flex flex-col overflow-hidden" style={{ background: '#FFFFFF' }}>
                {selectedQuestion ? (
                  <>
                    <div className="p-6 space-y-4 flex-1 overflow-y-auto">
                      <div>
                        <h3 className="text-base font-semibold mb-2" style={{ color: '#1F2937' }}>
                          {selectedQuestion.question}
                        </h3>
                        {selectedQuestion.characterLimit && (
                          <p className="text-xs" style={{ color: '#6B7280' }}>
                            Recommended limit: {selectedQuestion.characterLimit} characters
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs" style={{ color: '#374151' }}>Your Response</Label>
                          <div className="flex items-center gap-2">
                            {saveStatus === 'saved' && (
                              <span className="text-xs text-green-600">Saved</span>
                            )}
                            {saveStatus === 'saving' && (
                              <span className="text-xs" style={{ color: '#6B7280' }}>Saving...</span>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleAISuggest}
                              disabled={aiLoading}
                              className="h-7 text-xs text-[#0095FF] hover:text-[#0095FF]/80"
                            >
                              {aiLoading ? (
                                <>
                                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                  Generating...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-3 h-3 mr-1" />
                                  AI Suggest
                                </>
                              )}
                            </Button>
                          </div>
                        </div>

                        <Textarea
                          value={response}
                          onChange={e => setResponse(e.target.value)}
                          placeholder="Write your response here..."
                          className="text-sm min-h-[300px]"
                          style={{
                            background: "#FFFFFF",
                            border: "1px solid rgba(0,0,0,0.1)",
                            color: "#1F2937",
                          }}
                        />

                        <div className="flex items-center justify-between text-xs">
                          <span style={{ color: '#6B7280' }}>
                            {response.length} characters
                            {selectedQuestion.characterLimit &&
                              ` / ${selectedQuestion.characterLimit}`}
                          </span>
                          {selectedQuestion.characterLimit &&
                            response.length > selectedQuestion.characterLimit && (
                              <span className="text-red-600">
                                {response.length - selectedQuestion.characterLimit} over limit
                              </span>
                            )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleCopyToClipboard(response, selectedQuestion.id)}
                          disabled={!response}
                          variant="outline"
                          size="sm"
                          className="text-xs"
                        >
                          {copiedId === selectedQuestion.id ? (
                            <>
                              <Check className="w-3 h-3 mr-1" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 mr-1" />
                              Copy to Clipboard
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-sm" style={{ color: '#6B7280' }}>Select a question to get started</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}







