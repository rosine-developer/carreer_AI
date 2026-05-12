import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import {
  X,
  Save,
  Download,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Loader2,
  FileText,
  Sparkles,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import storageManager from '../../lib/storage-manager';
import { generateResumePDF, validateATSCompatibility } from '../../lib/pdf-generator';
import { generateResumeSection } from '../../lib/ai-content-generator';
import {
  resumeTemplates,
  colorSchemes,
  fontPairings,
  createInitialResumeState,
} from '../../lib/resume-templates';
import type {
  ResumeBuilderProps,
  ResumeState,
  ResumeSection,
  ProfileData,
} from '../../types/application-helper';

export default function ResumeBuilderModal({
  isOpen,
  onClose,
  job,
  draftId,
  profileData: initialProfileData,
}: ResumeBuilderProps) {
  const [resumeState, setResumeState] = useState<ResumeState | null>(null);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [exportStatus, setExportStatus] = useState<'idle' | 'exporting' | 'success' | 'error'>('idle');
  const [exportError, setExportError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

      // Load draft or create new resume
      if (draftId) {
        const draft = await storageManager.loadDraft(draftId);
        if (draft) {
          setResumeState(draft);
        } else {
          setResumeState(createInitialResumeState(profile));
        }
      } else {
        setResumeState(createInitialResumeState(profile));
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      setResumeState(createInitialResumeState(null));
    }
  };

  // Auto-save draft
  useEffect(() => {
    if (resumeState && isOpen) {
      const timer = setTimeout(() => {
        handleSaveDraft();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [resumeState, isOpen]);

  const handleSaveDraft = async () => {
    if (!resumeState) return;

    setSaveStatus('saving');
    try {
      const draftId = await storageManager.saveDraft('resume', resumeState);
      setResumeState({
        ...resumeState,
        metadata: { ...resumeState.metadata, draftId },
      });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to save draft:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleTemplateChange = (templateId: string) => {
    if (!resumeState) return;
    setResumeState({
      ...resumeState,
      template: templateId as 'modern' | 'classic' | 'minimal',
    });
  };

  const handleColorSchemeChange = (colorSchemeId: string) => {
    if (!resumeState) return;
    setResumeState({
      ...resumeState,
      colorScheme: colorSchemeId as 'blue' | 'orange' | 'neutral',
    });
  };

  const handleFontPairingChange = (fontPairingId: string) => {
    if (!resumeState) return;
    setResumeState({
      ...resumeState,
      fontPairing: fontPairingId as 'professional' | 'modern',
    });
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !resumeState) return;

    const sections = Array.from(resumeState.sections);
    const [removed] = sections.splice(result.source.index, 1);
    sections.splice(result.destination.index, 0, removed);

    // Update order
    const updatedSections = sections.map((section, index) => ({
      ...section,
      order: index,
    }));

    setResumeState({ ...resumeState, sections: updatedSections });
  };

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    if (!resumeState) return;

    const sections = Array.from(resumeState.sections);
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    if (newIndex < 0 || newIndex >= sections.length) return;

    const [removed] = sections.splice(index, 1);
    sections.splice(newIndex, 0, removed);

    const updatedSections = sections.map((section, idx) => ({
      ...section,
      order: idx,
    }));

    setResumeState({ ...resumeState, sections: updatedSections });
  };

  const handleToggleSectionVisibility = (sectionId: string) => {
    if (!resumeState) return;

    const updatedSections = resumeState.sections.map(section =>
      section.id === sectionId ? { ...section, visible: !section.visible } : section
    );

    setResumeState({ ...resumeState, sections: updatedSections });
  };

  const handleUpdateSectionContent = (sectionId: string, content: any) => {
    if (!resumeState) return;

    const updatedSections = resumeState.sections.map(section =>
      section.id === sectionId ? { ...section, content } : section
    );

    setResumeState({ ...resumeState, sections: updatedSections });
  };

  const handleExportPDF = async () => {
    if (!resumeState) return;

    // Validate required fields
    const personalSection = resumeState.sections.find(s => s.type === 'personal');
    if (!personalSection?.content?.fullName || !personalSection?.content?.email) {
      setExportError('Please fill in your name and email before exporting.');
      setExportStatus('error');
      setTimeout(() => {
        setExportStatus('idle');
        setExportError('');
      }, 3000);
      return;
    }

    // Validate ATS compatibility
    const validation = validateATSCompatibility(resumeState);
    if (!validation.isCompatible) {
      const proceed = window.confirm(
        `ATS Compatibility Warning:\n\n${validation.warnings.join('\n')}\n\nDo you want to proceed with export?`
      );
      if (!proceed) return;
    }

    setExportStatus('exporting');
    try {
      const blob = await generateResumePDF(resumeState);

      // Trigger download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${resumeState.metadata.name.replace(/\s+/g, '-').toLowerCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportStatus('success');
      setTimeout(() => setExportStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to export PDF:', error);
      setExportError(error instanceof Error ? error.message : 'PDF export failed. Please try again.');
      setExportStatus('error');
      setTimeout(() => {
        setExportStatus('idle');
        setExportError('');
      }, 3000);
    }
  };

  const handleClose = () => {
    setResumeState(null);
    onClose();
  };

  if (!isOpen || !resumeState) return null;

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
                    Resume Builder
                  </h2>
                  <p
                    className="text-xs"
                    style={{ color: '#6B7280', fontFamily: 'Manrope, sans-serif' }}
                  >
                    {resumeState.metadata.name}
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

            {/* Mobile: Tabs for Edit/Preview */}
            {isMobile && (
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'edit' | 'preview')}>
                <TabsList className="w-full rounded-none border-b" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
                  <TabsTrigger value="edit" className="flex-1">
                    Edit
                  </TabsTrigger>
                  <TabsTrigger value="preview" className="flex-1">
                    Preview
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            )}

            {/* Content */}
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
              {/* Left: Editor (always visible on desktop, tab on mobile) */}
              {(!isMobile || activeTab === 'edit') && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Template Controls */}
                  <div
                    className="px-5 py-4 shrink-0 space-y-3"
                    style={{ borderBottom: '1px solid rgba(0,0,0,0.1)', background: '#FFFFFF' }}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs mb-1" style={{ color: '#374151' }}>Template</Label>
                        <Select value={resumeState.template} onValueChange={handleTemplateChange}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {resumeTemplates.map(template => (
                              <SelectItem key={template.id} value={template.id} className="text-xs">
                                {template.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-xs mb-1" style={{ color: '#374151' }}>Color Scheme</Label>
                        <Select
                          value={resumeState.colorScheme}
                          onValueChange={handleColorSchemeChange}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {colorSchemes.map(scheme => (
                              <SelectItem key={scheme.id} value={scheme.id} className="text-xs">
                                {scheme.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-xs mb-1" style={{ color: '#374151' }}>Font Pairing</Label>
                        <Select
                          value={resumeState.fontPairing}
                          onValueChange={handleFontPairingChange}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {fontPairings.map(pairing => (
                              <SelectItem key={pairing.id} value={pairing.id} className="text-xs">
                                {pairing.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Sections Editor */}
                  <div className="flex-1 overflow-y-auto p-5">
                    <DragDropContext onDragEnd={handleDragEnd}>
                      <Droppable droppableId="resume-sections">
                        {(provided) => (
                          <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                            {resumeState.sections.map((section, index) => (
                              <Draggable key={section.id} draggableId={section.id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className="rounded-lg border p-4"
                                    style={{
                                      ...provided.draggableProps.style,
                                      opacity: section.visible ? 1 : 0.5,
                                      borderColor: 'rgba(0,0,0,0.1)',
                                      background: '#FFFFFF',
                                    }}
                                  >
                                    {/* Section Header */}
                                    <div className="flex items-center justify-between mb-3">
                                      <div className="flex items-center gap-2">
                                        <div {...provided.dragHandleProps} className="cursor-grab">
                                          <FileText className="w-4 h-4" style={{ color: '#6B7280' }} />
                                        </div>
                                        <h3 className="text-sm font-semibold" style={{ color: '#1F2937' }}>
                                          {section.title}
                                        </h3>
                                      </div>

                                      <div className="flex items-center gap-1">
                                        {/* Move buttons (keyboard alternative) */}
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleMoveSection(index, 'up')}
                                          disabled={index === 0}
                                          className="h-6 w-6 p-0"
                                        >
                                          <ChevronUp className="w-3 h-3" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleMoveSection(index, 'down')}
                                          disabled={index === resumeState.sections.length - 1}
                                          className="h-6 w-6 p-0"
                                        >
                                          <ChevronDown className="w-3 h-3" />
                                        </Button>

                                        {/* Visibility toggle */}
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleToggleSectionVisibility(section.id)}
                                          className="h-6 w-6 p-0"
                                        >
                                          {section.visible ? (
                                            <Eye className="w-3 h-3" />
                                          ) : (
                                            <EyeOff className="w-3 h-3" />
                                          )}
                                        </Button>
                                      </div>
                                    </div>

                                    {/* Section Content Editor */}
                                    {section.visible && (
                                      <ResumeSectionEditor
                                        section={section}
                                        profileData={profileData}
                                        onUpdate={(content) =>
                                          handleUpdateSectionContent(section.id, content)
                                        }
                                      />
                                    )}
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                  </div>
                </div>
              )}

              {/* Right: Preview (always visible on desktop, tab on mobile) */}
              {(!isMobile || activeTab === 'preview') && (
                <div
                  className="w-full md:w-96 lg:w-[500px] flex flex-col overflow-hidden shrink-0"
                  style={{ borderLeft: '1px solid rgba(0,0,0,0.1)' }}
                >
                  <div
                    className="px-5 py-3 flex items-center gap-2 shrink-0"
                    style={{ borderBottom: '1px solid rgba(0,0,0,0.1)', background: '#FFFFFF' }}
                  >
                    <Eye size={13} style={{ color: '#0095FF' }} />
                    <span className="text-xs font-mono" style={{ color: '#0095FF' }}>
                      LIVE PREVIEW
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-5" style={{ background: '#FFFFFF' }}>
                    <ResumePreview resumeState={resumeState} />
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Section Editor Component
function ResumeSectionEditor({
  section,
  profileData,
  onUpdate,
}: {
  section: ResumeSection;
  profileData: ProfileData | null;
  onUpdate: (content: any) => void;
}) {
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  const handleAISuggest = async () => {
    if (!profileData) {
      setAiError('Please fill out your profile first');
      setTimeout(() => setAiError(''), 3000);
      return;
    }

    setAiLoading(true);
    setAiError('');

    try {
      const content = await generateResumeSection(section.type, {
        profile: profileData,
        existingContent: JSON.stringify(section.content),
      });

      // Parse and apply the suggestion based on section type
      if (section.type === 'skills') {
        const skills = content.split(',').map(s => s.trim()).filter(Boolean);
        onUpdate(skills);
      } else if (section.type === 'achievements') {
        const achievements = content.split('\n').filter(Boolean);
        onUpdate(achievements);
      } else {
        // For other types, just show the suggestion
        alert(`AI Suggestion:\n\n${content}\n\nYou can copy and paste this into your resume.`);
      }
    } catch (error) {
      console.error('AI suggestion failed:', error);
      setAiError('AI service unavailable. Using template suggestions.');
      setTimeout(() => setAiError(''), 3000);
    } finally {
      setAiLoading(false);
    }
  };

  switch (section.type) {
    case 'personal':
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs" style={{ color: '#374151' }}>Full Name</Label>
              <Input
                value={section.content.fullName || ''}
                onChange={(e) => onUpdate({ ...section.content, fullName: e.target.value })}
                placeholder="John Doe"
                className="h-8 text-xs mt-1"
              />
            </div>
            <div>
              <Label className="text-xs" style={{ color: '#374151' }}>Email</Label>
              <Input
                value={section.content.email || ''}
                onChange={(e) => onUpdate({ ...section.content, email: e.target.value })}
                placeholder="john@example.com"
                className="h-8 text-xs mt-1"
              />
            </div>
            <div>
              <Label className="text-xs" style={{ color: '#374151' }}>Phone</Label>
              <Input
                value={section.content.phone || ''}
                onChange={(e) => onUpdate({ ...section.content, phone: e.target.value })}
                placeholder="+1 (555) 123-4567"
                className="h-8 text-xs mt-1"
              />
            </div>
            <div>
              <Label className="text-xs" style={{ color: '#374151' }}>Location</Label>
              <Input
                value={section.content.location || ''}
                onChange={(e) => onUpdate({ ...section.content, location: e.target.value })}
                placeholder="New York, NY"
                className="h-8 text-xs mt-1"
              />
            </div>
          </div>
        </div>
      );

    case 'skills':
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs" style={{ color: '#374151' }}>Skills (comma-separated)</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAISuggest}
              disabled={aiLoading}
              className="h-6 text-xs text-[#0095FF] hover:text-[#0095FF]/80"
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
          <Textarea
            value={Array.isArray(section.content) ? section.content.join(', ') : ''}
            onChange={(e) => {
              const skills = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
              onUpdate(skills);
            }}
            placeholder="JavaScript, React, TypeScript, Node.js"
            className="text-xs min-h-[80px]"
          />
          {aiError && <p className="text-xs text-red-500">{aiError}</p>}
        </div>
      );

    case 'achievements':
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs" style={{ color: '#374151' }}>Achievements (one per line)</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAISuggest}
              disabled={aiLoading}
              className="h-6 text-xs text-[#0095FF] hover:text-[#0095FF]/80"
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
          <Textarea
            value={Array.isArray(section.content) ? section.content.join('\n') : ''}
            onChange={(e) => {
              const achievements = e.target.value.split('\n').filter(Boolean);
              onUpdate(achievements);
            }}
            placeholder="Won first place in hackathon&#10;Published research paper&#10;Led team of 5 students"
            className="text-xs min-h-[120px]"
          />
          {aiError && <p className="text-xs text-red-500">{aiError}</p>}
        </div>
      );

    case 'education':
      return (
        <div className="space-y-3">
          {Array.isArray(section.content) && section.content.map((edu: any, index: number) => (
            <div key={edu.id || index} className="p-3 rounded-lg border" style={{ borderColor: 'rgba(0,0,0,0.1)', background: '#FFFFFF' }}>
              <div className="flex items-start justify-between mb-2">
                <Label className="text-xs font-semibold" style={{ color: '#1F2937' }}>Education Entry {index + 1}</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const updated = section.content.filter((_: any, i: number) => i !== index);
                    onUpdate(updated);
                  }}
                  className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
              <div className="space-y-2">
                <div>
                  <Label className="text-xs" style={{ color: '#374151' }}>School Name</Label>
                  <Input
                    value={edu.schoolName || ''}
                    onChange={(e) => {
                      const updated = [...section.content];
                      updated[index] = { ...edu, schoolName: e.target.value };
                      onUpdate(updated);
                    }}
                    placeholder="University Name"
                    className="h-8 text-xs mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs" style={{ color: '#374151' }}>Degree</Label>
                    <Input
                      value={edu.degree || ''}
                      onChange={(e) => {
                        const updated = [...section.content];
                        updated[index] = { ...edu, degree: e.target.value };
                        onUpdate(updated);
                      }}
                      placeholder="Bachelor's"
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs" style={{ color: '#374151' }}>Field of Study</Label>
                    <Input
                      value={edu.fieldOfStudy || ''}
                      onChange={(e) => {
                        const updated = [...section.content];
                        updated[index] = { ...edu, fieldOfStudy: e.target.value };
                        onUpdate(updated);
                      }}
                      placeholder="Computer Science"
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs" style={{ color: '#374151' }}>Start Date</Label>
                    <Input
                      type="month"
                      value={edu.startDate || ''}
                      onChange={(e) => {
                        const updated = [...section.content];
                        updated[index] = { ...edu, startDate: e.target.value };
                        onUpdate(updated);
                      }}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs" style={{ color: '#374151' }}>End Date</Label>
                    <Input
                      type="month"
                      value={edu.endDate || ''}
                      onChange={(e) => {
                        const updated = [...section.content];
                        updated[index] = { ...edu, endDate: e.target.value };
                        onUpdate(updated);
                      }}
                      placeholder="Present"
                      className="h-8 text-xs mt-1"
                      disabled={edu.current}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`current-${index}`}
                    checked={edu.current || false}
                    onChange={(e) => {
                      const updated = [...section.content];
                      updated[index] = { ...edu, current: e.target.checked };
                      onUpdate(updated);
                    }}
                    className="w-4 h-4"
                  />
                  <Label htmlFor={`current-${index}`} className="text-xs" style={{ color: '#374151' }}>
                    Currently studying here
                  </Label>
                </div>
              </div>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const newEntry = {
                id: `edu-${Date.now()}`,
                schoolName: '',
                degree: '',
                fieldOfStudy: '',
                startDate: '',
                endDate: '',
                current: false,
                achievements: [],
              };
              onUpdate([...(Array.isArray(section.content) ? section.content : []), newEntry]);
            }}
            className="w-full text-xs"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Education
          </Button>
        </div>
      );

    case 'experience':
      return (
        <div className="space-y-3">
          {Array.isArray(section.content) && section.content.map((exp: any, index: number) => (
            <div key={exp.id || index} className="p-3 rounded-lg border" style={{ borderColor: 'rgba(0,0,0,0.1)', background: '#FFFFFF' }}>
              <div className="flex items-start justify-between mb-2">
                <Label className="text-xs font-semibold" style={{ color: '#1F2937' }}>Experience Entry {index + 1}</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const updated = section.content.filter((_: any, i: number) => i !== index);
                    onUpdate(updated);
                  }}
                  className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
              <div className="space-y-2">
                <div>
                  <Label className="text-xs" style={{ color: '#374151' }}>Organization Name</Label>
                  <Input
                    value={exp.organizationName || ''}
                    onChange={(e) => {
                      const updated = [...section.content];
                      updated[index] = { ...exp, organizationName: e.target.value };
                      onUpdate(updated);
                    }}
                    placeholder="Company Name"
                    className="h-8 text-xs mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs" style={{ color: '#374151' }}>Role</Label>
                  <Input
                    value={exp.role || ''}
                    onChange={(e) => {
                      const updated = [...section.content];
                      updated[index] = { ...exp, role: e.target.value };
                      onUpdate(updated);
                    }}
                    placeholder="Software Engineer Intern"
                    className="h-8 text-xs mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs" style={{ color: '#374151' }}>Start Date</Label>
                    <Input
                      type="month"
                      value={exp.startDate || ''}
                      onChange={(e) => {
                        const updated = [...section.content];
                        updated[index] = { ...exp, startDate: e.target.value };
                        onUpdate(updated);
                      }}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs" style={{ color: '#374151' }}>End Date</Label>
                    <Input
                      type="month"
                      value={exp.endDate || ''}
                      onChange={(e) => {
                        const updated = [...section.content];
                        updated[index] = { ...exp, endDate: e.target.value };
                        onUpdate(updated);
                      }}
                      placeholder="Present"
                      className="h-8 text-xs mt-1"
                      disabled={exp.current}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`exp-current-${index}`}
                    checked={exp.current || false}
                    onChange={(e) => {
                      const updated = [...section.content];
                      updated[index] = { ...exp, current: e.target.checked };
                      onUpdate(updated);
                    }}
                    className="w-4 h-4"
                  />
                  <Label htmlFor={`exp-current-${index}`} className="text-xs" style={{ color: '#374151' }}>
                    Currently working here
                  </Label>
                </div>
                <div>
                  <Label className="text-xs" style={{ color: '#374151' }}>Responsibilities (one per line)</Label>
                  <Textarea
                    value={Array.isArray(exp.responsibilities) ? exp.responsibilities.join('\n') : ''}
                    onChange={(e) => {
                      const updated = [...section.content];
                      const responsibilities = e.target.value.split('\n').filter(Boolean);
                      updated[index] = { ...exp, responsibilities };
                      onUpdate(updated);
                    }}
                    placeholder="Developed web applications&#10;Collaborated with team&#10;Improved performance by 30%"
                    className="text-xs min-h-[80px] mt-1"
                  />
                </div>
              </div>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const newEntry = {
                id: `exp-${Date.now()}`,
                organizationName: '',
                role: '',
                startDate: '',
                endDate: '',
                current: false,
                responsibilities: [],
              };
              onUpdate([...(Array.isArray(section.content) ? section.content : []), newEntry]);
            }}
            className="w-full text-xs"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Experience
          </Button>
        </div>
      );

    default:
      return (
        <div className="text-xs" style={{ color: '#6B7280' }}>
          Section editor for {section.type} coming soon...
        </div>
      );
  }
}

// Preview Component
function ResumePreview({ resumeState }: { resumeState: ResumeState }) {
  const colorScheme = colorSchemes.find(s => s.id === resumeState.colorScheme);
  const fontPairing = fontPairings.find(f => f.id === resumeState.fontPairing);

  return (
    <div
      className="bg-white rounded-lg shadow-lg p-8 min-h-[800px]"
      style={{
        fontFamily: fontPairing?.body || 'Arial',
        color: colorScheme?.text || '#1F2937',
      }}
    >
      {resumeState.sections
        .filter(s => s.visible)
        .sort((a, b) => a.order - b.order)
        .map(section => (
          <div key={section.id} className="mb-6">
            <h2
              className="text-lg font-bold mb-3 pb-2 border-b-2"
              style={{
                fontFamily: fontPairing?.heading || 'Arial',
                color: colorScheme?.primary || '#0095FF',
                borderColor: colorScheme?.primary || '#0095FF',
              }}
            >
              {section.title}
            </h2>

            {section.type === 'personal' && (
              <div className="space-y-1 text-sm">
                <div className="font-bold text-2xl mb-2">{section.content.fullName}</div>
                <div>{section.content.email}</div>
                <div>{section.content.phone}</div>
                <div>{section.content.location}</div>
              </div>
            )}

            {section.type === 'skills' && Array.isArray(section.content) && (
              <div className="flex flex-wrap gap-2">
                {section.content.map((skill: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded text-sm"
                    style={{
                      background: `${colorScheme?.primary}15`,
                      color: colorScheme?.primary,
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}

            {section.type === 'achievements' && Array.isArray(section.content) && (
              <ul className="list-disc list-inside space-y-1 text-sm">
                {section.content.map((achievement: string, idx: number) => (
                  <li key={idx}>{achievement}</li>
                ))}
              </ul>
            )}

            {section.type === 'education' && Array.isArray(section.content) && (
              <div className="space-y-3">
                {section.content.map((edu: any, idx: number) => (
                  <div key={idx}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold text-sm">{edu.degree} {edu.fieldOfStudy && `in ${edu.fieldOfStudy}`}</div>
                        <div className="text-sm">{edu.schoolName}</div>
                      </div>
                      <div className="text-xs text-gray-600">
                        {edu.startDate && new Date(edu.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
                        {' - '}
                        {edu.current ? 'Present' : edu.endDate ? new Date(edu.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : ''}
                      </div>
                    </div>
                    {edu.achievements && edu.achievements.length > 0 && (
                      <ul className="list-disc list-inside mt-1 text-sm">
                        {edu.achievements.map((achievement: string, i: number) => (
                          <li key={i}>{achievement}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}

            {section.type === 'experience' && Array.isArray(section.content) && (
              <div className="space-y-3">
                {section.content.map((exp: any, idx: number) => (
                  <div key={idx}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold text-sm">{exp.role}</div>
                        <div className="text-sm">{exp.organizationName}</div>
                      </div>
                      <div className="text-xs text-gray-600">
                        {exp.startDate && new Date(exp.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
                        {' - '}
                        {exp.current ? 'Present' : exp.endDate ? new Date(exp.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : ''}
                      </div>
                    </div>
                    {exp.responsibilities && exp.responsibilities.length > 0 && (
                      <ul className="list-disc list-inside mt-1 text-sm">
                        {exp.responsibilities.map((resp: string, i: number) => (
                          <li key={i}>{resp}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
    </div>
  );
}







