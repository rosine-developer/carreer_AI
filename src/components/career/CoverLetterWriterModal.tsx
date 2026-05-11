import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Save,
  Download,
  Loader2,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import storageManager from '../../lib/storage-manager';
import { generateCoverLetterPDF } from '../../lib/pdf-generator';
import { generateCoverLetter } from '../../lib/ai-content-generator';
import type {
  CoverLetterWriterProps,
  CoverLetterState,
  ProfileData,
  Tone,
} from '../../types/application-helper';

export default function CoverLetterWriterModal({
  isOpen,
  onClose,
  job,
  draftId,
  profileData: initialProfileData,
}: CoverLetterWriterProps) {
  const [coverLetterState, setCoverLetterState] = useState<CoverLetterState | null>(null);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [exportStatus, setExportStatus] = useState<'idle' | 'exporting' | 'success' | 'error'>(
    'idle'
  );
  const [generateStatus, setGenerateStatus] = useState<
    'idle' | 'generating' | 'success' | 'error'
  >('idle');
  const [exportError, setExportError] = useState<string>('');

  // Load profile and draft data
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, draftId]);

  const loadData = async () => {
    try {
      // Load profile data
      const profile = initialProfileData || (await storageManager.loadProfile());
      setProfileData(profile);

      // Load draft or create new cover letter
      if (draftId) {
        const draft = await storageManager.loadDraft(draftId);
        if (draft) {
          setCoverLetterState(draft);
        } else {
          setCoverLetterState(createInitialState(job));
        }
      } else {
        setCoverLetterState(createInitialState(job));
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      setCoverLetterState(createInitialState(job));
    }
  };

  const createInitialState = (jobContext?: any): CoverLetterState => ({
    jobTitle: jobContext?.title || '',
    companyName: jobContext?.company || '',
    jobDescription: jobContext?.description || '',
    tone: 'professional',
    content: {
      opening: '',
      body: [],
      closing: '',
    },
    metadata: {
      draftId: '',
      lastSaved: new Date(),
      name: 'Untitled Cover Letter',
    },
  });

  // Auto-save draft
  useEffect(() => {
    if (coverLetterState && isOpen) {
      const timer = setTimeout(() => {
        handleSaveDraft();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [coverLetterState, isOpen]);

  const handleSaveDraft = async () => {
    if (!coverLetterState) return;

    setSaveStatus('saving');
    try {
      const draftId = await storageManager.saveDraft('coverLetter', coverLetterState);
      setCoverLetterState({
        ...coverLetterState,
        metadata: { ...coverLetterState.metadata, draftId },
      });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to save draft:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleGenerateCoverLetter = async () => {
    if (!coverLetterState || !profileData) {
      alert('Please fill in job details and ensure your profile is complete.');
      return;
    }

    if (!coverLetterState.jobTitle || !coverLetterState.companyName) {
      alert('Please enter job title and company name.');
      return;
    }

    setGenerateStatus('generating');
    try {
      const content = await generateCoverLetter(
        {
          title: coverLetterState.jobTitle,
          company: coverLetterState.companyName,
          description: coverLetterState.jobDescription,
        },
        coverLetterState.tone,
        { profile: profileData }
      );

      setCoverLetterState({
        ...coverLetterState,
        content,
      });

      setGenerateStatus('success');
      setTimeout(() => setGenerateStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to generate cover letter:', error);
      setGenerateStatus('error');
      setTimeout(() => setGenerateStatus('idle'), 3000);
    }
  };

  const handleToneChange = (tone: string) => {
    if (!coverLetterState) return;
    setCoverLetterState({
      ...coverLetterState,
      tone: tone as Tone,
    });
  };

  const handleExportPDF = async () => {
    if (!coverLetterState) return;

    // Validate content
    if (
      !coverLetterState.content.opening ||
      coverLetterState.content.body.length === 0 ||
      !coverLetterState.content.closing
    ) {
      setExportError('Please generate or write your cover letter content before exporting.');
      setExportStatus('error');
      setTimeout(() => {
        setExportStatus('idle');
        setExportError('');
      }, 3000);
      return;
    }

    setExportStatus('exporting');
    try {
      const blob = await generateCoverLetterPDF(coverLetterState);

      // Trigger download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${coverLetterState.companyName.replace(/\s+/g, '-').toLowerCase()}-cover-letter.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportStatus('success');
      setTimeout(() => setExportStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to export PDF:', error);
      setExportError(
        error instanceof Error ? error.message : 'PDF export failed. Please try again.'
      );
      setExportStatus('error');
      setTimeout(() => {
        setExportStatus('idle');
        setExportError('');
      }, 3000);
    }
  };

  const handleClose = () => {
    setCoverLetterState(null);
    onClose();
  };

  if (!isOpen || !coverLetterState) return null;

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
            onClick={handleClose}
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
              maxWidth: '900px',
              margin: 'auto',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-4 shrink-0"
              style={{ borderBottom: '1px solid rgba(0,0,0,0.1)', background: '#F9FAFB' }}
            >
              <div className="flex items-center gap-3">
                <div>
                  <h2
                    className="text-base font-bold"
                    style={{ color: '#1F2937', fontFamily: 'Syne, sans-serif' }}
                  >
                    Cover Letter Writer
                  </h2>
                  <p
                    className="text-xs"
                    style={{ color: '#6B7280', fontFamily: 'Manrope, sans-serif' }}
                  >
                    {coverLetterState.metadata.name}
                    {saveStatus === 'saved' && ' • Saved'}
                    {saveStatus === 'saving' && ' • Saving...'}
                    {saveStatus === 'error' && ' • Save failed'}
                    {exportStatus === 'error' && ` • ${exportError}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveDraft}
                  disabled={saveStatus === 'saving'}
                  className="text-xs"
                >
                  {saveStatus === 'saving' ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-3 h-3 mr-1" />
                      Save
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportPDF}
                  disabled={exportStatus === 'exporting'}
                  className="text-xs bg-[#0095FF] border-[#0095FF] text-white hover:bg-[#0074CC] hover:border-[#0074CC]"
                >
                  {exportStatus === 'exporting' ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Exporting...
                    </>
                  ) : exportStatus === 'success' ? (
                    <>
                      <Download className="w-3 h-3 mr-1" />
                      Exported!
                    </>
                  ) : (
                    <>
                      <Download className="w-3 h-3 mr-1" />
                      Export PDF
                    </>
                  )}
                </Button>
                <Button variant="ghost" size="sm" onClick={handleClose}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6" style={{ background: '#FFFFFF' }}>
              {/* Job Details Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold" style={{ color: '#1F2937' }}>Job Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs mb-1" style={{ color: "#374151" }}>Job Title *</Label>
                    <Input
                      value={coverLetterState.jobTitle}
                      onChange={e =>
                        setCoverLetterState({ ...coverLetterState, jobTitle: e.target.value })
                      }
                      placeholder="Software Engineer Intern"
                      className="h-9 text-sm"
                      style={{
                        background: "#FFFFFF",
                        border: "1px solid rgba(0,0,0,0.1)",
                        color: "#1F2937",
                      }}
                    />
                  </div>

                  <div>
                    <Label className="text-xs mb-1" style={{ color: "#374151" }}>Company Name *</Label>
                    <Input
                      value={coverLetterState.companyName}
                      onChange={e =>
                        setCoverLetterState({ ...coverLetterState, companyName: e.target.value })
                      }
                      placeholder="Tech Company Inc."
                      className="h-9 text-sm"
                      style={{
                        background: "#FFFFFF",
                        border: "1px solid rgba(0,0,0,0.1)",
                        color: "#1F2937",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs mb-1" style={{ color: "#374151" }}>Job Description (optional)</Label>
                  <Textarea
                    value={coverLetterState.jobDescription}
                    onChange={e =>
                      setCoverLetterState({
                        ...coverLetterState,
                        jobDescription: e.target.value,
                      })
                    }
                    placeholder="Paste the job description here to help AI generate a better cover letter..."
                    className="text-sm min-h-[100px]"
                    style={{
                      background: "#FFFFFF",
                      border: "1px solid rgba(0,0,0,0.1)",
                      color: "#1F2937",
                    }}
                  />
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Label className="text-xs mb-1" style={{ color: "#374151" }}>Tone</Label>
                    <Select value={coverLetterState.tone} onValueChange={handleToneChange}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                        <SelectItem value="formal">Formal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="pt-5">
                    <Button
                      onClick={handleGenerateCoverLetter}
                      disabled={generateStatus === 'generating'}
                      className="bg-[#0095FF] hover:bg-[#0095FF]/90 text-white"
                    >
                      {generateStatus === 'generating' ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generate with AI
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Cover Letter Content Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold" style={{ color: '#1F2937' }}>Cover Letter Content</h3>
                  {(coverLetterState.content.opening ||
                    coverLetterState.content.body.length > 0) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleGenerateCoverLetter}
                      className="text-xs text-[#0095FF]"
                    >
                      <RotateCcw className="w-3 h-3 mr-1" />
                      Regenerate
                    </Button>
                  )}
                </div>

                <div>
                  <Label className="text-xs mb-1" style={{ color: "#374151" }}>Opening Paragraph</Label>
                  <Textarea
                    value={coverLetterState.content.opening}
                    onChange={e =>
                      setCoverLetterState({
                        ...coverLetterState,
                        content: { ...coverLetterState.content, opening: e.target.value },
                      })
                    }
                    placeholder="I am writing to express my interest in..."
                    className="text-sm min-h-[80px]"
                    style={{
                      background: "#FFFFFF",
                      border: "1px solid rgba(0,0,0,0.1)",
                      color: "#1F2937",
                    }}
                  />
                </div>

                <div>
                  <Label className="text-xs mb-1" style={{ color: "#374151" }}>Body Paragraphs</Label>
                  {coverLetterState.content.body.map((paragraph, index) => (
                    <div key={index} className="mb-3">
                      <Textarea
                        value={paragraph}
                        onChange={e => {
                          const newBody = [...coverLetterState.content.body];
                          newBody[index] = e.target.value;
                          setCoverLetterState({
                            ...coverLetterState,
                            content: { ...coverLetterState.content, body: newBody },
                          });
                        }}
                        placeholder={`Paragraph ${index + 1}`}
                        className="text-sm min-h-[100px]"
                        style={{
                          background: "#FFFFFF",
                          border: "1px solid rgba(0,0,0,0.1)",
                          color: "#1F2937",
                        }}
                      />
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCoverLetterState({
                        ...coverLetterState,
                        content: {
                          ...coverLetterState.content,
                          body: [...coverLetterState.content.body, ''],
                        },
                      })
                    }
                    className="text-xs"
                  >
                    Add Paragraph
                  </Button>
                </div>

                <div>
                  <Label className="text-xs mb-1" style={{ color: "#374151" }}>Closing Paragraph</Label>
                  <Textarea
                    value={coverLetterState.content.closing}
                    onChange={e =>
                      setCoverLetterState({
                        ...coverLetterState,
                        content: { ...coverLetterState.content, closing: e.target.value },
                      })
                    }
                    placeholder="Thank you for considering my application..."
                    className="text-sm min-h-[80px]"
                    style={{
                      background: "#FFFFFF",
                      border: "1px solid rgba(0,0,0,0.1)",
                      color: "#1F2937",
                    }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}



